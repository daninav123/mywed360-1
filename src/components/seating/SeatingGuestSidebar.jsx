import {
  AlertTriangle,
  Clock,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

const TABS = [
  { id: 'summary', label: 'Resumen', icon: Users },
  { id: 'recommendations', label: 'Recomendaciones', icon: Lightbulb },
  { id: 'conflicts', label: 'Conflictos', icon: AlertTriangle },
  { id: 'staff', label: 'Staff', icon: ShieldCheck },
  { id: 'history', label: 'Historial', icon: Clock },
];

const metricTone = (value, warnThreshold = null) => {
  if (warnThreshold == null) return 'text-slate-600';
  return value > warnThreshold ? 'text-amber-600' : 'text-slate-600';
};

const normalize = (value) => {
  if (value == null) return '';
  return String(value).trim().toLowerCase();
};

const isStaffGuest = (guest) => {
  if (!guest) return false;
  if (guest.isStaff || guest.staff === true || guest.isVendor) return true;
  const candidateFields = [
    guest.role,
    guest.segment,
    guest.category,
    guest.group,
    guest.type,
  ];
  const tags = Array.isArray(guest.tags) ? guest.tags : [];
  const haystack = [
    ...candidateFields,
    ...tags,
    guest.notes,
    guest.occupation,
  ]
    .filter(Boolean)
    .map((value) => normalize(value));
  const keywords = ['staff', 'proveedor', 'vendor', 'supplier', 'crew', 'catering', 'fotógrafo', 'fotografo', 'video', 'dj', 'musica', 'música'];
  return haystack.some((field) => keywords.some((keyword) => field.includes(keyword)));
};

const RecommendationCard = ({ item, onAssign, onFocus }) => {
  if (!item || !item.guest) return null;
  const top = Array.isArray(item.topRecommendations) ? item.topRecommendations[0] : null;
  if (!top) return null;
  return (
    <article className="border border-slate-200 rounded-lg p-2 text-xs bg-slate-50/80 hover:bg-white transition shadow-sm">
      <header className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-slate-900">{item.guest.name || 'Invitado'}</p>
          {item.cluster && (
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              {item.cluster === 'vip'
                ? 'VIP pendiente'
                : item.cluster === 'familia'
                ? 'Familia cercana'
                : 'Pendiente'}
            </p>
          )}
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-600 font-semibold">
          Score {Math.round(top.score || 0)}
        </span>
      </header>
      <div className="mt-2 space-y-1">
        <div className="flex items-baseline gap-1">
          <span className="font-medium text-slate-700">Mesa sugerida:</span>
          <button
            type="button"
            className="text-xs text-blue-600 hover:underline"
            onClick={() => onFocus?.(top.tableId)}
          >
            {top.tableName || top.tableId}
          </button>
        </div>
        <p className="text-[11px] text-slate-500">
          Capacidad disponible: {top.freeSeats ?? '—'} asiento(s)
        </p>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          className="px-2 py-1 border border-slate-200 rounded text-[11px] text-slate-600 hover:bg-slate-100"
          onClick={() => onFocus?.(top.tableId)}
        >
          Ver mesa
        </button>
        <button
          type="button"
          className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] hover:bg-emerald-700"
          onClick={() => onAssign?.(item.guest.id, top.tableId)}
        >
          Asignar
        </button>
      </div>
    </article>
  );
};

