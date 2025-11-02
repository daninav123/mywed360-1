import { Gauge, Table, Users, Sparkles } from 'lucide-react';
import React from 'react';

import useTranslations from '../../hooks/useTranslations';

function ProgressRow({ label, value }) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span className="font-medium text-slate-700">{clamped}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-slate-800 transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export default function SeatingPlanSummary({
  totalGuests = 0,
  totalPersons = 0,
  assignedPersons = 0,
  pendingGuests = 0,
  tableCount = 0,
  seatCapacity = 0,
  globalCapacity = 0,
  ceremonyProgress = 0,
  banquetProgress = 0,
  areaSummary = [],
  onOpenGuestDrawer,
  onOpenAutoLayout,
  hasAssignedTables = false,
}) {
  const { t, format } = useTranslations();

  const formatCount = React.useCallback(
    (value) => {
      const numeric = Number(value);
      if (format?.number) {
        return format.number(Number.isFinite(numeric) ? numeric : 0);
      }
      return Number.isFinite(numeric) ? numeric.toString() : '0';
    },
    [format]
  );

  const capacityTarget = globalCapacity > 0 ? globalCapacity : seatCapacity;
  const occupancyPercent =
    capacityTarget > 0 ? Math.round((assignedPersons / capacityTarget) * 100) : 0;

  const summaryTagline = t('common.seating.summary.sectionLabel', {
    defaultValue: 'Resumen general',
  });
  const assignedLabel = t('common.seating.summary.assignedTitle', {
    count: formatCount(assignedPersons),
    defaultValue: `${formatCount(assignedPersons)} personas ubicadas`,
  });
  const subtitle =
    totalPersons > 0
      ? t('common.seating.summary.assignedSubtitle', {
          assigned: formatCount(assignedPersons),
          total: formatCount(totalPersons),
          defaultValue: `${formatCount(assignedPersons)} de ${formatCount(totalPersons)} invitados y acompañantes`,
        })
      : t('common.seating.summary.noGuests', { defaultValue: 'Sin invitados cargados' });

  const pendingLabel = t('common.seating.summary.metrics.pending', { defaultValue: 'Pendientes:' });
  const tablesLabel = t('common.seating.summary.metrics.tables', {
    defaultValue: 'Mesas activas:',
  });
  const capacityLabel = t('common.seating.summary.metrics.capacity', {
    defaultValue: 'Capacidad disponible:',
  });
  const capacitySuffix = t('common.seating.summary.metrics.capacitySuffix', {
    defaultValue: 'pax',
  });

  const autoLayoutLabel =
    tableCount === 0
      ? t('common.seating.summary.actions.generateLayout', {
          defaultValue: 'Generar Layout Automático',
        })
      : t('common.seating.summary.actions.regenerateLayout', { defaultValue: 'Regenerar Layout' });
  const reviewPendingLabel = t('common.seating.summary.actions.reviewPending', {
    defaultValue: 'Revisar invitados pendientes',
  });

  const mapTitle = t('common.seating.summary.map.title', { defaultValue: 'Mapa del espacio' });
  const mapSeparator = t('common.seating.summary.map.separator', { defaultValue: '•' });

  // Mostrar botón si hay invitados asignados a mesas O si hasAssignedTables es true
  const showAutoLayoutButton = hasAssignedTables || assignedPersons > 0;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{summaryTagline}</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">{assignedLabel}</h2>
            <p className="text-sm text-slate-600">{subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-500" />
              {pendingLabel} <strong>{formatCount(pendingGuests)}</strong>
            </span>
            <span className="inline-flex items-center gap-2">
              <Table className="h-4 w-4 text-slate-500" />
              {tablesLabel} <strong>{formatCount(tableCount)}</strong>
            </span>
            <span className="inline-flex items-center gap-2">
              <Gauge className="h-4 w-4 text-slate-500" />
              {capacityLabel}{' '}
              <strong>
                {formatCount(capacityTarget > 0 ? capacityTarget : seatCapacity)} {capacitySuffix}
              </strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {typeof onOpenAutoLayout === 'function' && showAutoLayoutButton ? (
              <button
                type="button"
                onClick={onOpenAutoLayout}
                className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-blue-600 hover:shadow-lg"
              >
                <Sparkles className="h-4 w-4" />
                {autoLayoutLabel}
              </button>
            ) : null}
            {typeof onOpenGuestDrawer === 'function' && pendingGuests > 0 ? (
              <button
                type="button"
                onClick={onOpenGuestDrawer}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                {reviewPendingLabel}
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:max-w-sm">
          <ProgressRow
            label={t('common.seating.summary.progress.ceremony', {
              defaultValue: 'Ceremonia lista',
            })}
            value={ceremonyProgress}
          />
          <ProgressRow
            label={t('common.seating.summary.progress.banquet', {
              defaultValue: 'Banquete asignado',
            })}
            value={banquetProgress}
          />
          <ProgressRow
            label={t('common.seating.summary.progress.occupancy', {
              defaultValue: 'Capacidad ocupada',
            })}
            value={occupancyPercent}
          />
        </div>
      </div>

      {Array.isArray(areaSummary) && areaSummary.length > 0 ? (
        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{mapTitle}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {areaSummary.map((item) => (
              <span
                key={item.type}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-600"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
                <span className="text-slate-400">{mapSeparator}</span>
                <span>{formatCount(item.count)}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
