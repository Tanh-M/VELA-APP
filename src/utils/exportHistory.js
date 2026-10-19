// ============================================================
// Export de l'historique en Excel (.xlsx) et en PDF.
// Tout se fait dans le navigateur, aucun serveur nécessaire.
//
// À installer une seule fois dans le terminal :
//   npm install xlsx jspdf jspdf-autotable
// ============================================================
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LEVEL_LABELS, formatDate, formatTime, formatActions } from './historyLabels';

// En-têtes des colonnes (identiques pour Excel et PDF)
const HEADERS = [
  'Date',
  'Heure',
  'Température (°C)',
  'Fumée (%)',
  'Gaz (%)',
  'Flamme',
  'Niveau',
  'Actions',
];

// Transforme la liste d'événements en tableau de lignes (tableau de tableaux)
function buildRows(events) {
  return events.map((e) => [
    formatDate(e.occurred_at),
    formatTime(e.occurred_at),
    e.temperature ?? '-',
    e.smoke_level ?? '-',
    e.gas_level ?? '-',
    e.flame_detected ? 'Oui' : 'Non',
    LEVEL_LABELS[e.level] || e.level,
    formatActions(e.actions),
  ]);
}

// Nom de fichier propre : "historique-cuisine-2026-10-19"
function buildFileName(deviceName, extension) {
  const safeName = deviceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const today = new Date().toISOString().slice(0, 10);
  return `historique-${safeName || 'appareil'}-${today}.${extension}`;
}

// ---------- EXPORT EXCEL ----------
export function exportToExcel(deviceName, events) {
  // 1ère ligne = en-têtes, puis une ligne par événement
  const sheet = XLSX.utils.aoa_to_sheet([HEADERS, ...buildRows(events)]);

  // Largeur de chaque colonne (en caractères)
  sheet['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 18 }, { wch: 11 },
    { wch: 10 }, { wch: 9 }, { wch: 11 }, { wch: 45 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Historique');
  XLSX.writeFile(workbook, buildFileName(deviceName, 'xlsx'));
}

// ---------- EXPORT PDF ----------
export function exportToPdf(deviceName, events) {
  // Paysage : le tableau a 8 colonnes, il serait trop serré en portrait
  const doc = new jsPDF({ orientation: 'landscape' });

  // Titre + sous-titre
  doc.setFontSize(16);
  doc.text(`Historique des événements : ${deviceName}`, 14, 16);
  doc.setFontSize(10);
  doc.text(`Exporté le ${formatDate(new Date().toISOString())} - ${events.length} événement(s)`, 14, 23);

  // Tableau
  autoTable(doc, {
    head: [HEADERS],
    body: buildRows(events),
    startY: 28,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [55, 65, 81] },
    // Colore la cellule "Niveau" (colonne n°6) selon la gravité
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        if (data.cell.raw === 'Critique') data.cell.styles.textColor = [200, 50, 30];
        if (data.cell.raw === 'Moyen') data.cell.styles.textColor = [190, 125, 10];
      }
    },
  });

  doc.save(buildFileName(deviceName, 'pdf'));
}