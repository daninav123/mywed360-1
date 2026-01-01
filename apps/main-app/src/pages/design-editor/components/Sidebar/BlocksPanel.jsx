import React, { useState } from 'react';
import DYNAMIC_BLOCKS, { BLOCK_CATEGORIES } from '../../data/dynamicBlocks';
import { useWeddingData } from '../../hooks/useWeddingData';

export default function BlocksPanel({ onAddElement, designType = 'invitation' }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { weddingData, loading } = useWeddingData();

  const filteredBlocks = selectedCategory === 'all'
    ? DYNAMIC_BLOCKS
    : DYNAMIC_BLOCKS.filter(block => block.category === selectedCategory);

  const handleAddBlock = (block) => {
    const generatedElement = block.generator(weddingData);
    
    // Si el generador devuelve un array (como el badge), añadir todos los elementos
    if (Array.isArray(generatedElement)) {
      generatedElement.forEach(elem => {
        onAddElement({
          type: elem.type,
          ...elem,
        });
      });
    } else {
      onAddElement({
        type: generatedElement.type,
        ...generatedElement,
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold " style={{ color: 'var(--color-text)' }}>Bloques Dinámicos</h3>
        <p className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>
          Elementos que se llenan automáticamente con datos de InfoBoda
        </p>
      </div>

      {/* Categorías */}
      <div className="space-y-1">
        <p className="text-xs font-medium " style={{ color: 'var(--color-text)' }}>Categoría</p>
        <div className="grid grid-cols-2 gap-1">
          {BLOCK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2 py-1.5 text-xs rounded transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Bloques */}
      <div className="space-y-2">
        <p className="text-xs font-medium " style={{ color: 'var(--color-text)' }}>
          {filteredBlocks.length} bloques disponibles
        </p>
        
        {loading ? (
          <div className="text-center py-8  text-sm" style={{ color: 'var(--color-muted)' }}>
            Cargando datos...
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredBlocks.map((block) => (
              <button
                key={block.id}
                onClick={() => handleAddBlock(block)}
                className="w-full p-3  border  rounded-lg hover:border-blue-400 hover:shadow-md transition-all group text-left" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-2xl flex-shrink-0">{block.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium  group-hover:" style={{ color: 'var(--color-primary)' }} style={{ color: 'var(--color-text)' }}>
                      {block.name}
                    </div>
                    <div className="text-xs  mt-0.5" style={{ color: 'var(--color-muted)' }}>
                      {block.description}
                    </div>
                    
                    {/* Preview del contenido */}
                    <div className="mt-2 p-2  rounded text-xs font-mono  truncate" style={{ color: 'var(--color-text)' }} style={{ backgroundColor: 'var(--color-bg)' }}>
                      {(() => {
                        const generated = block.generator(weddingData);
                        if (Array.isArray(generated)) {
                          return generated.find(g => g.text)?.text || '⏰ Badge';
                        }
                        return generated.text || '✨ Elemento decorativo';
                      })()}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Información de datos */}
      {!loading && weddingData && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs font-medium text-blue-900 mb-2">
            📋 Datos cargados de InfoBoda:
          </div>
          <div className="space-y-1 text-xs text-blue-700">
            <div>👰 Novia: <span className="font-medium">{weddingData.bride}</span></div>
            <div>👔 Novio: <span className="font-medium">{weddingData.groom}</span></div>
            <div>📅 Fecha: <span className="font-medium">{weddingData.formattedDate}</span></div>
            <div>🕐 Hora: <span className="font-medium">{weddingData.schedule}</span></div>
            <div>⛪ Lugar: <span className="font-medium">{weddingData.ceremonyPlace}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
