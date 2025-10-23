/**
 * CollaboratorCursors - Cursores de otros usuarios en tiempo real
 * FASE 5.1: Colaboración Real-time
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointer2 } from 'lucide-react';

export default function CollaboratorCursors({ collaborators = [], scale = 1, offset = { x: 0, y: 0 } }) {
  const [activeCursors, setActiveCursors] = useState([]);

  useEffect(() => {
    // Filtrar colaboradores activos (con cursor position)
    const active = collaborators.filter(collab => 
      collab && 
      !collab.isCurrent && 
      collab.cursorX != null && 
      collab.cursorY != null &&
      Date.now() - (collab.lastActive || 0) < 30000 // Activos en últimos 30s
    );
    setActiveCursors(active);
  }, [collaborators]);

  return (
    <AnimatePresence>
      {activeCursors.map((collab) => {
        const x = (collab.cursorX || 0) * scale + offset.x;
        const y = (collab.cursorY || 0) * scale + offset.y;
        const color = collab.color || '#3B82F6';
        const name = collab.name || 'Usuario';

        return (
          <motion.div
            key={collab.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            {/* Cursor icon */}
            <motion.div
              animate={{
                rotate: [0, -5, 0],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 2,
              }}
              style={{ color }}
            >
              <MousePointer2 className="w-5 h-5 drop-shadow-lg" fill="currentColor" />
            </motion.div>

            {/* Label con nombre */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="absolute top-6 left-2 whitespace-nowrap"
              style={{ backgroundColor: color }}
            >
              <div className="px-2 py-1 rounded-md text-xs font-medium text-white shadow-lg">
                {name}
              </div>
              {/* Flecha apuntando al cursor */}
              <div 
                className="absolute -top-1 left-2 w-2 h-2 rotate-45"
                style={{ backgroundColor: color }}
              />
            </motion.div>

            {/* Ripple effect cuando aparece */}
            <motion.div
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: color }}
            />
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
