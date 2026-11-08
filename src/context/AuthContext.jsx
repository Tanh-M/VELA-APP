import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
// AJOUT : efface les données mémorisées pour le mode hors connexion
import { clearOfflineCache } from '../utils/offlineCache';

const AuthContext = createContext();

// AJOUT : relit l'utilisateur mémorisé par Supabase sur l'appareil.
// Sert hors connexion, quand le jeton est expiré et ne peut pas être renouvelé.
function readStoredUser() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const stored = JSON.parse(localStorage.getItem(key));
        return stored?.user ?? null;
      }
    }
  } catch {
    // ignoré
  }
  return null;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCurrentUser(session.user);
        setIsAuthenticated(true);
      } else if (!navigator.onLine) {
        // CHANGEMENT : hors connexion, on garde l'utilisateur mémorisé sur l'appareil
        const storedUser = readStoredUser();
        setCurrentUser(storedUser);
        setIsAuthenticated(!!storedUser);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // CHANGEMENT : hors connexion, une session absente ne veut pas dire "déconnecté"
      // (le jeton ne peut simplement pas être renouvelé). Seule une vraie déconnexion compte.
      if (!session && event !== 'SIGNED_OUT' && !navigator.onLine) return;

      setCurrentUser(session?.user ?? null);
      setIsAuthenticated(!!session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function register(fullName, email, password) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
  }

  async function logout() {
    // Hors connexion, la déconnexion se fait seulement sur cet appareil
    await supabase.auth.signOut({ scope: navigator.onLine ? 'global' : 'local' });
    // Efface les dernières données mémorisées pour le mode hors connexion
    clearOfflineCache();
  }

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}