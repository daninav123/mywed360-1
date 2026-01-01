import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { Loader2, RefreshCw, Search, Filter } from 'lucide-react';

import {
  DEFAULT_SUPPLIER_ANALYTICS,
  DEFAULT_SUPPLIER_LIST,
  getAdminSupplierAnalytics,
  getAdminSupplierList,
} from '../../services/adminDataService';

const numberFormatter = new Intl.NumberFormat('es-ES');
const formatNumber = (value) => numberFormatter.format(Number(value || 0));
const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  try {
    return date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return date.toLocaleString();
  }
};

const badgeClasses = {
  base: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
  success: 'border-green-200 bg-green-100 text-green-700',
  warning: 'border-amber-200 bg-amber-100 text-amber-700',
  info: 'border-blue-200 bg-blue-100 text-blue-700',
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
  danger: 'border-red-200 bg-red-100 text-red-700',
};

const StatusBadge = ({ status, t }) => {
  const normalized = String(status || '').toLowerCase();
  let tone = 'neutral';
  if (['confirmado', 'contratado', 'seleccionado'].some((s) => normalized.includes(s))) tone = 'success';
  else if (['contactado', 'pendiente', 'descubierto'].some((s) => normalized.includes(s))) tone = 'info';
  else if (['descartado', 'rechazado', 'perdido'].some((s) => normalized.includes(s))) tone = 'danger';
  return <span className={`${badgeClasses.base} ${badgeClasses[tone]}`}>{status || t('admin:suppliers.badges.noStatus')}</span>;
};

const PortalBadge = ({ status, t }) => {
  const mapping = {
    responded: { label: t('admin:suppliers.badges.responded'), tone: 'success' },
    pending: { label: t('admin:suppliers.badges.pending'), tone: 'warning' },
    disabled: { label: t('admin:suppliers.badges.withoutPortal'), tone: 'neutral' },
  };
  const info = mapping[String(status).toLowerCase()] || mapping.disabled;
  return (
    <span className={`${badgeClasses.base} ${badgeClasses[info.tone]}`}>
      {info.label}
    </span>
  );
};

const KPICard = ({ title, value, subtitle, tone = 'neutral' }) => {
  const palette = {
    neutral: 'bg-surface',
    primary: 'bg-[color:var(--color-primary-10)] text-[color:var(--color-primary)]',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className={`rounded-xl border border-soft px-4 py-3 ${palette[tone] || palette.neutral}`}>
      <p className="text-xs uppercase tracking-wide text-[color:var(--color-text-soft)]">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-[color:var(--color-text)]">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-[color:var(--color-text-soft)]">{subtitle}</p>}
    </div>
  );
};

const EmptyState = ({ title, description }) => (
  <div className="rounded-xl border border-dashed border-soft bg-surface px-6 py-12 text-center text-sm text-[color:var(--color-text-soft)]">
    <h3 className="text-base font-medium text-[color:var(--color-text)]">{title}</h3>
    <p className="mt-2">{description}</p>
  </div>
);

