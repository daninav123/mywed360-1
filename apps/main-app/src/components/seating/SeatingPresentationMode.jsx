import React, { useState, useEffect } from 'react';
import { X, Maximize2, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useTranslations from '../../hooks/useTranslations';

/**
 * Modo Presentación Fullscreen para Seating Plan
 * Autoplay entre mesas, controles navegación
 */
const SeatingPresentationMode = ({
  isOpen,
  onClose,
  tables = [],
  guests = [],
  autoPlayInterval = 5000, // 5 segundos por mesa
}) => {
  const { t } = useTranslations();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const currentTable = tables[currentIndex];

  // Auto-advance
  useEffect(() => {
    if (!isPlaying || tables.length === 0) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + (100 / (autoPlayInterval / 100));
      });
    }, 100);

    const advanceTimer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % tables.length);
      setProgress(0);
    }, autoPlayInterval);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(advanceTimer);
    };
  }, [isPlaying, currentIndex, tables.length, autoPlayInterval]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + tables.length) % tables.length);
    setProgress(0);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % tables.length);
    setProgress(0);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (isPlaying) {
      setProgress(0);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
      if (e.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  if (!isOpen || tables.length === 0) return null;

  const tableGuests = guests.filter((g) => g.tableId === currentTable?.id);
  const occupancy = (tableGuests.length / (currentTable?.capacity || 1)) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-[100] flex flex-col"
      >
        {/* Header */}
        <div className="bg-black/50 backdrop-blur-sm p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-4">
            <Maximize2 className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-white font-semibold text-lg">
                {t('seatingPresentation.title', { defaultValue: 'Modo Presentación' })}
              </h2>
              <p className="text-white/60 text-sm">
                {currentIndex + 1} / {tables.length} mesas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label={t('common.close', { defaultValue: 'Cerrar' })}
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTable?.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="max-w-5xl w-full"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                {/* Table Name */}
                <h1 className="text-6xl font-bold text-white text-center mb-8">
                  {currentTable?.name}
                </h1>

                {/* Occupancy Bar */}
                <div className="mb-8">
                  <div className="flex items-center justify-between text-white/80 mb-2">
                    <span className="text-sm">
                      {t('seatingPresentation.occupancy', { defaultValue: 'Ocupación' })}
                    </span>
                    <span className="text-sm font-medium">
                      {tableGuests.length} / {currentTable?.capacity || 0}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(occupancy, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        occupancy >= 100
                          ? 'bg-red-500'
                          : occupancy >= 80
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Guests List */}
                {tableGuests.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {tableGuests.map((guest, index) => (
                      <motion.div
                        key={guest.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4"
                      >
                        <p className="text-white font-medium">{guest.name}</p>
                        {guest.dietary && (
                          <p className="text-white/60 text-sm mt-1">🍽️ {guest.dietary}</p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-white/60 text-xl">
                      {t('seatingPresentation.noGuests', { defaultValue: 'Mesa vacía' })}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls Footer */}
        <div className="bg-black/50 backdrop-blur-sm p-4 border-t border-white/10">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePrevious}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              aria-label={t('seatingPresentation.previous', { defaultValue: 'Anterior' })}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            <button
              onClick={togglePlayPause}
              className="p-4 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
              aria-label={
                isPlaying
                  ? t('seatingPresentation.pause', { defaultValue: 'Pausar' })
                  : t('seatingPresentation.play', { defaultValue: 'Reproducir' })
              }
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white" />
              )}
            </button>

            <button
              onClick={handleNext}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              aria-label={t('seatingPresentation.next', { defaultValue: 'Siguiente' })}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Keyboard Hints */}
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-white/40">
            <span>← → {t('seatingPresentation.navigate', { defaultValue: 'Navegar' })}</span>
            <span>Espacio {t('seatingPresentation.playPause', { defaultValue: 'Play/Pause' })}</span>
            <span>Esc {t('seatingPresentation.exit', { defaultValue: 'Salir' })}</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SeatingPresentationMode;
