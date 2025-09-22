import React from 'react';
import { ViewMode } from 'gantt-task-react';
import { GanttChart } from './GanttTasks';

export default function LongTermTasksGantt({
  containerRef,
  tasks,
  columnWidth,
  rowHeight = 44,
  preSteps = 0,
  viewDate,
  markerDate,
  projectStart,
  projectEnd,
  onTaskClick,
}) {
  const listCellWidth = '';

  const gridStartDate = (() => {
    const s = projectStart instanceof Date && !isNaN(projectStart.getTime()) ? projectStart : markerDate || null;
    return s ? new Date(s.getFullYear(), s.getMonth(), 1) : undefined;
  })();

  const gridEndDate = (() => {
    const e = projectEnd instanceof Date && !isNaN(projectEnd.getTime()) ? projectEnd : markerDate || null;
    if (!e) return undefined;
    const base = new Date(e.getFullYear(), e.getMonth(), 1);
    const lastDayNextMonth = new Date(base.getFullYear(), base.getMonth() + 2, 0);
    return lastDayNextMonth;
  })();

  return (
    <div className="bg-[var(--color-surface)] rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Tareas a Largo Plazo</h2>
      <div
        ref={containerRef}
        className="w-full overflow-hidden mb-4 border border-gray-100 rounded-lg"
        style={{ minHeight: (Array.isArray(tasks) ? tasks.length : 0) * rowHeight + 60 }}
      >
        {tasks && tasks.length > 0 ? (
          <GanttChart
            tasks={tasks}
            viewMode={ViewMode.Month}
            listCellWidth={listCellWidth}
            columnWidth={columnWidth}
            rowHeight={rowHeight}
            ganttHeight={tasks.length * rowHeight}
            preStepsCount={preSteps}
            viewDate={viewDate}
            markerDate={markerDate}
            gridStartDate={gridStartDate}
            gridEndDate={gridEndDate}
            onTaskClick={onTaskClick}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[color:var(--color-text)]/70">
            No hay tareas de largo plazo que mostrar
          </div>
        )}
      </div>
    </div>
  );
}

