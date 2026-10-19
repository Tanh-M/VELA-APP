import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, ChevronDown, FileSpreadsheet, FileText,
  Bell, Volume2, Droplets, MessageSquare, Flame,
} from 'lucide-react';
import { useDevices } from '../hooks/useDevices';
import { getMockHistory } from '../data/mockHistory';
import { exportToExcel, exportToPdf } from '../utils/exportHistory';
import {
  LEVEL_LABELS, ACTION_LABELS, formatDate, formatTime,
} from '../utils/historyLabels';
import './DeviceHistory.css';

// Icône associée à chaque action (pour les étiquettes de la colonne "Actions")
const ACTION_ICONS = {
  app_alert: Bell,
  alarm: Volume2,
  water_jet: Droplets,
  gsm: MessageSquare,
};

// Périodes proposées dans le filtre (durée en heures, null = tout afficher)
const PERIODS = [
  { value: '24h', label: '24 heures', hours: 24 },
  { value: '7d', label: '7 jours', hours: 24 * 7 },
  { value: '30d', label: '30 jours', hours: 24 * 30 },
  { value: 'all', label: 'Tout', hours: null },
];

// Niveaux proposés dans le filtre
const LEVELS = [
  { value: 'all', label: 'Tous' },
  { value: 'normal', label: 'Normal' },
  { value: 'moyen', label: 'Moyen' },
  { value: 'critique', label: 'Critique' },
];

function DeviceHistory() {
  // ===== 1. Quel appareil ? L'id vient de l'URL : /devices/:deviceId/history =====
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const { devices, loading } = useDevices();
  const device = devices.find((d) => d.id === deviceId);

  // ===== 2. États de la page : filtres + menu d'export =====
  const [period, setPeriod] = useState('7d');
  const [levelFilter, setLevelFilter] = useState('all');
  const [exportOpen, setExportOpen] = useState(false);

  // ===== 3. Données =====
  // TEMPORAIRE : fausses données. Plus tard on remplacera cette ligne
  // par un hook qui lit la table "device_events" de Supabase.
  const allEvents = useMemo(() => getMockHistory(deviceId), [deviceId]);

  // ===== 4. Application des filtres (période + niveau) =====
  const events = useMemo(() => {
    const selected = PERIODS.find((p) => p.value === period);
    const limit = selected.hours ? Date.now() - selected.hours * 3600 * 1000 : null;

    return allEvents.filter((e) => {
      const inPeriod = limit === null || new Date(e.occurred_at).getTime() >= limit;
      const inLevel = levelFilter === 'all' || e.level === levelFilter;
      return inPeriod && inLevel;
    });
  }, [allEvents, period, levelFilter]);

  // ===== 5. Export : on exporte exactement ce qui est affiché (filtres compris) =====
  function handleExport(type) {
    setExportOpen(false);
    if (events.length === 0) return;
    if (type === 'excel') exportToExcel(device.name, events);
    if (type === 'pdf') exportToPdf(device.name, events);
  }

  // ===== 6. Cas particuliers : chargement / appareil introuvable =====
  if (loading) return <p className="history-loading">Chargement...</p>;

  if (!device) {
    return (
      <div className="history-page">
        <p className="history-empty">Cet appareil est introuvable.</p>
        <button className="history-back-btn" onClick={() => navigate('/devices')}>
          <ArrowLeft size={16} /> Retour aux appareils
        </button>
      </div>
    );
  }

  return (
    <div className="history-page fade-in-up">
      {/* ===== En-tête : retour + titre à gauche, export à droite ===== */}
      <button className="history-back-btn" onClick={() => navigate('/devices')}>
        <ArrowLeft size={16} /> Retour aux appareils
      </button>

      <div className="history-header">
        <div>
          <h1>Historique : {device.name}</h1>
          <p className="history-subtitle">
            Événements enregistrés par ce détecteur
          </p>
        </div>

        {/* Bouton Exporter avec menu déroulant (Excel / PDF) */}
        <div className="history-export">
          <button
            className="history-export-btn"
            onClick={() => setExportOpen(!exportOpen)}
            disabled={events.length === 0}
          >
            <Download size={16} />
            Exporter
            <ChevronDown size={14} />
          </button>

          {exportOpen && (
            <>
              {/* Voile invisible : un clic ailleurs ferme le menu */}
              <div className="history-export-overlay" onClick={() => setExportOpen(false)} />
              <div className="history-export-menu">
                <button onClick={() => handleExport('excel')}>
                  <FileSpreadsheet size={15} /> Excel (.xlsx)
                </button>
                <button onClick={() => handleExport('pdf')}>
                  <FileText size={15} /> PDF
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== Filtres ===== */}
      <div className="history-filters">
        <label>
          Période
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </label>

        <label>
          Niveau
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </label>

        <span className="history-count">{events.length} événement(s)</span>
      </div>

      {/* ===== Tableau (ou message si rien à afficher) ===== */}
      {events.length === 0 ? (
        <p className="history-empty">Aucun événement pour ces filtres.</p>
      ) : (
        // history-table-wrapper : permet le défilement horizontal sur mobile
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Heure</th>
                <th>Temp. (°C)</th>
                <th>Fumée (%)</th>
                <th>Gaz (%)</th>
                <th>Flamme</th>
                <th>Niveau</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>{formatDate(e.occurred_at)}</td>
                  <td>{formatTime(e.occurred_at)}</td>
                  <td>{e.temperature ?? '-'}</td>
                  <td>{e.smoke_level ?? '-'}</td>
                  <td>{e.gas_level ?? '-'}</td>
                  <td>
                    {e.flame_detected ? (
                      <span className="history-flame"><Flame size={14} /> Oui</span>
                    ) : (
                      'Non'
                    )}
                  </td>

                  {/* Pastille de niveau : verte / ambre / rouge */}
                  <td>
                    <span className={`history-level history-level-${e.level}`}>
                      {LEVEL_LABELS[e.level]}
                    </span>
                  </td>

                  {/* Une étiquette par action déclenchée */}
                  <td>
                    {e.actions.length === 0 ? (
                      <span className="history-no-action">Aucune</span>
                    ) : (
                      <div className="history-actions">
                        {e.actions.map((action) => {
                          const Icon = ACTION_ICONS[action];
                          return (
                            <span key={action} className="history-action-tag">
                              <Icon size={12} /> {ACTION_LABELS[action]}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DeviceHistory;