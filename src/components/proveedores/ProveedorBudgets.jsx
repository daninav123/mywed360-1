import React from 'react';
import useProveedores from '../../hooks/useProveedores';

import useSupplierBudgets from '../../hooks/useSupplierBudgets';
import Button from '../Button';
import Card from '../ui/Card';

/**
 * Listado de presupuestos de un proveedor con botones de aceptar/rechazar.
 * @param {{ supplierId: string }} props
 */
export default function ProveedorBudgets({ supplierId }) {
  const { budgets, loading, error, updateBudgetStatus } = useSupplierBudgets(supplierId);
  const { providers = [] } = useProveedores();

  if (!supplierId) return null;
  if (loading) return <p className="text-sm text-gray-500">Cargando presupuestos…</p>;
  if (error) return <p className="text-sm text-red-600">Error: {error}</p>;
  if (!budgets.length) return <p className="text-sm text-gray-500">Sin presupuestos.</p>;

  const handleAction = async (budgetId, action) => {
    await updateBudgetStatus(budgetId, action);
  };

  return (
    <Card className="mt-4">
      <h3 className="text-lg font-medium mb-3">Presupuestos</h3>
      <ul className="space-y-2">
        {budgets.map((b) => (
          <li key={b.id} className="p-3 border rounded-md flex justify-between items-center">
            <div>
              <p className="font-medium">{b.description || 'Presupuesto'}</p>
              <p className="text-sm text-gray-600">
                {b.amount} {b.currency || '€'} — <span className="capitalize">{b.status}</span>
              </p>
            </div>
            <div className="flex space-x-2">
              {b.status === 'pending' && (
                <>
                  <Button size="sm" onClick={() => handleAction(b.id, 'accept')}>Aceptar</Button>
                  <Button variant="outline" size="sm" onClick={() => handleAction(b.id, 'reject')}>Rechazar</Button>
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
                        concept: `Presupuesto aceptado - ${(b.description || prov?.name || 'Proveedor')}`.slice(0, 80),
                        amount: amt,
                        date: (b.createdAt && String(b.createdAt).slice(0,10)) || new Date().toISOString().slice(0,10),
                        type: 'expense',
                        category: '',
                        description: `Desde presupuesto: ${b.description || ''}`,
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
                  Registrar en Finanzas
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
