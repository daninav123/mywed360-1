import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Music,
  Star,
  ChevronRight,
  Plus,
  FileText,
  Calendar,
  Check,
  Play,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PageWrapper from '../../components/PageWrapper';
import { Button } from '../../components/ui';
import useSpecialMoments from '../../hooks/useSpecialMoments';
import TimelineAlerts from '../../components/protocolo/TimelineAlerts';
import VisualTimeline from '../../components/protocolo/VisualTimeline';
import SpotifyPlaylistGenerator from '../../components/protocolo/SpotifyPlaylistGenerator';

/**
 * Timing - Vista timeline/resumen del día de la boda
 * Sincronizada automáticamente con Momentos Especiales vía useSpecialMoments
 */
const Timing = () => {
  const {
    moments,
    blocks,
    activeBlockId,
    setActiveBlockId,
    addMoment,
    updateMoment,
    removeMoment,
    getSelectedSong,
  } = useSpecialMoments();

  const [expandedBlocks, setExpandedBlocks] = useState(['banquete']);

  // Calcular estadísticas globales
  const globalStats = useMemo(() => {
    let totalMoments = 0;
    let withDefinitiveSong = 0;
    let withTime = 0;

    Object.values(moments).forEach((blockMoments) => {
      totalMoments += blockMoments.length;
      blockMoments.forEach((m) => {
        if (m.isDefinitive) withDefinitiveSong++;
        if (m.time) withTime++;
      });
    });

    return {
      total: totalMoments,
      withDefinitiveSong,
      withTime,
      percentage: totalMoments > 0 ? Math.round((withDefinitiveSong / totalMoments) * 100) : 0,
    };
  }, [moments]);

  // Calcular progreso por bloque
  const blockProgress = useMemo(() => {
    return blocks.map((block) => {
      const blockMoments = moments[block.id] || [];
      const total = blockMoments.length;
      const configured = blockMoments.filter((m) => m.isDefinitive && m.time).length;

      // Calcular hora de inicio y fin del bloque
      const times = blockMoments
        .filter((m) => m.time)
        .map((m) => m.time)
        .sort();

      const startTime = times[0] || '';
      const endTime = times[times.length - 1] || '';

      return {
        id: block.id,
        name: block.name,
        total,
        configured,
        startTime,
        endTime,
        percentage: total > 0 ? Math.round((configured / total) * 100) : 0,
      };
    });
  }, [blocks, moments]);

  const toggleBlock = (blockId) => {
    setExpandedBlocks((prev) =>
      prev.includes(blockId) ? prev.filter((id) => id !== blockId) : [...prev, blockId]
    );
  };

  const handleAddMoment = (blockId) => {
    const blockMoments = moments[blockId] || [];
    const nextOrder = blockMoments.length + 1;

    addMoment(blockId, {
      order: nextOrder,
      title: t('protocol.timing.newMoment', { number: nextOrder }),
      type: 'musical',
      time: '',
    });

    // Expandir el bloque automáticamente
    if (!expandedBlocks.includes(blockId)) {
      setExpandedBlocks((prev) => [...prev, blockId]);
    }
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return null;

    try {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const diff = endMinutes - startMinutes;

      if (diff < 0) return null;

      const hours = Math.floor(diff / 60);
      const minutes = diff % 60;

      if (hours === 0) return `${minutes}min`;
      if (minutes === 0) return `${hours}h`;
      return `${hours}h ${minutes}min`;
    } catch {
      return null;
    }
  };

  return (
    <PageWrapper title={t('protocol.timing.pageTitle')}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header con estadísticas */}
        <div className="text-center">
          <h1 className="text-2xl font-bold  mb-1" style={{ color: 'var(--color-text)' }}>{t('protocol.timing.title')}</h1>
          <p className="text-sm  mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            {t('protocol.timing.subtitle')}
          </p>
          <Link to="/protocolo/dia-de-la-boda">
            <Button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]">
              <Play size={16} className="mr-2" />
              {t('protocol.timing.activateMode')}
            </Button>
          </Link>
        </div>

        {/* Estadísticas globales */}
        <div className=" border  rounded-lg p-4" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold " style={{ color: 'var(--color-text)' }}>{globalStats.total}</div>
              <div className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>Momentos totales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold " style={{ color: 'var(--color-success)' }}>
                {globalStats.withDefinitiveSong}
              </div>
              <div className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>Con canción ⭐</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold " style={{ color: 'var(--color-primary)' }}>{globalStats.withTime}</div>
              <div className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>Con horario</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{globalStats.percentage}%</div>
              <div className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>Completado</div>
            </div>
          </div>
        </div>

        {/* Sistema de alertas inteligentes */}
        <TimelineAlerts moments={moments} blocks={blocks} />

        {/* Vista timeline visual */}
        <VisualTimeline blocks={blocks} moments={moments} />

        {/* Generador de playlist de Spotify */}
        <SpotifyPlaylistGenerator moments={moments} blocks={blocks} />

        {/* Bloques de timing */}
        <div className="space-y-4">
          {blockProgress.map((block) => {
            const isExpanded = expandedBlocks.includes(block.id);
            const blockMoments = (moments[block.id] || []).sort(
              (a, b) => (a.order || 0) - (b.order || 0)
            );
            const duration = calculateDuration(block.startTime, block.endTime);

            return (
              <div
                key={block.id}
                className=" rounded-lg border-2  overflow-hidden hover:shadow-md transition-all" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}
              >
                {/* Header del bloque - Clickeable */}
                <div
                  className="p-4 cursor-pointer hover: transition-colors" style={{ backgroundColor: 'var(--color-bg)' }}
                  onClick={() => toggleBlock(block.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <ChevronRight
                          size={20}
                          className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                        <Calendar size={20} className="text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold " style={{ color: 'var(--color-text)' }}>{block.name}</h3>
                        <div className="flex items-center gap-4 text-sm  mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {block.startTime && block.endTime && (
                            <>
                              <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {block.startTime} - {block.endTime}
                              </span>
                              {duration && <span className="" style={{ color: 'var(--color-muted)' }}>· {duration}</span>}
                            </>
                          )}
                          <span>
                            {block.configured}/{block.total} configurados
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[var(--color-primary)] h-2 rounded-full transition-all"
                          style={{ width: `${block.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold  w-12" style={{ color: 'var(--color-text-secondary)' }}>
                        {block.percentage}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contenido expandible */}
                {isExpanded && (
                  <div className="border-t " style={{ borderColor: 'var(--color-border)' }}>
                    {blockMoments.length === 0 ? (
                      <div className="p-8 text-center">
                        <Music size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className=" mb-4" style={{ color: 'var(--color-text-secondary)' }}>No hay momentos en este bloque</p>
                        <Button size="sm" onClick={() => handleAddMoment(block.id)}>
                          <Plus size={16} className="mr-1" />
                          Añadir primer momento
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {blockMoments.map((moment, idx) => {
                          const selectedSong = getSelectedSong(moment);
                          const nextMoment = blockMoments[idx + 1];
                          const momentDuration = nextMoment
                            ? calculateDuration(moment.time, nextMoment.time)
                            : null;

                          return (
                            <div key={moment.id} className="p-4 hover: transition-colors" style={{ backgroundColor: 'var(--color-bg)' }}>
                              <div className="flex items-start gap-4">
                                {/* Orden */}
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    {moment.order || idx + 1}
                                  </div>
                                </div>

                                {/* Info principal */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-medium " style={{ color: 'var(--color-text)' }}>{moment.title}</h4>
                                    {moment.isDefinitive && (
                                      <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 border border-amber-300 rounded text-xs font-semibold text-amber-800">
                                        <Star size={12} fill="currentColor" />
                                        Definitiva
                                      </div>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    {/* Hora */}
                                    <div className="flex items-center gap-2">
                                      <Clock size={14} className="" style={{ color: 'var(--color-muted)' }} />
                                      <input
                                        type="time"
                                        value={moment.time || ''}
                                        onChange={(e) =>
                                          updateMoment(block.id, moment.id, {
                                            time: e.target.value,
                                          })
                                        }
                                        className="flex-1 px-2 py-1 border  rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                                      />
                                      {momentDuration && (
                                        <span className="text-xs " style={{ color: 'var(--color-muted)' }}>
                                          ({momentDuration})
                                        </span>
                                      )}
                                    </div>

                                    {/* Canción o Playlist */}
                                    <div className="flex items-center gap-2">
                                      <Music size={14} className="" style={{ color: 'var(--color-muted)' }} />
                                      {(() => {
                                        const musicType = moment.musicType || 'song';

                                        if (musicType === 'playlist' && moment.playlistUrl) {
                                          return (
                                            <div className="flex-1 flex items-center gap-2">
                                              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                                📋 Playlist
                                              </span>
                                              <Link
                                                to="/protocolo/momentos-especiales"
                                                className=" hover:text-green-800 hover:underline truncate text-xs" style={{ color: 'var(--color-success)' }}
                                              >
                                                Ambiente configurado
                                              </Link>
                                            </div>
                                          );
                                        }

                                        if (musicType === 'none') {
                                          return (
                                            <span className="flex-1  text-xs" style={{ color: 'var(--color-muted)' }}>
                                              🔇 Sin música
                                            </span>
                                          );
                                        }

                                        // Modo canción
                                        if (selectedSong) {
                                          return (
                                            <Link
                                              to="/protocolo/momentos-especiales"
                                              className="flex-1  hover:text-blue-800 hover:underline truncate" style={{ color: 'var(--color-primary)' }}
                                            >
                                              {selectedSong.title} - {selectedSong.artist}
                                            </Link>
                                          );
                                        }

                                        return (
                                          <Link
                                            to="/protocolo/momentos-especiales"
                                            className="flex-1  hover: hover:underline" style={{ color: 'var(--color-primary)' }} style={{ color: 'var(--color-muted)' }}
                                          >
                                            Sin canción → Configurar
                                          </Link>
                                        );
                                      })()}
                                    </div>
                                  </div>

                                  {/* Notas editables */}
                                  <div className="mt-2">
                                    <div className="flex items-start gap-2">
                                      <FileText size={14} className=" mt-2" style={{ color: 'var(--color-muted)' }} />
                                      <textarea
                                        value={moment.notes || ''}
                                        readOnly
                                        className="flex-1 text-sm  bg-transparent border-none resize-none focus:outline-none" style={{ color: 'var(--color-text-secondary)' }}
                                        rows="2"
                                      />
                                    </div>
                                  </div>

                                  {/* Acciones */}
                                  <div className="flex-shrink-0">
                                    <Link
                                      to="/protocolo/momentos-especiales"
                                      className="text-xs  hover:text-blue-800 font-medium" style={{ color: 'var(--color-primary)' }}
                                    >
                                      Editar →
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Botón añadir momento */}
                        <div className="p-4  flex justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddMoment(block.id)}
                          >
                            <Plus size={16} className="mr-1" />
                            Añadir momento
                          </Button>
                        </div>
                      </div>
                    )
                  )}
              </div>
            );
          })}
        </div>

        {/* Enlace a Momentos Especiales */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Music className=" flex-shrink-0" style={{ color: 'var(--color-primary)' }} size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                ¿Necesitas configurar las canciones?
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                Ve a la página de Momentos Especiales para elegir y configurar las canciones
                definitivas para cada momento.
              </p>
              <Link to="/protocolo/momentos-especiales">
                <Button size="sm">
                  <Music size={16} className="mr-1" />
                  Ir a Momentos Especiales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Timing;
