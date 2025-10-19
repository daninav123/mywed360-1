import { ChevronRight, ChevronDown } from 'lucide-react';
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Flag } from 'lucide-react';

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

// Gap de días para agrupar subtareas en segmentos
const SEGMENT_GAP_DAYS = 10;

const RISK_STYLES = {
  ok: {
    label: 'En curso',
    fill: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.45)',
    accent: '#10b981',
  },
  warning: {
    label: 'Atención',
    fill: 'rgba(245,158,11,0.18)',
    border: 'rgba(245,158,11,0.6)',
    accent: '#f59e0b',
  },
  critical: {
    label: 'Riesgo',
    fill: 'rgba(220,38,38,0.18)',
    border: 'rgba(220,38,38,0.65)',
    accent: '#dc2626',
  },
};

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
  showSubtasks = false,
  onParentSelect,
}) {
  const colW = Math.max(60, Number(columnWidth) || 90);
  const HEADER_HEIGHT = 56;
  const BODY_PADDING_TOP = 16;
  const BODY_PADDING_BOTTOM = 12;

  const debugEnabled = useMemo(() => {
    try {
      const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
      const isDev = String(env?.MODE || env?.NODE_ENV || '').toLowerCase() !== 'production';
      const flag = typeof localStorage !== 'undefined' ? localStorage.getItem('mywed360_gantt_debug') : null;
      return isDev || flag === '1' || /^true$/i.test(String(flag || ''));
    } catch {
      return false;
    }
  }, []);

  const riskLegend = useMemo(
    () =>
      Object.entries(RISK_STYLES).map(([level, meta]) => ({
        level,
        label: meta.label,
        fill: meta.fill,
        border: meta.border,
        accent: meta.accent,
      })),
    []
  );

  const formatTooltipDate = useCallback((value) => {
    const date = normalizeAnyDate(value);
    if (!date || Number.isNaN(date.getTime())) return null;
    try {
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    } catch {
      return date.toISOString().slice(0, 10);
    }
  }, []);

  const buildParentBarTitle = useCallback(
    (bar, progressPct, riskMeta) => {
      if (!bar?.task) return null;
      const name = bar.task.name || bar.task.title || '';
      const start = formatTooltipDate(bar.startDate ?? bar.task.start);
      const end = formatTooltipDate(bar.endDate ?? bar.task.end);
      const riskLabel = riskMeta?.label;
      const riskMessage = bar.task?.risk?.message;
      const pieces = [];
      if (name) pieces.push(name);
      pieces.push(`Progreso: ${progressPct}%`);
      if (riskLabel) pieces.push(`Riesgo: ${riskLabel}`);
      if (riskMessage && riskMessage !== riskLabel) pieces.push(riskMessage);
      if (start || end) pieces.push(`Período: ${start || 'sin fecha'} → ${end || 'sin fecha'}`);
      return pieces.join('\n');
    },
    [formatTooltipDate]
  );

  const buildGenericBarTitle = useCallback(
    (bar, extra = '') => {
      if (!bar?.task) return null;
      const name = bar.task.name || bar.task.title || '';
      const start = formatTooltipDate(bar.startDate ?? bar.task.start);
      const end = formatTooltipDate(bar.endDate ?? bar.task.end);
      const pieces = [];
      if (name) pieces.push(name);
      if (extra) pieces.push(extra);
      if (start || end) pieces.push(`Período: ${start || 'sin fecha'} → ${end || 'sin fecha'}`);
      return pieces.join('\n');
    },
    [formatTooltipDate]
  );

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
  const slugifyTaskName = useCallback((value) => {
    if (!value) return 'task';
    try {
      return String(value)
        .trim()
        .replace(/[\u2013\u2014\u2212]/g, '-') // en dash em dash minus
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    } catch {
      return String(value).toLowerCase();
    }
  }, []);

  const dedupedNormalized = useMemo(() => {
    const byId = new Map();
    const fallback = new Map();
    const tasks = Array.isArray(withWedding) ? withWedding : [];

    tasks.forEach((raw) => {
      const s = normalizeAnyDate(raw?.start ?? raw?.startDate ?? raw?.date ?? raw?.when);
      const e = normalizeAnyDate(raw?.end ?? raw?.endDate ?? raw?.until ?? raw?.finish ?? raw?.to);
      if (!s || !e || e < s) return;

      const type = raw?.type ? String(raw.type) : raw?.milestone ? 'milestone' : 'task';
      const name = raw.name || raw.title || 'Sin titulo';
      const slug = slugifyTaskName(name);
      const idRaw = raw.id && String(raw.id) !== 'undefined' ? String(raw.id) : '';
      const normalized = { ...raw, id: idRaw || undefined, start: s, end: e, type, name, __slug: slug };

      if (idRaw) {
        const current = byId.get(idRaw);
        if (
          !current ||
          s < current.start ||
          (s.getTime() === current.start.getTime() && e < current.end) ||
          (!current.__slug && slug)
        ) {
          byId.set(idRaw, normalized);
        }
      } else {
        const key = `${type}|${slug}|${s.getTime()}|${e.getTime()}`;
        const current = fallback.get(key);
        if (!current || (current.id && !normalized.id) || (!current.__slug && slug)) {
          fallback.set(key, normalized);
        }
      }
    });

    const combined = [...byId.values(), ...fallback.values()];
    combined.sort((a, b) => a.start - b.start);
    return combined;
  }, [withWedding, slugifyTaskName]);

  const normalizedTasks = useMemo(() => {
    const arr = Array.isArray(withWedding) ? withWedding : [];
    const seen = new Set();
    const out = [];
    dedupedNormalized.forEach((deduped) => {
      const key = deduped.id
        ? `id:${deduped.id}`
        : `${deduped.type}|${deduped.__slug || slugifyTaskName(deduped.name)}|${deduped.start.getTime()}|${deduped.end.getTime()}`;
      if (seen.has(key)) return;
      seen.add(key);

      const original = arr.find((t) => {
        if (deduped.id && String(t?.id || '') === deduped.id) return true;
        const s = normalizeAnyDate(t?.start ?? t?.startDate ?? t?.date ?? t?.when);
        const e = normalizeAnyDate(t?.end ?? t?.endDate ?? t?.until ?? t?.finish ?? t?.to);
        if (!s || !e) return false;
        return (
          String(t?.type ? String(t.type) : t?.milestone ? 'milestone' : 'task') === deduped.type &&
          (t?.name || t?.title || 'Sin titulo') === deduped.name &&
          s.getTime() === deduped.start.getTime() &&
          e.getTime() === deduped.end.getTime()
        );
      });

      out.push(original ? { ...original, ...deduped } : deduped);
    });

    return out;
  }, [withWedding, dedupedNormalized, slugifyTaskName]);

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
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const availableWidth = Math.max(360, viewportWidth - leftColumnWidth - 120);
  const baseWidth = monthsDiff * colW + endFrac * colW;
  const shrinkFactor = baseWidth > availableWidth ? Math.max(availableWidth / baseWidth, 0.2) : 1;
  const effectiveColW = colW * shrinkFactor;
  const scaledWidth = monthsDiff * effectiveColW + endFrac * effectiveColW;
  const contentWidth = Math.max(scaledWidth + effectiveColW * 0.5, availableWidth);
  const horizontalOverflow = scaledWidth > availableWidth + 1;

  const todayMarker = useMemo(() => {
    try {
      const today = normalizeAnyDate(new Date());
      if (!today) return null;
      if (timelineStart && today < timelineStart) return null;
      if (timelineEnd && today > timelineEnd) return null;
      const monthAnchor = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthsFromStart = diffMonths(monthStart, monthAnchor);
      const clampedMonths = Math.max(0, monthsFromStart);
      const left = clampedMonths * effectiveColW + dayFraction(today) * effectiveColW;
      return { left, date: today };
    } catch {
      return null;
    }
  }, [monthStart, timelineStart, timelineEnd, effectiveColW]);

  // 6) Auto scroll a mes actual
  const scrollRef = useRef(null);
  const monthStartKey = monthStart.getTime();
  const timelineEndKey = timelineEnd.getTime();
  const autoScrollDoneRef = useRef(false);

  useEffect(() => {
    autoScrollDoneRef.current = false;
  }, [monthStartKey, timelineEndKey, horizontalOverflow]);

  useEffect(() => {
    if (autoScrollDoneRef.current) return;
    const el = (containerRef && containerRef.current) || (scrollRef && scrollRef.current);
    if (!el) return;
    const today = new Date();
    if (today < monthStart || today > timelineEnd) return;
    const m = diffMonths(monthStart, today);
    if (!horizontalOverflow) {
      el.scrollLeft = 0;
      autoScrollDoneRef.current = true;
      return;
    }
    const left = Math.max(0, m * effectiveColW - el.clientWidth * 0.5);
    el.scrollTo({ left, behavior: 'auto' });
    autoScrollDoneRef.current = true;
  }, [containerRef, monthStart, timelineEnd, effectiveColW, horizontalOverflow, monthStartKey, timelineEndKey]);

  // 7) Segmentar padres por huecos de subtareas
  const parentTasks = useMemo(() => {
    const bySlug = new Map();

    for (const task of normalizedTasks) {
      if (String(task.type || 'task') !== 'task') continue;
      const slug = task.__slug || slugifyTaskName(task.name || task.title || task.id || 'task');
      const current = bySlug.get(slug);
      if (!current) {
        bySlug.set(slug, { ...task, __slug: slug });
        continue;
      }
      const currentStart = current.start?.getTime?.() ?? Number.POSITIVE_INFINITY;
      const taskStart = task.start?.getTime?.() ?? Number.POSITIVE_INFINITY;
      if (taskStart < currentStart) {
        bySlug.set(slug, { ...task, __slug: slug });
      }
    }

    return Array.from(bySlug.values()).sort(
      (a, b) => (a.start?.getTime?.() || 0) - (b.start?.getTime?.() || 0)
    );
  }, [normalizedTasks, slugifyTaskName]);

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

  useEffect(() => {
    if (!showSubtasks) {
      setExpandedParents((prev) => (prev.size === 0 ? prev : new Set()));
      setExpandedSegments((prev) => (prev.size === 0 ? prev : new Set()));
      return;
    }

    const targetParents = new Set(parentTasks.map((p) => String(p.id)));
    const targetSegments = new Set();
    segmentsByParent.forEach((segs) => {
      segs.forEach((seg) => targetSegments.add(seg.id));
    });

    setExpandedParents((prev) => {
      if (prev.size === targetParents.size) {
        let same = true;
        for (const id of targetParents) {
          if (!prev.has(id)) { same = false; break; }
        }
        if (same) return prev;
      }
      return targetParents;
    });

    setExpandedSegments((prev) => {
      if (prev.size === targetSegments.size) {
        let same = true;
        for (const id of targetSegments) {
          if (!prev.has(id)) { same = false; break; }
        }
        if (same) return prev;
      }
      return targetSegments;
    });
  }, [showSubtasks, parentTasks, segmentsByParent]);

  // 8) Filas: padre -> segmentos -> (opcional) subtareas
  const [expandedParents, setExpandedParents] = useState(() => new Set());
  const [expandedSegments, setExpandedSegments] = useState(() => new Set());

  const emitParentSelect = useCallback(
    (parentTask) => {
      if (!parentTask || !parentTask.id) {
        console.warn('[Gantt] Tarea padre sin id válida, se ignora selección', parentTask);
        return;
      }
      if (typeof onParentSelect === 'function') {
        onParentSelect(parentTask);
      }
    },
    [onParentSelect]
  );

  const toggleParent = useCallback(
    (id) => {
      if (!showSubtasks) return;
      setExpandedParents((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    },
    [showSubtasks]
  );

  const toggleSegment = useCallback(
    (id) => {
      if (!showSubtasks) return;
      setExpandedSegments((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    },
    [showSubtasks]
  );

  const rows = useMemo(() => {
    const out = [];
    for (const p of parentTasks) {
      const pid = String(p.id);
      out.push({ kind: 'parent', id: pid, task: p, level: 0 });
      if (expandedParents.has(pid)) {
        const segs = segmentsByParent.get(pid) || [];
        for (const seg of segs) {
          out.push({ kind: 'segment', id: seg.id, segment: seg, parentId: pid, parentTask: p, level: 1 });
          if (expandedSegments.has(seg.id)) {
            const kids = (subtasksByParent.get(pid) || []).filter((st) => seg.subtaskIds.includes(st.id));
            for (const st of kids) {
              out.push({
                kind: 'subtask',
                id: st.id,
                task: st,
                parentId: pid,
                segmentId: seg.id,
                parentTask: p,
                level: 2,
              });
            }
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
        const p = row.task;
        const ps = normalizeAnyDate(p?.start);
        const pe = normalizeAnyDate(p?.end);
        if (!ps || !pe || pe < ps) return;
        const sM0 = diffMonths(monthStart, ps);
        const eM0 = diffMonths(monthStart, pe);
        const left0 = Math.max(0, (sM0 + dayFraction(ps)) * effectiveColW);
        const right0 = Math.max(0, (eM0 + dayFraction(pe)) * effectiveColW);
        const width0 = Math.max(2, right0 - left0 + Math.max(2, Math.floor(effectiveColW * 0.1)));

        const riskLevel = String((p?.risk && p.risk.level) || 'ok');
        const segs = segmentsByParent.get(String(row.id)) || [];

        if (showSubtasks) {
          // Span global del padre (inicio-fin) como rectángulo transparente
          out.push({
            key: `${row.id}-parent-span`,
            left: left0,
            width: width0,
            rowIndex,
            type: 'parent-span',
            task: row.task,
            riskLevel,
            startDate: ps,
            endDate: pe,
          });
          segs.forEach((seg, j) => {
            const cs = new Date(Math.max(seg.start.getTime(), timelineStart.getTime()));
            const ce = new Date(Math.min(seg.end.getTime(), timelineEnd.getTime()));
            if (ce.getTime() < cs.getTime()) return;
            const sM = diffMonths(monthStart, cs);
            const eM = diffMonths(monthStart, ce);
            const left = Math.max(0, (sM + dayFraction(cs)) * effectiveColW);
            const right = Math.max(0, (eM + dayFraction(ce)) * effectiveColW);
            const width = Math.max(2, right - left + Math.max(2, Math.floor(effectiveColW * 0.1)));
            out.push({
              key: `${row.id}-segbar-${j}`,
              left,
              width,
              rowIndex,
              type: 'segment-parent',
              task: row.task,
              riskLevel,
              startDate: cs,
              endDate: ce,
            });
          });
        } else {
          if (segs.length > 0) {
            segs.forEach((seg, j) => {
              const cs = new Date(Math.max(seg.start.getTime(), timelineStart.getTime()));
              const ce = new Date(Math.min(seg.end.getTime(), timelineEnd.getTime()));
              if (ce.getTime() < cs.getTime()) return;
              const sM = diffMonths(monthStart, cs);
              const eM = diffMonths(monthStart, ce);
              const left = Math.max(0, (sM + dayFraction(cs)) * effectiveColW);
              const right = Math.max(0, (eM + dayFraction(ce)) * effectiveColW);
              const width = Math.max(2, right - left + Math.max(2, Math.floor(effectiveColW * 0.1)));
              const kids = (subtasksByParent.get(String(row.id)) || []).filter((st) => seg.subtaskIds.includes(st.id));
              const segProgress =
                kids.length > 0
                  ? Math.round(
                      kids.reduce((acc, kid) => acc + Math.max(0, Math.min(100, Number(kid.progress ?? 0))), 0) /
                        kids.length
                    )
                  : Math.max(0, Math.min(100, Number(p?.progress ?? 0)));
              out.push({
                key: `${row.id}-parent-segment-${j}`,
                left,
                width,
                rowIndex,
                type: 'parent-segment',
                task: { ...row.task, progress: segProgress, segmentIndex: j },
                progress: segProgress,
                riskLevel,
                startDate: cs,
                endDate: ce,
              });
            });
          } else {
            const progress = Math.max(0, Math.min(100, Number(p?.progress ?? 0)));
            out.push({
              key: `${row.id}-parent-condensed`,
              left: left0,
              width: width0,
              rowIndex,
              type: 'parent-condensed',
              task: row.task,
              progress,
              riskLevel,
              startDate: ps,
              endDate: pe,
            });
          }
        }
      } else if (row.kind === 'segment') {
        const seg = row.segment;
        const parentTask = row.parentTask;
        const cs = new Date(Math.max(seg.start.getTime(), timelineStart.getTime()));
        const ce = new Date(Math.min(seg.end.getTime(), timelineEnd.getTime()));
        if (ce.getTime() < cs.getTime()) return;
        const sM = diffMonths(monthStart, cs);
        const eM = diffMonths(monthStart, ce);
        const left = Math.max(0, (sM + dayFraction(cs)) * effectiveColW);
        const right = Math.max(0, (eM + dayFraction(ce)) * effectiveColW);
        const width = Math.max(2, right - left + Math.max(2, Math.floor(effectiveColW * 0.1)));
        const kids = (subtasksByParent.get(String(row.parentId)) || []).filter((st) =>
          seg.subtaskIds.includes(st.id)
        );
        const segProgress =
          kids.length > 0
            ? Math.round(
                kids.reduce(
                  (acc, kid) => acc + Math.max(0, Math.min(100, Number(kid.progress ?? kid.completion ?? 0))),
                  0
                ) / kids.length
              )
            : Math.max(0, Math.min(100, Number(parentTask?.progress ?? 0)));
        out.push({
          key: `${row.id}-bar`,
          left,
          width,
          rowIndex,
          type: 'segment',
          task: parentTask || { name: 'Segmento', progress: segProgress },
          parentTask: parentTask || null,
          progress: segProgress,
          startDate: cs,
          endDate: ce,
          segment: seg,
        });
      } else if (row.kind === 'subtask') {
        const t = row.task;
        const cs = new Date(Math.max(t.start.getTime(), timelineStart.getTime()));
        const ce = new Date(Math.min(t.end.getTime(), timelineEnd.getTime()));
        if (ce.getTime() < cs.getTime()) return;
        const sM = diffMonths(monthStart, cs);
        const eM = diffMonths(monthStart, ce);
        const left = Math.max(0, (sM + dayFraction(cs)) * effectiveColW);
        const right = Math.max(0, (eM + dayFraction(ce)) * effectiveColW);
        const width = Math.max(2, right - left + Math.max(2, Math.floor(effectiveColW * 0.1)));
        out.push({
          key: `${row.id}-bar`,
          left,
          width,
          rowIndex,
          type: 'subtask',
          task: t,
          startDate: cs,
          endDate: ce,
        });
      }
    });
    return out;
  }, [rows, segmentsByParent, monthStart, effectiveColW, timelineStart, timelineEnd, showSubtasks]);

  const milestoneMarkers = useMemo(() => {
    if (!Array.isArray(normalizedTasks) || normalizedTasks.length === 0) return [];
    const items = [];
    normalizedTasks.forEach((task) => {
      if (String(task?.type || '') !== 'milestone') return;
      const milestoneDate = normalizeAnyDate(task.start ?? task.date ?? task.end);
      if (!milestoneDate || Number.isNaN(milestoneDate.getTime())) return;
      if (milestoneDate < timelineStart || milestoneDate > timelineEnd) return;
      const monthDelta = diffMonths(monthStart, milestoneDate);
      const left = Math.max(0, (monthDelta + dayFraction(milestoneDate)) * effectiveColW);
      const key =
        task.id ||
        task.__slug ||
        `${milestoneDate.getTime()}-${task.name || task.title || 'milestone'}`;
      items.push({
        key,
        left,
        task,
        date: milestoneDate,
        name: task.name || task.title || 'Hito',
      });
    });
    items.sort((a, b) => a.date - b.date);
    return items;
  }, [normalizedTasks, timelineStart, timelineEnd, monthStart, effectiveColW]);

  const monthLabels = useMemo(() => {
    const labels = [];
    for (let i = 0; i < totalMonths; i++) {
      const d = new Date(monthStart.getFullYear(), monthStart.getMonth() + i, 1);
      labels.push({ key: i, text: new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(d), left: i * effectiveColW, date: d });
    }
    return labels;
  }, [totalMonths, monthStart, effectiveColW]);

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
        labels.push({ year: currentYear, left: startIndex * effectiveColW, width: Math.max(effectiveColW, span * effectiveColW), key: `${currentYear}-${startIndex}` });
        currentYear = y; span = 1; startIndex = i;
      } else {
        span += 1;
      }
    }
    labels.push({ year: currentYear, left: startIndex * effectiveColW, width: Math.max(effectiveColW, span * effectiveColW), key: `${currentYear}-${startIndex}` });
    return labels;
  }, [totalMonths, monthStart, effectiveColW]);

  const handleBarClick = useCallback(
    (bar) => {
      if (!bar) return;
      if (bar.type === 'parent-span') return;
      if (
        bar.type === 'parent-condensed' ||
        bar.type === 'parent-segment' ||
        bar.type === 'segment-parent'
      ) {
        emitParentSelect(bar.task);
        return;
      }
      if (bar.type === 'segment') {
        const targetParent = bar.parentTask || bar.task;
        emitParentSelect(targetParent);
        return;
      }
      if (bar.type === 'subtask' && typeof onTaskClick === 'function') {
        onTaskClick(bar.task || bar);
      }
    },
    [onTaskClick, emitParentSelect]
  );
  const baseRowsHeight = Math.max(rows.length, 1) * rowHeight;
  const bodyHeight = baseRowsHeight + BODY_PADDING_TOP + BODY_PADDING_BOTTOM;
  const contentHeight = HEADER_HEIGHT + bodyHeight;

  return (
    <div className="bg-[var(--color-surface)] rounded-xl shadow-md p-6 transition-all hover:shadow-lg" data-testid="longterm-gantt-new">
      <h2 className="text-xl font-semibold mb-4">Tareas a Largo Plazo</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        {riskLegend.map((item) => (
          <span
            key={item.level}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 10px',
              borderRadius: 999,
              border: `1px solid ${item.border}`,
              background: item.fill,
              color: '#0f172a',
              fontSize: 12,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: item.accent,
              }}
            />
            {item.label}
          </span>
        ))}
      </div>
      {debugEnabled && (
        <div data-testid="gantt-debug" style={{ marginBottom: 8, fontSize: 12, color: '#4b5563', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span>Inicio: {(() => { try { return new Intl.DateTimeFormat('es-ES', { year: 'numeric', month: 'short', day: '2-digit' }).format(timelineStart); } catch { return timelineStart?.toISOString?.().slice(0, 10) || String(timelineStart); } })()}</span>
          <span>Fin: {(() => { try { return new Intl.DateTimeFormat('es-ES', { year: 'numeric', month: 'short', day: '2-digit' }).format(timelineEnd); } catch { return timelineEnd?.toISOString?.().slice(0, 10) || String(timelineEnd); } })()}</span>
        </div>
      )}

      <div className="w-full flex items-stretch gap-3">
        {/* Columna izquierda fija */}
        <div className="shrink-0 rounded-lg border border-gray-100 bg-white" style={{ width: leftColumnWidth, height: contentHeight }}>
          <div style={{ height: HEADER_HEIGHT, display: 'flex', alignItems: 'center', padding: '0 10px', borderBottom: '1px solid #eee', fontWeight: 600, color: '#111827' }}>Tarea</div>
          <div style={{ position: 'relative', height: bodyHeight, paddingTop: BODY_PADDING_TOP, paddingBottom: BODY_PADDING_BOTTOM }}>
            {rows.map((row, i) => {
              const isParent = row.kind === 'parent';
              const isSegment = row.kind === 'segment';
              const t = row.task || {};
              const leftPad = isParent ? 0 : isSegment ? 12 : 24;
              const parentExpanded = showSubtasks && expandedParents.has(row.id);
              const segmentExpanded = showSubtasks && expandedSegments.has(row.id);
              const onClick = () => {
                if (isParent) {
                  if (showSubtasks) toggleParent(row.id);
                  else emitParentSelect(row.task);
                } else if (isSegment) {
                  if (showSubtasks) toggleSegment(row.id);
                } else {
                  handleBarClick({ type: 'subtask', task: t });
                }
              };
              const riskLevel = isParent ? String(t?.risk?.level || 'ok') : 'ok';
              const riskMeta = RISK_STYLES[riskLevel] || RISK_STYLES.ok;
              const riskTitle = t?.risk?.message || riskMeta.label;
              const parentBg = isParent ? riskMeta.fill : 'transparent';
              const zebraBg = i % 2 === 0 ? 'rgba(148, 163, 184, 0.08)' : 'transparent';
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
                    top: i * rowHeight,
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
                    background: isParent ? parentBg : zebraBg,
                    borderLeft: isParent ? `3px solid ${riskMeta.accent}` : undefined,
                  }}
                >
                  {isParent ? (
                    showSubtasks ? (
                      <button
                        type="button"
                        aria-label={parentExpanded ? 'Ocultar subtareas' : 'Ver subtareas'}
                        aria-expanded={parentExpanded}
                        onClick={(e) => { e.stopPropagation(); toggleParent(row.id); }}
                        style={{ width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#374151', background: 'transparent', border: 'none' }}
                      >
                        {parentExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label="Ver detalles de la tarea padre"
                        onClick={(e) => { e.stopPropagation(); emitParentSelect(row.task); }}
                        style={{ width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8', background: 'transparent', border: 'none' }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    )
                  ) : isSegment ? (
                    showSubtasks ? (
                      <button
                        type="button"
                        aria-label={segmentExpanded ? 'Ocultar tareas del segmento' : 'Ver tareas del segmento'}
                        aria-expanded={segmentExpanded}
                        onClick={(e) => { e.stopPropagation(); toggleSegment(row.id); }}
                        style={{ width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#374151', background: 'transparent', border: 'none' }}
                      >
                        {segmentExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    ) : (
                      <span style={{ width: 16, display: 'inline-block', opacity: 0.7 }}>•</span>
                    )
                  ) : (
                    <span style={{ width: 16, display: 'inline-block', opacity: 0.7 }}>•</span>
                  )}
                  {/* Guía vertical/árbol según nivel */}
                  {!isParent && showSubtasks && (
                    <span style={{ position: 'absolute', left: 28 + (isSegment ? 0 : 12), top: 0, bottom: 0, width: 1, background: '#e5e7eb' }} />
                  )}
                  <span style={{ marginLeft: leftPad }}>{t?.name || t?.title || (isSegment ? 'Segmento' : 'Tarea')}</span>
                  {isParent && riskLevel !== 'ok' && (
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: riskMeta.fill,
                          color: riskMeta.accent,
                          border: `1px solid ${riskMeta.border}`,
                        }}
                        title={riskTitle}
                      >
                        {riskMeta.label}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Zona scrollable */}
        <div
          ref={containerRef || scrollRef}
          className="grow overflow-y-hidden mb-4 border border-gray-100 rounded-lg"
          style={{ height: contentHeight, overflowX: horizontalOverflow ? 'auto' : 'hidden' }}
          data-testid="longterm-gantt-scroll"
        >
          {/* Cabecera: años + meses */}
          <div style={{ position: 'relative', height: HEADER_HEIGHT, borderBottom: '1px solid #eee', width: contentWidth }}>
            {yearLabels.map((y) => (
              <div key={y.key} style={{ position: 'absolute', left: y.left, top: 0, width: y.width, height: 24, boxSizing: 'border-box', borderLeft: '1px solid #f3f4f6', borderRight: '1px solid #f3f4f6', background: 'linear-gradient(180deg, #fafafa, #f7f7f7)', color: '#111827', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{y.year}</div>
            ))}
            {monthLabels.map((m) => (
              <div key={m.key} style={{ position: 'absolute', left: m.left, top: 24, width: effectiveColW, height: 32, borderLeft: '1px solid #f0f0f0', boxSizing: 'border-box', padding: '6px 8px', fontSize: 12, color: '#555', textTransform: 'capitalize', borderTop: '1px solid #f3f4f6' }}>{m.text}</div>
            ))}
          </div>

          {/* Grid + contenido */}
          <div style={{ position: 'relative', width: contentWidth, height: bodyHeight, paddingTop: BODY_PADDING_TOP, paddingBottom: BODY_PADDING_BOTTOM }}>
            {monthLabels.map((m) => (
              <div
                key={`bg-${m.key}`}
                style={{
                  position: 'absolute',
                  left: m.left,
                  top: 0,
                  bottom: 0,
                  width: effectiveColW,
                  background: m.key % 2 === 0 ? 'rgba(15, 23, 42, 0.03)' : 'transparent',
                }}
              />
            ))}
            {rows.map((row, rowIdx) => (
              <div
                key={`row-stripe-${row.id}-${rowIdx}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: rowIdx * rowHeight,
                  height: rowHeight,
                  background: rowIdx % 2 === 0 ? 'rgba(148, 163, 184, 0.05)' : 'transparent',
                  pointerEvents: 'none',
                }}
              />
            ))}
            {monthLabels.map((m) => (
              <div
                key={`grid-${m.key}`}
                style={{
                  position: 'absolute',
                  left: m.left,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: '#ececec',
                }}
              />
            ))}
            {monthLabels
              .filter((m) => m.date?.getMonth?.() % 3 === 0)
              .map((m) => (
                <div
                  key={`quarter-${m.key}`}
                  style={{
                    position: 'absolute',
                    left: m.left,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: 'rgba(15, 23, 42, 0.08)',
                    pointerEvents: 'none',
                  }}
                />
              ))}
            {todayMarker && (
              <div
                style={{
                  position: 'absolute',
                  left: todayMarker.left,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: 'rgba(37, 99, 235, 0.5)',
                  pointerEvents: 'none',
                  zIndex: 11,
                }}
              />
            )}
            {milestoneMarkers.map((milestone) => (
              <div
                key={milestone.key}
                style={{
                  position: 'absolute',
                  left: milestone.left,
                  top: 0,
                  bottom: 0,
                  width: 0,
                  pointerEvents: 'none',
                  zIndex: 12,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -BODY_PADDING_TOP + 6,
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 6px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.9)',
                    color: '#dc2626',
                    fontSize: 11,
                    fontWeight: 600,
                    boxShadow: '0 2px 6px rgba(220,38,38,0.18)',
                    border: '1px solid rgba(220,38,38,0.35)',
                  }}
                  title={formatTooltipDate(milestone.date) || undefined}
                >
                  <Flag size={14} strokeWidth={2} />
                  <span>{milestone.name}</span>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: -1,
                    width: 2,
                    background: 'linear-gradient(180deg, rgba(220,38,38,0), rgba(220,38,38,0.65))',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: -Math.max(4, BODY_PADDING_BOTTOM * 0.2),
                    left: 0,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#dc2626',
                    transform: 'translate(-50%, 50%)',
                    boxShadow: '0 0 0 2px rgba(220,38,38,0.2)',
                  }}
                />
              </div>
            ))}

            {bars.map((bar) => {
              const riskLevel = String(bar.riskLevel || bar.task?.risk?.level || 'ok');
              const riskMeta = RISK_STYLES[riskLevel] || RISK_STYLES.ok;
              const baseProgress =
                typeof bar.progress === 'number' && Number.isFinite(bar.progress)
                  ? bar.progress
                  : Number(bar.task?.progress ?? 0);
              const progressPct = Math.max(
                0,
                Math.min(100, Number.isFinite(baseProgress) ? baseProgress : 0)
              );
              const isParentBar =
                bar.type === 'parent-condensed' ||
                bar.type === 'parent-segment' ||
                bar.type === 'segment-parent';
              const tooltip =
                bar.type === 'parent-span'
                  ? null
                  : isParentBar
                  ? buildParentBarTitle(bar, progressPct, riskMeta)
                  : bar.type === 'segment'
                  ? buildGenericBarTitle(bar, 'Segmento')
                  : bar.type === 'subtask'
                  ? buildGenericBarTitle(
                      bar,
                      progressPct > 0 ? `Progreso: ${progressPct}%` : ''
                    )
                  : buildGenericBarTitle(bar);
              const barHeight =
                bar.type === 'subtask'
                  ? Math.max(12, rowHeight * 0.35)
                  : bar.type === 'segment'
                  ? Math.max(14, rowHeight * 0.45)
                  : isParentBar
                  ? Math.max(18, rowHeight * 0.55)
                  : Math.max(16, rowHeight * 0.5);
              const verticalOffset = Math.max(0, (rowHeight - barHeight) / 2);
              const barTop = bar.rowIndex * rowHeight + verticalOffset;
              return (
              <div
                key={bar.key}
                onClick={() => handleBarClick(bar)}
                title={tooltip || undefined}
                style={{
                  position: 'absolute',
                  left: bar.left,
                  top: barTop,
                  height: barHeight,
                  width: bar.width,
                  background:
                    bar.type === 'subtask'
                      ? '#c7d2fe'
                      : bar.type === 'segment'
                      ? '#93c5fd'
                      : bar.type === 'parent-span'
                      ? 'transparent'
                      : isParentBar
                      ? riskMeta.fill
                      : '#a5b4fc',
                  borderRadius: 6,
                  cursor: bar.type === 'parent-span' ? 'default' : 'pointer',
                  boxShadow:
                    bar.type === 'parent-span'
                      ? 'none'
                      : isParentBar
                      ? `0 3px 10px ${riskMeta.border}`
                      : '0 2px 6px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                  border:
                    bar.type === 'subtask'
                      ? '1px dashed #818cf8'
                      : bar.type === 'segment'
                      ? '1px solid #60a5fa'
                      : bar.type === 'parent-span'
                      ? `1px solid ${riskMeta.border}`
                      : isParentBar
                      ? `1px solid ${riskMeta.border}`
                      : 'none',
                  pointerEvents: bar.type === 'parent-span' ? 'none' : 'auto',
                }}
              >
                {isParentBar && progressPct > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${progressPct}%`,
                      background: 'linear-gradient(90deg, rgba(15,23,42,0.25), rgba(15,23,42,0.12))',
                      mixBlendMode: 'multiply',
                      borderRadius: 'inherit',
                    }}
                  />
                )}
                {!isParentBar && bar.type !== 'parent-span' && progressPct > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${progressPct}%`,
                      background:
                        bar.type === 'subtask'
                          ? 'linear-gradient(90deg, #93c5fd, #60a5fa)'
                          : `linear-gradient(90deg, ${riskMeta.accent}, ${riskMeta.accent})`,
                      borderRadius: 'inherit',
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
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

