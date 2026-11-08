// Contexte des installations : indique à l'application à QUELLES installations
// l'utilisateur connecté a accès, avec quel rôle et quelles permissions.
// IMPORTANT : ce contexte sert uniquement à ADAPTER L'AFFICHAGE (masquer un bouton).
// La vraie sécurité est dans Supabase (RLS) : même si quelqu'un contourne
// l'interface, la base refuse l'action.
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
// Mises à jour en direct (sans recharger la page)
import { useLiveRefresh } from '../hooks/useLiveRefresh';
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh';
// AJOUT : mémorise les droits pour les afficher hors connexion
import { usePersistentState } from '../hooks/usePersistentState';

const InstallationContext = createContext();

// Compare deux listes : évite de rafraîchir l'écran quand rien n'a changé
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function InstallationProvider({ children }) {
  const { currentUser } = useAuth();

  // Liste des accès de l'utilisateur : une ligne par installation
  // { installation_id, role, can_view_history, can_edit_thresholds, can_manage_devices, installations: { id, name } }
  // CHANGEMENT : mémorisée sur l'appareil, pour fonctionner hors connexion
  const [memberships, setMemberships] = usePersistentState('memberships', []);
  const [loading, setLoading] = useState(true);

  // Invitations reçues par l'utilisateur (en attente de réponse)
  // CHANGEMENT : mémorisées sur l'appareil, elles aussi
  const [invitations, setInvitations] = usePersistentState('invitations', []);

  // Récupère les accès de l'utilisateur connecté (la sécurité RLS ne renvoie que ses propres lignes)
  const fetchMemberships = useCallback(async () => {
    if (!currentUser) {
      setMemberships([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('installation_members')
      .select(
        'installation_id, role, can_view_history, can_edit_thresholds, can_manage_devices, installations(id, name)'
      )
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: true });

    // Hors connexion, la requête échoue : on garde alors les droits mémorisés
    if (!error) {
      const next = data ?? [];
      setMemberships((prev) => (same(prev, next) ? prev : next));
    }
    setLoading(false);
  }, [currentUser?.id]);

  // Récupère les invitations reçues (fonction SQL my_pending_invitations)
  const fetchInvitations = useCallback(async () => {
    if (!currentUser) {
      setInvitations([]);
      return;
    }

    const { data, error } = await supabase.rpc('my_pending_invitations');
    if (!error) {
      const next = data ?? [];
      setInvitations((prev) => (same(prev, next) ? prev : next));
    }
  }, [currentUser?.id]);

  // Recharge à chaque changement d'utilisateur connecté (connexion / déconnexion)
  useEffect(() => {
    setLoading(true);
    fetchMemberships();
  }, [fetchMemberships]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  // Mises à jour automatiques
  // - à l'arrivée d'une invitation ou d'un changement de droits : immédiat (Realtime)
  // - toutes les 20 secondes et au retour de l'application au premier plan (retraits d'accès)
  function refreshAll() {
    fetchMemberships();
    fetchInvitations();
  }
  useLiveRefresh(refreshAll);
  useRealtimeRefresh(
    'installation-context',
    ['installation_members', 'installation_invitations'],
    refreshAll,
    !!currentUser
  );

  // Rôle de l'utilisateur dans une installation : 'admin', 'member' ou null (aucun accès)
  const getRole = useCallback(
    (installationId) =>
      memberships.find((m) => m.installation_id === installationId)?.role ?? null,
    [memberships]
  );

  // A-t-il cette permission dans cette installation ?
  // permission = 'view_history' | 'edit_thresholds' | 'manage_devices'
  // Un admin a toutes les permissions.
  const can = useCallback(
    (installationId, permission) => {
      const m = memberships.find((x) => x.installation_id === installationId);
      if (!m) return false;
      if (m.role === 'admin') return true;
      return m[`can_${permission}`] === true;
    },
    [memberships]
  );

  // Installations dont l'utilisateur est administrateur
  const adminInstallations = memberships.filter((m) => m.role === 'admin');

  // Est-il administrateur d'au moins une installation ?
  const isAdminSomewhere = adminInstallations.length > 0;

  // Simple membre : a des accès, mais n'est admin nulle part
  // (sert à verrouiller nom / mot de passe / suppression de compte dans le Profil)
  const isPureMember = memberships.length > 0 && !isAdminSomewhere;

  // Installation dans laquelle un nouvel appareil sera ajouté par défaut :
  // la première où il est admin ou a le droit de gérer les appareils
  const defaultInstallationId =
    memberships.find((m) => m.role === 'admin' || m.can_manage_devices)?.installation_id ?? null;

  // Peut-il ajouter un appareil ? Oui s'il n'a encore aucune installation
  // (nouveau compte : elle sera créée automatiquement) ou s'il en gère une.
  const canAddDevice =
    !loading && (memberships.length === 0 || defaultInstallationId !== null);

  return (
    <InstallationContext.Provider
      value={{
        memberships,
        loading,
        invitations,
        adminInstallations,
        getRole,
        can,
        isAdminSomewhere,
        isPureMember,
        defaultInstallationId,
        canAddDevice,
        refreshMemberships: fetchMemberships,
        refreshInvitations: fetchInvitations,
      }}
    >
      {children}
    </InstallationContext.Provider>
  );
}

export function useInstallation() {
  return useContext(InstallationContext);
}