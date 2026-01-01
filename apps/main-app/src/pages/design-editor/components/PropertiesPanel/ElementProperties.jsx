import React, { useState, useEffect } from 'react';
import ColorPicker from './ColorPicker';
import { WEDDING_FONTS } from '../../utils/weddingFonts';

export default function ElementProperties({ element, canvasRef }) {
  const [props, setProps] = useState({
    fill: '#000000',
    fontSize: 32,
    fontFamily: 'Arial',
    opacity: 1,
    angle: 0,
    shadow: null,
  });

  useEffect(() => {
    if (element) {
      setProps({
        fill: element.fill || '#000000',
        fontSize: element.fontSize || 32,
        fontFamily: element.fontFamily || 'Arial',
        opacity: element.opacity !== undefined ? element.opacity : 1,
        angle: element.angle || 0,
      });
    }
  }, [element]);

  const updateProperty = (key, value) => {
    setProps((prev) => ({ ...prev, [key]: value }));

    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    activeObject.set(key, value);
    canvas.renderAll();
  };

  if (!element) return null;

  const isText = element.type === 'i-text' || element.type === 'text';
  const hasColor = element.fill !== undefined;

  return (
    <div className="space-y-4">
      {hasColor && (
        <ColorPicker
          value={props.fill}
          onChange={(color) => updateProperty('fill', color)}
          label="Color"
        />
      )}

      {isText && (
        <>
          <div>
            <label className="block text-xs font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
              Tamaño de fuente
            </label>
            <input
              type="range"
              min="8"
              max="120"
              value={props.fontSize}
              onChange={(e) => updateProperty('fontSize', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-xs  mt-1" style={{ color: 'var(--color-muted)' }}>{props.fontSize}px</div>
          </div>

          <div>
            <label className="block text-xs font-medium  mb-2" style={{ color: 'var(--color-text)' }}>Fuente</label>
            <select
              value={props.fontFamily}
              onChange={(e) => updateProperty('fontFamily', e.target.value)}
              className="w-full px-3 py-2 border  rounded text-sm" style={{ borderColor: 'var(--color-border)' }}
              style={{ fontFamily: props.fontFamily }}
            >
              {Object.entries(WEDDING_FONTS).map(([category, fonts]) => (
                <optgroup key={category} label={category}>
                  {fonts.map(font => (
                    <option 
                      key={font.family} 
                      value={font.family}
                      style={{ fontFamily: font.family }}
                    >
                      {font.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </>
      )}

      <div>
        <label className="block text-xs font-medium  mb-2" style={{ color: 'var(--color-text)' }}>Opacidad</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={props.opacity}
          onChange={(e) => updateProperty('opacity', parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="text-xs  mt-1" style={{ color: 'var(--color-muted)' }}>
          {Math.round(props.opacity * 100)}%
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium  mb-2" style={{ color: 'var(--color-text)' }}>Rotación</label>
        <input
          type="range"
          min="0"
          max="360"
          value={props.angle}
          onChange={(e) => updateProperty('angle', parseInt(e.target.value))}
          className="w-full"
        />
        <div className="text-xs  mt-1" style={{ color: 'var(--color-muted)' }}>{props.angle}°</div>
      </div>

      {/* Sombra */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={!!props.shadow}
            onChange={(e) => {
              if (e.target.checked) {
                updateProperty('shadow', {
                  color: 'rgba(0,0,0,0.3)',
                  blur: 10,
                  offsetX: 5,
                  offsetY: 5,
                });
              } else {
                updateProperty('shadow', null);
              }
            }}
            className="w-4 h-4  rounded" style={{ color: 'var(--color-primary)' }}
          />
          <span className="text-xs font-medium " style={{ color: 'var(--color-text)' }}>Sombra</span>
        </label>
      </div>

      <div className="pt-4 border-t " style={{ borderColor: 'var(--color-border)' }}>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className=" mb-1" style={{ color: 'var(--color-muted)' }}>Posición X</div>
            <div className="font-mono">{Math.round(element.left || 0)}px</div>
          </div>
          <div>
            <div className=" mb-1" style={{ color: 'var(--color-muted)' }}>Posición Y</div>
            <div className="font-mono">{Math.round(element.top || 0)}px</div>
          </div>
          <div>
            <div className=" mb-1" style={{ color: 'var(--color-muted)' }}>Ancho</div>
            <div className="font-mono">
              {Math.round((element.width || 0) * (element.scaleX || 1))}px
            </div>
          </div>
          <div>
            <div className=" mb-1" style={{ color: 'var(--color-muted)' }}>Alto</div>
            <div className="font-mono">
              {Math.round((element.height || 0) * (element.scaleY || 1))}px
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
