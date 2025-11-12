import { AlertTriangle, Clock, Lightbulb, ShieldCheck, Sparkles, Users } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import useTranslations from '../../hooks/useTranslations';

const TABS = [
  { id: 'summary', icon: Users },
  { id: 'recommendations', icon: Lightbulb },
  { id: 'conflicts', icon: AlertTriangle },
  { id: 'staff', icon: ShieldCheck },
  { id: 'history', icon: Clock },
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
  const candidateFields = [guest.role, guest.segment, guest.category, guest.group, guest.type];
  const tags = Array.isArray(guest.tags) ? guest.tags : [];
  const haystack = [...candidateFields, ...tags, guest.notes, guest.occupation]
    .filter(Boolean)
    .map((value) => normalize(value));
  const keywords = [
    'staff',
    'proveedor',
    'vendor',
    'supplier',
    'crew',
    'catering',
    'fotografo',
    'video',
    'dj',
    'musica',
  ];
  return haystack.some((field) => keywords.some((keyword) => field.includes(keyword)));
};

const RecommendationCard = ({ item, onAssign, onFocus, t, tPlural }) => {
  if (!item || !item.guest) return null;
  const top = Array.isArray(item.topRecommendations) ? item.topRecommendations[0] : null;
  if (!top) return null;
  const guestName =
    item.guest.name ||
    t('planModern.guestSidebar.recommendations.guestFallback', { ns: 'seating' });
  const clusterKey =
    item.cluster === 'vip' ? 'vip' : item.cluster === 'familia' ? 'familia' : 'pending';
  const clusterLabel = t(`planModern.guestSidebar.recommendations.clusters.${clusterKey}`, {
    ns: 'seating',
  });
  const scoreLabel = t('planModern.guestSidebar.recommendations.score', {
    ns: 'seating',
    value: Math.round(top.score || 0),
  });
  const freeSeats = Number.isFinite(top.freeSeats) ? top.freeSeats : null;
  const capacityText =
    freeSeats == null
      ? t('planModern.guestSidebar.recommendations.capacityUnknown', { ns: 'seating' })
      : tPlural('planModern.guestSidebar.recommendations.capacityAvailable', freeSeats, {
          ns: 'seating',
          count: freeSeats,
        });
  return (
    <article className="border border-slate-200 rounded-lg p-2 text-xs bg-slate-50/80 hover:bg-white transition shadow-sm">
      <header className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-slate-900">{guestName}</p>
          {item.cluster && (
            <p className="text-[11px] uppercase tracking-wide text-slate-500">{clusterLabel}</p>
          )}
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-600 font-semibold">
          {scoreLabel}
        </span>
      </header>
      <div className="mt-2 space-y-1">
        <div className="flex items-baseline gap-1">
          <span className="font-medium text-slate-700">
            {t('planModern.guestSidebar.recommendations.suggestedTable', { ns: 'seating' })}
          </span>
          <button
            type="button"
            className="text-xs text-blue-600 hover:underline"
            onClick={() => onFocus?.(top.tableId)}
          >
            {top.tableName || top.tableId}
          </button>
        </div>
        <p className="text-[11px] text-slate-500">{capacityText}</p>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          className="px-2 py-1 border border-slate-200 rounded text-[11px] text-slate-600 hover:bg-slate-100"
          onClick={() => onFocus?.(top.tableId)}
        >
          {t('planModern.guestSidebar.actions.viewTable', { ns: 'seating' })}
        </button>
        <button
          type="button"
          className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] hover:bg-emerald-700"
          onClick={() => onAssign?.(item.guest.id, top.tableId)}
        >
          {t('planModern.guestSidebar.actions.assign', { ns: 'seating' })}
        </button>
      </div>
    </article>
  );
};

const ConflictCard = ({ suggestion, onExecute, onFocus, t }) => {
  if (!suggestion) return null;
  const severity =
    suggestion.severity === 'high'
      ? 'bg-red-50 border-red-100 text-red-700'
      : 'bg-amber-50 border-amber-100 text-amber-700';
  const severityLabel =
    suggestion.severity === 'high'
      ? t('planModern.guestSidebar.conflicts.severityHigh', { ns: 'seating' })
      : t('planModern.guestSidebar.conflicts.severityMedium', { ns: 'seating' });
  const tableName =
    suggestion.tableName || t('planModern.guestSidebar.conflicts.tableFallback', { ns: 'seating' });
  const conflictMessage =
    suggestion.conflict?.message ||
    t('planModern.guestSidebar.conflicts.messageFallback', { ns: 'seating' });
  return (
    <article className="border border-slate-200 rounded-lg p-2 bg-white shadow-sm text-xs text-slate-700">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{tableName}</p>
          <p className="text-[11px] text-slate-500">{conflictMessage}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${severity}`}>
          {severityLabel}
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
                ? t('planModern.guestSidebar.conflicts.actions.reassign', {
                    ns: 'seating',
                    guest: action.guestName,
                  })
                : action.type === 'fix-position'
                  ? t('planModern.guestSidebar.conflicts.actions.fixPosition', { ns: 'seating' })
                  : t('planModern.guestSidebar.conflicts.actions.generic', { ns: 'seating' })}
            </button>
          ))}
        </div>
      )}
    </article>
  );
};

const StaffCard = ({ guest, onFocus, t }) => {
  if (!guest) return null;
  const assigned = guest.tableId || guest.table;
  const badge = assigned ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600';
  const guestName =
    guest.name || t('planModern.guestSidebar.staff.memberFallback', { ns: 'seating' });
  const statusLabel = assigned
    ? t('planModern.guestSidebar.staff.assigned', { ns: 'seating' })
    : t('planModern.guestSidebar.staff.noTable', { ns: 'seating' });
  const locationText = assigned
    ? t('planModern.guestSidebar.staff.tableLabel', {
        ns: 'seating',
        table: guest.tableName || guest.tableId || guest.table,
      })
    : t('planModern.guestSidebar.staff.pending', { ns: 'seating' });
  return (
    <article className="border border-slate-200 rounded-lg p-2 text-xs bg-white shadow-sm">
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{guestName}</p>
          {guest.role && <p className="text-[11px] text-slate-500 capitalize">{guest.role}</p>}
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge}`}>
          {statusLabel}
        </span>
      </header>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px] text-slate-500">{locationText}</p>
        {assigned && (
          <button
            type="button"
            className="text-[11px] text-blue-600 hover:underline"
            onClick={() => onFocus?.(guest.tableId || guest.table)}
          >
            {t('planModern.guestSidebar.actions.viewTable', { ns: 'seating' })}
          </button>
        )}
      </div>
    </article>
  );
};

