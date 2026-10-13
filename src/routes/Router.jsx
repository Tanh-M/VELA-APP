// Routeur principal : associe chaque URL à sa page
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import EmailConfirmed from '../pages/EmailConfirmed';
import FAQ from '../pages/FAQ';
import Dashboard from '../pages/Dashboard';
import Devices from '../pages/Devices';
import Alerts from '../pages/Alerts';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import ThresholdGuide from '../pages/ThresholdGuide';

// Réserve une page aux utilisateurs connectés.
// "loading" : tant que Supabase vérifie la session (rechargement, nouvel onglet),
// on n'affiche rien et on ne redirige pas, sinon l'utilisateur serait renvoyé à tort.
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" state={{ from: location }} />;
}

// Renvoie vers le tableau de bord un utilisateur déjà connecté qui visite Connexion/Inscription
function RedirectIfAuthenticated({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" /> : children;
}

function Router() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<RedirectIfAuthenticated><Login /></RedirectIfAuthenticated>} />
      <Route path="/register" element={<RedirectIfAuthenticated><Register /></RedirectIfAuthenticated>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/email-confirmed" element={<EmailConfirmed />} />
      <Route path="/faq" element={<FAQ />} />

      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/devices" element={<PrivateRoute><Devices /></PrivateRoute>} />
      <Route path="/alerts" element={<PrivateRoute><Alerts /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/parametres" element={<PrivateRoute><Settings /></PrivateRoute>} />
      {/* Nouvelle page : guide interactif des seuils d'alerte */}
      <Route path="/guide-seuils" element={<PrivateRoute><ThresholdGuide /></PrivateRoute>} />
    </Routes>
  );
}

export default Router;