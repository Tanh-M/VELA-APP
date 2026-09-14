import { Link } from 'react-router-dom';
import { ShieldCheck, Circle, CheckCircle2 } from 'lucide-react';
import SensorCard from '../components/SensorCard/SensorCard';
import { useDevices } from '../hooks/useDevices';
import './Dashboard.css';

function Dashboard() {
  // Récupère les vrais appareils de l'utilisateur connecté depuis Supabase
  const { devices, loading } = useDevices();

  // Compte les appareils réellement en ligne, pour la bannière d'état système
  const onlineCount = devices.filter((d) => d.is_online).length;

  return (
    // fade-in-up : légère animation d'apparition (montée + fondu), définie dans index.css
    <div className="dashboard fade-in-up">
      <h1>Tableau de bord</h1>
      <p className="dashboard-subtitle">Vue d'ensemble de vos détecteurs</p>

      {loading ? (
        // Pendant le chargement des données depuis Supabase
        <p className="dashboard-loading">Chargement...</p>
      ) : devices.length === 0 ? (
        // Cas d'un nouvel utilisateur : aucun appareil enregistré pour l'instant
        <div className="dashboard-empty">
          <p>Vous n'avez pas encore de détecteur enregistré.</p>
          <Link to="/devices" className="auth-submit-btn dashboard-empty-btn">
            Ajouter mon premier détecteur
          </Link>
        </div>
      ) : (
        <>
          {/* Bannière d'état système : basée sur les VRAIES données (pas inventée) */}
          <div className="status-banner">
            <ShieldCheck size={20} />
            <div>
              <p className="status-banner-title">
                {onlineCount} appareil(s) en ligne sur {devices.length}
              </p>
              <p className="status-banner-sub">Aucune anomalie détectée pour l'instant</p>
            </div>
          </div>

          {/* Grille des fiches capteur, une par appareil réel */}
          <div className="sensor-grid">
            {devices.map((device) => (
              <SensorCard
                key={device.id}
                name={device.name}
                isOnline={device.is_online}
                temperature={null}
                smokeLevel={null}
                gasLevel={null}
                flameDetected={false}
              />
            ))}
          </div>

          {/* Checklist des prochaines étapes : reste utile tant que le matériel n'envoie rien */}
          <div className="next-steps-card">
            <h3>Prochaines étapes</h3>
            <div className="next-step-row">
              <CheckCircle2 size={16} className="step-done" />
              <span>Détecteur(s) enregistré(s)</span>
            </div>
            <div className="next-step-row">
              <Circle size={16} className="step-pending" />
              <span>Connecter le système embarqué</span>
            </div>
            <div className="next-step-row">
              <Circle size={16} className="step-pending" />
              <span>Recevoir vos premières données</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;