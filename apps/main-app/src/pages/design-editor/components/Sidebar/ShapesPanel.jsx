import React from 'react';
import { Square, Circle, Triangle, Star, Heart } from 'lucide-react';

const shapes = [
  { id: 'rectangle', label: 'Rectángulo', icon: Square, shape: 'rectangle' },
  { id: 'circle', label: 'Círculo', icon: Circle, shape: 'circle' },
  { id: 'triangle', label: 'Triángulo', icon: Triangle, shape: 'triangle' },
  { id: 'star', label: 'Estrella', icon: Star, shape: 'star' },
  { id: 'heart', label: 'Corazón', icon: Heart, shape: 'heart' },
];

const colors = [
  '#000000',
  '#FFFFFF',
  '#8B7355',
  '#E8DCC4',
  '#C19A6B',
  '#F5F5DC',
  '#D4AF37',
  '#FFB6C1',
];

export default function ShapesPanel({ onAdd }) {
  const [selectedColor, setSelectedColor] = React.useState('#000000');

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold " style={{ color: 'var(--color-text)' }}>Formas</h3>
        <p className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>
          Añade formas geométricas a tu diseño
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {shapes.map((shape) => {
          const Icon = shape.icon;
          return (
            <button
              key={shape.id}
              onClick={() => onAdd({ type: 'shape', shape: shape.shape, fill: selectedColor })}
              className="aspect-square  rounded-lg flex flex-col items-center justify-center gap-2 hover: transition-colors group" style={{ backgroundColor: 'var(--color-bg)' }} style={{ backgroundColor: 'var(--color-bg)' }}
            >
              <Icon className="w-8 h-8  group-hover:" style={{ color: 'var(--color-text-secondary)' }} style={{ color: 'var(--color-text)' }} />
              <span className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>{shape.label}</span>
            </button>
          );
        })}
      </div>

      <div className="pt-4 border-t " style={{ borderColor: 'var(--color-border)' }}>
        <div className="text-xs  mb-2" style={{ color: 'var(--color-text-secondary)' }}>Color</div>
        <div className="grid grid-cols-8 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`aspect-square rounded-lg transition-all ${
                selectedColor === color ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:scale-110'
              }`}
              style={{
                backgroundColor: color,
                border: color === '#FFFFFF' ? '1px solid #e5e7eb' : 'none',
              }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
