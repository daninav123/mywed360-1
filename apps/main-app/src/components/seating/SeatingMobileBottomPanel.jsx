import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import useTranslations from '../../hooks/useTranslations';

/**
 * Panel Inferior Móvil (Bottom Sheet) para Seating Plan
 * Soporta 3 estados: minimizado, medio, maximizado
 * Con gestos de arrastre
 */
const SeatingMobileBottomPanel = ({
  isOpen = false,
  onClose,
  title,
  children,
  defaultHeight = 'medium', // 'min', 'medium', 'max'
  showHandle = true,
  showCloseButton = true,
  className = '',
}) => {
  const [height, setHeight] = useState(defaultHeight);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef(null);
  const { t } = useTranslations();

  // Configuración de alturas (en % de la pantalla)
  const heights = {
    min: '30vh',
    medium: '50vh',
    max: '85vh',
  };

  // Volver a altura por defecto cuando se abre
  useEffect(() => {
    if (isOpen) {
      setHeight(defaultHeight);
    }
  }, [isOpen, defaultHeight]);

  // Handler para arrastre
  const handleDragEnd = (event, info) => {
    setIsDragging(false);

    // Si arrastra hacia abajo más de 100px, cerrar
    if (info.offset.y > 100) {
      onClose?.();
      return;
    }

    // Si arrastra hacia arriba, expandir
    if (info.offset.y < -50) {
      if (height === 'min') setHeight('medium');
      else if (height === 'medium') setHeight('max');
    }
    // Si arrastra hacia abajo, contraer
    else if (info.offset.y > 50) {
      if (height === 'max') setHeight('medium');
      else if (height === 'medium') setHeight('min');
    }
  };

  const toggleHeight = () => {
    if (height === 'min') setHeight('medium');
    else if (height === 'medium') setHeight('max');
    else setHeight('min');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%' }}
            animate={{
              y: 0,
              height: heights[height],
            }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            className={`
              fixed bottom-0 left-0 right-0 z-50
              bg-white rounded-t-3xl shadow-2xl
              flex flex-col overflow-hidden
              ${className}
            `}
          >
            {/* Handle para arrastrar */}
            {showHandle && (
              <div className="w-full py-3 flex justify-center cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>
            )}

            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900 flex-1 truncate">{title}</h2>

              <div className="flex items-center gap-2">
                {/* Botón expandir/contraer */}
                <button
                  onClick={toggleHeight}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label={
                    height === 'max'
                      ? t('seatingMobile.bottomPanel.minimize', { defaultValue: 'Minimizar' })
                      : t('seatingMobile.bottomPanel.maximize', { defaultValue: 'Maximizar' })
                  }
                >
                  {height === 'max' ? (
                    <Minimize2 className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Maximize2 className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                {/* Botón cerrar */}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label={t('seatingMobile.bottomPanel.close', { defaultValue: 'Cerrar' })}
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SeatingMobileBottomPanel;
