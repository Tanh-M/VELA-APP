import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Save, HelpCircle, ChevronRight, BellRing } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { sendPushNotification } from '../utils/sendPushNotification';
import { getThresholds, saveThresholds } from '../utils/alertRules';
import './Settings.css';

// Page Paramètres : apparence, seuils d'alerte, notifications, aide
function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useAuth();
  const [thresholds, setThresholds] = useState(getThresholds());
  const [notifEmail, setNotifEmail] = useState(false);
  const [saved, setSaved] = useState(false);

  // Gestion de l'activation des notifications push
  const { subscribe, status: pushStatus, errorMessage: pushError } = usePushNotifications();

  // Fonction intermédiaire, appelée par le clic sur le bouton d'activation
  function handlePushClick() {
    console.log('clic detecté sur le bouton notifications');
    subscribe();
  }

  // Envoie une vraie notification de test à l'utilisateur actuellement connecté,
  // pour vérifier que le système fonctionne de bout en bout
  async function handleTestNotification() {
    await sendPushNotification(currentUser.id, 'Test Vela', 'Ceci est un test de notification push.');
  }

  function updateThreshold(category, level, value) {
    setThresholds((prev) => ({
      ...prev,
      [category]: { ...prev[category], [level]: Number(value) },
    }));
  }

  function handleSave() {
    saveThresholds(thresholds);
    setSaved(true);
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

        <div className="threshold-group">
          <span className="threshold-label">Température (°C)</span>
          <div className="threshold-inputs">
            <label>
              Moyen
              <input type="number" value={thresholds.temperature.moyen} onChange={(e) => updateThreshold('temperature', 'moyen', e.target.value)} />
            </label>
            <label>
              Critique
              <input type="number" value={thresholds.temperature.critique} onChange={(e) => updateThreshold('temperature', 'critique', e.target.value)} />
            </label>
          </div>
        </div>

        <div className="threshold-group">
          <span className="threshold-label">Fumée (%)</span>
          <div className="threshold-inputs">
            <label>
              Moyen
              <input type="number" value={thresholds.smoke.moyen} onChange={(e) => updateThreshold('smoke', 'moyen', e.target.value)} />
            </label>
            <label>
              Critique
              <input type="number" value={thresholds.smoke.critique} onChange={(e) => updateThreshold('smoke', 'critique', e.target.value)} />
            </label>
          </div>
        </div>

        <div className="threshold-group">
          <span className="threshold-label">Gaz (%)</span>
          <div className="threshold-inputs">
            <label>
              Moyen
              <input type="number" value={thresholds.gas.moyen} onChange={(e) => updateThreshold('gas', 'moyen', e.target.value)} />
            </label>
            <label>
              Critique
              <input type="number" value={thresholds.gas.critique} onChange={(e) => updateThreshold('gas', 'critique', e.target.value)} />
            </label>
          </div>
        </div>
      </div>

      {/* ===== Section Notifications push ===== */}
      <div className="settings-card">
        <h3>Notifications push</h3>
        <p className="settings-card-desc">
          Recevez des alertes même lorsque Vela n'est pas ouvert dans votre navigateur.
        </p>
        <button className="theme-toggle-btn" onClick={handlePushClick} disabled={pushStatus === 'loading'}>
          <BellRing size={16} />
          {pushStatus === 'success' ? 'Notifications activées ✓' : 'Activer les notifications'}
        </button>
        {pushStatus === 'error' && (
          <p className="auth-error" style={{ marginTop: '10px' }}>{pushError}</p>
        )}

        {/* Bouton de test temporaire : envoie une vraie notification à soi-même.
            À retirer une fois les tests terminés et le système validé. */}
        {pushStatus === 'success' && (
          <button
            className="theme-toggle-btn"
            style={{ marginTop: '10px' }}
            onClick={handleTestNotification}
          >
            Envoyer une notification de test
          </button>
        )}
      </div>

      {/* ===== Section Notifications par email ===== */}
      <div className="settings-card">
        <h3>Notifications par email</h3>
        <div className="settings-row">
          <span>Recevoir un résumé par email</span>
          <button
            className={`switch ${notifEmail ? 'switch-on' : ''}`}
            onClick={() => setNotifEmail(!notifEmail)}
          >
            <span className="switch-dot" />
          </button>
        </div>
      </div>

      {/* ===== Section Aide ===== */}
      <div className="settings-card">
        <h3>Aide</h3>
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