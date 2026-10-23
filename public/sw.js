// Service Worker : programme qui tourne en arrière-plan dans le navigateur,
// même quand l'onglet Vela n'est pas ouvert. C'est lui qui reçoit et affiche
// les notifications push envoyées par le serveur.

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
    data: { url: data.url || (isFaq ? '/faq' : '/alerts') },
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

  const url = (event.notification.data && event.notification.data.url) || '/alerts';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Si Vela est déjà ouvert : on le ramène au premier plan sur la bonne page
        for (const client of windowClients) {
          if ('navigate' in client && 'focus' in client) {
            return client.navigate(url).then((c) => (c ? c.focus() : undefined));
          }
        }
        // Sinon on ouvre une nouvelle fenêtre
        return clients.openWindow(url);
      })
      .catch(() => clients.openWindow(url))
  );
});