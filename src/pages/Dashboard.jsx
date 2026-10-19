import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Circle, CheckCircle2 } from 'lucide-react';
import SensorCard from '../components/SensorCard/SensorCard';
import { useDevices } from '../hooks/useDevices';
import { useSensor } from '../hooks/useSensors';
import { getMockHistory } from '../data/mockHistory';
import { LEVEL_LABELS, formatDate, formatTime } from '../utils/historyLabels';
import './Dashboard.css';

// Carte d'un appareil : affiche sa dernière mesure et mène à sa page de détail (graphe 24h)
function DashboardSensorCard({ device }) {
  const { reading } = useSensor(device.id);

  return (
    <Link to={`/devices/${device.id}`} className="dashboard-card-link">
      <SensorCard
        name={device.name}
        isOnline={device.is_online}
        temperature={reading?.temperature ?? null}
        smokeLevel={reading?.smoke_level ?? null}
        gasLevel={reading?.gas_level ?? null}
        flameDetected={reading?.flame_detected ?? false}
      />
    </Link>
  );
}

function Dashboard() {
  // Récupère les vrais appareils de l'utilisateur connecté depuis Supabase
  const { devices, loading } = useDevices();

  // Compte les appareils réellement en ligne, pour la bannière d'état système
  const onlineCount = devices.filter((d) => d.is_online).length;

  // Derniers événements de TOUS les appareils, du plus récent au plus ancien.
  // TEMPORAIRE : données virtuelles (getMockHistory), à remplacer par la table device_events.
  const recentEvents = useMemo(() => {
    return devices
      .flatMap((device) =>
        getMockHistory(device.id)
          .slice(0, 5)
          .map((event) => ({ ...event, deviceName: device.name }))
      )
      .sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at))
      .slice(0, 6);
  }, [devices]);

  return (
    // fade-in-up : légère animation d'apparition (montée + fondu), définie dans index.css
    <div className="dashboard fade-in-up">
      <h1>Tableau de bord</h1>
      <p className="dashboard-subtitle">Vue d'ensemble de vos détecteurs</p>

      {loading ? (
        // Pendant le chargement des données depuis Supabase
        <p className="dashboard-loading">Chargement...</p>
      ) : devices.length === 0 ? (
        // Cas d'un nouvel utilisateur : aucun appareil enregistré pour l'instant
        <div className="dashboard-empty">
          <p>Vous n'avez pas encore de détecteur enregistré.</p>
          <Link to="/devices" className="auth-submit-btn dashboard-empty-btn">
            Ajouter mon premier détecteur
          </Link>
        </div>
      ) : (
        <>
          {/* Bannière d'état système : basée sur les VRAIES données (pas inventée) */}
          <div className="status-banner">
            <ShieldCheck size={20} />
            <div>
              <p className="status-banner-title">
                {onlineCount} appareil(s) en ligne sur {devices.length}
              </p>
              <p className="status-banner-sub">Aucune anomalie détectée pour l'instant</p>
            </div>
          </div>

          {/* Grille des fiches capteur : un clic ouvre le détail de l'appareil */}
          <div className="sensor-grid">
            {devices.map((device) => (
              <DashboardSensorCard key={device.id} device={device} />
            ))}
          </div>

          {/* ===== Derniers événements de tous les appareils ===== */}
          <div className="recent-events-card">
            <h3>Derniers événements</h3>

            {recentEvents.map((event) => (
              // Un clic sur une ligne ouvre l'historique de l'appareil concerné
              <Link
                key={event.id}
                to={`/devices/${event.device_id}/history`}
                className="recent-event-row"
              >
                <div>
                  <p className="recent-event-name">{event.deviceName}</p>
                  <p className="recent-event-date">
                    {formatDate(event.occurred_at)} à {formatTime(event.occurred_at)}
                  </p>
                </div>
                <span className={`recent-event-level recent-event-level-${event.level}`}>
                  {LEVEL_LABELS[event.level]}
                </span>
              </Link>
            ))}

            <p className="recent-events-note">
              Événements en données de démonstration, en attendant le système embarqué.
            </p>
          </div>

          {/* Checklist des prochaines étapes : reste utile tant que le matériel n'envoie rien */}
          <div className="next-steps-card">
            <h3>Prochaines étapes</h3>
            <div className="next-step-row">
              <CheckCircle2 size={16} className="step-done" />
              <span>Détecteur(s) enregistré(s)</span>
            </div>
            <div className="next-step-row">
              <Circle size={16} className="step-pending" />
              <span>Connecter le système embarqué</span>
            </div>
            <div className="next-step-row">
              <Circle size={16} className="step-pending" />
              <span>Recevoir vos premières données</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;