import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * SongTimingSlider - Selector visual de timing de canción
 * Permite definir inicio y fin de reproducción con sliders interactivos
 */
const SongTimingSlider = ({ 
  startTime = '0:00', 
  endTime = '', 
  maxDuration = 300, // 5 minutos por defecto
  onChange 
}) => {
  // Convertir tiempo string a segundos
  const timeToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    const minutes = parseInt(parts[0] || 0, 10);
    const seconds = parseInt(parts[1] || 0, 10);
    return minutes * 60 + seconds;
  };

  // Convertir segundos a string de tiempo
  const secondsToTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const [startSeconds, setStartSeconds] = useState(timeToSeconds(startTime));
  const [endSeconds, setEndSeconds] = useState(
    endTime ? timeToSeconds(endTime) : maxDuration
  );
  const [isPlaying, setIsPlaying] = useState(false);

  // Actualizar cuando cambien los props
  useEffect(() => {
    setStartSeconds(timeToSeconds(startTime));
  }, [startTime]);

  useEffect(() => {
    setEndSeconds(endTime ? timeToSeconds(endTime) : maxDuration);
  }, [endTime, maxDuration]);

  const handleStartChange = useCallback((e) => {
    const newStart = parseInt(e.target.value, 10);
    setStartSeconds(newStart);
    
    // Asegurar que el fin es mayor que el inicio
    if (newStart >= endSeconds) {
      const newEnd = Math.min(newStart + 30, maxDuration);
      setEndSeconds(newEnd);
      onChange?.({
        startTime: secondsToTime(newStart),
        endTime: secondsToTime(newEnd),
      });
    } else {
      onChange?.({
        startTime: secondsToTime(newStart),
        endTime: secondsToTime(endSeconds),
      });
    }
  }, [endSeconds, maxDuration, onChange]);

  const handleEndChange = useCallback((e) => {
    const newEnd = parseInt(e.target.value, 10);
    setEndSeconds(newEnd);
    
    // Asegurar que el fin es mayor que el inicio
    if (newEnd <= startSeconds) {
      const newStart = Math.max(newEnd - 30, 0);
      setStartSeconds(newStart);
      onChange?.({
        startTime: secondsToTime(newStart),
        endTime: secondsToTime(newEnd),
      });
    } else {
      onChange?.({
        startTime: secondsToTime(startSeconds),
        endTime: secondsToTime(newEnd),
      });
    }
  }, [startSeconds, onChange]);

  const duration = endSeconds - startSeconds;
  const startPercent = (startSeconds / maxDuration) * 100;
  const endPercent = (endSeconds / maxDuration) * 100;

  // Acciones rápidas
  const handleSkipBack = () => {
    const newStart = Math.max(startSeconds - 5, 0);
    setStartSeconds(newStart);
    onChange?.({
      startTime: secondsToTime(newStart),
      endTime: secondsToTime(endSeconds),
    });
  };

  const handleSkipForward = () => {
    const newEnd = Math.min(endSeconds + 5, maxDuration);
    setEndSeconds(newEnd);
    onChange?.({
      startTime: secondsToTime(startSeconds),
      endTime: secondsToTime(newEnd),
    });
  };

  const handleReset = () => {
    setStartSeconds(0);
    setEndSeconds(maxDuration);
    onChange?.({
      startTime: '0:00',
      endTime: secondsToTime(maxDuration),
    });
  };

  return (
    <div className="space-y-4">
      {/* Timeline visual */}
      <div className="relative h-16 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
        {/* Región seleccionada */}
        <div
          className="absolute h-full bg-gradient-to-r from-blue-400 to-blue-500 opacity-50 transition-all"
          style={{
            left: `${startPercent}%`,
            width: `${endPercent - startPercent}%`,
          }}
        />
        
        {/* Marcador de inicio */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-blue-600 transition-all"
          style={{ left: `${startPercent}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
            {secondsToTime(startSeconds)}
          </div>
        </div>

        {/* Marcador de fin */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-blue-600 transition-all"
          style={{ left: `${endPercent}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
            {secondsToTime(endSeconds)}
          </div>
        </div>

        {/* Marcadores de tiempo cada 30 segundos */}
        {Array.from({ length: Math.ceil(maxDuration / 30) }).map((_, i) => {
          const second = i * 30;
          const percent = (second / maxDuration) * 100;
          
          return (
            <div
              key={second}
              className="absolute top-0 bottom-0 w-px bg-gray-300"
              style={{ left: `${percent}%` }}
            >
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 font-medium">
                {Math.floor(second / 60)}:{(second % 60).toString().padStart(2, '0')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controles de sliders */}
      <div className="space-y-3">
        {/* Slider de inicio */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">Inicio</label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSkipBack}
                className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Retroceder 5s"
              >
                <SkipBack size={14} />
              </button>
              <span className="text-sm font-mono font-semibold text-blue-600 min-w-[48px] text-center">
                {secondsToTime(startSeconds)}
              </span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max={maxDuration}
            value={startSeconds}
            onChange={handleStartChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Slider de fin */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">Fin</label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-semibold text-blue-600 min-w-[48px] text-center">
                {secondsToTime(endSeconds)}
              </span>
              <button
                onClick={handleSkipForward}
                className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Adelantar 5s"
              >
                <SkipForward size={14} />
              </button>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max={maxDuration}
            value={endSeconds}
            onChange={handleEndChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>

      {/* Info y acciones */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Duración: <span className="font-semibold text-gray-900">{secondsToTime(duration)}</span>
        </div>
        <button
          onClick={handleReset}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 px-3 py-1 rounded transition-colors"
        >
          Restablecer
        </button>
      </div>

      {/* Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          💡 <strong>Tip:</strong> Arrastra los sliders para ajustar el inicio y fin, o usa los botones de 5s para ajustes finos
        </p>
      </div>
    </div>
  );
};

SongTimingSlider.propTypes = {
  startTime: PropTypes.string,
  endTime: PropTypes.string,
  maxDuration: PropTypes.number,
  onChange: PropTypes.func,
};

export default SongTimingSlider;
