import React from 'react';
import useProveedores from '../../hooks/useProveedores';

import useSupplierBudgets from '../../hooks/useSupplierBudgets';
import Button from '../Button';
import Card from '../ui/Card';
import useTranslations from '../../hooks/useTranslations';

/**
 * Listado de presupuestos de un proveedor con botones de aceptar/rechazar.
 * @param {{ supplierId: string }} props
 */
export default function ProveedorBudgets({ supplierId }) {
  const { budgets, loading, error, updateBudgetStatus } = useSupplierBudgets(supplierId);
  const { providers = [] } = useProveedores();
  const { t } = useTranslations();

  if (!supplierId) return null;
  if (loading) return <p className="text-sm text-gray-500">{t('suppliers.budgets.loading')}</p>;
  if (error)
    return (
      <p className="text-sm text-red-600">
        {t('suppliers.budgets.error', { message: error })}
      </p>
    );
  if (!budgets.length)
    return <p className="text-sm text-gray-500">{t('suppliers.budgets.empty')}</p>;

  const handleAction = async (budgetId, action) => {
    await updateBudgetStatus(budgetId, action);
  };

  const statusLabelMap = {
    pending: t('suppliers.budgets.status.pending'),
    accepted: t('suppliers.budgets.status.accepted'),
    rejected: t('suppliers.budgets.status.rejected'),
    submitted: t('suppliers.budgets.status.submitted'),
  };

  return (
    <Card className="mt-4">
      <h3 className="text-lg font-medium mb-3">
        {t('suppliers.budgets.title')}
      </h3>
      <ul className="space-y-2">
        {budgets.map((b) => {
          const isPortal = String(b.source || '').toLowerCase() === 'portal';
          const statusLabel =
            statusLabelMap[b.status] || b.status || t('suppliers.budgets.status.unknown');
          return (
            <li key={b.id} className="p-3 border rounded-md flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {b.description || t('suppliers.budgets.defaultDescription')}
                  </p>
                  {isPortal && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      {t('suppliers.budgets.portalTag')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {b.amount} {b.currency || '€'} —{' '}
                  <span className={`capitalize ${isPortal ? 'text-indigo-600' : ''}`}>{statusLabel}</span>
                </p>
                {isPortal && b.status === 'submitted' && (
                  <p className="text-xs text-indigo-600 mt-1">
                    {t('suppliers.budgets.portalPendingReview')}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                {b.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => handleAction(b.id, 'accept')}>
                      {t('suppliers.budgets.buttons.accept')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(b.id, 'reject')}
                    >
                      {t('suppliers.budgets.buttons.reject')}
                    </Button>
                  </>
                )}
                {b.status === 'accepted' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      try {
                        const prov = (providers || []).find((p) => String(p.id) === String(supplierId));
                        const normalizeAmount = (val) => {
                          try {
                            const s = String(val ?? '').replace(/[^0-9.,]/g, '').trim();
                            if (!s) return '';
                            const lastComma = s.lastIndexOf(',');
                            const lastDot = s.lastIndexOf('.');
                            let normalized = s;
                            if (lastComma > lastDot) normalized = s.replace(/\./g, '').replace(',', '.');
                            else if (lastDot > lastComma) normalized = s.replace(/,/g, '');
                            return String(parseFloat(normalized) || '');
                          } catch { return ''; }
                        };
                        const amt = normalizeAmount(b.amount);
                        const prefill = {
                          concept: t('suppliers.budgets.prefillConcept', {
                            name: b.description || prov?.name || t('suppliers.list.contractFallback'),
                          }).slice(0, 80),
                          amount: amt,
                          date: (b.createdAt && String(b.createdAt).slice(0,10)) || new Date().toISOString().slice(0,10),
                          type: 'expense',
                          category: '',
                          description: t('suppliers.budgets.prefillDescription', {
                            description: b.description || '',
                          }),
                          provider: prov?.name || '',
                          status: 'expected',
                          paidAmount: '',
                        };
                        if (typeof window !== 'undefined') {
                          try { window.history.pushState({ prefillTransaction: prefill }, '', '/finance#nuevo'); } catch {}
                          window.location.assign('/finance#nuevo');
                        }
                      } catch {}
                    }}
                  >
                    {t('suppliers.budgets.buttons.registerFinance')}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
