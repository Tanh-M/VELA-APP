import { useNavigate } from 'react-router-dom';
import { Bell, User, Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { generateAlerts } from '../../utils/alertRules';
import { mockSensors } from '../../data/mockSensors';
import './Navbar.css';

function Navbar({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Notifications système classiques (Niveau 1 : app ouverte)
  useNotifications();

  // Notifications push réelles (Niveau 2 : même app fermée), maintenant possible
  // grâce au déploiement HTTPS sur Vercel
  usePushNotifications();

  const alertCount = generateAlerts(mockSensors).length;
  const displayName = currentUser?.user_metadata?.full_name || currentUser?.email || 'Utilisateur';

  return (
    <header className="navbar">
      <div className="navbar-title">
        <button className="navbar-menu-btn" onClick={onMenuClick}>
          <Menu size={22} />
        </button>
        <h2>Tableau de bord</h2>
      </div>

      <div className="navbar-actions">
        <button className="navbar-icon-btn" onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <button className="navbar-icon-btn navbar-bell" onClick={() => navigate('/alerts')}>
          <Bell size={20} />
          {alertCount > 0 && <span className="navbar-badge">{alertCount}</span>}
        </button>

        <button className="navbar-user" onClick={() => navigate('/profile')}>
          <div className="navbar-avatar">
            <User size={16} />
          </div>
          <span className="navbar-username">{displayName}</span>
        </button>
      </div>
    </header>
  );
}

export default Navbar;