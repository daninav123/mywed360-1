import React, { useState } from 'react';
import { ChromePicker } from 'react-color';

/**
 * ColorPickerPanel - Panel de selección de colores
 */
const ColorPickerPanel = ({ config, onChange }) => {
  const [showColorPicker, setShowColorPicker] = useState(null);
  const { estilos } = config;
  const { colores } = estilos;

  const handleColorChange = (colorKey, newColor) => {
    console.log('🎨 Cambiando color:', { colorKey, newColor });

    const nuevaConfig = {
      ...config,
      estilos: {
        ...config.estilos,
        colores: {
          ...config.estilos.colores,
          [colorKey]: newColor,
        },
      },
      meta: {
        ...config.meta,
        updatedAt: new Date().toISOString(),
      },
    };

    console.log('📤 Enviando config con nuevo color:', {
      colorKey,
      newColor,
      todosLosColores: nuevaConfig.estilos.colores,
    });

    onChange(nuevaConfig);
  };

  const colorOptions = [
    { key: 'primario', label: 'Color Primario', description: 'Color principal del tema' },
    { key: 'secundario', label: 'Color Secundario', description: 'Color complementario' },
    { key: 'acento', label: 'Color de Acento', description: 'Color para destacar' },
    { key: 'texto', label: 'Color de Texto', description: 'Color del texto principal' },
    { key: 'fondo', label: 'Color de Fondo', description: 'Color de fondo' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">🎨 Personalizar Colores</h3>

      <div className="space-y-4">
        {colorOptions.map(({ key, label, description }) => (
          <div
            key={key}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{label}</p>
              <p className="text-sm text-gray-600">{description}</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Color preview */}
              <button
                onClick={() => setShowColorPicker(showColorPicker === key ? null : key)}
                className="
                  w-12 h-12 rounded-lg border-2 border-gray-300
                  hover:border-gray-500 transition-colors
                  cursor-pointer
                "
                style={{ backgroundColor: colores[key] }}
                title={colores[key]}
              />

              {/* Color value */}
              <span className="text-sm font-mono text-gray-600 w-24">{colores[key]}</span>
            </div>

            {/* Color picker */}
            {showColorPicker === key && (
              <div className="absolute mt-2 z-50">
                <div className="fixed inset-0" onClick={() => setShowColorPicker(null)} />
                <div className="relative">
                  <ChromePicker
                    color={colores[key]}
                    onChange={(color) => handleColorChange(key, color)}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Presets */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="font-semibold text-gray-900 mb-4">📋 Paletas Predefinidas</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              name: 'Romántico',
              colors: {
                primario: '#FFE4E9',
                secundario: '#FF9AB8',
                acento: '#FFD700',
                texto: '#333333',
                fondo: '#FFFFFF',
              },
            },
            {
              name: 'Moderno',
              colors: {
                primario: '#2C3E50',
                secundario: '#ECF0F1',
                acento: '#3498DB',
                texto: '#2C3E50',
                fondo: '#FFFFFF',
              },
            },
            {
              name: 'Vintage',
              colors: {
                primario: '#D4A574',
                secundario: '#8B7355',
                acento: '#C19A6B',
                texto: '#4A4A4A',
                fondo: '#F5F5DC',
              },
            },
            {
              name: 'Playero',
              colors: {
                primario: '#00CED1',
                secundario: '#FFE4B5',
                acento: '#FF6347',
                texto: '#2F4F4F',
                fondo: '#F0F8FF',
              },
            },
          ].map((preset) => (
            <button
              key={preset.name}
              onClick={() =>
                onChange({
                  ...config,
                  estilos: {
                    ...estilos,
                    colores: preset.colors,
                  },
                })
              }
              className="
                p-3 rounded-lg border-2 border-gray-300 hover:border-gray-500
                transition-all transform hover:scale-105
                text-sm font-semibold text-gray-700
              "
            >
              <div className="flex gap-1 mb-2">
                {Object.values(preset.colors)
                  .slice(0, 3)
                  .map((color, idx) => (
                    <div key={idx} className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                  ))}
              </div>
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorPickerPanel;
