import { Link } from 'react-router-dom';
import SensorCard from '../components/SensorCard/SensorCard';
import { useDevices } from '../hooks/useDevices';
import './Dashboard.css';

function Dashboard() {
  const { devices, loading } = useDevices();

  return (
    <div className="dashboard">
      <h1>Tableau de bord</h1>
      <p className="dashboard-subtitle">Vue d'ensemble de vos détecteurs</p>

      {loading ? (
        <p className="dashboard-loading">Chargement...</p>
      ) : devices.length === 0 ? (
        <div className="dashboard-empty">
          <p>Vous n'avez pas encore de détecteur enregistré.</p>
          <Link to="/devices" className="auth-submit-btn dashboard-empty-btn">
            Ajouter mon premier détecteur
          </Link>
        </div>
      ) : (
        <>
          <div className="sensor-grid">
            {devices.map((device) => (
              <SensorCard
                key={device.id}
                name={device.name}
                isOnline={device.is_online}
                temperature={null}
                smokeLevel={null}
                gasLevel={null}
                flameDetected={false}
              />
            ))}
          </div>

          <div className="dashboard-no-chart">
            <p>Aucune donnée de mesure pour l'instant. Le graphique apparaîtra dès que vos détecteurs commenceront à transmettre des données.</p>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;