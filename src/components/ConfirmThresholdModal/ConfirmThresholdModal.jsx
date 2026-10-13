import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BookOpen, Download } from 'lucide-react';
import './ConfirmThresholdModal.css';

// Pop-up de confirmation affiché quand l'utilisateur clique sur "Enregistrer" des seuils.
// Props :
//  - onConfirm : appelé si l'utilisateur confirme la modification
//  - onCancel : appelé s'il annule (bouton, clic sur le fond ou touche Échap)
function ConfirmThresholdModal({ onConfirm, onCancel }) {
  // Permet de fermer le pop-up avec la touche Échap
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    // Cliquer sur le fond sombre = annuler
    <div className="ctm-backdrop" onClick={onCancel}>
      {/* stopPropagation : un clic DANS la carte ne doit pas la fermer */}
      <div className="ctm-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ctm-icon">
          <AlertTriangle size={26} />
        </div>

        <h3>Êtes-vous sûr de vouloir modifier les seuils ?</h3>

        <p>
          Cette action, si elle est mal encadrée et sans avoir consulté le guide ou la
          réglementation relative aux seuils, peut réduire la performance de votre
          détecteur, avec des conséquences sur votre sécurité.
        </p>

        {/* Liens vers le guide : nouvel onglet pour ne pas perdre la saisie en cours */}
        <div className="ctm-links">
          <Link to="/guide-seuils" target="_blank" rel="noopener noreferrer">
            <BookOpen size={14} />
            Consulter le guide
          </Link>
          <a href="/guide-seuils-vela.pdf" download="Guide-seuils-Vela.pdf">
            <Download size={14} />
            Télécharger le PDF
          </a>
        </div>

        <div className="ctm-actions">
          <button type="button" className="ctm-cancel" onClick={onCancel}>
            Annuler
          </button>
          <button type="button" className="ctm-confirm" onClick={onConfirm}>
            Oui, modifier
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmThresholdModal;