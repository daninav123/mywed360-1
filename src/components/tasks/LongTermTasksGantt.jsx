import React, { useMemo, useRef, useEffect } from 'react';
import { addMonths, normalizeAnyDate } from './utils/dateUtils.js';
import { auth } from '../../firebaseConfig';

function diffMonths(a, b) {
  const y = b.getFullYear() - a.getFullYear();
  const m = b.getMonth() - a.getMonth();
  return y * 12 + m;
}

function dayFraction(d) {
  try {
    if (!(d instanceof Date)) return 0;
    const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const idx = Math.max(0, Math.min(days, d.getDate())) - 1;
    return days > 0 ? idx / days : 0;
  } catch {
    return 0;
  }
}

export default function LongTermTasksGantt({
  containerRef,
  tasks,
  columnWidth,
  rowHeight = 44,
  preSteps,
  viewDate,
  markerDate,
  projectStart,
  projectEnd,
  onTaskClick,
  extendMonthsAfterEnd = 0,
  leftColumnWidth = 220,
  subtasks = [],
}) {
  const colW = Math.max(60, Number(columnWidth) || 90);

  const debugEnabled = useMemo(() => {
    try {
      const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
      const isDev = String(env?.MODE || env?.NODE_ENV || '').toLowerCase() !== 'production';
      const flag = typeof localStorage !== 'undefined' ? localStorage.getItem('lovenda_gantt_debug') : null;
      return isDev || flag === '1' || /^true$/i.test(String(flag || ''));
    } catch {
      return false;
    }
  }, []);

  // Inyectar hito "Boda" si no existe
  const withWedding = useMemo(() => {
    try {
      const arr = Array.isArray(tasks) ? tasks.slice() : [];
      const raw = markerDate || projectEnd || null;
      if (!raw) return arr;
      const wd = normalizeAnyDate(raw);
      if (!wd || isNaN(wd.getTime())) return arr;
      const exists = arr.some((t) => {
        const isM = String(t?.type || '') === 'milestone' || t?.milestone === true;
        const s = normalizeAnyDate(t?.start);
        return isM && s && !isNaN(s) && s.getFullYear() === wd.getFullYear() && s.getMonth() === wd.getMonth() && s.getDate() === wd.getDate();
      });
      if (exists) return arr;
      arr.push({ id: '__wedding_milestone', type: 'milestone', milestone: true, start: new Date(wd), end: new Date(wd), name: 'Boda' });
      return arr;
    } catch {
      return Array.isArray(tasks) ? tasks : [];
    }
  }, [tasks, markerDate, projectEnd]);

  // Normalizar tareas válidas
  const normalizedTasks = useMemo(() => {
    const arr = Array.isArray(withWedding) ? withWedding : [];
    return arr
      .map((t) => {
        if (!t) return null;
        const s = normalizeAnyDate(t?.start ?? t?.startDate ?? t?.date ?? t?.when);
        const e = normalizeAnyDate(t?.end ?? t?.endDate ?? t?.until ?? t?.finish ?? t?.to);
        if (!s || !e || e < s) return null;
        const type = t?.type ? String(t.type) : t?.milestone ? 'milestone' : 'task';
        return {
          ...t,
          id: String(t.id || `${t.title || 't'}-${s.getTime()}-${e.getTime()}`),
          start: s,
          end: e,
          type,
          name: t.name || t.title || 'Sin titulo',
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);
  }, [withWedding]);

  // Fechas base para el timeline
  const registrationDate = useMemo(() => {
    const ps = normalizeAnyDate(projectStart);
    if (ps) return ps;
    try {
      const cs = auth?.currentUser?.metadata?.creationTime || null;
      const d = cs ? new Date(cs) : null;
      if (d && !isNaN(d.getTime())) return d;
    } catch {}
    if (normalizedTasks.length > 0) return new Date(normalizedTasks[0].start);
    return new Date();
  }, [projectStart, normalizedTasks]);

  const weddingBaseDate = useMemo(() => {
    const raw = projectEnd || markerDate || null;
    if (!raw) return null;
    return normalizeAnyDate(raw);
  }, [projectEnd, markerDate]);

  const timelineStart = registrationDate;
  const timelineEnd = useMemo(
    () => (weddingBaseDate ? addMonths(weddingBaseDate, extendMonthsAfterEnd) : addMonths(registrationDate, 24)),
    [weddingBaseDate, registrationDate, extendMonthsAfterEnd]
  );

  // Escala
  const monthStart = new Date(timelineStart.getFullYear(), timelineStart.getMonth(), 1);
  const endMonthStart = new Date(timelineEnd.getFullYear(), timelineEnd.getMonth(), 1);
  const monthsDiff = diffMonths(monthStart, endMonthStart);
  const daysInEndMonth = new Date(timelineEnd.getFullYear(), timelineEnd.getMonth() + 1, 0).getDate();
  const endDayIndex = Math.max(0, Math.min(daysInEndMonth, timelineEnd.getDate())) - 1;
  const endFrac = daysInEndMonth > 0 ? (endDayIndex + 1) / daysInEndMonth : 1;
  const totalMonths = Math.max(1, diffMonths(monthStart, endMonthStart) + 1);
  const contentWidth = Math.max(1, monthsDiff * colW + endFrac * colW);

  // Auto-scroll al mes actual
  const scrollRef = useRef(null);
  useEffect(() => {
    const el = (containerRef && containerRef.current) || (scrollRef && scrollRef.current);
    if (!el) return;
    const today = new Date();
    if (today < monthStart || today > timelineEnd) return;
    const m = diffMonths(monthStart, today);
    const left = Math.max(0, m * colW - el.clientWidth * 0.5);
    el.scrollTo({ left, behavior: 'auto' });
  }, [containerRef, monthStart, timelineEnd, colW]);

  // Barras
  const bars = useMemo(() => {
    return normalizedTasks
      .filter((t) => {
        const ty = String(t.type || 'task');
        return ty !== 'milestone' && ty !== 'project' && ty !== 'subtask';
      })
      .map((t, idx) => {
        const cs = new Date(Math.max(t.start.getTime(), timelineStart.getTime()));
        const ce = new Date(Math.min(t.end.getTime(), timelineEnd.getTime()));
        if (ce.getTime() < cs.getTime()) return null;
        const sM = diffMonths(monthStart, cs);
        const eM = diffMonths(monthStart, ce);
        const left = Math.max(0, (sM + dayFraction(cs)) * colW);
        const right = Math.max(0, (eM + dayFraction(ce)) * colW);
        const width = Math.max(2, right - left + Math.max(2, Math.floor(colW * 0.1)));
        return { key: String(t.id || idx), left, width, task: t };
      })
      .filter(Boolean);
  }, [normalizedTasks, monthStart, colW, timelineStart, timelineEnd]);

  // Hitos
  const milestones = useMemo(() => {
    const out = [];
    for (const t of normalizedTasks) {
      if (String(t.type || 'task') !== 'milestone') continue;
      const d = t.start instanceof Date ? t.start : null;
      if (!d) continue;
      if (d < timelineStart || d > timelineEnd) continue;
      const m = diffMonths(monthStart, d);
      const left = Math.max(0, (m + dayFraction(d)) * colW);
      out.push({ left, task: t });
    }
    return out;
  }, [normalizedTasks, monthStart, colW, timelineStart, timelineEnd]);

  // Etiquetas
  const monthLabels = useMemo(() => {
    const labels = [];
    for (let i = 0; i < totalMonths; i++) {
      const d = new Date(monthStart.getFullYear(), monthStart.getMonth() + i, 1);
      labels.push({ key: i, text: new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(d), left: i * colW, date: d });
    }
    return labels;
  }, [totalMonths, monthStart, colW]);

  const yearLabels = useMemo(() => {
    const labels = [];
    if (totalMonths <= 0) return labels;
    let currentYear = monthStart.getFullYear();
    let span = 0;
    let startIndex = 0;
    for (let i = 0; i < totalMonths; i++) {
      const d = new Date(monthStart.getFullYear(), monthStart.getMonth() + i, 1);
      const y = d.getFullYear();
      if (y !== currentYear) {
        labels.push({ year: currentYear, left: startIndex * colW, width: Math.max(colW, span * colW), key: `${currentYear}-${startIndex}` });
        currentYear = y;
        span = 1;
        startIndex = i;
      } else {
        span += 1;
      }
    }
    labels.push({ year: currentYear, left: startIndex * colW, width: Math.max(colW, span * colW), key: `${currentYear}-${startIndex}` });
    return labels;
  }, [totalMonths, monthStart, colW]);

  const handleClick = (bar) => { if (typeof onTaskClick === 'function') onTaskClick(bar.task); };
  const contentHeight = (Array.isArray(normalizedTasks) ? normalizedTasks.length : 0) * rowHeight + 60;

  return (
    <div className="bg-[var(--color-surface)] rounded-xl shadow-md p-6 transition-all hover:shadow-lg" data-testid="longterm-gantt-new">
      <h2 className="text-xl font-semibold mb-4">Tareas a Largo Plazo</h2>
      {debugEnabled && (
        <div data-testid="gantt-debug" style={{ marginBottom: 8, fontSize: 12, color: '#4b5563', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span>
            Inicio: {(() => { try { return new Intl.DateTimeFormat('es-ES', { year: 'numeric', month: 'short', day: '2-digit' }).format(timelineStart); } catch { return timelineStart?.toISOString?.().slice(0, 10) || String(timelineStart); } })()}
          </span>
          <span>
            Fin: {(() => { try { return new Intl.DateTimeFormat('es-ES', { year: 'numeric', month: 'short', day: '2-digit' }).format(timelineEnd); } catch { return timelineEnd?.toISOString?.().slice(0, 10) || String(timelineEnd); } })()}
          </span>
        </div>
      )}

      <div className="w-full flex items-stretch gap-3">
        {/* Columna izquierda fija */}
        <div className="shrink-0 rounded-lg border border-gray-100 bg-white" style={{ width: leftColumnWidth, minHeight: contentHeight }}>
          <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 10px', borderBottom: '1px solid #eee', fontWeight: 600, color: '#111827' }}>Tarea</div>
          <div style={{ position: 'relative', minHeight: Math.max(0, contentHeight - 56) }}>
            {rows.map((row, i) => (
              <div
                key={`left-${bar.key}`}
                onClick={() => handleClick(bar)}
                title={bar?.task?.name || bar?.task?.title || ''}
                style={{ position: 'absolute', left: 0, right: 0, top: 40 + i * rowHeight, height: rowHeight, display: 'flex', alignItems: 'center', padding: '2px 10px', boxSizing: 'border-box', cursor: 'pointer', color: '#111827', fontSize: 13, borderBottom: '1px dashed #f0f0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {bar.task?.name || bar.task?.title || 'Tarea'}
              </div>
            ))}
          </div>
        </div>

        {/* Zona scrollable */}
        <div ref={containerRef || scrollRef} className="grow overflow-x-auto overflow-y-hidden mb-4 border border-gray-100 rounded-lg" style={{ minHeight: contentHeight }} data-testid="longterm-gantt-scroll">
          {/* Cabecera: años + meses */}
          <div style={{ position: 'relative', height: 56, borderBottom: '1px solid #eee', width: contentWidth }}>
            {yearLabels.map((y) => (
              <div key={y.key} style={{ position: 'absolute', left: y.left, top: 0, width: y.width, height: 24, boxSizing: 'border-box', borderLeft: '1px solid #f3f4f6', borderRight: '1px solid #f3f4f6', background: 'linear-gradient(180deg, #fafafa, #f7f7f7)', color: '#111827', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{y.year}</div>
            ))}
            {monthLabels.map((m) => (
              <div key={m.key} style={{ position: 'absolute', left: m.left, top: 24, width: colW, height: 32, borderLeft: '1px solid #f0f0f0', boxSizing: 'border-box', padding: '6px 8px', fontSize: 12, color: '#555', textTransform: 'capitalize', borderTop: '1px solid #f3f4f6' }}>{m.text}</div>
            ))}
          </div>

          {/* Grid + contenido */}
          <div style={{ position: 'relative', width: contentWidth }}>
            {monthLabels.map((m) => (
              <div key={`bg-${m.key}`} style={{ position: 'absolute', left: m.left, top: 0, bottom: 0, width: colW, background: m.key % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent' }} />
            ))}
            {monthLabels.map((m) => (
              <div key={`grid-${m.key}`} style={{ position: 'absolute', left: m.left, top: 0, bottom: 0, width: 1, background: '#ececec' }} />
            ))}

            {milestones.map((m, i) => (
              <React.Fragment key={`milestone-${i}`}>
                <div style={{ position: 'absolute', left: m.left, top: 0, bottom: 0, width: 2, background: '#ef4444', opacity: 0.95, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', left: m.left + 4, top: 6, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none' }}>{m?.task?.name || 'Boda'}</div>
              </React.Fragment>
            ))}

            {rows.map((row, i) => (
              <div
                key={bar.key}
                onClick={() => handleClick(bar)}
                style={{ position: 'absolute', left: bar.left, top: 40 + i * rowHeight, height: (bar.task?.type === 'subtask') ? Math.max(12, rowHeight * 0.35) : Math.max(16, rowHeight * 0.5), width: bar.width, background: (bar.task?.type === 'subtask') ? '#c7d2fe' : '#a5b4fc', borderRadius: 6, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.12)', overflow: 'hidden', border: (bar.task?.type === 'subtask') ? '1px dashed #818cf8' : 'none' }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.max(0, Math.min(100, Number(bar.task.progress ?? 0)))}%`, background: (bar.task?.type === 'subtask') ? 'linear-gradient(90deg, #93c5fd, #60a5fa)' : 'linear-gradient(90deg, #818cf8, #6366f1)' }} />
                <div style={{ position: 'absolute', left: 8, top: 2, right: 8, bottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: (bar.task?.type === 'subtask') ? '#1e293b' : '#0f172a', fontSize: 12 }}>{bar.task.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}




