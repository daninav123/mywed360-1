/**
 * Indicador flotante del modo activo
 * Muestra el modo actual y hints de uso
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Move, Pentagon, DoorOpen, Box, Minus } from 'lucide-react';

const MODE_CONFIG = {
  pan: {
    icon: Hand,
    label: 'Modo Pan',
    description: 'Arrastra para mover el canvas',
    color: 'blue',
    hint: 'Mantén Space para pan temporal',
  },
  move: {
    icon: Move,
    label: 'Modo Mover',
    description: 'Click y arrastra para mover mesas',
    color: 'green',
    hint: 'Shift + Click para selección múltiple',
  },
  boundary: {
    icon: Pentagon,
    label: 'Modo Perímetro',
    description: 'Dibuja el límite del salón',
    color: 'purple',
    hint: 'Click para agregar puntos, doble-click para cerrar',
  },
  doors: {
    icon: DoorOpen,
    label: 'Modo Puertas',
    description: 'Marca las entradas/salidas',
    color: 'amber',
    hint: 'Click para agregar puertas al perímetro',
  },
  obstacles: {
    icon: Box,
    label: 'Modo Obstáculos',
    description: 'Define obstáculos (columnas, barras)',
    color: 'red',
    hint: 'Click y arrastra para dibujar rectángulos',
  },
  aisles: {
    icon: Minus,
    label: 'Modo Pasillos',
    description: 'Define corredores principales',
    color: 'indigo',
    hint: 'Click y arrastra para dibujar pasillos',
  },
};

const COLORS = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-500',
    text: 'text-green-700 dark:text-green-300',
    icon: 'text-green-600 dark:text-green-400',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-500',
    text: 'text-purple-700 dark:text-purple-300',
    icon: 'text-purple-600 dark:text-purple-400',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-500',
    text: 'text-red-700 dark:text-red-300',
    icon: 'text-red-600 dark:text-red-400',
  },
  indigo: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    border: 'border-indigo-500',
    text: 'text-indigo-700 dark:text-indigo-300',
    icon: 'text-indigo-600 dark:text-indigo-400',
  },
};

export default function ModeIndicator({ mode = 'pan', show = true }) {
  const config = MODE_CONFIG[mode] || MODE_CONFIG.pan;
  const colors = COLORS[config.color];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none"
        >
          <div
            className={`
              ${colors.bg} ${colors.border}
              border-2 rounded-lg shadow-lg px-4 py-3
              flex items-center gap-3 max-w-md
            `}
          >
            {/* Icon */}
            <div className={`${colors.icon} flex-shrink-0`}>
              <Icon className="w-5 h-5" strokeWidth={2} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className={`${colors.text} font-semibold text-sm`}>{config.label}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{config.description}</div>
              {config.hint && (
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 italic">
                  💡 {config.hint}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook para obtener el cursor CSS según el modo
 */
export function useModeCursor(mode) {
  const cursors = {
    pan: 'grab',
    move: 'move',
    boundary: 'crosshair',
    doors: 'pointer',
    obstacles: 'crosshair',
    aisles: 'crosshair',
  };

  return cursors[mode] || 'default';
}
