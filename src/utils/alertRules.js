// Seuils par défaut, FIXES : ils s'appliquent à tout détecteur qui n'a pas de réglage
// personnalisé (valeurs de travail, à ajuster après calibration du capteur physique)
const DEFAULT_THRESHOLDS = {
  temperature: { moyen: 45, critique: 60 },
  smoke: { moyen: 25, critique: 50 },
  gas: { moyen: 30, critique: 60 },
};

// Renvoie les seuils par défaut. Ils ne sont plus modifiables depuis les Paramètres :
// la personnalisation se fait appareil par appareil (page Appareils).
export function getThresholds() {
  return DEFAULT_THRESHOLDS;
}

// Construit les seuils EFFECTIFS d'un appareil : ses valeurs personnalisées
// (colonnes de la table devices) si elles existent, sinon les seuils par défaut,
// colonne par colonne
export function getEffectiveThresholds(device) {
  const defaults = getThresholds();

  return {
    temperature: {
      moyen: device.temp_moyen ?? defaults.temperature.moyen,
      critique: device.temp_critique ?? defaults.temperature.critique,
    },
    smoke: {
      moyen: device.smoke_moyen ?? defaults.smoke.moyen,
      critique: device.smoke_critique ?? defaults.smoke.critique,
    },
    gas: {
      moyen: device.gas_moyen ?? defaults.gas.moyen,
      critique: device.gas_critique ?? defaults.gas.critique,
    },
  };
}

// Analyse UN capteur et renvoie ses alertes, selon SES seuils effectifs
export function getAlertsForSensor(sensor) {
  const THRESHOLDS = getEffectiveThresholds(sensor);
  const alerts = [];

  // La flamme est binaire : toujours critique si détectée
  if (sensor.flameDetected) {
    alerts.push({ type: 'Flamme détectée', location: sensor.name, severity: 'critique' });
  }

  // On teste d'abord le seuil critique : une seule alerte par mesure
  if (sensor.temperature >= THRESHOLDS.temperature.critique) {
    alerts.push({ type: 'Température critique', location: sensor.name, severity: 'critique' });
  } else if (sensor.temperature >= THRESHOLDS.temperature.moyen) {
    alerts.push({ type: 'Température élevée', location: sensor.name, severity: 'moyen' });
  }

  if (sensor.smokeLevel >= THRESHOLDS.smoke.critique) {
    alerts.push({ type: 'Fumée critique', location: sensor.name, severity: 'critique' });
  } else if (sensor.smokeLevel >= THRESHOLDS.smoke.moyen) {
    alerts.push({ type: 'Fumée détectée', location: sensor.name, severity: 'moyen' });
  }

  if (sensor.gasLevel >= THRESHOLDS.gas.critique) {
    alerts.push({ type: 'Gaz critique', location: sensor.name, severity: 'critique' });
  } else if (sensor.gasLevel >= THRESHOLDS.gas.moyen) {
    alerts.push({ type: 'Gaz détecté', location: sensor.name, severity: 'moyen' });
  }

  return alerts;
}

// Analyse TOUS les capteurs fournis et renvoie la liste complète des alertes
export function generateAlerts(sensors) {
  let allAlerts = [];
  let idCounter = 1;

  sensors.forEach((sensor) => {
    const sensorAlerts = getAlertsForSensor(sensor);
    sensorAlerts.forEach((alert) => {
      allAlerts.push({ id: idCounter++, ...alert, time: "Aujourd'hui" });
    });
  });

  return allAlerts;
}