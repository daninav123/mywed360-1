import React from 'react';
import { SPEC_LABELS } from '../../utils/supplierRequirementsTemplate';
import { Input, Card } from '../ui';

/**
 * Componente para especificar requisitos de una categoría de proveedor
 */
const SupplierCategorySpecs = ({ 
  category, 
  categoryName,
  specs, 
  onChange,
  onChatOpen 
}) => {
  const labels = SPEC_LABELS[category] || {};

  const updateSpec = (key, value) => {
    onChange({
      ...specs,
      specs: {
        ...specs.specs,
        [key]: value
      }
    });
  };

  const updateField = (field, value) => {
    onChange({
      ...specs,
      [field]: value
    });
  };

  const toggleRequired = (item) => {
    const required = specs.required || [];
    const newRequired = required.includes(item)
      ? required.filter(r => r !== item)
      : [...required, item];
    updateField('required', newRequired);
  };

  const toggleDesired = (item) => {
    const desired = specs.desired || [];
    const newDesired = desired.includes(item)
      ? desired.filter(d => d !== item)
      : [...desired, item];
    updateField('desired', newDesired);
  };

  const renderCheckbox = (key, label, highlighted = false) => {
    const isBoolean = typeof specs.specs[key] === 'boolean';
    if (!isBoolean) return null;

    return (
      <label 
        key={key}
        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer ${
          specs.specs[key] 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300'
        } ${highlighted ? 'ring-2 ring-yellow-400' : ''}`}
      >
        <input
          type="checkbox"
          checked={specs.specs[key] || false}
          onChange={(e) => updateSpec(key, e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <span className="flex-1 text-sm font-medium text-gray-700">
          {label}
          {highlighted && <span className="ml-2">⭐</span>}
        </span>
      </label>
    );
  };

  const renderNumberInput = (key, label, min = 0, max = 24) => {
    return (
      <div key={key} className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <input
          type="number"
          min={min}
          max={max}
          value={specs.specs[key] || 0}
          onChange={(e) => updateSpec(key, parseInt(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    );
  };

  const renderSelectInput = (key, label, options) => {
    return (
      <div key={key} className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <select
          value={specs.specs[key] || ''}
          onChange={(e) => updateSpec(key, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // Renderizado específico por categoría
  const renderCategorySpecs = () => {
    switch(category) {
      case 'fotografia':
        return (
          <>
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">📸 Opciones especiales</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderCheckbox('drone', labels.drone, true)}
                {renderCheckbox('engagement', labels.engagement)}
                {renderCheckbox('album', labels.album)}
                {renderCheckbox('locationScouting', labels.locationScouting)}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">⚙️ Configuración</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderNumberInput('hours', labels.hours, 1, 24)}
                {renderNumberInput('photographers', labels.photographers, 1, 5)}
                {renderSelectInput('style', labels.style, [
                  { value: 'natural', label: 'Natural' },
                  { value: 'posed', label: 'Posado' },
                  { value: 'artistic', label: 'Artístico' },
                  { value: 'documentary', label: 'Documental' },
                ])}
                {renderSelectInput('delivery', labels.delivery, [
                  { value: 'digital', label: 'Digital (online)' },
                  { value: 'usb', label: 'USB físico' },
                  { value: 'both', label: 'Ambos' },
                ])}
              </div>
            </div>
          </>
        );

      case 'video':
        return (
          <>
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">🎥 Opciones especiales</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderCheckbox('drone', labels.drone, true)}
                {renderCheckbox('highlights', labels.highlights)}
                {renderCheckbox('fullCeremony', labels.fullCeremony)}
                {renderCheckbox('sameDay', labels.sameDay)}
                {renderCheckbox('interviews', labels.interviews)}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">⚙️ Configuración</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderNumberInput('hours', labels.hours, 1, 24)}
                {renderNumberInput('videographers', labels.videographers, 1, 5)}
                {renderSelectInput('style', labels.style, [
                  { value: 'cinematic', label: 'Cinemático' },
                  { value: 'documentary', label: 'Documental' },
                  { value: 'artistic', label: 'Artístico' },
                ])}
              </div>
            </div>
          </>
        );

      case 'dj':
        return (
          <>
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">🎆 Efectos especiales</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderCheckbox('coldSparks', labels.coldSparks, true)}
                {renderCheckbox('confetti', labels.confetti, true)}
                {renderCheckbox('smoke', labels.smoke)}
                {renderCheckbox('co2', labels.co2)}
                {renderCheckbox('led', labels.led)}
                {renderCheckbox('lights', labels.lights)}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">⚙️ Configuración</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderNumberInput('hours', labels.hours, 1, 12)}
                {renderCheckbox('mc', labels.mc)}
              </div>
            </div>
          </>
        );

      case 'animacion':
        return (
          <>
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">🎆 Efectos especiales</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderCheckbox('fireworks', labels.fireworks, true)}
                {renderCheckbox('coldFire', labels.coldFire, true)}
                {renderCheckbox('confetti', labels.confetti, true)}
                {renderCheckbox('bubbles', labels.bubbles)}
                {renderCheckbox('doves', labels.doves)}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">⚙️ Configuración</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderNumberInput('duration', labels.duration, 0, 180)}
                {renderCheckbox('interactive', labels.interactive)}
              </div>
            </div>
          </>
        );

      case 'iluminacion':
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">💡 Opciones de iluminación</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderCheckbox('uplighting', labels.uplighting)}
              {renderCheckbox('pinspots', labels.pinspots)}
              {renderCheckbox('gobo', labels.gobo, true)}
              {renderCheckbox('chandeliers', labels.chandeliers)}
              {renderCheckbox('fairylights', labels.fairylights)}
              {renderCheckbox('neon', labels.neon, true)}
              {renderCheckbox('candles', labels.candles)}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>📝 Especificaciones generales para {categoryName}</p>
            <p className="text-sm mt-2">Usa las notas adicionales para detallar tus requisitos</p>
          </div>
        );
    }
  };

  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">
          {categoryName}
        </h3>
        <button
          onClick={onChatOpen}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
        >
          <span>💬</span>
          <span>Consultar IA</span>
        </button>
      </div>

      {renderCategorySpecs()}

      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">📝 Notas adicionales</h4>
        <textarea
          value={specs.notes || ''}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Cualquier detalle específico que quieras comunicar al proveedor..."
          className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </Card>
  );
};

export default SupplierCategorySpecs;
