import React from 'react';
import { Link } from 'react-router-dom';

import Button from '../ui/Button';
import { Card } from '../ui/Card';
import { Progress } from '../ui/Progress';

const ROLE_LABELS = {
  owner: 'Propietario',
  planner: 'Planner',
  assistant: 'Asistente',
};

const STATUS_LABELS = {
  active: 'Activa',
  archived: 'Archivada',
};

const formatDate = (raw) => {
  if (!raw) return 'Sin fecha';
  try {
    const date = typeof raw === 'string' ? new Date(raw) : raw;
    if (Number.isNaN(date.getTime())) return 'Sin fecha';
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Sin fecha';
  }
};

const daysToEvent = (raw) => {
  const date = typeof raw === 'string' ? new Date(raw) : raw;
  if (!date || Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

export default function WeddingPortfolioTable({
  weddings,
  activeWeddingId,
  onSelectWedding,
  onToggleArchive,
  canArchive,
}) {
  if (!weddings.length) {
    return (
      <Card className="p-6 text-sm text-muted border border-dashed border-soft">
        No se encontraron bodas con los filtros seleccionados.
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-soft shadow-sm bg-[var(--color-surface)]">
      <table className="min-w-full text-sm">
        <thead className="bg-[var(--color-bg-soft,#f3f4f6)] uppercase text-xs text-muted tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left">Boda</th>
            <th className="px-4 py-3 text-left">Fecha</th>
            <th className="px-4 py-3 text-left">Ubicación</th>
            <th className="px-4 py-3 text-left">Rol</th>
            <th className="px-4 py-3 text-left">Progreso</th>
            <th className="px-4 py-3 text-left">Estado</th>
            <th className="px-4 py-3 text-left">Días</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-soft text-[color:var(--color-text,#111827)]">
          {weddings.map((wedding) => {
            const statusKey = wedding.active === false ? 'archived' : 'active';
            const days = daysToEvent(wedding.weddingDate);
            const isActive = wedding.id === activeWeddingId;
            const progressValue = Number.isFinite(wedding.progress) ? wedding.progress : 0;
            const canArchiveWedding = typeof canArchive === 'function' ? canArchive(wedding) : false;

            return (
              <tr
                key={wedding.id}
                className={isActive ? 'bg-rose-50/50' : ''}
              >
                <td className="px-4 py-3 font-medium">
                  <div className="flex flex-col">
                    <Link to={`/bodas/${wedding.id}`} className="text-primary hover:underline">
                      {wedding.name || 'Boda sin nombre'}
                    </Link>
                    <span className="text-xs text-muted">{wedding.id}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{formatDate(wedding.weddingDate)}</td>
                <td className="px-4 py-3">{wedding.location || '—'}</td>
                <td className="px-4 py-3">{ROLE_LABELS[wedding.role] || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <Progress value={progressValue} className="flex-1 h-2" />
                    <span className="text-xs font-medium">{progressValue}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                      statusKey === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {STATUS_LABELS[statusKey]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {typeof days === 'number' ? (
                    <span className={days < 0 ? 'text-amber-600 font-medium' : ''}>
                      {days >= 0 ? `${days} días` : `Hace ${Math.abs(days)} días`}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => onSelectWedding?.(wedding.id)}
                      disabled={isActive}
                    >
                      {isActive ? 'Seleccionada' : 'Seleccionar'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => onToggleArchive?.(wedding)}
                      disabled={!canArchiveWedding}
                    >
                      {wedding.active === false ? 'Restaurar' : 'Archivar'}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
