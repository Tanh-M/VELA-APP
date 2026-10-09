import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

// Hook personnalisé : gère les appareils (détecteurs) de l'utilisateur connecté
export function useDevices() {
  const { currentUser } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Récupère depuis Supabase la liste des appareils de l'utilisateur connecté
  // (la sécurité RLS filtre automatiquement : on ne reçoit que les siens).
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
  // que lorsque le système embarqué enverra un premier relevé
  async function addDevice(name) {
    const { error } = await supabase
      .from('devices')
      .insert({ name, user_id: currentUser.id, is_online: false });

    if (error) throw error;
    await fetchDevices();
  }

  // Supprime un appareil (ses relevés sont supprimés automatiquement grâce
  // au "on delete cascade" défini sur la table sensor_readings).
  // .select() permet de vérifier qu'une ligne a réellement été supprimée :
  // sans ça, une politique de sécurité manquante échouerait en silence.
  async function deleteDevice(id) {
    const { data, error } = await supabase
      .from('devices')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error("Suppression refusée : vérifiez la politique « delete » de la table devices dans Supabase.");
    }
    await fetchDevices();
  }

  // refreshDevices : permet à une page de recharger la liste après une modification
  return { devices, loading, addDevice, deleteDevice, refreshDevices: fetchDevices };
}