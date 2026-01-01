import React, { useState } from 'react';
import { Palette } from 'lucide-react';

const WEDDING_PALETTE = {
  'Clásicos': [
    { name: 'Blanco', color: '#FFFFFF' },
    { name: 'Marfil', color: '#FFFFF0' },
    { name: 'Champagne', color: '#F7E7CE' },
    { name: 'Dorado', color: '#D4AF37' },
    { name: 'Plata', color: '#C0C0C0' },
    { name: 'Negro', color: '#000000' },
  ],
  'Pasteles': [
    { name: 'Rosa Claro', color: '#FFE4E1' },
    { name: 'Melocotón', color: '#FFDAB9' },
    { name: 'Lavanda', color: '#E6E6FA' },
    { name: 'Azul Cielo', color: '#E0F4FF' },
    { name: 'Menta', color: '#E0FFF0' },
    { name: 'Lila Suave', color: '#F0E6FA' },
  ],
  'Románticos': [
    { name: 'Rosa', color: '#FFC0CB' },
    { name: 'Coral', color: '#FF7F50' },
    { name: 'Durazno', color: '#FFDAB9' },
    { name: 'Rojo Vino', color: '#722F37' },
    { name: 'Burgundy', color: '#800020' },
    { name: 'Rosa Viejo', color: '#C08081' },
  ],
  'Elegantes': [
    { name: 'Azul Marino', color: '#000080' },
    { name: 'Verde Bosque', color: '#228B22' },
    { name: 'Ciruela', color: '#8E4585' },
    { name: 'Gris Carbón', color: '#36454F' },
    { name: 'Verde Salvia', color: '#9CAF88' },
    { name: 'Terracota', color: '#E07B39' },
  ],
  'Modernos': [
    { name: 'Turquesa', color: '#40E0D0' },
    { name: 'Amarillo', color: '#FFD700' },
    { name: 'Verde Esmeralda', color: '#50C878' },
    { name: 'Fucsia', color: '#FF00FF' },
    { name: 'Naranja', color: '#FFA500' },
    { name: 'Azul Eléctrico', color: '#7DF9FF' },
  ],
};

export default function ColorPicker({ value, onChange, label = 'Color' }) {
  const [showPicker, setShowPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Clásicos');

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium " style={{ color: 'var(--color-text)' }}>{label}</label>
      
      {/* Color actual + input */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center gap-2 px-3 py-2 border  rounded-md hover: transition-colors" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-bg)' }}
          style={{ backgroundColor: value }}
        >
          <div 
            className="w-6 h-6 rounded border " style={{ borderColor: 'var(--color-border)' }} 
            style={{ backgroundColor: value }}
          />
          <Palette className="w-4 h-4 " style={{ color: 'var(--color-text-secondary)' }} />
        </button>
        
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 text-xs border  rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono" style={{ borderColor: 'var(--color-border)' }}
          placeholder="#000000"
        />
      </div>

      {/* Paleta expandible */}
      {showPicker && (
        <div className="border  rounded-lg p-3  shadow-lg" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
          {/* Categorías */}
          <div className="flex gap-1 mb-3 overflow-x-auto">
            {Object.keys(WEDDING_PALETTE).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  activeCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Grid de colores */}
          <div className="grid grid-cols-6 gap-2">
            {WEDDING_PALETTE[activeCategory].map((item) => (
              <button
                key={item.color}
                onClick={() => {
                  onChange(item.color);
                  setShowPicker(false);
                }}
                className="group relative"
                title={item.name}
              >
                <div
                  className="w-full aspect-square rounded-md border-2 transition-all hover:scale-110"
                  style={{ 
                    backgroundColor: item.color,
                    borderColor: value === item.color ? '#3B82F6' : '#D1D5DB'
                  }}
                />
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {item.name}
                </span>
              </button>
            ))}
          </div>

          {/* Input HTML5 color picker */}
          <div className="mt-3 pt-3 border-t " style={{ borderColor: 'var(--color-border)' }}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <span className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>Selector personalizado</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
