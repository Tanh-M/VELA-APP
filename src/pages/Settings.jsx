import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Save, HelpCircle, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getThresholds, saveThresholds } from '../utils/alertRules';
import './Settings.css';

// Page Paramètres : apparence, seuils d'alerte, notifications, aide
function Settings() {
  // Thème actuel (clair/sombre) et fonction pour basculer, partagés avec toute l'app
  const { theme, toggleTheme } = useTheme();

  // Initialise le formulaire avec les seuils actuels (par défaut ou déjà personnalisés
  // par l'utilisateur, sauvegardés dans le localStorage)
  const [thresholds, setThresholds] = useState(getThresholds());

  // Interrupteurs de notification : pour l'instant de simples préférences visuelles,
  // pas encore reliées à un vrai système d'envoi de notifications
  const [notifPush, setNotifPush] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);

  // Affiche un message de confirmation temporaire après l'enregistrement
  const [saved, setSaved] = useState(false);

  // Met à jour UN seuil précis (ex: temperature.moyen) dans le state local,
  // sans toucher aux autres valeurs déjà saisies
  function updateThreshold(category, level, value) {
    setThresholds((prev) => ({
      ...prev,
      [category]: { ...prev[category], [level]: Number(value) },
    }));
  }

  // Sauvegarde les seuils modifiés dans le localStorage, utilisés ensuite
  // partout où generateAlerts() est appelé (Dashboard, Alertes)
  function handleSave() {
    saveThresholds(thresholds);
    setSaved(true);
    // Le message de confirmation disparaît tout seul après 2 secondes
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="settings-page fade-in-up">
      <h1>Paramètres</h1>
      <p className="settings-subtitle">Personnalisez le comportement de votre plateforme</p>

      {/* ===== Section Apparence ===== */}
      <div className="settings-card">
        <h3>Apparence</h3>
        <div className="settings-row">
          <span>Thème</span>
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            {theme === 'light' ? 'Passer en sombre' : 'Passer en clair'}
          </button>
        </div>
      </div>

      {/* ===== Section Seuils d'alerte ===== */}
      <div className="settings-card">
        <h3>Seuils d'alerte</h3>
        <p className="settings-card-desc">
          Définissez à partir de quelles valeurs une alerte moyenne ou critique se déclenche.
        </p>

        {/* Température */}
        <div className="threshold-group">
          <span className="threshold-label">Température (°C)</span>
          <div className="threshold-inputs">
            <label>
              Moyen
              <input
                type="number"
                value={thresholds.temperature.moyen}
                onChange={(e) => updateThreshold('temperature', 'moyen', e.target.value)}
              />
            </label>
            <label>
              Critique
              <input
                type="number"
                value={thresholds.temperature.critique}
                onChange={(e) => updateThreshold('temperature', 'critique', e.target.value)}
              />
            </label>
          </div>
        </div>

        {/* Fumée */}
        <div className="threshold-group">
          <span className="threshold-label">Fumée (%)</span>
          <div className="threshold-inputs">
            <label>
              Moyen
              <input
                type="number"
                value={thresholds.smoke.moyen}
                onChange={(e) => updateThreshold('smoke', 'moyen', e.target.value)}
              />
            </label>
            <label>
              Critique
              <input
                type="number"
                value={thresholds.smoke.critique}
                onChange={(e) => updateThreshold('smoke', 'critique', e.target.value)}
              />
            </label>
          </div>
        </div>

        {/* Gaz */}
        <div className="threshold-group">
          <span className="threshold-label">Gaz (%)</span>
          <div className="threshold-inputs">
            <label>
              Moyen
              <input
                type="number"
                value={thresholds.gas.moyen}
                onChange={(e) => updateThreshold('gas', 'moyen', e.target.value)}
              />
            </label>
            <label>
              Critique
              <input
                type="number"
                value={thresholds.gas.critique}
                onChange={(e) => updateThreshold('gas', 'critique', e.target.value)}
              />
            </label>
          </div>
        </div>
      </div>

      {/* ===== Section Notifications ===== */}
      <div className="settings-card">
        <h3>Notifications</h3>
        <div className="settings-row">
          <span>Notifications push</span>
          <button
            className={`switch ${notifPush ? 'switch-on' : ''}`}
            onClick={() => setNotifPush(!notifPush)}
          >
            <span className="switch-dot" />
          </button>
        </div>
        <div className="settings-row">
          <span>Notifications par email</span>
          <button
            className={`switch ${notifEmail ? 'switch-on' : ''}`}
            onClick={() => setNotifEmail(!notifEmail)}
          >
            <span className="switch-dot" />
          </button>
        </div>
      </div>

      {/* ===== Section Aide : lien direct vers la FAQ ===== */}
      <div className="settings-card">
        <h3>Aide</h3>
        {/* ?from=settings dans l'URL : permet à la page FAQ de savoir d'où l'utilisateur
            vient, et donc de le ramener au bon endroit avec le bouton "Retour".
            Utiliser l'URL plutôt que le state de navigation, car cette info doit
            survivre à un rechargement complet de la page. */}
        <Link to="/faq?from=settings" className="settings-link-row">
          <div className="settings-link-left">
            <HelpCircle size={18} />
            <span>Questions fréquentes (FAQ)</span>
          </div>
          <ChevronRight size={16} />
        </Link>
      </div>

      <button className="auth-submit-btn settings-save-btn" onClick={handleSave}>
        <Save size={16} />
        {saved ? 'Enregistré ✓' : 'Enregistrer les modifications'}
      </button>
    </div>
  );
}

export default Settings;