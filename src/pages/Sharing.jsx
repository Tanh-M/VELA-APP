// Page "Partage" : gestion des accès à une installation.
// - Administrateur : voit les membres, invite, modifie les permissions, révoque.
// - Invité : accepte ou refuse les invitations reçues.
// - Membre : peut quitter une installation partagée avec lui.
// RAPPEL : la sécurité réelle est dans Supabase (RLS). Cette page ne fait
// qu'afficher les bons boutons et appeler la base.
import { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Trash2, LogOut, Check, X, Mail } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useInstallation } from '../context/InstallationContext';
import './Sharing.css';

// Traduit une erreur technique de la base en message compréhensible
function friendlyError(error) {
  const text = error?.message || '';
  if (text.includes('au moins un administrateur')) {
    return 'Une installation doit toujours avoir au moins un administrateur.';
  }
  if (error?.code === '42501') return "Vous n'avez pas le droit d'effectuer cette action.";
  if (error?.code === '23505') return 'Cette personne a déjà été invitée.';
  return 'Une erreur est survenue. Réessayez dans un instant.';
}

// Texte affiché pour chaque permission (les mesures et alertes sont toujours visibles)
const PERMISSION_LABELS = [
  { key: 'can_view_history', label: "Voir l'historique et exporter" },
  { key: 'can_edit_thresholds', label: 'Modifier les seuils' },
  { key: 'can_manage_devices', label: 'Gérer les appareils (ajouter, renommer, supprimer)' },
];

