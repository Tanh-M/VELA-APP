import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, X, MoreVertical, Sliders, Trash2, History, Users } from 'lucide-react';
import SensorCard from '../components/SensorCard/SensorCard';
import DeviceThresholdModal from '../components/DeviceThresholdModal/DeviceThresholdModal';
import { useDevices } from '../hooks/useDevices';
import { useSensor } from '../hooks/useSensors';
// AJOUT : rôle et permissions de l'utilisateur
import { useInstallation } from '../context/InstallationContext';
// AJOUT : génération du jeton secret du détecteur
import { generateDeviceToken } from '../utils/deviceToken';
import './Devices.css';

// Indique si un appareil possède au moins un seuil personnalisé
function hasCustomThresholds(device) {
  return [
    device.temp_moyen,
    device.temp_critique,
    device.smoke_moyen,
    device.smoke_critique,
    device.gas_moyen,
    device.gas_critique,
  ].some((value) => value !== null && value !== undefined);
}

// Récupère et affiche les dernières mesures d'un appareil
function DeviceSensorCard({ device }) {
  const { reading, error } = useSensor(device.id);

  return (
    <>
      <SensorCard
        name={device.name}
        isOnline={device.is_online}
        temperature={reading?.temperature ?? null}
        smokeLevel={reading?.smoke_level ?? null}
        gasLevel={reading?.gas_level ?? null}
        flameDetected={reading?.flame_detected ?? false}
      />

      {error && (
        <p role="alert">
          Impossible de charger les mesures : {error}
        </p>
      )}
    </>
  );
}

