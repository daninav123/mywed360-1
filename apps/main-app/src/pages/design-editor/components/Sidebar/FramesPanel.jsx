import React, { useState } from 'react';
import { Square, Circle, Star, Sparkles } from 'lucide-react';
import DECORATIVE_FRAMES from '../../data/decorativeFrames';

export default function FramesPanel({ onAddElement }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hoveredFrame, setHoveredFrame] = useState(null);

  const categories = [
    { id: 'all', label: 'Todos', icon: Square },
    { id: 'simple', label: 'Simple', icon: Square },
    { id: 'elegant', label: 'Elegante', icon: Circle },
    { id: 'decorative', label: 'Decorativo', icon: Star },
    { id: 'vintage', label: 'Vintage', icon: Sparkles },
  ];

  const handleAddFrame = (frame) => {
    onAddElement({
      type: 'frame',
      data: frame,
    });
  };

  const filteredFrames = selectedCategory === 'all'
    ? DECORATIVE_FRAMES
    : DECORATIVE_FRAMES.filter(f => f.category === selectedCategory);

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">Marcos Decorativos</h3>
        <p className="text-xs text-gray-600">
          {filteredFrames.length} marcos disponibles
        </p>
      </div>

      {/* Categorías */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <cat.icon className="w-3 h-3" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid de marcos */}
      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {filteredFrames.map((frame) => (
          <button
            key={frame.id}
            onClick={() => handleAddFrame(frame)}
            onMouseEnter={() => setHoveredFrame(frame.id)}
            onMouseLeave={() => setHoveredFrame(null)}
            className="group relative aspect-square rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all bg-white overflow-hidden"
          >
            {/* Preview visual del marco */}
            <div className="w-full h-full p-4 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {frame.category === 'simple' && (
                  <>
                    <rect x="10" y="10" width="80" height="80" fill="none" stroke="#D4AF37" strokeWidth="2" />
                    <rect x="15" y="15" width="70" height="70" fill="none" stroke="#D4AF37" strokeWidth="0.5" />
                  </>
                )}
                {frame.category === 'elegant' && (
                  <rect x="15" y="15" width="70" height="70" fill="none" stroke="#8B7355" strokeWidth="2.5" rx="8" />
                )}
                {frame.category === 'decorative' && (
                  <>
                    <rect x="20" y="20" width="60" height="60" fill="none" stroke="#D4AF37" strokeWidth="1.5" />
                    <rect x="10" y="10" width="10" height="10" fill="none" stroke="#D4AF37" strokeWidth="2" />
                    <rect x="80" y="10" width="10" height="10" fill="none" stroke="#D4AF37" strokeWidth="2" />
                    <rect x="10" y="80" width="10" height="10" fill="none" stroke="#D4AF37" strokeWidth="2" />
                    <rect x="80" y="80" width="10" height="10" fill="none" stroke="#D4AF37" strokeWidth="2" />
                  </>
                )}
                {frame.category === 'vintage' && (
                  <>
                    <line x1="10" y1="10" x2="35" y2="10" stroke="#6B5B4B" strokeWidth="2" />
                    <line x1="10" y1="10" x2="10" y2="35" stroke="#6B5B4B" strokeWidth="2" />
                    <line x1="65" y1="10" x2="90" y2="10" stroke="#6B5B4B" strokeWidth="2" />
                    <line x1="90" y1="10" x2="90" y2="35" stroke="#6B5B4B" strokeWidth="2" />
                    <line x1="10" y1="90" x2="35" y2="90" stroke="#6B5B4B" strokeWidth="2" />
                    <line x1="10" y1="65" x2="10" y2="90" stroke="#6B5B4B" strokeWidth="2" />
                    <line x1="65" y1="90" x2="90" y2="90" stroke="#6B5B4B" strokeWidth="2" />
                    <line x1="90" y1="65" x2="90" y2="90" stroke="#6B5B4B" strokeWidth="2" />
                  </>
                )}
              </svg>
            </div>

            {/* Overlay con nombre */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-center p-2 transition-opacity ${
              hoveredFrame === frame.id ? 'opacity-100' : 'opacity-0'
            }`}>
              <div className="text-center">
                <p className="text-xs font-semibold text-white">{frame.name}</p>
                <p className="text-[10px] text-gray-200">{frame.description}</p>
              </div>
            </div>

            {/* Badge de categoría */}
            <div className="absolute top-2 right-2">
              <span className="inline-block bg-white/90 text-gray-700 text-[10px] px-2 py-0.5 rounded-full font-medium">
                {frame.category}
              </span>
            </div>
          </button>
        ))}
      </div>

      {filteredFrames.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No hay marcos en esta categoría
        </div>
      )}

      {/* Info adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
        <p className="font-medium text-blue-800 mb-1">💡 Consejo</p>
        <p className="text-blue-700 text-[11px]">
          Los marcos se añaden automáticamente ajustados al tamaño del canvas. 
          Puedes cambiar su color desde el panel de propiedades.
        </p>
      </div>
    </div>
  );
}
