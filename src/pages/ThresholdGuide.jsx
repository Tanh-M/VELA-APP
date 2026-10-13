import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Download, ShieldCheck, BedDouble, CookingPot, Bath, Car, Sofa,
  AlertTriangle, Check,
} from 'lucide-react';
import './ThresholdGuide.css';

// Les 5 types de pièces de la section interactive.
// level = sensibilité recommandée, de 1 (faible) à 5 (élevée)
const ROOMS = [
  {
    id: 'chambre', name: 'Chambre', icon: BedDouble, level: 5, levelLabel: 'Élevée (seuils bas)',
    why: "Les occupants dorment : leur temps de réaction est réduit. La détection doit être la plus précoce possible.",
    reflex: "Conservez les seuils par défaut, ou plus bas. Ne les relevez pas pour faire cesser une alerte sans en avoir identifié la cause.",
  },
  {
    id: 'cuisine', name: 'Cuisine', icon: CookingPot, level: 2, levelLabel: 'Faible (seuils plus élevés)',
    why: "La cuisson produit fumée, vapeur et pics de chaleur en usage normal : un seuil trop bas déclenche de fausses alertes fréquentes. Les référentiels recommandent plutôt un détecteur de chaleur, ou un détecteur de fumée éloigné d'au moins 3 mètres des appareils de cuisson.",
    reflex: "Relevez le seuil de fumée par petits paliers, puis observez pendant quelques jours avant de valider.",
  },
  {
    id: 'bain', name: 'Salle de bain', icon: Bath, level: 2, levelLabel: 'Faible pour la fumée',
    why: "La vapeur d'une douche peut déclencher des alertes non pertinentes. Les référentiels conseillent d'éloigner le détecteur d'environ 90 cm des sources de vapeur.",
    reflex: "Ne modifiez que le seuil concerné (la fumée), jamais tous les seuils à la fois.",
  },
  {
    id: 'garage', name: 'Garage / buanderie', icon: Car, level: 3, levelLabel: 'Chaleur privilégiée, fumée modérée',
    why: "Poussière, gaz d'échappement et vapeurs de produits peuvent fausser un capteur de fumée classique.",
    reflex: "Surveillez surtout la température, et relevez le seuil de fumée avec prudence.",
  },
  {
    id: 'salon', name: 'Couloir / salon', icon: Sofa, level: 3, levelLabel: 'Standard (valeurs par défaut)',
    why: "Zone de passage sans source régulière de chaleur ou de fumée : les valeurs par défaut conviennent.",
    reflex: "Conservez les valeurs par défaut, sauf besoin précis et identifié.",
  },
];

// Les erreurs les plus fréquentes lors d'un réglage de seuil
const MISTAKES = [
  {
    title: 'Relever un seuil pour « faire taire » une alerte',
    text: "Une fausse alerte a une cause (cuisson, vapeur, poussière). Traitez la cause ou ajustez par petits paliers : ne supprimez pas le signal.",
  },
  {
    title: 'Tout modifier d’un seul coup',
    text: "Si plusieurs seuils changent ensemble, impossible de savoir lequel a dégradé la détection.",
  },
  {
    title: 'Régler à l’extrême',
    text: "Un seuil très bas épuise l'utilisateur (alertes ignorées) ; un seuil très haut retarde la détection d'un vrai départ de feu.",
  },
];

// Les réflexes à valider avant toute modification
const CHECKLIST = [
  "J'ai identifié ce qui produit naturellement de la chaleur, de la fumée ou du gaz dans cette pièce.",
  "Je modifie un seul seuil à la fois, par petits paliers.",
  "Je garde un écart net entre le seuil moyen et le seuil critique.",
  "J'observe l'effet pendant quelques jours avant de considérer le réglage comme définitif.",
];

// Zone d'équilibre selon la position du curseur (0 = très sensible, 100 = très permissif)
function getZone(value) {
  if (value < 25) {
    return {
      tone: 'warn',
      title: 'Trop sensible',
      text: "Les fausses alertes se multiplient. À force, l'utilisateur finit par les ignorer : c'est la « fatigue d'alarme ».",
    };
  }
  if (value > 75) {
    return {
      tone: 'danger',
      title: 'Trop permissif',
      text: "Un vrai départ de feu risque d'être détecté tardivement, au moment où chaque minute compte.",
    };
  }
  return {
    tone: 'ok',
    title: 'Zone équilibrée',
    text: "Un bon compromis, à affiner selon l'usage réel de la pièce, par petits paliers.",
  };
}

