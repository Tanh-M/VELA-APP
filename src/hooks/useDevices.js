import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
// AJOUT : pour savoir dans quelle installation ajouter un appareil
import { useInstallation } from '../context/InstallationContext';

// Hook personnalisé : gère les appareils (détecteurs) auxquels l'utilisateur a accès
// (les siens + ceux qu'on a partagés avec lui)
export function useDevices() {
  const { currentUser } = useAuth();
  const { defaultInstallationId, refreshMemberships } = useInstallation();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Récupère depuis Supabase la liste des appareils accessibles à l'utilisateur
  // (la sécurité RLS filtre automatiquement : on ne reçoit que ceux de ses installations).
  // "Chargement..." ne s'affiche qu'au premier chargement, pas à chaque rafraîchissement,
  // pour éviter que la liste disparaisse un instant après une modification.
  async function fetchDevices() {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setDevices(data);
    setLoading(false);
  }

  // Recharge la liste à chaque changement d'utilisateur connecté
  useEffect(() => {
    fetchDevices();
  }, [currentUser]);

  // Ajoute un appareil. is_online démarre à false : il ne passera "en ligne"
  // que lorsque le système embarqué enverra un premier relevé.
  // CHANGEMENT : on précise l'installation. Si l'utilisateur n'en a aucune (nouveau
  // compte), la base la crée automatiquement au premier appareil.
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