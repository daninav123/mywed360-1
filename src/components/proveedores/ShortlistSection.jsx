import React from 'react';

import ShortlistBoard from './ShortlistBoard';
import Card from '../ui/Card';

function ShortlistSection({
  loading = false,
  error = null,
  groups = [],
  total = 0,
  onPromote,
  onReview,
  onRemove,
  onApplySearch,
}) {
  const hasShortlist = total > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-body">Shortlist guardada</h3>
          <p className="text-sm text-muted">
            {hasShortlist
              ? `${total} candidato${total === 1 ? '' : 's'} pendientes de decidir.`
              : 'Guarda candidatos desde la busqueda o anade enlaces manuales para crear tu shortlist.'}
          </p>
        </div>
      </div>

      {loading ? (
        <Card className="border border-soft bg-surface text-sm text-muted">
          Cargando shortlist...
        </Card>
      ) : error ? (
        <Card className="border border-danger bg-danger-soft text-sm text-danger">
          {error?.message || 'No se pudo cargar la shortlist.'}
        </Card>
      ) : (
        <ShortlistBoard
          groups={groups}
          onPromote={onPromote}
          onReview={onReview}
          onRemove={onRemove}
          onApplySearch={onApplySearch}
        />
      )}
    </div>
  );
}

export default ShortlistSection;

