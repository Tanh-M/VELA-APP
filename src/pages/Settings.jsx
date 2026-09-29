import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Save, HelpCircle, ChevronRight, BellRing, TestTube2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { sendPushNotification } from '../utils/sendPushNotification';
import { getThresholds, saveThresholds, generateAlerts } from '../utils/alertRules';
import { mockSensors } from '../data/mockSensors';
import './Settings.css';

function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useAuth();
  const [thresholds, setThresholds] = useState(getThresholds());
  const [notifEmail, setNotifEmail] = useState(false);
  const [saved, setSaved] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const { subscribe, status: pushStatus, errorMessage: pushError } = usePushNotifications();

  function handlePushClick() {
    subscribe();
  }

  // Simule un vrai dépassement de seuil : calcule les alertes à partir des
  // données de capteurs (factices pour l'instant, réelles plus tard avec le
  // matériel) selon les seuils actuellement configurés, et envoie une vraie
  // notification push pour la première alerte détectée. Ça démontre le
  // fonctionnement réel du système : seuil dépassé → notification envoyée.
  async function handleSimulateAlert() {
    setSimulating(true);

    // Recalcule les alertes avec les seuils actuels (ceux définis plus haut
    // dans cette même page, potentiellement modifiés par l'utilisateur)
    const alerts = generateAlerts(mockSensors);

    if (alerts.length === 0) {
      alert("Aucun seuil n'est actuellement dépassé avec les données de test. Essayez d'abaisser un seuil ci-dessus.");
      setSimulating(false);
      return;
    }

    // Prend la première alerte détectée, et envoie une vraie notification
    // avec son contenu réel (type d'anomalie + lieu concerné)
    const firstAlert = alerts[0];
    await sendPushNotification(
      currentUser.id,
      `Alerte ${firstAlert.severity} — ${firstAlert.location}`,
      firstAlert.type
    );

    setSimulating(false);
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

      <div className="settings-card">
        <h3>Notifications push</h3>
        <p className="settings-card-desc">
          Recevez une notification dès qu'un seuil configuré ci-dessus est dépassé.
        </p>
        <button className="theme-toggle-btn" onClick={handlePushClick} disabled={pushStatus === 'loading'}>
          <BellRing size={16} />
          {pushStatus === 'success' ? 'Notifications activées ✓' : 'Activer les notifications'}
        </button>
        {pushStatus === 'error' && (
          <p className="auth-error" style={{ marginTop: '10px' }}>{pushError}</p>
        )}

        {/* Simulation réaliste : calcule une vraie alerte à partir des seuils
            configurés ci-dessus, et l'envoie en notification. Utile en attendant
            que le matériel envoie de vraies données de capteurs. */}
        {pushStatus === 'success' && (
          <button
            className="theme-toggle-btn"
            style={{ marginTop: '10px' }}
            onClick={handleSimulateAlert}
            disabled={simulating}
          >
            <TestTube2 size={16} />
            {simulating ? 'Simulation...' : 'Simuler un dépassement de seuil'}
          </button>
        )}
      </div>

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