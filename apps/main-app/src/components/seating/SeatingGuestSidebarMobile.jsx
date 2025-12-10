import React, { useState } from 'react';
import { Users, Lightbulb, AlertTriangle, ShieldCheck, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import useTranslations from '../../hooks/useTranslations';
import SeatingMobileBottomPanel from './SeatingMobileBottomPanel';

/**
 * Guest Sidebar optimizado para móvil
 * Usa tabs touch-friendly y bottom panel
 */
const SeatingGuestSidebarMobile = ({
  unassignedGuests = [],
  recommendations = [],
  conflicts = [],
  staffGuests = [],
  history = [],
  onAssignGuest,
  onFocusTable,
}) => {
  const [activeTab, setActiveTab] = useState('unassigned');
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslations();

  const tabs = [
    {
      id: 'unassigned',
      label: t('seatingMobile.tabs.unassigned', { defaultValue: 'Pendientes' }),
      icon: Users,
      count: unassignedGuests.length,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      id: 'recommendations',
      label: t('seatingMobile.tabs.recommendations', { defaultValue: 'Sugerencias' }),
      icon: Lightbulb,
      count: recommendations.length,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      id: 'conflicts',
      label: t('seatingMobile.tabs.conflicts', { defaultValue: 'Conflictos' }),
      icon: AlertTriangle,
      count: conflicts.length,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      id: 'staff',
      label: t('seatingMobile.tabs.staff', { defaultValue: 'Personal' }),
      icon: ShieldCheck,
      count: staffGuests.length,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'history',
      label: t('seatingMobile.tabs.history', { defaultValue: 'Historial' }),
      icon: Clock,
      count: history.length,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ];

  const currentTab = tabs.find((t) => t.id === activeTab);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'unassigned':
        return (
          <div className="p-4 space-y-3">
            {unassignedGuests.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {t('seatingMobile.tabs.noUnassigned', {
                  defaultValue: '¡Todos los invitados están asignados!',
                })}
              </p>
            ) : (
              unassignedGuests.map((guest) => (
                <div key={guest.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{guest.name}</h4>
                      {guest.group && <p className="text-sm text-gray-600 mt-1">{guest.group}</p>}
                    </div>
                    <button
                      onClick={() => onAssignGuest?.(guest.id)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      {t('seatingMobile.actions.assign', { defaultValue: 'Asignar' })}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case 'recommendations':
        return (
          <div className="p-4 space-y-3">
            {recommendations.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {t('seatingMobile.tabs.noRecommendations', {
                  defaultValue: 'No hay sugerencias por el momento',
                })}
              </p>
            ) : (
              recommendations.map((rec, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{rec.guestName}</h4>
                      <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                    </div>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      {rec.score}%
                    </span>
                  </div>
                  <button
                    onClick={() => onFocusTable?.(rec.tableId)}
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Ver mesa {rec.tableName}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        );

      case 'conflicts':
        return (
          <div className="p-4 space-y-3">
            {conflicts.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                  <ShieldCheck className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-gray-900 font-medium">
                  {t('seatingMobile.tabs.noConflicts', { defaultValue: '¡Sin conflictos!' })}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {t('seatingMobile.tabs.noConflictsDesc', {
                    defaultValue: 'Todas las asignaciones se ven bien',
                  })}
                </p>
              </div>
            ) : (
              conflicts.map((conflict, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900">{conflict.type}</h4>
                      <p className="text-sm text-red-700 mt-1">{conflict.description}</p>
                      {conflict.affectedGuests && (
                        <p className="text-xs text-red-600 mt-2">
                          Afecta a: {conflict.affectedGuests.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case 'staff':
        return (
          <div className="p-4 space-y-3">
            {staffGuests.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {t('seatingMobile.tabs.noStaff', { defaultValue: 'No hay personal asignado' })}
              </p>
            ) : (
              staffGuests.map((staff) => (
                <div key={staff.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{staff.name}</h4>
                      <p className="text-sm text-gray-600">{staff.role || staff.type}</p>
                    </div>
                  </div>
                  {staff.tableId && (
                    <button
                      onClick={() => onFocusTable?.(staff.tableId)}
                      className="mt-3 text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Ver ubicación
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        );

      case 'history':
        return (
          <div className="p-4 space-y-3">
            {history.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {t('seatingMobile.tabs.noHistory', { defaultValue: 'No hay historial aún' })}
              </p>
            ) : (
              history.map((entry, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{entry.action}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {entry.timestamp && new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Floating Button para abrir panel */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 left-6 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-20"
      >
        <Users className="w-6 h-6" />
        {unassignedGuests.length > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unassignedGuests.length}
          </span>
        )}
      </button>

      {/* Bottom Panel con tabs */}
      <SeatingMobileBottomPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t('seatingMobile.guestPanel.title', { defaultValue: 'Invitados' })}
        defaultHeight="max"
      >
        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex overflow-x-auto px-2 py-2 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap
                    transition-colors relative
                    ${
                      isActive
                        ? `${tab.bgColor} ${tab.color} font-medium`
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`
                      px-1.5 py-0.5 rounded-full text-xs font-semibold
                      ${isActive ? 'bg-white text-gray-900' : 'bg-gray-200 text-gray-700'}
                    `}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderTabContent()}
        </motion.div>
      </SeatingMobileBottomPanel>
    </>
  );
};

export default SeatingGuestSidebarMobile;
