import { useTranslations } from '../../hooks/useTranslations';
/**
 * SyncPanel Component
 * Panel de sincronización RSVP-Seating
 * Sprint 5 - S5-T002
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, XCircle, Users, Clock } from 'lucide-react';
import { useRSVPSeatingSync } from '../../services/rsvpSeatingSync';

export function SyncPanel({
  const { t } = useTranslations();
 weddingId }) {
  const { syncing, conflicts, lastSync, syncAll, detectConflicts, resolveConflict } = useRSVPSeatingSync(weddingId);
  const [syncResults, setSyncResults] = useState(null);
  const [showConflicts, setShowConflicts] = useState(false);

  useEffect(() => {
    detectConflicts();
  }, [detectConflicts]);

  const handleSync = async () => {
    try {
      const results = await syncAll();
      setSyncResults(results);
    } catch (error) {
      console.error('Error syncing:', error);
    }
  };

  const handleResolveConflict = async (conflict, resolution) => {
    try {
      await resolveConflict(conflict, resolution);
      await detectConflicts();
    } catch (error) {
      console.error('Error resolving conflict:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sincronización RSVP-Seating
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {lastSync ? `Última sincronización: ${lastSync.toLocaleString()}` : 'No sincronizado'}
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar'}
        </button>
      </div>

      {/* Sync Results */}
      {syncResults && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">Total</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {syncResults.total}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Sincronizados</span>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {syncResults.synced}
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Pendientes</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {syncResults.needsSeating}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">Errores</span>
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {syncResults.errors}
            </div>
          </div>
        </div>
      )}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Conflictos Detectados ({conflicts.length})
              </h4>
            </div>
            <button
              onClick={() => setShowConflicts(!showConflicts)}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              {showConflicts ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {showConflicts && (
            <div className="space-y-3">
              {conflicts.map((conflict, index) => (
                <div
                  key={index}
                  className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          conflict.severity === 'high' ? 'bg-red-100 text-red-800' :
                          conflict.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {conflict.severity}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {conflict.type === 'missing_seating' ? 'Guest sin asiento' :
                           conflict.type === 'orphan_seating' ? {t('common.asiento_huerfano')} :
                           'Asiento no confirmado'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {conflict.guestName || `Guest ID: ${conflict.guestId}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {conflict.type === 'missing_seating' && (
                        <button
                          onClick={() => handleResolveConflict(conflict, 'auto_assign')}
                          className="text-sm px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
                        >
                          Auto-asignar
                        </button>
                      )}
                      {conflict.type === 'orphan_seating' && (
                        <button
                          onClick={() => handleResolveConflict(conflict, 'remove')}
                          className="text-sm px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                        >
                          Eliminar
                        </button>
                      )}
                      {conflict.type === 'seating_not_confirmed' && (
                        <button
                          onClick={() => handleResolveConflict(conflict, 'remove_seating')}
                          className="text-sm px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded"
                        >
                          Remover asiento
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          La sincronización automática mantiene actualizada la información entre confirmaciones RSVP y asignación de asientos.
        </p>
      </div>
    </div>
  );
}

export default SyncPanel;
