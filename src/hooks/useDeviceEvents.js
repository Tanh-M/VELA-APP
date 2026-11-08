import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
// AJOUT : mémorise l'historique pour l'afficher hors connexion
import { usePersistentState } from './usePersistentState';

// Hook 1 : historique d'UN appareil (événements réels, du plus récent au plus ancien).
// La sécurité RLS de Supabase filtre automatiquement : sans le droit
// "Voir l'historique", seules les alertes des 7 derniers jours sont renvoyées.
export function useDeviceEvents(deviceId) {
  const { currentUser } = useAuth();
  // CHANGEMENT : l'historique est mémorisé sur l'appareil
  const [events, setEvents] = usePersistentState(`events:${deviceId}`, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    if (!currentUser || !deviceId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('device_events')
      .select('id, device_id, occurred_at, temperature, smoke_level, gas_level, flame_detected, level, actions')
      .eq('device_id', deviceId)
      .order('occurred_at', { ascending: false })
      .limit(500);

    if (fetchError) {
      // CHANGEMENT : hors connexion, pas de message d'erreur (le bandeau l'explique)
      // et l'historique mémorisé reste affiché
      if (navigator.onLine) setError(fetchError.message);
    } else {
      setError(null);
      setEvents(data ?? []);
    }
    setLoading(false);
  }, [currentUser, deviceId]);

  // Premier chargement, puis rafraîchissement automatique toutes les 30 secondes
  useEffect(() => {
    setLoading(true);
    fetchEvents();

    const timer = setInterval(fetchEvents, 30000);
    return () => clearInterval(timer);
  }, [fetchEvents]);

  return { events, loading, error };
}

// Hook 2 : derniers événements de PLUSIEURS appareils (pour le Tableau de bord)
export function useRecentEvents(deviceIds, limit = 6) {
  const { currentUser } = useAuth();

  // On transforme la liste en texte pour ne recharger que si elle change vraiment
  const key = deviceIds.join(',');

  // CHANGEMENT : les derniers événements sont mémorisés sur l'appareil
  const [events, setEvents] = usePersistentState(`recent-events:${key}`, []);

  const fetchEvents = useCallback(async () => {
    if (!currentUser || !key) {
      setEvents([]);
      return;
    }

    const { data, error } = await supabase
      .from('device_events')
      .select('id, device_id, occurred_at, level')
      .in('device_id', key.split(','))
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (!error) setEvents(data ?? []);
  }, [currentUser, key, limit]);

  // Premier chargement, puis rafraîchissement automatique toutes les 30 secondes
  useEffect(() => {
    fetchEvents();

    const timer = setInterval(fetchEvents, 30000);
    return () => clearInterval(timer);
  }, [fetchEvents]);

  return { events };
}