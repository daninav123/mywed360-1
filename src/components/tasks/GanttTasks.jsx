import React from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';

// Componente para el diagrama Gantt
export const GanttChart = ({ 
  tasks = [], 
  onTaskClick,
  viewMode = ViewMode.Month, 
  listCellWidth = 0,
  columnWidth = 65,
  rowHeight = 44,
  ganttHeight,
}) => {
  // Tooltip simple que muestra solo el nombre del proceso
  const NameOnlyTooltip = ({ task }) => (
    <div
      style={{
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: 6,
        padding: 8,
        boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
        maxWidth: 320,
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        lineHeight: 1.25,
      }}
    >
      <div style={{ fontWeight: 600 }}>{task.name}</div>
    </div>
  );
  // Garantizar que las tareas estén bien formadas y sin valores vacíos
  // Normalizar fechas y filtrar tareas inválidas
  const normalizeDate = (d) => {
    if (!d) return null;
    if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const cleanTasks = Array.isArray(tasks)
    ? tasks
        .map(t => {
          if (!t) return null;
          const start = normalizeDate(t.start);
          const end = normalizeDate(t.end);
          if (!start || !end) return null;
          return { ...t, start, end };
        })
        .filter(Boolean)
    : [];

  if (cleanTasks.length === 0) {
    // Evitar renderizar el componente de la librería con datos vacíos o corruptos
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No hay tareas válidas para mostrar
      </div>
    );
  }

  const handleClick = (task) => {
    if (typeof onTaskClick === 'function') onTaskClick(task);
  };
  return (
    <Gantt
      tasks={cleanTasks}
      viewMode={viewMode}
      listCellWidth={listCellWidth}
      columnWidth={columnWidth}
      locale="es"
      rowHeight={rowHeight}
      ganttHeight={typeof ganttHeight === 'number' ? ganttHeight : undefined}
      fontSize="12px"
      TooltipContent={NameOnlyTooltip}
      barFill={60}
      barCornerRadius={4}
      barProgressColor="#4f46e5"
      barProgressSelectedColor="#4338ca"
      barBackgroundColor="#a5b4fc"
      barBackgroundSelectedColor="#818cf8"
      todayColor="rgba(252,165,165,0.2)"
      onClick={handleClick}
      onSelect={(task)=>handleClick(task)}
      onDoubleClick={(task)=>handleClick(task)}
    />
  );
};
