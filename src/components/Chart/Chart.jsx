// import est une pièce du graphique qu'on assemble ensemble, comme des blocs LEGO
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Chart.css';

function Chart({ data }) {
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

          {/* Légende du graphe */}
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

          <Area type="monotone" dataKey="temperature" name="Température (°C)" stroke="#185FA5" strokeWidth={2.5} fill="url(#colorTemp)" activeDot={{ r: 5 }} />
          <Area type="monotone" dataKey="smoke" name="Fumée (%)" stroke="#D85A30" strokeWidth={2.5} fill="url(#colorSmoke)" activeDot={{ r: 5 }} />
          <Area type="monotone" dataKey="gas" name="Gaz (ppm)" stroke="#639922" strokeWidth={2.5} fill="url(#colorGas)" activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Chart;