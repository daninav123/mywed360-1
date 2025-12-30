import React, { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { SPEC_LABELS } from '../../utils/supplierRequirementsTemplate';
import { Input, Card } from '../ui';
import { useSupplierOptions } from '../../hooks/useSupplierOptions';
import { loadSupplierSpecs } from '../../services/supplierSpecsService';

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
  const [customOptions, setCustomOptions] = useState(specs.customOptions || []);
  const [newOptionText, setNewOptionText] = useState('');
  const [categorySpecs, setCategorySpecs] = useState(null);
  const { allOptions, dynamicOptions, isLoading } = useSupplierOptions(category);
  const labels = allOptions;

  // Cargar specs dinámicas desde Firestore
  useEffect(() => {
    const loadSpecs = async () => {
      try {
        const loadedSpecs = await loadSupplierSpecs();
        if (loadedSpecs && loadedSpecs[category]) {
          setCategorySpecs(loadedSpecs[category]);
        }
      } catch (error) {
        console.error('Error cargando specs:', error);
      }
    };
    loadSpecs();
  }, [category]);

  // Sincronizar customOptions con specs cuando cambie desde el padre (ej: al cargar desde Firestore)
  React.useEffect(() => {
    if (specs.customOptions && JSON.stringify(specs.customOptions) !== JSON.stringify(customOptions)) {
      setCustomOptions(specs.customOptions);
    }
  }, [specs.customOptions]);

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

  const addCustomOption = async () => {
    if (!newOptionText.trim()) return;
    
    const optionText = newOptionText.trim();
    const newOptions = [...customOptions, optionText];
    const newIndex = customOptions.length;
    
    // Generar key para el checkbox (mismo formato que en renderCustomOptions)
    const customKey = `custom_${newIndex}_${optionText.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Actualizar customOptions
    setCustomOptions(newOptions);
    updateField('customOptions', newOptions);
    
    // ✅ Marcar checkbox por defecto
    onChange({
      ...specs,
      customOptions: newOptions,
      specs: {
        ...specs.specs,
        [customKey]: true
      }
    });
    
    setNewOptionText('');

    try {
      const response = await fetch('/api/supplier-options/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          categoryName,
          optionLabel: optionText,
          description: `Opción añadida por usuario desde Info Boda`,
          type: 'boolean'
        })
      });

      if (!response.ok) {
        console.warn('No se pudo enviar sugerencia al sistema de crowdsourcing');
      }
    } catch (error) {
      console.warn('Error al enviar sugerencia:', error);
    }
  };

  const removeCustomOption = (index) => {
    const newOptions = customOptions.filter((_, i) => i !== index);
    setCustomOptions(newOptions);
    updateField('customOptions', newOptions);
  };

  const renderCheckbox = (key, label, highlighted = false, isDynamic = false) => {
    return (
      <label 
        key={key}
        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer ${
          specs.specs[key] 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300'
        } ${highlighted ? 'ring-2 ring-yellow-400' : ''} ${isDynamic ? 'ring-1 ring-green-400' : ''}`}
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
          {isDynamic && <span className="ml-2 text-xs text-green-600">✨ Comunidad</span>}
        </span>
      </label>
    );
  };

  const renderDynamicOptions = () => {
    if (!dynamicOptions || Object.keys(dynamicOptions).length === 0) return null;
    
    return Object.entries(dynamicOptions).map(([key, label]) => 
      renderCheckbox(key, label, false, false)
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

  const renderCustomOptions = () => {
    return (
      <>
        {customOptions.map((option, index) => {
          const customKey = `custom_${index}_${option.toLowerCase().replace(/\s+/g, '_')}`;
          
          return (
            <div key={`custom-${index}`} className="flex items-center gap-2">
              <label 
                className={`flex-1 flex items-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  specs.specs[customKey] 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={specs.specs[customKey] || false}
                  onChange={(e) => updateSpec(customKey, e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="flex-1 text-sm font-medium text-gray-700">
                  {option}
                </span>
              </label>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  removeCustomOption(index);
                }}
                className="text-red-600 hover:text-red-700 text-xs font-bold px-2"
                title="Eliminar opción"
              >
                ✕
              </button>
            </div>
          );
        })}
      </>
    );
  };

  const renderAddOptionInput = () => {
    return (
      <div className="flex gap-2 pt-2 col-span-full">
        <input
          type="text"
          value={newOptionText}
          onChange={(e) => setNewOptionText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustomOption();
            }
          }}
          placeholder="+ Añadir opción personalizada"
          className="flex-1 px-3 py-2 border border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        <button
          type="button"
          onClick={addCustomOption}
          disabled={!newOptionText.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
        >
          Añadir
        </button>
      </div>
    );
  };

  const renderDynamicFields = () => {
    if (!categorySpecs?.specs) {
      return (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">📋 Opciones personalizadas</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderDynamicOptions()}
            {renderCustomOptions()}
            {renderAddOptionInput()}
          </div>
          <p className="text-sm text-gray-600 mt-4 text-center">
            Añade las opciones específicas que necesites para {categoryName}
          </p>
        </div>
      );
    }

    const specsToRender = categorySpecs.specs;
    const booleanFields = [];
    const numberFields = [];
    const stringFields = [];
    const arrayFields = [];

    Object.entries(specsToRender).forEach(([key, value]) => {
      const fieldType = typeof value;
      if (fieldType === 'boolean') booleanFields.push(key);
      else if (fieldType === 'number') numberFields.push(key);
      else if (Array.isArray(value)) arrayFields.push(key);
      else stringFields.push(key);
    });

    return (
      <>
        {booleanFields.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">📋 Opciones</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {booleanFields.map(key => renderCheckbox(key, labels[key] || key))}
              {renderDynamicOptions()}
              {renderCustomOptions()}
              {renderAddOptionInput()}
            </div>
          </div>
        )}

        {(numberFields.length > 0 || stringFields.length > 0) && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">⚙️ Configuración</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {numberFields.map(key => renderNumberInput(key, labels[key] || key, 0, 100))}
              {stringFields.map(key => {
                // Renderizar select si hay opciones conocidas, sino input text
                return (
                  <div key={key} className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {labels[key] || key}
                    </label>
                    <input
                      type="text"
                      value={specs.specs[key] || ''}
                      onChange={(e) => updateSpec(key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Siempre mostrar input para añadir opciones personalizadas al final */}
        {booleanFields.length === 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">📋 Opciones adicionales</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderDynamicOptions()}
              {renderCustomOptions()}
              {renderAddOptionInput()}
            </div>
          </div>
        )}
      </>
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
                {renderDynamicOptions()}
                {renderCustomOptions()}
                {renderAddOptionInput()}
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
      case 'dj':
      case 'animacion':
      case 'iluminacion':
      case 'musica':
      case 'catering':
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">📋 Opciones personalizadas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderDynamicOptions()}
              {renderCustomOptions()}
              {renderAddOptionInput()}
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              Añade las opciones específicas que necesites para {categoryName}
            </p>
          </div>
        );
        return null;




      default:
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">📝 Opciones especiales</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderDynamicOptions()}
              {renderCustomOptions()}
              {renderAddOptionInput()}
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              Añade las opciones específicas que necesites para {categoryName}
            </p>
          </div>
        );
    }
  };

  return (
    <>
      <Card className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {categoryName}
          </h3>
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
    </>
  );
};

export default SupplierCategorySpecs;