const ConflictCard = ({ suggestion, onExecute, onFocus }) => {
  if (!suggestion) return null;
  const severity =
    suggestion.severity === 'high'
      ? 'bg-red-50 border-red-100 text-red-700'
      : 'bg-amber-50 border-amber-100 text-amber-700';
  return (
    <article className="border border-slate-200 rounded-lg p-2 bg-white shadow-sm text-xs text-slate-700">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{suggestion.tableName || 'Mesa'}</p>
          <p className="text-[11px] text-slate-500">
            {suggestion.conflict?.message || 'Conflicto detectado en la mesa.'}
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${severity}`}>
          {suggestion.severity === 'high' ? 'Crítico' : 'Atención'}
        </span>
      </header>
      {Array.isArray(suggestion.actions) && suggestion.actions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestion.actions.slice(0, 3).map((action, idx) => (
            <button
              key={`${suggestion.id}-action-${idx}`}
              type="button"
              className="px-2 py-0.5 border border-blue-200 text-blue-600 rounded text-[11px] hover:bg-blue-50"
              onClick={() => {
                if (action.type === 'focus-table') onFocus?.(action.tableId);
                else onExecute?.(action);
              }}
            >
              {action.type === 'reassign' && action.guestName
                ? `Reubicar ${action.guestName}`
                : action.type === 'fix-position'
                ? 'Ajustar mesa'
                : 'Acción sugerida'}
            </button>
          ))}
        </div>
      )}
    </article>
  );
};

const StaffCard = ({ guest, onFocus }) => {
  if (!guest) return null;
  const assigned = guest.tableId || guest.table;
  const badge = assigned ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600';
  return (
    <article className="border border-slate-200 rounded-lg p-2 text-xs bg-white shadow-sm">
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{guest.name || 'Miembro del staff'}</p>
          {guest.role && (
            <p className="text-[11px] text-slate-500 capitalize">{guest.role}</p>
          )}
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge}`}>
          {assigned ? 'Asignado' : 'Sin mesa'}
        </span>
      </header>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px] text-slate-500">
          {assigned ? `Mesa: ${guest.tableName || guest.tableId || guest.table}` : 'Pendiente de ubicación'}
        </p>
        {assigned && (
          <button
            type="button"
            className="text-[11px] text-blue-600 hover:underline"
            onClick={() => onFocus?.(guest.tableId || guest.table)}
          >
            Ver mesa
          </button>
        )}
      </div>
    </article>
  );
};

const HistoryEntry = ({ name, onLoad, onDelete }) => (
  <li className="flex items-center justify-between gap-2 text-xs px-2 py-1.5 border border-slate-200 rounded-md bg-white shadow-sm">
    <span className="text-slate-700 truncate">{name}</span>
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="text-[11px] text-blue-600 hover:underline"
        onClick={() => onLoad?.(name)}
      >
        Cargar
      </button>
      <button
        type="button"
        className="text-[11px] text-rose-600 hover:underline"
        onClick={() => onDelete?.(name)}
      >
        Eliminar
      </button>
    </div>
  </li>
);

