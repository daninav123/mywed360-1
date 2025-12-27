import {
  Music,
  Clock,
  ChevronDown,
  ChevronUp,
  Play,
  Settings,
  Check,
  X,
  Plus,
  Star,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Button } from '../ui';
import MusicPlayerWithAuth from './MusicPlayerWithAuth';
import SongTimingSlider from './SongTimingSlider';
import { findDuplicateSongs, getDuplicateWarning } from '../../utils/songDuplicateDetector';

/**
 * SimpleMomentCard - Tarjeta minimalista para configurar un momento
 * Enfocada solo en lo esencial: título, canción, hora, y tiempos de reproducción
 */
const SimpleMomentCard = ({
  moment,
  onSelectSong,
  onSelectCandidate,
  onMarkAsDefinitive,
  onRemoveCandidate,
  onTimeChange,
  onSongTimingChange,
  onUpdateMoment,
  onConfigureSpecial,
  onRemoveMoment,
  selectedSong = null,
  allCandidates = [],
  showAdvanced = false,
  allMoments = {},
  currentBlockId = '',
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showTimingSettings, setShowTimingSettings] = useState(false);
  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [showMoreCandidates, setShowMoreCandidates] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState(moment.playlistUrl || '');

  // Detectar duplicados de la canción seleccionada
  const duplicates = useMemo(() => {
    if (!selectedSong || !allMoments) return [];
    return findDuplicateSongs(selectedSong, allMoments, currentBlockId, moment.id);
  }, [selectedSong, allMoments, currentBlockId, moment.id]);

  const duplicateWarning = useMemo(() => {
    return getDuplicateWarning(duplicates);
  }, [duplicates]);

  // Limitar opciones visibles a 3 por defecto
  const MAX_VISIBLE_CANDIDATES = 3;
  const visibleCandidates = showMoreCandidates
    ? allCandidates
    : allCandidates.slice(0, MAX_VISIBLE_CANDIDATES);
  const hasMoreCandidates = allCandidates.length > MAX_VISIBLE_CANDIDATES;

  // Extraer URL de Spotify si existe
  const getSpotifyTrackId = (song) => {
    if (!song) return null;

    // Si tiene trackUrl de Spotify
    if (song.trackUrl?.includes('spotify.com/track/')) {
      const match = song.trackUrl.match(/track\/([a-zA-Z0-9]+)/);
      return match ? match[1] : null;
    }

    return null;
  };

  const spotifyTrackId = getSpotifyTrackId(selectedSong);

  // Extraer ID de playlist de Spotify
  const getSpotifyPlaylistId = (url) => {
    if (!url) return null;
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const playlistId = getSpotifyPlaylistId(moment.playlistUrl || playlistUrl);

  // Tipo de música del momento (por defecto 'song')
  const musicType = moment.musicType || 'song';

  const handleMusicTypeChange = (type) => {
    if (onUpdateMoment) {
      onUpdateMoment({ ...moment, musicType: type });
    }
  };

  const handlePlaylistUrlChange = (url) => {
    setPlaylistUrl(url);
    if (onUpdateMoment) {
      onUpdateMoment({ ...moment, playlistUrl: url });
    }
  };

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 hover:shadow-md transition-all">
      {/* Header compacto - SIEMPRE VISIBLE */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 bg-[var(--color-surface)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {moment.order || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">{moment.title}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {moment.type && <span className="capitalize">{moment.type}</span>}
              {selectedSong && (
                <>
                  <span>•</span>
                  <span className="truncate">
                    {selectedSong.title}
                    {moment.isDefinitive && ' ⭐'}
                    {selectedSong.isSpecial && ' 🔥'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onRemoveMoment && (
            <button
              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveMoment();
              }}
              title="Eliminar momento"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Contenido expandible */}
      {expanded && (
        <div className="border-t border-gray-200 p-4 space-y-3">
          {/* Selector de tipo de música */}
          <div className="bg-[var(--color-primary)] border border-purple-200 rounded-lg p-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de música para este momento
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleMusicTypeChange('song')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  musicType === 'song'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                🎵 Canción específica
              </button>
              <button
                type="button"
                onClick={() => handleMusicTypeChange('playlist')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  musicType === 'playlist'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                📋 Playlist de ambiente
              </button>
              <button
                type="button"
                onClick={() => handleMusicTypeChange('none')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  musicType === 'none'
                    ? 'bg-gray-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                🔇 Sin música
              </button>
            </div>
          </div>

          {/* PLAYLIST MODE */}
          {musicType === 'playlist' && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <label className="block text-sm font-medium text-green-900 mb-2">
                  🎵 Link de Playlist de Spotify
                </label>
                <input
                  type="text"
                  value={playlistUrl}
                  onChange={(e) => handlePlaylistUrlChange(e.target.value)}
                  placeholder="https://open.spotify.com/playlist/..."
                  className="w-full px-3 py-2 border border-green-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-green-700 mt-2">
                  💡 Abre Spotify, busca una playlist, copia el enlace y pégalo aquí
                </p>
              </div>

              {/* Preview de playlist */}
              {playlistId && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <iframe
                    src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
                    width="100%"
                    height="380"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title="Spotify Playlist"
                    className="rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {/* SONG MODE */}
          {musicType === 'song' && (
            <>
              {/* 🎵 PLAYER PRIMERO - Siempre visible si hay Spotify y canción seleccionada */}
              {selectedSong && spotifyTrackId && (
                <div className="space-y-2" key={`player-${selectedSong?.id}`}>
                  <MusicPlayerWithAuth trackId={spotifyTrackId} trackUrl={selectedSong?.trackUrl} />
                </div>
              )}

              {selectedSong ? (
                <div className="space-y-3">
                  {/* Advertencia de duplicados */}
                  {duplicateWarning && (
                    <div
                      className={`rounded-lg p-3 border ${
                        duplicateWarning.severity === 'error'
                          ? 'bg-red-50 border-red-300'
                          : duplicateWarning.severity === 'warning'
                            ? 'bg-yellow-50 border-yellow-300'
                            : 'bg-blue-50 border-blue-300'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle
                          size={16}
                          className={`flex-shrink-0 mt-0.5 ${
                            duplicateWarning.severity === 'error'
                              ? 'text-red-600'
                              : duplicateWarning.severity === 'warning'
                                ? 'text-yellow-600'
                                : 'text-blue-600'
                          }`}
                        />
                        <div className="flex-1 text-sm">
                          <p
                            className={`font-medium ${
                              duplicateWarning.severity === 'error'
                                ? 'text-red-900'
                                : duplicateWarning.severity === 'warning'
                                  ? 'text-yellow-900'
                                  : 'text-blue-900'
                            }`}
                          >
                            {duplicateWarning.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Info de la canción DESPUÉS del player */}
                  <div className="border border-gray-200 rounded-lg p-3 bg-gradient-to-br from-blue-50 to-white">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-shrink-0">
                        {selectedSong.artwork ? (
                          <img
                            src={selectedSong.artwork}
                            alt={selectedSong.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-[var(--color-danger)] flex items-center justify-center">
                            <Music className="text-blue-600" size={20} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {selectedSong.title}
                        </div>
                        <div className="text-xs text-gray-600 truncate">{selectedSong.artist}</div>
                        {/* Badge de canción especial */}
                        {selectedSong.isSpecial && (
                          <div className="mb-2 px-2 py-1 bg-gradient-to-r from-orange-100 to-red-100 border border-orange-300 rounded-lg flex items-center gap-2">
                            <span className="text-lg">🔥</span>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-orange-900">
                                Canción Especial - {selectedSong.specialType === 'remix' ? 'Remix' : selectedSong.specialType === 'edit' ? 'Edit' : selectedSong.specialType === 'mashup' ? 'Mashup' : selectedSong.specialType === 'live' ? 'En vivo' : 'Custom'}
                              </p>
                              {selectedSong.djInstructions && (
                                <p className="text-xs text-orange-700 mt-0.5 line-clamp-1">
                                  {selectedSong.djInstructions}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 mt-1">
                          {moment.isDefinitive ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-semibold text-gray-800">
                              <Star size={14} fill="currentColor" />
                              Definitiva
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => onMarkAsDefinitive(selectedSong.id)}
                              className="text-xs bg-[var(--color-danger)] hover:bg-[var(--color-danger)]"
                            >
                              <Star size={14} className="mr-1" />
                              Marcar definitiva
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={onSelectSong}
                            className="text-xs"
                          >
                            <Plus size={14} className="mr-1" />
                            Agregar opción
                          </Button>
                          {onConfigureSpecial && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onConfigureSpecial(selectedSong)}
                              className={`text-xs ${
                                selectedSong.isSpecial
                                  ? 'border-orange-400 text-orange-700 hover:bg-orange-50'
                                  : 'border-gray-300'
                              }`}
                            >
                              <Settings size={14} className="mr-1" />
                              {selectedSong.isSpecial ? 'Editar especial' : 'Marcar especial'}
                            </Button>
                          )}
                          {allCandidates.length > 1 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowAllCandidates(!showAllCandidates)}
                              className="text-xs"
                            >
                              {showAllCandidates
                                ? 'Ocultar'
                                : `Ver ${allCandidates.length} opciones`}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Opciones candidatas */}
                    {showAllCandidates && allCandidates.length > 1 && (
                      <div className="mt-2 border-t border-gray-200 pt-2">
                        <p className="text-xs font-medium text-gray-700 mb-1.5">
                          Opciones guardadas ({allCandidates.length})
                        </p>
                        <div className="space-y-1.5">
                          {visibleCandidates.map((candidate) => {
                            const isSelected = selectedSong?.id === candidate.id;
                            return (
                              <div
                                key={candidate.id}
                                className={`flex items-center gap-2 p-1.5 rounded border transition-all ${
                                  isSelected
                                    ? 'bg-blue-50 border-blue-300'
                                    : 'bg-white border-gray-200 hover:border-blue-200'
                                }`}
                              >
                                {candidate.artwork ? (
                                  <img
                                    src={candidate.artwork}
                                    alt={candidate.title}
                                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <Music size={14} className="text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {candidate.title}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {candidate.artist}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {isSelected ? (
                                    <div className="flex items-center gap-1 text-blue-600 text-xs font-medium px-2 py-1 bg-blue-100 rounded">
                                      <Check size={12} />
                                      <span>Activa</span>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => onSelectCandidate(candidate.id)}
                                      className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                                    >
                                      Usar esta
                                    </button>
                                  )}
                                  {!isSelected && (
                                    <button
                                      onClick={() => onRemoveCandidate(candidate.id)}
                                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                      title="Eliminar"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Botón "Ver más / Ver menos" */}
                          {hasMoreCandidates && (
                            <button
                              onClick={() => setShowMoreCandidates(!showMoreCandidates)}
                              className="w-full text-xs text-blue-600 hover:text-blue-800 font-medium py-2 hover:bg-blue-50 rounded transition-colors"
                            >
                              {showMoreCandidates
                                ? `Ver menos (mostrar solo ${MAX_VISIBLE_CANDIDATES})`
                                : `Ver ${allCandidates.length - MAX_VISIBLE_CANDIDATES} más opciones`}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Controles de timing - Solo si está expandido */}
                  {expanded && (
                    <div className="space-y-2">
                      {/* Controles de timing de la canción con slider visual */}
                      {spotifyTrackId && (
                        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <button
                            type="button"
                            onClick={() => setShowTimingSettings(!showTimingSettings)}
                            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors w-full"
                          >
                            <Settings size={16} />
                            {showTimingSettings ? 'Ocultar' : 'Configurar'} tiempos de reproducción
                          </button>

                          {showTimingSettings && (
                            <div className="mt-3">
                              <SongTimingSlider
                                startTime={moment.songStartTime || '0:00'}
                                endTime={moment.songEndTime || ''}
                                maxDuration={300}
                                onChange={onSongTimingChange}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Preview de iTunes si no hay Spotify */}
                  {!spotifyTrackId && selectedSong.previewUrl && (
                    <div className="mt-3 space-y-2">
                      <audio
                        controls
                        src={selectedSong.previewUrl}
                        className="w-full"
                        preload="none"
                      >
                        Tu navegador no soporta audio HTML5
                      </audio>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs text-amber-800 font-medium mb-1">
                          ⚠️ Solo preview de 30 segundos (iTunes)
                        </p>
                        <p className="text-xs text-amber-700">
                          Para reproducir la canción completa:
                        </p>
                        <ol className="text-xs text-amber-700 mt-1 space-y-0.5 list-decimal list-inside">
                          <li>Busca "{selectedSong.title}" en Spotify</li>
                          <li>Copia el enlace de la canción</li>
                          <li>Click en "Cambiar canción" y pega el enlace de Spotify</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onSelectSong}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                      <Music className="text-gray-400 group-hover:text-blue-500" size={32} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-700 group-hover:text-blue-600 mb-1">
                        Elegir canción
                      </div>
                      <div className="text-sm text-gray-500">Busca en Spotify o iTunes</div>
                    </div>
                  </div>
                </button>
              )}
            </>
          )}

          {/* Hora del momento */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              🕒 Hora aproximada
            </label>
            <input
              type="time"
              value={moment.time || ''}
              onChange={onTimeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};

SimpleMomentCard.propTypes = {
  moment: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    type: PropTypes.string,
    time: PropTypes.string,
    location: PropTypes.string,
    duration: PropTypes.string,
    state: PropTypes.string,
    songCandidates: PropTypes.array,
    selectedSongId: PropTypes.string,
    songStartTime: PropTypes.string,
    songEndTime: PropTypes.string,
    musicType: PropTypes.string,
    playlistUrl: PropTypes.string,
    isDefinitive: PropTypes.bool,
  }).isRequired,
  onSelectSong: PropTypes.func.isRequired,
  onSelectCandidate: PropTypes.func.isRequired,
  onMarkAsDefinitive: PropTypes.func.isRequired,
  onRemoveCandidate: PropTypes.func.isRequired,
  onTimeChange: PropTypes.func.isRequired,
  onSongTimingChange: PropTypes.func,
  onUpdateMoment: PropTypes.func,
  selectedSong: PropTypes.object,
  allCandidates: PropTypes.array,
  showAdvanced: PropTypes.bool,
  allMoments: PropTypes.object,
  currentBlockId: PropTypes.string,
};

export default SimpleMomentCard;
