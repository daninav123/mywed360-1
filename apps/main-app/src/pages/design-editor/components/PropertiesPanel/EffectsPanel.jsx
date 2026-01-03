import React, { useState, useEffect } from 'react';

export default function EffectsPanel({ selectedElement, canvasRef }) {
  const [shadow, setShadow] = useState({ enabled: false, blur: 10, offsetX: 5, offsetY: 5, color: '#000000' });
  const [stroke, setStroke] = useState({ enabled: false, width: 2, color: '#000000' });
  const [opacity, setOpacity] = useState(100);

  useEffect(() => {
    if (selectedElement) {
      // Cargar valores actuales del elemento
      setOpacity((selectedElement.opacity || 1) * 100);
      
      if (selectedElement.shadow) {
        setShadow({
          enabled: true,
          blur: selectedElement.shadow.blur || 10,
          offsetX: selectedElement.shadow.offsetX || 5,
          offsetY: selectedElement.shadow.offsetY || 5,
          color: selectedElement.shadow.color || '#000000'
        });
      }
      
      if (selectedElement.stroke) {
        setStroke({
          enabled: true,
          width: selectedElement.strokeWidth || 2,
          color: selectedElement.stroke
        });
      }
    }
  }, [selectedElement]);

  const applyOpacity = (value) => {
    setOpacity(value);
    const canvas = canvasRef.current?.getCanvas();
    const active = canvas?.getActiveObject();
    if (active) {
      active.set({ opacity: value / 100 });
      canvas.renderAll();
    }
  };

  const applyShadow = (newShadow) => {
    setShadow(newShadow);
    const canvas = canvasRef.current?.getCanvas();
    const active = canvas?.getActiveObject();
    if (active) {
      if (newShadow.enabled) {
        active.set({
          shadow: {
            color: newShadow.color,
            blur: newShadow.blur,
            offsetX: newShadow.offsetX,
            offsetY: newShadow.offsetY
          }
        });
      } else {
        active.set({ shadow: null });
      }
      canvas.renderAll();
    }
  };

  const applyStroke = (newStroke) => {
    setStroke(newStroke);
    const canvas = canvasRef.current?.getCanvas();
    const active = canvas?.getActiveObject();
    if (active) {
      if (newStroke.enabled) {
        active.set({
          stroke: newStroke.color,
          strokeWidth: newStroke.width
        });
      } else {
        active.set({ stroke: null, strokeWidth: 0 });
      }
      canvas.renderAll();
    }
  };

  if (!selectedElement) {
    return (
      <div className="p-4 text-center  text-sm" className="text-muted">
        Selecciona un elemento para ver efectos
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Opacidad */}
      <div>
        <label className="block text-sm font-medium  mb-2" className="text-body">
          Opacidad: {opacity}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => applyOpacity(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Sombra */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium " className="text-body">Sombra</label>
          <input
            type="checkbox"
            checked={shadow.enabled}
            onChange={(e) => applyShadow({ ...shadow, enabled: e.target.checked })}
            className="rounded"
          />
        </div>

        {shadow.enabled && (
          <div className="space-y-3 pl-2">
            <div>
              <label className="text-xs " className="text-secondary">Color</label>
              <input
                type="color"
                value={shadow.color}
                onChange={(e) => applyShadow({ ...shadow, color: e.target.value })}
                className="w-full h-8 rounded"
              />
            </div>

            <div>
              <label className="text-xs " className="text-secondary">Desenfoque: {shadow.blur}px</label>
              <input
                type="range"
                min="0"
                max="50"
                value={shadow.blur}
                onChange={(e) => applyShadow({ ...shadow, blur: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs " className="text-secondary">Offset X: {shadow.offsetX}px</label>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={shadow.offsetX}
                  onChange={(e) => applyShadow({ ...shadow, offsetX: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs " className="text-secondary">Offset Y: {shadow.offsetY}px</label>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={shadow.offsetY}
                  onChange={(e) => applyShadow({ ...shadow, offsetY: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Borde */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium " className="text-body">Borde</label>
          <input
            type="checkbox"
            checked={stroke.enabled}
            onChange={(e) => applyStroke({ ...stroke, enabled: e.target.checked })}
            className="rounded"
          />
        </div>

        {stroke.enabled && (
          <div className="space-y-3 pl-2">
            <div>
              <label className="text-xs " className="text-secondary">Color</label>
              <input
                type="color"
                value={stroke.color}
                onChange={(e) => applyStroke({ ...stroke, color: e.target.value })}
                className="w-full h-8 rounded"
              />
            </div>

            <div>
              <label className="text-xs " className="text-secondary">Grosor: {stroke.width}px</label>
              <input
                type="range"
                min="1"
                max="20"
                value={stroke.width}
                onChange={(e) => applyStroke({ ...stroke, width: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
