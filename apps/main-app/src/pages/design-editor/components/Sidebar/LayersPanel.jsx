import React, { useState, useEffect } from 'react';
import { Layers, Eye, EyeOff, Lock, Unlock, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

export default function LayersPanel({ canvasRef }) {
  const [layers, setLayers] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState(null);

  const refreshLayers = () => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const objects = canvas.getObjects();
    const layersList = objects.map((obj, index) => ({
      id: obj.id || `layer-${index}`,
      name: obj.name || getObjectName(obj),
      type: obj.type,
      visible: obj.visible !== false,
      locked: obj.selectable === false,
      index,
      object: obj,
    })).reverse(); // Invertir para que el top sea el primero visualmente

    setLayers(layersList);
  };

  useEffect(() => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    refreshLayers();

    canvas.on('object:added', refreshLayers);
    canvas.on('object:removed', refreshLayers);
    canvas.on('object:modified', refreshLayers);
    canvas.on('selection:created', (e) => {
      if (e.selected?.[0]) {
        setSelectedLayer(e.selected[0].id || `layer-${canvas.getObjects().indexOf(e.selected[0])}`);
      }
    });
    canvas.on('selection:updated', (e) => {
      if (e.selected?.[0]) {
        setSelectedLayer(e.selected[0].id || `layer-${canvas.getObjects().indexOf(e.selected[0])}`);
      }
    });
    canvas.on('selection:cleared', () => setSelectedLayer(null));

    return () => {
      canvas.off('object:added', refreshLayers);
      canvas.off('object:removed', refreshLayers);
      canvas.off('object:modified', refreshLayers);
    };
  }, [canvasRef]);

  const getObjectName = (obj) => {
    if (obj.text) return obj.text.substring(0, 20) + (obj.text.length > 20 ? '...' : '');
    if (obj.type === 'image') return 'Imagen';
    if (obj.type === 'group') return 'Grupo SVG';
    if (obj.type === 'rect') return 'Rectángulo';
    if (obj.type === 'circle') return 'Círculo';
    if (obj.type === 'i-text') return 'Texto';
    return obj.type || 'Elemento';
  };

  const selectLayer = (layer) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    canvas.setActiveObject(layer.object);
    canvas.renderAll();
    setSelectedLayer(layer.id);
  };

  const toggleVisibility = (layer, e) => {
    e.stopPropagation();
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    
    layer.object.visible = !layer.object.visible;
    canvas.renderAll();
    refreshLayers();
  };

  const toggleLock = (layer, e) => {
    e.stopPropagation();
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    
    layer.object.selectable = !layer.object.selectable;
    layer.object.evented = !layer.object.evented;
    canvas.renderAll();
    refreshLayers();
  };

  const deleteLayer = (layer, e) => {
    e.stopPropagation();
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;
    
    canvas.remove(layer.object);
    canvas.renderAll();
  };

  const moveLayer = (layer, direction) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    if (direction === 'up') {
      canvas.bringForward(layer.object);
    } else {
      canvas.sendBackwards(layer.object);
    }
    canvas.renderAll();
    refreshLayers();
  };

  return (
    <div className="h-full flex flex-col  border-l " className="border-default" className="bg-surface">
      {/* Header */}
      <div className="p-4 border-b " className="border-default">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 " className="text-primary" />
          <h3 className="text-sm font-semibold " className="text-body">Capas</h3>
        </div>
        <p className="text-xs  mt-1" className="text-secondary">
          {layers.length} {layers.length === 1 ? 'elemento' : 'elementos'}
        </p>
      </div>

      {/* Layers list */}
      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="p-4 text-center text-sm " className="text-muted">
            No hay elementos en el canvas
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {layers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => selectLayer(layer)}
                className={`p-3 cursor-pointer transition-colors ${
                  selectedLayer === layer.id
                    ? 'bg-blue-50 border-l-2 border-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* Visibility toggle */}
                  <button
                    onClick={(e) => toggleVisibility(layer, e)}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    {layer.visible ? (
                      <Eye className="w-4 h-4 " className="text-secondary" />
                    ) : (
                      <EyeOff className="w-4 h-4 " className="text-muted" />
                    )}
                  </button>

                  {/* Lock toggle */}
                  <button
                    onClick={(e) => toggleLock(layer, e)}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    {layer.locked ? (
                      <Lock className="w-4 h-4 " className="text-secondary" />
                    ) : (
                      <Unlock className="w-4 h-4 " className="text-muted" />
                    )}
                  </button>

                  {/* Layer name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium  truncate" className="text-body">
                      {layer.name}
                    </p>
                    <p className="text-xs " className="text-muted">
                      {layer.type}
                    </p>
                  </div>

                  {/* Move controls */}
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveLayer(layer, 'up'); }}
                      className="p-1 rounded hover:bg-gray-200 transition-colors"
                    >
                      <ChevronUp className="w-4 h-4 " className="text-secondary" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveLayer(layer, 'down'); }}
                      className="p-1 rounded hover:bg-gray-200 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4 " className="text-secondary" />
                    </button>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={(e) => deleteLayer(layer, e)}
                    className="p-1 rounded hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 " className="text-danger" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shortcuts info */}
      <div className="p-3 border-t  " className="border-default" className="bg-page">
        <p className="text-xs font-medium  mb-2" className="text-body">⌨️ Atajos</p>
        <div className="space-y-1 text-[11px] " className="text-secondary">
          <div className="flex justify-between">
            <span>Copiar</span>
            <span className="font-mono">⌘+C</span>
          </div>
          <div className="flex justify-between">
            <span>Pegar</span>
            <span className="font-mono">⌘+V</span>
          </div>
          <div className="flex justify-between">
            <span>Duplicar</span>
            <span className="font-mono">⌘+D</span>
          </div>
          <div className="flex justify-between">
            <span>Eliminar</span>
            <span className="font-mono">⌫</span>
          </div>
        </div>
      </div>
    </div>
  );
}