export default function SeatingGuestSidebar({
  guests = [],
  pendingGuests = [],
  recommendations = [],
  conflictSuggestions = [],
  conflicts = [],
  insights = {},
  onAssignRecommendation,
  onFocusTable,
  onExecuteAction,
  onOpenGuestDrawer,
  listSnapshots,
  loadSnapshot,
  deleteSnapshot,
}) {
  const [activeTab, setActiveTab] = useState('summary');
  const [snapshots, setSnapshots] = useState(() => {
    try {
      return typeof listSnapshots === 'function' ? listSnapshots() : [];
    } catch (_) {
      return [];
    }
  });

  const refreshSnapshots = () => {
    try {
      if (typeof listSnapshots !== 'function') return;
      const next = listSnapshots();
      setSnapshots(Array.isArray(next) ? next : []);
    } catch (_) {
      setSnapshots([]);
    }
  };

  useEffect(() => {
    refreshSnapshots();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listSnapshots]);

  const stats = useMemo(() => {
    const totalGuests = guests.reduce(
      (sum, guest) => sum + 1 + (parseInt(guest?.companion, 10) || 0),
      0
    );
    const assignedGuests = guests.filter((guest) => guest?.tableId || guest?.table);
    const assignedCount = assignedGuests.reduce(
      (sum, guest) => sum + 1 + (parseInt(guest?.companion, 10) || 0),
      0
    );
    const staffGuests = guests.filter(isStaffGuest);
    const pendingVip = insights?.vipPending ?? 0;
    return {
      totalGuests,
      assignedGuests: assignedCount,
      pendingGuests: pendingGuests.length,
      staffCount: staffGuests.length,
      vipPending: pendingVip,
      conflicts: insights?.conflictCount ?? conflicts.length,
      tablesNearlyFull: insights?.tablesNearlyFull ?? 0,
      companionSeats: insights?.companionSeats ?? 0,
      snapshots: snapshots.length,
    };
  }, [guests, pendingGuests.length, insights, conflicts.length, snapshots.length]);

  const staffGuests = useMemo(() => {
    return guests.filter(isStaffGuest).sort((a, b) => {
      const nameA = (a?.name || '').toLowerCase();
      const nameB = (b?.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [guests]);

  const topRecommendations = useMemo(
    () => (Array.isArray(recommendations) ? recommendations.slice(0, 8) : []),
    [recommendations]
  );

  const topConflicts = useMemo(() => {
    if (Array.isArray(conflictSuggestions) && conflictSuggestions.length > 0) {
      return conflictSuggestions.slice(0, 6);
    }
    return conflicts.slice(0, 6).map((conflict, index) => ({
      id: `raw-conflict-${index}`,
      tableName: conflict?.tableName || conflict?.tableId || 'Mesa',
      severity: conflict?.severity || 'medium',
      conflict,
      actions: [],
    }));
  }, [conflictSuggestions, conflicts]);

  const renderSummary = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Metric label="Invitados totales" value={stats.totalGuests} />
        <Metric label="Asignados" value={stats.assignedGuests} />
        <Metric label="Pendientes" value={stats.pendingGuests} tone={metricTone(stats.pendingGuests, 0)} />
        <Metric label="VIP pendientes" value={stats.vipPending} tone={metricTone(stats.vipPending, 0)} />
        <Metric label="Mesas casi llenas" value={stats.tablesNearlyFull} />
        <Metric label="Asientos acompañantes" value={stats.companionSeats} />
        <Metric label="Conflictos" value={stats.conflicts} tone={metricTone(stats.conflicts, 0)} />
        <Metric label="Snapshots guardados" value={stats.snapshots} />
      </div>
      <button
        type="button"
        className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
        onClick={onOpenGuestDrawer}
      >
        Ver pendientes en detalle
        <Sparkles className="h-4 w-4 text-amber-500" />
      </button>
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-3">
      {topRecommendations.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="Sin recomendaciones"
          description="Todos los invitados pendientes ya tienen sugerencias aplicadas."
        />
      ) : (
        topRecommendations.map((item, index) => (
          <RecommendationCard
            key={item?.guest?.id ?? `rec-${index}`}
            item={item}
            onAssign={onAssignRecommendation}
            onFocus={onFocusTable}
          />
        ))
      )}
    </div>
  );

  const renderConflicts = () => (
    <div className="space-y-3">
      {topConflicts.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="Sin conflictos"
          description="No se detectaron problemas en las mesas."
        />
      ) : (
        topConflicts.map((item) => (
          <ConflictCard
            key={item.id}
            suggestion={item}
            onExecute={onExecuteAction}
            onFocus={onFocusTable}
          />
        ))
      )}
    </div>
  );

  const renderStaff = () => (
    <div className="space-y-3">
      {staffGuests.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Sin staff registrado"
          description="Agrega tags o roles para identificar rápidamente al personal y proveedores."
        />
      ) : (
        staffGuests.map((guest) => (
          <StaffCard key={guest.id || guest.email || guest.phone} guest={guest} onFocus={onFocusTable} />
        ))
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-3">
      {snapshots.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Sin snapshots guardados"
          description="Guarda un snapshot desde la barra de herramientas para crear un historial de avances."
        />
      ) : (
        <ul className="space-y-2">
          {snapshots.map((snapshot) => (
            <HistoryEntry
              key={snapshot}
              name={snapshot}
              onLoad={(name) => {
                if (typeof loadSnapshot === 'function') {
                  const ok = loadSnapshot(name);
                  if (ok !== false) refreshSnapshots();
                }
              }}
              onDelete={(name) => {
                if (typeof deleteSnapshot === 'function') {
                  const ok = deleteSnapshot(name);
                  if (ok !== false) refreshSnapshots();
                }
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'summary':
        return renderSummary();
      case 'recommendations':
        return renderRecommendations();
      case 'conflicts':
        return renderConflicts();
      case 'staff':
        return renderStaff();
      case 'history':
        return renderHistory();
      default:
        return null;
    }
  };

  return (
    <aside className="bg-white border rounded-lg h-full flex flex-col overflow-hidden">
      <header className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Guest Sidebar</h3>
        <p className="text-xs text-slate-500">Controla pendientes, recomendaciones y actividades del equipo.</p>
      </header>

      <nav className="flex border-b border-slate-200 px-3 py-2 gap-2 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs transition ${
                isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="flex-1 overflow-y-auto px-4 py-3 text-xs text-slate-600">
        {renderContent()}
      </div>
    </aside>
  );
}

function Metric({ label, value, tone = 'text-slate-600' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
      <p className="text-[11px] text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone}`}>{Number.isFinite(value) ? value : '—'}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-1 px-3 py-6 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
      {Icon && <Icon className="h-6 w-6 text-slate-400" />}
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );
}
