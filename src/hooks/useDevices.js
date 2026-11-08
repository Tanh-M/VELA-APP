import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
// Pour savoir dans quelle installation ajouter un appareil
import { useInstallation } from '../context/InstallationContext';
// Mises à jour en direct (sans recharger la page)
import { useLiveRefresh } from './useLiveRefresh';
import { useRealtimeRefresh } from './useRealtimeRefresh';
// AJOUT : mémorise les appareils pour les afficher hors connexion
import { usePersistentState } from './usePersistentState';

// Compare deux listes : évite de rafraîchir l'écran quand rien n'a changé
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Hook personnalisé : gère les appareils (détecteurs) auxquels l'utilisateur a accès
// (les siens + ceux qu'on a partagés avec lui)
export function useDevices() {
  const { currentUser } = useAuth();
  const { defaultInstallationId, refreshMemberships } = useInstallation();

  // CHANGEMENT : la liste des appareils est mémorisée sur l'appareil
  const [devices, setDevices] = usePersistentState('devices', []);
  const [loading, setLoading] = useState(true);

  // Récupère depuis Supabase la liste des appareils accessibles à l'utilisateur
  // (la sécurité RLS filtre automatiquement : on ne reçoit que ceux de ses installations).
  // "Chargement..." ne s'affiche qu'au premier chargement, pas à chaque rafraîchissement,
  // pour éviter que la liste disparaisse un instant après une modification.
  // Hors connexion, la requête échoue : on garde alors la liste mémorisée.
  async function fetchDevices() {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false });

    // On ne remplace la liste que si elle a vraiment changé
    if (!error) setDevices((prev) => (same(prev, data) ? prev : data));
    setLoading(false);
  }

  // Recharge la liste à chaque changement d'utilisateur connecté
  useEffect(() => {
    fetchDevices();
  }, [currentUser]);

  // Mises à jour automatiques
  // - ajout ou modification d'un appareil : immédiat (Realtime)
  // - toutes les 20 secondes et au retour de l'application au premier plan (suppressions)
  useLiveRefresh(fetchDevices);
  useRealtimeRefresh('devices', ['devices'], fetchDevices, !!currentUser);

  // Ajoute un appareil. is_online démarre à false : il ne passera "en ligne"
  // que lorsque le système embarqué enverra un premier relevé.
  // On précise l'installation. Si l'utilisateur n'en a aucune (nouveau compte),
  // la base la crée automatiquement au premier appareil.
  async function addDevice(name) {
    const { error } = await supabase.from('devices').insert({
      name,
      user_id: currentUser.id,
      is_online: false,
      ...(defaultInstallationId ? { installation_id: defaultInstallationId } : {}),
    });

    if (error) {
      // 42501 = refus de la sécurité RLS : l'utilisateur n'a pas ce droit
      if (error.code === '42501') {
        throw new Error("Vous n'avez pas le droit d'ajouter un appareil.");
      }
      throw error;
    }

    // Premier appareil d'un nouveau compte : une installation vient d'être créée,
    // on actualise les accès de l'utilisateur
    if (!defaultInstallationId) await refreshMemberships();

    await fetchDevices();
  }

  // Supprime un appareil (ses relevés sont supprimés automatiquement grâce
  // au "on delete cascade" défini sur la table sensor_readings).
  // .select() permet de vérifier qu'une ligne a réellement été supprimée :
  // si la base refuse (droit manquant), aucune ligne n'est renvoyée.
  async function deleteDevice(id) {
    const { data, error } = await supabase
      .from('devices')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error("Suppression refusée : vous n'avez pas le droit de supprimer cet appareil.");
    }
    await fetchDevices();
  }

  // refreshDevices : permet à une page de recharger la liste après une modification
  return { devices, loading, addDevice, deleteDevice, refreshDevices: fetchDevices };
}