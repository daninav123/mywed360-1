import {
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

const CARD_BASE =
  'flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:shadow';

const STATUS_STYLES = {
  active: 'border-slate-900/20 bg-slate-100',
  done: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  default: '',
};

const STATUS_DOT = {
  active: 'bg-slate-900',
  done: 'bg-emerald-500',
  default: 'bg-slate-300',
};

const iconWrapperBase =
  'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700';

function PanelToggle({ label, active, onClick, disabled }) {
  const base =
    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition';
  const className = disabled
    ? `${base} cursor-not-allowed border-slate-200 text-slate-300`
    : active
      ? `${base} border-slate-900 bg-slate-100 text-slate-900 hover:border-slate-900`
      : `${base} border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-900`;

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      <span className={`h-2 w-2 rounded-full ${active ? 'bg-slate-900' : 'bg-slate-300'}`} />
      {label}
    </button>
  );
}

function resolveStatus(step, onboarding) {
  if (!step || !onboarding) return 'default';
  if (onboarding.completed?.[step]) return 'done';
  if (onboarding.activeStep === step) return 'active';
  return 'default';
}

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
  onboardingDismissed = false,
  onResetOnboarding,
  onHideOverview,
  panels = {},
  smartPanelAvailable = true,
  guestPanelAvailable = true,
  onToggleLibraryPanel,
  onToggleInspectorPanel,
  onToggleSmartPanel,
  onToggleGuestPanel,
}) {
  const isBanquet = tab === 'banquet';

  const actions = [
    onOpenSpaceConfig && {
      id: 'space-config',
      label: 'Configurar espacio',
      description: 'Define dimensiones, fondo o zonas principales.',
      icon: Ruler,
      onClick: onOpenSpaceConfig,
      onboardingKey: 'space',
    },
    isBanquet && onOpenBanquetConfig && {
      id: 'banquet-config',
      label: 'Ajustar banquete',
      description: 'Controla secciones, mesas predefinidas y flujo.',
      icon: Settings,
      onClick: onOpenBanquetConfig,
    },
    !isBanquet && onOpenCeremonyConfig && {
      id: 'ceremony-config',
      label: 'Ajustar ceremonia',
      description: 'Filas, pasillos y reservas especiales.',
      icon: Settings,
      onClick: onOpenCeremonyConfig,
    },
    onAddTable && {
      id: 'add-table',
      label: 'Agregar mesa',
      description: 'Inserta una mesa redonda base para editarla.',
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
          ? 'Revisa quienes falta ubicar y completa asignaciones.'
          : 'Abre la lista para importar o revisar invitados.',
      icon: Users,
      onClick: onOpenGuestDrawer,
      onboardingKey: 'guests',
    },
    onAutoAssign && hasGuests && {
      id: 'auto-assign',
      label: 'Asignacion inteligente',
      description: 'Usa IA para proponer ubicaciones rapidas.',
      icon: Sparkles,
      onClick: onAutoAssign,
      onboardingKey: 'assign',
    },
    onOpenTemplates && {
      id: 'templates',
      label: 'Explorar plantillas',
      description: 'Comienza desde layouts predefinidos en segundos.',
      icon: LayoutGrid,
      onClick: onOpenTemplates,
    },
    onFitToContent && {
      id: 'fit',
      label: 'Ajustar vista',
      description: 'Centra y ajusta el zoom al contenido activo.',
      icon: Maximize2,
      onClick: onFitToContent,
    },
    onOpenExport && {
      id: 'export',
      label: 'Exportar',
      description: 'Descarga PDF, PNG o planillas para compartir.',
      icon: Download,
      onClick: onOpenExport,
    },
  ].filter(Boolean);

  const panelState = panels || {};
  const hasPanelToggles =
    typeof onToggleLibraryPanel === 'function' ||
    typeof onToggleInspectorPanel === 'function' ||
    typeof onToggleSmartPanel === 'function' ||
    typeof onToggleGuestPanel === 'function';

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Acciones clave</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            Empieza por lo esencial antes de entrar en detalle
          </h3>
          {onboardingDismissed && typeof onResetOnboarding === 'function' ? (
            <button
              type="button"
              onClick={() => onResetOnboarding()}
              className="mt-2 text-xs font-medium text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              Reabrir guia de primeros pasos
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {typeof onHideOverview === 'function' ? (
            <button
              type="button"
              onClick={onHideOverview}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-900"
            >
              Ocultar panel
            </button>
          ) : null}
          {typeof onToggleAdvancedTools === 'function' ? (
            <button
              type="button"
              onClick={() => onToggleAdvancedTools(!advancedOpen)}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
            >
              {advancedOpen ? 'Ocultar toolbar avanzada' : 'Mostrar toolbar avanzada'}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const status = resolveStatus(action.onboardingKey, onboarding);
          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className={`${CARD_BASE} ${STATUS_STYLES[status]}`}
            >
              <span
                className={`${iconWrapperBase} ${
                  status === 'done'
                    ? 'bg-emerald-100 text-emerald-700'
                    : status === 'active'
                      ? 'bg-slate-900 text-white'
                      : ''
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{action.label}</span>
                  {action.onboardingKey ? (
                    <span
                      className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`}
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
                <span className="text-xs text-slate-600">{action.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      {hasPanelToggles ? (
        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Paneles visibles</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {typeof onToggleLibraryPanel === 'function' ? (
              <PanelToggle
                label="Biblioteca"
                active={!!panelState.library}
                onClick={onToggleLibraryPanel}
                disabled={false}
              />
            ) : null}
            {typeof onToggleInspectorPanel === 'function' ? (
              <PanelToggle
                label="Inspector"
                active={!!panelState.inspector}
                onClick={onToggleInspectorPanel}
                disabled={false}
              />
            ) : null}
            {typeof onToggleSmartPanel === 'function' ? (
              <PanelToggle
                label="Panel inteligente"
                active={!!panelState.smart}
                onClick={onToggleSmartPanel}
                disabled={!smartPanelAvailable}
              />
            ) : null}
            {typeof onToggleGuestPanel === 'function' ? (
              <PanelToggle
                label="Invitados"
                active={!!panelState.guest}
                onClick={onToggleGuestPanel}
                disabled={!guestPanelAvailable}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
