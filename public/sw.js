// Service Worker : programme qui tourne en arrière-plan dans le navigateur.
// Il a deux rôles :
//  1) afficher les notifications push envoyées par le serveur, même quand Vela est fermé ;
//  2) garder une copie de l'application pour qu'elle s'ouvre SANS connexion.

// ===== Réglages de la mémoire (cache) =====
// Changer VERSION efface toutes les anciennes copies au prochain démarrage.
const VERSION = 'v1';
const PAGES = `vela-pages-${VERSION}`;   // la page de l'application (index.html)
const ASSETS = `vela-assets-${VERSION}`; // fichiers de l'application (leur nom change à chaque version)
const STATIC = `vela-static-${VERSION}`; // images, icônes, manifeste
const KEEP = [PAGES, ASSETS, STATIC];
const MAX_ASSETS = 80; // nombre maximum de fichiers /assets/ gardés

// Serveur de développement de Vite (npm run dev) : on ne met RIEN en cache,
// sinon on verrait d'anciennes versions du code pendant le développement.
const IS_VITE_DEV = self.location.port === '5173';

// ===== Installation : une nouvelle version s'active tout de suite =====
self.addEventListener('install', (event) => {
  self.skipWaiting();
  if (IS_VITE_DEV) return;

  // Pendant l'installation, on garde déjà une copie de la page et de ses fichiers
  event.waitUntil(precacheShell().catch(() => {}));
});

// ===== Activation : on supprime les anciennes copies et on prend le contrôle =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith('vela-') && !KEEP.includes(name))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

// Garde une copie de la page d'accueil de l'application et des fichiers qu'elle utilise
async function precacheShell() {
  const pages = await caches.open(PAGES);

  // "/" renvoie la page de l'application (toutes les adresses de Vela renvoient la même page)
  const response = await fetch('/', { cache: 'reload' });
  if (!response.ok) return;

  const html = await response.clone().text();
  await pages.put('/index.html', response);

  // Fichiers JavaScript et CSS cités dans la page
  const assets = await caches.open(ASSETS);
  const urls = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1]);
  await Promise.all(
    urls.map(async (url) => {
      try {
        const file = await fetch(url);
        if (file.ok) await assets.put(url, file);
      } catch {
        // Un fichier manquant n'empêche pas les autres
      }
    })
  );

  // Fichiers indispensables à l'installation de l'application
  const statics = await caches.open(STATIC);
  const essentials = ['/manifest.json', '/favicon.svg', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png'];
  await Promise.all(
    essentials.map(async (url) => {
      try {
        const file = await fetch(url);
        if (file.ok) await statics.put(url, file);
      } catch {
        // idem
      }
    })
  );
}

// ===== Les trois façons de répondre =====

// Attend la réponse du réseau, mais abandonne après "ms" millisecondes
function fetchWithTimeout(request, ms) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

