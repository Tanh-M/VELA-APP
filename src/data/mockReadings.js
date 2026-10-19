// ============================================================
// FICHIER TEMPORAIRE : fausses mesures sur 24h pour tester le graphe.
// Plus tard, on le remplacera par une lecture de la table sensor_readings.
// La forme { time, temperature, smoke, gas } est celle que Chart.jsx attend.
// ============================================================

export function getMockReadings() {
  const now = Date.now();
  const points = [];

  // 24 points : un par heure, du plus ancien (il y a 23h) au plus récent (maintenant)
  for (let i = 23; i >= 0; i--) {
    const date = new Date(now - i * 3600 * 1000);

    // Petite variation naturelle (sinus) autour d'une valeur de base
    let temperature = 25 + 4 * Math.sin(i / 3);
    let smoke = 5 + 3 * Math.sin(i / 2);
    let gas = 4 + 2 * Math.cos(i / 2);

    // Un pic simulé il y a 9 heures, pour que le graphe ne soit pas plat
    if (i >= 8 && i <= 10) {
      const boost = i === 9 ? 1 : 0.5;
      temperature += 22 * boost;
      smoke += 35 * boost;
      gas += 18 * boost;
    }

    points.push({
      time: `${date.getHours()}h`,
      temperature: Math.round(temperature * 10) / 10,
      smoke: Math.round(smoke * 10) / 10,
      gas: Math.round(gas * 10) / 10,
    });
  }

  return points;
}