// Service Worker : programme qui tourne en arrière-plan dans le navigateur,
// même quand l'onglet Vela n'est pas ouvert. C'est lui qui reçoit et affiche
// les notifications push envoyées par le serveur.

// Écoute l'événement "push" : déclenché quand une notification arrive
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'Vela';
  const options = {
    body: data.body || 'Nouvelle alerte détectée.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Gère le clic sur une notification : ouvre (ou remet au premier plan) l'application
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/alerts')
  );
});