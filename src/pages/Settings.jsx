import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sun, Moon, HelpCircle, BookOpen, ChevronRight, BellRing, TestTube2, Sliders,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { sendPushNotification } from '../utils/sendPushNotification';
import { getThresholds, generateAlerts } from '../utils/alertRules';
import { mockSensors } from '../data/mockSensors';
import './Settings.css';

// Page Paramètres : apparence, seuils par défaut (lecture seule), notifications, aide
function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useAuth();
  const [notifEmail, setNotifEmail] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Gestion de l'activation des notifications push
  const { subscribe, status: pushStatus, errorMessage: pushError } = usePushNotifications();

  // Seuils par défaut, présentés en lecture seule (un tableau de lignes à afficher)
  const defaults = getThresholds();
  const defaultRows = [
    { label: 'Température', unit: '°C', ...defaults.temperature },
    { label: 'Fumée', unit: '%', ...defaults.smoke },
    { label: 'Gaz', unit: '%', ...defaults.gas },
  ];

  function handlePushClick() {
    subscribe();
  }

  // Simule un dépassement de seuil : calcule les alertes à partir des données de test,
  // puis envoie une vraie notification push pour la première alerte détectée
  async function handleSimulateAlert() {
    setSimulating(true);

    const alerts = generateAlerts(mockSensors);

    if (alerts.length === 0) {
      alert("Aucun seuil n'est dépassé avec les données de test actuelles.");
      setSimulating(false);
      return;
    }

    const firstAlert = alerts[0];
    await sendPushNotification(
      currentUser.id,
      `Alerte ${firstAlert.severity} — ${firstAlert.location}`,
      firstAlert.type
    );

    setSimulating(false);
  }

  return (
    <div className="settings-page fade-in-up">
      <h1>Paramètres</h1>
      <p className="settings-subtitle">Personnalisez le comportement de votre plateforme</p>

      {/* ===== Apparence ===== */}
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

      {/* ===== Seuils par défaut (lecture seule) ===== */}
      <div className="settings-card">
        <h3>Seuils d'alerte par défaut</h3>
        <p className="settings-card-desc">
          Ces valeurs s'appliquent à tout détecteur sans réglage personnalisé. Pour adapter un
          détecteur à sa pièce (cuisine, chambre...), modifiez ses seuils depuis la page Appareils.
        </p>

        {defaultRows.map((row) => (
          <div className="default-threshold-row" key={row.label}>
            <span className="default-threshold-name">{row.label}</span>
            <div className="default-threshold-values">
              <span className="threshold-chip threshold-chip-moyen">
                Moyen : {row.moyen} {row.unit}
              </span>
              <span className="threshold-chip threshold-chip-critique">
                Critique : {row.critique} {row.unit}
              </span>
            </div>
          </div>
        ))}

        {/* Redirige vers la modification individuelle, seul endroit où l'on règle un seuil */}
        <Link to="/devices" className="settings-action-btn">
          <Sliders size={16} />
          Gérer les seuils par appareil
        </Link>
      </div>

      {/* ===== Notifications push ===== */}
      <div className="settings-card">
        <h3>Notifications push</h3>
        <p className="settings-card-desc">
          Recevez une notification dès qu'un seuil est dépassé, même lorsque Vela n'est pas ouvert.
        </p>
        <button className="theme-toggle-btn" onClick={handlePushClick} disabled={pushStatus === 'loading'}>
          <BellRing size={16} />
          {pushStatus === 'success' ? 'Notifications activées ✓' : 'Activer les notifications'}
        </button>
        {pushStatus === 'error' && (
          <p className="auth-error" style={{ marginTop: '10px' }}>{pushError}</p>
        )}

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

      {/* ===== Notifications par email ===== */}
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

      {/* ===== Aide ===== */}
      <div className="settings-card">
        <h3>Aide</h3>
        <Link to="/guide-seuils?from=settings" className="settings-link-row">
          <div className="settings-link-left">
            <BookOpen size={18} />
            <span>Guide des seuils d'alerte</span>
          </div>
          <ChevronRight size={16} />
        </Link>
        <Link to="/faq?from=settings" className="settings-link-row">
          <div className="settings-link-left">
            <HelpCircle size={18} />
            <span>Questions fréquentes (FAQ)</span>
          </div>
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export default Settings;