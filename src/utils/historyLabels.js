// ============================================================
// Textes affichés pour l'historique (page + exports Excel/PDF).
// Un seul endroit : si tu veux changer un libellé, c'est ici.
// ============================================================

// Libellés des niveaux de gravité
export const LEVEL_LABELS = {
  normal: 'Normal',
  moyen: 'Moyen',
  critique: 'Critique',
};

// Libellés des actions déclenchées par le système
export const ACTION_LABELS = {
  app_alert: 'Alerte appli',
  alarm: 'Alarme déclenchée',
  water_jet: "Jet d'eau activé",
  gsm: 'Message GSM',
};

// Formate une date ISO en "19/10/2026"
export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR');
}

// Formate une date ISO en "14:32"
export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// Liste d'actions -> texte lisible ("Alerte appli, Message GSM") ou "Aucune"
export function formatActions(actions) {
  if (!actions || actions.length === 0) return 'Aucune';
  return actions.map((a) => ACTION_LABELS[a] || a).join(', ');
}