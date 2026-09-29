import { useState } from 'react';
import { Plus, X, MoreVertical, Sliders } from 'lucide-react';
import SensorCard from '../components/SensorCard/SensorCard';
import DeviceThresholdModal from '../components/DeviceThresholdModal/DeviceThresholdModal';
import { useDevices } from '../hooks/useDevices';
import './Devices.css';

function Devices() {
  const { devices, loading, addDevice } = useDevices();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Garde en mémoire quel menu "⋮" est actuellement ouvert (id de l'appareil, ou null)
  const [openMenuId, setOpenMenuId] = useState(null);
  // Garde en mémoire l'appareil dont on édite actuellement les seuils (ou null)
  const [editingDevice, setEditingDevice] = useState(null);

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

  return (
    <div className="devices-page">
      <div className="devices-header">
        <div>
          <h1>Appareils</h1>
          <p className="devices-subtitle">Gérez vos détecteurs installés</p>
        </div>
        <button className="add-device-btn" onClick={() => setShowForm(true)}>
          <Plus size={16} />
          Ajouter un détecteur
        </button>
      </div>

      {showForm && (
        <div className="device-form-backdrop" onClick={() => setShowForm(false)}>
          <form className="device-form" onClick={(e) => e.stopPropagation()} onSubmit={handleAddDevice}>
            <div className="device-form-header">
              <h3>Nouveau détecteur</h3>
              <button type="button" onClick={() => setShowForm(false)}>
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
            <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Ajout...' : 'Ajouter'}
            </button>
          </form>
        </div>
      )}

      {/* Fenêtre d'édition des seuils, affichée seulement si un appareil est en cours d'édition */}
      {editingDevice && (
        <DeviceThresholdModal
          device={editingDevice}
          onClose={() => setEditingDevice(null)}
          onSaved={() => window.location.reload()} // simple pour l'instant : recharge pour refléter le changement
        />
      )}

      {loading ? (
        <p className="devices-loading">Chargement...</p>
      ) : devices.length === 0 ? (
        <p className="no-devices">Aucun détecteur pour l'instant. Ajoutez-en un pour commencer.</p>
      ) : (
        <div className="sensor-grid">
          {devices.map((device) => (
            // Conteneur positionné en relatif, pour ancrer le bouton "⋮" en absolu dans son coin
            <div key={device.id} className="device-card-wrapper">
              <button
                className="device-menu-btn"
                onClick={() => setOpenMenuId(openMenuId === device.id ? null : device.id)}
              >
                <MoreVertical size={16} />
              </button>

              {/* Petit menu déroulant, affiché seulement pour l'appareil actuellement ouvert */}
              {openMenuId === device.id && (
                <div className="device-menu-dropdown">
                  <button
                    onClick={() => {
                      setEditingDevice(device);
                      setOpenMenuId(null);
                    }}
                  >
                    <Sliders size={14} />
                    Modifier les seuils
                  </button>
                </div>
              )}

              <SensorCard
                name={device.name}
                isOnline={device.is_online}
                temperature={null}
                smokeLevel={null}
                gasLevel={null}
                flameDetected={false}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Devices;