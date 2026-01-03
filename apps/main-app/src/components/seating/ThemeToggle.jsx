/**
 * ThemeToggle - Botón para cambiar entre modo claro/oscuro
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ isDark, onToggle, className = '' }) {
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative w-14 h-7 rounded-full
        transition-colors duration-300
        ${isDark 
          ? 'bg-indigo-600' 
          : 'bg-amber-400'
        }
        ${className}
      `}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
    >
      {/* Slider */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`
          absolute top-0.5 w-6 h-6 rounded-full bg-white
          shadow-lg flex items-center justify-center
          ${isDark ? 'left-0.5' : 'left-7'}
        `}
      >
        {isDark ? (
          <Moon size={14} className="text-indigo-600" />
        ) : (
          <Sun size={14} className="text-amber-500" />
        )}
      </motion.div>
    </motion.button>
  );
}
