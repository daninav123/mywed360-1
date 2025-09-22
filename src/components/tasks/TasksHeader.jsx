import React from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

export default function TasksHeader({ syncStatus, onNewTask }) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="page-title">Gestión de Tareas</h1>
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          {syncStatus?.isSyncing ? (
            <RefreshCw className="w-4 h-4 animate-spin text-yellow-500 mr-2" />
          ) : syncStatus?.isOnline ? (
            syncStatus?.pendingChanges ? (
              <Cloud className="w-4 h-4 text-orange-500 mr-2" />
            ) : (
              <Cloud className="w-4 h-4 text-green-500 mr-2" />
            )
          ) : (
            <CloudOff className="w-4 h-4 text-red-500 mr-2" />
          )}
          <div className="text-sm text-gray-500">
            {syncStatus?.isOnline
              ? syncStatus?.isSyncing
                ? 'Sincronizando...'
                : syncStatus?.pendingChanges
                ? 'Cambios pendientes'
                : 'Sincronizado'
              : 'Sin conexión'}
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onNewTask}
            className="bg-pink-500 text-white px-4 py-2 rounded-md transition-colors hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50"
          >
            Nueva Tarea
          </button>
        </div>
      </div>
    </div>
  );
}

