import { Wifi, WifiOff, Thermometer, CloudFog, Wind, Flame } from 'lucide-react';
import './SensorCard.css';

// Arrondit une mesure pour l'affichage : "26.7107397188351" devient "26,7"
// decimals = nombre de chiffres après la virgule. Renvoie "-" si la mesure est absente.
function formatValue(value, decimals) {
  if (value === null || value === undefined) return '-';
  return Number(value).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

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
            {/* Température : 1 décimale (ex. 26,7 °C) */}
            <span>{formatValue(temperature, 1)} °C</span>
          </div>
          <div className="sensor-value">
            <CloudFog size={16} />
            {/* Fumée : nombre entier (ex. 6 %) */}
            <span>{formatValue(smokeLevel, 0)}% fumée</span>
          </div>
          <div className="sensor-value">
            <Wind size={16} />
            {/* Gaz : nombre entier (ex. 3 ppm) */}
            <span>{formatValue(gasLevel, 0)} ppm gaz</span>
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