import { useState, useEffect } from 'react';
import { TestTube2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useDevices } from '../../hooks/useDevices';
import { useInstallation } from '../../context/InstallationContext';

// Mesures injectées par le panneau. Les valeurs ont une décimale particulière
// (.7, .1) pour pouvoir effacer ces mesures sans toucher aux vraies données.
// NB : la flamme déclenche toujours le niveau critique ; l'alerte "moyenne" suppose
// les seuils par défaut (température entre 45 et 60 °C).
const DEMO_READINGS = {
  normal: {
    label: 'Retour à la normale',
    temperature: 22.7, smoke_level: 3.1, gas_level: 4.1, flame_detected: false,
  },
  moyen: {
    label: 'Alerte moyenne',
    temperature: 51.7, smoke_level: 5.1, gas_level: 4.1, flame_detected: false,
  },
  critique: {
    label: 'Alerte critique',
    temperature: 71.7, smoke_level: 10.1, gas_level: 4.1, flame_detected: true,
  },
};

// Panneau de démonstration : injecte des mesures à la place de l'ESP32.
// Elles passent par le VRAI circuit (déclencheur SQL, notifications, historique).
// RAPPEL : la sécurité est dans Supabase : seul un administrateur (ou un membre
// autorisé à gérer les appareils) peut enregistrer une mesure.
function DemoPanel() {
  const { devices } = useDevices();
  const { can } = useInstallation();

  // Appareils sur lesquels l'utilisateur a le droit d'écrire des mesures
  const manageable = devices.filter((d) => can(d.installation_id, 'manage_devices'));

  const [deviceId, setDeviceId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'ok' | 'error', text }

  // Sélectionne automatiquement le premier appareil disponible
  useEffect(() => {
    if (manageable.length > 0 && !manageable.some((d) => d.id === deviceId)) {
      setDeviceId(manageable[0].id);
    }
  }, [devices]);

  // Envoie une mesure de démonstration
  async function sendReading(kind) {
    if (!deviceId) return;
    setBusy(true);
    setMessage(null);

    const reading = DEMO_READINGS[kind];

    // Avant une alerte, on remet la mémoire anti-spam à zéro :
    // chaque alerte de la démonstration déclenche ainsi une notification
    if (kind !== 'normal') {
      const { error: resetError } = await supabase.rpc('demo_reset_alert_state', {
        p_device: deviceId,
      });

      if (resetError) {
        setBusy(false);
        setMessage({ type: 'error', text: `Préparation impossible : ${resetError.message}` });
        return;
      }
    }

    const { error } = await supabase.from('sensor_readings').insert({
      device_id: deviceId,
      temperature: reading.temperature,
      smoke_level: reading.smoke_level,
      gas_level: reading.gas_level,
      flame_detected: reading.flame_detected,
    });

    setBusy(false);

    if (error) {
      setMessage({
        type: 'error',
        text:
          error.code === '42501'
            ? "Vous n'avez pas le droit d'envoyer une mesure pour cet appareil."
            : `Envoi impossible : ${error.message}`,
      });
      return;
    }

    setMessage({
      type: 'ok',
      text:
        kind === 'normal'
          ? 'Mesure normale envoyée. L\'alerte en cours se termine dans quelques secondes.'
          : `${reading.label} envoyée. La notification et l'alerte arrivent dans quelques secondes.`,
    });
  }

  // Efface les mesures et alertes créées par ce panneau pour cet appareil
  async function clearDemoData() {
    const confirmed = window.confirm(
      'Supprimer les mesures et les alertes créées par ce panneau pour cet appareil ? Les vraies données ne sont pas touchées.'
    );
    if (!confirmed) return;

    setBusy(true);
    setMessage(null);

    const { error } = await supabase.rpc('demo_clear_data', { p_device: deviceId });
    setBusy(false);

    setMessage(
      error
        ? { type: 'error', text: `Suppression impossible : ${error.message}` }
        : { type: 'ok', text: 'Données de démonstration effacées.' }
    );
  }

  // Aucun appareil utilisable : le panneau n'a rien à proposer
  if (manageable.length === 0) return null;

  return (
    <div className="settings-card">
      <h3>Mode démonstration</h3>
      <p className="settings-card-desc">
        Simule les mesures d'un détecteur à la place du système embarqué. Les alertes passent par le
        vrai circuit : détection, notification, historique.
      </p>

      {/* Choix de l'appareil (affiché seulement s'il y en a plusieurs) */}
      {manageable.length > 1 && (
        <label
          style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', fontSize: '0.85rem' }}
        >
          Appareil
          <select
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            style={{
              padding: '8px 10px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          >
            {manageable.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </label>
      )}

      {manageable.length === 1 && (
        <p className="settings-card-desc">Appareil : <strong>{manageable[0].name}</strong></p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <button className="theme-toggle-btn" disabled={busy} onClick={() => sendReading('normal')}>
          <TestTube2 size={16} />
          Retour à la normale
        </button>
        <button className="theme-toggle-btn" disabled={busy} onClick={() => sendReading('moyen')}>
          <TestTube2 size={16} />
          Alerte moyenne
        </button>
        <button className="theme-toggle-btn" disabled={busy} onClick={() => sendReading('critique')}>
          <TestTube2 size={16} />
          Alerte critique (flamme)
        </button>
      </div>

      <button
        className="theme-toggle-btn"
        style={{ marginTop: '10px' }}
        disabled={busy}
        onClick={clearDemoData}
      >
        Effacer les données de démonstration
      </button>

      {message && (
        <p
          style={{
            marginTop: '12px',
            padding: '10px 12px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            lineHeight: 1.4,
            backgroundColor: message.type === 'ok' ? '#EAF3DE' : '#FCEBEB',
            color: message.type === 'ok' ? '#27500A' : '#791F1F',
          }}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}

export default DemoPanel;