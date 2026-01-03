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
    <aside className="w-72  border-l  flex flex-col overflow-hidden" className="border-default" className="bg-surface" data-testid="properties-panel">
      <div className="flex border-b " className="border-default">
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
              <div className="flex items-center justify-between pb-3 border-b " className="border-default">
                <h3 className="text-sm font-semibold " className="text-body">
                  {selectedElement.type || 'Elemento'}
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={handleDuplicate}
                    className="p-1.5 rounded hover:" className="bg-page"
                    title="Duplicar"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1.5 rounded hover:bg-red-50 " className="text-danger"
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
              <div className="w-16 h-16  rounded-full flex items-center justify-center mb-4" className="bg-page">
                <Layers className="w-8 h-8 " className="text-muted" />
              </div>
              <p className="text-sm font-medium  mb-1" className="text-body">
                Ningún elemento seleccionado
              </p>
              <p className="text-xs " className="text-muted">
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
