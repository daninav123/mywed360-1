import { Activity, Award, BarChart2, TrendingUp } from 'lucide-react';
import React, { useMemo } from 'react';

import Card from '../ui/Card';
import Button from '../ui/Button';
import useTranslations from '../../hooks/useTranslations';

const EMPTY_ANALYTICS = {
  averageScore: 0,
  serviceStats: [],
  coverage: { services: [], portal: { enabled: 0, responded: 0, pending: 0 } },
  scoreDistribution: [],
  topProviders: [],
};

const MIN_BAR_WIDTH = 6;

export default function SupplierAnalyticsPanel({
  analytics = EMPTY_ANALYTICS,
  loading = false,
  onOpenReport,
}) {
  const summary = analytics || EMPTY_ANALYTICS;
  const { t } = useTranslations();
  const totalSuppliers = useMemo(() => {
    if (!Array.isArray(summary.scoreDistribution)) {
      return summary.serviceStats?.reduce?.((acc, item) => acc + (item?.total || 0), 0) || 0;
    }
    return summary.scoreDistribution.reduce((acc, bucket) => acc + (bucket?.count || 0), 0);
  }, [summary]);

  const serviceLeaders = useMemo(() => {
    const list = Array.isArray(summary.serviceStats) ? summary.serviceStats.slice(0, 3) : [];
    return list;
  }, [summary.serviceStats]);

  const portalStats = summary.coverage?.portal || { enabled: 0, responded: 0, pending: 0 };
  const coverageServices = summary.coverage?.services || [];

  return (
    <Card className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-600" />
            {t('common.suppliers.analyticsPanel.title')}
          </h2>
          <p className="text-sm text-gray-600">
            {t('common.suppliers.analyticsPanel.description')}
          </p>
        </div>
        {typeof onOpenReport === 'function' && (
          <Button variant="outline" size="sm" onClick={onOpenReport}>
            {t('common.suppliers.analyticsPanel.openReport')}
          </Button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Award size={16} className="text-indigo-500" />
            {t('common.suppliers.analyticsPanel.cards.average.title')}
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {loading ? '—' : `${summary.averageScore || 0}`}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {t('common.suppliers.analyticsPanel.cards.average.targetHint')}
          </p>
        </div>
        <div className="rounded border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Activity size={16} className="text-emerald-500" />
            {t('common.suppliers.analyticsPanel.cards.portal.title')}
          </div>
          <div className="mt-2 flex items-end gap-4 text-slate-900">
            <div>
              <div className="text-2xl font-bold">{portalStats.responded || 0}</div>
              <p className="text-xs text-slate-500">
                {t('common.suppliers.analyticsPanel.cards.portal.responses')}
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold text-emerald-600">
                {(portalStats.enabled || 0) ? Math.round(((portalStats.responded || 0) / (portalStats.enabled || 1)) * 100) : 0}%
              </div>
              <p className="text-xs text-slate-500">
                {t('common.suppliers.analyticsPanel.cards.portal.coverage')}
              </p>
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {t('common.suppliers.analyticsPanel.cards.portal.pending', {
              count: Math.max(0, (portalStats.enabled || 0) - (portalStats.responded || 0)),
            })}
          </p>
        </div>
        <div className="rounded border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <BarChart2 size={16} className="text-sky-500" />
            {t('common.suppliers.analyticsPanel.cards.services.title')}
          </div>
          <div className="mt-2 space-y-1">
            {serviceLeaders.length === 0 && (
              <p className="text-xs text-slate-500">
                {t('common.suppliers.analyticsPanel.cards.services.empty')}
              </p>
            )}
            {serviceLeaders.map((service) => (
              <div key={service.service} className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-medium text-slate-700">{service.service}</span>
                <span className="text-slate-500">
                  {t('common.suppliers.analyticsPanel.cards.services.row', {
                    confirmed: service.confirmed,
                    total: service.total,
                    score: service.averageScore,
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Distribución de puntuaciones</h3>
          <div className="space-y-2">
            {(summary.scoreDistribution || []).map((bucket) => {
              const total = totalSuppliers || 1;
              const percent = Math.round(((bucket?.count || 0) / total) * 100);
              const width = Math.max(MIN_BAR_WIDTH, percent);
              return (
                <div key={bucket.label} className="text-xs text-slate-600">
                  <div className="flex justify-between mb-1">
                    <span>{bucket.label}</span>
                    <span>{bucket.count || 0} · {percent || 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(summary.scoreDistribution || []).length === 0 && (
              <p className="text-xs text-slate-500">Aún no hay datos suficientes para mostrar la distribución.</p>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Top proveedores</h3>
          <div className="rounded border border-slate-200 bg-white">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Proveedor</th>
                  <th className="px-3 py-2 text-left font-semibold">Servicio</th>
                  <th className="px-3 py-2 text-left font-semibold">Score</th>
                </tr>
              </thead>
              <tbody>
                {(summary.topProviders || []).map((prov) => (
                  <tr key={prov.id} className="border-b last:border-0 text-slate-700">
                    <td className="px-3 py-2 font-medium">{prov.name}</td>
                    <td className="px-3 py-2">{prov.service || '—'}</td>
                    <td className="px-3 py-2">{prov.score ?? '—'}</td>
                  </tr>
                ))}
                {(summary.topProviders || []).length === 0 && (
                  <tr>
                    <td className="px-3 py-3 text-center text-slate-500" colSpan={3}>
                      Sin proveedores destacados aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {coverageServices.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Cobertura detallada</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
            {coverageServices.slice(0, 6).map((svc) => (
              <div key={svc.name} className="rounded border border-slate-200 px-3 py-2 bg-slate-50">
                <div className="font-semibold text-slate-700">{svc.name}</div>
                <div className="mt-1 flex items-center justify-between">
                  <span>Proveedores</span>
                  <span className="font-medium text-slate-800">{svc.confirmed}/{svc.suppliers}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
