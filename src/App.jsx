// Composant racine : assemble les Providers (thème, authentification) et la mise en page
import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import Router from './routes/Router';
import Sidebar from './components/Sidebar/Sidebar';
import Navbar from './components/Navbar/Navbar';
import SplashScreen from './components/SplashScreen/SplashScreen';
// AJOUT 1 : useAuth, pour savoir si l'utilisateur est déjà connecté
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

// Pages "publiques" : elles n'affichent JAMAIS la Sidebar ni la Navbar
// (chacune gère sa propre mise en page)
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/email-confirmed',
  '/faq',
];

// Composant interne : useLocation() doit être appelé DANS BrowserRouter
function AppLayout() {
  // Ouverture de la Sidebar sur mobile (menu hamburger)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const isPublicPage = PUBLIC_ROUTES.includes(location.pathname);

  // AJOUT 2 : à l'OUVERTURE de l'application, un utilisateur déjà connecté arrive
  // directement sur son tableau de bord (comme la liste des discussions sur WhatsApp).
  // Cela ne se produit qu'une seule fois : ensuite, le lien "Accueil" du menu
  // continue de mener à la page d'accueil normalement.
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const startupRedirectDone = useRef(false);

  useEffect(() => {
    // On attend que Supabase ait fini de vérifier la session
    if (loading || startupRedirectDone.current) return;
    startupRedirectDone.current = true;

    if (isAuthenticated && location.pathname === '/') {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, isAuthenticated, location.pathname, navigate]);

  function toggleSidebar() {
    setIsSidebarOpen((prev) => !prev);
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  // Page publique : uniquement le contenu de la page
  if (isPublicPage) {
    return (
      <main className="app-page-public">
        <Router />
      </main>
    );
  }

  // Page interne : Sidebar + Navbar + contenu
  return (
    <div className="app-layout">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="app-content">
        <Navbar onMenuClick={toggleSidebar} />
        <main className="app-page">
          <Router />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      {/* Écran de démarrage : s'affiche à chaque ouverture, par-dessus toute l'application */}
      <SplashScreen />

      <AuthProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;