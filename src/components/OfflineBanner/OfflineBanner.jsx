import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { getLastSync } from '../../utils/offlineCache';
import './OfflineBanner.css';

// Bandeau affiché en bas de l'écran quand l'appareil n'a plus de connexion
function OfflineBanner() {
  const online = useOnlineStatus();

  if (online) return null;

  // Date de la dernière mise à jour réussie, si on la connaît
  const lastSync = getLastSync();
  const when = lastSync
    ? `${lastSync.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} à ${lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    : null;

  return (
    <div className="offline-banner" role="status">
      <WifiOff size={18} />
      <p>
        <strong>Hors connexion.</strong>
        {when && ` Données du ${when}.`} Les nouvelles mesures et les alertes n'arrivent plus
        tant que la connexion n'est pas rétablie.
      </p>
    </div>
  );
}

export default OfflineBanner;