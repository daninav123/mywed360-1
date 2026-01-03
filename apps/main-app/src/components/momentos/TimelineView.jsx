import { Clock, Music, AlertTriangle, Check, ChevronRight } from 'lucide-react';
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * TimelineView - Vista visual del timeline de la boda
 * Muestra todos los bloques y momentos en una línea de tiempo horizontal
 */
const TimelineView = ({ blocks = [], moments = {}, onBlockClick, activeBlockId = null }) => {
  // Calcular estadísticas por bloque
  const blockStats = useMemo(() => {
    return blocks.map((block) => {
      const blockMoments = moments[block.id] || [];
      const total = blockMoments.length;
      const completed = blockMoments.filter((m) => {
        const hasTime = m.time && m.time.trim() !== '';
        const hasSong =
          (m.songCandidates && m.songCandidates.length > 0 && m.selectedSongId) ||
          (m.song && m.song.trim() !== '');
        const hasResponsibles = m.responsables && m.responsables.length > 0;

        // Un momento se considera completo si tiene al menos tiempo y canción (si aplica)
        const needsSong = ['entrada', 'salida', 'baile'].includes(m.type);
        if (needsSong) {
          return hasTime && hasSong && hasResponsibles;
        }
        return hasTime && hasResponsibles;
      }).length;

      const warnings = blockMoments.filter((m) => {
        const hasIssues =
          !m.time ||
          !m.responsables ||
          m.responsables.length === 0 ||
          (['entrada', 'salida', 'baile'].includes(m.type) && !m.songCandidates?.length && !m.song);
        return hasIssues;
      }).length;

      // Obtener primer momento con hora
      const firstMomentWithTime = blockMoments.find((m) => m.time && m.time.trim() !== '');
      const time = firstMomentWithTime?.time || null;

      return {
        id: block.id,
        name: block.name,
        total,
        completed,
        warnings,
        time,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
  }, [blocks, moments]);

  const totalMoments = blockStats.reduce((sum, b) => sum + b.total, 0);
  const totalCompleted = blockStats.reduce((sum, b) => sum + b.completed, 0);
  const overallPercentage =
    totalMoments > 0 ? Math.round((totalCompleted / totalMoments) * 100) : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* Header con progreso global */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Timeline de la boda</h3>
          <p className="text-xs text-gray-600">
            {totalCompleted} de {totalMoments} momentos configurados
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{overallPercentage}%</div>
          <div className="text-xs text-gray-500">Completado</div>
        </div>
      </div>

      {/* Barra de progreso global */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${overallPercentage}%` }}
        />
      </div>

      {/* Timeline horizontal */}
      <div className="relative">
        {/* Línea conectora */}
        <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-300 hidden md:block" />

        {/* Bloques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {blockStats.map((block, index) => {
            const isActive = block.id === activeBlockId;
            const isComplete = block.percentage === 100;
            const hasWarnings = block.warnings > 0;

            return (
              <div key={block.id} className="relative">
                {/* Conector entre bloques (solo desktop) */}
                {index < blockStats.length - 1 && (
                  <div className="hidden md:block absolute top-8 right-0 transform translate-x-1/2 z-10">
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                )}

                {/* Card del bloque */}
                <button
                  type="button"
                  onClick={() => onBlockClick && onBlockClick(block.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  {/* Punto indicador (solo desktop) */}
                  <div className="hidden md:flex justify-center mb-2">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        isComplete
                          ? 'bg-green-500 border-green-600'
                          : hasWarnings
                            ? 'bg-amber-400 border-amber-500'
                            : 'bg-white border-gray-300'
                      }`}
                    >
                      {isComplete && (
                        <div className="w-full h-full flex items-center justify-center">
                          <Check size={10} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hora */}
                  {block.time && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                      <Clock size={12} />
                      <span className="font-medium">{block.time}</span>
                    </div>
                  )}

                  {/* Nombre del bloque */}
                  <div className="font-semibold text-gray-900 mb-2 text-sm">{block.name}</div>

                  {/* Estadísticas */}
                  <div className="space-y-1.5">
                    {/* Progreso */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Progreso</span>
                      <span
                        className={`font-semibold ${
                          isComplete ? 'text-green-600' : 'text-gray-900'
                        }`}
                      >
                        {block.completed}/{block.total}
                      </span>
                    </div>

                    {/* Barra de progreso */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          isComplete ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${block.percentage}%` }}
                      />
                    </div>

                    {/* Advertencias */}
                    {hasWarnings && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 mt-2">
                        <AlertTriangle size={12} />
                        <span>{block.warnings} sin completar</span>
                      </div>
                    )}

                    {/* Indicador de música configurada */}
                    {block.total > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Music size={12} />
                        <span>
                          {moments[block.id]?.filter(
                            (m) => (m.songCandidates?.length > 0 && m.selectedSongId) || m.song
                          ).length || 0}{' '}
                          con música
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500 border border-green-600" />
          <span>Completado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500" />
          <span>Con advertencias</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-white border border-gray-300" />
          <span>Pendiente</span>
        </div>
      </div>
    </div>
  );
};

TimelineView.propTypes = {
  blocks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  moments: PropTypes.object,
  onBlockClick: PropTypes.func,
  activeBlockId: PropTypes.string,
};

export default TimelineView;
