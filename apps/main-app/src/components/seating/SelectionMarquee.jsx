/**
 * SelectionMarquee - Selección múltiple con efecto glassmorphism
 */
import React from 'react';
import { motion } from 'framer-motion';

export default function SelectionMarquee({ start, end, visible }) {
  if (!visible || !start || !end) return null;

  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        pointerEvents: 'none',
      }}
      className="bg-[var(--color-primary)] rounded-lg
                 bg-indigo-500/10 backdrop-blur-sm"
    >
      {/* Corners animados */}
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="absolute -top-1 -left-1 w-3 h-3 bg-indigo-500 rounded-full"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
        className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
        className="absolute -bottom-1 -left-1 w-3 h-3 bg-indigo-500 rounded-full"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }}
        className="absolute -bottom-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full"
      />
    </motion.div>
  );
}
