import React, { useState, useEffect, useMemo } from 'react';
import { useWedding } from '../context/WeddingContext';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004/api';
import { toast } from 'react-toastify';
import { Sparkles, LayoutGrid, Calendar as CalendarIcon, BarChart3, Zap, Filter, Search, AlertCircle, CheckCircle } from 'lucide-react';
import AIAnalysisPanel from '../components/tasks/AIAnalysisPanel';
import RegenerateModal from '../components/tasks/RegenerateModal';
import TaskCardEditable from '../components/tasks/TaskCardEditable';
import KanbanColumn from '../components/tasks/KanbanColumn';
import TaskDetailSidebar from '../components/tasks/TaskDetailSidebar';
import ErrorBoundary from '../components/tasks/ErrorBoundary';
import ProgressBar from '../components/tasks/ProgressBar';
import TimelineView from '../components/tasks/TimelineView';
import NextStepHero from '../components/tasks/NextStepHero';
import RoadmapView from '../components/tasks/RoadmapView';
import { personalizeTaskTemplate, buildWeddingContext } from '../services/taskPersonalizationService';
import { seedWeddingTasksFromTemplate } from '../services/taskTemplateSeeder';
/**
 * Nueva página de tareas con IA - Rediseño completo
 * Vista Kanban moderna con análisis IA integrado
 */
