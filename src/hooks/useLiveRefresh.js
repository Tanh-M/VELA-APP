import { useEffect, useRef } from 'react';

// Hook : relance une fonction de chargement
//  - toutes les "intervalMs" millisecondes (20 secondes par défaut), tant que l'écran est visible ;
//  - dès que l'application revient au premier plan (important sur iPhone, où l'application
//    installée reste en veille au lieu de se fermer) ;
//  - dès que la connexion internet revient.
// Ainsi, les changements apparaissent sans recharger la page.
export function useLiveRefresh(callback, intervalMs = 20000) {
  // On garde toujours la dernière version de la fonction
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    let lastRun = 0;

    function run() {
      // Rien à faire si l'écran n'est pas visible (économise la batterie et les requêtes)
      if (document.visibilityState !== 'visible') return;

      // Évite les doublons quand plusieurs événements arrivent en même temps
      const now = Date.now();
      if (now - lastRun < 1000) return;
      lastRun = now;

      callbackRef.current();
    }

    const timer = setInterval(run, intervalMs);
    document.addEventListener('visibilitychange', run);
    window.addEventListener('focus', run);
    window.addEventListener('online', run);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', run);
      window.removeEventListener('focus', run);
      window.removeEventListener('online', run);
    };
  }, [intervalMs]);
}