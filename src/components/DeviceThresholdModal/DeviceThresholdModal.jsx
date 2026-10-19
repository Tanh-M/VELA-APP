import { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { getThresholds } from '../../utils/alertRules';
import GuideNotice from '../GuideNotice/GuideNotice';
import ConfirmThresholdModal from '../ConfirmThresholdModal/ConfirmThresholdModal';
import './DeviceThresholdModal.css';

// Les 3 mesures configurables : libellé affiché + noms des colonnes Supabase associées
const MEASURES = [
  { label: 'Température (°C)', name: 'Température', moyen: 'temp_moyen', critique: 'temp_critique' },
  { label: 'Fumée (%)', name: 'Fumée', moyen: 'smoke_moyen', critique: 'smoke_critique' },
  { label: 'Gaz (%)', name: 'Gaz', moyen: 'gas_moyen', critique: 'gas_critique' },
];

// Convertit les seuils par défaut au format "nom de colonne → valeur"
function getDefaultsByColumn() {
  const d = getThresholds();
  return {
    temp_moyen: d.temperature.moyen,
    temp_critique: d.temperature.critique,
    smoke_moyen: d.smoke.moyen,
    smoke_critique: d.smoke.critique,
    gas_moyen: d.gas.moyen,
    gas_critique: d.gas.critique,
  };
}

// Fenêtre de personnalisation des seuils d'UN appareil précis.
// Props : device (l'appareil), onClose (ferme la fenêtre), onSaved (recharge la liste)
function DeviceThresholdModal({ device, onClose, onSaved }) {
  const defaultsByColumn = getDefaultsByColumn();

  // Valeurs de départ : valeur personnalisée de l'appareil, sinon valeur par défaut
  const initialValues = {};
  Object.keys(defaultsByColumn).forEach((column) => {
    initialValues[column] = device[column] ?? defaultsByColumn[column];
  });

  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Pop-up de confirmation + valeurs en attente de confirmation
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  function updateValue(column, value) {
    setValues((prev) => ({ ...prev, [column]: value }));
  }

  // Envoie les valeurs à Supabase et vérifie que la modification a bien eu lieu
  async function saveToDatabase(payload) {
    setSaving(true);

    const { data, error: dbError } = await supabase
      .from('devices')
      .update(payload)
      .eq('id', device.id)
      .select();

    // Erreur renvoyée par Supabase (ex: colonne inexistante)
    if (dbError) {
      setError('Enregistrement impossible : ' + dbError.message);
      setSaving(false);
      return;
    }

    // Aucune ligne modifiée : souvent une politique de sécurité "update" manquante
    if (!data || data.length === 0) {
      setError("Aucune modification enregistrée. Vérifiez la politique « update » de la table devices dans Supabase.");
      setSaving(false);
      return;
    }

    await onSaved(); // recharge la liste des appareils
    setSaving(false);
    onClose();
  }

  // Clic sur "Enregistrer" : on valide, puis on demande confirmation
  async function handleSave() {
    setError('');

    for (const measure of MEASURES) {
      const moyen = Number(values[measure.moyen]);
      const critique = Number(values[measure.critique]);

      // Champ vide ou non numérique
      if (
        values[measure.moyen] === '' ||
        values[measure.critique] === '' ||
        !Number.isFinite(moyen) ||
        !Number.isFinite(critique)
      ) {
        setError(`${measure.name} : renseignez les deux valeurs.`);
        return;
      }

      // Le seuil "moyen" doit se déclencher AVANT le seuil "critique"
      if (moyen >= critique) {
        setError(`${measure.name} : le seuil moyen doit être inférieur au seuil critique.`);
        return;
      }
    }

    // Une valeur identique au seuil par défaut est enregistrée "null" :
    // l'appareil continue alors de suivre les seuils par défaut
    const payload = {};
    Object.keys(defaultsByColumn).forEach((column) => {
      const value = Number(values[column]);
      payload[column] = value === defaultsByColumn[column] ? null : value;
    });

    // Rien n'a changé : inutile de demander confirmation, on ferme simplement
    const unchanged = Object.keys(payload).every(
      (column) => (device[column] ?? null) === payload[column]
    );
    if (unchanged) {
      onClose();
      return;
    }

    // Sinon, on garde les valeurs en attente et on affiche le pop-up de confirmation
    setPendingPayload(payload);
    setShowConfirm(true);
  }

  // L'utilisateur a confirmé dans le pop-up : on enregistre réellement
  async function handleConfirm() {
    setShowConfirm(false);
    await saveToDatabase(pendingPayload);
  }

  // Retire toute personnalisation : retour aux seuils par défaut.
  // Pas de confirmation ici : c'est le réglage le plus sûr.
  async function handleReset() {
    setError('');
    const payload = {};
    Object.keys(defaultsByColumn).forEach((column) => {
      payload[column] = null;
    });
    await saveToDatabase(payload);
  }

  return (
    <>
      {/* Cliquer sur le fond sombre ferme la fenêtre */}
      <div className="dtm-backdrop" onClick={onClose}>
        {/* stopPropagation : un clic DANS la fenêtre ne doit pas la fermer */}
        <div className="dtm-card" onClick={(e) => e.stopPropagation()}>
          <div className="dtm-header">
            <h3>Seuils — {device.name}</h3>
            <button type="button" className="dtm-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <p className="dtm-desc">
            Ces seuils s'appliquent uniquement à cet appareil, indépendamment des autres.
          </p>

          {/* Avertissement + guide. deviceId : au retour du guide, cette même fenêtre se rouvre */}
          <GuideNotice from="devices" deviceId={device.id} />

          {MEASURES.map((measure) => (
            <div className="dtm-group" key={measure.name}>
              <span className="dtm-label">{measure.label}</span>
              <div className="dtm-inputs">
                <label>
                  Moyen
                  <input
                    type="number"
                    value={values[measure.moyen]}
                    onChange={(e) => updateValue(measure.moyen, e.target.value)}
                  />
                </label>
                <label>
                  Critique
                  <input
                    type="number"
                    value={values[measure.critique]}
                    onChange={(e) => updateValue(measure.critique, e.target.value)}
                  />
                </label>
              </div>
            </div>
          ))}

          {error && <p className="dtm-error">{error}</p>}

          <div className="dtm-actions">
            <button type="button" className="dtm-reset" onClick={handleReset} disabled={saving}>
              <RotateCcw size={14} />
              Valeurs par défaut
            </button>
            <button type="button" className="dtm-save" onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>

      {/* Pop-up placé HORS du fond de la fenêtre : un clic dessus ne ferme pas la fenêtre des seuils */}
      {showConfirm && (
        <ConfirmThresholdModal
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

export default DeviceThresholdModal;