export default function TasksAI() {
  const { activeWedding } = useWedding();
  
  console.log('[TasksAI] 🎯 activeWedding recibido del contexto:', activeWedding);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [weddingContext, setWeddingContext] = useState(null);
  const [weddingFullData, setWeddingFullData] = useState(null);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [viewMode, setViewMode] = useState('roadmap'); // 'roadmap' | 'kanban' | 'timeline' | 'stats'
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailSidebarOpen, setIsDetailSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all'); // 'all' | 'critical' | 'high' | 'medium' | 'low'

  // Cargar tareas en tiempo real
  useEffect(() => {
    // Mismo fallback que en otros lugares - activeWedding puede ser string o objeto
    const weddingId = activeWedding?.id || activeWedding?.weddingId || activeWedding;
    
    if (!weddingId || typeof weddingId !== 'string') {
      console.log('[TasksAI] ⚠️ No hay ID válido para listener de tareas');
      return;
    }

    console.log('[TasksAI] 🎧 Estableciendo listener de tareas para:', weddingId);

    const tasksRef = collection(db, 'weddings', weddingId, 'tasks');
    const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
      const loadedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('[TasksAI] 📋 Tareas cargadas:', loadedTasks.length);
      setTasks(loadedTasks);
    });

    return () => unsubscribe();
  }, [activeWedding]);

  // Cargar análisis IA y contexto
  useEffect(() => {
    console.log('[TasksAI] 📍 useEffect - activeWedding completo:', activeWedding);
    console.log('[TasksAI] 📍 activeWedding?.id existe?:', !!activeWedding?.id);
    
    if (!activeWedding?.id) {
      console.warn('[TasksAI] ⚠️ No hay activeWedding.id - activeWedding:', activeWedding);
      
      // SOLUCIÓN TEMPORAL: Intentar obtener el ID directamente del wedding si existe
      const weddingId = activeWedding?.id || activeWedding?.weddingId || activeWedding;
      
      if (weddingId && typeof weddingId === 'string') {
        console.log('[TasksAI] ✅ ID encontrado en formato alternativo:', weddingId);
        // Continuar con este ID
      } else {
        return;
      }
    }

    const finalWeddingId = activeWedding?.id || activeWedding?.weddingId || activeWedding;
    console.log('[TasksAI] 🔄 Cargando datos de la boda:', finalWeddingId);

    const loadAIAnalysis = async () => {
      try {
        const weddingRef = doc(db, 'weddings', finalWeddingId);
        const weddingSnap = await getDoc(weddingRef);

        if (weddingSnap.exists()) {
          const data = weddingSnap.data();
          
          console.log('[TasksAI] ✅ Datos cargados desde Firestore:', data);
          console.log('[TasksAI] 📋 weddingInfo:', data.weddingInfo);
          
          setWeddingFullData(data);
          
          if (data.taskTemplateMetadata?.analysis) {
            setAiAnalysis(data.taskTemplateMetadata.analysis);
          }

          let context;
          if (data.taskTemplateMetadata?.weddingContext) {
            context = data.taskTemplateMetadata.weddingContext;
          } else {
            context = buildWeddingContext(data);
          }
          setWeddingContext(context);
          
          console.log('[TasksAI] 🎯 Estado actualizado - weddingFullData existe:', !!data);
        } else {
          console.warn('[TasksAI] ⚠️ Wedding document no existe');
        }
      } catch (error) {
        console.error('[TasksAI] ❌ Error cargando análisis:', error);
      }
    };

    loadAIAnalysis();
  }, [activeWedding?.id]);

  // Filtrar y organizar tareas para Kanban
  const organizedTasks = useMemo(() => {
    let filtered = tasks;

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(t => 
        (t.title || t.name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por prioridad
    if (filterPriority !== 'all') {
      if (filterPriority === 'critical') {
        filtered = filtered.filter(t => t.isCritical || t.metadata?.aiRecommendation === 'critical');
      } else {
        filtered = filtered.filter(t => t.priority === filterPriority);
      }
    }

    return {
      pending: filtered.filter(t => !t.completed && (t.status === 'pending' || !t.status)),
      inProgress: filtered.filter(t => !t.completed && t.status === 'in_progress'),
      blocked: filtered.filter(t => !t.completed && t.status === 'blocked'),
      completed: filtered.filter(t => t.completed || t.status === 'completed'),
    };
  }, [tasks, searchQuery, filterPriority]);

  // Calcular próxima tarea más importante
  const nextTask = useMemo(() => {
    const now = new Date();
    const incompleteTasks = tasks.filter(t => !t.completed);
    
    if (incompleteTasks.length === 0) return null;

    // Prioridad 1: Tareas atrasadas críticas
    const overdueCritical = incompleteTasks
      .filter(t => t.dueDate && new Date(t.dueDate) < now && t.isCritical)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    if (overdueCritical.length > 0) return overdueCritical[0];

    // Prioridad 2: Tareas críticas próximas (próximos 7 días)
    const upcomingCritical = incompleteTasks
      .filter(t => {
        if (!t.dueDate || !t.isCritical) return false;
        const dueDate = new Date(t.dueDate);
        const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    if (upcomingCritical.length > 0) return upcomingCritical[0];

    // Prioridad 3: Tareas atrasadas en general
    const overdue = incompleteTasks
      .filter(t => t.dueDate && new Date(t.dueDate) < now)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    if (overdue.length > 0) return overdue[0];

    // Prioridad 4: Tareas de alta prioridad próximas (próximos 7 días)
    const upcomingHigh = incompleteTasks
      .filter(t => {
        if (!t.dueDate || t.priority !== 'high') return false;
        const dueDate = new Date(t.dueDate);
        const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    if (upcomingHigh.length > 0) return upcomingHigh[0];

    // Prioridad 5: Siguiente tarea con fecha más próxima
    const withDates = incompleteTasks
      .filter(t => t.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    if (withDates.length > 0) return withDates[0];

    // Fallback: Primera tarea sin completar
    return incompleteTasks[0];
  }, [tasks]);

  const handleRegenerate = async (newContext) => {
    console.log('[TasksAI] 🚀 handleRegenerate llamado con newContext:', newContext);
    console.log('[TasksAI] 📊 Detalles del contexto recibido:');
    console.log('  - ceremonyType:', newContext?.ceremonyType);
    console.log('  - budget:', newContext?.budget);
    console.log('  - leadTimeMonths:', newContext?.leadTimeMonths);
    console.log('  - guestCount:', newContext?.guestCount);
    console.log('  - style:', newContext?.style);
    console.log('  - city:', newContext?.city);
    console.log('  - weddingDate:', newContext?.weddingDate);
    console.log('  - venueType:', newContext?.venueType);
    
    // Mismo fallback que en useEffect - activeWedding puede ser string o objeto
    const finalWeddingId = activeWedding?.id || activeWedding?.weddingId || activeWedding;
    
    if (!finalWeddingId || typeof finalWeddingId !== 'string') {
      console.error('[TasksAI] ❌ No se pudo obtener ID válido - activeWedding:', activeWedding);
      alert('Error: No se encontró ID de boda válido');
      return;
    }
    
    console.log('[TasksAI] ✅ ID de boda:', finalWeddingId);
    
    setIsRegenerating(true);
    try {
      console.log('[TasksAI] 📞 Llamando a personalizeTaskTemplate con contexto completo...');
      const result = await personalizeTaskTemplate(newContext);
      
      console.log('[TasksAI] ✅ Resultado de IA:', result);
      console.log('[TasksAI] 📦 Tareas generadas:', result.template?.blocks?.length || 0);
      
      if (!result.success) {
        console.error('[TasksAI] ❌ Error en personalización:', result.error);
        throw new Error(result.error);
      }
      
      console.log('[TasksAI] 💾 Guardando metadata en Firestore...');
      console.log('[TasksAI] 💾 Guardando weddingContext:', newContext);
      await setDoc(doc(db, 'weddings', finalWeddingId), {
        taskTemplateMetadata: {
          analysis: result.analysis,
          weddingContext: newContext,
          personalizedAt: new Date().toISOString(),
          usedAI: result.usedAI,
        },
      }, { merge: true });
      
      console.log('[TasksAI] 📝 Generando tareas desde template...');
      await seedWeddingTasksFromTemplate({
        db,
        weddingId: finalWeddingId,
        projectEnd: weddingFullData?.weddingInfo?.weddingDate ? new Date(weddingFullData.weddingInfo.weddingDate) : null,
        customTemplate: result.template,
        skipIfSeeded: false,
        clearPrevious: true,
      });
      
      console.log('[TasksAI] ✅ Tareas generadas exitosamente');
      setAiAnalysis(result.analysis);
      setWeddingContext(newContext);
      setIsRegenerateModalOpen(false);
      toast.success('✨ Plan generado con ' + (result.template?.blocks?.length || 0) + ' tareas personalizadas');
    } catch (error) {
      console.error('[TasksAI] ❌ ERROR en handleRegenerate:', error);
      alert('Error al generar el plan: ' + error.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsDetailSidebarOpen(true);
  };

  const handleTaskComplete = async (task) => {
    try {
      // Mismo fallback de ID
      const weddingId = activeWedding?.id || activeWedding?.weddingId || activeWedding;
      
      if (!weddingId || typeof weddingId !== 'string') {
        console.error('[TasksAI] No se puede completar - ID inválido');
        toast.error('Error: ID de boda inválido');
        return;
      }

      const taskRef = doc(db, 'weddings', weddingId, 'tasks', task.id);
      const newCompleted = !task.completed;
      await updateDoc(taskRef, { 
        completed: newCompleted,
        status: newCompleted ? 'completed' : 'pending',
      });
      toast.success(newCompleted ? '✓ Tarea completada' : '✓ Tarea marcada como pendiente');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Error al actualizar tarea');
    }
  };

  const handleTaskUpdate = async (updatedTask) => {
    try {
      // Mismo fallback de ID
      const weddingId = activeWedding?.id || activeWedding?.weddingId || activeWedding;
      
      if (!weddingId || typeof weddingId !== 'string') {
        console.error('[TasksAI] No se puede actualizar - ID inválido');
        toast.error('Error: ID de boda inválido');
        return;
      }

      const taskRef = doc(db, 'weddings', weddingId, 'tasks', updatedTask.id);
      
      // Actualizar solo los campos editables
      const updateData = {
        title: updatedTask.title,
        name: updatedTask.title,
        notes: updatedTask.notes || '',
        tags: updatedTask.tags || [],
        status: updatedTask.status || 'pending',
        updatedAt: new Date().toISOString(),
      };
      
      await updateDoc(taskRef, updateData);
      toast.success('✓ Tarea actualizada');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Error al actualizar tarea');
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      const taskRef = doc(db, 'weddings', activeWedding.id, 'tasks', taskId);
      await deleteDoc(taskRef);
      toast.success('✓ Tarea eliminada');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Error al eliminar tarea');
    }
  };

  const handleExport = async () => {
    if (!aiAnalysis) {
      toast.warning('No hay análisis IA para exportar');
      return;
    }

    try {
      const exportData = {
        boda: {
          nombre: activeWedding.name || 'Mi Boda',
          fecha: activeWedding.weddingDate || '',
          tipo: weddingContext?.ceremonyType || 'boda',
          invitados: weddingContext?.guestCount || 0,
          presupuesto: weddingContext?.budget || 'medium',
        },
        analisis: {
          resumen: aiAnalysis.summary,
          tareasCriticas: aiAnalysis.criticalBlocks || [],
          tareasOpcionales: aiAnalysis.optionalBlocks || [],
          ajustesTimeline: aiAnalysis.timelineAdjustments || {},
        },
        tareas: tasks.map(t => ({
          titulo: t.title || t.name,
          completada: t.completed,
          prioridad: t.priority,
          critica: t.isCritical,
          fechaLimite: t.dueDate,
        })),
        generadoEn: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plan-boda-ia-${activeWedding.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('📄 Análisis exportado correctamente');
    } catch (error) {
      console.error('[TasksAI] Error exportando:', error);
      toast.error('Error al exportar análisis');
    }
  };

  if (!activeWedding) {
    return (
      <div className="layout-container-wide pt-6">
        <div 
          className="rounded-lg p-6 text-center"
          style={{
            backgroundColor: 'var(--color-yellow)',
            border: '1px solid var(--color-border-soft)',
          }}
        >
          <p className="text-body">
            No hay boda activa. Por favor selecciona o crea una boda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen" className="bg-page">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 
              className="text-3xl font-bold flex items-center gap-3"
              style={{ 
                color: 'var(--color-text)',
                fontFamily: "'Playfair Display', serif",
              }}
            >
              <Sparkles className="w-8 h-8" className="text-primary" />
              Tareas con IA
            </h1>
            <p className="mt-1" className="text-secondary">
              Plan personalizado para tu {weddingContext?.ceremonyType || 'boda'}
            </p>
          </div>

          {/* View mode selector */}
          <div 
            className="flex items-center gap-2 rounded-lg p-1"
            className="bg-surface"
          >
            <button
              onClick={() => setViewMode('roadmap')}
              className="px-3 py-2 rounded-md transition-all flex items-center gap-2"
              style={{
                backgroundColor: viewMode === 'roadmap' ? 'var(--color-lavender)' : 'transparent',
                color: viewMode === 'roadmap' ? 'var(--color-text)' : 'var(--color-text-secondary)',
                boxShadow: viewMode === 'roadmap' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
              title="Vista Roadmap"
            >
              <Sparkles className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Roadmap</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className="px-3 py-2 rounded-md transition-all flex items-center gap-2"
              style={{
                backgroundColor: viewMode === 'kanban' ? 'var(--color-lavender)' : 'transparent',
                color: viewMode === 'kanban' ? 'var(--color-text)' : 'var(--color-text-secondary)',
                boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
              title="Vista Kanban"
            >
              <LayoutGrid className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className="px-3 py-2 rounded-md transition-all flex items-center gap-2"
              style={{
                backgroundColor: viewMode === 'timeline' ? 'var(--color-lavender)' : 'transparent',
                color: viewMode === 'timeline' ? 'var(--color-text)' : 'var(--color-text-secondary)',
                boxShadow: viewMode === 'timeline' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
              title="Vista Timeline"
            >
              <CalendarIcon className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Timeline</span>
            </button>
          </div>
        </div>

          {/* Vista Roadmap - Por defecto */}
          {viewMode === 'roadmap' && (
            <>
              {/* Próximo Paso Hero */}
              <NextStepHero 
                task={nextTask}
                onComplete={handleTaskComplete}
                onViewDetails={(task) => {
                  setSelectedTask(task);
                  setIsDetailSidebarOpen(true);
                }}
              />

              {/* Barra de progreso compacta */}
              <div 
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border-soft)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <ProgressBar tasks={tasks} aiAnalysis={aiAnalysis} />
              </div>

              {/* Roadmap de Fases */}
              <RoadmapView 
                tasks={tasks}
                nextTask={nextTask}
                onTaskClick={(task) => {
                  setSelectedTask(task);
                  setIsDetailSidebarOpen(true);
                }}
              />

              {/* Acciones rápidas */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setIsRegenerateModalOpen(true)}
                  disabled={isRegenerating}
                  className="px-6 py-3 font-semibold rounded-xl transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-on-primary)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                  onMouseEnter={(e) => !isRegenerating && (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  {isRegenerating ? '⏳ Regenerando...' : '🔄 Regenerar Plan con IA'}
                </button>
                <button
                  onClick={handleExport}
                  className="px-6 py-3 font-semibold rounded-xl transition-all"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    border: '2px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-card)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-lavender)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  📄 Exportar Análisis
                </button>
              </div>
            </>
          )}

          {/* Vista Kanban */}
          {viewMode === 'kanban' && (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {/* Columna Pendientes */}
              <div className="flex-shrink-0 w-80">
                <div 
                  className="rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '2px solid var(--color-border-soft)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <div 
                    className="p-4"
                    style={{
                      backgroundColor: 'var(--color-yellow)',
                      borderBottom: '2px solid var(--color-border-soft)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-muted)' }}
                      >
                        <CalendarIcon className="w-6 h-6" style={{ color: 'var(--color-on-primary)' }} />
                      </div>
                      <div>
                        <h3 className="font-bold" className="text-body">⚪ PENDIENTES</h3>
                        <span className="text-xs" className="text-secondary">
                          {organizedTasks.pending.length} tareas
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                    {organizedTasks.pending.map(task => (
                      <TaskCardEditable
                        key={task.id}
                        task={task}
                        onClick={() => handleTaskClick(task)}
                        onComplete={() => handleTaskComplete(task)}
                        onUpdate={handleTaskUpdate}
                      />
                    ))}
                    {organizedTasks.pending.length === 0 && (
                      <div className="text-center py-8 " className="text-muted">
                        <p className="text-sm">No hay tareas pendientes</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Columna En Progreso */}
              <div className="flex-shrink-0 w-80">
                <div 
                  className="rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '2px solid var(--color-primary)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <div 
                    className="p-4"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-primary) 0%, #89CFF0 100%)',
                      borderBottom: '2px solid var(--color-primary)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                      >
                        <Zap className="w-6 h-6" style={{ color: 'var(--color-on-primary)' }} />
                      </div>
                      <div>
                        <h3 className="font-bold" style={{ color: 'var(--color-on-primary)' }}>🔵 EN PROGRESO</h3>
                        <span className="text-xs" style={{ color: 'var(--color-on-primary)', opacity: 0.9 }}>
                          {organizedTasks.inProgress.length} tareas
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                    {organizedTasks.inProgress.map(task => (
                      <TaskCardEditable
                        key={task.id}
                        task={task}
                        onClick={() => handleTaskClick(task)}
                        onComplete={() => handleTaskComplete(task)}
                        onUpdate={handleTaskUpdate}
                      />
                    ))}
                    {organizedTasks.inProgress.length === 0 && (
                      <div className="text-center py-8 " className="text-muted">
                        <p className="text-sm">No hay tareas en progreso</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Columna Bloqueadas */}
              <div className="flex-shrink-0 w-80">
                <div 
                  className="rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '2px solid var(--color-peach)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <div 
                    className="p-4"
                    style={{
                      backgroundColor: 'var(--color-peach)',
                      borderBottom: '2px solid var(--color-border-soft)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: '#FF8C42' }}
                      >
                        <AlertCircle className="w-6 h-6" style={{ color: 'var(--color-on-primary)' }} />
                      </div>
                      <div>
                        <h3 className="font-bold" className="text-body">🟠 BLOQUEADAS</h3>
                        <span className="text-xs" className="text-secondary">
                          {organizedTasks.blocked.length} tareas
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                    {organizedTasks.blocked.map(task => (
                      <TaskCardEditable
                        key={task.id}
                        task={task}
                        onClick={() => handleTaskClick(task)}
                        onComplete={() => handleTaskComplete(task)}
                        onUpdate={handleTaskUpdate}
                      />
                    ))}
                    {organizedTasks.blocked.length === 0 && (
                      <div className="text-center py-8 " className="text-muted">
                        <p className="text-sm">No hay tareas bloqueadas</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Columna Completadas */}
              <div className="flex-shrink-0 w-80">
                <div 
                  className="rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '2px solid var(--color-sage)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <div 
                    className="p-4"
                    style={{
                      backgroundColor: 'var(--color-sage)',
                      borderBottom: '2px solid var(--color-border-soft)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: '#4CAF50' }}
                      >
                        <Sparkles className="w-6 h-6" style={{ color: 'var(--color-on-primary)' }} />
                      </div>
                      <div>
                        <h3 className="font-bold" className="text-body">✅ COMPLETADAS</h3>
                        <span className="text-xs" className="text-secondary">
                          {organizedTasks.completed.length} tareas
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                    {organizedTasks.completed.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => handleTaskClick(task)}
                        onComplete={() => handleTaskComplete(task)}
                      />
                    ))}
                    {organizedTasks.completed.length === 0 && (
                      <div className="text-center py-8 " className="text-muted">
                        <p className="text-sm">¡Aún no has completado ninguna tarea!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vista Timeline */}
        {viewMode === 'timeline' && (
          <TimelineView tasks={tasks} />
        )}

          {/* Vista Estadísticas (placeholder) */}
          {viewMode === 'stats' && (
            <div className=" rounded-xl p-8 text-center border  shadow-sm" className="border-default" className="bg-surface">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 " className="text-muted" />
              <h3 className="text-xl font-semibold  mb-2" className="text-body">
                Estadísticas Avanzadas
              </h3>
              <p className="" className="text-secondary">
                Próximamente: Dashboard con análisis profundo y predicciones IA
              </p>
            </div>
          )}

          {/* Sidebar de detalles */}
          <TaskDetailSidebar
            task={selectedTask}
            isOpen={isDetailSidebarOpen}
            onClose={() => setIsDetailSidebarOpen(false)}
            onUpdate={handleTaskUpdate}
            onDelete={handleTaskDelete}
          />

          {/* Modal de regeneración */}
          <RegenerateModal
            isOpen={isRegenerateModalOpen}
            onClose={() => setIsRegenerateModalOpen(false)}
            onRegenerate={handleRegenerate}
            currentContext={weddingContext}
            weddingData={weddingFullData}
          />
          
          {/* Debug log */}
          {isRegenerateModalOpen && console.log('[TasksAI] 🔍 Pasando al modal - weddingFullData:', weddingFullData)}
        </div>
      </div>
    </ErrorBoundary>
  );
}