function Devices() {
  const {
    devices,
    loading,
    addDevice,
    deleteDevice,
    refreshDevices,
  } = useDevices();

  // AJOUT : what can the user do ? (can = a-t-il cette permission pour cette installation)
  // getRole = 'admin' / 'member' ; canAddDevice = peut-il ajouter un appareil
  const { can, getRole, canAddDevice } = useInstallation();

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);

  // AJOUT : jeton du détecteur qui vient d'être créé (affiché une seule fois)
  const [createdToken, setCreatedToken] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // Outil de navigation vers d'autres pages (détail, historique)
  const navigate = useNavigate();

  // Ouvre la fenêtre des seuils si l'URL contient ?edit=<id>
  // CHANGEMENT : uniquement si l'utilisateur a le droit de modifier les seuils
  useEffect(() => {
    const editId = searchParams.get('edit');

    if (!editId || devices.length === 0) return;

    const target = devices.find((device) => device.id === editId);

    if (target && can(target.installation_id, 'edit_thresholds')) {
      setEditingDevice(target);
    }

    setSearchParams({}, { replace: true });
  }, [searchParams, devices, setSearchParams, can]);

  // Ajoute un détecteur
  // CHANGEMENT : génère un jeton, n'enregistre que son empreinte, puis affiche le jeton
  async function handleAddDevice(e) {
    e.preventDefault();

    if (!newName.trim()) return;

    setIsSubmitting(true);

    try {
      const { token, tokenHash } = await generateDeviceToken();
      await addDevice(newName.trim(), tokenHash);
      setCreatedToken(token); // la fenêtre passe à l'écran « jeton »
      setNewName('');
    } catch (err) {
      alert("Erreur lors de l'ajout : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // AJOUT : ferme la fenêtre d'ajout (le jeton disparaît pour toujours)
  function closeForm() {
    setShowForm(false);
    setCreatedToken(null);
  }

  // Supprime un détecteur après confirmation
  async function handleDeleteDevice(device) {
    setOpenMenuId(null);

    const confirmed = window.confirm(
      `Supprimer le détecteur « ${device.name} » ? Toutes ses mesures seront aussi supprimées. Cette action est irréversible.`
    );

    if (!confirmed) return;

    try {
      await deleteDevice(device.id);
    } catch (err) {
      alert('Erreur lors de la suppression : ' + err.message);
    }
  }

  return (
    <div className="devices-page">
      <div className="devices-header">
        <div>
          <h1>Appareils</h1>
          <p className="devices-subtitle">
            Gérez vos détecteurs installés
          </p>
        </div>

        {/* CHANGEMENT : le bouton n'apparaît que si l'utilisateur peut ajouter un appareil */}
        {canAddDevice && (
          <button
            className="add-device-btn"
            onClick={() => setShowForm(true)}
          >
            <Plus size={16} />
            Ajouter un détecteur
          </button>
        )}
      </div>

      {/* Fenêtre d'ajout d'un détecteur */}
      {showForm && (
        <div
          className="device-form-backdrop"
          // Sur l'écran du jeton, on ne ferme pas par un clic à côté (pour ne pas le perdre)
          onClick={createdToken ? undefined : closeForm}
        >
          {createdToken ? (
            // Écran « jeton » : à copier dans le code de l'ESP32
            <div className="device-form" onClick={(e) => e.stopPropagation()}>
              <div className="device-form-header">
                <h3>Détecteur créé</h3>
              </div>

              <p className="device-token-help">
                Copiez ce jeton dans le code de votre ESP32. Il ne sera
                <strong> plus jamais affiché</strong>.
              </p>

              <code className="device-token">{createdToken}</code>

              <button
                type="button"
                className="auth-submit-btn"
                onClick={() => navigator.clipboard.writeText(createdToken)}
              >
                Copier le jeton
              </button>

              <button
                type="button"
                className="device-token-done"
                onClick={closeForm}
              >
                J'ai copié le jeton, terminer
              </button>
            </div>
          ) : (
            <form
              className="device-form"
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleAddDevice}
            >
              <div className="device-form-header">
                <h3>Nouveau détecteur</h3>

                <button type="button" onClick={closeForm}>
                  <X size={18} />
                </button>
              </div>

              <label>
                Nom / emplacement
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex : Garage, Cuisine..."
                  required
                  autoFocus
                />
              </label>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Ajout...' : 'Ajouter'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Fenêtre de modification des seuils */}
      {editingDevice && (
        <DeviceThresholdModal
          device={editingDevice}
          onClose={() => setEditingDevice(null)}
          onSaved={refreshDevices}
        />
      )}

      {/* Ferme le menu si l'utilisateur clique ailleurs */}
      {openMenuId && (
        <div
          className="device-menu-overlay"
          onClick={() => setOpenMenuId(null)}
        />
      )}

      {loading ? (
        <p className="devices-loading">Chargement...</p>
      ) : devices.length === 0 ? (
        <p className="no-devices">
          {/* CHANGEMENT : message différent si l'utilisateur ne peut pas ajouter d'appareil */}
          {canAddDevice
            ? "Aucun détecteur pour l'instant. Ajoutez-en un pour commencer."
            : "Aucun détecteur partagé avec vous pour l'instant."}
        </p>
      ) : (
        <div className="sensor-grid">
          {devices.map((device) => {
            // AJOUT : droits de l'utilisateur sur CET appareil (selon son installation)
            const canHistory = can(device.installation_id, 'view_history');
            const canThresholds = can(device.installation_id, 'edit_thresholds');
            const canDelete = can(device.installation_id, 'manage_devices');

            // Le menu "⋮" n'existe que si au moins une option est permise
            const hasMenu = canHistory || canThresholds || canDelete;

            // Appareil partagé par quelqu'un d'autre (l'utilisateur y est simple membre)
            const isShared = getRole(device.installation_id) === 'member';

            return (
              // Un clic sur la carte ouvre la page de détail (graphe 24h)
              <div
                key={device.id}
                className="device-card-wrapper"
                onClick={() => navigate(`/devices/${device.id}`)}
              >
                {hasMenu && (
                  <button
                    className="device-menu-btn"
                    onClick={(e) => {
                      // Le clic sur ⋮ ne doit pas ouvrir la page de détail
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === device.id ? null : device.id);
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>
                )}

                {/* Menu de gestion de l'appareil : chaque option dépend d'un droit */}
                {hasMenu && openMenuId === device.id && (
                  // Un clic dans le menu ne doit pas non plus ouvrir la page de détail
                  <div className="device-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                    {canHistory && (
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          navigate(`/devices/${device.id}/history`);
                        }}
                      >
                        <History size={14} />
                        Consulter l'historique
                      </button>
                    )}

                    {canThresholds && (
                      <button
                        onClick={() => {
                          setEditingDevice(device);
                          setOpenMenuId(null);
                        }}
                      >
                        <Sliders size={14} />
                        Modifier les seuils
                      </button>
                    )}

                    {canDelete && (
                      <button
                        className="device-menu-danger"
                        onClick={() => handleDeleteDevice(device)}
                      >
                        <Trash2 size={14} />
                        Supprimer l'appareil
                      </button>
                    )}
                  </div>
                )}

                {/* Carte et dernières mesures du capteur */}
                <DeviceSensorCard device={device} />

                {/* Indique si l'appareil possède des seuils personnalisés */}
                {hasCustomThresholds(device) && (
                  <p className="device-custom-tag">
                    <Sliders size={12} />
                    Seuils personnalisés
                  </p>
                )}

                {/* AJOUT : étiquette pour un appareil partagé avec l'utilisateur */}
                {isShared && (
                  <p className="device-custom-tag">
                    <Users size={12} />
                    Accès partagé
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Devices;