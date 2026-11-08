import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Enregistre le service worker dès l'ouverture de Vela (en production seulement).
// C'est lui qui permet d'ouvrir l'application SANS connexion et de recevoir les notifications.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('/sw.js');
      const registration = await navigator.serviceWorker.ready;

      // Demande au service worker de garder une copie de tout ce que la page vient de charger
      const urls = performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .filter((name) => name.startsWith(window.location.origin));
      registration.active?.postMessage({ type: 'CACHE_URLS', urls });

      // Demande au navigateur de ne pas effacer les copies quand l'appareil manque de place
      navigator.storage?.persist?.();
    } catch {
      // Sans importance : l'application fonctionne aussi sans service worker
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)