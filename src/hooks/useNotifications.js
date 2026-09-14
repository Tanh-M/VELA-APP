import { useEffect } from 'react';

// Hook qui gère les notifications système du navigateur (Niveau 1).
// Ces notifications s'affichent même si l'onglet Vela n'est pas au premier plan,
// tant que le navigateur reste ouvert.
export function useNotifications() {

  // Demande la permission d'afficher des notifications, une seule fois
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fonction à appeler chaque fois qu'une nouvelle alerte doit être signalée
  function notify(title, body) {
    // Vérifie que le navigateur supporte les notifications ET que l'utilisateur a autorisé
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.svg', // réutilise ton logo comme icône de notification
      });
    }
  }

  return { notify };
}