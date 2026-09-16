import { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

// Clé publique VAPID : identifie Vela auprès des services de notification
// des navigateurs. Ce n'est PAS une clé secrète, elle peut rester visible dans le code.
const VAPID_PUBLIC_KEY = 'BMrgMBB8GgR-VGulWYN9QN-bc7BO64xL1ugs1wSY_aSBH9lCL-BL8GzYeiC_KA6NSJ4Kh8QXm0XB7AhRpBggNWE';

// Convertit la clé VAPID (texte lisible) au format binaire attendu par l'API navigateur
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Hook qui expose une fonction "subscribe" à appeler UNIQUEMENT au clic d'un bouton.
// Les navigateurs modernes bloquent souvent silencieusement la popup de permission
// si elle n'est pas déclenchée par un vrai geste de l'utilisateur (clic, appui),
// d'où la nécessité d'un bouton plutôt qu'un déclenchement automatique.
export function usePushNotifications() {
  const { currentUser } = useAuth();

  // idle = rien fait encore, loading = en cours, success = abonné, error = échec
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function subscribe() {
    if (!currentUser) {
      setErrorMessage('Vous devez être connecté.');
      setStatus('error');
      return;
    }

    // Vérifie que le navigateur supporte bien les Service Workers et les notifications push
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setErrorMessage("Votre navigateur ne supporte pas les notifications push.");
      setStatus('error');
      return;
    }

    setStatus('loading');

    try {
      // Enregistre le fichier public/sw.js comme Service Worker actif
      const registration = await navigator.serviceWorker.register('/sw.js');
      // Attend qu'il soit pleinement actif avant de continuer
      await navigator.serviceWorker.ready;

      // Vérifie si un abonnement existe déjà, sinon en crée un nouveau
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        // C'est CETTE ligne qui déclenche la popup de permission du navigateur,
        // car elle est appelée directement depuis le clic utilisateur sur le bouton
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      // Sauvegarde l'abonnement dans Supabase, lié à l'utilisateur connecté
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: currentUser.id,
        subscription: JSON.stringify(subscription),
      }, { onConflict: 'user_id' });

      if (error) throw error;

      setStatus('success');
    } catch (err) {
      console.log('Erreur abonnement push :', err);
      setErrorMessage(err.message || 'Erreur inconnue.');
      setStatus('error');
    }
  }

  return { subscribe, status, errorMessage };
}