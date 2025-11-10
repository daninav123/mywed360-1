/**
 * CollabBadge Component
 * Indicadores de colaboración en tiempo real para Seating
 * Sprint 2 - Completar Seating Plan
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users, Edit3, Eye } from 'lucide-react';

/**
 * Badge de usuario activo
 * @param {Object} props
 * @param {Object} props.user - Usuario: { id, name, avatar, color }
 * @param {string} props.status - Estado: 'editing' | 'viewing'
 * @param {string} props.position - Posición: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
 * @param {boolean} props.showName - Mostrar nombre del usuario
 * @param {string} props.size - Tamaño: 'sm' | 'md' | 'lg'
 */
export function CollabBadge({ 
  user, 
  status = 'viewing',
  position = 'top-right',
  showName = true,
  size = 'md'
}) {
  if (!user) return null;

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const positionClasses = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0'
  };

  const statusConfig = {
    editing: {
      icon: Edit3,
      color: 'bg-green-500',
      pulse: true,
      label: 'Editando'
    },
    viewing: {
      icon: Eye,
      color: 'bg-blue-500',
      pulse: false,
      label: 'Viendo'
    }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const userColor = user.color || config.color;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className={`absolute ${positionClasses[position]} z-10`}
    >
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full 
                      shadow-lg border-2 border-white dark:border-gray-700 p-1">
        {/* Avatar */}
        <div className={`relative ${sizeClasses[size]} rounded-full ${userColor} 
                        flex items-center justify-center text-white font-semibold`}>
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span>{user.name?.charAt(0).toUpperCase() || 'U'}</span>
          )}
          
          {/* Pulse animation para editing */}
          {config.pulse && (
            <span className="absolute inset-0 rounded-full animate-ping opacity-75"
                  style={{ backgroundColor: userColor }} />
          )}

          {/* Status icon */}
          <div className={`absolute -bottom-1 -right-1 ${sizeClasses.sm} 
                          ${config.color} rounded-full flex items-center justify-center 
                          border-2 border-white dark:border-gray-800`}>
            <StatusIcon className="w-3 h-3 text-white" />
          </div>
        </div>

        {/* Name (opcional) */}
        {showName && (
          <span className="pr-2 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {user.name}
          </span>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Lista de usuarios colaborando
 * @param {Object} props
 * @param {Array} props.users - Array de usuarios activos
 * @param {number} props.maxVisible - Máximo de usuarios visibles
 * @param {Function} props.onUserClick - Callback al hacer click en un usuario
 */
export function CollabUserList({ users = [], maxVisible = 5, onUserClick }) {
  const visibleUsers = users.slice(0, maxVisible);
  const extraCount = users.length - maxVisible;

  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        <AnimatePresence>
          {visibleUsers.map((user, index) => (
            <motion.button
              key={user.id}
              initial={{ scale: 0, x: -20 }}
              animate={{ scale: 1, x: 0 }}
              exit={{ scale: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onUserClick?.(user)}
              className="relative w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 
                       hover:scale-110 transition-transform cursor-pointer"
              style={{ backgroundColor: user.color || '#3B82F6' }}
              title={user.name}
            >
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-xs font-semibold">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}

              {/* Indicator de status */}
              {user.status === 'editing' && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 
                               rounded-full border-2 border-white dark:border-gray-800" />
              )}
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Contador de usuarios extra */}
        {extraCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="relative w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 
                     border-2 border-white dark:border-gray-800 flex items-center 
                     justify-center text-xs font-semibold text-gray-700 dark:text-gray-200"
          >
            +{extraCount}
          </motion.div>
        )}
      </div>

      <span className="text-sm text-gray-600 dark:text-gray-400">
        {users.length} {users.length === 1 ? 'usuario' : 'usuarios'} activo{users.length === 1 ? '' : 's'}
      </span>
    </div>
  );
}

/**
 * Indicador de presencia flotante
 * Muestra quién está editando un elemento específico
 */
export function PresenceIndicator({ users = [], targetName = 'este elemento' }) {
  if (users.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-20"
      >
        <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full 
                      shadow-lg flex items-center gap-2 whitespace-nowrap">
          <div className="flex -space-x-1">
            {users.slice(0, 3).map((user) => (
              <div
                key={user.id}
                className="w-4 h-4 rounded-full border border-gray-900"
                style={{ backgroundColor: user.color || '#3B82F6' }}
                title={user.name}
              />
            ))}
          </div>
          <span>
            {users.length === 1 
              ? `${users[0].name} está editando ${targetName}`
              : `${users.length} personas están editando ${targetName}`
            }
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Badge de conflicto de edición
 * Muestra cuando hay un conflicto potencial
 */
export function ConflictBadge({ message, severity = 'warning' }) {
  const severityConfig = {
    info: {
      bg: 'bg-blue-100 dark:bg-blue-900',
      text: 'text-blue-800 dark:text-blue-200',
      border: 'border-blue-300 dark:border-blue-700'
    },
    warning: {
      bg: 'bg-yellow-100 dark:bg-yellow-900',
      text: 'text-yellow-800 dark:text-yellow-200',
      border: 'border-yellow-300 dark:border-yellow-700'
    },
    error: {
      bg: 'bg-red-100 dark:bg-red-900',
      text: 'text-red-800 dark:text-red-200',
      border: 'border-red-300 dark:border-red-700'
    }
  };

  const config = severityConfig[severity];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`${config.bg} ${config.text} ${config.border} border-2 
                 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium`}
    >
      <span className="text-lg">⚠️</span>
      <span>{message}</span>
    </motion.div>
  );
}

/**
 * Panel de presencia completo
 * Muestra todos los usuarios activos con detalles
 */
export function PresencePanel({ users = [], onClose }) {
  const editingUsers = users.filter(u => u.status === 'editing');
  const viewingUsers = users.filter(u => u.status === 'viewing');

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-72"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Usuarios Activos ({users.length})
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        )}
      </div>

      {/* Usuarios editando */}
      {editingUsers.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Editando
          </h4>
          <div className="space-y-2">
            {editingUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 
                         dark:hover:bg-gray-700"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: user.color || '#3B82F6' }}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
                  ) : (
                    user.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.currentElement || 'Editando...'}
                  </p>
                </div>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usuarios viendo */}
      {viewingUsers.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Viendo
          </h4>
          <div className="space-y-2">
            {viewingUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 
                         dark:hover:bg-gray-700"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: user.color || '#3B82F6' }}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
                  ) : (
                    user.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.name}
                  </p>
                </div>
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {users.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No hay usuarios activos
        </p>
      )}
    </motion.div>
  );
}

export default CollabBadge;
