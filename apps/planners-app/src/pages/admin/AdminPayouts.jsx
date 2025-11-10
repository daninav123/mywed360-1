import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';

import { commitCommercePayouts, getCommercePayoutPreview } from '../../services/adminDataService';

const formatCurrency = (value, currency = 'EUR') => {
  try {
    const amount = Number(value) || 0;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return String(value ?? 0) + ' ' + (currency || 'EUR');
  }
};

const formatDateTime = (iso) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
};

const defaultMonthValue = () => {
  const now = new Date();
  return String(now.getFullYear()) + '-' + String(now.getMonth() + 1).padStart(2, '0');
};

const AdminPayouts = () => {
  const [period, setPeriod] = useState(defaultMonthValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [commitError, setCommitError] = useState('');

  const loadPreview = async (targetPeriod = period, options = {}) => {
    if (!targetPeriod) return;
    const resetCommit = options?.resetCommit !== false;
    if (resetCommit) {
      setCommitMessage('');
      setCommitError('');
    }
    setLoading(true);
    setError('');
    try {
      const payload = await getCommercePayoutPreview(targetPeriod);
      setData(payload);
    } catch (err) {
      console.error('[AdminPayouts] Failed to load preview:', err);
      setError(err?.message || 'No se pudo generar la prevision.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreview(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCommit = async () => {
    if (!period || saving) return;
    setCommitMessage('');
    setCommitError('');
    try {
      setSaving(true);
      const response = await commitCommercePayouts(period);
      const versionLabel = response?.version ? ` (versión ${response.version})` : '';
      const periodLabel = response?.period?.label || data?.period?.label || period;
      setCommitMessage(`Liquidación guardada${versionLabel} para ${periodLabel}.`);
      await loadPreview(period, { resetCommit: false });
    } catch (err) {
      console.error('[AdminPayouts] Failed to commit payouts:', err);
      setCommitError(err?.message || 'No se pudo guardar la liquidación.');
    } finally {
      setSaving(false);
    }
  };

  const totals = data?.totals ?? [];
  const payouts = data?.payouts ?? [];
  const managers = data?.managers ?? [];
  const warnings = data?.warnings ?? {};

  const hasWarnings = useMemo(() => {
    if (!warnings) return false;
    return Boolean(
      (warnings.missingCommissionRules && warnings.missingCommissionRules.length) ||
        (warnings.missingAssignedContacts && warnings.missingAssignedContacts.length) ||
        (warnings.currencyMismatch && warnings.currencyMismatch.length) ||
        (warnings.discountsWithoutPayments && warnings.discountsWithoutPayments.length) ||
        (warnings.managersMissingRules && warnings.managersMissingRules.length) ||
        warnings.needsIndex ||
        warnings.unmatchedPayments,
    );
  }, [warnings]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Pagos Comerciales</h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Genera la prevision mensual de comisiones para comerciales, jefes de comerciales e influencers antes de ejecutar pagos automaticos en Revolut.
          </p>
          {data?.period?.label && (
            <p className="mt-1 text-xs text-slate-400">
              Periodo evaluado: <strong>{data.period.label}</strong>
            </p>
          )}
          {data?.generatedAt && (
            <p className="text-xs text-slate-400">
              Generado el {formatDateTime(data.generatedAt)}
            </p>
          )}
        </div>
        <form
          className="flex flex-col sm:flex-row sm:items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            loadPreview(period);
          }}
        >
          <label className="flex flex-col text-sm font-medium text-slate-700">
            Periodo
            <input
              type="month"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring focus:ring-indigo-200"
            />
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          >
            <RefreshCcw size={16} />
            {loading ? 'Actualizando...' : 'Regenerar'}
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleCommit}
            disabled={loading || saving || !data}
          >
            {saving ? 'Guardando...' : 'Guardar liquidación'}
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {commitMessage && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {commitMessage}
        </div>
      )}

      {commitError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {commitError}
        </div>
      )}

      {loading && (
        <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Calculando comisiones y pagos...
        </div>
      )}

      {!loading && data && (
        <div className="space-y-6">
          {totals.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-800">Resumen por moneda</h2>
                <p className="text-xs text-slate-500">Importes agregados de comisiones y ventas.</p>
              </div>
              <div className="px-6 py-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Moneda</th>
                      <th className="px-3 py-2">Ingresos vinculados</th>
                      <th className="px-3 py-2">Comision estimada</th>
                      <th className="px-3 py-2">Beneficiarios</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {totals.map((item) => (
                      <tr key={item.currency}>
                        <td className="px-3 py-2 font-medium text-slate-700">{item.currency}</td>
                        <td className="px-3 py-2 text-slate-600">{formatCurrency(item.revenue, item.currency)}</td>
                        <td className="px-3 py-2 text-slate-600">{formatCurrency(item.commission, item.currency)}</td>
                        <td className="px-3 py-2 text-slate-600">{item.beneficiaries}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-800">Comerciales</h2>
              <p className="text-xs text-slate-500">Detalle de comisiones por comercial y codigos asociados.</p>
            </div>
            <div className="px-6 py-4 overflow-x-auto">
              {payouts.length === 0 ? (
                <p className="text-sm text-slate-500">No hay comisiones calculadas para el periodo seleccionado.</p>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Beneficiario</th>
                      <th className="px-3 py-2">Rol</th>
                      <th className="px-3 py-2">Moneda</th>
                      <th className="px-3 py-2">Ingresos</th>
                      <th className="px-3 py-2">Comision</th>
                      <th className="px-3 py-2">Pagos evaluados</th>
                      <th className="px-3 py-2">Codigos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payouts.map((entry) => {
NaN
                      return (
                        <tr key={beneficiaryKey}>
                          <td className="px-3 py-2">
                            <div className="font-medium text-slate-800">{entry.beneficiary.name}</div>
                            {entry.beneficiary.email && (
                              <div className="text-xs text-slate-500">{entry.beneficiary.email}</div>
                            )}
                          </td>
                          <td className="px-3 py-2 capitalize text-slate-600">{entry.beneficiary.role}</td>
                          <td className="px-3 py-2 text-slate-600">{entry.currency}</td>
                          <td className="px-3 py-2 text-slate-600">{formatCurrency(entry.totals.revenue, entry.currency)}</td>
                          <td className="px-3 py-2 text-slate-800 font-semibold">{formatCurrency(entry.totals.commission, entry.currency)}</td>
                          <td className="px-3 py-2 text-slate-600">{entry.paymentsEvaluated ?? entry.totals.payments}</td>
                          <td className="px-3 py-2 text-slate-600">
                            <details>
                              <summary className="cursor-pointer text-xs text-indigo-600 hover:underline">
                                {entry.discounts.length} codigo(s)
                              </summary>
                              <ul className="mt-2 space-y-1 text-xs">
                                {entry.discounts.map((discount) => (
                                  <li key={discount.id} className="rounded bg-slate-50 px-2 py-1">
                                    <div className="font-medium text-slate-700">{discount.code}</div>
                                    <div className="flex flex-wrap gap-2 text-slate-500">
                                      <span>Ingresos: {formatCurrency(discount.revenue, entry.currency)}</span>
                                      <span>Comision: {formatCurrency(discount.commission, entry.currency)}</span>
                                      <span>Pagos: {discount.payments}</span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </details>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-800">Jefes de comerciales</h2>
              <p className="text-xs text-slate-500">Comisiones calculadas a partir de los pagos asignados a sus equipos.</p>
            </div>
            <div className="px-6 py-4 overflow-x-auto">
              {managers.length === 0 ? (
                <p className="text-sm text-slate-500">No se han encontrado managers o no hay reglas configuradas.</p>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Manager</th>
                      <th className="px-3 py-2">Moneda</th>
                      <th className="px-3 py-2">Ingresos del equipo</th>
                      <th className="px-3 py-2">Comision</th>
                      <th className="px-3 py-2">Pagos evaluados</th>
                      <th className="px-3 py-2">Estado reglas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {managers.map((manager) => {
                      const managerKey = (manager.manager.id || manager.manager.email || manager.currency || Math.random()).toString();
                      return (
                        <tr key={managerKey}>
                          <td className="px-3 py-2">
                            <div className="font-medium text-slate-800">{manager.manager.name}</div>
                            {manager.manager.email && (
                              <div className="text-xs text-slate-500">{manager.manager.email}</div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{manager.currency}</td>
                          <td className="px-3 py-2 text-slate-600">{formatCurrency(manager.totals.revenue, manager.currency)}</td>
                          <td className="px-3 py-2 text-slate-800 font-semibold">{formatCurrency(manager.totals.commission, manager.currency)}</td>
                          <td className="px-3 py-2 text-slate-600">{manager.paymentsEvaluated ?? manager.totals.payments}</td>
                          <td className="px-3 py-2 text-slate-600">
                            {manager.hasRules ? (
                              <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                                Configurado
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                Falta configurar
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {hasWarnings && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800 shadow-sm">
              <h3 className="text-base font-semibold">Avisos detectados</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {warnings.needsIndex && <li>Se requiere crear indices adicionales en Firestore para optimizar la consulta de pagos.</li>}
                {warnings.unmatchedPayments ? <li>{warnings.unmatchedPayments} pago(s) sin codigo de descuento asociado durante el periodo.</li> : null}
                {warnings.missingCommissionRules?.length ? <li>{warnings.missingCommissionRules.length} codigo(s) sin reglas de comision configuradas.</li> : null}
                {warnings.missingAssignedContacts?.length ? <li>{warnings.missingAssignedContacts.length} codigo(s) sin comercial asignado.</li> : null}
                {warnings.currencyMismatch?.length ? <li>{warnings.currencyMismatch.length} codigo(s) con discrepancias de moneda entre pagos y configuracion.</li> : null}
                {warnings.discountsWithoutPayments?.length ? <li>{warnings.discountsWithoutPayments.length} codigo(s) sin pagos registrados en el periodo.</li> : null}
                {warnings.managersMissingRules?.length ? <li>{warnings.managersMissingRules.length} manager(s) sin reglas de comision definidas.</li> : null}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPayouts;
