import { useEffect, useState } from 'react';
import './SplashScreen.css';

// ============================================================
// RÉGLAGES : tu peux modifier ces valeurs
// ============================================================
// L'écran de démarrage s'affiche à CHAQUE ouverture de l'application.
//  - Version COMPLÈTE (animation longue + clic sur le logo) : à la première ouverture,
//    puis de nouveau si l'application n'a pas eu de version complète depuis X heures.
//  - Version COURTE (environ 2 secondes, sans clic) : toutes les autres ouvertures.
// Mets 0 pour avoir TOUJOURS la version complète.
const FULL_INTRO_EVERY_HOURS = 12;

// Durée d'affichage de la version courte avant sa sortie automatique (en millisecondes)
const QUICK_DURATION = 1500;

// Durée de l'animation de sortie (en millisecondes) selon la version
const EXIT_DURATION = 1300;
const EXIT_DURATION_QUICK = 450;
const EXIT_DURATION_REDUCED = 400; // version "moins d'animations"

// Clé de mémorisation : date de la dernière version complète
const STORAGE_KEY = 'vela-splash-last-full';

// Petites particules lumineuses qui montent doucement en arrière-plan.
// Les valeurs sont calculées (pas au hasard) pour que le rendu soit toujours le même.
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  x: (i * 37 + 11) % 100, // position horizontale, en %
  size: 3 + ((i * 7) % 5), // taille, en px
  delay: ((i * 53) % 90) / 10, // décalage de départ, en secondes
  duration: 7 + ((i * 11) % 7), // durée de la montée, en secondes
  drift: ((i * 29) % 80) - 40, // dérive latérale, en px
}));

// Étincelles qui jaillissent de la flamme quand elle s'allume (déplacement en px)
const SPARKS = [
  { dx: -18, dy: -32, delay: 1.55 },
  { dx: 14, dy: -38, delay: 1.6 },
  { dx: -6, dy: -44, delay: 1.66 },
  { dx: 22, dy: -24, delay: 1.7 },
  { dx: -24, dy: -20, delay: 1.74 },
  { dx: 6, dy: -30, delay: 1.8 },
];

// Choisit la version à afficher : 'full' (complète) ou 'quick' (courte)
function pickMode() {
  if (FULL_INTRO_EVERY_HOURS <= 0) return 'full';

  try {
    const last = Number(localStorage.getItem(STORAGE_KEY));
    if (!last) return 'full'; // toute première ouverture

    const hoursSince = (Date.now() - last) / 3600000;
    return hoursSince >= FULL_INTRO_EVERY_HOURS ? 'full' : 'quick';
  } catch {
    return 'full'; // stockage indisponible : version complète
  }
}

