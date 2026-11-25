import logo from '../../assets/icons/logo-vela.svg';
import './AuthShowcase.css';

// Panneau décoratif affiché à droite des pages Connexion et Inscription,
// sur grand écran seulement (il est caché sur téléphone, où la place manque).
// "title" et "text" changent selon la page.
function AuthShowcase({ title, text }) {
  return (
    <aside className="auth-showcase">
      {/* Illustration : purement décorative, ignorée par les lecteurs d'écran */}
      <div className="auth-showcase-stage" aria-hidden="true">
        {/* Pastilles qui flottent autour de la maison : les capteurs surveillés */}
        <span className="auth-chip auth-chip-smoke"><i className="auth-chip-dot" />Fumée</span>
        <span className="auth-chip auth-chip-temp"><i className="auth-chip-dot" />Température</span>
        <span className="auth-chip auth-chip-gas"><i className="auth-chip-dot" />Gaz</span>
        <span className="auth-chip auth-chip-flame"><i className="auth-chip-dot" />Flamme</span>

        {/* Maison protégée par le bouclier de Vela */}
        <svg className="auth-house" viewBox="-40 -20 440 340" focusable="false">
          <defs>
            <linearGradient id="authWall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1f4678" />
              <stop offset="1" stopColor="#132c52" />
            </linearGradient>
            <linearGradient id="authRoof" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2a5a96" />
              <stop offset="1" stopColor="#1c4274" />
            </linearGradient>
          </defs>

          {/* Anneaux de détection : ils s'allument l'un après l'autre */}
          <g fill="none" stroke="#85beff" strokeWidth="1.5">
            <circle className="auth-ring auth-ring-1" cx="180" cy="150" r="52" />
            <circle className="auth-ring auth-ring-2" cx="180" cy="150" r="92" />
            <circle className="auth-ring auth-ring-3" cx="180" cy="150" r="132" />
          </g>

          {/* Ombre au sol */}
          <ellipse cx="180" cy="264" rx="125" ry="9" fill="#000" fillOpacity="0.35" />

          {/* Cheminée, corps de la maison et toit */}
          <rect x="222" y="88" width="18" height="40" rx="2" fill="#173358" />
          <rect x="95" y="145" width="170" height="117" rx="6" fill="url(#authWall)" stroke="#fff" strokeOpacity="0.14" />
          <polygon points="78,152 180,72 282,152" fill="url(#authRoof)" stroke="#fff" strokeOpacity="0.16" strokeLinejoin="round" />

          {/* Fenêtres allumées */}
          <rect x="113" y="174" width="38" height="36" rx="4" fill="#f4cf7a" opacity="0.95" />
          <path d="M132 174V210M113 192H151" stroke="#c99a3a" strokeWidth="1.5" />
          <rect x="209" y="174" width="38" height="36" rx="4" fill="#f4cf7a" opacity="0.95" />
          <path d="M228 174V210M209 192H247" stroke="#c99a3a" strokeWidth="1.5" />

          {/* Porte */}
          <rect x="164" y="208" width="32" height="54" rx="3" fill="#0d1f3d" />
          <circle cx="190" cy="236" r="1.8" fill="#f4cf7a" />

          {/* Bouclier avec la flamme (légère respiration) */}
          <g transform="translate(180 148)">
            <g className="auth-shield">
              <path
                d="M0 -40 L31 -28 V2 C31 23 15 35 0 43 C-15 35 -31 23 -31 2 V-28 Z"
                fill="#185FA5" stroke="#fff" strokeOpacity="0.4" strokeWidth="1.5"
              />
              <path
                d="M0 -20 C5 -11 13 -6 13 4 C13 13 7 19 0 19 C-7 19 -13 13 -13 4 C-13 -2 -9 -6 -6 -11 C-4 -7 -2 -5 0 -3 C2 -9 2 -14 0 -20 Z"
                fill="#fff"
              />
              <path
                d="M0 -4 C3 1 7 3 7 8 C7 12 4 15 0 15 C-4 15 -7 12 -7 8 C-7 5 -4 2 0 -4 Z"
                fill="#ff8a3d"
              />
            </g>
          </g>
        </svg>

        {/* Exemple de notification : elle apparaît puis disparaît en boucle */}
        <div className="auth-notif">
          <img src={logo} alt="" className="auth-notif-logo" />
          <div>
            <p className="auth-notif-title">Alerte - Cuisine</p>
            <p className="auth-notif-body">
              Fumée détectée (32 %). Surveillez l'historique de l'appareil dans Vela.
            </p>
          </div>
        </div>
      </div>

      {/* Texte du panneau (différent pour Connexion et Inscription) */}
      <div className="auth-showcase-copy">
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </aside>
  );
}

export default AuthShowcase;