import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, X, MoreVertical, Sliders, Trash2, History } from 'lucide-react';
import SensorCard from '../components/SensorCard/SensorCard';
import DeviceThresholdModal from '../components/DeviceThresholdModal/DeviceThresholdModal';
import { useDevices } from '../hooks/useDevices';
import { useSensor } from '../hooks/useSensors';
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

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // Outil de navigation vers d'autres pages (détail, historique)
  const navigate = useNavigate();

  // Ouvre la fenêtre des seuils si l'URL contient ?edit=<id>
  useEffect(() => {
    const editId = searchParams.get('edit');

    if (!editId || devices.length === 0) return;

    const target = devices.find((device) => device.id === editId);

    if (target) setEditingDevice(target);

    setSearchParams({}, { replace: true });
  }, [searchParams, devices, setSearchParams]);

  // Ajoute un détecteur
  async function handleAddDevice(e) {
    e.preventDefault();

    if (!newName.trim()) return;

    setIsSubmitting(true);

    try {
      await addDevice(newName.trim());
      setNewName('');
      setShowForm(false);
    } catch (err) {
      alert("Erreur lors de l'ajout : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
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

        <button
          className="add-device-btn"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} />
          Ajouter un détecteur
        </button>
      </div>

      {/* Fenêtre d'ajout d'un détecteur */}
      {showForm && (
        <div
          className="device-form-backdrop"
          onClick={() => setShowForm(false)}
        >
          <form
            className="device-form"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleAddDevice}
          >
            <div className="device-form-header">
              <h3>Nouveau détecteur</h3>

              <button
                type="button"
                onClick={() => setShowForm(false)}
              >
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
          Aucun détecteur pour l'instant. Ajoutez-en un pour commencer.
        </p>
      ) : (
        <div className="sensor-grid">
          {devices.map((device) => (
            // Un clic sur la carte ouvre la page de détail (graphe 24h)
            <div
              key={device.id}
              className="device-card-wrapper"
              onClick={() => navigate(`/devices/${device.id}`)}
            >
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

              {/* Menu de gestion de l'appareil */}
              {openMenuId === device.id && (
                // Un clic dans le menu ne doit pas non plus ouvrir la page de détail
                <div className="device-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setOpenMenuId(null);
                      navigate(`/devices/${device.id}/history`);
                    }}
                  >
                    <History size={14} />
                    Consulter l'historique
                  </button>

                  <button
                    onClick={() => {
                      setEditingDevice(device);
                      setOpenMenuId(null);
                    }}
                  >
                    <Sliders size={14} />
                    Modifier les seuils
                  </button>

                  <button
                    className="device-menu-danger"
                    onClick={() => handleDeleteDevice(device)}
                  >
                    <Trash2 size={14} />
                    Supprimer l'appareil
                  </button>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Devices;