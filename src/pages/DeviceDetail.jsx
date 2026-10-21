import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, History } from 'lucide-react';
import SensorCard from '../components/SensorCard/SensorCard';
import Chart from '../components/Chart/Chart';
import { useDevices } from '../hooks/useDevices';
import { useSensor } from '../hooks/useSensors';
import { useReadings24h } from '../hooks/useReadings';
import './DeviceDetail.css';

function DeviceDetail() {
  // ===== 1. Quel appareil ? L'id vient de l'URL : /devices/:deviceId =====
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const { devices, loading } = useDevices();
  const device = devices.find((d) => d.id === deviceId);

  // ===== 2. Dernière mesure réelle de cet appareil (Supabase) =====
  const { reading } = useSensor(deviceId);

  // ===== 3. Mesures des 24 dernières heures (Supabase), pour le graphe =====
  const { data: chartData, loading: chartLoading, error: chartError } = useReadings24h(deviceId);

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
      {chartError ? (
        <p role="alert" className="detail-no-data">
          Impossible de charger le graphe : {chartError}
        </p>
      ) : chartLoading ? (
        <p className="detail-no-data">Chargement du graphe...</p>
      ) : chartData.length === 0 ? (
        // Aucun relevé sur 24h : message à la place du graphe vide
        <p className="detail-no-data">
          Aucune mesure sur les dernières 24 heures. Le graphe apparaîtra dès que le
          système embarqué enverra des données.
        </p>
      ) : (
        <Chart data={chartData} />
      )}
    </div>
  );
}

export default DeviceDetail;