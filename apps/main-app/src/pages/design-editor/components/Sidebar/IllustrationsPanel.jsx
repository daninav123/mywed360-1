import React, { useState } from 'react';
import { Search, Loader } from 'lucide-react';

const categories = [
  { id: 'all', label: 'Todos' },
  { id: 'florals', label: 'Florales' },
  { id: 'frames', label: 'Marcos' },
  { id: 'icons', label: 'Iconos' },
  { id: 'patterns', label: 'Patrones' },
  { id: 'ornaments', label: 'Ornamentos' },
];

export default function IllustrationsPanel({ onAdd, assets, loading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredAssets = assets?.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold " style={{ color: 'var(--color-text)' }}>Elementos Vectoriales</h3>
        <p className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>
          Añade ilustraciones de alta calidad
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 " style={{ color: 'var(--color-muted)' }} />
        <input
          type="text"
          placeholder="Buscar elementos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border  rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin " style={{ color: 'var(--color-muted)' }} />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {filteredAssets.length > 0 ? (
            filteredAssets.slice(0, 30).map((asset) => (
              <button
                key={asset.id}
                onClick={() => handleAddAsset(asset)}
                className="group relative aspect-square  rounded-lg hover: transition-all hover:ring-2 hover:ring-blue-500 p-2" style={{ backgroundColor: 'var(--color-bg)' }} style={{ backgroundColor: 'var(--color-bg)' }}
                data-testid="asset-item"
              >
                <div className="w-full h-full flex items-center justify-center">
                  {asset.thumbnail ? (
                    <img
                      src={asset.thumbnail}
                      alt={asset.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : asset.svgData ? (
                    <div 
                      className="w-full h-full"
                      dangerouslySetInnerHTML={{ __html: asset.svgData }}
                    />
                  ) : (
                    <div className="text-xs  text-center" style={{ color: 'var(--color-muted)' }}>{asset.name}</div>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="col-span-3 py-8 text-center text-sm " style={{ color: 'var(--color-muted)' }}>
              No se encontraron elementos
            </div>
          )}
        </div>
      )}

      <div className="pt-4 border-t " style={{ borderColor: 'var(--color-border)' }}>
        <button className="w-full py-2 px-4 text-sm font-medium  border  rounded-lg hover:bg-blue-50 transition-colors" style={{ borderColor: 'var(--color-primary)' }} style={{ color: 'var(--color-primary)' }}>
          Explorar toda la biblioteca
        </button>
      </div>
    </div>
  );
}