// Traduit une valeur 0-100 en mot (on évite les pourcentages : c'est une illustration)
function riskWord(value) {
  if (value >= 66) return 'Élevé';
  if (value >= 33) return 'Modéré';
  return 'Faible';
}

function ThresholdGuide() {
  // Paramètres de l'adresse : "from" = page d'origine, "device" = appareil dont la
  // fenêtre des seuils était ouverte quand l'utilisateur a cliqué sur "Lire le guide"
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from');
  const deviceId = searchParams.get('device');

  // Où ramener l'utilisateur :
  //  - depuis les Paramètres → page Paramètres
  //  - depuis la fenêtre des seuils d'un appareil → cette même fenêtre, rouverte automatiquement
  //  - sinon (ex: lien du pop-up de confirmation) → liste des appareils
  let backTo = '/devices';
  let backLabel = 'Retour aux appareils';
  if (from === 'settings') {
    backTo = '/parametres';
    backLabel = 'Retour aux paramètres';
  } else if (deviceId) {
    backTo = `/devices?edit=${deviceId}`;
    backLabel = 'Retour à la modification des seuils';
  }

  // Position du curseur d'illustration (0 à 100)
  const [sensitivity, setSensitivity] = useState(50);
  // Pièce actuellement sélectionnée dans la section interactive
  const [roomIndex, setRoomIndex] = useState(0);
  // État coché/décoché de chaque réflexe de la checklist
  const [checked, setChecked] = useState(CHECKLIST.map(() => false));

  const zone = getZone(sensitivity);
  const room = ROOMS[roomIndex];
  const RoomIcon = room.icon;
  const doneCount = checked.filter(Boolean).length;

  // Plus le seuil est bas, plus le risque de fausses alertes est élevé (et inversement)
  const falseAlarmRisk = 100 - sensitivity;
  const lateDetectionRisk = sensitivity;

  // Coche ou décoche un réflexe de la checklist
  function toggleCheck(index) {
    setChecked((prev) => prev.map((value, i) => (i === index ? !value : value)));
  }

  return (
    <div className="tg-page">
      {/* Barre du haut : retour à gauche, téléchargement du PDF à droite */}
      <div className="tg-topbar">
        <Link to={backTo} className="tg-back">
          <ArrowLeft size={16} />
          {backLabel}
        </Link>
        <a href="/guide-seuils-vela.pdf" download="Guide-seuils-Vela.pdf" className="tg-pdf-btn">
          <Download size={15} />
          Télécharger le PDF
        </a>
      </div>

      {/* En-tête de la page */}
      <header className="tg-hero">
        <div className="tg-hero-icon">
          <ShieldCheck size={26} />
        </div>
        <h1>Guide des seuils d'alerte</h1>
        <p>
          Pourquoi, quand et comment ajuster vos seuils sans compromettre la performance
          de votre détecteur ni votre sécurité.
        </p>
      </header>

      {/* 1. Pourquoi un seuil par pièce */}
      <section className="tg-section" style={{ animationDelay: '0.05s' }}>
        <h2>Pourquoi un seuil par pièce ?</h2>
        <p className="tg-lead">
          Une cuisine produit naturellement de la fumée, de la vapeur et de la chaleur ; une
          chambre doit rester un environnement stable. Un seuil unique pour toute la maison
          suppose que chaque pièce se comporte de la même façon, ce qui est faux. C'est pourquoi
          Vela permet d'ajuster les seuils appareil par appareil, à condition de le faire avec méthode.
        </p>
      </section>

      {/* 2. Curseur interactif : l'équilibre entre fausses alertes et détection tardive */}
      <section className="tg-section" style={{ animationDelay: '0.1s' }}>
        <h2>Trouver le bon équilibre</h2>
        <div className="tg-card">
          <label className="tg-slider-title" htmlFor="tg-sensitivity">
            Déplacez le curseur pour voir l'effet d'un seuil
          </label>
          <input
            id="tg-sensitivity"
            className="tg-range"
            type="range"
            min="0"
            max="100"
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
          />
          <div className="tg-slider-labels">
            <span>Seuil bas (très sensible)</span>
            <span>Seuil haut (très permissif)</span>
          </div>

          <div className="tg-meters">
            <div>
              <div className="tg-meter-head">
                <span>Risque de fausses alertes</span>
                <strong>{riskWord(falseAlarmRisk)}</strong>
              </div>
              <div className="tg-meter-track">
                <div className="tg-meter-fill tg-fill-warn" style={{ width: `${falseAlarmRisk}%` }} />
              </div>
            </div>
            <div>
              <div className="tg-meter-head">
                <span>Risque de détection tardive</span>
                <strong>{riskWord(lateDetectionRisk)}</strong>
              </div>
              <div className="tg-meter-track">
                <div className="tg-meter-fill tg-fill-danger" style={{ width: `${lateDetectionRisk}%` }} />
              </div>
            </div>
          </div>

          {/* Message qui change selon la zone (sensible / équilibrée / permissive) */}
          <div className={`tg-zone tg-zone-${zone.tone}`}>
            <strong>{zone.title}</strong>
            {zone.text}
          </div>

          <p className="tg-note">Illustration conceptuelle : elle montre le principe, pas des mesures réelles.</p>
        </div>
      </section>

      {/* 3. Recommandations par pièce (onglets interactifs) */}
      <section className="tg-section" style={{ animationDelay: '0.15s' }}>
        <h2>Que recommander selon la pièce ?</h2>

        <div className="tg-tabs">
          {ROOMS.map((r, index) => {
            const Icon = r.icon;
            return (
              <button
                type="button"
                key={r.id}
                className={`tg-tab ${index === roomIndex ? 'tg-tab-active' : ''}`}
                onClick={() => setRoomIndex(index)}
              >
                <Icon size={16} />
                {r.name}
              </button>
            );
          })}
        </div>

        {/* key={room.id} : relance l'animation d'apparition à chaque changement de pièce */}
        <div className="tg-card tg-room" key={room.id}>
          <div className="tg-room-head">
            <div className="tg-room-title">
              <RoomIcon size={20} color="var(--accent)" />
              {room.name}
            </div>
            <div className="tg-sens">
              <div className="tg-segs">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className={`tg-seg ${n <= room.level ? 'tg-seg-on' : ''}`} />
                ))}
              </div>
              <span>{room.levelLabel}</span>
            </div>
          </div>

          <h4>Pourquoi</h4>
          <p>{room.why}</p>
          <h4>Bon réflexe</h4>
          <p>{room.reflex}</p>
        </div>
      </section>

      {/* 4. Erreurs à éviter */}
      <section className="tg-section" style={{ animationDelay: '0.2s' }}>
        <h2>Les erreurs à éviter</h2>
        <div className="tg-mistakes">
          {MISTAKES.map((mistake) => (
            <div className="tg-mistake" key={mistake.title}>
              <AlertTriangle size={18} className="tg-mistake-icon" />
              <h3>{mistake.title}</h3>
              <p>{mistake.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Checklist interactive avec barre de progression */}
      <section className="tg-section" style={{ animationDelay: '0.25s' }}>
        <h2>Checklist avant de modifier un seuil</h2>
        <div className="tg-card">
          <div className="tg-checklist">
            {CHECKLIST.map((item, index) => (
              <button type="button" key={index} className="tg-check" onClick={() => toggleCheck(index)}>
                <span className={`tg-box ${checked[index] ? 'tg-box-on' : ''}`}>
                  {checked[index] && <Check size={14} />}
                </span>
                <span>{item}</span>
              </button>
            ))}
          </div>

          <div className="tg-progress">
            <div className="tg-progress-track">
              <div className="tg-progress-fill" style={{ width: `${(doneCount / CHECKLIST.length) * 100}%` }} />
            </div>
            <p className="tg-progress-text">
              {doneCount === CHECKLIST.length
                ? 'Vous êtes prêt à ajuster vos seuils avec méthode.'
                : `${doneCount} / ${CHECKLIST.length} réflexes validés`}
            </p>
          </div>
        </div>
      </section>

      {/* 6. Sources et limites */}
      <section className="tg-section" style={{ animationDelay: '0.3s' }}>
        <h2>Sources et limites</h2>
        <div className="tg-card tg-sources">
          <ul>
            <li>NFPA 72 — National Fire Alarm and Signaling Code (dispositions résidentielles)</li>
            <li>UL 217 — Détecteurs de fumée à usage résidentiel</li>
            <li>UL 2034 — Détecteurs de monoxyde de carbone</li>
          </ul>
          <p>
            Ces référentiels définissent surtout l'emplacement et le type de détecteur par pièce,
            pas des seuils numériques universels pour un capteur combiné. Confrontez-les à la
            réglementation locale. Les valeurs de ce projet restent provisoires, en attendant
            l'étalonnage du capteur physique.
          </p>
        </div>
      </section>
    </div>
  );
}

export default ThresholdGuide;