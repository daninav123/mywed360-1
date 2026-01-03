import { Plus, CheckCircle, Circle, Download, Trash2, X, FolderPlus } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWedding } from '../context/WeddingContext';
import Nav from '../components/Nav';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import * as checklistAPI from '../api/checklistAPI';

export default function Checklist() {
  const { t } = useTranslation();
  const weddingContext = useWedding();
  const { activeWedding } = weddingContext;
  const [activeTab, setActiveTab] = useState(null);
  const [showNewTabDialog, setShowNewTabDialog] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [tabs, setTabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug: Log wedding context
  useEffect(() => {
    console.log('[Checklist] Wedding Context:', weddingContext);
    console.log('[Checklist] activeWedding:', activeWedding);
    console.log('[Checklist] activeWedding type:', typeof activeWedding);
    console.log('[Checklist] activeWedding truthy?:', !!activeWedding);
  }, [weddingContext, activeWedding]);

  // Cargar tabs desde la API
  useEffect(() => {
    const loadTabs = async () => {
      console.log('[Checklist] loadTabs - activeWedding:', activeWedding);
      
      if (!activeWedding) {
        console.log('[Checklist] No activeWedding, setting loading to false');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await checklistAPI.getTabs(activeWedding);
        
        if (response.success && response.data) {
          setTabs(response.data);
          if (response.data.length > 0 && !activeTab) {
            setActiveTab(response.data[0].id);
          }
        }
      } catch (err) {
        console.error('[Checklist] Error loading tabs:', err);
        setError('Error al cargar las listas');
      } finally {
        setLoading(false);
      }
    };

    loadTabs();
  }, [activeWedding]);

  const currentTab = tabs.find(tab => tab.id === activeTab) || tabs[0];
  const tasks = currentTab?.tasks || [];

  const toggleCompleted = async (taskId) => {
    if (!activeWedding) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompletedState = !task.completed;

    // Optimistic update
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTab 
          ? {
              ...tab,
              tasks: tab.tasks.map(t => 
                t.id === taskId 
                  ? { ...t, completed: newCompletedState, completedAt: newCompletedState ? new Date() : null }
                  : t
              )
            }
          : tab
      )
    );

    try {
      await checklistAPI.updateTask(activeWedding, taskId, newCompletedState);
    } catch (err) {
      console.error('[Checklist] Error updating task:', err);
      // Revert on error
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === activeTab 
            ? {
                ...tab,
                tasks: tab.tasks.map(t => 
                  t.id === taskId 
                    ? { ...t, completed: !newCompletedState }
                    : t
                )
              }
            : tab
        )
      );
    }
  };

  const deleteTask = async (taskId) => {
    if (!activeWedding) return;

    // Optimistic update
    const previousTabs = tabs;
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTab 
          ? { ...tab, tasks: tab.tasks.filter(task => task.id !== taskId) }
          : tab
      )
    );

    try {
      await checklistAPI.deleteTask(activeWedding, taskId);
    } catch (err) {
      console.error('[Checklist] Error deleting task:', err);
      // Revert on error
      setTabs(previousTabs);
    }
  };

  const addTab = async () => {
    if (!newTabName.trim() || !activeWedding) return;
    
    try {
      const response = await checklistAPI.createTab(activeWedding, newTabName.trim());
      
      if (response.success && response.data) {
        setTabs(prev => [...prev, response.data]);
        setActiveTab(response.data.id);
        setNewTabName('');
        setShowNewTabDialog(false);
      }
    } catch (err) {
      console.error('[Checklist] Error creating tab:', err);
    }
  };

  const deleteTab = async (tabId) => {
    if (tabs.length <= 1 || !activeWedding) return;
    
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    const previousTabs = tabs;
    
    // Optimistic update
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    
    if (activeTab === tabId) {
      setActiveTab(newTabs[Math.max(0, tabIndex - 1)].id);
    }

    try {
      await checklistAPI.deleteTab(activeWedding, tabId);
    } catch (err) {
      console.error('[Checklist] Error deleting tab:', err);
      // Revert on error
      setTabs(previousTabs);
      if (activeTab === tabId) {
        setActiveTab(previousTabs[tabIndex].id);
      }
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <>
        <div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" style={{ backgroundColor: '#EDE8E0' }}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto" style={{ borderColor: '#D4A574' }}></div>
              <p className="mt-4" style={{ color: '#6B7280' }}>Cargando...</p>
            </div>
          </div>
        </div>
        <Nav />
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" style={{ backgroundColor: '#EDE8E0' }}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p style={{ color: '#EF4444' }}>{error}</p>
            </div>
          </div>
        </div>
        <Nav />
      </>
    );
  }

  if (!activeWedding) {
    return (
      <>
        <div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" style={{ backgroundColor: '#EDE8E0' }}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md mx-4">
              <div className="mb-4 text-6xl">📋</div>
              <h2 className="text-2xl font-semibold mb-2" style={{ color: '#1F2937' }}>
                No hay boda activa
              </h2>
              <p className="mb-6" style={{ color: '#6B7280' }}>
                Para usar tu lista de tareas, primero necesitas crear o seleccionar una boda.
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={() => window.location.href = '/home'}>
                  <Plus size={16} className="mr-2" />
                  Ir a Inicio
                </Button>
                <button
                  onClick={() => window.location.href = '/info'}
                  className="text-sm"
                  style={{ color: '#D4A574' }}
                >
                  O crear una nueva boda →
                </button>
              </div>
            </div>
          </div>
        </div>
        <Nav />
      </>
    );
  }

  return (
    <>
      <div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" style={{ backgroundColor: '#EDE8E0' }}>
        <div className="mx-auto my-8" style={{
          maxWidth: '1024px',
          width: '100%',
          backgroundColor: '#FFFBF7',
          borderRadius: '32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden'
        }}>
          
          {/* Hero con degradado beige-dorado */}
          <header className="relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, #FFF4E6 0%, #F8EFE3 50%, #E8D5C4 100%)',
            padding: '48px 32px 32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div className="max-w-4xl" style={{ textAlign: 'center' }}>
              {/* Título con líneas decorativas */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '16px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '60px',
                  height: '1px',
                  background: 'linear-gradient(to right, transparent, #D4A574)',
                }} />
                <h1 style={{
                  fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
                  fontSize: '40px',
                  fontWeight: 400,
                  color: '#1F2937',
                  letterSpacing: '-0.01em',
                  margin: 0,
                }}>Lista de Tareas</h1>
                <div style={{
                  width: '60px',
                  height: '1px',
                  background: 'linear-gradient(to left, transparent, #D4A574)',
                }} />
              </div>
              
              {/* Subtítulo como tag uppercase */}
              <p style={{
                fontFamily: "'DM Sans', 'Inter', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '32px',
              }}>ORGANIZACIÓN DE BODA</p>
            </div>
          </header>

          {/* Tabs */}
          <div className="border-b" style={{ borderColor: '#E5E7EB' }}>
            <div className="px-6 pt-6 pb-0">
              <div className="flex items-center gap-2 overflow-x-auto">
                {tabs.map((tab) => (
                  <div key={tab.id} className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className="px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap relative"
                      style={{
                        color: activeTab === tab.id ? '#D4A574' : '#6B7280',
                        borderBottom: activeTab === tab.id ? '2px solid #D4A574' : '2px solid transparent',
                        marginBottom: '-1px',
                      }}
                    >
                      {tab.name}
                    </button>
                    {!tab.isDefault && (
                      <button
                        onClick={() => deleteTab(tab.id)}
                        className="p-1 rounded hover:bg-red-50 transition-colors"
                        style={{ color: '#EF4444' }}
                        title="Eliminar lista"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setShowNewTabDialog(true)}
                  className="px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1"
                  style={{ color: '#D4A574' }}
                >
                  <FolderPlus size={16} />
                  Nueva Lista
                </button>
              </div>
            </div>
          </div>

          {/* Dialog para nueva lista */}
          {showNewTabDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowNewTabDialog(false)}>
              <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()} style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
                <h3 className="text-xl font-semibold mb-4" style={{ color: '#1F2937' }}>Nueva Lista Personalizada</h3>
                <input
                  type="text"
                  value={newTabName}
                  onChange={(e) => setNewTabName(e.target.value)}
                  placeholder="Ej: Luna de Miel, Post-Boda..."
                  onKeyPress={(e) => e.key === 'Enter' && addTab()}
                  autoFocus
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ 
                    borderColor: '#E5E7EB',
                    focusRingColor: '#D4A574'
                  }}
                />
                <div className="flex gap-3 mt-4">
                  <Button onClick={addTab} disabled={!newTabName.trim()}>
                    Crear Lista
                  </Button>
                  <Button variant="secondary" onClick={() => {
                    setShowNewTabDialog(false);
                    setNewTabName('');
                  }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Contenido */}
          <section className="px-6 py-6">
            
            {/* Card de Progreso */}
            <div className="mb-6">
              <div style={{
                backgroundColor: '#FFF4E6',
                borderRadius: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #EEF2F7',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  backgroundColor: '#D4A574',
                  opacity: 0.6,
                }} />
                
                <div className="space-y-3">
                  <h3 style={{
                    color: '#D4A574',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontFamily: "'DM Sans', 'Inter', sans-serif",
                  }}>PROGRESO GENERAL</h3>
                  
                  <p className="text-3xl font-bold" style={{ color: '#D4A574' }}>
                    {progressPercent}%
                  </p>
                  
                  <p className="text-sm" style={{ color: '#8B7355' }}>
                    {completedCount} de {totalCount} tareas completadas
                  </p>
                  
                  <div style={{
                    backgroundColor: '#E8D5C4',
                    height: '8px',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      backgroundColor: '#D4A574',
                      height: '100%',
                      width: `${progressPercent}%`,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Tareas */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold" style={{ color: '#1F2937' }}>
                Tareas Pendientes
              </h2>
              <Button>
                <Plus size={16} className="mr-2" />
                Nueva Tarea
              </Button>
            </div>

            <div className="space-y-3">
              {tasks.map((task) => {
                const isCompleted = completed[task.id];
                
                return (
                  <Card key={task.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleCompleted(task.id)}
                        className="flex-shrink-0 transition-transform hover:scale-110"
                      >
                        {isCompleted ? (
                          <CheckCircle size={24} style={{ color: '#10B981' }} />
                        ) : (
                          <Circle size={24} style={{ color: '#9CA3AF' }} />
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <h3 
                          className="text-base font-medium"
                          style={{
                            color: isCompleted ? '#9CA3AF' : '#1F2937',
                            textDecoration: isCompleted ? 'line-through' : 'none',
                          }}
                        >
                          {task.title}
                        </h3>
                        <p className="text-sm" style={{ color: '#6B7280' }}>
                          {task.category}
                        </p>
                      </div>
                      
                      <div 
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: isCompleted ? '#D1FAE5' : '#FEF3C7',
                          color: isCompleted ? '#065F46' : '#92400E',
                        }}
                      >
                        {isCompleted ? 'Completada' : 'Pendiente'}
                      </div>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="flex-shrink-0 p-2 rounded-lg transition-colors hover:bg-red-50"
                        style={{ color: '#EF4444' }}
                        title="Eliminar tarea"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Acciones */}
            <div className="mt-6 flex gap-3">
              <Button variant="secondary">
                <Download size={16} className="mr-2" />
                Exportar Lista
              </Button>
            </div>

          </section>

        </div>
        {/* Fin contenedor blanco */}
      </div>
      {/* Fin contenedor beige */}
      
      <Nav />
    </>
  );
}