// Page de l'application : RÉSEAU D'ABORD, sinon la copie
async function handleNavigation(event) {
  const cache = await caches.open(PAGES);
  const cached = await cache.match('/index.html');

  try {
    // Connexion lente : si on a une copie, on l'utilise après 4 secondes d'attente
    const response = await (cached ? fetchWithTimeout(event.request, 4000) : fetch(event.request));

    // On mémorise la page uniquement si c'est bien une page web
    const type = response.headers.get('content-type') || '';
    if (response.ok && type.includes('text/html')) {
      event.waitUntil(cache.put('/index.html', response.clone()));
    }
    return response;
  } catch {
    // Pas de réseau : on sert la copie de la page
    if (cached) return cached;
    return new Response('Vela est hors connexion. Ouvrez-le une première fois avec Internet.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

// Fichiers /assets/ : COPIE D'ABORD (leur nom change à chaque version, ils ne périment jamais)
async function cacheFirst(event, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(event.request);
  if (cached) return cached;

  const response = await fetch(event.request);
  if (response && response.ok) {
    event.waitUntil(
      cache.put(event.request, response.clone()).then(async () => {
        // On garde au plus "maxEntries" fichiers : les plus anciens sont supprimés
        const keys = await cache.keys();
        for (let i = 0; i < keys.length - maxEntries; i++) {
          await cache.delete(keys[i]);
        }
      })
    );
  }
  return response;
}

// Images, icônes, manifeste : COPIE TOUT DE SUITE, mise à jour en arrière-plan
async function staleWhileRevalidate(event, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(event.request);

  const network = fetch(event.request)
    .then((response) => {
      if (response && response.ok) cache.put(event.request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(network);
    return cached;
  }

  const response = await network;
  return response || new Response('', { status: 504 });
}

// ===== Interception des demandes =====
self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (IS_VITE_DEV || request.method !== 'GET') return;

  const url = new URL(request.url);

  // Les autres sites (Supabase, etc.) ne sont JAMAIS interceptés
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/sw.js') return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event));
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(event, ASSETS, MAX_ASSETS));
    return;
  }

  event.respondWith(staleWhileRevalidate(event, STATIC));
});

// ===== Message de l'application : "garde une copie de ce que la page vient de charger" =====
// Sert à mémoriser images, polices, etc. dès la première visite
self.addEventListener('message', (event) => {
  const message = event.data;
  if (IS_VITE_DEV || !message || message.type !== 'CACHE_URLS' || !Array.isArray(message.urls)) return;

  event.waitUntil(
    (async () => {
      const assets = await caches.open(ASSETS);
      const statics = await caches.open(STATIC);

      await Promise.all(
        message.urls.map(async (raw) => {
          try {
            const url = new URL(raw, self.location.origin);
            if (url.origin !== self.location.origin || url.pathname === '/sw.js') return;

            const response = await fetch(url.href);
            if (!response.ok) return;

            const target = url.pathname.startsWith('/assets/') ? assets : statics;
            await target.put(url.href, response);
          } catch {
            // Un fichier qui échoue n'empêche pas les autres
          }
        })
      );
    })()
  );
});

// ===== Notifications push =====

// Transforme l'adresse reçue dans la notification en chemin sûr de Vela.
// Si elle est absente ou pointe ailleurs (autre site), on utilise l'adresse de secours.
function safePath(rawUrl, fallback) {
  try {
    const url = new URL(rawUrl || fallback, self.location.origin);
    if (url.origin !== self.location.origin) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

// Écoute l'événement "push" : déclenché quand une notification arrive
self.addEventListener('push', (event) => {
  // Lecture sécurisée du contenu (si le message est mal formé, on utilise des valeurs par défaut)
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || 'Vela';

  // Deux types de notifications, reconnaissables à leur icône :
  //  - "faq"   : la réponse à une question posée dans la FAQ (icône BLEUE avec un "?")
  //  - "alert" : une alerte d'un détecteur (icône ROUGE)
  // On reconnaît une notification FAQ soit grâce au champ "kind" envoyé par le serveur,
  // soit grâce à son titre ("Votre question a trouvé réponse")
  const isFaq = data.kind === 'faq' || /question/i.test(title);

  const options = {
    body: data.body || (isFaq ? 'Consultez la réponse dans la FAQ.' : 'Nouvelle alerte détectée.'),
    icon: isFaq ? '/notif-faq.png' : '/notif-alert.png',
    badge: '/notif-badge.png',
    // Page à ouvrir au clic : la FAQ pour une réponse, les alertes sinon
    data: { url: safePath(data.url, isFaq ? '/faq' : '/alerts') },
  };

  // Les réponses FAQ se remplacent entre elles (pas de pile de notifications identiques)
  if (isFaq) options.tag = 'vela-faq';

  // Un petit emoji devant le titre aide à reconnaître le type de notification d'un coup d'oeil,
  // y compris sur iPhone où l'icône affichée est celle de l'application :
  //  💬 = réponse à une question de la FAQ, 🚨 = alerte d'un détecteur
  const shownTitle = (isFaq ? '💬 ' : '🚨 ') + title;

  event.waitUntil(self.registration.showNotification(shownTitle, options));
});

// Gère le clic sur une notification : ouvre la bonne page de l'application
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const path = safePath(event.notification.data && event.notification.data.url, '/alerts');

  event.waitUntil(
    (async () => {
      const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });

      // Si Vela est déjà ouvert (au premier plan ou en veille) :
      // on le ramène devant et on lui envoie un message "va sur cette page"
      if (windowClients.length > 0) {
        const client = windowClients[0];
        try {
          await client.focus();
        } catch {
          // Si le focus est refusé, on continue quand même avec le message
        }
        client.postMessage({ type: 'vela-navigate', url: path });
        return;
      }

      // Sinon (application fermée), on ouvre une nouvelle fenêtre directement sur la bonne page
      await clients.openWindow(new URL(path, self.location.origin).href);
    })().catch(() => clients.openWindow(path))
  );
});