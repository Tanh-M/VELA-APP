import { Wifi, WifiOff, Thermometer, CloudFog, Wind, Flame } from 'lucide-react';
import './SensorCard.css';

// Une mesure est « absente » si le capteur n'a rien envoyé (null) ou n'existe pas
function isMissing(value) {
  return value === null || value === undefined;
}

// Arrondit une mesure pour l'affichage : "26.7107397188351" devient "26,7"
// decimals = nombre de chiffres après la virgule.
function formatValue(value, decimals) {
  return Number(value).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

// Une ligne de mesure : la valeur si elle existe, sinon « <nom> indisponible » en grisé.
// Une mesure manquante n'empêche donc plus d'afficher les autres.
function SensorRow({ icon: Icon, label, value, decimals, suffix }) {
  const unavailable = isMissing(value);

  return (
    <div className={`sensor-value${unavailable ? ' sensor-value-unavailable' : ''}`}>
      <Icon size={16} />
      {unavailable ? (
        <span title={`${label} : données indisponibles pour le moment`}>
          {label} indisponible
        </span>
      ) : (
        <span>
          {formatValue(value, decimals)}
          {suffix}
        </span>
      )}
    </div>
  );
}

function SensorCard({ name, isOnline, temperature, smokeLevel, gasLevel, flameDetected }) {
  // Message global seulement si AUCUNE mesure n'est disponible
  const noData = isMissing(temperature) && isMissing(smokeLevel) && isMissing(gasLevel);

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

      {noData ? (
        <p className="sensor-no-data">En attente de données du capteur...</p>
      ) : (
        <div className="sensor-card-values">
          {/* Température : 1 décimale (ex. 26,7 °C) */}
          <SensorRow
            icon={Thermometer}
            label="Température"
            value={temperature}
            decimals={1}
            suffix=" °C"
          />
          {/* Fumée : nombre entier (ex. 6 %) */}
          <SensorRow
            icon={CloudFog}
            label="Fumée"
            value={smokeLevel}
            decimals={0}
            suffix="% fumée"
          />
          {/* Gaz : nombre entier (ex. 3 ppm) */}
          <SensorRow
            icon={Wind}
            label="Gaz"
            value={gasLevel}
            decimals={0}
            suffix=" ppm gaz"
          />
          <div className="sensor-value">
            <Flame size={16} color={flameDetected ? 'var(--danger)' : 'var(--text-secondary)'} />
            <span>{flameDetected ? 'Flamme détectée' : 'Aucune flamme'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SensorCard;