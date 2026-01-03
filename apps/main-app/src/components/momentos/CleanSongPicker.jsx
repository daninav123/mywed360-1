import { Search, Music, X, Loader2, Play, ExternalLink, Sparkles } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { Button } from '../ui';
import { getSongSuggestions } from '../../utils/popularWeddingSongs';
import {
  generateSuggestionsFromDescription,
  enrichWithSpotify,
} from '../../services/simpleSuggestionsService';

/**
 * CleanSongPicker - Modal ultra-limpio para buscar canciones
 * Búsqueda directa en Spotify con reproducción completa
 */
const CleanSongPicker = ({
  isOpen,
  onClose,
  onSelect,
  momentTitle = '',
  momentType = '',
  blockType = '',
  userDescription = '',
  onDescriptionChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Descripción editable localmente
  const [localDescription, setLocalDescription] = useState(userDescription);

  // Sugerencias basadas en descripción del usuario
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [canLoadMore, setCanLoadMore] = useState(true);

  // Sincronizar descripción cuando abre el modal
  useEffect(() => {
    if (isOpen) {
      setLocalDescription(userDescription);
    }
  }, [isOpen, userDescription]);

  // Limpiar sugerencias al cambiar descripción
  useEffect(() => {
    if (isOpen && localDescription !== userDescription) {
      setAiSuggestions([]);
      setCanLoadMore(true);
    }
  }, [isOpen, localDescription, userDescription]);

  const generateAISuggestions = async (reset = false) => {
    setLoadingAI(true);
    try {
      const result = await generateSuggestionsFromDescription({
        momentTitle,
        momentType,
        blockType,
        userDescription: localDescription,
        count: 8,
      });

      if (result.success && result.suggestions.length > 0) {
        const enriched = await enrichWithSpotify(result.suggestions);

        if (reset) {
          // Primera carga o cambio de descripción: reemplazar
          setAiSuggestions(enriched);
          setCanLoadMore(true);
        } else {
          // Cargar más: añadir sin duplicados
          setAiSuggestions((prev) => {
            const existingTitles = new Set(prev.map((s) => `${s.title}-${s.artist}`.toLowerCase()));
            const newSuggestions = enriched.filter(
              (s) => !existingTitles.has(`${s.title}-${s.artist}`.toLowerCase())
            );
            return [...prev, ...newSuggestions];
          });

          // Si no hay nuevas sugerencias únicas, deshabilitar "Ver más"
          if (enriched.length === 0) {
            setCanLoadMore(false);
          }
        }
      } else {
        setCanLoadMore(false);
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      setCanLoadMore(false);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleLoadMoreSuggestions = () => {
    if (!loadingAI && canLoadMore) {
      generateAISuggestions(false);
    }
  };

  const handleDescriptionChange = (newDescription) => {
    setLocalDescription(newDescription);
    // Guardar en el momento si hay callback
    if (onDescriptionChange) {
      onDescriptionChange(newDescription);
    }
  };

  // Obtener sugerencias populares según el tipo de momento
  const suggestions = useMemo(() => {
    if (!momentType) return [];
    return getSongSuggestions(momentType, 8);
  }, [momentType]);

  // Búsqueda en Spotify
  const handleSearch = async () => {
    const term = searchQuery.trim();
    if (!term) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:4004/api/spotify/search?q=${encodeURIComponent(term)}&limit=20`
      );
      const data = await response.json();

      if (data.ok && Array.isArray(data.tracks)) {
        // La respuesta ya viene transformada del backend
        setResults(data.tracks);
      } else {
        setResults([]);
        if (data.error) {
          setError(data.error);
        }
      }
    } catch (err) {
      console.error('Error searching songs:', err);
      setError('No se pudo realizar la búsqueda. Intenta de nuevo.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectSong = (song) => {
    onSelect(song);
    toast.success(`"${song.title}" seleccionada`);
    // No cerrar automáticamente, permitir múltiples búsquedas
  };

  const handleSelectSuggestion = async (suggestion) => {
    // Si la sugerencia ya tiene datos de Spotify (enriquecida), seleccionarla directamente
    if (suggestion.fromAI && suggestion.trackUrl) {
      handleSelectSong(suggestion);
      return;
    }

    // Buscar automáticamente la sugerencia en Spotify
    setSearchQuery(`${suggestion.title} ${suggestion.artist}`);
    setShowSuggestions(false);

    setIsSearching(true);
    setError(null);

    try {
      const term = `${suggestion.title} ${suggestion.artist}`;
      const response = await fetch(
        `http://localhost:4004/api/spotify/search?q=${encodeURIComponent(term)}&limit=5`
      );
      const data = await response.json();

      if (data.ok && Array.isArray(data.tracks) && data.tracks.length > 0) {
        setResults(data.tracks);
      } else {
        setResults([]);
        toast.info('No se encontró en Spotify. Intenta buscar manualmente.');
      }
    } catch (err) {
      console.error('Error searching suggestion:', err);
      setError('No se pudo buscar la sugerencia.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-xl shadow-md max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">Buscar canción</h2>
              {momentTitle && <p className="text-sm text-gray-600 mt-0.5">Para: {momentTitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Búsqueda y Descripción IA */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          {/* Descripción para IA */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Sparkles size={14} className="text-purple-600" />
              🤖 Describe lo que buscas para obtener sugerencias de IA
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <textarea
                  value={localDescription}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Ej: algo energético, con letra en español que suene a electrónica..."
                  rows={2}
                  className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm resize-none"
                />
              </div>
              <Button
                onClick={() => generateAISuggestions(true)}
                disabled={!localDescription.trim() || loadingAI}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 self-start"
              >
                {loadingAI ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Sparkles size={18} className="mr-2" />
                    Buscar con IA
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Búsqueda manual */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Search size={14} className="text-blue-600" />O busca manualmente en Spotify
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Busca por canción, artista o álbum..."
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
                className="px-6"
              >
                {isSearching ? <Loader2 size={18} className="animate-spin" /> : 'Buscar'}
              </Button>
            </div>
          </div>

          {/* Info de Spotify */}
          <div className="mt-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-900 mb-1">
                🎵 Busca directamente en Spotify
              </p>
              <p className="text-xs text-green-700">
                ✓ Canción completa | ✓ Control de tiempos inicio/final | ✓ Player embebido
              </p>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              {error}
            </div>
          )}

          {/* Sugerencias de IA basadas en descripción */}
          {localDescription && aiSuggestions.length > 0 && !searchQuery && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-purple-600" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    ✨ Sugerencias de IA para tu descripción
                  </h3>
                </div>
                {loadingAI && <Loader2 size={14} className="text-purple-600 animate-spin" />}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="text-left p-3 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start gap-2">
                      <Sparkles size={14} className="text-purple-600 flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-purple-700">
                          {suggestion.title}
                        </p>
                        <p className="text-xs text-gray-600 truncate">{suggestion.artist}</p>
                        {suggestion.reason && (
                          <p className="text-xs text-purple-700 mt-1 font-medium line-clamp-2">
                            {suggestion.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Botón para cargar más */}
              {canLoadMore && aiSuggestions.length >= 8 && (
                <div className="mt-4 text-center">
                  <Button
                    onClick={handleLoadMoreSuggestions}
                    disabled={loadingAI}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    {loadingAI ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} className="mr-2" />
                        Ver más sugerencias
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Sugerencias populares */}
          {showSuggestions && suggestions.length > 0 && !searchQuery && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-yellow-500" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Canciones populares para este momento
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestions.map((song, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSuggestion(song)}
                    className="text-left border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {song.title}
                        </div>
                        <div className="text-xs text-gray-600 truncate">{song.artist}</div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 text-xs font-medium">
                          Buscar →
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-3 text-center">
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                >
                  Ocultar sugerencias
                </button>
              </div>
            </div>
          )}

          {isSearching && (
            <div className="text-center py-12">
              <Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Buscando canciones...</p>
            </div>
          )}

          {!isSearching && results.length === 0 && searchQuery && (
            <div className="text-center py-12 text-gray-500">
              <Music size={56} className="mx-auto mb-4 text-gray-300" />
              <p className="font-medium">No se encontraron resultados</p>
              <p className="text-sm mt-1">Intenta con otros términos</p>
            </div>
          )}

          {!isSearching && results.length === 0 && !searchQuery && (
            <div className="text-center py-12 text-gray-500">
              <Search size={56} className="mx-auto mb-4 text-gray-300" />
              <p className="font-medium">Busca tu canción perfecta</p>
              <p className="text-sm mt-1">Escribe el nombre, artista o álbum en el buscador</p>
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-900">
                  🎵 {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado
                  {results.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500">Click para seleccionar</p>
              </div>
              {results.map((song) => (
                <div
                  key={song.id}
                  className="bg-white border-2 border-gray-200 rounded-xl p-3 hover:border-blue-400 hover:shadow-lg transition-all group cursor-pointer"
                  onClick={() => handleSelectSong(song)}
                >
                  <div className="flex items-start gap-3">
                    {/* Artwork - Más grande y prominente */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow">
                        {song.artwork ? (
                          <img
                            src={song.artwork}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="text-gray-400" size={32} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info - Mejorada con más detalles */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-base text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {song.title}
                          </h4>
                          <p className="text-sm text-gray-700 truncate mt-1 font-medium">
                            {song.artist}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            <Music size={12} />
                            Spotify
                          </div>
                        </div>
                      </div>

                      {song.album && (
                        <p className="text-xs text-gray-600 truncate mt-1 flex items-center gap-1">
                          <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                          {song.album}
                        </p>
                      )}

                      {/* Preview info */}
                      <div className="flex items-center gap-3 mt-2">
                        {song.duration && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            🕒 {Math.floor(song.duration / 60000)}:
                            {String(Math.floor((song.duration % 60000) / 1000)).padStart(2, '0')}
                          </span>
                        )}
                        {song.popularity && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            🔥 {song.popularity}% popularidad
                          </span>
                        )}
                      </div>

                      {/* Preview player */}
                      {song.previewUrl && (
                        <div className="mt-2">
                          <audio
                            controls
                            src={song.previewUrl}
                            className="w-full h-8"
                            preload="none"
                            style={{ maxWidth: '300px' }}
                          >
                            Tu navegador no soporta audio
                          </audio>
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex-shrink-0 flex flex-col gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSelectSong(song)}
                        className="whitespace-nowrap"
                      >
                        Seleccionar
                      </Button>
                      <a
                        href={song.spotifySearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 justify-center"
                      >
                        <ExternalLink size={12} />
                        Buscar en Spotify
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Busca y selecciona. Luego podrás buscar en Spotify para reproducción completa.
            </p>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

CleanSongPicker.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  momentTitle: PropTypes.string,
  momentType: PropTypes.string,
  blockType: PropTypes.string,
  userDescription: PropTypes.string,
  onDescriptionChange: PropTypes.func,
};

export default CleanSongPicker;
