// Seuils par défaut (valeurs de travail, à ajuster après calibration du capteur)
const DEFAULT_THRESHOLDS = {
  temperature: { moyen: 45, critique: 60 },
  smoke: { moyen: 25, critique: 50 },
  gas: { moyen: 30, critique: 60 },
};

// Récupère les seuils globaux par défaut (personnalisés ou non, depuis localStorage)
export function getThresholds() {
  const saved = localStorage.getItem('velaThresholds');
  return saved ? JSON.parse(saved) : DEFAULT_THRESHOLDS;
}

export function saveThresholds(thresholds) {
  localStorage.setItem('velaThresholds', JSON.stringify(thresholds));
}

// NOUVEAU : construit les seuils EFFECTIFS pour un appareil précis, en combinant
// ses éventuelles valeurs personnalisées (stockées sur l'appareil lui-même dans
// Supabase) avec les seuils globaux par défaut, colonne par colonne.
// Si l'appareil n'a AUCUNE personnalisation, on retombe entièrement sur les
// seuils par défaut.
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

// Analyse UN capteur et renvoie ses alertes, en utilisant SES seuils effectifs
// (personnalisés si définis, sinon les seuils globaux par défaut)
export function getAlertsForSensor(sensor) {
  const THRESHOLDS = getEffectiveThresholds(sensor);
  const alerts = [];

  if (sensor.flameDetected) {
    alerts.push({ type: 'Flamme détectée', location: sensor.name, severity: 'critique' });
  }

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