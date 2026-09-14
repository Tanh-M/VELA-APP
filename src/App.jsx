// Composant racine de l'application : assemble les Providers (thème, auth) et la mise en page
import { useState } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import Router from './routes/Router';
import Sidebar from './components/Sidebar/Sidebar';
import Navbar from './components/Navbar/Navbar';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

// Liste des pages "publiques" : celles qui ne doivent JAMAIS afficher Sidebar/Navbar
// (accessibles sans être connecté, avec leur propre mise en page autonome)
const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/faq'];

// Composant interne : gère la mise en page selon la page actuelle
// (doit être séparé de App car useLocation() nécessite d'être DANS BrowserRouter)
function AppLayout() {
  // État d'ouverture de la Sidebar sur mobile (menu hamburger)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Vérifie si l'URL actuelle fait partie des pages publiques
  const isPublicPage = PUBLIC_ROUTES.includes(location.pathname);

  function toggleSidebar() {
    setIsSidebarOpen((prev) => !prev);
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  // Sur une page publique : on affiche UNIQUEMENT le contenu de la page,
  // sans Sidebar ni Navbar (chaque page publique gère son propre en-tête)
  if (isPublicPage) {
    return (
      <main className="app-page-public">
        <Router />
      </main>
    );
  }

  // Sur une page interne (protégée) : Sidebar + Navbar + contenu de la page
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
    // ThemeProvider et AuthProvider englobent toute l'application,
    // pour que n'importe quel composant puisse accéder au thème et à l'utilisateur connecté
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