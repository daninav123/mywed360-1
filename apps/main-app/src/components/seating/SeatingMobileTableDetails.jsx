import React, { useState } from 'react';
import { Users, Edit2, Trash2, Copy, Lock, Unlock } from 'lucide-react';
import useTranslations from '../../hooks/useTranslations';

/**
 * Panel de Detalles de Mesa para Móvil
 * Tabs: Info | Invitados | Acciones
 */
const SeatingMobileTableDetails = ({
  table,
  guests = [],
  onAssignGuest,
  onRemoveGuest,
  onEditTable,
  onDeleteTable,
  onDuplicateTable,
  onToggleLock,
}) => {
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState('info'); // info, guests, actions

  if (!table) {
    return (
      <div className="p-6 text-center text-gray-500">
        {t('seatingMobile.details.noSelection', { defaultValue: 'Selecciona una mesa' })}
      </div>
    );
  }

  const assignedGuests = guests.filter((g) => g.tableId === table.id);
  const unassignedGuests = guests.filter((g) => !g.tableId);
  const occupancy = (assignedGuests.length / (table.capacity || 1)) * 100;

  const tabs = [
    {
      id: 'info',
      label: t('seatingMobile.details.tabs.info', { defaultValue: 'Info' }),
      icon: null,
    },
    {
      id: 'guests',
      label: t('seatingMobile.details.tabs.guests', { defaultValue: 'Invitados' }),
      icon: Users,
      badge: assignedGuests.length,
    },
    {
      id: 'actions',
      label: t('seatingMobile.details.tabs.actions', { defaultValue: 'Acciones' }),
      icon: null,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-colors
                ${activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
              `}
            >
              <span className="flex items-center justify-center gap-2">
                {Icon && <Icon className="w-4 h-4" />}
                {tab.label}
                {tab.badge !== undefined && (
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'info' && (
          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t('seatingMobile.details.name', { defaultValue: 'Nombre' })}
              </label>
              <p className="text-lg font-semibold text-gray-900 mt-1">{table.name}</p>
            </div>

            {/* Capacidad */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t('seatingMobile.details.capacity', { defaultValue: 'Capacidad' })}
              </label>
              <p className="text-lg text-gray-900 mt-1">
                {assignedGuests.length} / {table.capacity || 0}
              </p>
              
              {/* Barra de ocupación */}
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    occupancy >= 100 ? 'bg-red-500' : occupancy >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(occupancy, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {Math.round(occupancy)}% {t('seatingMobile.details.occupied', { defaultValue: 'ocupada' })}
              </p>
            </div>

            {/* Estado */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t('seatingMobile.details.status', { defaultValue: 'Estado' })}
              </label>
              <div className="flex items-center gap-2 mt-1">
                {table.locked ? (
                  <>
                    <Lock className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-900">
                      {t('seatingMobile.details.locked', { defaultValue: 'Bloqueada' })}
                    </span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-900">
                      {t('seatingMobile.details.unlocked', { defaultValue: 'Desbloqueada' })}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Posición */}
            {table.x !== undefined && table.y !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t('seatingMobile.details.position', { defaultValue: 'Posición' })}
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  X: {Math.round(table.x)}, Y: {Math.round(table.y)}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'guests' && (
          <div className="space-y-4">
            {/* Invitados asignados */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                {t('seatingMobile.details.assignedGuests', {
                  count: assignedGuests.length,
                  defaultValue: 'Invitados asignados ({{count}})',
                })}
              </h3>
              {assignedGuests.length > 0 ? (
                <div className="space-y-2">
                  {assignedGuests.map((guest) => (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm text-gray-900">{guest.name}</span>
                      <button
                        onClick={() => onRemoveGuest?.(guest.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        aria-label={t('seatingMobile.details.remove', { defaultValue: 'Quitar' })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  {t('seatingMobile.details.noGuests', { defaultValue: 'Sin invitados asignados' })}
                </p>
              )}
            </div>

            {/* Invitados disponibles */}
            {unassignedGuests.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  {t('seatingMobile.details.availableGuests', {
                    count: unassignedGuests.length,
                    defaultValue: 'Disponibles ({{count}})',
                  })}
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {unassignedGuests.slice(0, 10).map((guest) => (
                    <button
                      key={guest.id}
                      onClick={() => onAssignGuest?.(guest.id, table.id)}
                      className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <span className="text-sm text-gray-900">{guest.name}</span>
                      <span className="text-xs text-blue-600">+</span>
                    </button>
                  ))}
                  {unassignedGuests.length > 10 && (
                    <p className="text-xs text-gray-500 text-center pt-2">
                      ... y {unassignedGuests.length - 10} más
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-3">
            <button
              onClick={() => onEditTable?.(table.id)}
              className="w-full flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Edit2 className="w-5 h-5 text-blue-600" />
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900">
                  {t('seatingMobile.details.actions.edit', { defaultValue: 'Editar mesa' })}
                </div>
                <div className="text-xs text-gray-600">
                  {t('seatingMobile.details.actions.editDesc', { defaultValue: 'Cambiar nombre, capacidad...' })}
                </div>
              </div>
            </button>

            <button
              onClick={() => onToggleLock?.(table.id)}
              className="w-full flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              {table.locked ? <Unlock className="w-5 h-5 text-gray-600" /> : <Lock className="w-5 h-5 text-gray-600" />}
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900">
                  {table.locked
                    ? t('seatingMobile.details.actions.unlock', { defaultValue: 'Desbloquear' })
                    : t('seatingMobile.details.actions.lock', { defaultValue: 'Bloquear' })}
                </div>
                <div className="text-xs text-gray-600">
                  {t('seatingMobile.details.actions.lockDesc', { defaultValue: 'Evitar cambios accidentales' })}
                </div>
              </div>
            </button>

            <button
              onClick={() => onDuplicateTable?.(table.id)}
              className="w-full flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <Copy className="w-5 h-5 text-green-600" />
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900">
                  {t('seatingMobile.details.actions.duplicate', { defaultValue: 'Duplicar mesa' })}
                </div>
                <div className="text-xs text-gray-600">
                  {t('seatingMobile.details.actions.duplicateDesc', { defaultValue: 'Crear copia idéntica' })}
                </div>
              </div>
            </button>

            <button
              onClick={() => onDeleteTable?.(table.id)}
              className="w-full flex items-center gap-3 p-4 bg-white border border-red-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-5 h-5 text-red-600" />
              <div className="flex-1 text-left">
                <div className="font-medium text-red-900">
                  {t('seatingMobile.details.actions.delete', { defaultValue: 'Eliminar mesa' })}
                </div>
                <div className="text-xs text-red-600">
                  {t('seatingMobile.details.actions.deleteDesc', { defaultValue: 'Acción permanente' })}
                </div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatingMobileTableDetails;
