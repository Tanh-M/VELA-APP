import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import SensorCard from '../components/SensorCard/SensorCard';
import { useDevices } from '../hooks/useDevices';
import './Devices.css';

function Devices() {
  const { devices, loading, addDevice } = useDevices();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      {loading ? (
        <p className="devices-loading">Chargement...</p>
      ) : devices.length === 0 ? (
        <p className="no-devices">Aucun détecteur pour l'instant. Ajoutez-en un pour commencer.</p>
      ) : (
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
      )}
    </div>
  );
}

export default Devices;