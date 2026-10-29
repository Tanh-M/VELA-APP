// Contexte des installations : indique à l'application à QUELLES installations
// l'utilisateur connecté a accès, avec quel rôle et quelles permissions.
// IMPORTANT : ce contexte sert uniquement à ADAPTER L'AFFICHAGE (masquer un bouton).
// La vraie sécurité est dans Supabase (RLS) : même si quelqu'un contourne
// l'interface, la base refuse l'action.
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

const InstallationContext = createContext();

export function InstallationProvider({ children }) {
  const { currentUser } = useAuth();

  // Liste des accès de l'utilisateur : une ligne par installation
  // { installation_id, role, can_view_history, can_edit_thresholds, can_manage_devices, installations: { id, name } }
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);

  // AJOUT : invitations reçues par l'utilisateur (en attente de réponse)
  const [invitations, setInvitations] = useState([]);

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

    if (!error) setMemberships(data ?? []);
    setLoading(false);
  }, [currentUser?.id]);

  // AJOUT : récupère les invitations reçues (fonction SQL my_pending_invitations)
  const fetchInvitations = useCallback(async () => {
    if (!currentUser) {
      setInvitations([]);
      return;
    }

    const { data, error } = await supabase.rpc('my_pending_invitations');
    if (!error) setInvitations(data ?? []);
  }, [currentUser?.id]);

  // Recharge à chaque changement d'utilisateur connecté (connexion / déconnexion)
  useEffect(() => {
    setLoading(true);
    fetchMemberships();
  }, [fetchMemberships]);

  // AJOUT : idem pour les invitations
  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

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

  // AJOUT : installations dont l'utilisateur est administrateur
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