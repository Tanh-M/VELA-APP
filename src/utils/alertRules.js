// Seuils d'alerte (valeurs de travail, à ajuster après calibration du capteur)
export const THRESHOLDS = {
  temperature: { moyen: 45, critique: 60 },
  smoke: { moyen: 25, critique: 50 },
  gas: { moyen: 30, critique: 60 },
};

// Analyse un capteur et renvoie la liste des alertes qu'il déclenche
export function getAlertsForSensor(sensor) {
  const alerts = [];

  if (sensor.flameDetected) {
    alerts.push({
      type: 'Flamme détectée',
      location: sensor.name,
      severity: 'critique',
    });
  }

  if (sensor.temperature >= THRESHOLDS.temperature.critique) {
    alerts.push({
      type: 'Température critique',
      location: sensor.name,
      severity: 'critique',
    });
  } else if (sensor.temperature >= THRESHOLDS.temperature.moyen) {
    alerts.push({
      type: 'Température élevée',
      location: sensor.name,
      severity: 'moyen',
    });
  }

  if (sensor.smokeLevel >= THRESHOLDS.smoke.critique) {
    alerts.push({
      type: 'Fumée critique',
      location: sensor.name,
      severity: 'critique',
    });
  } else if (sensor.smokeLevel >= THRESHOLDS.smoke.moyen) {
    alerts.push({
      type: 'Fumée détectée',
      location: sensor.name,
      severity: 'moyen',
    });
  }

  if (sensor.gasLevel >= THRESHOLDS.gas.critique) {
    alerts.push({
      type: 'Gaz critique',
      location: sensor.name,
      severity: 'critique',
    });
  } else if (sensor.gasLevel >= THRESHOLDS.gas.moyen) {
    alerts.push({
      type: 'Gaz détecté',
      location: sensor.name,
      severity: 'moyen',
    });
  }

  return alerts;
}

// Analyse tous les capteurs et renvoie une liste complète d'alertes
export function generateAlerts(sensors) {
  let allAlerts = [];
  let idCounter = 1;

  sensors.forEach((sensor) => {
    const sensorAlerts = getAlertsForSensor(sensor);
    sensorAlerts.forEach((alert) => {
      allAlerts.push({
        id: idCounter++,
        ...alert,
        time: "Aujourd'hui",
      });
    });
  });

  return allAlerts;
}