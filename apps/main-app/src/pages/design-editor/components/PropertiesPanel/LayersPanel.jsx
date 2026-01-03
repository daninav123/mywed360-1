import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Unlock, Trash2 } from 'lucide-react';

export default function LayersPanel({ canvasRef }) {
  const [layers, setLayers] = useState([]);

  useEffect(() => {
    const updateLayers = () => {
      const canvas = canvasRef.current?.getCanvas();
      if (!canvas) return;

      const objects = canvas.getObjects();
      setLayers(
        objects.map((obj, index) => ({
          id: obj.id || `layer-${index}`,
          type: obj.type,
          visible: obj.visible !== false,
          locked: obj.selectable === false,
          name: obj.name || `${obj.type} ${index + 1}`,
          object: obj,
        }))
      );
    };

    updateLayers();

    const canvas = canvasRef.current?.getCanvas();
    if (canvas) {
      canvas.on('object:added', updateLayers);
      canvas.on('object:removed', updateLayers);
      canvas.on('object:modified', updateLayers);
    }

    return () => {
      if (canvas) {
        canvas.off('object:added', updateLayers);
        canvas.off('object:removed', updateLayers);
        canvas.off('object:modified', updateLayers);
      }
    };
  }, [canvasRef]);

  const toggleVisibility = (layer) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    layer.object.set('visible', !layer.visible);
    canvas.renderAll();
    setLayers((prev) =>
      prev.map((l) => (l.id === layer.id ? { ...l, visible: !l.visible } : l))
    );
  };

  const toggleLock = (layer) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    layer.object.set('selectable', layer.locked);
    canvas.renderAll();
    setLayers((prev) =>
      prev.map((l) => (l.id === layer.id ? { ...l, locked: !l.locked } : l))
    );
  };

  const deleteLayer = (layer) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    canvas.remove(layer.object);
    canvas.renderAll();
  };

  const selectLayer = (layer) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    canvas.setActiveObject(layer.object);
    canvas.renderAll();
  };

  const moveLayer = (fromIndex, toIndex) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const obj = canvas.item(fromIndex);
    canvas.moveTo(obj, toIndex);
    canvas.renderAll();
  };

  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold " className="text-body">Capas</h3>
        <div className="text-xs " className="text-muted">{layers.length} elementos</div>
      </div>

      {layers.length === 0 ? (
        <div className="py-8 text-center text-sm " className="text-muted">
          No hay elementos en el canvas
        </div>
      ) : (
        <div className="space-y-1">
          {[...layers].reverse().map((layer, index) => (
            <div
              key={layer.id}
              onClick={() => selectLayer(layer)}
              className="flex items-center gap-2 p-2 rounded hover: cursor-pointer group" className="bg-page"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium  truncate" className="text-body">
                  {layer.name}
                </div>
                <div className="text-xs " className="text-muted">{layer.type}</div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisibility(layer);
                  }}
                  className="p-1 rounded hover:bg-gray-200"
                  title={layer.visible ? 'Ocultar' : 'Mostrar'}
                >
                  {layer.visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4 " className="text-muted" />
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLock(layer);
                  }}
                  className="p-1 rounded hover:bg-gray-200"
                  title={layer.locked ? 'Desbloquear' : 'Bloquear'}
                >
                  {layer.locked ? (
                    <Lock className="w-4 h-4 " className="text-muted" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLayer(layer);
                  }}
                  className="p-1 rounded hover:bg-red-50 " className="text-danger"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
