import { Link } from 'react-router-dom';
import { Eye, Bell, History, ShieldCheck } from 'lucide-react';
import logo from '../assets/icons/logo-sentinel.svg';
import './Home.css';

function Home() {
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
          <img src={logo} alt="Sentinel" className="logo-icon" />
          <span>Sentinel</span>
        </div>
        <div className="home-header-actions">
          <Link to="/login" className="home-link-btn">Connexion</Link>
          <Link to="/register" className="home-cta-btn">Créer un compte</Link>
        </div>
      </header>

      <section className="home-hero">
        <div className="home-hero-icon">
          <img src={logo} alt="Sentinel" className="logo-icon-large" />
        </div>
        <h1>Protégez votre maison, en temps réel</h1>
        <p>
          Sentinel supervise vos détecteurs de fumée, gaz, température et flamme,
          et vous alerte au moindre signe de danger.
        </p>
        <Link to="/register" className="home-cta-btn home-cta-large">Commencer maintenant</Link>
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