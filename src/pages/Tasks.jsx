import React from 'react';
import ErrorBoundary from '../components/tasks/ErrorBoundary';
import TasksRefactored from '../components/tasks/TasksRefactored';
import CalendarSync from '../components/tasks/CalendarSync';
import './Tasks.css';

/**
 * Tasks.jsx - Wrapper para TasksRefactored
 * 
 * Este componente actúa como un wrapper para la versión refactorizada del
 * componente Tasks, que contiene toda la funcionalidad dividida en componentes
 * más pequeños y mantenibles.
 */
export default function Tasks() {
  // Simplemente devolvemos el componente refactorizado
  return (
    <ErrorBoundary>
      {/* Panel de sincronización de calendario (Google) */}
      <CalendarSync />
      <TasksRefactored />
    </ErrorBoundary>
  );
}