function SplashScreen() {
  // mode : version complète ou courte, décidée une seule fois à l'ouverture
  // visible : l'écran est-il présent ? leaving : est-il en train de partir ?
  const [mode] = useState(pickMode);
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  // Version complète : on note l'heure pour que les prochaines ouvertures soient courtes
  useEffect(() => {
    if (mode !== 'full') return;
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // rien à faire si le stockage est indisponible
    }
  }, [mode]);

  // Version courte : elle part toute seule après un court instant
  useEffect(() => {
    if (mode !== 'quick') return;
    const timer = setTimeout(() => setLeaving(true), QUICK_DURATION);
    return () => clearTimeout(timer);
  }, [mode]);

  // Tant que l'écran est affiché, on empêche la page derrière de défiler
  useEffect(() => {
    if (!visible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [visible]);

  // Quand la sortie démarre : on attend la fin de l'animation, puis on retire l'écran
  useEffect(() => {
    if (!leaving) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let duration = EXIT_DURATION;
    if (mode === 'quick') duration = EXIT_DURATION_QUICK;
    if (reduced) duration = EXIT_DURATION_REDUCED;

    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [leaving, mode]);

  if (!visible) return null;

  // Clic (ou touche Entrée / Espace) sur le logo : lance la sortie
  function handleEnter() {
    setLeaving(true);
  }

  return (
    <div className={`splash ${mode === 'quick' ? 'splash-quick' : ''} ${leaving ? 'splash-leaving' : ''}`}>
      {/* ===== Arrière-plan : deux grandes lueurs qui dérivent + particules qui montent ===== */}
      <div className="splash-orb splash-orb-a" aria-hidden="true" />
      <div className="splash-orb splash-orb-b" aria-hidden="true" />

      <div className="splash-particles" aria-hidden="true">
        {PARTICLES.map((p, index) => (
          <span
            key={index}
            className="splash-particle"
            style={{
              '--x': `${p.x}%`,
              '--s': `${p.size}px`,
              '--d': `${p.duration}s`,
              '--delay': `${p.delay}s`,
              '--dx': `${p.drift}px`,
            }}
          />
        ))}
      </div>

      {/* ===== Bloc central : logo + textes (tout est centré ici) ===== */}
      <div className="splash-stage">
        {/* Le logo EST le bouton : un clic dessus fait disparaître l'écran */}
        <button type="button" className="splash-button" onClick={handleEnter} aria-label="Entrer dans Vela">
          {/* Halo lumineux et ondes qui s'étendent, comme un radar de surveillance */}
          <span className="splash-aura" aria-hidden="true" />
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="splash-ring"
              aria-hidden="true"
              style={{ animationDelay: `${1.9 + i}s` }}
            />
          ))}

          {/* Le logo est dessiné ICI en SVG (et non en image) pour animer chaque partie */}
          <svg className="splash-logo" viewBox="0 0 120 120" aria-hidden="true">
            <defs>
              <linearGradient id="splash-shield" x1="0" y1="0" x2="0.3" y2="1">
                <stop offset="0" stopColor="#63B5F2" />
                <stop offset="1" stopColor="#14529A" />
              </linearGradient>
              <linearGradient id="splash-flame" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FFFFFF" />
                <stop offset="1" stopColor="#D6E9FA" />
              </linearGradient>
              <radialGradient id="splash-glow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="#63B5F2" stopOpacity="0.55" />
                <stop offset="1" stopColor="#63B5F2" stopOpacity="0" />
              </radialGradient>
              {/* Bande de lumière qui traverse le bouclier */}
              <linearGradient id="splash-shine-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
                <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.55" />
                <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
              {/* Zone de découpe : la lumière ne dépasse pas du bouclier */}
              <clipPath id="splash-clip">
                <path d="M60 7 L103 21 V57 C103 86 85 105 60 115 C35 105 17 86 17 57 V21 Z" />
              </clipPath>
            </defs>

            {/* Lueur derrière la flamme */}
            <circle className="splash-glow" cx="60" cy="66" r="56" fill="url(#splash-glow)" />

            {/* Bouclier : remplissage (apparaît en fondu)... */}
            <path
              className="splash-shield-fill"
              d="M60 7 L103 21 V57 C103 86 85 105 60 115 C35 105 17 86 17 57 V21 Z"
              fill="url(#splash-shield)"
            />
            {/* ...contour clair qui se dessine tout seul (pathLength=1 simplifie l'animation) */}
            <path
              className="splash-outline"
              d="M60 7 L103 21 V57 C103 86 85 105 60 115 C35 105 17 86 17 57 V21 Z"
              pathLength="1"
              fill="none"
              stroke="#A9D5F8"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              className="splash-inner-line"
              d="M60 14 L96 26 V57 C96 81 81 98 60 107 C39 98 24 81 24 57 V26 Z"
              fill="none"
              stroke="#FFFFFF"
              strokeOpacity="0.28"
              strokeWidth="1.5"
            />

            {/* Reflet lumineux : passe sur le bouclier à intervalles réguliers */}
            <g clipPath="url(#splash-clip)">
              <g transform="skewX(-20)">
                <rect className="splash-shine" x="0" y="-10" width="26" height="140" fill="url(#splash-shine-grad)" />
              </g>
            </g>

            {/* Flamme : elle s'allume avec un rebond, puis vacille */}
            <g className="splash-flame">
              <path
                d="M60 28 C63 41 78 47 78 65 C78 78 70 88 60 90 C50 88 42 78 42 65 C42 56 47 51 52 45 C52.5 52 56 55 58.5 55 C61 46 57 37 60 28 Z"
                fill="url(#splash-flame)"
              />
              <path
                d="M60 61 C61.5 68 69 71 69 78 C69 83.5 64.5 87 60 87 C55.5 87 51 83.5 51 78 C51 71 58.5 68 60 61 Z"
                fill="#1F6DB8"
              />
            </g>

            {/* Étincelles qui jaillissent de la flamme à l'allumage */}
            {SPARKS.map((s, index) => (
              <circle
                key={index}
                className="splash-spark"
                cx="60"
                cy="48"
                r="1.8"
                fill="#FFFFFF"
                style={{ '--dx': `${s.dx}px`, '--dy': `${s.dy}px`, animationDelay: `${s.delay}s` }}
              />
            ))}
          </svg>
        </button>

        {/* ===== Textes sous le logo ===== */}
        <div className="splash-texts">
          {/* "VELA" lettre par lettre : chaque lettre apparaît nette après avoir été floue */}
          <h1 className="splash-title" aria-label="Vela">
            {'VELA'.split('').map((letter, index) => (
              <span key={index} aria-hidden="true" style={{ animationDelay: `${2.2 + index * 0.12}s` }}>
                {letter}
              </span>
            ))}
          </h1>

          <span className="splash-line" aria-hidden="true" />
          <p className="splash-tagline">Détection d'incendie connectée</p>
          <p className="splash-hint">Appuyez sur le logo pour entrer</p>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;