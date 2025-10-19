import React from 'react';

import Button from '../ui/Button';
import Card from '../ui/Card';

export default function ShortlistBoard({
  groups = [],
  onPromote,
  onReview,
  onRemove,
  onApplySearch,
}) {
  if (!Array.isArray(groups) || groups.length === 0) {
    return (
      <Card className="border border-dashed border-[color:var(--color-text)]/15 bg-white/70 text-sm text-[color:var(--color-text)]/70">
        Aún no guardas candidatos. Usa la búsqueda con IA o añade enlaces manuales para construir tu shortlist inicial.
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {groups.map(({ service, items, total }) => (
        <Card key={service} className="border border-[color:var(--color-text)]/12 bg-white/85 shadow-sm">
          <header className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-[color:var(--color-text)]">
                {service}
              </h3>
              <p className="text-xs text-[color:var(--color-text)]/60">
                {total} candidato{total === 1 ? '' : 's'} guardado{total === 1 ? '' : 's'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onApplySearch?.(service)}
            >
              Reaplicar búsqueda
            </Button>
          </header>

          <div className="mt-3 space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-dashed border-[var(--color-primary)]/30 bg-white/60 px-3 py-2 text-sm text-[color:var(--color-text)]/80"
              >
                <header className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-[color:var(--color-text)]">
                      {item.name || 'Proveedor sugerido'}
                    </p>
                    <p className="text-xs text-[color:var(--color-text)]/55">
                      {item.location || 'Sin ubicación'} · Guardado: {formatDate(item.createdAt)}
                    </p>
                  </div>
                  {item.match != null && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                      Match {item.match}
                    </span>
                  )}
                </header>

                {item.notes && (
                  <p className="mt-2 text-sm text-[color:var(--color-text)]/75 line-clamp-3">
                    {item.notes}
                  </p>
                )}

                <footer className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="xs"
                    onClick={() => onPromote?.(item)}
                  >
                    Promover
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => onReview?.(item)}
                    disabled={!!item.reviewedAt}
                  >
                    {item.reviewedAt ? 'Revisado' : 'Marcar revisado'}
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => onRemove?.(item)}
                  >
                    Eliminar
                  </Button>
                </footer>
              </article>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

const formatDate = (value) => {
  if (!value) return '—';
  try {
    const date =
      typeof value?.toDate === 'function'
        ? value.toDate()
        : typeof value === 'string'
          ? new Date(value)
          : value instanceof Date
            ? value
            : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  } catch {
    return '—';
  }
};
