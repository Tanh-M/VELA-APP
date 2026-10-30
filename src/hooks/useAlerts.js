import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

// Hook : alertes réelles auxquelles l'utilisateur a accès.
// - "alerts" : les événements d'alerte (moyen / critique) des 7 derniers jours
// - "active" : les appareils actuellement en alerte
// La sécurité RLS de Supabase filtre automatiquement : on ne reçoit que
// les alertes des installations de l'utilisateur.
export function useAlerts() {
  const { currentUser } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [active, setActive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = useCallback(async () => {
    if (!currentUser) {
      setAlerts([]);
      setActive([]);
      setLoading(false);
      return;
    }

    // Début de la fenêtre : il y a 7 jours
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    // Les deux requêtes partent en même temps
    const [eventsResult, activeResult] = await Promise.all([
      supabase
        .from('device_events')
        .select('id, device_id, occurred_at, level, reasons')
        .neq('level', 'normal') // uniquement les vraies alertes
        .gte('occurred_at', since)
        .order('occurred_at', { ascending: false })
        .limit(100),
      supabase.rpc('my_active_alerts'),
    ]);

    if (eventsResult.error || activeResult.error) {
      setError((eventsResult.error || activeResult.error).message);
    } else {
      setError(null);
      setAlerts(eventsResult.data ?? []);
      setActive(activeResult.data ?? []);
    }

    setLoading(false);
  }, [currentUser]);

  // Premier chargement, puis rafraîchissement automatique toutes les 20 secondes
  useEffect(() => {
    setLoading(true);
    fetchAlerts();

    const timer = setInterval(fetchAlerts, 20000);
    return () => clearInterval(timer);
  }, [fetchAlerts]);

  return { alerts, active, loading, error, refreshAlerts: fetchAlerts };
}