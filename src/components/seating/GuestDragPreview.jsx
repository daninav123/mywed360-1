/**
 * GuestDragPreview - Preview visual mientras arrastra invitado
 * FASE 2.1: Drag & Drop Mejorado
 */
import React from 'react';
import { motion } from 'framer-motion';
import { User, Users } from 'lucide-react';

export default function GuestDragPreview({ guest, isDragging, position }) {
  if (!isDragging || !position) return null;

  const companionCount = parseInt(guest?.companion, 10) || 0;
  const totalPeople = 1 + companionCount;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        pointerEvents: 'none',
        zIndex: 10000,
        transform: 'translate(-50%, -50%)',
      }}
      className="select-none"
    >
      {/* Card del invitado flotante */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl shadow-indigo-500/50 
                      border-2 border-indigo-500 px-4 py-3 min-w-[200px]">
        <div className="flex items-center gap-3">
          {/* Icono */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 
                          flex items-center justify-center">
            {companionCount > 0 ? (
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {guest?.name || 'Invitado'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {totalPeople === 1 ? '1 persona' : `${totalPeople} personas`}
            </p>
          </div>
        </div>

        {/* Indicador de arrastre */}
        <div className="mt-2 flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-2 h-2 rounded-full bg-indigo-500"
          />
          <span>Arrastra a una mesa</span>
        </div>
      </div>

      {/* Flecha apuntando hacia abajo */}
      <motion.div
        animate={{ y: [0, 5, 0] }}
        transition={{ repeat: Infinity, duration: 1 }}
        className="flex justify-center mt-2"
      >
        <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent 
                        border-t-8 border-t-indigo-500" />
      </motion.div>
    </motion.div>
  );
}
