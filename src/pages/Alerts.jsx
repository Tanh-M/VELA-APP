import { Link } from 'react-router-dom';
import AlertCard from '../components/AlertCard/AlertCard';
import { useDevices } from '../hooks/useDevices';
import './Alerts.css';

function Alerts() {
  const { devices, loading } = useDevices();

  const alerts = [];

  return (
    <div className="alerts-page">
      <h1>Alertes</h1>
      <p className="alerts-subtitle">
        {alerts.length > 0
          ? `${alerts.length} anomalie(s) détectée(s)`
          : 'Aucune anomalie détectée'}
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
        <div className="alerts-list">
          {alerts.length === 0 ? (
            <p className="no-alerts">Tout est normal, aucune alerte active.</p>
          ) : (
            alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                type={alert.type}
                location={alert.location}
                time={alert.time}
                severity={alert.severity}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Alerts;