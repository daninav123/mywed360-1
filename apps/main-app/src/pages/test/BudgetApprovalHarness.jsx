import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Test harness para probar el flujo de aprobación de presupuestos
 * Este componente simula el flujo completo sin necesidad de configurar toda la app
 */
function BudgetApprovalHarness() {
  const [budgets, setBudgets] = useState([
    {
      id: 'budget-1',
      supplierId: 'supplier-1',
      supplierName: 'Catering Gourmet',
      service: 'Catering',
      amount: 5000,
      status: 'pending',
      description: 'Menú para 100 personas',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'budget-2',
      supplierId: 'supplier-2',
      supplierName: 'Fotografía Pro',
      service: 'Fotografía',
      amount: 2500,
      status: 'pending',
      description: 'Cobertura completa del evento',
      createdAt: new Date().toISOString(),
    },
  ]);

  const handleAccept = (budgetId) => {
    setBudgets((prev) =>
      prev.map((b) => (b.id === budgetId ? { ...b, status: 'accepted' } : b))
    );
  };

  const handleReject = (budgetId) => {
    setBudgets((prev) =>
      prev.map((b) => (b.id === budgetId ? { ...b, status: 'rejected' } : b))
    );
  };

  return (
    <div className="p-8 max-w-4xl mx-auto" data-testid="budget-approval-harness">
      <h1 className="text-2xl font-bold mb-6">Presupuestos Pendientes</h1>
      
      <div className="space-y-4">
        {budgets.map((budget) => (
          <div
            key={budget.id}
            data-testid={`budget-${budget.id}`}
            className="border rounded-lg p-4 bg-white shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-lg">{budget.supplierName}</h3>
                <p className="text-sm text-gray-600">{budget.service}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{budget.amount}€</p>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    budget.status === 'accepted'
                      ? 'bg-green-100 text-green-800'
                      : budget.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {budget.status === 'accepted'
                    ? 'Aceptado'
                    : budget.status === 'rejected'
                      ? 'Rechazado'
                      : 'Pendiente'}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-4">{budget.description}</p>
            
            {budget.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  data-testid={`accept-${budget.id}`}
                  onClick={() => handleAccept(budget.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Aceptar
                </button>
                <button
                  data-testid={`reject-${budget.id}`}
                  onClick={() => handleReject(budget.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Rechazar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Resumen</h2>
        <p data-testid="summary-pending">
          Pendientes: {budgets.filter((b) => b.status === 'pending').length}
        </p>
        <p data-testid="summary-accepted">
          Aceptados: {budgets.filter((b) => b.status === 'accepted').length}
        </p>
        <p data-testid="summary-rejected">
          Rechazados: {budgets.filter((b) => b.status === 'rejected').length}
        </p>
      </div>
    </div>
  );
}

export default BudgetApprovalHarness;
