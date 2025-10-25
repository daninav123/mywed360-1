import { useMemo } from 'react';

import { validateAndNormalizeDate, normalizeAnyDate, addMonths } from '../utils/dateUtils';

export function useGanttNormalizedTasks(tasksState) {
  const taskIdSet = useMemo(
    () =>
      new Set(
        (Array.isArray(tasksState) ? tasksState : [])
          .filter(Boolean)
          .map((t) => t?.id)
          .filter(Boolean)
      ),
    [tasksState]
  );

  const safeGanttTasks = useMemo(() => {
    if (!Array.isArray(tasksState)) return [];
    return tasksState
      .filter((t) => t !== null && t !== undefined)
      .map((task) => {
        if (!task.start || !task.end) return null;
        const start = validateAndNormalizeDate(task.start);
        const end = validateAndNormalizeDate(task.end);
        if (!start || !end) return null;
        const deps = Array.isArray(task.dependencies)
          ? task.dependencies.filter((dep) => taskIdSet.has(dep))
          : [];
        return {
          ...task,
          start,
          end,
          name: task.name || task.title || 'Sin título',
          type: task.type || 'task',
          id: task.id,
          progress: task.progress || 0,
          isDisabled: task.isDisabled || false,
          dependencies: deps,
        };
      })
      .filter(Boolean)
      .filter(
        (t) =>
          t &&
          t.start instanceof Date &&
          t.end instanceof Date &&
          !isNaN(t.start.getTime()) &&
          !isNaN(t.end.getTime())
      )
      .map((t) => {
        const startRaw = t.start ?? t.startDate ?? t.date ?? t.when;
        const endRaw = t.end ?? t.endDate ?? t.until ?? t.finish ?? t.to;
        const start = normalizeAnyDate(startRaw);
        const end = normalizeAnyDate(endRaw);
        if (!start || !end || end < start) return null;
        return { ...t, start, end };
      })
      .filter(Boolean);
  }, [tasksState, taskIdSet]);

  const uniqueGanttTasks = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const t of safeGanttTasks) {
      const stableId =
        t.id ||
        `${t.name || t.title || 't'}-${t.start?.toISOString?.() ?? ''}-${t.end?.toISOString?.() ?? ''}`;
      if (!seen.has(stableId)) {
        seen.add(stableId);
        out.push({ ...t, id: stableId });
      }
    }
    return out;
  }, [safeGanttTasks]);

  return { safeGanttTasks, uniqueGanttTasks };
}

export function useGanttBoundedTasks(uniqueGanttTasks, projectStart, projectEnd, meetingsState) {
  const bounded = useMemo(() => {
    const base = Array.isArray(uniqueGanttTasks) ? uniqueGanttTasks : [];
    const out = [];
    let startBound =
      projectStart instanceof Date && !isNaN(projectStart.getTime()) ? projectStart : null;
    let endBound = projectEnd instanceof Date && !isNaN(projectEnd.getTime()) ? projectEnd : null;

    if (!endBound) {
      try {
        const m = (Array.isArray(meetingsState) ? meetingsState : []).find(
          (ev) => ev?.id === 'wedding-day' || ev?.autoKey === 'wedding-day'
        );
        if (m?.start) {
          const d = typeof m.start.toDate === 'function' ? m.start.toDate() : new Date(m.start);
          if (!isNaN(d.getTime())) endBound = d;
        }
      } catch {}
    }

    if (!startBound && endBound) startBound = addMonths(endBound, -12);
    if (startBound && !endBound) endBound = addMonths(startBound, 6);

    if (startBound && endBound) {
      const endPlusOneMonth = addMonths(endBound, 1);
      for (const t of base) {
        try {
          const s = t?.start instanceof Date ? t.start : t?.start ? new Date(t.start) : null;
          const e = t?.end instanceof Date ? t.end : t?.end ? new Date(t.end) : null;
          if (!s || !e) continue;
          const cs = new Date(Math.max(s.getTime(), startBound.getTime()));
          const ce = new Date(Math.min(e.getTime(), endPlusOneMonth.getTime()));
          if (ce.getTime() < cs.getTime()) continue;
          out.push({ ...t, start: cs, end: ce });
        } catch {}
      }
      out.push({
        id: '__gantt_bounds',
        name: '',
        start: new Date(startBound),
        end: new Date(endPlusOneMonth),
        type: 'project',
        progress: 0,
        isDisabled: true,
        styles: {
          backgroundColor: 'transparent',
          backgroundSelectedColor: 'transparent',
          progressColor: 'transparent',
          progressSelectedColor: 'transparent',
        },
      });
    }

    if (out.length === 0) {
      const today = new Date();
      const start = addMonths(today, -1);
      const end = addMonths(today, 1);
      out.push({
        id: '__gantt_bounds_fallback',
        name: '',
        start,
        end,
        type: 'project',
        progress: 0,
        isDisabled: true,
        styles: {
          backgroundColor: 'transparent',
          backgroundSelectedColor: 'transparent',
          progressColor: 'transparent',
          progressSelectedColor: 'transparent',
        },
      });
    }
    return out;
  }, [uniqueGanttTasks, projectStart, projectEnd, meetingsState]);

  return bounded;
}
