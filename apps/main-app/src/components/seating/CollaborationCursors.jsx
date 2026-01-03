/**
 * CollaborationCursors - Cursores de usuarios en tiempo real
 * FASE 5: Advanced Features - Colaboración
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointer2 } from 'lucide-react';

const CURSOR_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#6366f1', // indigo
];

function UserCursor({ user, position, isIdle = false }) {
  const [localPosition, setLocalPosition] = useState(position);
  const [showLabel, setShowLabel] = useState(true);

  useEffect(() => {
    setLocalPosition(position);
  }, [position]);

  useEffect(() => {
    const timer = setTimeout(() => setShowLabel(false), 3000);
    return () => clearTimeout(timer);
  }, [position]);

  const handleMouseMove = () => {
    setShowLabel(true);
  };

  return (
    <motion.div
      animate={{
        x: localPosition.x,
        y: localPosition.y,
        opacity: isIdle ? 0.3 : 1,
      }}
      transition={{ type: 'spring', damping: 30, stiffness: 200 }}
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Cursor icon */}
      <motion.div
        animate={{ rotate: isIdle ? 0 : [0, -10, 0] }}
        transition={{ repeat: isIdle ? 0 : Infinity, duration: 2 }}
      >
        <MousePointer2
          style={{ color: user.color }}
          className="w-6 h-6 drop-shadow-lg"
          fill={user.color}
        />
      </motion.div>

      {/* User label */}
      <AnimatePresence>
        {showLabel && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            style={{ backgroundColor: user.color }}
            className="ml-6 -mt-2 px-3 py-1 rounded-full text-white text-xs font-medium 
                       whitespace-nowrap shadow-lg"
          >
            {user.displayName || user.email || 'Usuario'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ripple effect on click */}
      {!isIdle && (
        <motion.div
          animate={{
            scale: [1, 2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ backgroundColor: user.color }}
          className="absolute w-3 h-3 rounded-full -ml-1.5 -mt-1.5"
        />
      )}
    </motion.div>
  );
}

export default function CollaborationCursors({
  users = [],
  currentUserId,
  canvasRef,
  scale = 1,
  offset = { x: 0, y: 0 },
}) {
  const [userCursors, setUserCursors] = useState(new Map());

  useEffect(() => {
    // Filtrar usuario actual
    const otherUsers = users.filter((u) => u.userId !== currentUserId);

    // Asignar colores consistentes
    const cursors = new Map();
    otherUsers.forEach((user, index) => {
      const color = CURSOR_COLORS[index % CURSOR_COLORS.length];

      // Transformar posición del canvas al viewport
      const viewportPosition = {
        x: (user.position?.x || 0) * scale + offset.x,
        y: (user.position?.y || 0) * scale + offset.y,
      };

      cursors.set(user.userId, {
        ...user,
        color,
        position: viewportPosition,
        isIdle: Date.now() - (user.lastActivity || 0) > 30000, // 30s idle
      });
    });

    setUserCursors(cursors);
  }, [users, currentUserId, scale, offset]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9999 }}>
      <AnimatePresence>
        {Array.from(userCursors.values()).map((user) => (
          <UserCursor key={user.userId} user={user} position={user.position} isIdle={user.isIdle} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook para gestionar posición del cursor local
export function useCollaborativeCursor(canvasRef, onPositionUpdate) {
  const [localPosition, setLocalPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!canvasRef?.current) return;

    const handleMouseMove = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setLocalPosition({ x, y });

      // Throttle updates to backend
      if (onPositionUpdate) {
        onPositionUpdate({ x, y });
      }
    };

    const canvas = canvasRef.current;
    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [canvasRef, onPositionUpdate]);

  return localPosition;
}
