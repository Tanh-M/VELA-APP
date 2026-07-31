import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/icons/logo-sentinel.svg';
import { supabase } from '../services/supabase';
import './Login.css';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Quand l'utilisateur arrive ici depuis le lien reçu par email,
  // Supabase a déjà ouvert une session temporaire de récupération.
  // On peut donc directement mettre à jour le mot de passe.
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (error) {
      setError(error.message);
    } else {
      alert('Mot de passe mis à jour avec succès.');
      navigate('/login');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={logo} alt="Sentinel" className="logo-icon" />
          <span>Sentinel</span>
        </div>

        <h2>Nouveau mot de passe</h2>
        <p className="auth-subtitle">Choisissez un nouveau mot de passe pour votre compte.</p>

        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Nouveau mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          <label>
            Confirmer le mot de passe
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </button>
        </form>

        <p className="auth-switch">
          <Link to="/login">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;