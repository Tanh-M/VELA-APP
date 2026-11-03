import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import AlertCard from '../components/AlertCard/AlertCard';
import { useDevices } from '../hooks/useDevices';
// AJOUT : alertes réelles (table device_events)
import { useAlerts } from '../hooks/useAlerts';
import { LEVEL_LABELS, formatDate, formatTime } from '../utils/historyLabels';
import './Alerts.css';

function Alerts() {
  const { devices, loading: devicesLoading } = useDevices();
  const { alerts, active, loading: alertsLoading, error } = useAlerts();

  const loading = devicesLoading || alertsLoading;

  // Nom d'un appareil à partir de son identifiant
  function deviceName(deviceId) {
    return devices.find((d) => d.id === deviceId)?.name || 'Appareil';
  }

  return (
    <div className="alerts-page">
      <h1>Alertes</h1>
      <p className="alerts-subtitle">
        {active.length > 0
          ? `${active.length} appareil(s) en alerte actuellement`
          : 'Aucune anomalie en cours'}
      </p>

      {loading ? (
        <p className="devices-loading">Chargement...</p>
      ) : devices.length === 0 ? (
        <div className="dashboard-empty">
          <p>Ajoutez un détecteur pour commencer à recevoir des alertes.</p>
          <Link to="/devices" className="auth-submit-btn dashboard-empty-btn">
            Ajouter un détecteur
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <p role="alert" className="alerts-error">
              Impossible de charger les alertes : {error}
            </p>
          )}

          {/* ===== Appareils actuellement en alerte ===== */}
          {active.length > 0 && (
            <div className="alerts-active-list">
              {active.map((item) => (
                <Link
                  key={item.device_id}
                  to={`/devices/${item.device_id}`}
                  className={`alerts-active alerts-active-${item.level}`}
                >
                  <AlertTriangle size={20} />
                  <div>
                    <p className="alerts-active-title">
                      {item.device_name} : niveau {LEVEL_LABELS[item.level]?.toLowerCase() || item.level}
                    </p>
                    <p className="alerts-active-sub">
                      En cours depuis le {formatDate(item.since)} à {formatTime(item.since)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* ===== Alertes des 7 derniers jours ===== */}
          <h2 className="alerts-section-title">Alertes des 7 derniers jours</h2>

          <div className="alerts-list">
            {alerts.length === 0 ? (
              <p className="no-alerts">Aucune alerte sur les 7 derniers jours.</p>
            ) : (
              alerts.map((event) => (
                <AlertCard
                  key={event.id}
                  type={event.reasons?.length ? event.reasons.join(' · ') : 'Seuil dépassé'}
                  location={deviceName(event.device_id)}
                  time={`${formatDate(event.occurred_at)} à ${formatTime(event.occurred_at)}`}
                  severity={event.level}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Alerts;