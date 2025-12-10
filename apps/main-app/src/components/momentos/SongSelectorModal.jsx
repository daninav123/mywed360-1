import { Search, Music, Play, Sparkles, Loader2, X, Check, ChevronDown } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { Button } from '../ui';
import { MUSIC_INSPIRATION } from '../../data/musicInspiration';

/**
 * SongSelectorModal - Modal para buscar y seleccionar canciones
 * Incluye búsqueda en iTunes/Apple Music y sugerencias por categoría
 */
const SongSelectorModal = ({ isOpen, onClose, onAdd, momentType = 'otro', momentTitle = '' }) => {
  const [activeTab, setActiveTab] = useState('search'); // search | suggestions
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [openCategory, setOpenCategory] = useState(null);
  const [addedSongs, setAddedSongs] = useState(new Set());

  // Limpiar estado al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setAddedSongs(new Set());
      setSearchQuery('');
      setSearchResults([]);
      setSearchError(null);
    }
  }, [isOpen]);

  // Búsqueda en iTunes/Apple Music
  const handleSearch = async () => {
    const term = searchQuery.trim();
    if (!term) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&media=music&limit=20`
      );
      const data = await response.json();

      if (Array.isArray(data.results)) {
        const mapped = data.results.map((r) => ({
          id: String(r.trackId),
          title: r.trackName,
          artist: r.artistName,
          previewUrl: r.previewUrl,
          trackUrl: r.trackViewUrl || r.collectionViewUrl,
          artwork: r.artworkUrl100 || r.artworkUrl60,
          source: 'search',
        }));
        setSearchResults(mapped);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching songs:', err);
      setSearchError('No se pudo realizar la búsqueda. Intenta de nuevo.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Ejecutar búsqueda al presionar Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Agregar canción
  const handleAddSong = (song) => {
    onAdd(song);
    setAddedSongs((prev) => new Set([...prev, song.id]));
    toast.success(`"${song.title}" agregada a candidatas`);
  };

  // Sugerencias por categoría (desde musicInspiration)
  const suggestionCategories = useMemo(() => {
    // Mapeo de tipos de momento a categorías de inspiración
    const categoryMap = {
      entrada: ['ceremonia_entrada', 'ceremonia'],
      lectura: ['ceremonia'],
      votos: ['ceremonia'],
      anillos: ['ceremonia'],
      baile: ['primer_baile', 'baile_padres', 'disco'],
      discurso: ['banquete'],
      corte_pastel: ['banquete'],
      salida: ['ceremonia'],
      otro: ['disco', 'banquete'],
    };

    const relevantCategories = categoryMap[momentType] || ['disco'];

    return Object.entries(MUSIC_INSPIRATION)
      .filter(([key]) => relevantCategories.includes(key))
      .map(([key, data]) => ({
        id: key,
        name: data.name || key,
        songs: (data.songs || []).map((song) => ({
          id: `suggestion-${key}-${song.title}-${song.artist}`,
          title: song.title,
          artist: song.artist,
          previewUrl: '',
          trackUrl: '',
          artwork: '',
          source: 'suggestion',
        })),
      }));
  }, [momentType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Buscar canción</h2>
            {momentTitle && <p className="text-sm text-gray-600">Para: {momentTitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Search size={16} className="inline mr-2" />
            Buscar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'suggestions'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles size={16} className="inline mr-2" />
            Sugerencias
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'search' && (
            <div className="space-y-4">
              {/* Barra de búsqueda */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Buscar por canción, artista o álbum..."
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isSearching}
                  variant="primary"
                >
                  {isSearching ? <Loader2 size={16} className="animate-spin" /> : 'Buscar'}
                </Button>
              </div>

              {/* Resultados */}
              {searchError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                  {searchError}
                </div>
              )}

              {isSearching && (
                <div className="text-center py-8">
                  <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
                  <p className="text-gray-600">Buscando canciones...</p>
                </div>
              )}

              {!isSearching && searchResults.length === 0 && searchQuery && (
                <div className="text-center py-8 text-gray-500">
                  <Music size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No se encontraron resultados</p>
                  <p className="text-sm">Intenta con otros términos de búsqueda</p>
                </div>
              )}

              {!isSearching && searchResults.length === 0 && !searchQuery && (
                <div className="text-center py-8 text-gray-500">
                  <Search size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>Busca canciones por nombre, artista o álbum</p>
                  <p className="text-sm">Usa el buscador para encontrar la canción perfecta</p>
                </div>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {searchResults.length} resultados encontrados
                  </p>
                  {searchResults.map((song) => {
                    const isAdded = addedSongs.has(song.id);
                    return (
                      <div
                        key={song.id}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                            {song.artwork ? (
                              <img
                                src={song.artwork}
                                alt={song.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music className="text-gray-400" size={20} />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{song.title}</div>
                          <div className="text-sm text-gray-600 truncate">{song.artist}</div>
                        </div>
                        <Button
                          size="sm"
                          variant={isAdded ? 'outline' : 'primary'}
                          onClick={() => handleAddSong(song)}
                          disabled={isAdded}
                          className="flex-shrink-0"
                        >
                          {isAdded ? (
                            <>
                              <Check size={14} className="mr-1" />
                              Agregada
                            </>
                          ) : (
                            'Agregar'
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Sugerencias basadas en el tipo de momento: <strong>{momentType}</strong>
              </p>

              {suggestionCategories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Sparkles size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No hay sugerencias disponibles para este momento</p>
                </div>
              )}

              {suggestionCategories.map((category) => (
                <div
                  key={category.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenCategory(openCategory === category.id ? null : category.id)
                    }
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium text-gray-900">{category.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {category.songs.length} canciones
                      </span>
                      <ChevronDown
                        size={18}
                        className={`text-gray-600 transition-transform ${
                          openCategory === category.id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {openCategory === category.id && (
                    <div className="divide-y divide-gray-200">
                      {category.songs.map((song) => {
                        const isAdded = addedSongs.has(song.id);
                        return (
                          <div
                            key={song.id}
                            className="flex items-center justify-between p-3 hover:bg-gray-50"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate text-sm">
                                {song.title}
                              </div>
                              <div className="text-xs text-gray-600 truncate">{song.artist}</div>
                            </div>
                            <Button
                              size="sm"
                              variant={isAdded ? 'outline' : 'primary'}
                              onClick={() => handleAddSong(song)}
                              disabled={isAdded}
                              className="flex-shrink-0 ml-3"
                            >
                              {isAdded ? (
                                <>
                                  <Check size={14} className="mr-1" />
                                  Agregada
                                </>
                              ) : (
                                'Agregar'
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

SongSelectorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  momentType: PropTypes.string,
  momentTitle: PropTypes.string,
};

export default SongSelectorModal;
