import React from 'react';
import { useTranslations } from '../../hooks/useTranslations';

const clusterLabels = {
  const { t } = useTranslations();

  vip: 'Invitados VIP',
  familia: 'Familia cercana',
  otros: 'Pendientes',
};

const scoreBadge = (score) => {
  if (score >= 45) return 'bg-emerald-100 text-emerald-700';
  if (score >= 30) return 'bg-blue-100 text-blue-700';
  if (score >= 15) return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-600';
};

const severityBadge = (severity) => {
  if (severity === 'high') return 'bg-red-100 text-red-600';
  if (severity === 'medium') return 'bg-amber-100 text-amber-600';
  return 'bg-gray-100 text-gray-500';
};

export default function SeatingSmartPanel({
  recommendations = [],
  insights = {},
  conflictSuggestions = [],
  onAssign,
  onFocusTable,
  onExecuteAction,
}) {
  const topRecommendations = recommendations.slice(0, 6);
  const topConflicts = Array.isArray(conflictSuggestions)
    ? conflictSuggestions.slice(0, 5)
    : [];

  const handleAction = (action) => {
    if (!action) return;
    if (action.type === 'focus-table') {
      onFocusTable?.(action.tableId);
      return;
    }
    onExecuteAction?.(action);
  };

  return (
    <div className="bg-white border rounded-lg h-full flex flex-col overflow-hidden">
      <header className="border-b px-3 py-2">
        <h3 className="text-sm font-semibold text-gray-900">Panel inteligente</h3>
        <p className="text-xs text-gray-500">
          Recomendaciones automáticas para asignar invitados pendientes.
        </p>
      </header>

      <div className="px-3 py-3 space-y-3 text-xs text-gray-600">
        <div className="grid grid-cols-2 gap-2">
          <Metric label="Pendientes" value={insights.pendingGuests} />
          <Metric label="VIP sin asiento" value={insights.vipPending} />
          <Metric label="Mesas casi llenas" value={insights.tablesNearlyFull} />
          <Metric label="Conflictos" value={insights.conflictCount} />
        </div>
        {insights.companionSeats > 0 && (
          <div className="p-2 border border-blue-100 bg-blue-50/70 rounded text-[11px] text-blue-700">
            {insights.companionSeats} acompañantes requieren asientos adicionales.
          </div>
        )}
        {insights.highSeverityConflicts > 0 && (
          <div className="p-2 border border-red-100 bg-red-50/80 rounded text-[11px] text-red-700">
            {insights.highSeverityConflicts} conflicto(s) necesitan atención inmediata.
          </div>
        )}
        {insights.overbookedTables > 0 && (
          <div className="p-2 border border-amber-100 bg-amber-50/80 rounded text-[11px] text-amber-700">
            {insights.overbookedTables} mesa(s) sobrepasaron su capacidad configurada.
          </div>
        )}
      </div>

      {topConflicts.length > 0 && (
        <div className="px-3 pb-3 space-y-2 text-xs text-gray-600">
          <h4 className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
            Conflictos detectados
          </h4>
          {topConflicts.map((item) => (
            <article
              key={item.id}
              className="border border-gray-200 bg-white rounded-md p-2 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
            >
              <header className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm text-gray-900">{item.tableName}</p>
                  <p className="text-[11px] text-gray-500">{item.conflict?.message}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${severityBadge(
                    item.severity
                  )}`}
                >
                  {item.severity === 'high' ? {t('common.critico')} : t('common.atencion')}
                </span>
              </header>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-2 py-0.5 border border-blue-200 text-blue-600 rounded text-[11px] hover:bg-blue-50"
                  onClick={() => onFocusTable?.(item.tableId)}
                >
                  Ver mesa
                </button>
                {item.actions.map((action, idx) => {
                  if (action.type === 'reassign') {
                    return (
                      <button
                        key={`${item.id}-action-${idx}`}
                        type="button"
                        className="px-2 py-0.5 border border-emerald-200 text-emerald-700 rounded text-[11px] hover:bg-emerald-50"
                        onClick={() => handleAction(action)}
                      >
                        Reubicar {action.guestName} → {action.toTableName}
                      </button>
                    );
                  }
                  if (action.type === 'fix-position') {
                    return (
                      <button
                        key={`${item.id}-action-${idx}`}
                        type="button"
                        className="px-2 py-0.5 border border-amber-200 text-amber-600 rounded text-[11px] hover:bg-amber-50"
                        onClick={() => handleAction(action)}
                      >
                        Ajustar posición
                      </button>
                    );
                  }
                  if (action.type === 'focus-table') {
                    return (
                      <button
                        key={`${item.id}-action-${idx}`}
                        type="button"
                        className="px-2 py-0.5 border border-gray-200 text-gray-600 rounded text-[11px] hover:bg-gray-50"
                        onClick={() => handleAction(action)}
                      >
                        Enfocar
                      </button>
                    );
                  }
                  return null;
                })}
              </div>
              {item.actions.some((action) => Array.isArray(action.reasons) && action.reasons.length) && (
                <ul className="mt-2 list-disc list-inside text-[11px] text-gray-500 space-y-0.5">
                  {item.actions
                    .flatMap((action) => action.reasons || [])
                    .slice(0, 3)
                    .map((reason, idx) => (
                      <li key={idx}>{reason.message}</li>
                    ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {topRecommendations.length === 0 ? (
          <p className="text-xs text-gray-500">Todos los invitados están asignados por ahora.</p>
        ) : (
          topRecommendations.map((item) => {
            const best = item.topRecommendations[0];
            if (!best) return null;
            return (
              <article
                key={item.guest.id || best.tableId}
                className="border border-gray-200 rounded-md p-2 bg-gray-50 hover:bg-white transition shadow-sm text-xs text-gray-700"
              >
                <header className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{item.guest.name}</p>
                    <p className="text-[11px] text-gray-500 capitalize">
                      {clusterLabels[item.cluster] || 'Pendiente'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${scoreBadge(best.score)}`}
                  >
                    Score {Math.round(best.score)}
                  </span>
                </header>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Mesa sugerida</p>
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => onFocusTable?.(best.tableId)}
                      >
                        {best.tableName}
                      </button>
                    </div>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                      onClick={() => onAssign?.(item.guest.id, best.tableId)}
                    >
                      Asignar
                    </button>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-gray-500 space-y-0.5">
                    {best.reasons.slice(0, 2).map((reason, idx) => (
                      <li key={idx}>{reason.message}</li>
                    ))}
                  </ul>
                </div>
                {item.topRecommendations.length > 1 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] text-gray-500">
                      Ver alternativas
                    </summary>
                    <ul className="mt-1 space-y-1">
                      {item.topRecommendations.slice(1).map((alt) => (
                        <li key={alt.tableId} className="border border-gray-200 rounded px-2 py-1">
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              className="text-xs text-gray-700 font-medium hover:underline"
                              onClick={() => onFocusTable?.(alt.tableId)}
                            >
                              {alt.tableName}
                            </button>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${scoreBadge(alt.score)}`}>
                              {Math.round(alt.score)}
                            </span>
                          </div>
                          <ul className="list-disc list-inside text-[11px] text-gray-500 space-y-0.5">
                            {alt.reasons.slice(0, 1).map((reason, idx) => (
                              <li key={idx}>{reason.message}</li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

const Metric = ({ label, value }) => (
  <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-center">
    <p className="text-[11px] text-gray-500">{label}</p>
    <p className="text-base font-semibold text-gray-900">{value ?? 0}</p>
  </div>
);
