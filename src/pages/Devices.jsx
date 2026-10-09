import { useState } from 'react';
import { Plus, X, MoreVertical, Sliders, Trash2 } from 'lucide-react';
import SensorCard from '../components/SensorCard/SensorCard';
import DeviceThresholdModal from '../components/DeviceThresholdModal/DeviceThresholdModal';
import { useDevices } from '../hooks/useDevices';
import './Devices.css';

// Indique si un appareil a au moins un seuil personnalisé
// (colonne différente de null) — sert à afficher l'étiquette "Seuils personnalisés"
function hasCustomThresholds(device) {
  return [
    device.temp_moyen, device.temp_critique,
    device.smoke_moyen, device.smoke_critique,
    device.gas_moyen, device.gas_critique,
  ].some((value) => value !== null && value !== undefined);
}

function Devices() {
  const { devices, loading, addDevice, deleteDevice, refreshDevices } = useDevices();

  // Formulaire d'ajout d'un détecteur
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Id de l'appareil dont le menu "⋮" est ouvert (null = aucun)
  const [openMenuId, setOpenMenuId] = useState(null);

  // Appareil dont on modifie actuellement les seuils (null = aucun)
  const [editingDevice, setEditingDevice] = useState(null);

  // Ajoute un nouveau détecteur
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

  // Supprime un détecteur, après confirmation (action irréversible)
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
          <p className="devices-subtitle">Gérez vos détecteurs installés</p>
        </div>
        <button className="add-device-btn" onClick={() => setShowForm(true)}>
          <Plus size={16} />
          Ajouter un détecteur
        </button>
      </div>

      {/* Fenêtre d'ajout d'un détecteur */}
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

      {/* Fenêtre de modification des seuils, affichée seulement si un appareil est en cours d'édition */}
      {editingDevice && (
        <DeviceThresholdModal
          device={editingDevice}
          onClose={() => setEditingDevice(null)}
          onSaved={refreshDevices}
        />
      )}

      {/* Voile invisible : un clic n'importe où en dehors du menu "⋮" le referme */}
      {openMenuId && (
        <div className="device-menu-overlay" onClick={() => setOpenMenuId(null)} />
      )}

      {loading ? (
        <p className="devices-loading">Chargement...</p>
      ) : devices.length === 0 ? (
        <p className="no-devices">Aucun détecteur pour l'instant. Ajoutez-en un pour commencer.</p>
      ) : (
        <div className="sensor-grid">
          {devices.map((device) => (
            // Conteneur en position relative : ancre le bouton "⋮" dans le coin de SA fiche
            <div key={device.id} className="device-card-wrapper">
              <button
                className="device-menu-btn"
                onClick={() => setOpenMenuId(openMenuId === device.id ? null : device.id)}
              >
                <MoreVertical size={16} />
              </button>

              {/* Menu déroulant, affiché seulement pour l'appareil dont le menu est ouvert */}
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
                  <button className="device-menu-danger" onClick={() => handleDeleteDevice(device)}>
                    <Trash2 size={14} />
                    Supprimer l'appareil
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

              {/* Étiquette visible uniquement si l'appareil a des seuils personnalisés */}
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