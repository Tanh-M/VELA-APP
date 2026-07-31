import { useNavigate } from 'react-router-dom';
import { User, Mail, LogOut, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

function Profile() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = currentUser?.user_metadata?.full_name || 'Utilisateur';
  const email = currentUser?.email || '';
  const createdAt = currentUser?.created_at
    ? new Date(currentUser.created_at).toLocaleDateString('fr-FR')
    : '';

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

      <div className="danger-zone">
        <h3>Zone de danger</h3>
        <p>La suppression de votre compte est définitive et supprimera toutes vos données, appareils et historiques associés.</p>
        <button className="delete-account-btn" onClick={handleDeleteAccount}>
          <Trash2 size={16} />
          Supprimer mon compte
        </button>
      </div>
    </div>
  );
}

export default Profile;