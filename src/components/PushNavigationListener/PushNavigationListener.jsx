import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Composant invisible : écoute les messages envoyés par le service worker (public/sw.js)
// quand l'utilisateur touche une notification alors que Vela est déjà ouvert,
// et change de page en conséquence.
function PushNavigationListener() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;

    function handleMessage(event) {
      const message = event.data;
      if (!message || message.type !== 'vela-navigate') return;

      // Sécurité : on n'accepte qu'un chemin INTERNE de Vela (commençant par un seul "/")
      const url = message.url;
      if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')) {
        navigate(url);
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [navigate]);

  // Ce composant n'affiche rien
  return null;
}

export default PushNavigationListener;