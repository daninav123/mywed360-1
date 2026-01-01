import React, { useState } from 'react';
import { Search } from 'lucide-react';
import WEDDING_ICONS, { searchIcons } from '../../data/weddingIcons';

export default function IconsPanel({ onAddElement }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddIcon = (icon) => {
    onAddElement({
      type: 'icon',
      data: {
        path: icon.path,
        name: icon.name,
        fill: '#000000',
        width: 100,
        height: 100,
      },
    });
  };

  // Filtrar iconos
  const getFilteredIcons = () => {
    if (searchQuery.trim()) {
      return searchIcons(searchQuery);
    }
    
    if (selectedCategory === 'all') {
      const allIcons = [];
      Object.values(WEDDING_ICONS).forEach(icons => {
        allIcons.push(...icons);
      });
      return allIcons;
    }
    
    return WEDDING_ICONS[selectedCategory] || [];
  };

  const filteredIcons = getFilteredIcons();

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold " style={{ color: 'var(--color-text)' }}>Iconos de Boda</h3>
        <p className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>
          {filteredIcons.length} iconos disponibles
        </p>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 " style={{ color: 'var(--color-muted)' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar iconos..."
          className="w-full pl-10 pr-3 py-2 text-xs border  rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
        />
      </div>

      {/* Categorías */}
      {!searchQuery && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          {Object.keys(WEDDING_ICONS).map((category) => (
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
      )}

      {/* Grid de iconos */}
      <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto">
        {filteredIcons.map((icon, index) => (
          <button
            key={`${icon.id}-${index}`}
            onClick={() => handleAddIcon(icon)}
            className="group relative aspect-square p-3 border-2  rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all" style={{ borderColor: 'var(--color-border)' }}
            title={icon.name}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-full h-full  group-hover: transition-colors" style={{ color: 'var(--color-primary)' }} style={{ color: 'var(--color-text)' }}
              fill="currentColor"
            >
              <path d={icon.path} />
            </svg>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {icon.name}
            </div>
          </button>
        ))}
      </div>

      {filteredIcons.length === 0 && (
        <div className="text-center py-8  text-sm" style={{ color: 'var(--color-muted)' }}>
          No se encontraron iconos
        </div>
      )}
    </div>
  );
}
