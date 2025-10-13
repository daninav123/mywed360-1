/**
 * Componente para manejar sesiones expiradas y feedback de autenticacion
 * Proporciona notificaciones, modales de reautenticacion y gestion de errores
 */

import { AlertTriangle, RefreshCw, LogOut, Shield, Clock, Wifi, WifiOff } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

import { useAuth } from '../../hooks/useAuth';
import { performanceMonitor } from '../../services/PerformanceMonitor';

/**
 * Modal de reautenticacion
 */
const ReauthModal = ({ isOpen, onClose, onReauth, error }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    try {
      await onReauth(password);
      setPassword('');
      onClose();
      toast.success('Reautenticacion exitosa');
    } catch (error) {
      toast.error('Error en reautenticacion: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <Shield className="h-6 w-6 text-yellow-500 mr-2" />
          <h2 className="text-lg font-semibold">Reautenticacion Requerida</h2>
        </div>

        <p className="text-muted mb-4">
          Tu sesion ha expirado. Por favor, confirma tu contrasena para continuar.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="flex">
              <AlertTriangle className="h-4 w-4 text-red-400 mr-2 mt-0.5" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-body mb-2">
              Email: {currentUser?.email}
            </label>
            <input
              type="password"
              placeholder="Contrasena"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-soft rounded-md focus:outline-none focus:ring-2 ring-primary"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={!password.trim() || isLoading}
              className="flex-1 bg-[var(--color-primary)] text-white px-4 py-2 rounded-md hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Verificando...' : 'Confirmar'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-soft rounded-md hover:bg-primary-soft"
              disabled={isLoading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Indicador de estado de conexion
 */
const ConnectionStatus = ({ isOnline, lastSync }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="fixed top-4 right-4 z-40">
      <div
        className={`flex items-center px-3 py-2 rounded-full text-sm font-medium cursor-pointer transition-all ${
          isOnline
            ? 'bg-green-100 text-green-800 hover:bg-green-200'
            : 'bg-red-100 text-red-800 hover:bg-red-200'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        {isOnline ? <Wifi className="h-4 w-4 mr-2" /> : <WifiOff className="h-4 w-4 mr-2" />}
        {isOnline ? 'Conectado' : 'Sin conexion'}
      </div>

      {showDetails && (
        <div className="absolute top-12 right-0 bg-surface border border-soft rounded-lg shadow-lg p-3 min-w-48">
          <div className="text-xs text-muted">
            <div className="flex justify-between mb-1">
              <span>Estado:</span>
              <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                {isOnline ? 'En linea' : 'Desconectado'}
              </span>
            </div>
            {lastSync && (
              <div className="flex justify-between">
                <span>Ultima sync:</span>
                <span>{new Date(lastSync).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Notificacion de sesion proxima a expirar
 */
const SessionWarning = ({ timeLeft, onExtend, onLogout }) => {
  const minutes = Math.ceil(timeLeft / 60000);

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg max-w-sm z-40">
      <div className="flex items-start">
        <Clock className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">Sesion proxima a expirar</h3>
          <p className="text-sm text-yellow-700 mt-1">
            Tu sesion expirara en {minutes} minuto{minutes !== 1 ? 's' : ''}
          </p>
          <div className="flex space-x-2 mt-3">
            <button
              onClick={onExtend}
              className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
            >
              Extender sesion
            </button>
            <button
              onClick={() => onLogout?.('user_action')}
              className="text-xs border border-yellow-600 text-yellow-600 px-3 py-1 rounded hover:bg-yellow-50"
            >
              Cerrar sesion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente principal de gestion de sesiones
 */
const SessionManager = ({ children }) => {
  const { isAuthenticated, logout, reauthenticate, currentUser, isLoading } = useAuth();

  const error = null;
  const clearError = useCallback(() => {}, []);
  const getErrorMessage = useCallback((code) => code || 'Error de autenticacion', []);

  // Estados locales
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState(Date.now());
  const [reauthError, setReauthError] = useState(null);

  /**
   * Maneja la reautenticacion
   */
  const handleReauth = useCallback(
    async (password) => {
      try {
        setReauthError(null);
        const result = await reauthenticate(password);

        if (result.success) {
          setShowReauthModal(false);
          clearError();
          performanceMonitor?.logEvent?.('session_reauth_succeeded', { method: 'password' });
        } else {
          const errorCode = result.error?.code || result.error || 'unknown';
          setReauthError(getErrorMessage(result.error?.code));
          performanceMonitor?.logEvent?.('session_reauth_failed', { method: 'password', error_code: errorCode });
        }
      } catch (error) {
        setReauthError(error.message);
        performanceMonitor?.logEvent?.('session_reauth_failed', { method: 'password', error_code: error?.code || 'exception' });
        throw error;
      }
    },
    [reauthenticate, clearError, getErrorMessage]
  );

  /**
   * Maneja el cierre de sesion
   */
  const handleLogout = useCallback(async (reason = 'user_action') => {
    try {
      performanceMonitor?.logEvent?.('session_logout', { reason });
      await logout();
      setShowReauthModal(false);
      clearError();
      toast.info('Sesion cerrada correctamente');
    } catch (error) {
      toast.error('Error al cerrar sesion');
      performanceMonitor?.logEvent?.('session_logout_failed', { reason, error_code: error?.code || 'exception' });
    }
  }, [logout, clearError]);

  /**
   * Extiende la sesion actual
   */
  const extendSession = useCallback(async () => {
    try {
      if (currentUser) {
        await currentUser.getIdToken(true);
        setSessionTimeLeft(null);
        setLastSync(Date.now());
        toast.success('Sesion extendida correctamente');
        performanceMonitor?.logEvent?.('session_extended', { method: 'token_refresh' });
      }
    } catch (error) {
      toast.error('Error al extender la sesion');
      performanceMonitor?.logEvent?.('session_extend_failed', { error_code: error?.code || 'exception' });
    }
  }, [currentUser]);

  /**
   * Monitorea el estado de conexion
   */
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSync(Date.now());
      toast.success('Conexion restaurada');
      performanceMonitor?.logEvent?.('session_connection_restored', {});
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Sin conexion a internet');
      performanceMonitor?.logEvent?.('session_offline', {});
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Monitorea errores de autenticacion
   */
  useEffect(() => {
    if (error) {
      switch (error.code) {
        case 'token-expired':
        case 'session-expired':
          setShowReauthModal(true);
          performanceMonitor?.logEvent?.('session_reauth_required', { reason: error.code });
          break;
        case 'token-refresh-failed':
          toast.error('Error al refrescar la sesion. Por favor, inicia sesion nuevamente.');
          performanceMonitor?.logEvent?.('session_refresh_failed', { error_code: error.code });
          break;
        case 'network-error':
          toast.error('Error de conexion. Verifica tu internet.');
          performanceMonitor?.logEvent?.('session_network_error', {});
          break;
        default:
          if (error.message) {
            toast.error(error.message);
            performanceMonitor?.logEvent?.('session_error', { message: error.message, error_code: error.code || 'unknown' });
          }
      }
    }
  }, [error]);

  /**
   * Simula monitoreo de tiempo de sesion
   * En una implementacion real, esto vendria del token JWT
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSessionTime = () => {
      // Simular tiempo restante de sesion (en una app real vendria del token)
      const now = Date.now();
      const sessionStart = localStorage.getItem('mywed360_last_activity');

      if (sessionStart) {
        const elapsed = now - parseInt(sessionStart);
        const sessionDuration = 60 * 60 * 1000; // 1 hora
        const remaining = sessionDuration - elapsed;

        if (remaining <= 5 * 60 * 1000 && remaining > 0) {
          // 5 minutos
          setSessionTimeLeft(remaining);
        } else if (remaining <= 0) {
          handleLogout('token_expired');
        } else {
          setSessionTimeLeft(null);
        }
      }
    };

    const interval = setInterval(checkSessionTime, 30000); // Cada 30 segundos
    checkSessionTime(); // Verificar inmediatamente

    return () => clearInterval(interval);
  }, [isAuthenticated, handleLogout]);

  return (
    <>
      {children}

      {/* Indicador de conexion */}
      <ConnectionStatus isOnline={isOnline} lastSync={lastSync} />

      {/* Advertencia de sesion proxima a expirar */}
      {sessionTimeLeft && (
        <SessionWarning
          timeLeft={sessionTimeLeft}
          onExtend={extendSession}
          onLogout={handleLogout}
        />
      )}

      {/* Modal de reautenticacion */}
      <ReauthModal
        isOpen={showReauthModal}
        onClose={() => setShowReauthModal(false)}
        onReauth={handleReauth}
        error={reauthError}
      />
    </>
  );
};

export default SessionManager;

