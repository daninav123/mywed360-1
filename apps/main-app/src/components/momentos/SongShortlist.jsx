import { Music, Play, Trash2, Check, Plus, ExternalLink } from 'lucide-react';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '../ui';

/**
 * SongShortlist - Muestra las canciones candidatas y permite seleccionar una
 */
const SongShortlist = ({
  candidates = [],
  selectedSongId = null,
  onSelect,
  onRemove,
  onAdd,
  onPlayPreview,
  playingId = null,
  maxCandidates = 10,
}) => {
  const [hoveredId, setHoveredId] = useState(null);

  if (!candidates || candidates.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <Music className="mx-auto text-gray-400 mb-3" size={32} />
        <p className="text-gray-600 mb-2 font-medium">No hay canciones candidatas</p>
        <p className="text-sm text-gray-500 mb-4">
          Busca y agrega canciones para comparar y elegir la perfecta
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={onAdd}
          className="inline-flex items-center gap-2"
        >
          <Plus size={16} />
          Buscar canciones
        </Button>
      </div>
    );
  }

  const selectedSong = candidates.find((c) => c.id === selectedSongId);
  const otherCandidates = candidates.filter((c) => c.id !== selectedSongId);

  return (
    <div className="space-y-3">
      {/* Mostrar advertencia si está cerca del límite */}
      {candidates.length >= maxCandidates - 2 && (
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          ⚠️ Tienes {candidates.length} de {maxCandidates} canciones candidatas
        </div>
      )}

      {/* Canción seleccionada (destacada) */}
      {selectedSong && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center relative overflow-hidden">
                {selectedSong.artwork ? (
                  <img
                    src={selectedSong.artwork}
                    alt={selectedSong.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="text-blue-600" size={20} />
                )}
                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                  <Check className="text-white drop-shadow-md" size={20} />
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  Seleccionada
                </span>
              </div>
              <div className="font-semibold text-gray-900 truncate">
                {selectedSong.title || 'Sin título'}
              </div>
              {selectedSong.artist && (
                <div className="text-sm text-gray-600 truncate">{selectedSong.artist}</div>
              )}
            </div>

            <div className="flex items-center gap-1">
              {selectedSong.previewUrl && onPlayPreview && (
                <button
                  type="button"
                  onClick={() => onPlayPreview(selectedSong)}
                  className="p-2 hover:bg-blue-100 rounded transition-colors"
                  title="Escuchar preview"
                >
                  <Play
                    size={16}
                    className={playingId === selectedSong.id ? 'text-blue-600' : 'text-gray-600'}
                    fill={playingId === selectedSong.id ? 'currentColor' : 'none'}
                  />
                </button>
              )}
              {selectedSong.trackUrl && (
                <a
                  href={selectedSong.trackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-blue-100 rounded transition-colors"
                  title="Abrir en fuente"
                >
                  <ExternalLink size={16} className="text-gray-600" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Otras candidatas */}
      {otherCandidates.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Otras opciones ({otherCandidates.length})
          </div>
          {otherCandidates.map((song) => (
            <div
              key={song.id}
              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
              onMouseEnter={() => setHoveredId(song.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelect && onSelect(song.id)}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                    {song.artwork ? (
                      <img
                        src={song.artwork}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music className="text-gray-400" size={16} />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate text-sm">
                    {song.title || 'Sin título'}
                  </div>
                  {song.artist && (
                    <div className="text-xs text-gray-500 truncate">{song.artist}</div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {song.previewUrl && onPlayPreview && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayPreview(song);
                      }}
                      className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                      title="Escuchar preview"
                    >
                      <Play
                        size={14}
                        className={playingId === song.id ? 'text-blue-600' : 'text-gray-600'}
                        fill={playingId === song.id ? 'currentColor' : 'none'}
                      />
                    </button>
                  )}
                  {song.trackUrl && (
                    <a
                      href={song.trackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                      title="Abrir en fuente"
                    >
                      <ExternalLink size={14} className="text-gray-600" />
                    </a>
                  )}
                  {onRemove && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(song.id);
                      }}
                      className="p-1.5 hover:bg-red-100 rounded transition-colors text-red-600"
                      title="Eliminar candidata"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botón para agregar más */}
      {candidates.length < maxCandidates && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="w-full inline-flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Buscar más canciones ({candidates.length}/{maxCandidates})
        </Button>
      )}
    </div>
  );
};

SongShortlist.propTypes = {
  candidates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string,
      artist: PropTypes.string,
      previewUrl: PropTypes.string,
      trackUrl: PropTypes.string,
      artwork: PropTypes.string,
      source: PropTypes.string,
    })
  ),
  selectedSongId: PropTypes.string,
  onSelect: PropTypes.func,
  onRemove: PropTypes.func,
  onAdd: PropTypes.func,
  onPlayPreview: PropTypes.func,
  playingId: PropTypes.string,
  maxCandidates: PropTypes.number,
};

export default SongShortlist;
