import React, { useMemo } from 'react';

import Button from '../ui/Button';
import { Card } from '../ui/Card';
import { Progress } from '../ui/Progress';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toDateSafe = (value) => {
  if (!value) return null;
  try {
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
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

function computeStats(weddings = []) {
  const now = Date.now();
  let active = 0;
  let archived = 0;
  let progressTotal = 0;
  let progressCount = 0;
  const upcoming = [];
  const crm = {
    synced: 0,
    queued: 0,
    failed: 0,
    never: 0,
  };

  weddings.forEach((wedding) => {
    const isActive = wedding?.active !== false;
    if (isActive) active += 1;
    else archived += 1;

    const progress = Number(wedding?.progress);
    if (Number.isFinite(progress)) {
      progressTotal += progress;
      progressCount += 1;
    }

    const eventDate =
      toDateSafe(wedding?.weddingDate) ||
      toDateSafe(wedding?.date) ||
      toDateSafe(wedding?.eventDate);
    if (eventDate) {
      const diffDays = Math.round((eventDate.getTime() - now) / MS_PER_DAY);
      upcoming.push({
        id: wedding?.id || '',
        name: wedding?.name || wedding?.slug || 'Evento sin nombre',
        date: eventDate,
        diffDays,
        location: wedding?.location || wedding?.banquetPlace || '',
        status: isActive ? 'active' : 'archived',
      });
    }

    const status =
      String(
        wedding?.crm?.lastSyncStatus ||
          wedding?.crmStatus ||
          wedding?.crm?.status ||
          ''
      ).toLowerCase() || 'never';
    if (status === 'ok' || status === 'success' || status === 'synced') {
      crm.synced += 1;
    } else if (status === 'queued' || status === 'pending') {
      crm.queued += 1;
    } else if (status === 'failed' || status === 'error') {
      crm.failed += 1;
    } else {
      crm.never += 1;
    }
  });

  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
  const upcomingWithin60 = upcoming.filter(
    (item) => item.diffDays >= 0 && item.diffDays <= 60
  );
  const averageProgress =
    progressCount > 0 ? Math.round((progressTotal / progressCount) * 10) / 10 : 0;

  return {
    count: weddings.length,
    active,
    archived,
    averageProgress,
    upcoming,
    upcomingWithin60,
    crm,
  };
}

export default function MultiWeddingSummary({
  totalWeddings = [],
  filteredWeddings = [],
  onSyncAll,
  syncing = false,
  onResetFilters,
}) {
  const totalStats = useMemo(
    () => computeStats(totalWeddings),
    [totalWeddings]
  );
  const filteredStats = useMemo(
    () =>
      computeStats(
        filteredWeddings && filteredWeddings.length
          ? filteredWeddings
          : totalWeddings
      ),
    [filteredWeddings, totalWeddings]
  );

  const upcomingHighlights = filteredStats.upcoming.slice(0, 4);

  return (
    <section className="space-y-6" data-testid="multi-wedding-summary">
      <div className="grid gap-4 lg:grid-cols-4 md:grid-cols-2">
        <Card className="p-4">
          <p className="text-sm text-muted">Bodas activas</p>
          <p className="text-3xl font-semibold text-[color:var(--color-text)]">
            {filteredStats.active}
          </p>
          <p className="text-xs text-[color:var(--color-text)]/60">
            Total: {totalStats.active}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">Próximas 60 días</p>
          <p className="text-3xl font-semibold text-[color:var(--color-text)]">
            {filteredStats.upcomingWithin60.length}
          </p>
          <p className="text-xs text-[color:var(--color-text)]/60">
            Próximos 30 días:{' '}
            {
              filteredStats.upcomingWithin60.filter(
                (item) => item.diffDays <= 30
              ).length
            }
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">Progreso promedio</p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-semibold text-[color:var(--color-text)]">
              {filteredStats.averageProgress}%
            </span>
            <Progress value={filteredStats.averageProgress} className="h-2 flex-1" />
          </div>
          <p className="text-xs text-[color:var(--color-text)]/60">
            Sobre {filteredStats.count} bodas seleccionadas
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">Estado CRM</p>
          <ul className="mt-2 space-y-1 text-sm text-[color:var(--color-text)]">
            <li>Sincronizadas: {filteredStats.crm.synced}</li>
            <li>En cola: {filteredStats.crm.queued}</li>
            <li>Errores: {filteredStats.crm.failed}</li>
            <li>Sin historial: {filteredStats.crm.never}</li>
          </ul>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          size="sm"
          onClick={onSyncAll}
          disabled={syncing || filteredStats.count === 0}
        >
          {syncing ? 'Sincronizando...' : 'Sincronizar selección con CRM'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onResetFilters}
          disabled={!onResetFilters}
        >
          Limpiar filtros
        </Button>
      </div>

      <Card className="p-4">
        <header className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-[color:var(--color-text)]">
            Próximos eventos
          </h3>
          <span className="text-xs text-[color:var(--color-text)]/60">
            Mostrando {upcomingHighlights.length} de {filteredStats.upcoming.length}
          </span>
        </header>
        {upcomingHighlights.length === 0 ? (
          <p className="text-sm text-muted">No hay bodas próximas en la selección.</p>
        ) : (
          <ul className="space-y-3">
            {upcomingHighlights.map((item) => {
              const badge =
                item.diffDays < 0
                  ? `${Math.abs(item.diffDays)} días atrás`
                  : item.diffDays === 0
                  ? 'Hoy'
                  : `En ${item.diffDays} días`;
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between border border-dashed border-[color:var(--color-border)] rounded-lg px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-[color:var(--color-text)]">
                      {item.name}
                    </p>
                    <p className="text-xs text-[color:var(--color-text)]/60">
                      {item.location || 'Ubicación pendiente'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[color:var(--color-text)]">
                      {DATE_FORMATTER.format(item.date)}
                    </p>
                    <p className="text-xs text-[color:var(--color-primary)]">{badge}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </section>
  );
}

