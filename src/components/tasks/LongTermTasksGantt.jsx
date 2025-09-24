import React, { useMemo, useRef, useEffect, useState } from 'react';
import { addMonths, normalizeAnyDate } from './utils/dateUtils.js';
import { auth } from '../../firebaseConfig';
import { ChevronRight, ChevronDown } from 'lucide-react';

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

// Gap de días para agrupar subtareas en segmentos
const SEGMENT_GAP_DAYS = 10;

export default function LongTermTasksGantt({
  containerRef,
  tasks,
  columnWidth,
  rowHeight = 44,
  preSteps, // compat
  viewDate, // compat
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

  // 1) Inyectar hito "Boda" si no existe
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

  // 2) Normalizar tareas
  const normalizedTasks = useMemo(() => {
    const arr = Array.isArray(withWedding) ? withWedding : [];
    return arr
      .map((t) => {
        const s = normalizeAnyDate(t?.start ?? t?.startDate ?? t?.date ?? t?.when);
        const e = normalizeAnyDate(t?.end ?? t?.endDate ?? t?.until ?? t?.finish ?? t?.to);
        if (!s || !e || e < s) return null;
        const type = t?.type ? String(t.type) : t?.milestone ? 'milestone' : 'task';
        return { ...t, id: String(t.id || `${t.title || 't'}-${s.getTime()}-${e.getTime()}`), start: s, end: e, type, name: t.name || t.title || 'Sin titulo' };
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);
  }, [withWedding]);

  // 3) Subtareas normalizadas por parentId
  const normalizedSubtasks = useMemo(() => {
    try {
      const arr = Array.isArray(subtasks) ? subtasks : [];
      return arr
        .map((s) => {
          const start = normalizeAnyDate(s?.start);
          const end = normalizeAnyDate(s?.end);
          const parentId = String(s?.parentId || s?.parentTaskId || s?.parent || '');
          if (!start || !end || end < start || !parentId) return null;
          return {
            id: String(s.id || `${parentId}-${start.getTime()}`),
            name: s.name || s.title || 'Subtarea',
            start,
            end,
            parentId,
            type: 'subtask',
            progress: Number(s.progress) || 0,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.start - b.start);
    } catch {
      return [];
    }
  }, [subtasks]);

  const subtasksByParent = useMemo(() => {
    const map = new Map();
    for (const st of normalizedSubtasks) {
      if (!map.has(st.parentId)) map.set(st.parentId, []);
      map.get(st.parentId).push(st);
    }
    return map;
  }, [normalizedSubtasks]);

  // 4) Fechas base
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

  // 5) Escala mensual
  const monthStart = new Date(timelineStart.getFullYear(), timelineStart.getMonth(), 1);
  const endMonthStart = new Date(timelineEnd.getFullYear(), timelineEnd.getMonth(), 1);
  const monthsDiff = diffMonths(monthStart, endMonthStart);
  const daysInEndMonth = new Date(timelineEnd.getFullYear(), timelineEnd.getMonth() + 1, 0).getDate();
  const endDayIndex = Math.max(0, Math.min(daysInEndMonth, timelineEnd.getDate())) - 1;
  const endFrac = daysInEndMonth > 0 ? (endDayIndex + 1) / daysInEndMonth : 1;
  const totalMonths = Math.max(1, diffMonths(monthStart, endMonthStart) + 1);
  const contentWidth = Math.max(1, monthsDiff * colW + endFrac * colW);

  // 6) Auto scroll a mes actual
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

  // 7) Segmentar padres por huecos de subtareas
  const parentTasks = useMemo(() => normalizedTasks.filter((t) => String(t.type || 'task') === 'task'), [normalizedTasks]);

  const segmentsByParent = useMemo(() => {
    const out = new Map();
    const MS = 24 * 60 * 60 * 1000;
    for (const p of parentTasks) {
      const kids = (subtasksByParent.get(String(p.id)) || []).slice().sort((a, b) => a.start - b.start);
      const segs = [];
      let current = null;
      for (const st of kids) {
        if (!current) {
          current = { id: `${p.id}-seg-0`, parentId: p.id, start: st.start, end: st.end, subtaskIds: [st.id] };
          segs.push(current);
        } else {
          const gapDays = Math.round((st.start.getTime() - current.end.getTime()) / MS);
          if (gapDays > SEGMENT_GAP_DAYS) {
            current = { id: `${p.id}-seg-${segs.length}`, parentId: p.id, start: st.start, end: st.end, subtaskIds: [st.id] };
            segs.push(current);
          } else {
            current.end = new Date(Math.max(current.end.getTime(), st.end.getTime()));
            current.subtaskIds.push(st.id);
          }
        }
      }
      out.set(String(p.id), segs);
    }
    return out;
  }, [parentTasks, subtasksByParent]);

  // 8) Filas: padre -> segmentos -> (opcional) subtareas
  const [expandedParents, setExpandedParents] = useState(() => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('mywed_gantt_expanded_parents') : null;
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch { return new Set(); }
  });
  const [expandedSegments, setExpandedSegments] = useState(() => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('mywed_gantt_expanded_segments') : null;
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch { return new Set(); }
  });

  const toggleParent = (id) => setExpandedParents((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const toggleSegment = (id) => setExpandedSegments((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  // Persistir estado de expansión
  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mywed_gantt_expanded_parents', JSON.stringify(Array.from(expandedParents)));
      }
    } catch {}
  }, [expandedParents]);
  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mywed_gantt_expanded_segments', JSON.stringify(Array.from(expandedSegments)));
      }
    } catch {}
  }, [expandedSegments]);

  const rows = useMemo(() => {
    const out = [];
    for (const p of parentTasks) {
      const pid = String(p.id);
      out.push({ kind: 'parent', id: pid, task: p, level: 0 });
      if (expandedParents.has(pid)) {
        const segs = segmentsByParent.get(pid) || [];
        for (const seg of segs) {
          out.push({ kind: 'segment', id: seg.id, segment: seg, parentId: pid, level: 1 });
          if (expandedSegments.has(seg.id)) {
            const kids = (subtasksByParent.get(pid) || []).filter((st) => seg.subtaskIds.includes(st.id));
            for (const st of kids) out.push({ kind: 'subtask', id: st.id, task: st, parentId: pid, segmentId: seg.id, level: 2 });
          }
        }
      }
    }
    return out;
  }, [parentTasks, expandedParents, expandedSegments, segmentsByParent, subtasksByParent]);

  // 9) Barras por fila (múltiples para padres)
  const bars = useMemo(() => {
    const out = [];
    rows.forEach((row, rowIndex) => {
      if (row.kind === 'parent') {
        // Span global del padre (inicio-fin) como rectángulo transparente
        const p = row.task;
        const ps = normalizeAnyDate(p?.start);
        const pe = normalizeAnyDate(p?.end);
        if (ps && pe && pe >= ps) {
          const sM0 = diffMonths(monthStart, ps);
          const eM0 = diffMonths(monthStart, pe);
          const left0 = Math.max(0, (sM0 + dayFraction(ps)) * colW);
          const right0 = Math.max(0, (eM0 + dayFraction(pe)) * colW);
          const width0 = Math.max(2, right0 - left0 + Math.max(2, Math.floor(colW * 0.1)));
          out.push({ key: `${row.id}-parent-span`, left: left0, width: width0, rowIndex, type: 'parent-span', task: row.task });
        }
        const segs = segmentsByParent.get(String(row.id)) || [];
        segs.forEach((seg, j) => {
          const cs = new Date(Math.max(seg.start.getTime(), timelineStart.getTime()));
          const ce = new Date(Math.min(seg.end.getTime(), timelineEnd.getTime()));
          if (ce.getTime() < cs.getTime()) return;
          const sM = diffMonths(monthStart, cs);
          const eM = diffMonths(monthStart, ce);
          const left = Math.max(0, (sM + dayFraction(cs)) * colW);
          const right = Math.max(0, (eM + dayFraction(ce)) * colW);
          const width = Math.max(2, right - left + Math.max(2, Math.floor(colW * 0.1)));
          out.push({ key: `${row.id}-segbar-${j}`, left, width, rowIndex, type: 'segment-parent', task: row.task });
        });
      } else if (row.kind === 'segment') {
        const seg = row.segment;
        const cs = new Date(Math.max(seg.start.getTime(), timelineStart.getTime()));
        const ce = new Date(Math.min(seg.end.getTime(), timelineEnd.getTime()));
        if (ce.getTime() < cs.getTime()) return;
        const sM = diffMonths(monthStart, cs);
        const eM = diffMonths(monthStart, ce);
        const left = Math.max(0, (sM + dayFraction(cs)) * colW);
        const right = Math.max(0, (eM + dayFraction(ce)) * colW);
        const width = Math.max(2, right - left + Math.max(2, Math.floor(colW * 0.1)));
        out.push({ key: `${row.id}-bar`, left, width, rowIndex, type: 'segment', task: { name: 'Segmento', progress: 0 } });
      } else if (row.kind === 'subtask') {
        const t = row.task;
        const cs = new Date(Math.max(t.start.getTime(), timelineStart.getTime()));
        const ce = new Date(Math.min(t.end.getTime(), timelineEnd.getTime()));
        if (ce.getTime() < cs.getTime()) return;
        const sM = diffMonths(monthStart, cs);
        const eM = diffMonths(monthStart, ce);
        const left = Math.max(0, (sM + dayFraction(cs)) * colW);
        const right = Math.max(0, (eM + dayFraction(ce)) * colW);
        const width = Math.max(2, right - left + Math.max(2, Math.floor(colW * 0.1)));
        out.push({ key: `${row.id}-bar`, left, width, rowIndex, type: 'subtask', task: t });
      }
    });
    return out;
  }, [rows, segmentsByParent, monthStart, colW, timelineStart, timelineEnd]);

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
        currentYear = y; span = 1; startIndex = i;
      } else {
        span += 1;
      }
    }
    labels.push({ year: currentYear, left: startIndex * colW, width: Math.max(colW, span * colW), key: `${currentYear}-${startIndex}` });
    return labels;
  }, [totalMonths, monthStart, colW]);

  const handleClick = (bar) => { if (typeof onTaskClick === 'function') onTaskClick(bar.task || bar); };
  const contentHeight = rows.length * rowHeight + 60;

  return (
    <div className="bg-[var(--color-surface)] rounded-xl shadow-md p-6 transition-all hover:shadow-lg" data-testid="longterm-gantt-new">
      <h2 className="text-xl font-semibold mb-4">Tareas a Largo Plazo</h2>
      {debugEnabled && (
        <div data-testid="gantt-debug" style={{ marginBottom: 8, fontSize: 12, color: '#4b5563', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span>Inicio: {(() => { try { return new Intl.DateTimeFormat('es-ES', { year: 'numeric', month: 'short', day: '2-digit' }).format(timelineStart); } catch { return timelineStart?.toISOString?.().slice(0, 10) || String(timelineStart); } })()}</span>
          <span>Fin: {(() => { try { return new Intl.DateTimeFormat('es-ES', { year: 'numeric', month: 'short', day: '2-digit' }).format(timelineEnd); } catch { return timelineEnd?.toISOString?.().slice(0, 10) || String(timelineEnd); } })()}</span>
        </div>
      )}

      <div className="w-full flex items-stretch gap-3">
        {/* Columna izquierda fija */}
        <div className="shrink-0 rounded-lg border border-gray-100 bg-white" style={{ width: leftColumnWidth, minHeight: contentHeight }}>
          <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 10px', borderBottom: '1px solid #eee', fontWeight: 600, color: '#111827' }}>Tarea</div>
          <div style={{ position: 'relative', minHeight: Math.max(0, contentHeight - 56) }}>
            {rows.map((row, i) => {
              const isParent = row.kind === 'parent';
              const isSegment = row.kind === 'segment';
              const t = row.task || {};
              const leftPad = isParent ? 0 : isSegment ? 12 : 24;
              const parentExpanded = expandedParents.has(row.id);
              const segmentExpanded = expandedSegments.has(row.id);
              const onClick = () => {
                if (isParent) toggleParent(row.id);
                else if (isSegment) toggleSegment(row.id);
                else handleClick({ task: t });
              };
              const progressPct = Math.max(0, Math.min(100, Number(t?.progress ?? 0)));
              // Color de fondo semáforo muy tenue para padres
              const parentBg = isParent
                ? `linear-gradient(90deg, rgba(16,185,129,${0.06 * (progressPct / 100)}), rgba(16,185,129,0))`
                : 'transparent';
              return (
                <div
                  key={`left-${row.kind}-${row.id}-${i}`}
                  id={isParent ? `gantt-row-parent-${row.id}` : undefined}
                  onClick={onClick}
                  title={t?.name || t?.title || ''}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 40 + i * rowHeight,
                    height: rowHeight,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px 10px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    color: '#111827',
                    fontSize: 13,
                    borderBottom: '1px dashed #f0f0f0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    background: parentBg,
                  }}
                >
                  {(isParent || isSegment) ? (
                    <button
                      type="button"
                      aria-label={isParent ? (parentExpanded ? 'ocultar subtareas' : 'ver subtareas') : (segmentExpanded ? 'ocultar tareas del segmento' : 'ver tareas del segmento')}
                      aria-expanded={isParent ? parentExpanded : segmentExpanded}
                      onClick={(e) => { e.stopPropagation(); isParent ? toggleParent(row.id) : toggleSegment(row.id); }}
                      style={{ width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#374151', background: 'transparent', border: 'none' }}
                    >
                      {isParent ? (parentExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : (segmentExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                    </button>
                  ) : (
                    <span style={{ width: 16, display: 'inline-block', opacity: 0.7 }}>•</span>
                  )}
                  {/* Guía vertical/árbol según nivel */}
                  {!isParent && (
                    <span style={{ position: 'absolute', left: 28 + (isSegment ? 0 : 12), top: 0, bottom: 0, width: 1, background: '#e5e7eb' }} />
                  )}
                  <span style={{ marginLeft: leftPad }}>{t?.name || t?.title || (isSegment ? 'Segmento' : 'Tarea')}</span>
                  {isParent && (
                    <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 6px', borderRadius: 10, background: '#eef2ff', color: '#3730a3' }}>{progressPct}%</span>
                  )}
                </div>
              );
            })}
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

            {bars.map((bar) => (
              <div
                key={bar.key}
                onClick={() => handleClick(bar)}
                style={{
                  position: 'absolute',
                  left: bar.left,
                  top: 40 + bar.rowIndex * rowHeight,
                  height:
                    bar.type === 'subtask'
                      ? Math.max(12, rowHeight * 0.35)
                      : bar.type === 'segment'
                      ? Math.max(14, rowHeight * 0.45)
                      : Math.max(16, rowHeight * 0.5),
                  width: bar.width,
                  background:
                    bar.type === 'subtask'
                      ? '#c7d2fe'
                      : bar.type === 'segment'
                      ? '#93c5fd'
                      : bar.type === 'parent-span'
                      ? 'transparent'
                      : '#a5b4fc',
                  borderRadius: 6,
                  cursor: bar.type === 'parent-span' ? 'default' : 'pointer',
                  boxShadow: bar.type === 'parent-span' ? 'none' : '0 2px 6px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                  border:
                    bar.type === 'subtask'
                      ? '1px dashed #818cf8'
                      : bar.type === 'segment'
                      ? '1px solid #60a5fa'
                      : bar.type === 'parent-span'
                      ? '1px solid rgba(99,102,241,0.35)'
                      : 'none',
                  pointerEvents: bar.type === 'parent-span' ? 'none' : 'auto',
                }}
              >
                {bar.type !== 'parent-span' && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${Math.max(0, Math.min(100, Number(bar.task?.progress ?? 0)))}%`,
                      background:
                        bar.type === 'subtask'
                          ? 'linear-gradient(90deg, #93c5fd, #60a5fa)'
                          : 'linear-gradient(90deg, #818cf8, #6366f1)',
                    }}
                  />
                )}
                {bar.type !== 'parent-span' && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 8,
                      top: 2,
                      right: 8,
                      bottom: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: '#0f172a',
                      fontSize: 12,
                    }}
                  >
                    {bar.task?.name || ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

