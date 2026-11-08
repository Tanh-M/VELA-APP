import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveCache, loadCache } from '../utils/offlineCache';

// Hook : fonctionne comme useState, mais la valeur est AUSSI mémorisée sur l'appareil,
// pour être affichée quand il n'y a plus de connexion.
// - au démarrage : on relit la dernière valeur mémorisée de cet utilisateur ;
// - à chaque changement (donc après chaque chargement réussi) : on la mémorise.
// "key" identifie la donnée (ex. "devices"). Les valeurs sont rangées par utilisateur.
export function usePersistentState(key, initialValue) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const [value, setValue] = useState(initialValue);

  // On garde les dernières valeurs sous la main pour la fonction de mise à jour
  const initialRef = useRef(initialValue);
  const userRef = useRef(userId);
  const keyRef = useRef(key);
  userRef.current = userId;
  keyRef.current = key;

  // Dès que l'utilisateur est connu (ou que la clé change) : on relit la copie mémorisée.
  // S'il n'y en a pas, on revient à la valeur de départ (évite d'afficher les données
  // d'un autre appareil quand on change de page).
  useEffect(() => {
    if (!userId) return;
    const cached = loadCache(userId, key);
    setValue(cached ? cached.data : initialRef.current);
  }, [userId, key]);

  // Remplace setValue : même fonctionnement, avec en plus la mémorisation
  const setAndSave = useCallback((update) => {
    setValue((previous) => {
      const next = typeof update === 'function' ? update(previous) : update;
      if (userRef.current) saveCache(userRef.current, keyRef.current, next);
      return next;
    });
  }, []);

  return [value, setAndSave];
}