// Internal view mode strings (no external dependency)
import { useEffect } from 'react';

// Calcula el ancho de columna y el modo de vista del Gantt para encajar el rango
export function useGanttSizing({
  uniqueGanttTasks,
  projectStart,
  projectEnd,
  containerRef,
  columnWidthState,
  setColumnWidthState,
  ganttPreSteps,
  setGanttPreSteps,
  ganttViewDate,
  setGanttViewDate,
  ganttViewMode,
  setGanttViewMode,
}) {
  // Cálculo inicial si no hay rango de proyecto establecido
  useEffect(() => {
    if (!Array.isArray(uniqueGanttTasks) || uniqueGanttTasks.length === 0) return;
    if (projectStart && projectEnd) return;
    const container = containerRef?.current;
    const containerWidth = container && container.clientWidth ? container.clientWidth : 800;

    const starts = uniqueGanttTasks
      .map((t) => (t?.start instanceof Date ? t.start : t?.start ? new Date(t.start) : null))
      .filter((d) => d && !isNaN(d));
    const ends = uniqueGanttTasks
      .map((t) => (t?.end instanceof Date ? t.end : t?.end ? new Date(t.end) : null))
      .filter((d) => d && !isNaN(d));
    if (starts.length === 0 || ends.length === 0) return;
    const minStart = new Date(Math.min(...starts.map((d) => d.getTime())));
    const maxEnd = new Date(Math.max(...ends.map((d) => d.getTime())));

    const msSpan = Math.max(1, maxEnd.getTime() - minStart.getTime());
    const daysSpan = Math.max(1, Math.ceil(msSpan / (1000 * 60 * 60 * 24)));
    let targetMode = 'month';
    if (daysSpan > 730) targetMode = 'year';
    else if (daysSpan > 120) targetMode = 'month';
    else if (daysSpan > 21) targetMode = 'week';
    else targetMode = 'day';

    let units = 1;
    if (targetMode === 'year') {
      const startYear = minStart.getFullYear();
      const endYear = maxEnd.getFullYear();
      units = endYear - startYear + 1;
    } else if (targetMode === 'month') {
      const startMonth = new Date(minStart.getFullYear(), minStart.getMonth(), 1);
      const endMonth = new Date(maxEnd.getFullYear(), maxEnd.getMonth(), 1);
      units =
        (endMonth.getFullYear() - startMonth.getFullYear()) * 12 +
        (endMonth.getMonth() - startMonth.getMonth()) +
        1;
    } else if (targetMode === 'week') {
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      units = Math.max(1, Math.ceil((maxEnd - minStart) / msPerWeek) + 1);
    } else if (targetMode === 'day') {
      units = daysSpan;
    }

    // Forzamos mensual para UX consistente
    const startMonth = new Date(minStart.getFullYear(), minStart.getMonth(), 1);
    const endMonth = new Date(maxEnd.getFullYear(), maxEnd.getMonth(), 1);
    units =
      (endMonth.getFullYear() - startMonth.getFullYear()) * 12 +
      (endMonth.getMonth() - startMonth.getMonth()) +
      1;
    targetMode = 'month';

    const pre = 0;
    const totalUnits = units + pre;
    const MIN_COL = 72;
    const MAX_COL = 160;
    const computedCol = Math.max(
      MIN_COL,
      Math.min(MAX_COL, Math.floor(containerWidth / totalUnits))
    );

    if (columnWidthState !== computedCol) setColumnWidthState(computedCol);
    if (ganttPreSteps !== pre) setGanttPreSteps(pre);
    if (
      !ganttViewDate ||
      (ganttViewDate instanceof Date ? ganttViewDate.getTime() : Number(ganttViewDate)) !==
        startMonth.getTime()
    )
      setGanttViewDate(startMonth);
    if (ganttViewMode !== targetMode) setGanttViewMode(targetMode);

    const onResize = () => {
      const w = containerRef?.current?.clientWidth || 800;
      const col = Math.max(MIN_COL, Math.min(MAX_COL, Math.floor(w / totalUnits)));
      if (columnWidthState !== col) setColumnWidthState(col);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [
    uniqueGanttTasks,
    projectStart,
    projectEnd,
    columnWidthState,
    ganttPreSteps,
    ganttViewDate,
    ganttViewMode,
    containerRef,
  ]);

  // Ajuste reactivo cuando sí tenemos rango de proyecto
  useEffect(() => {
    if (!projectStart || !projectEnd) return;
    if (!containerRef?.current) return;

    const MIN_COL = 72;
    const MAX_COL = 160;

    const computeForWidth = (width) => {
      const startMonth = new Date(projectStart.getFullYear(), projectStart.getMonth(), 1);
      const endMonthBase = new Date(projectEnd.getFullYear(), projectEnd.getMonth(), 1);
      const endMonth = new Date(endMonthBase.getFullYear(), endMonthBase.getMonth() + 1, 1);
      const units = Math.max(
        1,
        (endMonth.getFullYear() - startMonth.getFullYear()) * 12 +
          (endMonth.getMonth() - startMonth.getMonth()) +
          1
      );
      const col = Math.max(MIN_COL, Math.min(MAX_COL, Math.floor(width / units)));
      if (columnWidthState !== col) setColumnWidthState(col);
      if (
        !ganttViewDate ||
        (ganttViewDate instanceof Date ? ganttViewDate.getTime() : Number(ganttViewDate)) !==
          startMonth.getTime()
      )
        setGanttViewDate(startMonth);
      if (ganttViewMode !== 'month') setGanttViewMode('month');
    };

    const el = containerRef.current;
    computeForWidth(el.clientWidth || 800);

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver((entries) => {
        const w = entries?.[0]?.contentRect?.width || el.clientWidth || 800;
        computeForWidth(w);
      });
      ro.observe(el);
    } else {
      const onResize = () => computeForWidth(containerRef.current?.clientWidth || 800);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
    return () => {
      if (ro) ro.disconnect();
    };
  }, [projectStart, projectEnd, columnWidthState, ganttViewDate, ganttViewMode, containerRef]);
}
