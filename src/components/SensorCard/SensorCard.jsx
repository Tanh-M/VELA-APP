import { Wifi, WifiOff, Thermometer, CloudFog, Wind, Flame } from 'lucide-react';
import './SensorCard.css';

function SensorCard({ name, isOnline, temperature, smokeLevel, gasLevel, flameDetected }) {
  const hasData = temperature !== null && temperature !== undefined;

  return (
    <div className="sensor-card">
      <div className="sensor-card-header">
        <h3>{name}</h3>
        {isOnline ? (
          <span className="status status-online">
            <Wifi size={14} /> En ligne
          </span>
        ) : (
          <span className="status status-offline">
            <WifiOff size={14} /> Hors ligne
          </span>
        )}
      </div>

      {hasData ? (
        <div className="sensor-card-values">
          <div className="sensor-value">
            <Thermometer size={16} />
            <span>{temperature} °C</span>
          </div>
          <div className="sensor-value">
            <CloudFog size={16} />
            <span>{smokeLevel}% fumée</span>
          </div>
          <div className="sensor-value">
            <Wind size={16} />
            <span>{gasLevel} ppm gaz</span>
          </div>
          <div className="sensor-value">
            <Flame size={16} color={flameDetected ? 'var(--danger)' : 'var(--text-secondary)'} />
            <span>{flameDetected ? 'Flamme détectée' : 'Aucune flamme'}</span>
          </div>
        </div>
      ) : (
        <p className="sensor-no-data">En attente de données du capteur...</p>
      )}
    </div>
  );
}

export default SensorCard;