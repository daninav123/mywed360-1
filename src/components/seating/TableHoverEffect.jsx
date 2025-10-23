/**
 * TableHoverEffect - Efecto hover en mesas al arrastrar invitado
 * FASE 2.1: Drag & Drop Mejorado
 */
import React from 'react';
import { motion } from 'framer-motion';

export default function TableHoverEffect({ 
  table, 
  canDrop, 
  isOver, 
  reason,
  scale = 1,
  offset = { x: 0, y: 0 }
}) {
  if (!isOver && !canDrop) return null;

  const size = table.shape === 'circle' 
    ? table.diameter || 120 
    : Math.max(table.width || 120, table.height || 80);

  const x = (table.x || 0) * scale + offset.x;
  const y = (table.y || 0) * scale + offset.y;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size * scale,
        height: size * scale,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {/* Anillo exterior */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute inset-0 rounded-full ${
          canDrop
            ? 'border-4 border-green-500 bg-green-500/10'
            : 'border-4 border-red-500 bg-red-500/10'
        }`}
      />

      {/* Anillo interior */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2,
        }}
        className={`absolute inset-2 rounded-full ${
          canDrop
            ? 'border-2 border-green-400 bg-green-400/20'
            : 'border-2 border-red-400 bg-red-400/20'
        }`}
      />

      {/* Texto de estado */}
      {isOver && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 
                     bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium
                     whitespace-nowrap shadow-xl"
        >
          {canDrop ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Suelta aquí
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {reason || 'Mesa llena'}
            </span>
          )}
          
          {/* Flecha apuntando a la mesa */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-[-1px]
                          w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent 
                          border-b-4 border-b-gray-900" />
        </motion.div>
      )}
    </motion.div>
  );
}
