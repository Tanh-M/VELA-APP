import { Link } from 'react-router-dom';
import { Eye, Bell, History, ShieldCheck, LayoutDashboard } from 'lucide-react';
import logo from '../assets/icons/logo-sentinel.svg';
import { useAuth } from '../context/AuthContext';
import './Home.css';

function Home() {
  // On vérifie si un utilisateur est déjà connecté, pour adapter les boutons de l'en-tête
  const { isAuthenticated } = useAuth();

  const features = [
    { icon: Eye, title: 'Surveillance continue', text: 'Suivez vos détecteurs 24h/24 en temps réel.' },
    { icon: Bell, title: 'Alertes instantanées', text: 'Soyez notifié immédiatement en cas de danger.' },
    { icon: History, title: 'Historique détaillé', text: "Consultez l'historique de vos événements." },
    { icon: ShieldCheck, title: 'Données sécurisées', text: 'Vos informations sont protégées et fiables.' },
  ];

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-logo">
          <img src={logo} alt="Vela" className="logo-icon" />
          <span>Vela</span>
        </div>

        <div className="home-header-actions">
          <Link to="/faq" className="home-faq-btn">FAQ</Link>

          {isAuthenticated ? (
            // Utilisateur déjà connecté : un seul bouton direct vers son espace,
            // pas besoin de repasser par Connexion/Inscription
            <Link to="/dashboard" className="home-cta-btn home-dashboard-btn">
              <LayoutDashboard size={16} />
              Mon espace
            </Link>
          ) : (
            // Utilisateur non connecté : les boutons classiques
            <>
              <Link to="/login" className="home-link-btn">Connexion</Link>
              <Link to="/register" className="home-cta-btn">Créer un compte</Link>
            </>
          )}
        </div>
      </header>

      <section className="home-hero">
        <div className="home-hero-icon">
          <img src={logo} alt="Vela" className="logo-icon-large" />
        </div>
        <h1>Protégez votre maison, en temps réel</h1>
        <p>
          Vela supervise vos détecteurs de fumée, gaz, température et flamme,
          et vous alerte au moindre signe de danger.
        </p>

        {/* Le bouton principal aussi s'adapte : direct vers l'espace si déjà connecté */}
        {isAuthenticated ? (
          <Link to="/dashboard" className="home-cta-btn home-cta-large">Accéder à mon tableau de bord</Link>
        ) : (
          <Link to="/register" className="home-cta-btn home-cta-large">Commencer maintenant</Link>
        )}

        <p className="home-hero-note">Installation simple, en quelques minutes seulement.</p>
      </section>

      <section className="home-features">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div className="feature-card" key={index}>
              <div className="feature-icon-wrap">
                <Icon size={20} color="var(--accent)" />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}

export default Home;