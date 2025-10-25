import React from 'react';

import Button from '../ui/Button';
import { Card } from '../ui/Card';
import Input from '../Input';
import { Progress } from '../ui/Progress';
import { useTranslations } from '../../hooks/useTranslations';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  const { t } = useTranslations();

  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const statusOptions = [
  { id: 'all', label: 'Todas' },
  { id: 'active', label: 'Solo activas' },
  { id: 'archived', label: 'Archivadas' },
  { id: 'upcoming30', label: t('common.proximas_dias') },
  { id: 'upcoming90', label: t('common.proximas_dias') },
  { id: 'unsynced', label: 'Sin sincronizar CRM' },
];

const crmOptions = [
  { id: 'all', label: 'Todos' },
  { id: 'synced', label: 'Sincronizado' },
  { id: 'queued', label: 'En cola' },
  { id: 'failed', label: 'Con errores' },
  { id: 'never', label: 'Sin historial' },
];

const toDateSafe = (value) => {
  if (!value) return null;
  try {
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value?.toDate === 'function') {
      const d = value.toDate();
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof value === 'object' && typeof value.seconds === 'number') {
      const d = new Date(value.seconds * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
};

const humanStatus = (wedding) =>
  wedding?.active === false ? 'Archivada' : 'Activa';

const normalizeCrmStatus = (wedding) =>
  String(
    wedding?.crm?.lastSyncStatus ||
      wedding?.crmStatus ||
      wedding?.crm?.status ||
      ''
  ).toLowerCase() || 'never';

const CRM_STATUS_LABELS = {
  synced: 'Sincronizado',
  success: 'Sincronizado',
  ok: 'Sincronizado',
  queued: 'En cola',
  pending: 'En cola',
  failed: 'Error',
  error: 'Error',
  never: 'Sin historial',
};

const CRM_STATUS_CLASS = {
  synced: 'text-emerald-600 bg-emerald-100',
  success: 'text-emerald-600 bg-emerald-100',
  ok: 'text-emerald-600 bg-emerald-100',
  queued: 'text-amber-600 bg-amber-100',
  pending: 'text-amber-600 bg-amber-100',
  failed: 'text-rose-600 bg-rose-100',
  error: 'text-rose-600 bg-rose-100',
  never: 'text-slate-600 bg-slate-100',
};

export default function WeddingPortfolioTable({
  weddings = [],
  filters,
  onFiltersChange,
  onSyncWedding,
  syncingIds = new Set(),
  onSelectWedding,
  ownerOptions = [],
  plannerOptions = [],
}) {
  const handleFilters = (changes) => {
    if (typeof onFiltersChange === 'function') {
      onFiltersChange({ ...filters, ...changes });
    }
  };

  return (
    <Card className="p-4 space-y-4" data-testid="wedding-portfolio-table">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-[color:var(--color-text)]">
            Portfolio multi-boda
          </h3>
          <p className="text-sm text-muted">
            Usa filtros para comparar progreso y coordinar equipos rápidamente.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            value={filters.search || ''}
            onChange={(event) => handleFilters({ search: event.target.value })}
            placeholder={t('common.buscar_por_nombre_ubicacion')}
            data-testid="portfolio-search"
          />
          <label className="flex flex-col text-xs text-muted">
            Estado
            <select
              className="mt-1 rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[color:var(--color-text)]"
              value={filters.status || 'all'}
              onChange={(event) => handleFilters({ status: event.target.value })}
              data-testid="portfolio-status"
            >
              {statusOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs text-muted">
            CRM
            <select
              className="mt-1 rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[color:var(--color-text)]"
              value={filters.crmStatus || 'all'}
              onChange={(event) => handleFilters({ crmStatus: event.target.value })}
              data-testid="portfolio-crm"
            >
              {crmOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col text-xs text-muted">
            Propietario
            <select
              className="mt-1 rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[color:var(--color-text)]"
              value={filters.ownerId || 'all'}
              onChange={(event) => handleFilters({ ownerId: event.target.value })}
              data-testid="portfolio-owner"
            >
              <option value="all">Todos</option>
              {ownerOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs text-muted">
            Planner
            <select
              className="mt-1 rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[color:var(--color-text)]"
              value={filters.plannerId || 'all'}
              onChange={(event) => handleFilters({ plannerId: event.target.value })}
              data-testid="portfolio-planner"
            >
              <option value="all">Todos</option>
              {plannerOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col text-xs text-muted">
              Fecha desde
              <input
                type="date"
                className="mt-1 rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[color:var(--color-text)]"
                value={filters.startDate || ''}
                onChange={(event) => handleFilters({ startDate: event.target.value })}
                data-testid="portfolio-start-date"
              />
            </label>
            <label className="flex flex-col text-xs text-muted">
              Fecha hasta
              <input
                type="date"
                className="mt-1 rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[color:var(--color-text)]"
                value={filters.endDate || ''}
                onChange={(event) => handleFilters({ endDate: event.target.value })}
                data-testid="portfolio-end-date"
              />
            </label>
          </div>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[color:var(--color-border)] text-sm">
          <thead className="bg-[var(--color-surface)]/70 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Evento</th>
              <th className="px-3 py-2 text-left font-semibold">Fecha</th>
              <th className="px-3 py-2 text-left font-semibold">Estado</th>
              <th className="px-3 py-2 text-left font-semibold">Progreso</th>
              <th className="px-3 py-2 text-left font-semibold">Propietarios</th>
              <th className="px-3 py-2 text-left font-semibold">Planners</th>
              <th className="px-3 py-2 text-left font-semibold">CRM</th>
              <th className="px-3 py-2 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-border)]">
            {weddings.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-sm text-muted">
                  No hay bodas que coincidan con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              weddings.map((wedding) => {
                const dateValue =
                  toDateSafe(wedding.weddingDate) ||
                  toDateSafe(wedding.date) ||
                  toDateSafe(wedding.eventDate);
                const dateLabel = dateValue
                  ? DATE_FORMATTER.format(dateValue)
                  : 'Sin fecha';
                const statusLabel = humanStatus(wedding);
                const progress = Number(wedding.progress) || 0;
                const owners = Array.isArray(wedding.ownerNames)
                  ? wedding.ownerNames.join(', ')
                  : Array.isArray(wedding.ownerIds)
                  ? wedding.ownerIds.join(', ')
                  : '—';
                const planners = Array.isArray(wedding.plannerNames)
                  ? wedding.plannerNames.join(', ')
                  : Array.isArray(wedding.plannerIds)
                  ? wedding.plannerIds.join(', ')
                  : '—';
                const crmStatus = normalizeCrmStatus(wedding);
                const crmLabel =
                  CRM_STATUS_LABELS[crmStatus] || CRM_STATUS_LABELS.never;
                const crmClass =
                  CRM_STATUS_CLASS[crmStatus] || CRM_STATUS_CLASS.never;
                const isSyncing = syncingIds.has
                  ? syncingIds.has(wedding.id)
                  : Array.isArray(syncingIds)
                  ? syncingIds.includes(wedding.id)
                  : false;

                return (
                  <tr key={wedding.id} className="text-[color:var(--color-text)]">
                    <td className="px-3 py-2">
                      <div className="font-medium">{wedding.name || 'Sin nombre'}</div>
                      <div className="text-xs text-muted">
                        {wedding.location || wedding.banquetPlace || {t('common.ubicacion_pendiente')}}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm">{dateLabel}</td>
                    <td className="px-3 py-2 text-sm">{statusLabel}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{progress}%</span>
                        <Progress value={progress} className="h-1.5 flex-1" />
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm">{owners}</td>
                    <td className="px-3 py-2 text-sm">{planners}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${crmClass}`}
                      >
                        {crmLabel}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => onSelectWedding?.(wedding)}
                          data-testid={`portfolio-open-${wedding.id}`}
                        >
                          Ver detalle
                        </Button>
                        <Button
                          size="xs"
                          onClick={() => onSyncWedding?.(wedding)}
                          disabled={isSyncing}
                          data-testid={`portfolio-sync-${wedding.id}`}
                        >
                          {isSyncing ? 'Encolando…' : 'Sync CRM'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

