/**
 * ConflictToast Component
 * Sistema de notificaciones toast para conflictos de edición
 * Sprint 2 - Completar Seating Plan
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from '../../hooks/useTranslations';
import {
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  X,
  AlertCircle
} from 'lucide-react';

const ToastContext = createContext(null);

/**
 * Hook para usar el sistema de toasts
 */
export function useToast() {
  const { t } = useTranslations();

  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Provider del sistema de toasts
 */
export function ToastProvider({ children, maxToasts = 5 }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      ...toast,
      duration: toast.duration || 5000,
    };

    setToasts((prev) => {
      const updated = [newToast, ...prev];
      return updated.slice(0, maxToasts);
    });

    // Auto-remove
    if (toast.duration !== Infinity) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Helper methods for different types
  const success = useCallback((message, options = {}) => {
    return addToast({ type: 'success', message, ...options });
  }, [addToast]);

  const error = useCallback((message, options = {}) => {
    return addToast({ type: 'error', message, ...options });
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast({ type: 'warning', message, ...options });
  }, [addToast]);

  const info = useCallback((message, options = {}) => {
    return addToast({ type: 'info', message, ...options });
  }, [addToast]);

  const conflict = useCallback((message, options = {}) => {
    return addToast({ 
      type: 'conflict', 
      message,
      duration: Infinity, // Conflicts require manual dismissal
      ...options 
    });
  }, [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info,
    conflict,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Container de toasts
 */
function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={() => onRemove(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Toast individual
 */
function Toast({ toast, onClose }) {
  const { type, message, title, action, user } = toast;

  const config = {
    success: {
      icon: CheckCircle,
      bg: 'bg-green-50 dark:bg-green-900',
      border: 'border-green-200 dark:border-green-700',
      text: 'text-green-800 dark:text-green-200',
      iconColor: 'text-green-500 dark:text-green-400'
    },
    error: {
      icon: XCircle,
      bg: 'bg-red-50 dark:bg-red-900',
      border: 'border-red-200 dark:border-red-700',
      text: 'text-red-800 dark:text-red-200',
      iconColor: 'text-red-500 dark:text-red-400'
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-yellow-50 dark:bg-yellow-900',
      border: 'border-yellow-200 dark:border-yellow-700',
      text: 'text-yellow-800 dark:text-yellow-200',
      iconColor: 'text-yellow-500 dark:text-yellow-400'
    },
    info: {
      icon: Info,
      bg: 'bg-blue-50 dark:bg-blue-900',
      border: 'border-blue-200 dark:border-blue-700',
      text: 'text-blue-800 dark:text-blue-200',
      iconColor: 'text-blue-500 dark:text-blue-400'
    },
    conflict: {
      icon: AlertCircle,
      bg: 'bg-orange-50 dark:bg-orange-900',
      border: 'border-orange-200 dark:border-orange-700',
      text: 'text-orange-800 dark:text-orange-200',
      iconColor: 'text-orange-500 dark:text-orange-400'
    }
  };

  const style = config[type] || config.info;
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-auto"
    >
      <div className={`${style.bg} ${style.border} ${style.text} border-2 rounded-lg 
                      shadow-lg p-4 min-w-[320px] max-w-md`}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className="font-semibold text-sm mb-1">{title}</h4>
            )}
            <p className="text-sm">{message}</p>

            {/* User info for conflicts */}
            {user && (
              <div className="mt-2 flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                  style={{ backgroundColor: user.color || '#3B82F6' }}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
                  ) : (
                    user.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-xs font-medium">{user.name}</span>
              </div>
            )}

            {/* Action button */}
            {action && (
              <button
                onClick={() => {
                  action.onClick();
                  onClose();
                }}
                className="mt-3 text-sm font-medium underline hover:no-underline"
              >
                {action.label}
              </button>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className={`${style.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Helper component for conflict notifications
 */
export function ConflictNotification({ 
  user, 
  element, 
  onResolve, 
  onViewChanges,
  onClose 
}) {
  const { conflict } = useToast();

  const showConflict = useCallback(() => {
    conflict(
      `${user.name} también está editando ${element}`,
      {
        title: t('common.conflicto_edicion_detectado'),
        user,
        action: onViewChanges ? {
          label: 'Ver cambios',
          onClick: onViewChanges
        } : null
      }
    );
  }, [user, element, conflict, onViewChanges]);

  return { showConflict };
}

/**
 * Toast preconfigurado para conflictos de seating
 */
export const SeatingConflictToasts = {
  tableConflict: (username, tableName) => ({
    type: 'conflict',
    title: 'Conflicto de mesa',
    message: `${username} está editando la mesa ${tableName}`,
    duration: Infinity,
    action: {
      label: 'Ver mesa',
      onClick: () => {
        // Navigate to table
        console.log('Navigate to table:', tableName);
      }
    }
  }),

  guestConflict: (username, guestName) => ({
    type: 'conflict',
    title: 'Conflicto de invitado',
    message: `${username} está moviendo a ${guestName}`,
    duration: Infinity,
    action: {
      label: 'Ver invitado',
      onClick: () => {
        console.log('Navigate to guest:', guestName);
      }
    }
  }),

  layoutConflict: (username) => ({
    type: 'conflict',
    title: t('common.cambios_simultaneos'),
    message: `${username} ha modificado el layout`,
    duration: 7000,
    action: {
      label: 'Recargar',
      onClick: () => window.location.reload()
    }
  }),

  saved: () => ({
    type: 'success',
    message: 'Cambios guardados correctamente',
    duration: 3000
  }),

  syncError: () => ({
    type: 'error',
    title: t('common.error_sincronizacion'),
    message: 'No se pudieron sincronizar los cambios. Intentando reconectar...',
    duration: 5000
  }),

  userJoined: (username) => ({
    type: 'info',
    message: `${username} se ha unido a la edición`,
    duration: 3000
  }),

  userLeft: (username) => ({
    type: 'info',
    message: `${username} ha salido`,
    duration: 3000
  })
};

/**
 * Hook para manejar conflictos de seating
 */
export function useSeatingConflicts() {
  const toast = useToast();

  const notifyTableConflict = useCallback((user, tableName) => {
    return toast.addToast(SeatingConflictToasts.tableConflict(user.name, tableName));
  }, [toast]);

  const notifyGuestConflict = useCallback((user, guestName) => {
    return toast.addToast(SeatingConflictToasts.guestConflict(user.name, guestName));
  }, [toast]);

  const notifyLayoutConflict = useCallback((user) => {
    return toast.addToast(SeatingConflictToasts.layoutConflict(user.name));
  }, [toast]);

  const notifySaved = useCallback(() => {
    return toast.addToast(SeatingConflictToasts.saved());
  }, [toast]);

  const notifySyncError = useCallback(() => {
    return toast.addToast(SeatingConflictToasts.syncError());
  }, [toast]);

  const notifyUserJoined = useCallback((user) => {
    return toast.addToast(SeatingConflictToasts.userJoined(user.name));
  }, [toast]);

  const notifyUserLeft = useCallback((user) => {
    return toast.addToast(SeatingConflictToasts.userLeft(user.name));
  }, [toast]);

  return {
    notifyTableConflict,
    notifyGuestConflict,
    notifyLayoutConflict,
    notifySaved,
    notifySyncError,
    notifyUserJoined,
    notifyUserLeft,
  };
}

export default ConflictToast;
