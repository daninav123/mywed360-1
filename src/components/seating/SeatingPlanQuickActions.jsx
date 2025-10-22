import { Download, LayoutGrid, Maximize2, Ruler, Settings, Sparkles, Table, Users } from 'lucide-react';
import React from 'react';

const cardBase =
  'border border-gray-200 rounded-xl bg-white p-4 flex flex-col gap-2 shadow-sm hover:shadow transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-400';

export default function SeatingPlanQuickActions({
  tab = 'banquet',
  pendingCount = 0,
  hasTables = false,
  hasGuests = false,
  onAddTable,
  onOpenGuestDrawer,
  onAutoAssign,
  onOpenTemplates,
  onOpenSpaceConfig,
  onOpenCeremonyConfig,
  onOpenBanquetConfig,
  onFitToContent,
  onOpenExport,
  onToggleAdvancedTools,
  advancedOpen = false,
}) {
  const isBanquet = tab === 'banquet';

  const quickActions = [
    onOpenSpaceConfig && {
      id: 'space-config',
      label: 'Configurar espacio',
      description: 'Dimensiones, fondo y capacidad',
      icon: Ruler,
      onClick: onOpenSpaceConfig,
    },
    isBanquet && onOpenBanquetConfig && {
      id: 'banquet-config',
      label: 'Configurar banquete',
      description: 'Mesas, secciones y flujo de invitados',
      icon: Settings,
      onClick: onOpenBanquetConfig,
    },
    !isBanquet && onOpenCeremonyConfig && {
      id: 'ceremony-config',
      label: 'Configurar ceremonia',
      description: 'Filas, pasillos y reservas especiales',
      icon: Settings,
      onClick: onOpenCeremonyConfig,
    },
    onAddTable && {
      id: 'add-table',
      label: 'Agregar mesa',
      description: 'Inserta una mesa redonda de referencia',
      icon: Table,
      onClick: () => onAddTable({ tableType: 'round' }),
    },
    onOpenGuestDrawer && {
      id: 'pending-guests',
      label:
        pendingCount > 0
          ? `Asignar pendientes (${pendingCount})`
          : hasGuests
            ? 'Gestionar invitados'
            : 'Agregar invitados',
      description:
        pendingCount > 0
          ? 'Revisa quienes necesitan mesa'
          : 'Abre la lista de invitados',
      icon: Users,
      onClick: onOpenGuestDrawer,
      highlight: pendingCount > 0,
    },
    onAutoAssign && hasGuests && {
      id: 'auto-assign',
      label: 'Asignacion inteligente',
      description: 'Ubica invitados segun afinidad',
      icon: Sparkles,
      onClick: onAutoAssign,
    },
    onOpenTemplates && {
      id: 'templates',
      label: 'Explorar plantillas',
      description: 'Disenos prearmados para empezar rapido',
      icon: LayoutGrid,
      onClick: onOpenTemplates,
    },
    onFitToContent && {
      id: 'fit',
      label: 'Ajustar vista',
      description: 'Centra el plano y ajusta el zoom',
      icon: Maximize2,
      onClick: onFitToContent,
    },
    onOpenExport && {
      id: 'export',
      label: 'Exportar',
      description: 'Descarga PDF, PNG o planillas',
      icon: Download,
      onClick: onOpenExport,
    },
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">Acciones rapidas</span>
          <span className="text-xs text-gray-500">
            Prioriza lo esencial antes de abrir las herramientas avanzadas
          </span>
        </div>
        {typeof onToggleAdvancedTools === 'function' ? (
          <button
            type="button"
            onClick={() => onToggleAdvancedTools(!advancedOpen)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            {advancedOpen ? 'Ocultar herramientas avanzadas' : 'Ver herramientas avanzadas'}
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className={`${cardBase} text-left ${
                action.highlight ? 'border-amber-300 ring-1 ring-amber-200' : ''
              }`}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-gray-900">{action.label}</span>
              <span className="text-xs text-gray-600 leading-4">{action.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
