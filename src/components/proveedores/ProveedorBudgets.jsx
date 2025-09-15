import React from 'react';
import useSupplierBudgets from '../../hooks/useSupplierBudgets';
import Button from '../Button';
import Card from '../ui/Card';

/**
 * Listado de presupuestos de un proveedor con botones de aceptar/rechazar.
 * @param {{ supplierId: string }} props
 */
export default function ProveedorBudgets({ supplierId }) {
  const { budgets, loading, error, updateBudgetStatus } = useSupplierBudgets(supplierId);

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
            {b.status === 'pending' && (
              <div className="flex space-x-2">
                <Button size="sm" onClick={() => handleAction(b.id, 'accept')}>Aceptar</Button>
                <Button variant="outline" size="sm" onClick={() => handleAction(b.id, 'reject')}>Rechazar</Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
