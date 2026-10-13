// Composant racine : assemble les Providers (thème, authentification) et la mise en page
import { useState } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import Router from './routes/Router';
import Sidebar from './components/Sidebar/Sidebar';
import Navbar from './components/Navbar/Navbar';
import { AuthProvider } from './context/AuthContext';
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
      <AuthProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;