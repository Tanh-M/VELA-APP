import { useState } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import Router from './routes/Router';
import Sidebar from './components/Sidebar/Sidebar';
import Navbar from './components/Navbar/Navbar';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const isPublicPage = PUBLIC_ROUTES.includes(location.pathname);

  function toggleSidebar() {
    setIsSidebarOpen((prev) => !prev);
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  if (isPublicPage) {
    return (
      <main className="app-page-public">
        <Router />
      </main>
    );
  }

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