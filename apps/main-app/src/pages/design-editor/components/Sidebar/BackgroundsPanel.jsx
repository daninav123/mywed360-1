import React, { useState } from 'react';
import BACKGROUND_PATTERNS from '../../data/backgroundPatterns';

export default function BackgroundsPanel({ onSetBackground }) {
  const [selectedCategory, setSelectedCategory] = useState('Sólidos');
  const [selectedBg, setSelectedBg] = useState(null);

  const handleSelect = (pattern) => {
    setSelectedBg(pattern.id);
    onSetBackground({
      type: 'background',
      data: pattern,
    });
  };

  const currentPatterns = BACKGROUND_PATTERNS[selectedCategory] || [];

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">Fondos</h3>
        <p className="text-xs text-gray-600">
          {currentPatterns.length} fondos disponibles
        </p>
      </div>

      {/* Categorías */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(BACKGROUND_PATTERNS).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Grid de fondos */}
      <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
        {currentPatterns.map((pattern) => (
          <button
            key={pattern.id}
            onClick={() => handleSelect(pattern)}
            className={`group relative aspect-square rounded-lg border-2 transition-all ${
              selectedBg === pattern.id
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-400'
            }`}
            style={{
              backgroundColor: pattern.color || pattern.base || '#FFFFFF',
              background: pattern.type === 'gradient'
                ? `linear-gradient(135deg, ${pattern.colors[0]}, ${pattern.colors[1]})`
                : undefined,
            }}
            title={pattern.name}
          >
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {pattern.name}
            </div>
          </button>
        ))}
      </div>

      {currentPatterns.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No hay fondos en esta categoría
        </div>
      )}
    </div>
  );
}
