// Seuils par défaut (valeurs de travail, à ajuster après calibration du capteur)
const DEFAULT_THRESHOLDS = {
  temperature: { moyen: 45, critique: 60 },
  smoke: { moyen: 25, critique: 50 },
  gas: { moyen: 30, critique: 60 },
};

// Récupère les seuils actuels : ceux personnalisés par l'utilisateur (localStorage)
// s'ils existent, sinon on retombe sur les valeurs par défaut ci-dessus
export function getThresholds() {
  const saved = localStorage.getItem('velaThresholds');
  return saved ? JSON.parse(saved) : DEFAULT_THRESHOLDS;
}

// Sauvegarde de nouveaux seuils choisis par l'utilisateur depuis la page Paramètres
export function saveThresholds(thresholds) {
  localStorage.setItem('velaThresholds', JSON.stringify(thresholds));
}

// Analyse UN capteur et renvoie la liste des alertes qu'il déclenche actuellement,
// en se basant sur les seuils en vigueur (par défaut ou personnalisés)
export function getAlertsForSensor(sensor) {
  const THRESHOLDS = getThresholds();
  const alerts = [];

  // La flamme est un cas particulier : binaire, toujours critique si détectée
  if (sensor.flameDetected) {
    alerts.push({ type: 'Flamme détectée', location: sensor.name, severity: 'critique' });
  }

  // Température : on teste d'abord le seuil critique (le plus grave),
  // pour ne générer qu'UNE alerte par mesure, jamais les deux à la fois
  if (sensor.temperature >= THRESHOLDS.temperature.critique) {
    alerts.push({ type: 'Température critique', location: sensor.name, severity: 'critique' });
  } else if (sensor.temperature >= THRESHOLDS.temperature.moyen) {
    alerts.push({ type: 'Température élevée', location: sensor.name, severity: 'moyen' });
  }

  // Fumée : même logique
  if (sensor.smokeLevel >= THRESHOLDS.smoke.critique) {
    alerts.push({ type: 'Fumée critique', location: sensor.name, severity: 'critique' });
  } else if (sensor.smokeLevel >= THRESHOLDS.smoke.moyen) {
    alerts.push({ type: 'Fumée détectée', location: sensor.name, severity: 'moyen' });
  }

  // Gaz : même logique
  if (sensor.gasLevel >= THRESHOLDS.gas.critique) {
    alerts.push({ type: 'Gaz critique', location: sensor.name, severity: 'critique' });
  } else if (sensor.gasLevel >= THRESHOLDS.gas.moyen) {
    alerts.push({ type: 'Gaz détecté', location: sensor.name, severity: 'moyen' });
  }

  return alerts;
}

// Analyse TOUS les capteurs fournis et renvoie la liste complète d'alertes
export function generateAlerts(sensors) {
  let allAlerts = [];
  let idCounter = 1;

  sensors.forEach((sensor) => {
    const sensorAlerts = getAlertsForSensor(sensor);
    sensorAlerts.forEach((alert) => {
      // ...alert reprend toutes les propriétés déjà présentes (type, location, severity),
      // on ajoute juste un id unique et un horodatage
      allAlerts.push({ id: idCounter++, ...alert, time: "Aujourd'hui" });
    });
  });

  return allAlerts;
}