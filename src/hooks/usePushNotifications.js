import { useEffect } from 'react';
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

// Hook qui enregistre le Service Worker et abonne l'utilisateur aux notifications push.
// À appeler une seule fois, quand l'utilisateur est connecté (ex: dans Navbar.jsx)
export function usePushNotifications() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    // Vérifie que le navigateur supporte les Service Workers et les notifications push
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    async function subscribe() {
      try {
        // Enregistre le fichier public/sw.js comme Service Worker actif
        const registration = await navigator.serviceWorker.register('/sw.js');

        // Vérifie si l'utilisateur est déjà abonné, sinon crée un nouvel abonnement
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        // Sauvegarde l'abonnement dans Supabase, lié à l'utilisateur connecté.
        // upsert : crée la ligne si elle n'existe pas, la met à jour sinon
        // (grâce à la contrainte "unique" sur user_id qu'on a définie en SQL)
        await supabase.from('push_subscriptions').upsert({
          user_id: currentUser.id,
          subscription: JSON.stringify(subscription),
        }, { onConflict: 'user_id' });

      } catch (err) {
        console.log('Abonnement notifications push impossible :', err);
      }
    }

    subscribe();
  }, [currentUser]);
}