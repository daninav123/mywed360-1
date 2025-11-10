/**
 * DragGhostPreview - Preview visual mejorado para drag & drop
 * FASE 2: Mejora de drag & drop
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, AlertCircle, CheckCircle } from 'lucide-react';

export default function DragGhostPreview({
  isDragging,
  draggedItem,
  targetTable,
  position = { x: 0, y: 0 },
  canDrop = true,
}) {
  if (!isDragging || !draggedItem) return null;

  const isGuest = draggedItem.type === 'guest';
  const isTable = draggedItem.type === 'table';

  return (
    <AnimatePresence>
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
      >
        {/* Ghost card */}
        <div
          className={`
            bg-white rounded-lg shadow-2xl border-2 p-4 min-w-[200px]
            ${canDrop ? 'border-green-400' : 'border-red-400'}
          `}
        >
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div
              className={`
                p-2 rounded-lg
                ${canDrop ? 'bg-green-100' : 'bg-red-100'}
              `}
            >
              {canDrop ? (
                <CheckCircle className={`w-5 h-5 text-green-600`} />
              ) : (
                <AlertCircle className={`w-5 h-5 text-red-600`} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              {isGuest && (
                <>
                  <div className="font-semibold text-gray-900 text-sm">
                    {draggedItem.name || 'Invitado'}
                  </div>
                  {targetTable && (
                    <div className="text-xs text-gray-600 mt-1">
                      → {targetTable.name || `Mesa ${targetTable.id}`}
                    </div>
                  )}
                </>
              )}
              {isTable && (
                <>
                  <div className="font-semibold text-gray-900 text-sm">
                    {draggedItem.name || `Mesa ${draggedItem.id}`}
                  </div>
                  <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {draggedItem.seats || 0} asientos
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Capacity indicator for guests */}
          {isGuest && targetTable && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Capacidad</span>
                <span className={`font-semibold ${canDrop ? 'text-green-600' : 'text-red-600'}`}>
                  {targetTable.assigned || 0} / {targetTable.seats || 0}
                </span>
              </div>
              {!canDrop && <div className="mt-2 text-xs text-red-600">⚠️ Mesa llena</div>}
            </div>
          )}
        </div>

        {/* Animated circle indicator */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className={`
            absolute -top-2 -right-2 w-6 h-6 rounded-full
            ${canDrop ? 'bg-green-500' : 'bg-red-500'}
          `}
        />
      </motion.div>
    </AnimatePresence>
  );
}

// Hook para gestionar el drag ghost
export function useDragGhost() {
  const [dragState, setDragState] = React.useState({
    isDragging: false,
    draggedItem: null,
    targetTable: null,
    position: { x: 0, y: 0 },
    canDrop: true,
  });

  const startDrag = (item, initialPosition) => {
    setDragState({
      isDragging: true,
      draggedItem: item,
      targetTable: null,
      position: initialPosition,
      canDrop: true,
    });
  };

  const updateDrag = (position, targetTable = null, canDrop = true) => {
    setDragState((prev) => ({
      ...prev,
      position,
      targetTable,
      canDrop,
    }));
  };

  const endDrag = () => {
    setDragState({
      isDragging: false,
      draggedItem: null,
      targetTable: null,
      position: { x: 0, y: 0 },
      canDrop: true,
    });
  };

  return {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
  };
}
