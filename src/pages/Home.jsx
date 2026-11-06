import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye, Bell, History, ShieldCheck, LayoutDashboard, Users, Sliders,
  Flame, Thermometer, Wind, Cloud,
} from 'lucide-react';
import logo from '../assets/icons/logo-vela.svg';
import { useAuth } from '../context/AuthContext';
import './Home.css';

// Les capteurs que Vela surveille (pastilles du haut de page)
const sensors = [
  { icon: Cloud, label: 'Fumée' },
  { icon: Wind, label: 'Gaz' },
  { icon: Thermometer, label: 'Température' },
  { icon: Flame, label: 'Flamme' },
];

// Les étapes de la section "Du détecteur à votre téléphone" (une vraie suite d'étapes)
const steps = [
  {
    title: 'Installez le détecteur',
    text: 'Placez-le dans la pièce à surveiller. Il mesure la fumée, le gaz, la température et la flamme.',
  },
  {
    title: 'Ajoutez-le dans Vela',
    text: 'Créez votre compte et enregistrez le détecteur en quelques minutes.',
  },
  {
    title: 'Suivez vos mesures',
    text: 'Le tableau de bord affiche chaque détecteur, ses dernières mesures et son historique.',
  },
  {
    title: 'Soyez alerté sur votre téléphone',
    text: "Dès qu'un seuil est dépassé, vous recevez une notification, même si Vela est fermé.",
  },
];

// Les atouts du produit
const features = [
  { icon: Eye, title: 'Surveillance continue', text: 'Suivez vos détecteurs 24h/24 en temps réel.' },
  { icon: Bell, title: 'Alertes instantanées', text: 'Soyez notifié immédiatement en cas de danger.' },
  { icon: History, title: 'Historique détaillé', text: "Consultez l'historique de vos événements." },
  {
    icon: Users,
    title: 'Partage en famille',
    text: 'Invitez vos proches avec leur propre compte et choisissez ce que chacun peut faire.',
  },
  {
    icon: Sliders,
    title: 'Seuils adaptés à chaque pièce',
    text: "Réglez les seuils d'alerte d'un détecteur selon la cuisine, la chambre ou le garage.",
  },
  { icon: ShieldCheck, title: 'Données sécurisées', text: 'Vos informations sont protégées et fiables.' },
];

// Petit outil : indique quand un élément devient visible à l'écran (une seule fois).
// Sert à déclencher l'apparition de la fausse notification dans la section rouge.
function useInView(threshold = 0.4) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    // Navigateur ancien : on affiche directement
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

// Fait défiler la page jusqu'à la section "Du détecteur à votre téléphone"
function scrollToHow() {
  const target = document.getElementById('comment-ca-marche');
  if (!target) return;

  // Pas d'animation de défilement pour les personnes qui ont réduit les animations
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}

function Home() {
  // On vérifie si un utilisateur est déjà connecté, pour adapter les boutons
  const { isAuthenticated } = useAuth();

  // La fausse notification apparaît quand la section rouge arrive à l'écran
  const [notifRef, notifVisible] = useInView(0.5);

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

      {/* ===== 1. Haut de page : le message principal et la maison protégée ===== */}
      <section className="home-hero">
        <div className="home-hero-copy">
          <h1>Protégez votre maison, en temps réel</h1>

          <p className="home-hero-lead">
            Vela supervise vos détecteurs de fumée, de gaz, de température et de flamme,
            et vous alerte sur votre téléphone au moindre signe de danger.
          </p>

          <div className="home-hero-actions">
            {/* Le bouton principal s'adapte : direct vers l'espace si déjà connecté */}
            {isAuthenticated ? (
              <Link to="/dashboard" className="home-cta-btn home-cta-large">
                Accéder à mon tableau de bord
              </Link>
            ) : (
              <Link to="/register" className="home-cta-btn home-cta-large">
                Commencer maintenant
              </Link>
            )}

            <button type="button" className="home-hero-link" onClick={scrollToHow}>
              Voir comment ça marche
            </button>
          </div>

          <p className="home-hero-note">Installation simple, en quelques minutes seulement.</p>

          <ul className="home-sensors">
            {sensors.map((sensor) => {
              const Icon = sensor.icon;
              return (
                <li key={sensor.label}>
                  <Icon size={15} />
                  {sensor.label}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="home-hero-visual">
          <div className="home-hero-float">
            <img
              className="home-hero-image"
              src="/images/home/hero-vela.jpg"
              alt="Une maison moderne protégée, entourée d'icônes : connexion, notification, application mobile et historique"
              width="853"
              height="1280"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* ===== 2. Du détecteur à votre téléphone ===== */}
      <section className="home-section home-how" id="comment-ca-marche">
        <div className="home-how-frame">
          <img
            src="/images/home/ecosysteme-vela.jpg"
            alt="Une maison protégée par un bouclier, reliée au cloud, au Wi-Fi, aux notifications et au téléphone"
            width="853"
            height="1280"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="home-how-copy">
          <h2>Du détecteur à votre téléphone</h2>
          <p className="home-section-lead">
            Une fois le détecteur en place, tout se passe dans Vela.
          </p>

          <ol className="home-steps">
            {steps.map((step, index) => (
              <li key={step.title}>
                <span className="home-step-num">{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== 3. L'alerte : le moment fort de la page ===== */}
      <section className="home-section home-alert" aria-labelledby="home-alert-title">
        {/* Image décorative en fond (le texte alternatif est vide volontairement) */}
        <img
          className="home-alert-bg"
          src="/images/home/alerte-rouge.jpg"
          alt=""
          aria-hidden="true"
          width="698"
          height="1280"
          loading="lazy"
          decoding="async"
        />
        <div className="home-alert-overlay" />

        <div className="home-alert-content">
          <h2 id="home-alert-title">Quand un seuil est dépassé, toute la maison est prévenue</h2>
          <p>
            Chaque membre reçoit la même alerte sur son téléphone, même si Vela est fermé.
            Un clic sur la notification ouvre directement la page des alertes.
          </p>

          {/* Exemple de notification (le texte reprend celui des vraies alertes) */}
          <div ref={notifRef} className={`home-notif ${notifVisible ? 'home-notif-in' : ''}`}>
            <img src={logo} alt="" aria-hidden="true" className="logo-icon" />
            <div>
              <p className="home-notif-title">🚨 ALERTE CRITIQUE - Cuisine</p>
              <p className="home-notif-body">
                Flamme détectée · Température critique (70 °C). Vérifiez immédiatement votre
                installation et consultez l'historique dans Vela.
              </p>
            </div>
          </div>
          <p className="home-notif-caption">Exemple de notification</p>
        </div>
      </section>

      {/* ===== 4. Les atouts ===== */}
      <section className="home-section">
        <h2 className="home-features-title">Pensé pour toute la famille</h2>

        <div className="home-features">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div className="home-feature" key={feature.title}>
                <Icon size={22} color="var(--accent)" />
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== 5. Appel final ===== */}
      <section className="home-section home-final">
        <h2>Prêt à surveiller votre maison ?</h2>

        {isAuthenticated ? (
          <Link to="/dashboard" className="home-cta-btn home-cta-large">
            Accéder à mon tableau de bord
          </Link>
        ) : (
          <Link to="/register" className="home-cta-btn home-cta-large">
            Créer un compte
          </Link>
        )}

        <p className="home-final-note">
          Une question ? <Link to="/faq">Consultez la FAQ</Link>.
        </p>
      </section>
    </div>
  );
}

export default Home;