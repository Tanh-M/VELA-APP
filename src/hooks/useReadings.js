import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
// AJOUT : mémorise le graphe pour l'afficher hors connexion
import { usePersistentState } from './usePersistentState';

// Convertit une valeur de la base en nombre, en gardant null si la mesure est absente
const toNumberOrNull = (value) =>
  value === null || value === undefined ? null : Number(value);

// Hook : relevés des 24 dernières heures d'UN appareil, prêts pour Chart.jsx
export function useReadings24h(deviceId) {
  const { currentUser } = useAuth();
  // CHANGEMENT : les points du graphe sont mémorisés sur l'appareil
  const [data, setData] = usePersistentState(`chart24:${deviceId}`, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReadings = useCallback(async () => {
    if (!currentUser || !deviceId) {
      setData([]);
      setLoading(false);
      return;
    }

    // CHANGEMENT : la base calcule elle-même la moyenne par heure (fonction SQL readings_hourly).
    // On reçoit au plus 24 lignes, quel que soit le nombre de mesures enregistrées :
    // plus de limite de 1000 lignes, et une seule requête.
    const { data: rows, error: fetchError } = await supabase.rpc('readings_hourly', {
      p_device_id: deviceId,
    });

    if (fetchError) {
      // CHANGEMENT : hors connexion, pas de message d'erreur (le bandeau l'explique)
      // et le dernier graphe mémorisé reste affiché
      if (navigator.onLine) setError(fetchError.message);
      setLoading(false);
      return;
    }

    // Format attendu par Chart.jsx : une mesure absente reste null (pas de faux zéro)
    const points = (rows || []).map((row) => ({
      time: `${new Date(row.hour_start).getHours()}h`,
      temperature: toNumberOrNull(row.avg_temperature),
      smoke: toNumberOrNull(row.avg_smoke),
      gas: toNumberOrNull(row.avg_gas),
    }));

    setError(null);
    setData(points);
    setLoading(false);
  }, [currentUser, deviceId]);

  // Premier chargement, puis rafraîchissement automatique toutes les 60 secondes
  useEffect(() => {
    setLoading(true);
    fetchReadings();

    const timer = setInterval(fetchReadings, 60000);
    return () => clearInterval(timer);
  }, [fetchReadings]);

  return { data, loading, error };
}