/**
 * BanquetConfigAdvanced - Modal avanzado de configuración para banquete
 * Permite configurar espaciado, márgenes, capacidades y reglas
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Ruler, Users, AlertCircle, Check } from 'lucide-react';

export default function BanquetConfigAdvanced({ isOpen, onClose, config, onSave }) {
  const [localConfig, setLocalConfig] = useState({
    // Espaciado
    tableSpacing: config?.tableSpacing || 250,
    marginTop: config?.marginTop || 200,
    marginBottom: config?.marginBottom || 200,
    marginLeft: config?.marginLeft || 200,
    marginRight: config?.marginRight || 200,
    aisleWidth: config?.aisleWidth || 200,

    // Capacidades
    defaultCapacity: config?.defaultCapacity || 8,
    minCapacity: config?.minCapacity || 4,
    maxCapacity: config?.maxCapacity || 12,
    allowOvercapacity: config?.allowOvercapacity || false,

    // Formas por defecto
    defaultShape: config?.defaultShape || 'circle',
    defaultDiameter: config?.defaultDiameter || 120,
    defaultRectWidth: config?.defaultRectWidth || 200,
    defaultRectHeight: config?.defaultRectHeight || 80,

    // Validaciones
    enforceMinDistance: config?.enforceMinDistance !== false,
    minDistance: config?.minDistance || 150,
    preventOverlap: config?.preventOverlap !== false,
    snapToGrid: config?.snapToGrid !== false,
    gridSize: config?.gridSize || 20,
  });

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  const updateConfig = (key, value) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Settings size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Configuración Avanzada</h2>
                <p className="text-sm text-gray-400">Personaliza el comportamiento del banquete</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--color-primary)] transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-6">
            {/* Sección: Espaciado */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Ruler size={18} className="text-indigo-400" />
                <h3 className="text-lg font-semibold text-white">Espaciado y Márgenes</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Espaciado entre mesas</label>
                  <input
                    type="number"
                    value={localConfig.tableSpacing}
                    onChange={(e) => updateConfig('tableSpacing', Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    min={100}
                    max={500}
                    step={10}
                  />
                  <span className="text-xs text-gray-500">{localConfig.tableSpacing}px</span>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Ancho de pasillos</label>
                  <input
                    type="number"
                    value={localConfig.aisleWidth}
                    onChange={(e) => updateConfig('aisleWidth', Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    min={100}
                    max={400}
                    step={10}
                  />
                  <span className="text-xs text-gray-500">{localConfig.aisleWidth}px</span>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Margen superior</label>
                  <input
                    type="number"
                    value={localConfig.marginTop}
                    onChange={(e) => updateConfig('marginTop', Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    min={0}
                    max={500}
                    step={10}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Margen inferior</label>
                  <input
                    type="number"
                    value={localConfig.marginBottom}
                    onChange={(e) => updateConfig('marginBottom', Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    min={0}
                    max={500}
                    step={10}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Margen izquierdo</label>
                  <input
                    type="number"
                    value={localConfig.marginLeft}
                    onChange={(e) => updateConfig('marginLeft', Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    min={0}
                    max={500}
                    step={10}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Margen derecho</label>
                  <input
                    type="number"
                    value={localConfig.marginRight}
                    onChange={(e) => updateConfig('marginRight', Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    min={0}
                    max={500}
                    step={10}
                  />
                </div>
              </div>
            </div>

            {/* Sección: Capacidades */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-green-400" />
                <h3 className="text-lg font-semibold text-white">Capacidades</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Capacidad por defecto</label>
                  <input
                    type="number"
                    value={localConfig.defaultCapacity}
                    onChange={(e) => updateConfig('defaultCapacity', Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    min={1}
                    max={20}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Capacidad máxima</label>
                  <input
                    type="number"
                    value={localConfig.maxCapacity}
                    onChange={(e) => updateConfig('maxCapacity', Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    min={1}
                    max={50}
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.allowOvercapacity}
                      onChange={(e) => updateConfig('allowOvercapacity', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="text-sm text-gray-300">Permitir sobrecapacidad</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Permite asignar más invitados de los que caben en una mesa
                  </p>
                </div>
              </div>
            </div>

            {/* Sección: Validaciones */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={18} className="text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Validaciones</h3>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localConfig.enforceMinDistance}
                    onChange={(e) => updateConfig('enforceMinDistance', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-300">Forzar distancia mínima entre mesas</span>
                </label>

                {localConfig.enforceMinDistance && (
                  <div className="ml-6">
                    <input
                      type="range"
                      value={localConfig.minDistance}
                      onChange={(e) => updateConfig('minDistance', Number(e.target.value))}
                      min={50}
                      max={300}
                      step={10}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{localConfig.minDistance}px</span>
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localConfig.preventOverlap}
                    onChange={(e) => updateConfig('preventOverlap', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-300">Prevenir solapamiento de mesas</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localConfig.snapToGrid}
                    onChange={(e) => updateConfig('snapToGrid', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-300">Ajustar a cuadrícula (Snap to Grid)</span>
                </label>

                {localConfig.snapToGrid && (
                  <div className="ml-6">
                    <input
                      type="number"
                      value={localConfig.gridSize}
                      onChange={(e) => updateConfig('gridSize', Number(e.target.value))}
                      className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-white text-sm"
                      min={10}
                      max={50}
                      step={5}
                    />
                    <span className="text-xs text-gray-500 ml-2">
                      Tamaño de cuadrícula: {localConfig.gridSize}px
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Check size={18} />
              Guardar Configuración
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