function Sharing() {
  const { currentUser } = useAuth();
  const {
    memberships,
    invitations,
    loading,
    adminInstallations,
    refreshMemberships,
    refreshInvitations,
  } = useInstallation();

  // Installations où l'utilisateur est simple membre (accès partagés avec lui)
  const sharedAccess = memberships.filter((m) => m.role === 'member');

  // ===== Installation affichée (si l'utilisateur est admin de plusieurs) =====
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (adminInstallations.length === 0) {
      setSelectedId(null);
      return;
    }
    // Garde la sélection actuelle si elle est toujours valide, sinon prend la première
    const stillValid = adminInstallations.some((m) => m.installation_id === selectedId);
    if (!stillValid) setSelectedId(adminInstallations[0].installation_id);
  }, [memberships]);

  const selected = adminInstallations.find((m) => m.installation_id === selectedId);

  // ===== Données de l'installation sélectionnée =====
  const [members, setMembers] = useState([]); // membres avec leur nom et email
  const [pendingInvites, setPendingInvites] = useState([]); // invitations envoyées, en attente
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  // Message affiché en haut (succès ou erreur)
  const [message, setMessage] = useState(null); // { type: 'ok' | 'error', text }

  // Identifiant du membre en cours de modification (pour désactiver ses contrôles)
  const [savingId, setSavingId] = useState(null);

  // ===== Formulaire d'invitation =====
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member'); // 'member' ou 'admin'
  const [inviteHistory, setInviteHistory] = useState(true);
  const [inviteThresholds, setInviteThresholds] = useState(false);
  const [inviteDevices, setInviteDevices] = useState(false);
  const [inviting, setInviting] = useState(false);

  // Charge les membres et les invitations envoyées de l'installation sélectionnée
  const loadAdminData = useCallback(async () => {
    if (!selectedId) return;
    setLoadingAdmin(true);

    // 1) Les membres (l'administrateur voit toutes les lignes grâce au RLS)
    const { data: rows } = await supabase
      .from('installation_members')
      .select('user_id, role, can_view_history, can_edit_thresholds, can_manage_devices, created_at')
      .eq('installation_id', selectedId)
      .order('created_at', { ascending: true });

    const memberRows = rows ?? [];

    // 2) Leur nom et email (table profiles, lisible par l'admin pour ses membres)
    const ids = memberRows.map((r) => r.user_id);
    const { data: profiles } = ids.length
      ? await supabase.from('profiles').select('user_id, full_name, email').in('user_id', ids)
      : { data: [] };

    const byUser = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    setMembers(
      memberRows.map((r) => ({
        ...r,
        full_name: byUser.get(r.user_id)?.full_name || null,
        email: byUser.get(r.user_id)?.email || null,
      }))
    );

    // 3) Les invitations envoyées, pas encore acceptées
    const { data: invs } = await supabase
      .from('installation_invitations')
      .select('id, email, role, can_view_history, can_edit_thresholds, can_manage_devices, created_at')
      .eq('installation_id', selectedId)
      .order('created_at', { ascending: false });

    setPendingInvites(invs ?? []);
    setLoadingAdmin(false);
  }, [selectedId]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // ===== ADMIN : inviter une personne par email =====
  async function handleInvite(e) {
    e.preventDefault();
    setMessage(null);

    const clean = inviteEmail.trim().toLowerCase();

    if (!clean.includes('@')) {
      setMessage({ type: 'error', text: 'Saisissez une adresse email valide.' });
      return;
    }
    if (clean === (currentUser.email || '').toLowerCase()) {
      setMessage({ type: 'error', text: "C'est votre propre adresse email." });
      return;
    }
    if (members.some((m) => (m.email || '').toLowerCase() === clean)) {
      setMessage({ type: 'error', text: 'Cette personne a déjà accès à cette installation.' });
      return;
    }

    setInviting(true);

    const isAdminInvite = inviteRole === 'admin';
    const { error } = await supabase.from('installation_invitations').insert({
      installation_id: selectedId,
      email: clean,
      role: inviteRole,
      // Un administrateur a tous les droits ; sinon on applique les cases cochées
      can_view_history: isAdminInvite ? true : inviteHistory,
      can_edit_thresholds: isAdminInvite ? true : inviteThresholds,
      can_manage_devices: isAdminInvite ? true : inviteDevices,
      invited_by: currentUser.id,
    });

    setInviting(false);

    if (error) {
      setMessage({ type: 'error', text: friendlyError(error) });
      return;
    }

    // Remet le formulaire à zéro
    setInviteEmail('');
    setInviteRole('member');
    setInviteHistory(true);
    setInviteThresholds(false);
    setInviteDevices(false);
    setMessage({
      type: 'ok',
      text: `Invitation enregistrée. ${clean} la verra en se connectant à Vela avec cette adresse.`,
    });
    await loadAdminData();
  }

  // ===== ADMIN : annuler une invitation en attente =====
  async function handleCancelInvitation(invitation) {
    setMessage(null);
    const { data, error } = await supabase
      .from('installation_invitations')
      .delete()
      .eq('id', invitation.id)
      .select();

    if (error || !data || data.length === 0) {
      setMessage({ type: 'error', text: "Impossible d'annuler cette invitation." });
      return;
    }
    await loadAdminData();
  }

  // ===== ADMIN : modifier un membre (rôle ou permissions) =====
  async function updateMember(member, changes) {
    setMessage(null);
    setSavingId(member.user_id);

    const { data, error } = await supabase
      .from('installation_members')
      .update(changes)
      .eq('installation_id', selectedId)
      .eq('user_id', member.user_id)
      .select();

    setSavingId(null);

    if (error || !data || data.length === 0) {
      setMessage({
        type: 'error',
        text: error ? friendlyError(error) : 'Modification refusée.',
      });
      return;
    }
    await loadAdminData();
  }

  // Changement de rôle : membre <-> administrateur
  async function handleRoleChange(member, newRole) {
    const name = member.full_name || member.email || 'cette personne';

    if (newRole === 'admin') {
      const confirmed = window.confirm(
        `Promouvoir ${name} administrateur ? Cette personne pourra gérer les membres et tous les réglages. Vos propres droits ne changent pas.`
      );
      if (!confirmed) return;
      await updateMember(member, { role: 'admin' });
    } else {
      const confirmed = window.confirm(
        `Retirer le rôle d'administrateur à ${name} ? Elle deviendra simple membre, en lecture de l'historique uniquement.`
      );
      if (!confirmed) return;
      // En redevenant membre, on remet les droits par défaut
      await updateMember(member, {
        role: 'member',
        can_view_history: true,
        can_edit_thresholds: false,
        can_manage_devices: false,
      });
    }
  }

  // ===== ADMIN : révoquer l'accès d'un membre =====
  async function handleRemoveMember(member) {
    const name = member.full_name || member.email || 'cette personne';
    const confirmed = window.confirm(`Retirer l'accès de ${name} à cette installation ?`);
    if (!confirmed) return;

    setMessage(null);
    setSavingId(member.user_id);

    const { data, error } = await supabase
      .from('installation_members')
      .delete()
      .eq('installation_id', selectedId)
      .eq('user_id', member.user_id)
      .select();

    setSavingId(null);

    if (error || !data || data.length === 0) {
      setMessage({
        type: 'error',
        text: error ? friendlyError(error) : 'Suppression refusée.',
      });
      return;
    }
    setMessage({ type: 'ok', text: `L'accès de ${name} a été retiré.` });
    await loadAdminData();
  }

  // ===== INVITÉ : accepter une invitation =====
  async function handleAccept(invitation) {
    setMessage(null);
    const { error } = await supabase.rpc('accept_invitation', {
      p_invitation_id: invitation.id,
    });

    if (error) {
      setMessage({ type: 'error', text: "Impossible d'accepter cette invitation." });
      return;
    }

    setMessage({
      type: 'ok',
      text: `Vous avez maintenant accès à « ${invitation.installation_name} ». Ses appareils sont dans la page Appareils.`,
    });
    await refreshMemberships();
    await refreshInvitations();
  }

  // ===== INVITÉ : refuser une invitation =====
  async function handleDecline(invitation) {
    setMessage(null);
    const { data, error } = await supabase
      .from('installation_invitations')
      .delete()
      .eq('id', invitation.id)
      .select();

    if (error || !data || data.length === 0) {
      setMessage({ type: 'error', text: 'Impossible de refuser cette invitation.' });
      return;
    }
    await refreshInvitations();
  }

  // ===== MEMBRE : quitter une installation partagée =====
  async function handleLeave(membership) {
    const name = membership.installations?.name || 'cette installation';
    const confirmed = window.confirm(
      `Quitter « ${name} » ? Vous ne verrez plus ses appareils, sauf nouvelle invitation.`
    );
    if (!confirmed) return;

    setMessage(null);
    const { data, error } = await supabase
      .from('installation_members')
      .delete()
      .eq('installation_id', membership.installation_id)
      .eq('user_id', currentUser.id)
      .select();

    if (error || !data || data.length === 0) {
      setMessage({ type: 'error', text: friendlyError(error) });
      return;
    }
    await refreshMemberships();
  }

  if (loading) return <p className="sharing-loading">Chargement...</p>;

  return (
    <div className="sharing-page fade-in-up">
      <h1>Partage</h1>
      <p className="sharing-subtitle">
        Donnez accès à vos détecteurs à d'autres personnes, avec leur propre compte.
      </p>

      {/* Message de succès ou d'erreur */}
      {message && (
        <p className={`sharing-msg sharing-msg-${message.type}`}>{message.text}</p>
      )}

      {/* ===== Invitations reçues (visible pour tout le monde) ===== */}
      {invitations.length > 0 && (
        <div className="sharing-card">
          <h3>
            <Mail size={16} />
            Invitations reçues
          </h3>

          {invitations.map((inv) => (
            <div className="sharing-row" key={inv.id}>
              <div className="sharing-row-info">
                <p className="sharing-name">{inv.installation_name}</p>
                <p className="sharing-meta">
                  Invité par {inv.invited_by_name || 'un utilisateur Vela'} ·{' '}
                  {inv.role === 'admin' ? 'comme administrateur' : 'comme membre'}
                </p>
              </div>
              <div className="sharing-actions">
                <button className="sharing-btn sharing-btn-primary" onClick={() => handleAccept(inv)}>
                  <Check size={14} /> Accepter
                </button>
                <button className="sharing-btn" onClick={() => handleDecline(inv)}>
                  <X size={14} /> Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Partie ADMINISTRATEUR ===== */}
      {selected ? (
        <>
          {/* Choix de l'installation si l'utilisateur en administre plusieurs */}
          {adminInstallations.length > 1 && (
            <label className="sharing-select-label">
              Installation
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                {adminInstallations.map((m) => (
                  <option key={m.installation_id} value={m.installation_id}>
                    {m.installations?.name || 'Installation'}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* ----- Liste des membres ----- */}
          <div className="sharing-card">
            <h3>
              <Users size={16} />
              Personnes ayant accès à « {selected.installations?.name || 'Ma maison'} »
            </h3>
            <p className="sharing-desc">
              Tout membre voit les mesures et les alertes. Les cases ci-dessous ajoutent des
              droits. Un administrateur a tous les droits.
            </p>

            {loadingAdmin && members.length === 0 ? (
              <p className="sharing-loading">Chargement...</p>
            ) : (
              members.map((m) => {
                const isMe = m.user_id === currentUser.id;
                const busy = savingId === m.user_id;

                return (
                  <div className="sharing-member" key={m.user_id}>
                    <div className="sharing-member-top">
                      <div className="sharing-row-info">
                        <p className="sharing-name">
                          {m.full_name || m.email || 'Utilisateur'}
                          {isMe && <span className="sharing-tag">Vous</span>}
                        </p>
                        {m.email && m.full_name && <p className="sharing-meta">{m.email}</p>}
                      </div>

                      {/* Pas de contrôle sur soi-même : on ne se rétrograde pas par erreur */}
                      {isMe ? (
                        <span className="sharing-role-fixed">Administrateur</span>
                      ) : (
                        <div className="sharing-actions">
                          <select
                            value={m.role}
                            disabled={busy}
                            onChange={(e) => handleRoleChange(m, e.target.value)}
                          >
                            <option value="member">Membre</option>
                            <option value="admin">Administrateur</option>
                          </select>
                          <button
                            className="sharing-btn sharing-btn-danger"
                            disabled={busy}
                            onClick={() => handleRemoveMember(m)}
                            title="Retirer l'accès"
                          >
                            <Trash2 size={14} /> Retirer
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Permissions : cases à cocher pour un membre, mention pour un admin */}
                    {!isMe && (
                      m.role === 'admin' ? (
                        <p className="sharing-meta">Tous les droits, y compris la gestion des membres.</p>
                      ) : (
                        <div className="sharing-perms">
                          {PERMISSION_LABELS.map((perm) => (
                            <label key={perm.key} className="sharing-check">
                              <input
                                type="checkbox"
                                checked={m[perm.key]}
                                disabled={busy}
                                onChange={(e) => updateMember(m, { [perm.key]: e.target.checked })}
                              />
                              {perm.label}
                            </label>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* ----- Invitations envoyées, en attente ----- */}
          {pendingInvites.length > 0 && (
            <div className="sharing-card">
              <h3>
                <Mail size={16} />
                Invitations en attente
              </h3>

              {pendingInvites.map((inv) => (
                <div className="sharing-row" key={inv.id}>
                  <div className="sharing-row-info">
                    <p className="sharing-name">{inv.email}</p>
                    <p className="sharing-meta">
                      {inv.role === 'admin' ? 'Administrateur' : 'Membre'} · en attente de réponse
                    </p>
                  </div>
                  <button className="sharing-btn" onClick={() => handleCancelInvitation(inv)}>
                    <X size={14} /> Annuler
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ----- Formulaire d'invitation ----- */}
          <div className="sharing-card">
            <h3>
              <UserPlus size={16} />
              Inviter une personne
            </h3>
            <p className="sharing-desc">
              La personne doit avoir un compte Vela avec cette adresse email (ou en créer un).
              Elle ne reçoit aucun mot de passe : elle utilise le sien.
            </p>

            <form onSubmit={handleInvite} className="sharing-form">
              <label className="sharing-field">
                Adresse email
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="personne@email.com"
                  required
                />
              </label>

              <label className="sharing-field">
                Rôle
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  <option value="member">Membre (consultation)</option>
                  <option value="admin">Administrateur (tous les droits)</option>
                </select>
              </label>

              {/* Les permissions n'ont de sens que pour un membre */}
              {inviteRole === 'member' && (
                <div className="sharing-perms">
                  <label className="sharing-check">
                    <input
                      type="checkbox"
                      checked={inviteHistory}
                      onChange={(e) => setInviteHistory(e.target.checked)}
                    />
                    Voir l'historique et exporter
                  </label>
                  <label className="sharing-check">
                    <input
                      type="checkbox"
                      checked={inviteThresholds}
                      onChange={(e) => setInviteThresholds(e.target.checked)}
                    />
                    Modifier les seuils
                  </label>
                  <label className="sharing-check">
                    <input
                      type="checkbox"
                      checked={inviteDevices}
                      onChange={(e) => setInviteDevices(e.target.checked)}
                    />
                    Gérer les appareils (ajouter, renommer, supprimer)
                  </label>
                </div>
              )}

              <button type="submit" className="sharing-btn sharing-btn-primary" disabled={inviting}>
                {inviting ? 'Envoi...' : "Envoyer l'invitation"}
              </button>
            </form>
          </div>
        </>
      ) : (
        // L'utilisateur n'administre aucune installation
        memberships.length === 0 && (
          <div className="sharing-card">
            <p className="sharing-desc">
              Vous n'avez pas encore d'installation. Ajoutez votre premier détecteur dans la page
              Appareils pour en créer une, ou acceptez une invitation reçue.
            </p>
          </div>
        )
      )}

      {/* ===== Accès partagés avec moi : je peux les quitter ===== */}
      {sharedAccess.length > 0 && (
        <div className="sharing-card">
          <h3>
            <Users size={16} />
            Accès partagés avec moi
          </h3>
          <p className="sharing-desc">
            Ces installations appartiennent à d'autres personnes. Vous pouvez les consulter
            selon les droits qui vous ont été donnés.
          </p>

          {sharedAccess.map((m) => (
            <div className="sharing-row" key={m.installation_id}>
              <div className="sharing-row-info">
                <p className="sharing-name">{m.installations?.name || 'Installation'}</p>
                <p className="sharing-meta">
                  {[
                    m.can_view_history && 'historique',
                    m.can_edit_thresholds && 'seuils',
                    m.can_manage_devices && 'gestion des appareils',
                  ]
                    .filter(Boolean)
                    .join(', ') || 'consultation des mesures et alertes uniquement'}
                </p>
              </div>
              <button className="sharing-btn sharing-btn-danger" onClick={() => handleLeave(m)}>
                <LogOut size={14} /> Quitter
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Sharing;