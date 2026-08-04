import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/icons/logo-sentinel.svg';
import { supabase } from '../services/supabase';
import './Login.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Envoie un email contenant un lien de réinitialisation
  // Le lien redirige l'utilisateur vers /reset-password une fois cliqué
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError("Une erreur est survenue. Vérifiez l'adresse saisie.");
    } else {
      setSent(true);
    }

    setIsSubmitting(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={logo} alt="Sentinel" className="logo-icon" />
          <span>Sentinel</span>
        </div>

        <h2>Mot de passe oublié</h2>
        <p className="auth-subtitle">
          Entrez votre email, nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>

        {error && <p className="auth-error">{error}</p>}

        {sent ? (
          // Une fois l'email envoyé, on affiche une confirmation plutôt que le formulaire
          <p className="auth-success">
            Un email a été envoyé à {email}. Vérifiez votre boîte de réception (et vos spams).
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
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

            <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Envoi...' : 'Envoyer le lien'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          <Link to="/login">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;