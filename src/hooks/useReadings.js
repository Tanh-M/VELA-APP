import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

// Hook : relevés des 24 dernières heures d'UN appareil, prêts pour Chart.jsx
export function useReadings24h(deviceId) {
  const { currentUser } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReadings = useCallback(async () => {
    if (!currentUser || !deviceId) {
      setData([]);
      setLoading(false);
      return;
    }

    // Début de la fenêtre : il y a 24 heures
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    // On prend les relevés les plus RÉCENTS en premier (limite de 1000 lignes par requête)
    const { data: rows, error: fetchError } = await supabase
      .from('sensor_readings')
      .select('temperature, smoke_level, gas_level, recorded_at')
      .eq('device_id', deviceId)
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: false })
      .limit(1000);

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    // Regroupe les relevés par heure et fait la moyenne : un point par heure sur le graphe
    const byHour = new Map();

    rows.forEach((row) => {
      const date = new Date(row.recorded_at);
      date.setMinutes(0, 0, 0); // début de l'heure
      const key = date.getTime();

      if (!byHour.has(key)) {
        byHour.set(key, { hour: date.getHours(), temps: [], smokes: [], gases: [] });
      }

      const bucket = byHour.get(key);
      if (row.temperature !== null) bucket.temps.push(row.temperature);
      if (row.smoke_level !== null) bucket.smokes.push(row.smoke_level);
      if (row.gas_level !== null) bucket.gases.push(row.gas_level);
    });

    // Moyenne arrondie à 1 décimale (null si aucune valeur dans l'heure)
    const average = (list) =>
      list.length === 0
        ? null
        : Math.round((list.reduce((sum, v) => sum + v, 0) / list.length) * 10) / 10;

    // Du plus ancien au plus récent, au format attendu par Chart.jsx
    const points = [...byHour.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, bucket]) => ({
        time: `${bucket.hour}h`,
        temperature: average(bucket.temps),
        smoke: average(bucket.smokes),
        gas: average(bucket.gases),
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