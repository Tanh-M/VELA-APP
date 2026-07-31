import { Link } from 'react-router-dom';
import { Home, LayoutDashboard, Cpu, Bell, User, X } from 'lucide-react';
import logo from '../../assets/icons/logo-sentinel.svg';
import './Sidebar.css';

function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <img src={logo} alt="Sentinel" className="logo-icon" />
          <span className="logo-text">Sentinel</span>
          <button className="sidebar-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

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
          <Link to="/profile" className="sidebar-link" onClick={onClose}>
            <User size={18} />
            <span>Profil</span>
          </Link>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;