import React, { useState } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';

const colorPalettes = [
  {
    id: 'romantic',
    name: 'Romántico',
    description: 'Suave y delicado',
    colors: ['#FFE4E9', '#FFC1D5', '#FF9AB8', '#E8527D', '#C7365F'],
    tags: ['Boda', 'Elegante'],
    popular: true,
  },
  {
    id: 'modern',
    name: 'Moderno',
    description: 'Limpio y minimalista',
    colors: ['#F8FAFC', '#E2E8F0', '#94A3B8', '#475569', '#1E293B'],
    tags: ['Contemporáneo', 'Simple'],
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Clásico atemporal',
    colors: ['#FFF8E7', '#F5E6D3', '#D4AF37', '#8B7355', '#5C4033'],
    tags: ['Retro', 'Elegante'],
    popular: true,
  },
  {
    id: 'beach',
    name: 'Playa',
    description: 'Fresco y tropical',
    colors: ['#E0F7FA', '#80DEEA', '#26C6DA', '#00ACC1', '#00838F'],
    tags: ['Verano', 'Relajado'],
    popular: true,
  },
  {
    id: 'garden',
    name: 'Jardín',
    description: 'Natural y orgánico',
    colors: ['#F1F8E9', '#C5E1A5', '#9CCC65', '#7CB342', '#558B2F'],
    tags: ['Naturaleza', 'Fresco'],
  },
  {
    id: 'elegant',
    name: 'Elegante',
    description: 'Sofisticado y formal',
    colors: ['#FFFFFF', '#F5F5F5', '#D4AF37', '#2C2C2C', '#000000'],
    tags: ['Formal', 'Clásico'],
    popular: true,
  },
  {
    id: 'autumn',
    name: 'Otoño',
    description: 'Cálido y acogedor',
    colors: ['#FFF8DC', '#FFE4B5', '#DEB887', '#CD853F', '#8B4513'],
    tags: ['Otoño', 'Cálido'],
  },
  {
    id: 'spring',
    name: 'Primavera',
    description: 'Luminoso y alegre',
    colors: ['#FFF9E6', '#FFEAA7', '#FAB1A0', '#FF7675', '#FD79A8'],
    tags: ['Primavera', 'Colorido'],
  },
  {
    id: 'lavender',
    name: 'Lavanda',
    description: 'Sereno y romántico',
    colors: ['#F8F5FF', '#E9D5FF', '#C084FC', '#9333EA', '#6B21A8'],
    tags: ['Morado', 'Romántico'],
  },
  {
    id: 'coral',
    name: 'Coral',
    description: 'Vibrante y alegre',
    colors: ['#FFF5F0', '#FFD4C8', '#FF8C69', '#FF6B47', '#FF4500'],
    tags: ['Verano', 'Energético'],
  },
  {
    id: 'navy',
    name: 'Navy & Oro',
    description: 'Clásico y sofisticado',
    colors: ['#F8F9FA', '#FFD700', '#4169E1', '#000080', '#00008B'],
    tags: ['Clásico', 'Elegante'],
  },
  {
    id: 'blush',
    name: 'Blush & Gris',
    description: 'Suave y contemporáneo',
    colors: ['#FFFFFF', '#FFE4E1', '#FFC0CB', '#808080', '#696969'],
    tags: ['Moderno', 'Sutil'],
  },
];

const ColorPaletteSelector = ({ onApply, selectedPaletteId }) => {
  const [hoveredPalette, setHoveredPalette] = useState(null);
  const [filter, setFilter] = useState('all');

  const filteredPalettes =
    filter === 'all'
      ? colorPalettes
      : filter === 'popular'
        ? colorPalettes.filter((p) => p.popular)
        : colorPalettes;

  const handleApply = (palette) => {
    onApply?.(palette);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Palette size={24} className="text-purple-600" />
          Paletas de Color
        </h3>
        <p className="text-sm text-gray-600 mt-1">Aplica una paleta profesional con un solo clic</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`
            px-4 py-2 rounded-lg font-medium text-sm transition-all
            ${
              filter === 'all'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter('popular')}
          className={`
            flex items-center gap-1 px-4 py-2 rounded-lg font-medium text-sm transition-all
            ${
              filter === 'popular'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          <Sparkles size={14} />
          Populares
        </button>
      </div>

      {/* Palettes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPalettes.map((palette) => {
          const isSelected = selectedPaletteId === palette.id;
          const isHovered = hoveredPalette === palette.id;

          return (
            <div
              key={palette.id}
              onMouseEnter={() => setHoveredPalette(palette.id)}
              onMouseLeave={() => setHoveredPalette(null)}
              className={`
                relative border-2 rounded-xl overflow-hidden transition-all duration-300
                ${
                  isSelected
                    ? 'border-purple-500 shadow-xl ring-4 ring-purple-100'
                    : 'border-gray-200 hover:border-purple-300 hover:shadow-lg'
                }
              `}
            >
              {/* Colors Display */}
              <div className="flex h-24">
                {palette.colors.map((color, index) => (
                  <div
                    key={index}
                    className={`
                      flex-1 transition-all duration-300
                      ${isHovered ? 'scale-105' : ''}
                    `}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Info */}
              <div className="p-4 bg-white">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      {palette.name}
                      {palette.popular && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                          Popular
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5">{palette.description}</p>
                  </div>

                  {isSelected && (
                    <div className="bg-purple-600 text-white p-1 rounded-full">
                      <Check size={14} />
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {palette.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Color Codes */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {palette.colors.slice(0, 3).map((color, index) => (
                    <code
                      key={index}
                      className="text-xs bg-gray-50 px-2 py-0.5 rounded text-gray-600 font-mono"
                    >
                      {color}
                    </code>
                  ))}
                </div>

                {/* Apply Button */}
                <button
                  onClick={() => handleApply(palette)}
                  className={`
                    w-full py-2 rounded-lg font-medium text-sm transition-all
                    ${
                      isSelected
                        ? 'bg-purple-100 text-purple-700 cursor-default'
                        : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'
                    }
                  `}
                  disabled={isSelected}
                >
                  {isSelected ? 'En uso' : 'Aplicar paleta'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>💡 Tip:</strong> Las paletas se aplicarán automáticamente en tu próxima
          generación. Puedes personalizar los colores después en el prompt si lo deseas.
        </p>
      </div>
    </div>
  );
};

export default ColorPaletteSelector;
