
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../Services/supabase';
import { useAuth } from '../context/AuthContext';

export function useSensor(deviceId) {
  const { currentUser } = useAuth();
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setError(fetchError.message);
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

  return { reading, loading, error, refreshReading: fetchReading };
}
