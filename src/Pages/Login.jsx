import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import logo from '../assets/icons/logo-sentinel.svg';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Login() {
  // Stocke ce que l'utilisateur tape dans les champs email et mot de passe
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Stocke un message d'erreur à afficher si la connexion échoue
  const [error, setError] = useState('');

  // Empêche de cliquer plusieurs fois sur "Se connecter" pendant l'envoi
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Si l'utilisateur a été redirigé ici depuis une page protégée (ex: /profile),
  // on le renverra vers cette page une fois connecté. Sinon, direction /dashboard.
  const from = location.state?.from?.pathname || '/dashboard';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Tente la connexion via Supabase (email + mot de passe)
      await login(email, password);
      navigate(from);
    } catch (err) {
      // Si Supabase refuse (mauvais identifiants), on affiche un message clair
      setError('Email ou mot de passe incorrect.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={logo} alt="Sentinel" className="logo-icon" />
          <span>Sentinel</span>
        </div>

        <h2>Connexion</h2>
        <p className="auth-subtitle">Accédez à votre espace de supervision</p>

        {/* N'affiche le message d'erreur que s'il y en a un */}
        {error && <p className="auth-error">{error}</p>}

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

          <label>
            {/* Ligne combinant le label "Mot de passe" et le lien "oublié", côte à côte */}
            <div className="auth-label-row">
              <span>Mot de passe</span>
              <Link to="/forgot-password" className="auth-forgot-link">Mot de passe oublié ?</Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="auth-switch">
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;