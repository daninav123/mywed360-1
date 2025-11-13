/**
 * LayoutGeneratorModal
 * Modal para seleccionar y configurar el tipo de distribución automática de mesas
 */

import React, { useState } from 'react';
import { X, Info } from 'lucide-react';
import { LAYOUT_TYPES } from './SeatingLayoutGenerator';

export default function LayoutGeneratorModal({ isOpen, onClose, onGenerate, currentConfig = {} }) {
  const [selectedType, setSelectedType] = useState('grid');
  const [config, setConfig] = useState({
    tableCount: currentConfig.tableCount || 12,
    tableShape: currentConfig.tableShape || 'circle',
    tableCapacity: currentConfig.tableCapacity || 8,
    tableSize: currentConfig.tableSize || 100,
    spacing: currentConfig.spacing || 250, // ✅ Aumentado para evitar conflictos
    margin: currentConfig.margin || 200, // ✅ Aumentado para mejor distribución
    hallWidth: currentConfig.hallWidth || 1800,
    hallHeight: currentConfig.hallHeight || 1200,
  });

  if (!isOpen) return null;

  const handleGenerate = () => {
    onGenerate(selectedType, config);
    onClose();
  };

  const layoutType = LAYOUT_TYPES[selectedType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Generador Automático de Layout</h2>
            <p className="text-sm text-gray-500 mt-1">
              Crea una distribución de mesas automática en segundos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Layout Types - Left Column */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Distribución</h3>

              <div className="grid grid-cols-2 gap-4">
                {Object.values(LAYOUT_TYPES).map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`
                      p-4 rounded-lg border-2 text-left transition-all
                      ${
                        selectedType === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{type.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{type.name}</div>
                        <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                        <div className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{type.recommended}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Configuration - Right Column */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración</h3>

              <div className="space-y-4">
                {/* Número de Mesas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Mesas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={config.tableCount}
                    onChange={(e) =>
                      setConfig({ ...config, tableCount: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Forma de Mesa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forma de Mesa
                  </label>
                  <select
                    value={config.tableShape}
                    onChange={(e) => setConfig({ ...config, tableShape: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="circle">Circular</option>
                    <option value="square">Rectangular</option>
                  </select>
                </div>

                {/* Capacidad por Mesa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacidad por Mesa
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={config.tableCapacity}
                    onChange={(e) =>
                      setConfig({ ...config, tableCapacity: parseInt(e.target.value) || 2 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Tamaño de Mesa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tamaño de Mesa (px)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="200"
                    step="10"
                    value={config.tableSize}
                    onChange={(e) =>
                      setConfig({ ...config, tableSize: parseInt(e.target.value) || 50 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Espaciado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Espaciado entre Mesas (px)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="300"
                    step="10"
                    value={config.spacing}
                    onChange={(e) =>
                      setConfig({ ...config, spacing: parseInt(e.target.value) || 50 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Info Box */}
              {layoutType && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-900">
                      <div className="font-semibold mb-1">{layoutType.name}</div>
                      <div className="text-blue-700">{layoutType.recommended}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-600">
            Se generarán {config.tableCount} mesas con capacidad de {config.tableCapacity} personas
            cada una
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerate}
              className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Generar Layout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
