import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/icons/logo-sentinel.svg';
import { useAuth } from '../context/AuthContext';
import './Register.css';

// Page d'inscription : crée un compte Supabase, puis demande à l'utilisateur
// de confirmer son email avant de pouvoir se connecter
function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NOUVEAU : passe à true une fois l'inscription réussie,
  // pour afficher le message "vérifiez votre email" au lieu de rediriger direct
  const [registered, setRegistered] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Crée le compte Supabase (déclenche automatiquement l'envoi de l'email
      // de confirmation, puisque "Confirm email" est activé côté Supabase)
      await register(fullName, email, password);
      // On ne connecte plus automatiquement l'utilisateur : il doit d'abord
      // cliquer sur le lien reçu par email
      setRegistered(true);
    } catch (err) {
      setError(err.message || "Erreur lors de l'inscription.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={logo} alt="Vela" className="logo-icon" />
          <span>Vela</span>
        </div>

        <h2>Créer un compte</h2>
        <p className="auth-subtitle">Protégez votre maison dès aujourd'hui</p>

        {error && <p className="auth-error">{error}</p>}

        {registered ? (
          // Message affiché à la place du formulaire, une fois l'inscription réussie
          <div>
            <p className="auth-success">
              Un email de confirmation a été envoyé à {email}. Cliquez sur le lien reçu pour activer votre compte, puis connectez-vous.
            </p>
            <Link to="/login" className="auth-submit-btn auth-back-to-login">
              Aller à la page de connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Nom complet
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Votre nom"
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@email.com"
                required
              />
            </label>

            <label>
              Mot de passe
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
              {isSubmitting ? 'Création...' : "S'inscrire"}
            </button>
          </form>
        )}

        <p className="auth-switch">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;