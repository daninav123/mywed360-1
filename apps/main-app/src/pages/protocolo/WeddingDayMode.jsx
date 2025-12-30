import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, CheckCircle, Clock, Music, AlertCircle, ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageWrapper from '../../components/PageWrapper';
import { Button } from '../../components/ui';
import useSpecialMoments from '../../hooks/useSpecialMoments';

/**
 * WeddingDayMode - Modo especial para el día de la boda
 * Muestra cronograma en tiempo real con estado actual y siguiente
 */
const WeddingDayMode = () => {
  const { moments, blocks, updateMoment } = useSpecialMoments();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar hora cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Crear lista plana de todos los momentos ordenados por hora
  const allMoments = useMemo(() => {
    const flat = [];
    blocks.forEach((block) => {
      const blockMoments = moments[block.id] || [];
      blockMoments.forEach((moment) => {
        if (moment.time) {
          flat.push({
            ...moment,
            blockId: block.id,
            blockName: block.name,
          });
        }
      });
    });
    return flat.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [moments, blocks]);

  // Determinar momento actual y siguiente
  const timelineStatus = useMemo(() => {
    const now = currentTime;
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMin = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMin}`;

    let currentMoment = null;
    let nextMoment = null;
    let currentIndex = -1;

    for (let i = 0; i < allMoments.length; i++) {
      const moment = allMoments[i];
      if (moment.completed) continue; // Saltar completados

      if (moment.time <= currentTimeStr) {
        currentMoment = moment;
        currentIndex = i;
      } else {
        nextMoment = moment;
        break;
      }
    }

    // Si no hay current, el primer momento es el siguiente
    if (!currentMoment && allMoments.length > 0) {
      nextMoment = allMoments[0];
    }

    // Calcular tiempo hasta siguiente
    let minutesUntilNext = null;
    if (nextMoment) {
      const [nextH, nextM] = nextMoment.time.split(':').map(Number);
      const nextMinutes = nextH * 60 + nextM;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      minutesUntilNext = nextMinutes - nowMinutes;
    }

    // Completados
    const completed = allMoments.filter((m) => m.completed);
    const pending = allMoments.filter((m) => !m.completed);

    return {
      currentMoment,
      nextMoment,
      currentIndex,
      minutesUntilNext,
      completed: completed.length,
      pending: pending.length,
      total: allMoments.length,
      percentage:
        allMoments.length > 0 ? Math.round((completed.length / allMoments.length) * 100) : 0,
    };
  }, [allMoments, currentTime]);

  const markAsCompleted = (blockId, momentId) => {
    updateMoment(blockId, momentId, { completed: true });
  };

  const formatTimeUntil = (minutes) => {
    if (minutes === null) return '';
    if (minutes < 0) return 'Retrasado';
    if (minutes === 0) return '¡AHORA!';
    if (minutes < 60) return `en ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `en ${hours}h ${mins}min`;
  };

  const getSelectedSong = (moment) => {
    if (!moment.songCandidates || moment.songCandidates.length === 0) return null;
    return moment.songCandidates.find((c) => c.id === moment.selectedSongId);
  };

  return (
    <PageWrapper title="Modo Día de la Boda">
      <div className="layout-container-wide space-y-4">
        {/* Header con hora actual */}
        <div className="bg-[var(--color-primary)] text-white rounded-lg p-6 text-center">
          <h1 className="text-3xl font-bold mb-2">¡Día de la Boda!</h1>
          <div className="text-5xl font-bold mb-2">
            {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <p className="text-purple-100">
            {currentTime.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Progreso general */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {timelineStatus.completed} / {timelineStatus.total}
              </div>
              <div className="text-sm text-gray-600">Momentos completados</div>
            </div>
            <div className="text-3xl font-bold text-purple-600">{timelineStatus.percentage}%</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-[var(--color-primary)] h-3 rounded-full transition-all duration-500"
              style={{ width: `${timelineStatus.percentage}%` }}
            />
          </div>
        </div>

        {/* Momento actual */}
        {timelineStatus.currentMoment && (
          <div className="bg-white border-2 border-green-300 rounded-lg overflow-hidden">
            <div className="bg-green-600 text-white px-4 py-2 flex items-center gap-2">
              <Play size={20} />
              <span className="font-bold">MOMENTO ACTUAL</span>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {timelineStatus.currentIndex + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-1 bg-green-200 text-green-800 text-xs font-bold rounded">
                      {timelineStatus.currentMoment.blockName}
                    </span>
                    <span className="text-sm text-gray-600">
                      <Clock size={14} className="inline mr-1" />
                      {timelineStatus.currentMoment.time}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {timelineStatus.currentMoment.title}
                  </h2>
                  {(() => {
                    const song = getSelectedSong(timelineStatus.currentMoment);
                    return song && timelineStatus.currentMoment.isDefinitive ? (
                      <div className="flex items-center gap-2 text-green-700 mb-3">
                        <Music size={16} />
                        <span className="font-medium">
                          {song.title} - {song.artist}
                        </span>
                      </div>
                    ) : null;
                  })()}
                  {timelineStatus.currentMoment.notes && (
                    <div className="bg-white border border-green-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-700">
                        💡 <strong>Nota:</strong> {timelineStatus.currentMoment.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={() =>
                  markAsCompleted(
                    timelineStatus.currentMoment.blockId,
                    timelineStatus.currentMoment.id
                  )
                }
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle size={20} className="mr-2" />
                Marcar como Completado
              </Button>
            </div>
          </div>
        )}

        {/* Siguiente momento */}
        {timelineStatus.nextMoment && (
          <div className="bg-white border-2 border-blue-300 rounded-lg overflow-hidden">
            <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRight size={20} />
                <span className="font-bold">SIGUIENTE</span>
              </div>
              {timelineStatus.minutesUntilNext !== null && (
                <span className="text-blue-100 font-medium">
                  {formatTimeUntil(timelineStatus.minutesUntilNext)}
                </span>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {timelineStatus.currentIndex + 2}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs font-bold rounded">
                      {timelineStatus.nextMoment.blockName}
                    </span>
                    <span className="text-sm text-gray-600">
                      <Clock size={14} className="inline mr-1" />
                      {timelineStatus.nextMoment.time}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {timelineStatus.nextMoment.title}
                  </h3>
                  {(() => {
                    const song = getSelectedSong(timelineStatus.nextMoment);
                    return song && timelineStatus.nextMoment.isDefinitive ? (
                      <div className="flex items-center gap-2 text-blue-700">
                        <Music size={16} />
                        <span className="font-medium">
                          {song.title} - {song.artist}
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista completa (colapsable) */}
        <details className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
          <summary className="cursor-pointer bg-gray-50 px-4 py-3 font-semibold text-gray-900 hover:bg-gray-100 transition-colors">
            Ver cronograma completo ({timelineStatus.pending} pendientes)
          </summary>
          <div className="divide-y divide-gray-100">
            {allMoments.map((moment, idx) => {
              const song = getSelectedSong(moment);
              const isCompleted = moment.completed;

              return (
                <div
                  key={`${moment.blockId}-${moment.id}`}
                  className={`p-4 ${isCompleted ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'} transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                          {moment.blockName}
                        </span>
                        <span className="text-xs text-gray-500">{moment.time}</span>
                      </div>
                      <div
                        className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}
                      >
                        {moment.title}
                      </div>
                      {song && moment.isDefinitive && (
                        <div className="text-xs text-gray-600 mt-1">
                          🎵 {song.title} - {song.artist}
                        </div>
                      )}
                    </div>
                    {!isCompleted && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsCompleted(moment.blockId, moment.id)}
                      >
                        ✓
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </details>

        {/* Enlaces */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-purple-900 font-medium">¿Necesitas ver más detalles?</p>
            <p className="text-xs text-purple-700">Vuelve a la vista normal de timing</p>
          </div>
          <Link to="/protocolo/timing">
            <Button variant="outline" size="sm">
              Ver Timeline Completo
            </Button>
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
};

export default WeddingDayMode;
