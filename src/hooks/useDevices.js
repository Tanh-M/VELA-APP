import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

// Hook personnalisé pour gérer les appareils (détecteurs) de l'utilisateur connecté
export function useDevices() {
  const { currentUser } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Récupère depuis Supabase la liste des appareils appartenant à l'utilisateur connecté
  // (la sécurité RLS filtre automatiquement : on ne reçoit que les siens)
  async function fetchDevices() {
    if (!currentUser) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setDevices(data);
    setLoading(false);
  }

  // Recharge la liste des appareils à chaque fois que l'utilisateur connecté change
  // (par exemple après une connexion, ou une déconnexion suivie d'une reconnexion)
  useEffect(() => {
    fetchDevices();
  }, [currentUser]);

  // Ajoute un nouvel appareil dans Supabase, associé à l'utilisateur connecté
  // is_online démarre volontairement à false : l'appareil ne devient "en ligne"
  // que lorsque le système embarqué envoie un premier vrai relevé de capteur
  async function addDevice(name) {
    const { error } = await supabase
      .from('devices')
      .insert({ name, user_id: currentUser.id, is_online: false });

    if (error) throw error;

    // On recharge la liste pour que le nouvel appareil apparaisse immédiatement
    await fetchDevices();
  }

  return { devices, loading, addDevice };
}