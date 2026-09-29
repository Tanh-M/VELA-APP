import { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { getThresholds } from '../../utils/alertRules';
import './DeviceThresholdModal.css';

// Petite fenêtre modale permettant de personnaliser les seuils d'alerte
// d'UN appareil précis, indépendamment des autres.
function DeviceThresholdModal({ device, onClose, onSaved }) {
  const defaults = getThresholds();

  // Initialise le formulaire avec les valeurs personnalisées de l'appareil,
  // ou à défaut les valeurs globales (juste pour l'affichage, tant que rien
  // n'est explicitement personnalisé)
  const [values, setValues] = useState({
    temp_moyen: device.temp_moyen ?? defaults.temperature.moyen,
    temp_critique: device.temp_critique ?? defaults.temperature.critique,
    smoke_moyen: device.smoke_moyen ?? defaults.smoke.moyen,
    smoke_critique: device.smoke_critique ?? defaults.smoke.critique,
    gas_moyen: device.gas_moyen ?? defaults.gas.moyen,
    gas_critique: device.gas_critique ?? defaults.gas.critique,
  });

  function updateValue(field, value) {
    setValues((prev) => ({ ...prev, [field]: Number(value) }));
  }

  // Sauvegarde les seuils personnalisés de cet appareil dans Supabase
  async function handleSave() {
    await supabase.from('devices').update(values).eq('id', device.id);
    onSaved();
    onClose();
  }

  // Retire toute personnalisation : l'appareil retombe sur les seuils globaux
  async function handleReset() {
    await supabase.from('devices').update({
      temp_moyen: null, temp_critique: null,
      smoke_moyen: null, smoke_critique: null,
      gas_moyen: null, gas_critique: null,
    }).eq('id', device.id);
    onSaved();
    onClose();
  }

  return (
    <div className="device-form-backdrop" onClick={onClose}>
      <div className="device-form threshold-modal" onClick={(e) => e.stopPropagation()}>
        <div className="device-form-header">
          <h3>Seuils — {device.name}</h3>
          <button type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p className="settings-card-desc">
          Ces seuils s'appliquent uniquement à cet appareil, indépendamment des autres.
        </p>

        <div className="threshold-group">
          <span className="threshold-label">Température (°C)</span>
          <div className="threshold-inputs">
            <label>
              Moyen
              <input type="number" value={values.temp_moyen} onChange={(e) => updateValue('temp_moyen', e.target.value)} />
            </label>
            <label>
              Critique
              <input type="number" value={values.temp_critique} onChange={(e) => updateValue('temp_critique', e.target.value)} />
            </label>
          </div>
        </div>

        <div className="threshold-group">
          <span className="threshold-label">Fumée (%)</span>
          <div className="threshold-inputs">
            <label>
              Moyen
              <input type="number" value={values.smoke_moyen} onChange={(e) => updateValue('smoke_moyen', e.target.value)} />
            </label>
            <label>
              Critique
              <input type="number" value={values.smoke_critique} onChange={(e) => updateValue('smoke_critique', e.target.value)} />
            </label>
          </div>
        </div>

        <div className="threshold-group">
          <span className="threshold-label">Gaz (%)</span>
          <div className="threshold-inputs">
            <label>
              Moyen
              <input type="number" value={values.gas_moyen} onChange={(e) => updateValue('gas_moyen', e.target.value)} />
            </label>
            <label>
              Critique
              <input type="number" value={values.gas_critique} onChange={(e) => updateValue('gas_critique', e.target.value)} />
            </label>
          </div>
        </div>

        <div className="threshold-modal-actions">
          <button type="button" className="theme-toggle-btn" onClick={handleReset}>
            <RotateCcw size={14} />
            Valeurs par défaut
          </button>
          <button type="button" className="auth-submit-btn" onClick={handleSave} style={{ width: 'auto', padding: '10px 20px' }}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeviceThresholdModal;