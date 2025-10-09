import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Harness ligero para validar el flujo de aceptación de presupuestos en E2E.
 * Consume endpoints mockeados por Cypress (`/api/mock/budgets/:wid/:sid` y PUT budget).
 */
const formatStatus = (code) => {
  if (!code) return 'Pendiente';
  const normalized = String(code).toLowerCase();
  switch (normalized) {
    case 'accepted':
      return 'Aceptado';
    case 'pending':
      return 'Pendiente';
    case 'rejected':
      return 'Rechazado';
    case 'sent':
      return 'Enviado';
    default:
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
};

export default function BudgetApprovalHarness() {
  const [searchParams] = useSearchParams();
  const { weddingId, supplierId } = useMemo(() => {
    return {
      weddingId: searchParams.get('w') || 'demo-wedding',
      supplierId: searchParams.get('s') || 'demo-supplier',
    };
  }, [searchParams]);

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadBudgets() {
      setLoading(true);
      setError('');
      setStatus('');
      try {
        const response = await fetch(
          `/api/mock/budgets/${encodeURIComponent(weddingId)}/${encodeURIComponent(supplierId)}`
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Formato inesperado');
        }
        if (active) {
          setBudgets(data);
        }
      } catch (err) {
        if (active) {
          setError(
            'No se pudieron cargar los presupuestos simulados. Revisa el stub del test E2E.'
          );
          setBudgets([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadBudgets();
    return () => {
      active = false;
    };
  }, [weddingId, supplierId]);

  const handleAccept = async (budget) => {
    if (!budget) return;
    setPendingId(budget.id);
    setError('');
    setStatus('');
    try {
      const response = await fetch(
        `/api/weddings/${encodeURIComponent(
          weddingId
        )}/suppliers/${encodeURIComponent(supplierId)}/budget`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'accept', id: budget.id }),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      const nextStatus = formatStatus(payload?.status || 'accepted');
      setStatus(nextStatus);
      setBudgets((prev) =>
        prev.map((item) =>
          item.id === budget.id
            ? { ...item, status: payload?.status || 'accepted', statusLabel: nextStatus }
            : item
        )
      );
    } catch (err) {
      setError('Ocurrió un error al aceptar el presupuesto simulado.');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="p-6 space-y-5" data-cy="budget-approval-harness">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Harness presupuestos proveedor</h1>
        <p className="text-sm text-gray-600">
          Boda: <strong>{weddingId}</strong> · Proveedor: <strong>{supplierId}</strong>
        </p>
      </header>

      {loading ? <p>Cargando presupuestos…</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}
      {status ? (
        <p className="text-green-600">
          Estado actualizado:&nbsp;
          <span className="font-semibold">{status}</span>
        </p>
      ) : null}

      <div className="space-y-3">
        {budgets.length === 0 && !loading ? (
          <p>No hay presupuestos pendientes.</p>
        ) : null}
        {budgets.map((budget) => (
          <article
            key={budget.id}
            className="rounded-md border border-gray-200 bg-white p-4 shadow-sm"
          >
            <h2 className="text-lg font-medium">{budget.description || 'Presupuesto sin nombre'}</h2>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 text-sm text-gray-700">
              <div>
                <dt className="font-semibold">Importe</dt>
                <dd>
                  {budget.amount} {budget.currency || 'EUR'}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Estado</dt>
                <dd className="capitalize">{budget.statusLabel || formatStatus(budget.status)}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => handleAccept(budget)}
              disabled={pendingId === budget.id}
            >
              {pendingId === budget.id ? 'Procesando…' : 'Aceptar presupuesto'}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
