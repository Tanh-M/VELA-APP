import { Link } from 'react-router-dom';
import { Home, LayoutDashboard, Cpu, Bell, Settings as SettingsIcon, X } from 'lucide-react';
import logo from '../../assets/icons/logo-sentinel.svg';
import './Sidebar.css';

// Sidebar = menu de navigation latéral, visible sur toutes les pages internes
function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Fond sombre affiché derrière le menu, uniquement sur mobile quand il est ouvert */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <img src={logo} alt="Vela" className="logo-icon" />
          <span className="logo-text">Vela</span>
          <button className="sidebar-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Liens de navigation. "Profil" n'y est pas : accessible via l'avatar Navbar */}
        <nav className="sidebar-nav">
          <Link to="/" className="sidebar-link" onClick={onClose}>
            <Home size={18} />
            <span>Accueil</span>
          </Link>

          <Link to="/dashboard" className="sidebar-link" onClick={onClose}>
            <LayoutDashboard size={18} />
            <span>Tableau de bord</span>
          </Link>

          <Link to="/devices" className="sidebar-link" onClick={onClose}>
            <Cpu size={18} />
            <span>Appareils</span>
          </Link>

          <Link to="/alerts" className="sidebar-link" onClick={onClose}>
            <Bell size={18} />
            <span>Alertes</span>
          </Link>

          <Link to="/parametres" className="sidebar-link" onClick={onClose}>
            <SettingsIcon size={18} />
            <span>Paramètres</span>
          </Link>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;