/**
 * FABRadial Component
 * Botón de acción flotante con menú radial para móvil
 * Sprint 2 - Completar Seating Plan
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Save,
  Download,
  Users,
  Grid,
  Settings,
  Undo,
  Redo,
  Eye,
  EyeOff
} from 'lucide-react';

const BUTTON_ACTIONS = [
  { id: 'add-table', icon: Grid, label: 'Añadir Mesa', angle: 0, color: 'bg-blue-500' },
  { id: 'add-guest', icon: Users, label: 'Añadir Invitado', angle: 45, color: 'bg-green-500' },
  { id: 'save', icon: Save, label: 'Guardar', angle: 90, color: 'bg-purple-500' },
  { id: 'export', icon: Download, label: 'Exportar', angle: 135, color: 'bg-orange-500' },
  { id: 'undo', icon: Undo, label: 'Deshacer', angle: 180, color: 'bg-gray-500' },
  { id: 'redo', icon: Redo, label: 'Rehacer', angle: 225, color: 'bg-gray-500' },
  { id: 'toggle-view', icon: Eye, label: 'Vista', angle: 270, color: 'bg-indigo-500' },
  { id: 'settings', icon: Settings, label: 'Ajustes', angle: 315, color: 'bg-pink-500' }
];

const RADIUS = 80; // Radio del círculo radial en px

/**
 * Calcula la posición x,y de un botón en el círculo radial
 */
function calculatePosition(angle, radius) {
  const rad = (angle - 90) * (Math.PI / 180); // -90 para empezar arriba
  return {
    x: Math.cos(rad) * radius,
    y: Math.sin(rad) * radius
  };
}

/**
 * Componente FABRadial
 * @param {Object} props
 * @param {Function} props.onAction - Callback cuando se pulsa una acción (actionId)
 * @param {Array} props.actions - Array de acciones personalizadas (opcional)
 * @param {string} props.position - Posición del FAB: 'bottom-right' | 'bottom-left' (default: 'bottom-right')
 * @param {boolean} props.disabled - Si está deshabilitado
 */
export function FABRadial({ 
  onAction, 
  actions = BUTTON_ACTIONS,
  position = 'bottom-right',
  disabled = false 
}) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const handleAction = (actionId) => {
    setIsOpen(false);
    if (onAction) {
      onAction(actionId);
    }
  };

  const toggleMenu = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Overlay para cerrar el menú al tocar fuera */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 -z-10"
            onClick={() => setIsOpen(false)}
            style={{ background: 'rgba(0, 0, 0, 0.3)' }}
          />
        )}
      </AnimatePresence>

      {/* Botones radiales */}
      <AnimatePresence>
        {isOpen && actions.map((action, index) => {
          const pos = calculatePosition(action.angle, RADIUS);
          const Icon = action.icon;

          return (
            <motion.button
              key={action.id}
              initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                x: pos.x, 
                y: pos.y, 
                opacity: 1,
                transition: { 
                  delay: index * 0.03,
                  type: 'spring',
                  stiffness: 260,
                  damping: 20
                }
              }}
              exit={{ 
                scale: 0, 
                x: 0, 
                y: 0, 
                opacity: 0,
                transition: { delay: (actions.length - index) * 0.02 }
              }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleAction(action.id)}
              className={`absolute w-12 h-12 rounded-full ${action.color} text-white 
                         shadow-lg flex items-center justify-center hover:shadow-xl
                         transform -translate-x-6 -translate-y-6 group`}
              style={{ touchAction: 'manipulation' }}
              aria-label={action.label}
            >
              <Icon className="w-5 h-5" />
              
              {/* Tooltip */}
              <span className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white 
                             text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 
                             transition-opacity pointer-events-none">
                {action.label}
              </span>
            </motion.button>
          );
        })}
      </AnimatePresence>

      {/* Botón principal */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggleMenu}
        disabled={disabled}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center
                   transition-all duration-300 ${
                     disabled 
                       ? 'bg-gray-400 cursor-not-allowed' 
                       : isOpen 
                         ? 'bg-red-500 hover:bg-red-600' 
                         : 'bg-blue-600 hover:bg-blue-700'
                   } text-white`}
        style={{ touchAction: 'manipulation' }}
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={isOpen}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <Plus className="w-8 h-8" />
        </motion.div>
      </motion.button>

      {/* Indicador de estado (opcional) */}
      {isOpen && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full 
                     border-2 border-white"
        />
      )}
    </div>
  );
}

/**
 * FABRadial compacto con menos opciones para espacios reducidos
 */
export function FABRadialCompact({ onAction, disabled = false }) {
  const compactActions = [
    { id: 'add-table', icon: Grid, label: 'Mesa', angle: 0, color: 'bg-blue-500' },
    { id: 'add-guest', icon: Users, label: 'Invitado', angle: 90, color: 'bg-green-500' },
    { id: 'save', icon: Save, label: 'Guardar', angle: 180, color: 'bg-purple-500' },
    { id: 'export', icon: Download, label: 'Exportar', angle: 270, color: 'bg-orange-500' }
  ];

  return (
    <FABRadial 
      actions={compactActions} 
      onAction={onAction} 
      disabled={disabled}
    />
  );
}

export default FABRadial;
