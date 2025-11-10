import React, { useMemo } from 'react';

export default function DebugTasksPanel({
  projectStart,
  projectEnd,
  parentsRaw = [],
  uniqueGanttTasks = [],
  ganttTasksBounded = [],
  ganttDisplayTasks = [],
  nestedSubtasks = [],
}) {
  const toDateSafe = (raw) => {
    try {
      if (!raw) return null;
      if (raw instanceof Date) return isNaN(raw) ? null : raw;
      if (typeof raw?.toDate === 'function') {
        const d = raw.toDate();
        return isNaN(d) ? null : d;
      }
      if (typeof raw === 'object' && typeof raw.seconds === 'number') {
        const d = new Date(raw.seconds * 1000);
        return isNaN(d) ? null : d;
      }
      const d = new Date(raw);
      return isNaN(d) ? null : d;
    } catch { return null; }
  };
  const fmt = (d) => {
    try {
      const x = toDateSafe(d);
      if (!x) return 'Invalid Date';
      return x.toISOString().slice(0, 19).replace('T', ' ');
    } catch {
      return 'Invalid Date';
    }
  };

  const analysis = useMemo(() => {
    const out = [];
    const pStart = toDateSafe(projectStart);
    const pEnd = toDateSafe(projectEnd);
    const pEndPlus = pEnd ? new Date(pEnd.getFullYear(), pEnd.getMonth() + 1, pEnd.getDate()) : null;
    for (const t of parentsRaw) {
      if (!t) continue;
      if (String(t.type || 'task') !== 'task') continue;
      let reason = 'ok';
      let s = toDateSafe(t.start);
      let e = toDateSafe(t.end);
      if (!s) reason = 'invalid start';
      else if (!e) reason = 'invalid end';
      else if (e < s) reason = 'end < start';
      else if (pStart && pEndPlus && (e < pStart || s > pEndPlus)) reason = 'out of bounds';
      out.push({ id: t.id, title: t.title || t.name, start: fmt(s), end: fmt(e), reason });
    }
    return out;
  }, [parentsRaw, projectStart, projectEnd]);

  const summary = {
    projectStart: fmt(projectStart),
    projectEnd: fmt(projectEnd),
    parentsRaw: parentsRaw.filter((x) => String(x?.type || 'task') === 'task').length,
    uniqueGanttTasks: uniqueGanttTasks.length,
    ganttTasksBounded: ganttTasksBounded.length,
    ganttDisplayTasks: ganttDisplayTasks.length,
    nestedSubtasks: Array.isArray(nestedSubtasks) ? nestedSubtasks.length : 0,
    hiddenParentsByReason: analysis.reduce((acc, r) => {
      acc[r.reason] = (acc[r.reason] || 0) + (r.reason === 'ok' ? 0 : 1);
      return acc;
    }, {}),
  };

  const copy = async () => {
    try {
      const payload = { summary, sample: analysis.slice(0, 12) };
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      alert('Debug copiado al portapapeles');
    } catch (_) {}
  };

  return (
    <div className="mt-3 p-3 rounded-md border border-amber-300 bg-amber-50 text-amber-900">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Debug Gantt/Tasks (visible solo con debug)</div>
        <button onClick={copy} className="text-xs px-2 py-1 rounded bg-amber-200 hover:bg-amber-300">Copiar</button>
      </div>
      <div className="mt-2 text-xs grid grid-cols-2 gap-y-1 gap-x-4">
        <div>Inicio proyecto: <b>{summary.projectStart}</b></div>
        <div>Fin proyecto: <b>{summary.projectEnd}</b></div>
        <div>Padres (raw): <b>{summary.parentsRaw}</b></div>
        <div>uniqueGanttTasks: <b>{summary.uniqueGanttTasks}</b></div>
        <div>bounded: <b>{summary.ganttTasksBounded}</b></div>
        <div>display: <b>{summary.ganttDisplayTasks}</b></div>
        <div>subtasks (nested): <b>{summary.nestedSubtasks}</b></div>
        <div>Ocultos por: <b>{Object.entries(summary.hiddenParentsByReason || {}).map(([k,v])=>`${k}:${v}`).join(', ') || '—'}</b></div>
      </div>
      <div className="mt-2 max-h-48 overflow-auto text-[11px]">
        {analysis.slice(0, 20).map((r) => (
          <div key={r.id} className="border-b border-amber-200 py-1">
            <b>{r.title}</b> [{r.id}] — {r.start} → {r.end} — {r.reason}
          </div>
        ))}
      </div>
    </div>
  );
}
