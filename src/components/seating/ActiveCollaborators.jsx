/**
 * ActiveCollaborators - Panel de colaboradores activos
 * FASE 5.1: Colaboración Real-time
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Circle, Lock } from 'lucide-react';

export default function ActiveCollaborators({ 
  collaborators = [], 
  locks = [],
  className = '' 
}) {
  const activeCount = collaborators.filter(c => !c.isCurrent).length;

  if (activeCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          Colaboradores Activos ({activeCount})
        </span>
      </div>

      {/* Lista de colaboradores */}
      <div className="space-y-2">
        <AnimatePresence>
          {collaborators
            .filter(c => !c.isCurrent)
            .map((collab) => {
              const color = collab.color || '#3B82F6';
              const isActive = Date.now() - (collab.lastActive || 0) < 30000;
              const userLocks = locks.filter(lock => lock.userId === collab.id);

              return (
                <motion.div
                  key={collab.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {/* Avatar con color */}
                  <div 
                    className="relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: color }}
                  >
                    {(collab.name || 'U')[0].toUpperCase()}
                    
                    {/* Indicador de activo */}
                    <motion.div
                      animate={isActive ? {
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.7, 1],
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900"
                      style={{ 
                        backgroundColor: isActive ? '#10B981' : '#6B7280' 
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {collab.name || 'Usuario'}
                    </p>
                    {userLocks.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Editando {userLocks.length} {userLocks.length === 1 ? 'elemento' : 'elementos'}
                      </p>
                    )}
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center gap-1">
                    <Circle 
                      className={`w-2 h-2 ${isActive ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'}`}
                    />
                  </div>
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>

      {/* Connection status */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-green-500"
          />
          <span>Sincronizado en tiempo real</span>
        </div>
      </div>
    </motion.div>
  );
}
