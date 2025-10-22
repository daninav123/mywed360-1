import { Gauge, Table, Users, Clock } from 'lucide-react';
import React from 'react';

function formatNumber(value) {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('es-ES');
}

function ProgressBar({ value }) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
      <div
        className="h-full bg-blue-500 transition-all duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export default function SeatingPlanSummary({
  totalGuests = 0,
  totalPersons = 0,
  assignedPersons = 0,
  pendingGuests = 0,
  tableCount = 0,
  seatCapacity = 0,
  globalCapacity = 0,
  ceremonyProgress = 0,
  banquetProgress = 0,
  areaSummary = [],
  onOpenGuestDrawer,
}) {
  const capacityTarget = globalCapacity > 0 ? globalCapacity : seatCapacity;
  const occupancyPercent =
    capacityTarget > 0 ? Math.round((assignedPersons / capacityTarget) * 100) : 0;

  const summaryCards = [
    {
      id: 'assigned',
      label: 'Personas ubicadas',
      value: `${formatNumber(assignedPersons)} / ${formatNumber(totalPersons)}`,
      caption: 'Invitados y acompanantes con mesa asignada',
      icon: Users,
      accent: 'bg-blue-100 text-blue-700 border-blue-200',
      progress: banquetProgress,
    },
    {
      id: 'pending',
      label: 'Pendientes por asignar',
      value: formatNumber(pendingGuests),
      caption: totalGuests > 0 ? `De ${formatNumber(totalGuests)} invitados` : 'Sin invitados',
      icon: Clock,
      accent: pendingGuests > 0 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-green-100 text-green-700 border-green-200',
      action:
        typeof onOpenGuestDrawer === 'function'
          ? {
              label: 'Ver lista',
              onClick: onOpenGuestDrawer,
            }
          : null,
    },
    {
      id: 'tables',
      label: 'Mesas activas',
      value: formatNumber(tableCount),
      caption: `${formatNumber(seatCapacity)} asientos disponibles`,
      icon: Table,
      accent: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      id: 'capacity',
      label: 'Capacidad configurada',
      value:
        capacityTarget > 0
          ? `${formatNumber(capacityTarget)} pax`
          : `${formatNumber(seatCapacity)} pax`,
      caption:
        capacityTarget > 0
          ? `Ocupacion ${Math.max(0, occupancyPercent)}%`
          : 'Ajusta la capacidad en Configuracion',
      icon: Gauge,
      accent: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      progress: capacityTarget > 0 ? occupancyPercent : null,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-100 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          Ceremonia lista {Math.max(0, Math.min(100, Math.round(ceremonyProgress)))}%
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-blue-50 px-3 py-1 text-blue-700">
          <span className="h-2 w-2 rounded-full bg-blue-600" />
          Banquete asignado {Math.max(0, Math.min(100, Math.round(banquetProgress)))}%
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className={`border rounded-2xl p-4 bg-white shadow-sm flex flex-col gap-3 transition-transform hover:-translate-y-0.5 ${card.accent}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">{card.label}</p>
                  <p className="text-2xl font-semibold mt-1">{card.value}</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 border border-white text-gray-700">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-4">{card.caption}</p>
              {typeof card.progress === 'number' && <ProgressBar value={card.progress} />}
              {card.action ? (
                <button
                  type="button"
                  onClick={card.action.onClick}
                  className="self-start text-xs font-medium text-blue-700 hover:text-blue-800 focus:outline-none"
                >
                  {card.action.label}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      {Array.isArray(areaSummary) && areaSummary.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Mapa del espacio</h3>
          <div className="flex flex-wrap gap-2">
            {areaSummary.map((item) => (
              <span
                key={item.type}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-gray-600"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
                <span className="text-gray-400">|</span>
                <span>{item.count}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
