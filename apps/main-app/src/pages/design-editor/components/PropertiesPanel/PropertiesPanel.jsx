import React from 'react';
import { Layers, Sparkles, X, Trash2, Copy } from 'lucide-react';

import ElementProperties from './ElementProperties';
import LayersPanel from './LayersPanel';
import EffectsPanel from './EffectsPanel';

export default function PropertiesPanel({ selectedElement, canvasRef }) {
  const [activeTab, setActiveTab] = React.useState('properties');

  const handleDelete = () => {
    if (canvasRef.current) {
      canvasRef.current.deleteSelected();
    }
  };

  const handleDuplicate = () => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    activeObject.clone((cloned) => {
      cloned.set({
        left: activeObject.left + 20,
        top: activeObject.top + 20,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
    });
  };

  return (
    <aside className="w-72 bg-white border-l border-gray-200 flex flex-col overflow-hidden" data-testid="properties-panel">
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-3 text-xs font-medium ${
            activeTab === 'properties'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Propiedades
        </button>
        <button
          onClick={() => setActiveTab('effects')}
          className={`flex-1 py-3 text-xs font-medium ${
            activeTab === 'effects'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Efectos
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-3 text-xs font-medium ${
            activeTab === 'layers'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Layers className="w-4 h-4 inline mr-1" />
          Capas
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'properties' ? (
          selectedElement ? (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">
                  {selectedElement.type || 'Elemento'}
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={handleDuplicate}
                    className="p-1.5 rounded hover:bg-gray-100"
                    title="Duplicar"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1.5 rounded hover:bg-red-50 text-red-600"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <ElementProperties element={selectedElement} canvasRef={canvasRef} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Layers className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                Ningún elemento seleccionado
              </p>
              <p className="text-xs text-gray-500">
                Selecciona un elemento del canvas para ver sus propiedades
              </p>
            </div>
          )
        ) : (
          <LayersPanel canvasRef={canvasRef} />
        )}
      </div>
    </aside>
  );
}
