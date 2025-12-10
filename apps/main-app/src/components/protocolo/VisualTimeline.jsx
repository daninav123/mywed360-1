import React, { useMemo } from 'react';
import { Clock } from 'lucide-react';

/**
 * VisualTimeline - Vista gráfica horizontal del cronograma completo
 * Muestra todos los bloques del día en una línea de tiempo
 */
const VisualTimeline = ({ blocks, moments }) => {
  const timelineData = useMemo(() => {
    const data = blocks
      .map((block) => {
        const blockMoments = (moments[block.id] || [])
          .filter((m) => m.time)
          .sort((a, b) => {
            const timeA = a.time || '00:00';
            const timeB = b.time || '00:00';
            return timeA.localeCompare(timeB);
          });

        const times = blockMoments.map((m) => m.time);
        const startTime = times[0] || '';
        const endTime = times[times.length - 1] || '';

        return {
          id: block.id,
          name: block.name,
          startTime,
          endTime,
          momentCount: blockMoments.length,
          configured: blockMoments.filter((m) => m.isDefinitive).length,
        };
      })
      .filter((b) => b.startTime); // Solo bloques con horario

    // Calcular rangos de tiempo para el día completo
    if (data.length === 0) return { blocks: [], dayStart: '', dayEnd: '', totalMinutes: 0 };

    const allTimes = data.flatMap((b) => [b.startTime, b.endTime]);
    const dayStart = allTimes.sort()[0];
    const dayEnd = allTimes.sort()[allTimes.length - 1];

    const startMinutes = timeToMinutes(dayStart);
    const endMinutes = timeToMinutes(dayEnd);
    const totalMinutes = endMinutes - startMinutes;

    // Calcular posición y ancho de cada bloque
    const blocksWithPosition = data.map((block) => {
      const blockStart = timeToMinutes(block.startTime);
      const blockEnd = timeToMinutes(block.endTime);
      const offset = blockStart - startMinutes;
      const duration = blockEnd - blockStart;

      return {
        ...block,
        offsetPercent: (offset / totalMinutes) * 100,
        widthPercent: (duration / totalMinutes) * 100,
        duration: formatDuration(duration),
      };
    });

    return {
      blocks: blocksWithPosition,
      dayStart,
      dayEnd,
      totalMinutes,
      totalDuration: formatDuration(totalMinutes),
    };
  }, [blocks, moments]);

  const timeToMinutes = (time) => {
    try {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    } catch {
      return 0;
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  const getBlockColor = (blockId) => {
    const colors = {
      ceremonia: 'from-blue-500 to-blue-600',
      coctail: 'from-purple-500 to-purple-600',
      banquete: 'from-pink-500 to-pink-600',
      disco: 'from-orange-500 to-orange-600',
    };
    return colors[blockId] || 'from-gray-500 to-gray-600';
  };

  if (timelineData.blocks.length === 0) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-lg p-8 text-center">
        <Clock size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-600 mb-2 font-medium">Timeline Visual no disponible</p>
        <p className="text-sm text-gray-500">
          Configura la hora de al menos un momento en cada bloque para ver la visualización del día
          completo
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={20} className="text-blue-600" />
              Vista Timeline del Día
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {timelineData.dayStart} - {timelineData.dayEnd} · Duración total:{' '}
              {timelineData.totalDuration}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{timelineData.blocks.length}</div>
            <div className="text-xs text-gray-600">Bloques</div>
          </div>
        </div>
      </div>

      {/* Timeline visual */}
      <div className="p-6">
        {/* Marcadores de hora */}
        <div className="flex justify-between text-xs text-gray-500 mb-2 px-1">
          <span className="font-medium">{timelineData.dayStart}</span>
          <span className="text-gray-400">━━━ {timelineData.totalDuration} ━━━</span>
          <span className="font-medium">{timelineData.dayEnd}</span>
        </div>

        {/* Barra de timeline */}
        <div className="relative h-20 bg-gray-100 rounded-lg overflow-hidden mb-4">
          {timelineData.blocks.map((block, idx) => (
            <div
              key={block.id}
              className="absolute top-0 h-full group cursor-pointer transition-all hover:z-10"
              style={{
                left: `${block.offsetPercent}%`,
                width: `${block.widthPercent}%`,
              }}
            >
              {/* Bloque visual */}
              <div
                className={`h-full bg-gradient-to-r ${getBlockColor(block.id)} rounded-lg shadow-md group-hover:shadow-xl transition-all border-2 border-white flex flex-col items-center justify-center p-2`}
              >
                <div className="text-white font-bold text-sm truncate w-full text-center">
                  {block.name}
                </div>
                <div className="text-white text-xs opacity-90">{block.duration}</div>
              </div>

              {/* Tooltip en hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                  <div className="font-semibold mb-1">{block.name}</div>
                  <div>
                    {block.startTime} - {block.endTime}
                  </div>
                  <div className="text-gray-300 mt-1">
                    {block.configured}/{block.momentCount} definitivos
                  </div>
                  {/* Flecha */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                    <div className="w-2 h-2 bg-gray-900 transform rotate-45"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          {timelineData.blocks.map((block) => (
            <div key={block.id} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded bg-gradient-to-r ${getBlockColor(block.id)}`}></div>
              <span className="font-medium text-gray-700">{block.name}</span>
              <span className="text-gray-500">
                ({block.configured}/{block.momentCount})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VisualTimeline;
