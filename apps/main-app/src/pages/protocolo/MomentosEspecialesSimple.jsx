import { ChevronRight, Check, Music, Plus, Trash2, Radio } from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';

import PageWrapper from '../../components/PageWrapper';
import { Button } from '../../components/ui';
import useSpecialMoments from '../../hooks/useSpecialMoments';
import useTranslations from '../../hooks/useTranslations';
import SimpleMomentCard from '../../components/momentos/SimpleMomentCard';
import CleanSongPicker from '../../components/momentos/CleanSongPicker';
import ExportActionsBar from '../../components/momentos/ExportActionsBar';
import SpecialSongModal from '../../components/momentos/SpecialSongModal';
import BackgroundPlaylistConfig from '../../components/momentos/BackgroundPlaylistConfig';

/**
 * MomentosEspecialesSimple - Versión ultra-limpia y minimalista
 * Enfocada en la tarea principal: elegir la canción perfecta para cada momento
 */
const MomentosEspecialesSimple = () => {
  const { t } = useTranslations();
  const {
    moments,
    blocks,
    addMoment,
    removeMoment,
    updateMoment,
    addSongCandidate,
    removeSongCandidate,
    selectSong,
    markSongAsDefinitive,
    getSelectedSong,
    updateSongSpecialStatus,
    getExportStats,
    updateBlock,
  } = useSpecialMoments();

  const [activeBlockId, setActiveBlockId] = useState('banquete');
  const [songPickerState, setSongPickerState] = useState({
    isOpen: false,
    momentId: null,
    momentTitle: '',
  });

  const [specialSongModal, setSpecialSongModal] = useState({
    isOpen: false,
    song: null,
    momentId: null,
    blockId: null,
  });

  const [backgroundPlaylistModal, setBackgroundPlaylistModal] = useState({
    isOpen: false,
    block: null,
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
      momentType: moment.type || 'otro',
      userDescription: moment.musicDescription || '',
    });
  }, []);

  const closeSongPicker = useCallback(() => {
    setSongPickerState({
      isOpen: false,
      momentId: null,
      momentTitle: '',
      momentType: '',
      userDescription: '',
    });
  }, []);

  const handleDescriptionChange = useCallback(
    (newDescription) => {
      if (!songPickerState.momentId) return;
      
      // Actualizar descripción en el momento
      updateMoment(activeBlockId, songPickerState.momentId, {
        musicDescription: newDescription,
      });
    },
    [activeBlockId, songPickerState.momentId, updateMoment]
  );

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

  const handleOpenSpecialSongModal = useCallback((moment, song) => {
    setSpecialSongModal({
      isOpen: true,
      song,
      momentId: moment.id,
      blockId: activeBlockId,
    });
  }, [activeBlockId]);

  const handleSaveSpecialSong = useCallback(
    (specialData) => {
      if (!specialSongModal.song || !specialSongModal.momentId) return;

      updateSongSpecialStatus(
        specialSongModal.blockId,
        specialSongModal.momentId,
        specialSongModal.song.id,
        specialData
      );

      toast.success(
        specialData.isSpecial
          ? 'Canción marcada como especial'
          : 'Configuración actualizada',
        { position: 'bottom-right', autoClose: 2000 }
      );

      setSpecialSongModal({ isOpen: false, song: null, momentId: null, blockId: null });
    },
    [specialSongModal, updateSongSpecialStatus]
  );

  const handleAddMoment = useCallback(() => {
    const blockMoments = moments[activeBlockId] || [];
    const nextOrder = blockMoments.length + 1;

    addMoment(activeBlockId, {
      order: nextOrder,
      title: `Nuevo momento ${nextOrder}`,
      type: 'otro',
      time: '',
      duration: '',
    });

    toast.success('➕ Momento añadido', { position: 'bottom-right', autoClose: 2000 });
  }, [activeBlockId, moments, addMoment]);

  const handleRemoveMoment = useCallback(
    (momentId, momentTitle) => {
      if (window.confirm(`¿Eliminar "${momentTitle}"?`)) {
        removeMoment(activeBlockId, momentId);
        toast.success('🗑️ Momento eliminado', { position: 'bottom-right', autoClose: 2000 });
      }
    },
    [activeBlockId, removeMoment]
  );

  const handleOpenBackgroundPlaylist = useCallback(() => {
    const block = blocks.find(b => b.id === activeBlockId);
    if (block) {
      setBackgroundPlaylistModal({ isOpen: true, block });
    }
  }, [activeBlockId, blocks]);

  const handleSaveBackgroundPlaylist = useCallback(
    (config) => {
      updateBlock(activeBlockId, { backgroundPlaylist: config });
      setBackgroundPlaylistModal({ isOpen: false, block: null });
      
      if (config.enabled) {
        toast.success('🎵 Playlist de ambiente configurada', { position: 'bottom-right', autoClose: 2000 });
      } else {
        toast.success('🚫 Playlist de ambiente desactivada', { position: 'bottom-right', autoClose: 2000 });
      }
    },
    [activeBlockId, updateBlock]
  );

  return (
    <PageWrapper title="Música para tu Boda">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Barra de exportación */}
        <ExportActionsBar
          blocks={blocks}
          moments={moments}
          getSelectedSong={getSelectedSong}
          getExportStats={getExportStats}
          weddingInfo={{}}
        />
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
        <div className="bg-[var(--color-primary)] border border-blue-200 rounded-lg p-3">
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
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">{activeBlock.name}</h2>
                  {activeBlock.backgroundPlaylist?.enabled && (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                      <Radio size={12} />
                      Ambiente activo
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {currentProgress?.completed || 0} de {currentProgress?.total || 0} momentos configurados
                </p>
              </div>
              
              <Button
                onClick={handleOpenBackgroundPlaylist}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Radio size={18} className="mr-2" />
                {activeBlock.backgroundPlaylist?.enabled ? 'Editar Ambiente' : 'Añadir Ambiente'}
              </Button>

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
                    onConfigureSpecial={(song) => handleOpenSpecialSongModal(moment, song)}
                    onRemoveMoment={() => handleRemoveMoment(moment.id, moment.title)}
                    showAdvanced={false}
                    allMoments={moments}
                    currentBlockId={activeBlockId}
                  />
                ))
              )}

              {/* Botón para añadir nuevo momento */}
              <div className="col-span-full mt-4 flex justify-center">
                <Button
                  onClick={handleAddMoment}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md"
                >
                  <Plus size={18} className="mr-2" />
                  Añadir nuevo momento
                </Button>
              </div>
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
        momentType={songPickerState.momentType}
        blockType={activeBlockId}
        userDescription={songPickerState.userDescription}
        onDescriptionChange={handleDescriptionChange}
      />

      {/* Modal de configuración de canción especial */}
      <SpecialSongModal
        isOpen={specialSongModal.isOpen}
        onClose={() => setSpecialSongModal({ isOpen: false, song: null, momentId: null, blockId: null })}
        song={specialSongModal.song}
        momentId={specialSongModal.momentId}
        onSave={handleSaveSpecialSong}
      />

      {/* Modal de configuración de playlist de ambiente */}
      {backgroundPlaylistModal.isOpen && backgroundPlaylistModal.block && (
        <BackgroundPlaylistConfig
          block={backgroundPlaylistModal.block}
          onSave={handleSaveBackgroundPlaylist}
          onClose={() => setBackgroundPlaylistModal({ isOpen: false, block: null })}
        />
      )}
    </PageWrapper>
  );
};

export default MomentosEspecialesSimple;