const AdminSuppliers = () => {
  const { t } = useTranslation(['admin']);
  const [analytics, setAnalytics] = useState(DEFAULT_SUPPLIER_ANALYTICS);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState('');
  const [listData, setListData] = useState(DEFAULT_SUPPLIER_LIST);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    service: 'all',
    city: 'all',
    portal: 'all',
    registered: false,
  });
  const [searchDraft, setSearchDraft] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    setSearchDraft(filters.search || '');
  }, [filters.search]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError('');
    try {
      const data = await getAdminSupplierAnalytics({ topLimit: 8 });
      setAnalytics(data);
    } catch (error) {
      // console.error('[AdminSuppliers] analytics error', error);
      setAnalytics(DEFAULT_SUPPLIER_ANALYTICS);
      setAnalyticsError(t('admin:suppliers.errors.loadAnalytics'));
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      const data = await getAdminSupplierList({ ...filters, limit: 150 });
      setListData(data);
    } catch (error) {
      // console.error('[AdminSuppliers] list error', error);
      setListData(DEFAULT_SUPPLIER_LIST);
      setListError(t('admin:suppliers.errors.loadList'));
    } finally {
      setListLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics, refreshToken]);

  useEffect(() => {
    loadList();
  }, [loadList, refreshToken]);

  const handleRefresh = () => setRefreshToken((prev) => prev + 1);

  const handleFilterChange = (key) => (event) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegisteredToggle = (event) => {
    const checked = event.target.checked;
    setFilters((prev) => ({ ...prev, registered: checked }));
  };

  const applySearch = () => {
    setFilters((prev) => {
      if ((prev.search || '') === (searchDraft || '')) return prev;
      return { ...prev, search: searchDraft.trim() };
    });
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      service: 'all',
      city: 'all',
      portal: 'all',
      registered: false,
    });
  };

  const statusOptions = useMemo(() => {
    const base = [{ value: 'all', label: t('admin:suppliers.filters.allStatuses') }];
    const facets = listData.allFacets?.status || [];
    return base.concat(
      facets.map((facet) => ({
        value: facet.value.toLowerCase(),
        label: `${facet.value} (${formatNumber(facet.count)})`,
      })),
    );
  }, [listData.allFacets?.status]);

  const serviceOptions = useMemo(() => {
    const base = [{ value: 'all', label: t('admin:suppliers.filters.allServices') }];
    const facets = listData.allFacets?.service || [];
    return base.concat(
      facets.map((facet) => ({
        value: facet.value.toLowerCase(),
        label: `${facet.value} (${formatNumber(facet.count)})`,
      })),
    );
  }, [listData.allFacets?.service]);

  const cityOptions = useMemo(() => {
    const base = [{ value: 'all', label: t('admin:suppliers.filters.allLocations') }];
    const facets = listData.allFacets?.city || [];
    return base.concat(
      facets.map((facet) => ({
        value: facet.value.toLowerCase(),
        label: `${facet.value} (${formatNumber(facet.count)})`,
      })),
    );
  }, [listData.allFacets?.city]);

  const portalOptions = useMemo(() => {
    const baseCounts = listData.allFacets?.portal || [];
    const getCount = (code) =>
      baseCounts.find((item) => String(item.value).toLowerCase() === code)?.count || 0;
    const responded = getCount('responded');
    const pending = getCount('pending');
    const disabled = getCount('disabled');
    const enabled = responded + pending;

    return [
      { value: 'all', label: t('admin:suppliers.filters.allPortalStatuses') },
      { value: 'enabled', label: t('admin:suppliers.filters.withPortal', { count: formatNumber(enabled) }) },
      { value: 'responded', label: t('admin:suppliers.filters.responded', { count: formatNumber(responded) }) },
      { value: 'pending', label: t('admin:suppliers.filters.pending', { count: formatNumber(pending) }) },
      { value: 'disabled', label: t('admin:suppliers.filters.withoutPortal', { count: formatNumber(disabled) }) },
    ];
  }, [listData.allFacets?.portal]);

  const supplierItems = useMemo(() => listData.items || [], [listData.items]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[color:var(--color-text)]">{t('admin:suppliers.title')}</h1>
          <p className="text-sm text-[color:var(--color-text-soft)]">
            {t('admin:suppliers.description')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-md border border-soft bg-surface px-3 py-2 text-sm font-medium text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-soft)]"
          >
            <Filter size={16} />
            {t('admin:suppliers.clearFilters')}
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-md border border-soft bg-surface px-3 py-2 text-sm font-medium text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-soft)]"
          >
            {analyticsLoading || listLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw size={16} />}
            {t('admin:suppliers.refresh')}
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICard
          title={t('admin:suppliers.kpi.totalSuppliers')}
          value={formatNumber(analytics.totals.suppliers)}
          subtitle={t('admin:suppliers.kpi.weddingsLinked', { count: formatNumber(analytics.totals.weddings) })}
          tone="primary"
        />
        <KPICard
          title={t('admin:suppliers.kpi.averageScore')}
          value={formatNumber(analytics.score.average)}
          subtitle={t('admin:suppliers.kpi.scoreDescription')}
        />
        <KPICard
          title={t('admin:suppliers.kpi.portalResponded')}
          value={formatNumber(analytics.portal.responded)}
          subtitle={t('admin:suppliers.kpi.portalStats', { pending: formatNumber(analytics.portal.pending), enabled: formatNumber(analytics.portal.enabled) })}
          tone="success"
        />
        <KPICard
          title={t('admin:suppliers.kpi.verified')}
          value={formatNumber(listData.summary.registered)}
          subtitle={t('admin:suppliers.kpi.inDiscovery', { count: formatNumber(listData.summary.cached) })}
          tone="warning"
        />
      </section>

      {analyticsError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {analyticsError}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-xl border border-soft bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[color:var(--color-text)]">{t('admin:suppliers.charts.scoreDistribution')}</h2>
            {analyticsLoading && <Loader2 className="h-4 w-4 animate-spin text-[color:var(--color-text-soft)]" />}
          </div>
          <div className="h-56">
            {analytics.score.distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.score.distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip formatter={(value) => formatNumber(value)} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title={t('admin:suppliers.charts.noData')}
                description={t('admin:suppliers.charts.noDataDescription')}
              />
            )}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-soft bg-surface p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[color:var(--color-text)]">{t('admin:suppliers.charts.operationalStatus')}</h2>
            {analyticsLoading && <Loader2 className="h-4 w-4 animate-spin text-[color:var(--color-text-soft)]" />}
          </div>
          <ul className="space-y-3 text-sm">
            {analytics.statusBreakdown.length > 0 ? (
              analytics.statusBreakdown.map((item) => (
                <li key={item.status} className="flex items-center justify-between">
                  <span>{item.status}</span>
                  <span className="text-[color:var(--color-text-soft)]">
                    {formatNumber(item.count)} · {formatPercent(item.percentage)}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-[color:var(--color-text-soft)]">{t('admin:suppliers.charts.noRecordsRegistered')}</li>
            )}
          </ul>
          <div className="border-t border-soft pt-3 text-sm">
            <p className="font-medium text-[color:var(--color-text)]">{t('admin:suppliers.charts.supplierPortal')}</p>
            <p className="text-[color:var(--color-text-soft)]">
              {t('admin:suppliers.charts.formsResponded', { count: formatNumber(analytics.portal.responded) })} · {t('admin:suppliers.charts.pending', { count: formatNumber(analytics.portal.pending) })}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-soft bg-surface p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[color:var(--color-text)]">{t('admin:suppliers.charts.bestCoveredServices')}</h2>
          {analyticsLoading && <Loader2 className="h-4 w-4 animate-spin text-[color:var(--color-text-soft)]" />}
        </div>
        {analytics.serviceStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-soft text-left text-xs uppercase text-[color:var(--color-text-soft)]">
                  <th className="px-3 py-2">{t('admin:suppliers.table.service')}</th>
                  <th className="px-3 py-2 text-right">{t('admin:suppliers.table.suppliers')}</th>
                  <th className="px-3 py-2 text-right">{t('admin:suppliers.table.averageScore')}</th>
                  <th className="px-3 py-2 text-right">{t('admin:suppliers.table.averageMatch')}</th>
                  <th className="px-3 py-2 text-right">{t('admin:suppliers.table.hired')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft">
                {analytics.serviceStats.slice(0, 8).map((service) => (
                  <tr key={service.service}>
                    <td className="px-3 py-2 font-medium text-[color:var(--color-text)]">{service.service}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(service.total)}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(service.averageScore)}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(service.averageMatch)}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(service.hired)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={t('admin:suppliers.charts.noServiceMetrics')}
            description={t('admin:suppliers.charts.noServiceMetricsDescription')}
          />
        )}
      </section>

      <section className="rounded-xl border border-soft bg-surface p-4 space-y-4">
        <h2 className="text-sm font-semibold text-[color:var(--color-text)]">{t('admin:suppliers.filters.title')}</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-medium text-[color:var(--color-text-soft)]">{t('admin:suppliers.filters.searchSupplier')}</label>
            <div className="flex rounded-md border border-soft bg-surface focus-within:ring-2 focus-within:ring-[color:var(--color-primary)]">
              <input
                type="text"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') applySearch();
                }}
                placeholder={t('admin:suppliers.filters.searchPlaceholder')}
                className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={applySearch}
                className="flex items-center gap-1 border-l border-soft px-3 text-sm text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-soft)]"
              >
                <Search size={16} />
                {t('admin:suppliers.filters.search')}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[color:var(--color-text-soft)]">{t('admin:suppliers.filters.status')}</label>
            <select
              value={filters.status}
              onChange={handleFilterChange('status')}
              className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[color:var(--color-text-soft)]">{t('admin:suppliers.filters.service')}</label>
            <select
              value={filters.service}
              onChange={handleFilterChange('service')}
              className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
            >
              {serviceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[color:var(--color-text-soft)]">{t('admin:suppliers.filters.location')}</label>
            <select
              value={filters.city}
              onChange={handleFilterChange('city')}
              className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
            >
              {cityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[color:var(--color-text-soft)]">{t('admin:suppliers.filters.supplierPortal')}</label>
            <select
              value={filters.portal}
              onChange={handleFilterChange('portal')}
              className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
            >
              {portalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-soft bg-surface px-3 py-2 text-sm text-[color:var(--color-text)]">
            <input
              type="checkbox"
              checked={filters.registered}
              onChange={handleRegisteredToggle}
              className="h-4 w-4 rounded border-soft text-[color:var(--color-primary)] focus:ring-[color:var(--color-primary)]"
            />
            {t('admin:suppliers.filters.showOnlyVerified')}
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-soft bg-surface p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[color:var(--color-text)]">{t('admin:suppliers.directory.title')}</h2>
            <p className="text-xs text-[color:var(--color-text-soft)]">
              {t('admin:suppliers.directory.results', { total: formatNumber(listData.total), shown: formatNumber(listData.items.length) })}
              {listData.hasMore ? t('admin:suppliers.directory.limitReached') : ''}
            </p>
          </div>
          {listLoading && <Loader2 className="h-4 w-4 animate-spin text-[color:var(--color-text-soft)]" />}
        </div>

        {listError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {listError}
          </div>
        )}

        {supplierItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-soft text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-[color:var(--color-text-soft)]">
                  <th className="px-3 py-2">{t('admin:suppliers.table.supplier')}</th>
                  <th className="px-3 py-2">{t('admin:suppliers.table.service')}</th>
                  <th className="px-3 py-2">{t('admin:suppliers.table.location')}</th>
                  <th className="px-3 py-2">{t('admin:suppliers.table.status')}</th>
                  <th className="px-3 py-2 text-right">{t('admin:suppliers.table.score')}</th>
                  <th className="px-3 py-2 text-right">{t('admin:suppliers.table.aiMatch')}</th>
                  <th className="px-3 py-2 text-center">{t('admin:suppliers.table.portal')}</th>
                  <th className="px-3 py-2">{t('admin:suppliers.table.lastInteraction')}</th>
                  <th className="px-3 py-2 text-right">{t('admin:suppliers.table.weddings')}</th>
                  <th className="px-3 py-2 text-center">{t('admin:suppliers.table.verified')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft text-[color:var(--color-text)]">
                {supplierItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[color:var(--color-bg-soft)]">
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-[color:var(--color-text-soft)]">
                          {item.emails[0] || item.phone || t('admin:suppliers.table.noContact')}
                        </span>
                        {item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 text-[0.65rem] text-[color:var(--color-text-soft)]">
                            {item.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="rounded-full bg-[color:var(--color-bg-soft)] px-2 py-0.5">
                                #{tag}
                              </span>
                            ))}
                            {item.tags.length > 3 && <span>+{item.tags.length - 3}</span>}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-col gap-1">
                        <span>{item.service}</span>
                        {item.services.length > 1 && (
                          <span className="text-xs text-[color:var(--color-text-soft)]">
                            {t('admin:suppliers.table.relatedServices', { count: item.services.length - 1 })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      {item.city ? (
                        <>
                          <span>{item.city}</span>
                          {item.country && (
                            <span className="ml-1 text-xs text-[color:var(--color-text-soft)]">
                              ({item.country})
                            </span>
                          )}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <StatusBadge status={item.status} t={t} />
                    </td>
                    <td className="px-3 py-3 text-right align-top font-medium">{formatNumber(item.score)}</td>
                    <td className="px-3 py-3 text-right align-top text-[color:var(--color-text-soft)]">
                      {formatNumber(item.match)}
                    </td>
                    <td className="px-3 py-3 align-top text-center">
                      <PortalBadge status={item.portal.status} t={t} />
                    </td>
                    <td className="px-3 py-3 align-top text-[color:var(--color-text-soft)]">
                      {formatDateTime(item.lastInteractionAt || item.updatedAt || item.createdAt)}
                    </td>
                    <td className="px-3 py-3 align-top text-right">{formatNumber(item.weddingsCount)}</td>
                    <td className="px-3 py-3 align-top text-center">
                      {item.registered ? (
                        <span className={`${badgeClasses.base} ${badgeClasses.success}`}>{t('admin:suppliers.badges.verified')}</span>
                      ) : (
                        <span className={`${badgeClasses.base} ${badgeClasses.neutral}`}>{t('admin:suppliers.badges.discovered')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={t('admin:suppliers.directory.noResults')}
            description={t('admin:suppliers.directory.noResultsDescription')}
          />
        )}
      </section>

      <section className="rounded-xl border border-soft bg-surface p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[color:var(--color-text)]">{t('admin:suppliers.topSuppliers.title')}</h2>
          {analyticsLoading && <Loader2 className="h-4 w-4 animate-spin text-[color:var(--color-text-soft)]" />}
        </div>
        {analytics.topProviders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-[color:var(--color-text-soft)]">
                  <th className="px-3 py-2">{t('admin:suppliers.table.supplier')}</th>
                  <th className="px-3 py-2">{t('admin:suppliers.table.service')}</th>
                  <th className="px-3 py-2">{t('admin:suppliers.table.status')}</th>
                  <th className="px-3 py-2 text-right">{t('admin:suppliers.table.score')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft">
                {analytics.topProviders.map((provider) => (
                  <tr key={`${provider.id}-${provider.weddingId}`} className="hover:bg-[color:var(--color-bg-soft)]">
                    <td className="px-3 py-2 font-medium text-[color:var(--color-text)]">{provider.name}</td>
                    <td className="px-3 py-2">{provider.service}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={provider.status} t={t} />
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">{formatNumber(provider.score)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={t('admin:suppliers.topSuppliers.noRanking')}
            description={t('admin:suppliers.topSuppliers.noRankingDescription')}
          />
        )}
      </section>
    </div>
  );
};

export default AdminSuppliers;
