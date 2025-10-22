import {
  CheckCircle,
  Download,
  LayoutGrid,
  Maximize2,
  Ruler,
  Settings,
  Sparkles,
  Table,
  Users,
} from 'lucide-react';
import React from 'react';

const cardBase =
  'relative border border-gray-200 rounded-xl bg-white p-4 flex flex-col gap-2 shadow-sm hover:shadow transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-400';

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
  onboarding = null,
}) {
  const isBanquet = tab === 'banquet';

  const quickActions = [
    onOpenSpaceConfig && {
      id: 'space-config',
      label: 'Configurar espacio',
      description: 'Dimensiones, fondo y capacidad',
      icon: Ruler,
      onClick: onOpenSpaceConfig,
      onboardingStep: 'space',
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
      onboardingStep: 'guests',
    },
    onAutoAssign && hasGuests && {
      id: 'auto-assign',
      label: 'Asignacion inteligente',
      description: 'Ubica invitados segun afinidad',
      icon: Sparkles,
      onClick: onAutoAssign,
      onboardingStep: 'assign',
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

  const stepOrder = {
    space: 1,
    guests: 2,
    assign: 3,
  };

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
          const isDone =
            action.onboardingStep &&
            onboarding &&
            onboarding.completed &&
            onboarding.completed[action.onboardingStep] === true;
          const isActive =
            action.onboardingStep &&
            onboarding &&
            onboarding.activeStep === action.onboardingStep &&
            !isDone;
          const classes = [cardBase, 'text-left'];
          if (isActive) {
            classes.push('border-blue-400 ring-2 ring-blue-200 shadow-md');
          } else if (isDone) {
            classes.push('border-green-200 bg-green-50');
          } else if (action.highlight) {
            classes.push('border-amber-300 ring-1 ring-amber-200');
          }
          const badgeStep = action.onboardingStep ? stepOrder[action.onboardingStep] : null;
          const iconWrapperClass = isDone
            ? 'bg-green-100 text-green-700'
            : isActive
              ? 'bg-blue-600 text-white'
              : 'bg-blue-50 text-blue-600';

          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className={classes.join(' ')}
            >
              {isDone ? (
                <span className="absolute -top-2 right-3 rounded-full border border-green-200 bg-green-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                  Hecho
                </span>
              ) : null}
              {isActive && badgeStep ? (
                <span className="absolute -top-2 right-3 rounded-full border border-blue-300 bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                  Paso {badgeStep}
                </span>
              ) : null}
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${iconWrapperClass}`}
              >
                {isDone ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </span>
              <span
                className={`text-sm font-semibold ${
                  isDone ? 'text-green-800' : isActive ? 'text-blue-900' : 'text-gray-900'
                }`}
              >
                {action.label}
              </span>
              <span
                className={`text-xs leading-4 ${
                  isDone ? 'text-green-700' : isActive ? 'text-blue-700' : 'text-gray-600'
                }`}
              >
                {action.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
