import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';

// Hook : relance une fonction de chargement dès qu'une ligne est AJOUTÉE ou MODIFIÉE
// dans les tables indiquées (Supabase Realtime).
// La sécurité RLS s'applique : l'application ne reçoit que les changements qu'elle a le
// droit de voir.
// Les SUPPRESSIONS ne sont volontairement pas écoutées : elles seraient diffusées sans filtre
// de sécurité. Elles apparaissent grâce à l'actualisation régulière (useLiveRefresh).
export function useRealtimeRefresh(channelName, tables, callback, enabled = true) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // Nom unique pour chaque utilisation du hook (évite les conflits entre pages)
  const uniqueName = useRef(`${channelName}-${Math.random().toString(36).slice(2)}`);

  // On transforme la liste de tables en texte pour ne se réabonner que si elle change
  const tablesKey = tables.join(',');

  useEffect(() => {
    if (!enabled) return undefined;

    let channel = supabase.channel(uniqueName.current);

    tablesKey.split(',').forEach((table) => {
      ['INSERT', 'UPDATE'].forEach((event) => {
        channel = channel.on(
          'postgres_changes',
          { event, schema: 'public', table },
          () => callbackRef.current()
        );
      });
    });

    channel.subscribe();

    // Se désabonne quand la page est quittée
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tablesKey, enabled]);
}