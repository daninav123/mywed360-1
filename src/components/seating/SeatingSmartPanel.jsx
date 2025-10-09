import React from 'react';

const clusterLabels = {
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

export default function SeatingSmartPanel({
  recommendations = [],
  insights = {},
  onAssign,
  onFocusTable,
}) {
  const topRecommendations = recommendations.slice(0, 6);
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
      </div>

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
