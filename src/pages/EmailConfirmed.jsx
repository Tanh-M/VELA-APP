import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import logo from '../assets/icons/logo-sentinel.svg';
import { useAuth } from '../context/AuthContext';
import './Login.css';
import './EmailConfirmed.css';

// Page d'atterrissage après un clic sur le lien de confirmation reçu par email.
// Supabase ouvre automatiquement une session grâce aux informations contenues dans
// l'adresse : on adapte donc le bouton selon que l'utilisateur est connecté ou non.
function EmailConfirmed() {
  // isAuthenticated : true si la session est ouverte
  // loading : tant que Supabase vérifie la session, on n'affiche pas encore de bouton
  const { isAuthenticated, loading } = useAuth();

  return (
    <div className="auth-page">
      <div className="auth-card email-confirmed-card">
        <div className="auth-logo">
          <img src={logo} alt="Vela" className="logo-icon" />
          <span>Vela</span>
        </div>

        <div className="email-confirmed-icon">
          <CheckCircle2 size={44} />
        </div>

        <h2>Compte confirmé !</h2>
        <p className="auth-subtitle">
          Votre adresse email a bien été vérifiée. Votre compte Vela est maintenant actif.
        </p>

        {/* Le bouton n'apparaît qu'une fois la vérification de session terminée */}
        {!loading && (
          isAuthenticated ? (
            <Link to="/dashboard" className="email-confirmed-btn">Accéder à mon tableau de bord</Link>
          ) : (
            <Link to="/login" className="email-confirmed-btn">Se connecter</Link>
          )
        )}
      </div>
    </div>
  );
}

export default EmailConfirmed;