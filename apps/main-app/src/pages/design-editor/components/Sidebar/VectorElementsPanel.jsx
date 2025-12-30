import React, { useState, useMemo, useEffect } from 'react';
import { Search, Heart, Flower2, Shapes, Frame, Star, Palette, FlipHorizontal, FlipVertical, RotateCw } from 'lucide-react';
import { 
  UNIQUE_WEDDING_ICONS, 
  UNIQUE_FLOWERS, 
  UNIQUE_SHAPES,
  getUniqueCount 
} from '../../data/uniqueVectors100';

/**
 * Panel de Elementos Vectoriales
 * 
 * Permite buscar y añadir elementos vectoriales al canvas
 * con control de colores personalizados
 */
export default function VectorElementsPanel({ onAddElement }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillEnabled, setFillEnabled] = useState(true);
  const [strokeEnabled, setStrokeEnabled] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [draggedElement, setDraggedElement] = useState(null);
  
  // Cargar favoritos desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('vectorFavorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading favorites:', e);
      }
    }
  }, []);
  
  // Guardar favoritos en localStorage
  const toggleFavorite = (elementId) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(elementId)
        ? prev.filter(id => id !== elementId)
        : [...prev, elementId];
      localStorage.setItem('vectorFavorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };
  
  const counts = getUniqueCount();
  
  const categories = [
    { id: 'all', label: 'Todos', icon: Star, count: counts.total },
    { id: 'favorites', label: 'Favoritos', icon: Star, count: favorites.length },
    { id: 'icons', label: 'Iconos', icon: Heart, count: counts.icons },
    { id: 'flowers', label: 'Flores', icon: Flower2, count: counts.flowers },
    { id: 'shapes', label: 'Formas', icon: Shapes, count: counts.shapes },
  ];
  
  // Filtrar elementos según búsqueda y categoría
  const filteredElements = useMemo(() => {
    let allElements = [];
    
    if (selectedCategory === 'favorites') {
      // Solo mostrar favoritos
      const allItems = [
        ...Object.entries(UNIQUE_WEDDING_ICONS).map(([key, value]) => ({ id: key, ...value, category: 'icons' })),
        ...Object.entries(UNIQUE_FLOWERS).map(([key, value]) => ({ id: key, ...value, category: 'flowers' })),
        ...Object.entries(UNIQUE_SHAPES).map(([key, value]) => ({ id: key, ...value, category: 'shapes' })),
      ];
      allElements = allItems.filter(el => favorites.includes(el.id));
    } else {
      if (selectedCategory === 'all' || selectedCategory === 'icons') {
        allElements = [...allElements, ...Object.entries(UNIQUE_WEDDING_ICONS).map(([key, value]) => ({
          id: key,
          ...value,
          category: 'icons',
        }))];
      }
      
      if (selectedCategory === 'all' || selectedCategory === 'flowers') {
        allElements = [...allElements, ...Object.entries(UNIQUE_FLOWERS).map(([key, value]) => ({
          id: key,
          ...value,
          category: 'flowers',
        }))];
      }
      
      if (selectedCategory === 'all' || selectedCategory === 'shapes') {
        allElements = [...allElements, ...Object.entries(UNIQUE_SHAPES).map(([key, value]) => ({
          id: key,
          ...value,
          category: 'shapes',
        }))];
      }
    }
    
    // Aplicar búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      allElements = allElements.filter(el => 
        el.id.toLowerCase().includes(query) ||
        el.category?.toLowerCase().includes(query)
      );
    }
    
    // Limitar a 100 elementos para performance
    return allElements.slice(0, 100);
  }, [searchQuery, selectedCategory, favorites]);
  
  const handleAddElement = (element, transform = {}) => {
    if (!onAddElement) return;
    
    // Crear objeto SVG para Fabric.js
    const svgElement = {
      type: 'path',
      path: element.path,
      fill: fillEnabled ? selectedColor : 'transparent',
      stroke: strokeEnabled ? strokeColor : 'none',
      strokeWidth: strokeEnabled ? 2 : 0,
      scaleX: transform.flipH ? -2 : 2,
      scaleY: transform.flipV ? -2 : 2,
      angle: transform.rotation || 0,
      left: 100,
      top: 100,
    };
    
    onAddElement('shape', svgElement);
  };
  
  // Drag & Drop handlers
  const handleDragStart = (e, element) => {
    console.log('🎯 Drag started:', element.id);
    setDraggedElement(element);
    e.dataTransfer.effectAllowed = 'copy';
    
    // Pasar datos del elemento con colores aplicados
    const elementData = {
      path: element.path,
      fill: fillEnabled ? selectedColor : 'transparent',
      stroke: strokeEnabled ? strokeColor : null,
      strokeWidth: strokeEnabled ? 2 : 0,
    };
    
    console.log('📦 Element data:', elementData);
    e.dataTransfer.setData('text/plain', JSON.stringify(elementData));
    
    // Crear imagen de preview para el drag
    try {
      const preview = e.currentTarget.cloneNode(true);
      preview.style.position = 'absolute';
      preview.style.top = '-1000px';
      document.body.appendChild(preview);
      e.dataTransfer.setDragImage(preview, 50, 50);
      setTimeout(() => document.body.removeChild(preview), 0);
    } catch (error) {
      console.warn('Error setting drag image:', error);
    }
  };
  
  const handleDragEnd = () => {
    console.log('✅ Drag ended');
    setDraggedElement(null);
  };
  
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Elementos Vectoriales</h3>
          <span className="text-xs text-gray-500">{filteredElements.length} elementos</span>
        </div>
        <p className="text-xs text-gray-600">
          {counts.total}+ elementos vectoriales con colores personalizables
        </p>
      </div>
      
      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar elementos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      {/* Categorías */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              <span className="text-xs opacity-75">({cat.count})</span>
            </button>
          );
        })}
      </div>
      
      {/* Controles de Color */}
      <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">Personalización</span>
          <Palette className="w-4 h-4 text-gray-400" />
        </div>
        
        {/* Fill */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={fillEnabled}
            onChange={(e) => setFillEnabled(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label className="text-xs text-gray-700 flex-1">Relleno</label>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            disabled={!fillEnabled}
            className="w-10 h-8 rounded border border-gray-300 cursor-pointer disabled:opacity-50"
          />
        </div>
        
        {/* Stroke */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={strokeEnabled}
            onChange={(e) => setStrokeEnabled(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label className="text-xs text-gray-700 flex-1">Borde</label>
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            disabled={!strokeEnabled}
            className="w-10 h-8 rounded border border-gray-300 cursor-pointer disabled:opacity-50"
          />
        </div>
        
        {/* Vista previa */}
        <div className="mt-2 p-2 bg-white rounded border border-gray-200 flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24">
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill={fillEnabled ? selectedColor : 'transparent'}
              stroke={strokeEnabled ? strokeColor : 'none'}
              strokeWidth={strokeEnabled ? 1 : 0}
            />
          </svg>
        </div>
      </div>
      
      {/* Grid de Elementos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-gray-700">Elementos</h4>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredElements.length === 0 ? (
            <div className="col-span-4 text-center py-8 text-sm text-gray-500">
              No se encontraron elementos
            </div>
          ) : (
            filteredElements.map((element) => (
              <div key={element.id} className="relative group">
                {/* Área draggable principal */}
                <div
                  onDragStart={(e) => handleDragStart(e, element)}
                  onDragEnd={handleDragEnd}
                  draggable
                  onClick={() => handleAddElement(element)}
                  className="w-full aspect-square p-3 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all cursor-grab active:cursor-grabbing hover:scale-105"
                  title={element.id.replace(/_/g, ' ')}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-full h-full pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d={element.path}
                      fill={fillEnabled ? selectedColor : 'transparent'}
                      stroke={strokeEnabled ? strokeColor : '#9CA3AF'}
                      strokeWidth={strokeEnabled ? 1.5 : 0.8}
                      className="transition-colors"
                    />
                  </svg>
                </div>
                
                {/* Tooltip con nombre - NO bloquea eventos */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {element.id.replace(/_/g, ' ')}
                </div>
                
                {/* Botón de favorito - pointer-events-auto solo en el botón */}
                <div className="absolute top-2 right-2 pointer-events-none">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(element.id);
                    }}
                    className={`pointer-events-auto p-1.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 ${
                      favorites.includes(element.id) ? 'text-yellow-500 opacity-100' : 'text-gray-400 hover:text-yellow-500'
                    }`}
                    title={favorites.includes(element.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                  >
                    <Star className="w-4 h-4" fill={favorites.includes(element.id) ? 'currentColor' : 'none'} strokeWidth={2} />
                  </button>
                </div>
                
                {/* Transformaciones rápidas - pointer-events-auto solo en botones */}
                <div className="absolute bottom-2 left-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddElement(element, { flipH: true });
                    }}
                    className="pointer-events-auto flex-1 p-1.5 bg-white shadow-md rounded text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Voltear horizontal"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5 mx-auto" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddElement(element, { flipV: true });
                    }}
                    className="pointer-events-auto flex-1 p-1.5 bg-white shadow-md rounded text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Voltear vertical"
                  >
                    <FlipVertical className="w-3.5 h-3.5 mx-auto" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddElement(element, { rotation: 90 });
                    }}
                    className="pointer-events-auto flex-1 p-1.5 bg-white shadow-md rounded text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Rotar 90°"
                  >
                    <RotateCw className="w-3.5 h-3.5 mx-auto" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {filteredElements.length >= 100 && (
        <div className="text-xs text-center text-gray-500 bg-amber-50 p-2 rounded">
          Mostrando 100 de {selectedCategory === 'all' ? counts.total : counts[selectedCategory]} elementos.
          Usa la búsqueda para encontrar más.
        </div>
      )}
      
      {/* Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 text-xs">
        <p className="font-semibold text-blue-900 mb-2 flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
          Sistema Vectorial Profesional
        </p>
        <ul className="text-blue-800 space-y-1.5 text-[11px]">
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span><strong>Click:</strong> Añade al canvas</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span><strong>Arrastra:</strong> Posiciona donde quieras</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span><strong>Hover:</strong> Muestra transformaciones</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600">⭐</span>
            <span><strong>Favoritos:</strong> Guardados en tu navegador</span>
          </li>
        </ul>
      </div>
      
      {/* Custom CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}} />
    </div>
  );
}
