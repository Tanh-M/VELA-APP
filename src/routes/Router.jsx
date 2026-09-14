// Routeur principal : associe chaque URL à sa page
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import FAQ from '../pages/FAQ';
import Dashboard from '../pages/Dashboard';
import Devices from '../pages/Devices';
import Alerts from '../pages/Alerts';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';

// Empêche l'accès aux pages internes si l'utilisateur n'est pas connecté
function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return isAuthenticated ? children : <Navigate to="/login" state={{ from: location }} />;
}

// Empêche un utilisateur déjà connecté de revoir les formulaires Connexion/Inscription
// (pas de sens à se reconnecter alors qu'on l'est déjà) — mais PAS appliqué à Home,
// que l'utilisateur doit pouvoir revoir librement même connecté
function RedirectIfAuthenticated({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" /> : children;
}

function Router() {
  return (
    <Routes>
      {/* Home reste toujours accessible, connecté ou non, sans redirection automatique */}
      <Route path="/" element={<Home />} />

      {/* Connexion/Inscription : redirigent vers le Dashboard si déjà connecté */}
      <Route path="/login" element={<RedirectIfAuthenticated><Login /></RedirectIfAuthenticated>} />
      <Route path="/register" element={<RedirectIfAuthenticated><Register /></RedirectIfAuthenticated>} />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/faq" element={<FAQ />} />

      {/* Pages internes, protégées : redirection vers /login si non connecté */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/devices" element={<PrivateRoute><Devices /></PrivateRoute>} />
      <Route path="/alerts" element={<PrivateRoute><Alerts /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/parametres" element={<PrivateRoute><Settings /></PrivateRoute>} />
    </Routes>
  );
}

export default Router;