import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye, Bell, History, ShieldCheck, LayoutDashboard, Users, Sliders,
  Flame, Thermometer, Wind, Cloud,
} from 'lucide-react';
import logo from '../assets/icons/logo-vela.svg';
import { useAuth } from '../context/AuthContext';
import './Home.css';

// Sensors monitored by Vela (header badges)
const sensors = [
  { icon: Cloud, label: 'Fumée' },
  { icon: Wind, label: 'Gaz' },
  { icon: Thermometer, label: 'Température' },
  { icon: Flame, label: 'Flamme' },
];

// Steps: from detector to phone
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

// Product features — each with a distinct accent color (reflected in CSS)
const features = [
  { icon: Eye, title: 'Surveillance continue', text: 'Suivez vos détecteurs 24h/24 en temps réel.' },
  { icon: Bell, title: 'Alertes instantanées', text: 'Soyez notifié immédiatement en cas de danger.' },
  { icon: History, title: 'Historique détaillé', text: "Consultez l'historique de vos événements." },
  { icon: Users, title: 'Partage en famille', text: 'Invitez vos proches avec leur propre compte et choisissez ce que chacun peut faire.' },
  { icon: Sliders, title: 'Seuils adaptés à chaque pièce', text: "Réglez les seuils d'alerte d'un détecteur selon la cuisine, la chambre ou le garage." },
  { icon: ShieldCheck, title: 'Données sécurisées', text: 'Vos informations sont protégées et fiables.' },
];

/**
 * Intersection Observer hook — triggers once when element enters viewport.
 * Respects prefers-reduced-motion: shows immediately if reduced motion is enabled.
 */
function useInView(threshold = 0.4) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Instant show for reduced motion users
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setInView(true);
      return;
    }

    // Legacy browsers without IntersectionObserver
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return;
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

/**
 * Smooth scroll to "How it works" section.
 * Respects prefers-reduced-motion.
 */
function scrollToHow() {
  const target = document.getElementById('comment-ca-marche');
  if (!target) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}

function Home() {
  const { isAuthenticated } = useAuth();
  const [notifRef, notifVisible] = useInView(0.5);

  return (
    <div className="home-page">
      {/* ===== HEADER ===== */}
      <header className="home-header" role="banner">
        <Link to="/" className="home-logo" aria-label="Vela — Accueil">
          <img src={logo} alt="" className="logo-icon" aria-hidden="true" />
          <span>Vela</span>
        </Link>

        <nav className="home-header-actions" aria-label="Navigation principale">
          <Link to="/faq" className="home-faq-btn">
            FAQ
          </Link>

          {isAuthenticated ? (
            <Link to="/dashboard" className="home-cta-btn home-dashboard-btn" aria-label="Accéder à mon tableau de bord">
              <LayoutDashboard size={16} aria-hidden="true" />
              Mon espace
            </Link>
          ) : (
            <>
              <Link to="/login" className="home-link-btn">Connexion</Link>
              <Link to="/register" className="home-cta-btn">Créer un compte</Link>
            </>
          )}
        </nav>
      </header>

      <main id="main-content" role="main">
        {/* ===== 1. HERO ===== */}
        <section className="home-hero" aria-labelledby="hero-title">
          <div className="home-hero-copy">
            <h1 id="hero-title">Protégez votre maison, en temps réel</h1>

            <p className="home-hero-lead">
              Vela supervise vos détecteurs de fumée, de gaz, de température et de flamme,
              et vous alerte sur votre téléphone au moindre signe de danger.
            </p>

            <div className="home-hero-actions">
              {isAuthenticated ? (
                <Link to="/dashboard" className="home-cta-btn home-cta-large">
                  Accéder à mon tableau de bord
                </Link>
              ) : (
                <Link to="/register" className="home-cta-btn home-cta-large">
                  Commencer maintenant
                </Link>
              )}

              <button
                type="button"
                className="home-hero-link"
                onClick={scrollToHow}
                aria-label="Voir comment ça marche — défile vers la section suivante"
              >
                Voir comment ça marche
              </button>
            </div>

            <p className="home-hero-note">Installation simple, en quelques minutes seulement.</p>

            <ul className="home-sensors" aria-label="Capteurs surveillés">
              {sensors.map((sensor) => {
                const Icon = sensor.icon;
                return (
                  <li key={sensor.label}>
                    <Icon size={15} aria-hidden="true" />
                    {sensor.label}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="home-hero-visual" aria-hidden="true">
            <div className="home-hero-float">
              <img
                className="home-hero-image"
                src="/images/home/hero-vela.jpg"
                alt="Une maison moderne protégée par Vela, icônes de connexion, notification, application mobile et historique"
                width="853"
                height="1280"
                decoding="async"
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* ===== 2. HOW IT WORKS ===== */}
        <section className="home-section home-how" id="comment-ca-marche" aria-labelledby="how-title">
          <div className="home-how-frame" aria-hidden="true">
            <img
              src="/images/home/ecosysteme-vela.jpg"
              alt="Écosystème Vela : détecteur connecté au cloud, Wi-Fi, notifications push et application mobile"
              width="853"
              height="1280"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="home-how-copy">
            <h2 id="how-title">Du détecteur à votre téléphone</h2>
            <p className="home-section-lead">
              Une fois le détecteur en place, tout se passe dans Vela.
            </p>

            <ol className="home-steps">
              {steps.map((step, index) => (
                <li key={step.title}>
                  <span className="home-step-num" aria-hidden="true">{index + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ===== 3. ALERT — Key moment ===== */}
        <section className="home-section home-alert" aria-labelledby="alert-title">
          {/* Decorative background image */}
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
          <div className="home-alert-overlay" aria-hidden="true" />

          <div className="home-alert-content">
            <h2 id="alert-title">Quand un seuil est dépassé, toute la maison est prévenue</h2>
            <p>
              Chaque membre reçoit la même alerte sur son téléphone, même si Vela est fermé.
              Un clic sur la notification ouvre directement la page des alertes.
            </p>

            {/* Notification example — animates on scroll */}
            <div
              ref={notifRef}
              className={`home-notif ${notifVisible ? 'home-notif-in' : ''}`}
              role="img"
              aria-label="Exemple de notification d'alerte critique : Flamme détectée, température critique 70 degrés Celsius, cuisine"
            >
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

        {/* ===== 4. FEATURES ===== */}
        <section className="home-section" aria-labelledby="features-title">
          <h2 id="features-title" className="home-features-title">Pensé pour toute la famille</h2>

          <div className="home-features">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <article className="home-feature" key={feature.title}>
                  <Icon size={22} aria-hidden="true" />
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* ===== 5. FINAL CTA ===== */}
        <section className="home-section home-final" aria-labelledby="final-title">
          <h2 id="final-title">Prêt à surveiller votre maison ?</h2>

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
      </main>
    </div>
  );
}

export default Home;