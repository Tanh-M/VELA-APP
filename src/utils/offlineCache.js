// Mémoire locale des dernières données reçues (sert au mode hors connexion).
// Les données sont rangées par utilisateur, et effacées à la déconnexion.
const PREFIX = 'vela-cache:';
const SYNC_KEY = `${PREFIX}last-sync`;

// Enregistre des données pour un utilisateur
export function saveCache(userId, key, data) {
  try {
    localStorage.setItem(`${PREFIX}${userId}:${key}`, JSON.stringify(data));
    localStorage.setItem(SYNC_KEY, String(Date.now()));
  } catch {
    // Stockage plein ou refusé : on ignore, l'application marche quand même
  }
}

// Relit des données ; renvoie { data } ou null s'il n'y a rien
export function loadCache(userId, key) {
  try {
    const raw = localStorage.getItem(`${PREFIX}${userId}:${key}`);
    return raw === null ? null : { data: JSON.parse(raw) };
  } catch {
    return null;
  }
}

// Date de la dernière mise à jour réussie (ou null)
export function getLastSync() {
  try {
    const value = Number(localStorage.getItem(SYNC_KEY));
    return value > 0 ? new Date(value) : null;
  } catch {
    return null;
  }
}

// Efface toutes les données mémorisées (appelé à la déconnexion)
export function clearOfflineCache() {
  try {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) toRemove.push(key);
    }
    toRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignoré
  }
}