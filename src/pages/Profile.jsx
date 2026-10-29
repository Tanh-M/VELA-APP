import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, LogOut, Trash2, Phone, KeyRound, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
// AJOUT : rôle de l'utilisateur (simple membre ou administrateur)
import { useInstallation } from '../context/InstallationContext';
import { supabase } from '../services/supabase';
import './Profile.css';

// Enlève les espaces, points, tirets et parenthèses : "+242 06 123 45 67" devient "+242061234567"
function cleanPhone(value) {
  return value.replace(/[\s.\-()]/g, '');
}

// Numéro valide : "+" suivi de 8 à 15 chiffres (format international)
const PHONE_REGEX = /^\+[1-9][0-9]{7,14}$/;

function Profile() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // AJOUT : un "simple membre" n'est administrateur d'aucune installation.
  // Pour lui, le nom, le mot de passe et la suppression du compte sont verrouillés.
  // (L'affichage s'adapte ici ; le nom est en plus protégé dans la base Supabase.)
  const { loading: accessLoading, isPureMember } = useInstallation();
  const canEditAccount = !accessLoading && !isPureMember; // admin, ou compte sans installation
  const isLocked = !accessLoading && isPureMember; // simple membre

  // CHANGEMENT : le nom officiel vient maintenant de la table "profiles"
  // (et non plus des informations du compte, que l'utilisateur pourrait modifier lui-même)
  const [profileName, setProfileName] = useState('');
  const savedName = profileName;
  const displayName = savedName || 'Utilisateur';
  const email = currentUser?.email || '';
  const createdAt = currentUser?.created_at
    ? new Date(currentUser.created_at).toLocaleDateString('fr-FR')
    : '';

  // ===== Nom =====
  const [name, setName] = useState(savedName);
  const [nameMsg, setNameMsg] = useState(null); // { type: 'ok' | 'error', text }
  const [savingName, setSavingName] = useState(false);

  // Remet le champ à jour si le nom enregistré change
  useEffect(() => {
    setName(savedName);
  }, [savedName]);

  async function handleSaveName(e) {
    e.preventDefault();
    setNameMsg(null);

    const clean = name.trim();
    if (clean.length < 2) {
      setNameMsg({ type: 'error', text: 'Le nom doit contenir au moins 2 caractères.' });
      return;
    }
    if (clean === savedName) {
      setNameMsg({ type: 'ok', text: 'Aucun changement à enregistrer.' });
      return;
    }

    setSavingName(true);

    // 1) Nom officiel : table "profiles". La base refuse le changement à un simple membre.
    //    .select() permet de vérifier qu'une ligne a bien été modifiée.
    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name: clean })
      .eq('user_id', currentUser.id)
      .select();

    if (error || !data || data.length === 0) {
      setSavingName(false);
      setNameMsg({
        type: 'error',
        text: error?.message?.includes('droit de modifier votre nom')
          ? "Votre nom est géré par l'administrateur de votre installation."
          : 'Impossible de modifier le nom. Réessayez dans un instant.',
      });
      return;
    }

    // 2) On recopie aussi le nom dans les informations du compte,
    //    pour que la barre du haut (Navbar) affiche le nouveau nom
    await supabase.auth.updateUser({ data: { full_name: clean } });

    setSavingName(false);
    setProfileName(clean);
    setNameMsg({ type: 'ok', text: 'Nom mis à jour.' });
  }

  // ===== Numéro de téléphone =====
  // (modifiable par tout le monde, y compris un simple membre)
  const [phone, setPhone] = useState('');
  const [phoneMsg, setPhoneMsg] = useState(null);
  const [savingPhone, setSavingPhone] = useState(false);

  // CHANGEMENT : charge le nom ET le numéro depuis la table "profiles"
  useEffect(() => {
    if (!currentUser) return;

    async function loadProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      // Si le profil n'a pas encore de nom, on prend celui du compte
      setProfileName(data?.full_name || currentUser.user_metadata?.full_name || '');
      setPhone(data?.phone || '');
    }

    loadProfile();
  }, [currentUser?.id]);

  async function handleSavePhone(e) {
    e.preventDefault();
    setPhoneMsg(null);

    const clean = cleanPhone(phone);

    // Un champ vide est accepté : cela efface le numéro
    if (clean !== '' && !PHONE_REGEX.test(clean)) {
      setPhoneMsg({
        type: 'error',
        text: 'Numéro invalide. Utilisez le format international, par exemple +242061234567.',
      });
      return;
    }

    setSavingPhone(true);
    const { error } = await supabase.from('profiles').upsert(
      { user_id: currentUser.id, phone: clean || null, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    setSavingPhone(false);

    if (error) {
      setPhoneMsg({ type: 'error', text: "Impossible d'enregistrer le numéro. Réessayez dans un instant." });
      return;
    }

    setPhone(clean);
    setPhoneMsg({ type: 'ok', text: clean ? 'Numéro enregistré.' : 'Numéro supprimé.' });
  }

  // ===== Mot de passe =====
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [savingPw, setSavingPw] = useState(false);

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwMsg(null);

    if (newPassword.length < 8) {
      setPwMsg({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'Les deux nouveaux mots de passe ne sont pas identiques.' });
      return;
    }
    if (newPassword === currentPassword) {
      setPwMsg({ type: 'error', text: "Le nouveau mot de passe doit être différent de l'actuel." });
      return;
    }

    setSavingPw(true);

    // 1) On vérifie le mot de passe actuel, pour qu'une personne qui emprunte
    //    un téléphone déjà connecté ne puisse pas changer le mot de passe
    const { error: checkError } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: currentPassword,
    });

    if (checkError) {
      setSavingPw(false);
      setPwMsg({ type: 'error', text: 'Mot de passe actuel incorrect.' });
      return;
    }

    // 2) On enregistre le nouveau mot de passe
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPw(false);

    if (updateError) {
      const message = updateError.message || '';
      setPwMsg({
        type: 'error',
        text: /AAL2/i.test(message)
          ? "Votre compte est protégé par la double authentification : confirmez d'abord votre code pour modifier le mot de passe."
          : /different|same/i.test(message)
            ? "Le nouveau mot de passe doit être différent de l'actuel."
            : 'Impossible de modifier le mot de passe. Réessayez dans un instant.',
      });
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPwMsg({ type: 'ok', text: 'Mot de passe modifié avec succès.' });
  }

  // ===== Déconnexion et suppression =====
  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  function handleDeleteAccount() {
    const confirmed = window.confirm(
      'Cette action est irréversible. Toutes vos données et appareils liés seront supprimés définitivement. Voulez-vous vraiment continuer ?'
    );

    if (confirmed) {
      console.log('Suppression du compte confirmée.');
    }
  }

  return (
    <div className="profile-page">
      <h1>Profil</h1>
      <p className="profile-subtitle">Vos informations personnelles</p>

      <div className="profile-card">
        <div className="profile-avatar">
          <User size={28} />
        </div>

        <h2>{displayName}</h2>

        <div className="profile-info-row">
          <Mail size={16} />
          <span>{email}</span>
        </div>

        <div className="profile-info-row">
          <span className="profile-devices-count">Membre depuis le {createdAt}</span>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>

      {/* ===== Informations personnelles : nom et téléphone ===== */}
      <div className="profile-section">
        <h3>
          <User size={16} />
          Informations personnelles
        </h3>

        {/* CHANGEMENT : le formulaire du nom n'existe que pour un administrateur */}
        {canEditAccount && (
          <>
            <p className="profile-section-desc">Modifiez votre nom et votre numéro de téléphone.</p>

            <form onSubmit={handleSaveName} className="profile-form">
              <label className="profile-field">
                Nom complet
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  autoComplete="name"
                  maxLength={80}
                  required
                />
              </label>

              {nameMsg && <p className={`profile-msg profile-msg-${nameMsg.type}`}>{nameMsg.text}</p>}

              <button type="submit" className="profile-save-btn" disabled={savingName}>
                {savingName ? 'Enregistrement...' : 'Enregistrer le nom'}
              </button>
            </form>

            <hr className="profile-divider" />
          </>
        )}

        {/* AJOUT : note affichée à un simple membre, à la place du formulaire du nom */}
        {isLocked && (
          <>
            <p className="profile-locked">
              <Lock size={14} />
              Votre nom est géré par l'administrateur de votre installation et ne peut pas être
              modifié ici. Vous pouvez en revanche modifier votre numéro de téléphone.
            </p>

            <hr className="profile-divider" />
          </>
        )}

        <form onSubmit={handleSavePhone} className="profile-form">
          <label className="profile-field">
            <span className="profile-field-title">
              <Phone size={14} />
              Numéro de téléphone
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+242 06 123 45 67"
              autoComplete="tel"
            />
            <span className="profile-hint">
              Format international, par exemple +242061234567. Ce numéro est destiné aux messages
              d'alerte GSM de vos détecteurs.
            </span>
          </label>

          {phoneMsg && <p className={`profile-msg profile-msg-${phoneMsg.type}`}>{phoneMsg.text}</p>}

          <button type="submit" className="profile-save-btn" disabled={savingPhone}>
            {savingPhone ? 'Enregistrement...' : 'Enregistrer le numéro'}
          </button>
        </form>
      </div>

      {/* ===== Mot de passe ===== */}
      {/* CHANGEMENT : formulaire réservé aux administrateurs ; un simple membre voit une note */}
      {canEditAccount && (
        <div className="profile-section">
          <h3>
            <KeyRound size={16} />
            Mot de passe
          </h3>
          <p className="profile-section-desc">
            Pour votre sécurité, saisissez d'abord votre mot de passe actuel.
          </p>

          <form onSubmit={handleChangePassword} className="profile-form">
            <label className="profile-field">
              Mot de passe actuel
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            <label className="profile-field">
              Nouveau mot de passe
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8 caractères minimum"
                autoComplete="new-password"
                required
              />
            </label>

            <label className="profile-field">
              Confirmer le nouveau mot de passe
              <input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>

            <button type="button" className="profile-link-btn" onClick={() => setShowPasswords(!showPasswords)}>
              {showPasswords ? 'Masquer' : 'Afficher'} les mots de passe
            </button>

            {pwMsg && <p className={`profile-msg profile-msg-${pwMsg.type}`}>{pwMsg.text}</p>}

            <button type="submit" className="profile-save-btn" disabled={savingPw}>
              {savingPw ? 'Modification...' : 'Modifier le mot de passe'}
            </button>
          </form>
        </div>
      )}

      {isLocked && (
        <div className="profile-section">
          <h3>
            <KeyRound size={16} />
            Mot de passe
          </h3>
          <p className="profile-locked">
            <Lock size={14} />
            La modification du mot de passe et la suppression du compte sont réservées aux
            administrateurs. Pour retirer votre accès à une installation partagée, utilisez la
            page Partage.
          </p>
        </div>
      )}

      {/* ===== Zone de danger : réservée aux administrateurs ===== */}
      {canEditAccount && (
        <div className="danger-zone">
          <h3>Zone de danger</h3>
          <p>La suppression de votre compte est définitive et supprimera toutes vos données, appareils et historiques associés.</p>
          <button className="delete-account-btn" onClick={handleDeleteAccount}>
            <Trash2 size={16} />
            Supprimer mon compte
          </button>
        </div>
      )}
    </div>
  );
}

export default Profile;