import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Circle, CheckCircle2 } from 'lucide-react';
import SensorCard from '../components/SensorCard/SensorCard';
import { useDevices } from '../hooks/useDevices';
import { useSensor } from '../hooks/useSensors';
import { useInstallation } from '../context/InstallationContext';
// AJOUT : alertes réelles et derniers événements réels
import { useAlerts } from '../hooks/useAlerts';
import { useRecentEvents } from '../hooks/useDeviceEvents';
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
  // Récupère les vrais appareils auxquels l'utilisateur a accès
  const { devices, loading } = useDevices();

  // Droits de l'utilisateur
  const { can } = useInstallation();

  // AJOUT : appareils actuellement en alerte (vraies données)
  const { active } = useAlerts();

  // Compte les appareils réellement en ligne, pour la bannière d'état système
  const onlineCount = devices.filter((d) => d.is_online).length;

  // Appareils dont l'utilisateur a le droit de voir l'historique
  const historyDevices = useMemo(
    () => devices.filter((d) => can(d.installation_id, 'view_history')),
    [devices, can]
  );
  const historyIds = useMemo(() => historyDevices.map((d) => d.id), [historyDevices]);

  // CHANGEMENT : derniers événements RÉELS (table device_events) de ces appareils
  const { events: recentEvents } = useRecentEvents(historyIds, 6);

  // Nom d'un appareil à partir de son identifiant
  function deviceName(deviceId) {
    return devices.find((d) => d.id === deviceId)?.name || 'Appareil';
  }

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
          {/* Bannière d'état système : basée sur les VRAIES données */}
          {active.length > 0 ? (
            // Au moins un appareil en alerte : bannière rouge (styles en ligne, pas de CSS à ajouter)
            <div
              className="status-banner"
              style={{
                backgroundColor: 'rgba(216, 90, 48, 0.14)',
                border: '1px solid rgba(216, 90, 48, 0.55)',
                color: 'var(--text-primary)',
              }}
            >
              <ShieldAlert size={20} />
              <div>
                <p className="status-banner-title">
                  {active.length} appareil(s) en alerte
                </p>
                <p className="status-banner-sub">
                  <Link to="/alerts" style={{ color: 'inherit', textDecoration: 'underline' }}>
                    Voir les alertes
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <div className="status-banner">
              <ShieldCheck size={20} />
              <div>
                <p className="status-banner-title">
                  {onlineCount} appareil(s) en ligne sur {devices.length}
                </p>
                <p className="status-banner-sub">Aucune anomalie détectée pour l'instant</p>
              </div>
            </div>
          )}

          {/* Grille des fiches capteur : un clic ouvre le détail de l'appareil */}
          <div className="sensor-grid">
            {devices.map((device) => (
              <DashboardSensorCard key={device.id} device={device} />
            ))}
          </div>

          {/* ===== Derniers événements des appareils dont l'historique est autorisé ===== */}
          {historyDevices.length > 0 && (
            <div className="recent-events-card">
              <h3>Derniers événements</h3>

              {recentEvents.length === 0 ? (
                <p className="recent-events-note">Aucun événement enregistré pour le moment.</p>
              ) : (
                recentEvents.map((event) => (
                  // Un clic sur une ligne ouvre l'historique de l'appareil concerné
                  <Link
                    key={event.id}
                    to={`/devices/${event.device_id}/history`}
                    className="recent-event-row"
                  >
                    <div>
                      <p className="recent-event-name">{deviceName(event.device_id)}</p>
                      <p className="recent-event-date">
                        {formatDate(event.occurred_at)} à {formatTime(event.occurred_at)}
                      </p>
                    </div>
                    <span className={`recent-event-level recent-event-level-${event.level}`}>
                      {LEVEL_LABELS[event.level]}
                    </span>
                  </Link>
                ))
              )}
            </div>
          )}

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