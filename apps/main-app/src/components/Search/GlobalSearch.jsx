import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp,
  Users,
  ShoppingBag,
  Calendar,
  MapPin,
  DollarSign,
  FileText,
  Settings,
  ArrowRight,
  Command,
  Globe,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWedding } from '../../context/WeddingContext';
import { useAuth } from '../../hooks/useAuth';
import { universalSearch } from '../../services/aiSearchOrchestrator';
import WebSearchResults from './WebSearchResults';
import ImportSupplierModal from './ImportSupplierModal';

/**
 * Modal de Búsqueda Global (Cmd+K)
 * Permite buscar cualquier entidad en la app de forma rápida
 */
const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchData, setSearchData] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [viewMode, setViewMode] = useState('simple'); // 'simple' | 'advanced'
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { activeWedding } = useWedding();
  const { currentUser } = useAuth();

  // Cargar búsquedas recientes
  useEffect(() => {
    if (isOpen) {
      const recent = JSON.parse(localStorage.getItem('recent_searches') || '[]');
      setRecentSearches(recent.slice(0, 5));
    }
  }, [isOpen]);

  // Focus en el input al abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Búsqueda con debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const searchResults = await searchAll(query, activeWedding, currentUser?.uid);
        setResults(searchResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Error en búsqueda:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeWedding, currentUser]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, results, selectedIndex, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSelectResult = (result) => {
    // Si es un resultado externo, abrir modal de detalles/importar
    if (result.isExternal) {
      setSelectedSupplier(result);
      setShowImportModal(true);
      return;
    }

    // Guardar en búsquedas recientes
    const recent = JSON.parse(localStorage.getItem('recent_searches') || '[]');
    const updated = [
      { query: result.title, type: result.type, timestamp: Date.now() },
      ...recent.filter(r => r.query !== result.title)
    ].slice(0, 10);
    localStorage.setItem('recent_searches', JSON.stringify(updated));

    // Navegar a la ruta
    if (result.path) {
      navigate(result.path);
      onClose();
    }
  };

  const handleImportSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setShowImportModal(true);
  };

  const handleImportSuccess = (importedSupplier) => {
    console.log('✅ Proveedor importado:', importedSupplier);
    // Podríamos navegar a la página de proveedores
    navigate('/proveedores');
    onClose();
  };

  const handleClearRecent = () => {
    localStorage.removeItem('recent_searches');
    setRecentSearches([]);
  };

  const getIcon = (type) => {
    const icons = {
      guest: Users,
      supplier: ShoppingBag,
      task: Calendar,
      venue: MapPin,
      budget: DollarSign,
      note: FileText,
      settings: Settings,
      seating: Users,
    };
    const Icon = icons[type] || Search;
    return <Icon className="h-5 w-5" />;
  };

  const getTypeColor = (type) => {
    const colors = {
      guest: 'text-blue-600 bg-blue-50',
      supplier: 'text-purple-600 bg-purple-50',
      task: 'text-green-600 bg-green-50',
      venue: 'text-orange-600 bg-orange-50',
      budget: 'text-emerald-600 bg-emerald-50',
      note: 'text-gray-600 bg-gray-50',
      settings: 'text-slate-600 bg-slate-50',
      seating: 'text-indigo-600 bg-indigo-50',
    };
    return colors[type] || 'text-gray-600 bg-gray-50';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 animate-slide-up">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Header con buscador */}
          <div className="border-b border-gray-200">
            <div className="flex items-center gap-3 px-4 py-3">
              {searchData?.intent?.needsWeb ? (
                <Globe className="h-5 w-5 text-purple-500 flex-shrink-0" />
              ) : (
                <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar en tu lista o en toda la web..."
                className="flex-1 text-lg outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-gray-100 rounded">
                ESC
              </kbd>
            </div>
            
            {/* Intent badge (si hay búsqueda web) */}
            {searchData?.intent?.needsWeb && query && (
              <div className="px-4 pb-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">
                  <Sparkles className="h-3 w-3" />
                  Búsqueda web con IA activada
                  {searchData.intent.category && (
                    <span className="font-medium">· {searchData.intent.category}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Resultados */}
          <div className="max-h-[500px] overflow-y-auto search-results">
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              </div>
            ) : query.trim() && results.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No se encontraron resultados para "{query}"</p>
                <p className="text-xs text-gray-400 mt-2">Intenta buscar proveedores, invitados o lugares</p>
              </div>
            ) : query.trim() ? (
              <div className="p-4">
                {viewMode === 'advanced' && searchData ? (
                  <WebSearchResults
                    results={results}
                    onImport={handleImportSupplier}
                    onSelect={handleSelectResult}
                  />
                ) : (
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <button
                        key={result.id || index}
                        onClick={() => handleSelectResult(result)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors rounded-lg ${
                          index === selectedIndex
                            ? 'bg-purple-50 border border-purple-200'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${getTypeColor(result.type)}`}>
                          {getIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {result.title}
                          </p>
                          {result.subtitle && (
                            <p className="text-sm text-gray-500 truncate">
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                        {result.isExternal && (
                          <Globe className="h-4 w-4 text-purple-500 flex-shrink-0" />
                        )}
                        <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Búsquedas recientes y sugerencias */
              <div className="py-2">
                {recentSearches.length > 0 && (
                  <>
                    <div className="flex items-center justify-between px-4 py-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase">
                        <Clock className="h-4 w-4" />
                        Recientes
                      </div>
                      <button
                        onClick={handleClearRecent}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Limpiar
                      </button>
                    </div>
                    {recentSearches.map((recent, index) => (
                      <button
                        key={index}
                        onClick={() => setQuery(recent.query)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                      >
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="flex-1 text-sm text-gray-700">{recent.query}</span>
                        <span className="text-xs text-gray-400 uppercase">{recent.type}</span>
                      </button>
                    ))}
                  </>
                )}

                {/* Acciones rápidas */}
                <div className="mt-2 px-4 py-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase mb-2">
                    <TrendingUp className="h-4 w-4" />
                    Acciones Rápidas
                  </div>
                  <div className="space-y-1">
                    <QuickAction 
                      icon={Users} 
                      label="Añadir invitado" 
                      path="/invitados"
                      onClick={() => { navigate('/invitados'); onClose(); }}
                    />
                    <QuickAction 
                      icon={ShoppingBag} 
                      label="Buscar proveedor" 
                      path="/proveedores"
                      onClick={() => { navigate('/proveedores'); onClose(); }}
                    />
                    <QuickAction 
                      icon={Calendar} 
                      label="Crear tarea" 
                      path="/tareas"
                      onClick={() => { navigate('/tareas'); onClose(); }}
                    />
                    <QuickAction 
                      icon={Settings} 
                      label="Configuración" 
                      path="/configuracion"
                      onClick={() => { navigate('/configuracion'); onClose(); }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer con ayuda de teclado */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded font-mono">↑↓</kbd>
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded font-mono">↵</kbd>
                seleccionar
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Command className="h-3 w-3" />
              <span>+ K para abrir</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de importar proveedor */}
      <ImportSupplierModal
        supplier={selectedSupplier}
        weddingId={activeWedding}
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setSelectedSupplier(null);
        }}
        onSuccess={handleImportSuccess}
      />
    </>
  );
};

// Componente de acción rápida
const QuickAction = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-left"
  >
    <Icon className="h-4 w-4 text-gray-600" />
    <span className="text-sm text-gray-700">{label}</span>
  </button>
);

export default GlobalSearch;
