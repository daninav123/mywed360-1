import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Maximize2, Settings } from 'lucide-react';

const resolveImage = (photo) =>
  photo?.urls?.optimized || photo?.urls?.original || photo?.urls?.thumb || '';

export default function LiveSlideshow({
  photos = [],
  autoAdvanceSeconds = 6,
  highlightMode = false,
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [speed, setSpeed] = useState(autoAdvanceSeconds);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const sorted = useMemo(() => {
    if (!highlightMode) return photos;
    return [...photos].sort((a, b) => (b?.highlight?.score || 0) - (a?.highlight?.score || 0));
  }, [highlightMode, photos]);

  const [index, setIndex] = useState(0);

  const goToNext = useCallback(() => {
    setIndex((prev) => (prev + 1) % sorted.length);
  }, [sorted.length]);

  const goToPrevious = useCallback(() => {
    setIndex((prev) => (prev - 1 + sorted.length) % sorted.length);
  }, [sorted.length]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.getElementById('slideshow-container')?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    if (!sorted.length || !isPlaying) return undefined;
    const timeout = setInterval(() => {
      goToNext();
    }, speed * 1000);
    return () => clearInterval(timeout);
  }, [speed, sorted.length, isPlaying, goToNext]);

  useEffect(() => {
    const handleKeyboard = (e) => {
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      if (e.key === 'f') toggleFullscreen();
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [goToNext, goToPrevious, togglePlay, toggleFullscreen]);

  useEffect(() => {
    let timeout;
    if (showControls) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [showControls, index]);

  useEffect(() => {
    setIndex(0);
  }, [sorted.length]);

  if (!sorted.length) {
    return (
      <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-sm text-gray-500">
        Aún no hay fotos  para mostrar en el slideshow.
      </div>
    );
  }

  const current = sorted[index] || null;

  return (
    <div 
      id="slideshow-container"
      className="rounded-xl overflow-hidden border border-gray-200 shadow relative bg-black group"
      onMouseEnter={() => setShowControls(true)}
      onMouseMove={() => setShowControls(true)}
    >
      {current ? (
        <>
          <img
            src={resolveImage(current)}
            alt={current.scene || 'Slide'}
            className="w-full max-h-[480px] object-contain bg-black transition-opacity duration-500"
            style={{ animation: 'fadeIn 0.5s ease-in' }}
          />

          {/* Controles principales - centro */}
          <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="flex items-center gap-4 pointer-events-auto">
              <button
                onClick={goToPrevious}
                className="p-3 rounded-full bg-black/70 text-white hover:bg-black/90 transition-all hover:scale-110"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={togglePlay}
                className="p-4 rounded-full bg-black/70 text-white hover:bg-black/90 transition-all hover:scale-110"
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </button>
              <button
                onClick={goToNext}
                className="p-3 rounded-full bg-black/70 text-white hover:bg-black/90 transition-all hover:scale-110"
                aria-label="Siguiente"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
            <div 
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${((index + 1) / sorted.length) * 100}%` }}
            />
          </div>

          {/* Controles superiores */}
          <div className={`absolute top-3 right-3 flex items-center gap-2 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
              {highlightMode ? '⭐ Highlights' : '🎬 Todas'}
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition"
              aria-label="Configuración"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition"
              aria-label="Pantalla completa"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Panel de configuración */}
          {showSettings && (
            <div className="absolute top-14 right-3 bg-white rounded-lg shadow-lg p-4 space-y-3 min-w-[200px] z-10">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Velocidad: {speed}s
                </label>
                <input
                  type="range"
                  min="2"
                  max="15"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Rápido</span>
                  <span>Lento</span>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="w-full text-sm text-gray-600 hover:text-gray-800 py-1"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Información de la foto */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-6 pt-12">
            <div className="flex items-end justify-between">
              <div className="space-y-2 flex-1">
                <p className="uppercase tracking-wide text-xs text-white/70 font-medium">
                  {current.scene || 'Recuerdos'}
                </p>
                {current.guestName && (
                  <p className="font-medium text-base">Cortesía de {current.guestName}</p>
                )}
                {highlightMode && current.highlight?.reasons?.length ? (
                  <p className="text-xs text-white/70 mt-1">
                    ⭐ {current.highlight.reasons.join(' · ')}
                  </p>
                ) : null}
              </div>
              <div className="text-sm text-white/80 font-medium bg-black/40 px-3 py-1.5 rounded-full">
                {index + 1} / {sorted.length}
              </div>
            </div>
          </div>

          {/* Indicadores de navegación */}
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex gap-1.5">
            {sorted.slice(0, Math.min(10, sorted.length)).map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index 
                    ? 'w-8 bg-white' 
                    : 'w-1.5 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Ir a foto ${i + 1}`}
              />
            ))}
            {sorted.length > 10 && (
              <span className="text-white/60 text-xs ml-2">+{sorted.length - 10}</span>
            )}
          </div>
        </>
      ) : null}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
