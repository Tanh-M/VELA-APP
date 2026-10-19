import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, History } from 'lucide-react';
import SensorCard from '../components/SensorCard/SensorCard';
import Chart from '../components/Chart/Chart';
import { useDevices } from '../hooks/useDevices';
import { useSensor } from '../hooks/useSensors';
import { getMockReadings } from '../data/mockReadings';
import './DeviceDetail.css';

function DeviceDetail() {
  // ===== 1. Quel appareil ? L'id vient de l'URL : /devices/:deviceId =====
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const { devices, loading } = useDevices();
  const device = devices.find((d) => d.id === deviceId);

  // ===== 2. Dernière mesure réelle de cet appareil (Supabase) =====
  const { reading } = useSensor(deviceId);

  // ===== 3. Données du graphe =====
  // TEMPORAIRE : fausses mesures. Plus tard : lecture de sensor_readings (dernières 24h).
  const chartData = useMemo(() => getMockReadings(), []);

  // ===== 4. Cas particuliers : chargement / appareil introuvable =====
  if (loading) return <p className="detail-loading">Chargement...</p>;

  if (!device) {
    return (
      <div className="detail-page">
        <p className="detail-empty">Cet appareil est introuvable.</p>
        <button className="detail-back-btn" onClick={() => navigate('/devices')}>
          <ArrowLeft size={16} /> Retour aux appareils
        </button>
      </div>
    );
  }

  return (
    <div className="detail-page fade-in-up">
      {/* navigate(-1) : revient à la page d'où l'on vient (tableau de bord ou appareils) */}
      <button className="detail-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Retour
      </button>

      {/* ===== En-tête : nom de l'appareil + bouton historique ===== */}
      <div className="detail-header">
        <div>
          <h1>{device.name}</h1>
          <p className="detail-subtitle">Mesures et évolution de ce détecteur</p>
        </div>

        <button
          className="detail-history-btn"
          onClick={() => navigate(`/devices/${device.id}/history`)}
        >
          <History size={16} />
          Consulter l'historique
        </button>
      </div>

      {/* ===== Dernières mesures (vraies données Supabase) ===== */}
      <div className="detail-card">
        <SensorCard
          name={device.name}
          isOnline={device.is_online}
          temperature={reading?.temperature ?? null}
          smokeLevel={reading?.smoke_level ?? null}
          gasLevel={reading?.gas_level ?? null}
          flameDetected={reading?.flame_detected ?? false}
        />
      </div>

      {/* ===== Graphe des 24 dernières heures de CET appareil ===== */}
      <Chart data={chartData} />
      <p className="detail-demo-note">
        Graphe en données de démonstration, en attendant les mesures du système embarqué.
      </p>
    </div>
  );
}

export default DeviceDetail;