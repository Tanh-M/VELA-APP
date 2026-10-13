import { Link } from 'react-router-dom';
import { AlertTriangle, Download } from 'lucide-react';
import './GuideNotice.css';

// Bandeau d'avertissement bien visible : "Consultez le guide avant de modifier un seuil".
// Props :
//  - from : page d'origine ("settings" ou "devices")
//  - deviceId : appareil dont la fenêtre des seuils est ouverte. Le guide s'en sert pour
//    ramener l'utilisateur DIRECTEMENT à cette fenêtre, et non à la liste des appareils
//  - newTab : si true, le guide s'ouvre dans un nouvel onglet
function GuideNotice({ from = 'settings', deviceId = null, newTab = false }) {
  // Construit l'adresse du guide avec ses paramètres
  const params = new URLSearchParams({ from });
  if (deviceId) params.set('device', deviceId);
  const guideUrl = `/guide-seuils?${params.toString()}`;

  return (
    <div className="guide-notice">
      {/* Badge rouge avec point d'exclamation, qui pulse doucement pour attirer l'œil */}
      <div className="guide-notice-icon">
        <AlertTriangle size={22} />
      </div>

      <div className="guide-notice-body">
        <p className="guide-notice-title">ATTENTION</p>
        <p className="guide-notice-text">
          Avant de modifier un seuil, consultez le guide : un réglage inadapté peut réduire
          la performance de votre détecteur.
        </p>

        <div className="guide-notice-actions">
          <Link
            to={guideUrl}
            target={newTab ? '_blank' : undefined}
            rel={newTab ? 'noopener noreferrer' : undefined}
            className="guide-notice-link"
          >
            Lire le guide
          </Link>

          {/* Téléchargement direct du PDF placé dans le dossier public/ */}
          <a href="/guide-seuils-vela.pdf" download="Guide-seuils-Vela.pdf" className="guide-notice-pdf">
            <Download size={14} />
            PDF
          </a>
        </div>
      </div>
    </div>
  );
}

export default GuideNotice;