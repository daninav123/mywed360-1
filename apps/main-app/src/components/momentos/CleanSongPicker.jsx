import { Search, Music, X, Loader2, Play, ExternalLink } from 'lucide-react';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { Button } from '../ui';

/**
 * CleanSongPicker - Modal ultra-limpio para buscar canciones
 * Búsqueda directa en Spotify con reproducción completa
 */
const CleanSongPicker = ({ isOpen, onClose, onSelect, momentTitle = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-xl shadow-md max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Buscar canción</h2>
            {momentTitle && <p className="text-sm text-gray-600 mt-0.5">Para: {momentTitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Búsqueda */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Busca por canción, artista o álbum..."
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                autoFocus
              />
              <Search
                size={20}
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
              <p className="text-sm text-gray-600 mb-3">{results.length} resultados encontrados</p>
              {results.map((song) => (
                <div
                  key={song.id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    {/* Artwork */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-[var(--color-primary)] rounded-lg overflow-hidden shadow-sm">
                        {song.artwork ? (
                          <img
                            src={song.artwork}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="text-gray-400" size={28} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate mb-0.5">
                        {song.title}
                      </div>
                      <div className="text-sm text-gray-600 truncate mb-1">{song.artist}</div>
                      {song.album && (
                        <div className="text-xs text-gray-500 truncate">{song.album}</div>
                      )}

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
};

export default CleanSongPicker;
