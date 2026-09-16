import { supabase } from '../services/supabase';

// Envoie une notification push à UN utilisateur précis, en appelant
// la fonction Edge "send-push-notification" déployée sur Supabase.
// Cette fonction sera utilisée plus tard, quand une vraie alerte sera détectée
// (une fois le système embarqué connecté et envoyant de vraies données).
export async function sendPushNotification(userId, title, body) {
  // Récupère l'abonnement push sauvegardé de cet utilisateur dans la table
  // push_subscriptions (créée en SQL, remplie automatiquement par usePushNotifications.js)
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    console.log("Aucun abonnement push trouvé pour cet utilisateur.");
    return;
  }

  // Appelle la fonction Edge, en lui transmettant l'abonnement et le contenu du message.
  // Supabase se charge d'authentifier et de router cet appel vers la bonne fonction.
  const { error: invokeError } = await supabase.functions.invoke('send-push-notification', {
    body: {
      subscription: data.subscription,
      title,
      body,
    },
  });

  if (invokeError) {
    console.log("Erreur lors de l'envoi de la notification :", invokeError);
  }
}