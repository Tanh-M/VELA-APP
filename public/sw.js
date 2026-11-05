// Service Worker : programme qui tourne en arrière-plan dans le navigateur,
// même quand l'onglet Vela n'est pas ouvert. C'est lui qui reçoit et affiche
// les notifications push envoyées par le serveur.

// AJOUT : une nouvelle version du service worker s'active tout de suite,
// sans attendre que toutes les fenêtres de Vela soient fermées
// (important sur iPhone, où l'application reste en veille au lieu de se fermer)
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// AJOUT : transforme l'adresse reçue dans la notification en chemin sûr de Vela.
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
    // CHANGEMENT : l'adresse est vérifiée (safePath) ; l'adresse de secours dépend du type
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
      // on le ramène devant et on lui envoie un message "va sur cette page".
      // CHANGEMENT : plus de client.navigate(), mal géré sur iPhone
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