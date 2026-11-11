// import est une pièce du graphique qu'on assemble ensemble, comme des blocs LEGO
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Chart.css';

// Une mesure est « présente » si elle a au moins une valeur sur la période
function hasValues(data, key) {
  return data.some((point) => point[key] !== null && point[key] !== undefined);
}

// Écrit une liste en français : "Température et fumée"
function joinLabels(labels) {
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} et ${labels[labels.length - 1]}`;
}

function Chart({ data }) {
  // Quelles courbes ont réellement des données ?
  const hasTemp = hasValues(data, 'temperature');
  const hasSmoke = hasValues(data, 'smoke');
  const hasGas = hasValues(data, 'gas');

  // Mesures indisponibles : affichées sous le graphe au lieu de tracer des courbes vides
  const missing = [];
  if (!hasTemp) missing.push('température');
  if (!hasSmoke) missing.push('fumée');
  if (!hasGas) missing.push('gaz');

  // Aucune mesure du tout : message à la place du graphe
  if (missing.length === 3) {
    return (
      <div className="chart-card">
        <h3>Évolution des mesures - 24 dernières heures</h3>
        <p className="chart-unavailable">Aucune mesure disponible pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <h3>Évolution des mesures - 24 dernières heures</h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" style={{ stopColor: '#185FA5', stopOpacity: 0.35 }} />
              <stop offset="95%" style={{ stopColor: '#185FA5', stopOpacity: 0 }} />
            </linearGradient>
            <linearGradient id="colorSmoke" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D85A30" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#D85A30" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#639922" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#639922" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontSize: '0.85rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          />

          {/* Légende du graphe : elle ne montre que les courbes tracées */}
          <Legend
            content={({ payload }) => (
              <div className="custom-legend">
                {payload.map((entry, index) => (
                  <span key={index} className="legend-badge" style={{ backgroundColor: `${entry.color}22`, color: entry.color }}>
                    <span className="legend-dot" style={{ backgroundColor: entry.color }} />
                    {entry.value}
                  </span>
                ))}
              </div>
            )}
          />

          {/* Chaque courbe n'est tracée que si le capteur a fourni des données.
              connectNulls : une heure sans mesure ne coupe pas la courbe. */}
          {hasTemp && (
            <Area type="monotone" dataKey="temperature" name="Température (°C)" stroke="#185FA5" strokeWidth={2.5} fill="url(#colorTemp)" activeDot={{ r: 5 }} connectNulls />
          )}
          {hasSmoke && (
            <Area type="monotone" dataKey="smoke" name="Fumée (%)" stroke="#D85A30" strokeWidth={2.5} fill="url(#colorSmoke)" activeDot={{ r: 5 }} connectNulls />
          )}
          {hasGas && (
            <Area type="monotone" dataKey="gas" name="Gaz (ppm)" stroke="#639922" strokeWidth={2.5} fill="url(#colorGas)" activeDot={{ r: 5 }} connectNulls />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Mesures sans données : on le dit clairement plutôt que de les cacher en silence */}
      {missing.length > 0 && (
        <p className="chart-unavailable">
          {joinLabels(missing).charAt(0).toUpperCase() + joinLabels(missing).slice(1)} :{' '}
          {missing.length > 1 ? 'indisponibles' : 'indisponible'} pour le moment.
        </p>
      )}
    </div>
  );
}

export default Chart;