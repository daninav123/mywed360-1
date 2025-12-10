import { ChevronRight, Check, Music } from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';

import PageWrapper from '../../components/PageWrapper';
import { Button } from '../../components/ui';
import useSpecialMoments from '../../hooks/useSpecialMoments';
import useTranslations from '../../hooks/useTranslations';
import SimpleMomentCard from '../../components/momentos/SimpleMomentCard';
import CleanSongPicker from '../../components/momentos/CleanSongPicker';

/**
 * MomentosEspecialesSimple - Versión ultra-limpia y minimalista
 * Enfocada en la tarea principal: elegir la canción perfecta para cada momento
 */
const MomentosEspecialesSimple = () => {
  const { t } = useTranslations();
  const {
    moments,
    blocks,
    updateMoment,
    addSongCandidate,
    removeSongCandidate,
    selectSong,
    markSongAsDefinitive,
    getSelectedSong,
  } = useSpecialMoments();

  const [activeBlockId, setActiveBlockId] = useState('banquete');
  const [songPickerState, setSongPickerState] = useState({
    isOpen: false,
    momentId: null,
    momentTitle: '',
  });

  // Obtener momentos del bloque activo
  const activeMoments = useMemo(() => {
    const list = moments[activeBlockId] || [];
    return list.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [moments, activeBlockId]);

  // Calcular progreso del bloque
  const blockProgress = useMemo(() => {
    return blocks.map((block) => {
      const blockMoments = moments[block.id] || [];
      const total = blockMoments.length;
      const completed = blockMoments.filter((m) => {
        // Considerar definitiva como completada
        if (m.isDefinitive) {
          return true;
        }

        const hasSong =
          (m.songCandidates && m.songCandidates.length > 0 && m.selectedSongId) ||
          (m.song && m.song.trim() !== '');
        const hasTime = m.time && m.time.trim() !== '';
        return hasSong && hasTime;
      }).length;

      return {
        id: block.id,
        name: block.name,
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
  }, [blocks, moments]);

  const activeBlock = blocks.find((b) => b.id === activeBlockId);
  const currentProgress = blockProgress.find((p) => p.id === activeBlockId);

  // Handlers
  const openSongPicker = useCallback((moment) => {
    setSongPickerState({
      isOpen: true,
      momentId: moment.id,
      momentTitle: moment.title || 'Momento',
    });
  }, []);

  const closeSongPicker = useCallback(() => {
    setSongPickerState({
      isOpen: false,
      momentId: null,
      momentTitle: '',
    });
  }, []);

  const handleSongSelect = useCallback(
    (song) => {
      if (!songPickerState.momentId) return;

      // Agregar como candidata y seleccionar
      addSongCandidate(activeBlockId, songPickerState.momentId, song);
      selectSong(activeBlockId, songPickerState.momentId, song.id);

      // Cerrar el picker
      closeSongPicker();

      // Notificar al usuario
      toast.success('Canción agregada a tus opciones', {
        position: 'bottom-right',
        autoClose: 2000,
      });
    },
    [songPickerState.momentId, activeBlockId, addSongCandidate, selectSong]
  );

  const handleTimeChange = useCallback(
    (momentId, time) => {
      const moment = activeMoments.find((m) => m.id === momentId);
      if (!moment) return;

      updateMoment(activeBlockId, momentId, { ...moment, time });
    },
    [activeMoments, activeBlockId, updateMoment]
  );

  const handleSongTimingChange = useCallback(
    (momentId, timing) => {
      const moment = activeMoments.find((m) => m.id === momentId);
      if (!moment) return;

      updateMoment(activeBlockId, momentId, {
        ...moment,
        songStartTime: timing.startTime,
        songEndTime: timing.endTime,
      });
    },
    [activeMoments, activeBlockId, updateMoment]
  );

  return (
    <PageWrapper title="Música para tu Boda">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header compacto */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Elige la canción perfecta para cada momento
          </h1>
          <p className="text-sm text-gray-600">
            Busca, escucha y selecciona la música ideal para tu día especial
          </p>
        </div>

        {/* Banner informativo compacto */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Music className="text-blue-600" size={20} />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">
                🎵 Escucha canciones completas
              </p>
              <p className="text-xs text-blue-700">
                Haz login en{' '}
                <a
                  href="https://accounts.spotify.com/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  Spotify.com
                </a>{' '}
                en otra pestaña, recarga aquí y podrás escuchar canciones completas
              </p>
            </div>
          </div>
        </div>

        {/* Navegación de bloques */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {blockProgress.map((block, index) => {
              const isActive = block.id === activeBlockId;
              const isComplete = block.percentage === 100;

              return (
                <div key={block.id} className="relative">
                  {/* Conector (solo desktop) */}
                  {index < blockProgress.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 left-full w-4 -ml-2 -translate-y-1/2 z-0">
                      <ChevronRight className="text-gray-300" size={20} />
                    </div>
                  )}

                  {/* Tarjeta de bloque */}
                  <button
                    type="button"
                    onClick={() => setActiveBlockId(block.id)}
                    className={`
                      relative w-full text-left p-4 rounded-xl border-2 transition-all z-10
                      ${
                        isActive
                          ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }
                    `}
                  >
                    {/* Indicador de completitud */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-semibold ${
                          isActive ? 'text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        {block.name}
                      </span>
                      {isComplete && (
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <Check size={14} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {/* Progreso */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Progreso</span>
                        <span className="font-semibold">
                          {block.completed}/{block.total}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isComplete ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${block.percentage}%` }}
                        />
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contenido del bloque activo */}
        {activeBlock && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{activeBlock.name}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {currentProgress?.completed || 0} de {currentProgress?.total || 0} momentos
                  configurados
                </p>
              </div>

              {currentProgress && currentProgress.percentage > 0 && (
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {currentProgress.percentage}%
                  </div>
                  <div className="text-xs text-gray-500">Completado</div>
                </div>
              )}
            </div>

            {/* Lista de momentos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeMoments.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <Music size={48} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">No hay momentos en esta sección</p>
                </div>
              ) : (
                activeMoments.map((moment) => (
                  <SimpleMomentCard
                    key={moment.id}
                    moment={moment}
                    selectedSong={getSelectedSong(moment)}
                    allCandidates={moment.songCandidates || []}
                    onSelectSong={() => openSongPicker(moment)}
                    onSelectCandidate={(songId) => selectSong(activeBlockId, moment.id, songId)}
                    onMarkAsDefinitive={(songId) =>
                      markSongAsDefinitive(activeBlockId, moment.id, songId)
                    }
                    onRemoveCandidate={(songId) =>
                      removeSongCandidate(activeBlockId, moment.id, songId)
                    }
                    onTimeChange={(time) => handleTimeChange(moment.id, time)}
                    onSongTimingChange={(timing) => handleSongTimingChange(moment.id, timing)}
                    onUpdateMoment={(updatedMoment) =>
                      updateMoment(activeBlockId, moment.id, updatedMoment)
                    }
                    showAdvanced={false}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de selección de canciones */}
      <CleanSongPicker
        isOpen={songPickerState.isOpen}
        onClose={closeSongPicker}
        onSelect={handleSongSelect}
        momentTitle={songPickerState.momentTitle}
      />
    </PageWrapper>
  );
};

export default MomentosEspecialesSimple;
