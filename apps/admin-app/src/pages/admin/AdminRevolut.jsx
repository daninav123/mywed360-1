import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  Link as LinkIcon,
  RefreshCcw,
  Shield,
  Unplug,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';

import {
  DEFAULT_REVOLUT_ACCOUNT,
  disconnectRevolutAccount,
  getRevolutAccountOverview,
  refreshRevolutWebhooks,
  requestRevolutConnectLink,
  triggerRevolutSync,
} from '../../services/adminDataService';
import useTranslations from '../../hooks/useTranslations';

const formatCurrency = (value, currency = 'EUR', locale = 'es-ES') => {
  const amount = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat(locale || 'es-ES', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

const formatAbsoluteDate = (isoString, locale = 'es-ES') => {
  if (!isoString) return '—';
  try {
    const date = parseISO(isoString);
    return new Intl.DateTimeFormat(locale || 'es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return isoString;
  }
};

const formatRelativeDate = (isoString, locale = es, fallback = 'Nunca') => {
  if (!isoString) return fallback;
  try {
    return formatDistanceToNow(parseISO(isoString), {
      addSuffix: true,
      locale: locale || es,
    });
  } catch {
    return isoString || fallback;
  }
};

const AdminRevolut = () => {
  const [account, setAccount] = useState(DEFAULT_REVOLUT_ACCOUNT);
  const [statements, setStatements] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [refreshingWebhooks, setRefreshingWebhooks] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRevolutAccountOverview();
      setAccount(data?.account ?? DEFAULT_REVOLUT_ACCOUNT);
      setStatements(Array.isArray(data?.statements) ? data.statements : []);
      setTransfers(Array.isArray(data?.transfers) ? data.transfers : []);
      setMeta(data?.meta || null);
    } catch (err) {
      console.error('[AdminRevolut] Failed to load overview:', err);
      setError('No se pudo cargar la información de Revolut. Intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const lastSyncLabel = useMemo(() => formatRelativeDate(account.lastSync), [account.lastSync]);
  const showAttentionBox = account.requiresAction || account.pendingApprovals.length > 0;

  const handleSync = async () => {
    setSyncing(true);
    try {
      const data = await triggerRevolutSync();
      setAccount(data?.account ?? DEFAULT_REVOLUT_ACCOUNT);
      if (Array.isArray(data?.statements)) setStatements(data.statements);
      if (Array.isArray(data?.transfers)) setTransfers(data.transfers);
      setMeta((current) => data?.meta || current);
      toast.success('Sincronización con Revolut solicitada.');
    } catch (err) {
      console.error('[AdminRevolut] Sync failed:', err);
      toast.error('No se pudo solicitar la sincronización. Revisa los logs.');
    } finally {
      setSyncing(false);
    }
  };

  const handleRefreshWebhooks = async () => {
    setRefreshingWebhooks(true);
    try {
      const updated = await refreshRevolutWebhooks();
      setAccount(updated ?? DEFAULT_REVOLUT_ACCOUNT);
      toast.success('Webhooks rearmados correctamente.');
    } catch (err) {
      console.error('[AdminRevolut] Webhook refresh failed:', err);
      toast.error('No se pudo rearmar los webhooks de Revolut.');
    } finally {
      setRefreshingWebhooks(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('¿Seguro que deseas desvincular la cuenta de Revolut?')) return;
    setDisconnecting(true);
    try {
      const success = await disconnectRevolutAccount();
      if (success) {
        setAccount(DEFAULT_REVOLUT_ACCOUNT);
        setStatements([]);
        setTransfers([]);
        toast.success('Cuenta de Revolut desconectada.');
      } else {
        toast.warn('No se pudo desconectar la cuenta. Verifica el backend.');
      }
    } catch (err) {
      console.error('[AdminRevolut] Disconnect failed:', err);
      toast.error('Error al desconectar la cuenta de Revolut.');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const url = await requestRevolutConnectLink();
      if (url) {
        toast.info('Redirigiendo a Revolut para autorizar el acceso.');
        window.open(url, '_blank', 'noopener');
      } else {
        toast.warn('No se recibió enlace de autorización. Revisa el backend.');
      }
    } catch (err) {
      console.error('[AdminRevolut] Connect link failed:', err);
      toast.error('No se pudo solicitar el enlace de conexión.');
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-soft bg-surface px-4 py-6 text-sm text-[var(--color-text-soft,#6b7280)]">
        Cargando Revolut...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-[color:var(--color-primary,#6366f1)]" />
          <div>
            <h1 className="text-xl font-semibold">Revolut Business</h1>
            <p className="text-sm text-[var(--color-text-soft,#6b7280)]">
              Controla la cuenta de Revolut vinculada al proyecto: saldos, movimientos y acciones críticas.
            </p>
          </div>
        </div>
        {meta?.source && (
          <span className="text-xs text-[var(--color-text-soft,#6b7280)]">
            Origen de datos: {meta.source}
          </span>
        )}
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase text-[var(--color-text-soft,#6b7280)]">Estado</p>
            {account.connected ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            )}
          </div>
          <p className="mt-3 text-lg font-semibold">
            {account.connected ? 'Conectada' : 'No conectada'}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-soft,#6b7280)]">
            {account.businessName || 'Sin titular registrado'}
          </p>
        </article>
        <article className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
          <p className="text-xs uppercase text-[var(--color-text-soft,#6b7280)]">Saldo disponible</p>
          <p className="mt-3 text-2xl font-semibold">
            {formatCurrency(account.balance.available, account.balance.currency)}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-soft,#6b7280)]">
            Pendiente: {formatCurrency(account.balance.pending, account.balance.currency)}
          </p>
        </article>
        <article className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
          <p className="text-xs uppercase text-[var(--color-text-soft,#6b7280)]">Ultima sincronizacion</p>
          <p className="mt-3 text-lg font-semibold">{lastSyncLabel}</p>
          <p className="mt-1 text-xs text-[var(--color-text-soft,#6b7280)]">
            Estado: {account.lastSyncStatus || 'sin datos'}
          </p>
        </article>
        <article className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
          <p className="text-xs uppercase text-[var(--color-text-soft,#6b7280)]">Webhooks</p>
          <p className="mt-3 text-lg font-semibold">
            {account.webhookStatus === 'ok'
              ? 'Sin incidencias'
              : account.webhookStatus === 'unknown'
                ? 'Sin verificar'
                : account.webhookStatus}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-soft,#6b7280)] truncate">
            {account.webhookUrl || 'Sin URL registrada'}
          </p>
        </article>
      </section>

      <section className="rounded-xl border border-soft bg-surface shadow-sm p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Acciones rápidas</h2>
            <p className="text-xs text-[var(--color-text-soft,#6b7280)]">
              Gestiona la sincronización y el acceso desde este panel.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-md border border-soft px-3 py-2 text-sm hover:bg-[var(--color-bg-soft,#f3f4f6)] disabled:opacity-50"
            >
              <RefreshCcw className="h-4 w-4" />
              {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
            </button>
            <button
              type="button"
              onClick={handleRefreshWebhooks}
              disabled={!account.connected || refreshingWebhooks}
              className="inline-flex items-center gap-2 rounded-md border border-soft px-3 py-2 text-sm hover:bg-[var(--color-bg-soft,#f3f4f6)] disabled:opacity-50"
            >
              <LinkIcon className="h-4 w-4" />
              {refreshingWebhooks ? 'Rearmando...' : 'Rearmar webhooks'}
            </button>
            {account.connected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Unplug className="h-4 w-4" />
                {disconnecting ? 'Desconectando...' : 'Desvincular'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={connecting}
                className="inline-flex items-center gap-2 rounded-md bg-[color:var(--color-primary,#6366f1)] px-3 py-2 text-sm font-medium text-[color:var(--color-on-primary,#ffffff)] hover:bg-[color:var(--color-primary-dark,#4f46e5)] disabled:opacity-50"
              >
                <ExternalLink className="h-4 w-4" />
                {connecting ? 'Abriendo Revolut...' : 'Conectar cuenta'}
              </button>
            )}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-soft p-4">
            <h3 className="text-sm font-semibold">Limites</h3>
            <dl className="mt-3 space-y-2 text-xs text-[var(--color-text-soft,#6b7280)]">
              <div className="flex justify-between">
                <dt>Diario</dt>
                <dd>
                  {formatCurrency(account.limits?.daily?.used, account.limits?.daily?.currency)} /{' '}
                  {formatCurrency(account.limits?.daily?.limit, account.limits?.daily?.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Mensual</dt>
                <dd>
                  {formatCurrency(account.limits?.monthly?.used, account.limits?.monthly?.currency)} /{' '}
                  {formatCurrency(account.limits?.monthly?.limit, account.limits?.monthly?.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Auto-sync</dt>
                <dd>{account.autoSyncEnabled ? 'Activo' : 'Desactivado'}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-lg border border-soft p-4">
            <h3 className="text-sm font-semibold">Pendientes</h3>
            {showAttentionBox ? (
              <ul className="mt-3 space-y-2 text-xs text-[var(--color-text-soft,#6b7280)]">
                {account.requiresAction && (
                  <li className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    Revolut solicita acción manual en el dashboard.
                  </li>
                )}
                {account.pendingApprovals.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-[var(--color-text-soft,#6b7280)]">Sin tareas pendientes.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-soft bg-surface shadow-sm">
        <header className="flex items-center justify-between border-b border-soft px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Movimientos recientes</h2>
            <p className="text-xs text-[var(--color-text-soft,#6b7280)]">
              Últimas transferencias sincronizadas desde Revolut Business.
            </p>
          </div>
          <span className="text-xs text-[var(--color-text-soft,#6b7280)]">
            Total: {transfers.length}
          </span>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-soft text-sm">
            <thead className="bg-[var(--color-bg-soft,#f3f4f6)] text-xs uppercase text-[var(--color-text-soft,#6b7280)]">
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Concepto</th>
                <th className="px-4 py-3 text-left">Contraparte</th>
                <th className="px-4 py-3 text-right">Importe</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soft">
              {transfers.map((transfer) => (
                <tr key={transfer.id || `${transfer.createdAt}-${transfer.reference}`}>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-soft,#6b7280)]">
                    {formatAbsoluteDate(transfer.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {transfer.direction === 'in' ? (
                        <ArrowDownBadge />
                      ) : (
                        <ArrowUpBadge />
                      )}
                      <span>{transfer.reference || 'Sin referencia'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-soft,#6b7280)]">
                    {transfer.counterparty}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(
                      transfer.amount,
                      transfer.currency || account.balance.currency,
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs uppercase text-[var(--color-text-soft,#6b7280)]">
                    {transfer.status}
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-[var(--color-text-soft,#6b7280)]"
                  >
                    Sin movimientos registrados en la última sincronización.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-soft bg-surface shadow-sm">
        <header className="flex items-center justify-between border-b border-soft px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Extractos</h2>
            <p className="text-xs text-[var(--color-text-soft,#6b7280)]">
              Descarga de extractos mensuales para conciliación y reporting.
            </p>
          </div>
          <Download className="h-4 w-4 text-[color:var(--color-primary,#6366f1)]" />
        </header>
        <div className="divide-y divide-soft text-sm">
          {statements.map((statement) => (
            <article key={statement.id || statement.period} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium">
                  {statement.period || statement.id || 'Periodo sin especificar'}
                </p>
                <p className="text-xs text-[var(--color-text-soft,#6b7280)]">
                  Generado {formatAbsoluteDate(statement.createdAt)} · Estado {statement.status}
                </p>
              </div>
              {statement.downloadUrl ? (
                <a
                  href={statement.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-soft px-3 py-2 text-xs hover:bg-[var(--color-bg-soft,#f3f4f6)]"
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </a>
              ) : (
                <span className="text-xs text-[var(--color-text-soft,#6b7280)]">
                  No disponible
                </span>
              )}
            </article>
          ))}
          {statements.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-[var(--color-text-soft,#6b7280)]">
              Aún no se han sincronizado extractos desde Revolut.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const ArrowUpBadge = () => (
  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-600">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <path d="M5 12l7-7 7 7" />
      <path d="M12 19V5" />
    </svg>
  </span>
);

const ArrowDownBadge = () => (
  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <path d="M19 12l-7 7-7-7" />
      <path d="M12 5v14" />
    </svg>
  </span>
);

export default AdminRevolut;
