import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
// AJOUT : mémorise la dernière mesure pour l'afficher hors connexion
import { usePersistentState } from './usePersistentState';
// AJOUT : actualisation régulière, filet de sécurité si le temps réel se coupe
import { useLiveRefresh } from './useLiveRefresh';

export function useSensor(deviceId) {
  const { currentUser } = useAuth();
  // CHANGEMENT : la dernière mesure est mémorisée sur l'appareil
  const [reading, setReading] = usePersistentState(`reading:${deviceId}`, null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Nom unique du canal temps réel (évite les conflits si l'appareil est affiché deux fois)
  const channelName = useRef(`reading-${Math.random().toString(36).slice(2)}`);

  const fetchReading = useCallback(async () => {
    if (!currentUser || !deviceId) {
      setReading(null);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('sensor_readings')
      .select('temperature, smoke_level, gas_level, flame_detected, recorded_at')
      .eq('device_id', deviceId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      // CHANGEMENT : hors connexion, pas de message d'erreur (le bandeau l'explique)
      // et la dernière mesure mémorisée reste affichée
      if (navigator.onLine) setError(fetchError.message);
    } else {
      setError(null);
      setReading(data);
    }

    setLoading(false);
  }, [currentUser, deviceId]);

  useEffect(() => {
    setLoading(true);
    fetchReading();
  }, [fetchReading]);

  // TEMPS RÉEL : dès que le détecteur envoie une mesure, elle s'affiche tout de suite.
  // Le filtre ne laisse passer que les mesures de CET appareil.
  // La sécurité RLS s'applique : on ne reçoit que ce que l'utilisateur a le droit de voir.
  useEffect(() => {
    if (!currentUser || !deviceId) return undefined;

    const channel = supabase
      .channel(`${channelName.current}-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          const row = payload.new;
          setError(null);
          setReading({
            temperature: row.temperature,
            smoke_level: row.smoke_level,
            gas_level: row.gas_level,
            flame_detected: row.flame_detected,
            recorded_at: row.recorded_at,
          });
        }
      )
      .subscribe();

    // Se désabonne quand la page est quittée
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, deviceId]);

  // Filet de sécurité (toutes les 20 s et au retour de l'application au premier plan)
  useLiveRefresh(fetchReading);

  return { reading, loading, error, refreshReading: fetchReading };
}