const HistoryEntry = ({ name, onLoad, onDelete, t }) => (
  <li className="flex items-center justify-between gap-2 text-xs px-2 py-1.5 border border-slate-200 rounded-md bg-white shadow-sm">
    <span className="text-slate-700 truncate">{name}</span>
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="text-[11px] text-blue-600 hover:underline"
        onClick={() => onLoad?.(name)}
      >
        {t('planModern.guestSidebar.history.load', { ns: 'seating' })}
      </button>
      <button
        type="button"
        className="text-[11px] text-rose-600 hover:underline"
        onClick={() => onDelete?.(name)}
      >
        {t('planModern.guestSidebar.history.delete', { ns: 'seating' })}
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
  const { t, tPlural } = useTranslations();
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
        <Metric
          label={t('planModern.guestSidebar.summary.metrics.totalGuests', { ns: 'seating' })}
          value={stats.totalGuests}
        />
        <Metric
          label={t('planModern.guestSidebar.summary.metrics.assigned', { ns: 'seating' })}
          value={stats.assignedGuests}
        />
        <Metric
          label={t('planModern.guestSidebar.summary.metrics.pending', { ns: 'seating' })}
          value={stats.pendingGuests}
          tone={metricTone(stats.pendingGuests, 0)}
        />
        <Metric
          label={t('planModern.guestSidebar.summary.metrics.vipPending', { ns: 'seating' })}
          value={stats.vipPending}
          tone={metricTone(stats.vipPending, 0)}
        />
        <Metric
          label={t('planModern.guestSidebar.summary.metrics.tablesNearlyFull', { ns: 'seating' })}
          value={stats.tablesNearlyFull}
        />
        <Metric
          label={t('planModern.guestSidebar.summary.metrics.companionSeats', { ns: 'seating' })}
          value={stats.companionSeats}
        />
        <Metric
          label={t('planModern.guestSidebar.summary.metrics.conflicts', { ns: 'seating' })}
          value={stats.conflicts}
          tone={metricTone(stats.conflicts, 0)}
        />
        <Metric
          label={t('planModern.guestSidebar.summary.metrics.snapshots', { ns: 'seating' })}
          value={stats.snapshots}
        />
      </div>
      <button
        type="button"
        className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
        onClick={onOpenGuestDrawer}
      >
        {t('planModern.guestSidebar.summary.viewPending', { ns: 'seating' })}
        <Sparkles className="h-4 w-4 text-amber-500" />
      </button>
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-3">
      {topRecommendations.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title={t('planModern.guestSidebar.recommendations.emptyTitle', { ns: 'seating' })}
          description={t('planModern.guestSidebar.recommendations.emptyDescription', {
            ns: 'seating',
          })}
        />
      ) : (
        topRecommendations.map((item, index) => (
          <RecommendationCard
            key={item?.guest?.id ?? `rec-${index}`}
            item={item}
            onAssign={onAssignRecommendation}
            onFocus={onFocusTable}
            t={t}
            tPlural={tPlural}
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
          title={t('planModern.guestSidebar.conflicts.emptyTitle', { ns: 'seating' })}
          description={t('planModern.guestSidebar.conflicts.emptyDescription', { ns: 'seating' })}
        />
      ) : (
        topConflicts.map((item) => (
          <ConflictCard
            key={item.id}
            suggestion={item}
            onExecute={onExecuteAction}
            onFocus={onFocusTable}
            t={t}
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
          title={t('planModern.guestSidebar.staff.emptyTitle', { ns: 'seating' })}
          description={t('planModern.guestSidebar.staff.emptyDescription', { ns: 'seating' })}
        />
      ) : (
        staffGuests.map((guest) => (
          <StaffCard
            key={guest.id || guest.email || guest.phone}
            guest={guest}
            onFocus={onFocusTable}
            t={t}
          />
        ))
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-3">
      {snapshots.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={t('planModern.guestSidebar.history.emptyTitle', { ns: 'seating' })}
          description={t('planModern.guestSidebar.history.emptyDescription', { ns: 'seating' })}
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
              t={t}
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
        <h3 className="text-sm font-semibold text-slate-900">
          {t('planModern.guestSidebar.header.title', { ns: 'seating' })}
        </h3>
        <p className="text-xs text-slate-500">
          {t('planModern.guestSidebar.header.subtitle', { ns: 'seating' })}
        </p>
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
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(`planModern.guestSidebar.tabs.${tab.id}`, { ns: 'seating' })}
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
