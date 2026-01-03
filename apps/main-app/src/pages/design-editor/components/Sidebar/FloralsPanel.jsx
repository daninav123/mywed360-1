import React, { useState, useEffect } from 'react';
import { Flower2, Search, Star, Clock, Palette } from 'lucide-react';
import { getAllFloralIllustrations, FLORAL_CATEGORIES } from '../../data/floralIllustrationsVectorized';

const COLOR_FILTERS = [
  { id: 'all', name: 'Todos', icon: '🎨' },
  { id: 'green', name: 'Verdes', pattern: /eucalyptus|fern|palm|olive|foliage|leaf/i },
  { id: 'pink', name: 'Rosados', pattern: /rose|peony|carnation/i },
  { id: 'purple', name: 'Púrpuras', pattern: /lavender|provence|iris/i },
  { id: 'gold', name: 'Dorados', pattern: /geometric/i },
  { id: 'colorful', name: 'Coloridos', pattern: /dahlia|sunflower|hibiscus|poppy/i },
];

export default function FloralsPanel({ onAddElement }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, recent, favorites
  const [recentElements, setRecentElements] = useState([]);
  const [favoriteElements, setFavoriteElements] = useState([]);

  const illustrations = getAllFloralIllustrations();
  
  // Cargar favoritos desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('floral-favorites');
    if (saved) {
      setFavoriteElements(JSON.parse(saved));
    }
  }, []);
  
  // Guardar favoritos en localStorage
  useEffect(() => {
    localStorage.setItem('floral-favorites', JSON.stringify(favoriteElements));
  }, [favoriteElements]);
  
  const filteredIllustrations = illustrations.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filtro por color
    const matchesColor = selectedColor === 'all' || 
      COLOR_FILTERS.find(f => f.id === selectedColor)?.pattern.test(item.id);
    
    return matchesCategory && matchesSearch && matchesColor;
  });

  const handleAddFloral = (illustration) => {
    console.log('🌸 FloralsPanel: handleAddFloral llamado', illustration);
    
    // Añadir a recientes (máximo 20)
    setRecentElements(prev => {
      const filtered = prev.filter(item => item.id !== illustration.id);
      return [illustration, ...filtered].slice(0, 20);
    });
    
    // Todas las ilustraciones ahora son SVG vectoriales
    const element = {
      type: 'svg',
      url: illustration.url,
    };
    
    console.log('🌸 Añadiendo SVG vectorial:', element);
    onAddElement(element);
  };
  
  const toggleFavorite = (illustration, e) => {
    e.stopPropagation();
    setFavoriteElements(prev => {
      const isFavorite = prev.some(item => item.id === illustration.id);
      if (isFavorite) {
        return prev.filter(item => item.id !== illustration.id);
      } else {
        return [...prev, illustration];
      }
    });
  };
  
  const isFavorite = (illustration) => {
    return favoriteElements.some(item => item.id === illustration.id);
  };
  
  // Determinar qué elementos mostrar según el tab activo
  const displayedElements = activeTab === 'recent' 
    ? recentElements 
    : activeTab === 'favorites'
    ? favoriteElements
    : filteredIllustrations;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Flower2 className="w-5 h-5 text-pink-600" />
          <h3 className="text-sm font-semibold " className="text-body">Ilustraciones Florales</h3>
        </div>
        <p className="text-xs " className="text-secondary">
          Elementos florales estilo acuarela para invitaciones elegantes
        </p>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 " className="text-muted" />
        <input
          type="text"
          placeholder="Buscar flores..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border  rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" className="border-default"
        />
      </div>

      {/* Categorías */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {FLORAL_CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? 'bg-pink-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-1">{category.icon}</span>
            {category.label}
          </button>
        ))}
      </div>

      {/* Tabs: Todos, Recientes, Favoritos */}
      <div className="flex gap-2 border-b " className="border-default">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'all'
              ? 'text-pink-600 border-b-2 border-pink-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          Todos
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'recent'
              ? 'text-pink-600 border-b-2 border-pink-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Recientes
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'favorites'
              ? 'text-pink-600 border-b-2 border-pink-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          Favoritos
        </button>
      </div>

      {/* Grid de ilustraciones */}
      <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-2">
        {displayedElements.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-sm " className="text-muted">
            {activeTab === 'recent' && 'No hay elementos recientes'}
            {activeTab === 'favorites' && 'No hay favoritos. Marca elementos con ⭐'}
            {activeTab === 'all' && 'No se encontraron ilustraciones'}
          </div>
        ) : (
          displayedElements.map(illustration => (
            <button
              key={illustration.id}
              onClick={() => handleAddFloral(illustration)}
              className="group relative aspect-square  rounded-xl overflow-hidden hover:ring-2 hover:ring-pink-500 transition-all" className="bg-page"
            >
              {/* Imagen de preview */}
              {illustration.type === 'corner-set' ? (
                // Preview del set de esquinas
                <div className="w-full h-full p-2 grid grid-cols-2 grid-rows-2 gap-1">
                  <img
                    src={illustration.corners.topLeft}
                    alt="Top Left"
                    className="w-full h-full object-cover rounded"
                  />
                  <img
                    src={illustration.corners.topRight}
                    alt="Top Right"
                    className="w-full h-full object-cover rounded"
                  />
                  <img
                    src={illustration.corners.bottomLeft}
                    alt="Bottom Left"
                    className="w-full h-full object-cover rounded"
                  />
                  <img
                    src={illustration.corners.bottomRight}
                    alt="Bottom Right"
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              ) : (
                <img
                  src={illustration.url}
                  alt={illustration.name}
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Botón de favorito */}
              <button
                onClick={(e) => toggleFavorite(illustration, e)}
                className="absolute top-2 right-2 p-1.5 rounded-full /80 backdrop-blur-sm hover:bg-white transition-colors z-10" className="bg-surface"
              >
                <Star className={`w-3.5 h-3.5 ${isFavorite(illustration) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
              </button>
              
              {/* Overlay con nombre */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-xs font-medium text-white text-center">
                    {illustration.name}
                  </p>
                  {illustration.type === 'corner-set' && (
                    <p className="text-[10px] text-pink-200 text-center mt-0.5">
                      Añade 4 esquinas
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Info */}
      <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 text-xs">
        <p className="font-medium text-pink-800 mb-1">💡 Tip</p>
        <ul className="text-pink-700 space-y-1 text-[11px]">
          <li>• <strong>Sets de esquinas:</strong> Añaden automáticamente 4 elementos coordinados</li>
          <li>• <strong>Redimensiona:</strong> Arrastra las esquinas para ajustar tamaño</li>
          <li>• <strong>Combina:</strong> Mezcla diferentes estilos para diseños únicos</li>
        </ul>
      </div>
    </div>
  );
}
