import { Plus, Edit2, Download, Filter, CheckCircle, Circle } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import PageWrapper from '../components/PageWrapper';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import '../styles/wedding-warm.css';

export default function Checklist() {
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [responsibleFilter, setResponsibleFilter] = useState('');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [selected, setSelected] = useState([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', type: '', responsible: '', due: '' });
  const [completed, setCompleted] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('checklistCompleted') || '{}');
    } catch {
      return {};
    }
  });

  const [customTasks, setCustomTasks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('checklistCustomTasks') || '[]');
    } catch {
      return [];
    }
  });

  // Actualizar localStorage cuando cambie el estado de completadas
  useEffect(() => {
    localStorage.setItem('checklistCompleted', JSON.stringify(completed));
  }, [completed]);

  useEffect(() => {
    try {
      localStorage.setItem('checklistCustomTasks', JSON.stringify(customTasks || []));
    } catch {}
  }, [customTasks]);

  const blocks = [
    {
      name: 'Día Previo a la Boda',
      tasks: [
        {
          id: 1,
          title: 'Ensayo general',
          type: 'ensayo',
          responsible: 'Equipo',
          due: '2025-06-17',
          status: 'Pendiente',
        },
      ],
    },
    {
      name: 'Antes de empezar la boda',
      tasks: [
        {
          id: 2,
          title: 'Alinear decoraciones',
          type: 'montaje',
          responsible: 'Rollout',
          due: '2025-06-18',
          status: 'En progreso',
        },
      ],
    },
  ];

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleCompleted = (id) => {
    setCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const resetNewTask = () => setNewTask({ title: '', type: '', responsible: '', due: '' });
  const handleSaveNewTask = (e) => {
    e?.preventDefault?.();
    const title = String(newTask.title || '').trim();
    if (!title) return;
    const id = Date.now();
    const task = {
      id,
      title,
      type: String(newTask.type || '').trim() || 'general',
      responsible: String(newTask.responsible || '').trim() || 'Equipo',
      due: String(newTask.due || '').trim() || '',
      status: 'Pendiente',
    };
    setCustomTasks((prev) => [...prev, task]);
    setShowNewModal(false);
    resetNewTask();
  };

  const allTasks = [...blocks.flatMap(b => b.tasks), ...customTasks];
  const completedCount = allTasks.filter(t => completed[t.id]).length;
  const totalCount = allTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getTaskIcon = (type) => {
    const icons = {
      'ensayo': '🎵',
      'montaje': '🌸',
      'audio/vídeo': '🎥',
      'general': '📝'
    };
    return icons[type] || icons['general'];
  };

  return (
    <div className="ww-page" style={{ padding: '40px 32px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 className="ww-title">Lista de tareas</h1>
      <p className="ww-subtitle">Vamos paso a paso 👰</p>
      
      <div className="ww-card" style={{ marginBottom: '40px', padding: '36px', background: 'linear-gradient(135deg, #FFFFFF 0%, #F9F9F9 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <span style={{ fontSize: '42px', lineHeight: 1 }}>💛</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '26px', fontWeight: 600, color: 'var(--ww-text-primary)', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
              {progressPercent === 100 ? '¡Todo listo!' : progressPercent > 70 ? 'Vais genial' : progressPercent > 30 ? 'Buen progreso' : 'Empezando el camino'}
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--ww-text-secondary)', margin: 0 }}>
              {completedCount} de {totalCount} tareas completadas
            </p>
          </div>
        </div>
        <div style={{ background: '#E8F0ED', height: '14px', borderRadius: '999px', overflow: 'hidden', marginBottom: '16px' }}>
          <div 
            style={{ 
              background: 'linear-gradient(90deg, var(--ww-accent-primary) 0%, var(--ww-accent-light) 100%)',
              height: '100%',
              width: `${progressPercent}%`,
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: '999px',
              boxShadow: progressPercent > 0 ? '0 2px 8px rgba(122, 155, 142, 0.3)' : 'none'
            }}
          />
        </div>
        <p style={{ fontSize: '14px', color: 'var(--ww-text-muted)', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
          No hace falta hacerlo todo hoy. Un paso más hacia vuestro día ✨
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ww-text-primary)', margin: 0 }}>Tareas</h3>
          <button
            onClick={() => setShowNewModal(true)}
            className="ww-btn ww-btn-primary"
          >
            <Plus size={16} /> Nueva Tarea
          </button>
        </div>

        <details style={{ marginBottom: '24px' }}>
          <summary style={{ 
            cursor: 'pointer', 
            fontSize: '13px', 
            color: 'var(--ww-text-secondary)',
            fontWeight: 500,
            padding: '8px 0',
            listStyle: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Filter size={14} /> Filtros
          </summary>
          <div className="ww-toolbar" style={{ marginTop: '12px', padding: '16px', boxShadow: 'none' }}>
            <input
              type="text"
              placeholder="Buscar tarea"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ww-input"
              style={{ flex: '1', minWidth: '200px' }}
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="ww-select"
            >
              <option value="">Tipo</option>
              <option value="ensayo">Ensayo</option>
              <option value="montaje">Montaje</option>
              <option value="audio/vídeo">Audio/Vídeo</option>
            </select>
            <select
              value={responsibleFilter}
              onChange={(e) => setResponsibleFilter(e.target.value)}
              className="ww-select"
            >
              <option value="">Responsable</option>
              <option value="Equipo">Equipo</option>
              <option value="Rollout">Rollout</option>
            </select>
          </div>
        </details>

        {selected.length > 0 && (
          <div className="ww-alert ww-fade-in">
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="ww-btn ww-btn-primary">
                Cambiar estado ({selected.length})
              </button>
              <button className="ww-btn ww-btn-secondary">
                <Download size={16} /> Exportar CSV
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {blocks.flatMap((block) =>
            block.tasks.map((t) => {
              const isCompleted = completed[t.id];
              const statusConfig = {
                'Pendiente': { icon: '🟠', bg: '#FFF3E0', color: '#F57C00' },
                'En progreso': { icon: '🟡', bg: '#FFF9E6', color: '#F9A825' },
                'Completada': { icon: '🟢', bg: '#E8F5E9', color: '#388E3C' }
              };
              const status = isCompleted ? 'Completada' : t.status;
              const config = statusConfig[status] || statusConfig['Pendiente'];
              const taskIcon = getTaskIcon(t.type);
              
              return (
                <div 
                  key={`preset-${t.id}`} 
                  className="ww-card"
                  style={{ 
                    padding: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '18px',
                    opacity: isCompleted ? 0.6 : 1,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    borderLeft: `4px solid ${isCompleted ? 'var(--ww-accent-primary)' : 'transparent'}`,
                    position: 'relative'
                  }}
                >
                  <button
                    aria-label="Marcar completada"
                    onClick={() => toggleCompleted(t.id)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {isCompleted ? (
                      <CheckCircle style={{ color: 'var(--ww-accent-primary)' }} size={26} />
                    ) : (
                      <Circle style={{ color: 'var(--ww-text-muted)' }} size={26} />
                    )}
                  </button>
                  
                  <span style={{ fontSize: '24px', lineHeight: 1 }}>{taskIcon}</span>
                  
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: 'var(--ww-text-primary)', 
                      margin: '0 0 8px 0',
                      textDecoration: isCompleted ? 'line-through' : 'none',
                      lineHeight: 1.3
                    }}>
                      {t.title}
                    </h4>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px', color: 'var(--ww-text-secondary)' }}>
                      <span>{t.responsible}</span>
                      <span>·</span>
                      <span>{t.due}</span>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    borderRadius: '999px',
                    background: config.bg,
                    color: config.color,
                    fontSize: '13px',
                    fontWeight: 600
                  }}>
                    <span>{config.icon}</span>
                    <span>{status}</span>
                  </div>
                </div>
              );
            })
          )}
          {customTasks.map((t) => {
            const isCompleted = completed[t.id];
            const statusConfig = {
              'Pendiente': { icon: '🟠', bg: '#FFF3E0', color: '#F57C00' },
              'En progreso': { icon: '🟡', bg: '#FFF9E6', color: '#F9A825' },
              'Completada': { icon: '🟢', bg: '#E8F5E9', color: '#388E3C' }
            };
            const status = isCompleted ? 'Completada' : t.status;
            const config = statusConfig[status] || statusConfig['Pendiente'];
            const taskIcon = getTaskIcon(t.type);
            
            return (
              <div 
                key={`custom-${t.id}`} 
                className="ww-card"
                style={{ 
                  padding: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '18px',
                  opacity: isCompleted ? 0.6 : 1,
                  transition: 'all 0.3s ease',
                  borderLeft: `4px solid ${isCompleted ? 'var(--ww-accent-primary)' : 'transparent'}`,
                  position: 'relative'
                }}
              >
                <button
                  aria-label="Marcar completada"
                  onClick={() => toggleCompleted(t.id)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {isCompleted ? (
                    <CheckCircle style={{ color: 'var(--ww-accent-primary)' }} size={26} />
                  ) : (
                    <Circle style={{ color: 'var(--ww-text-muted)' }} size={26} />
                  )}
                </button>
                
                <span style={{ fontSize: '24px', lineHeight: 1 }}>{taskIcon}</span>
                
                <div style={{ flex: 1 }}>
                  <h4 style={{ 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: 'var(--ww-text-primary)', 
                    margin: '0 0 8px 0',
                    textDecoration: isCompleted ? 'line-through' : 'none',
                    lineHeight: 1.3
                  }}>
                    {t.title}
                  </h4>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px', color: 'var(--ww-text-secondary)' }}>
                    <span>{t.responsible}</span>
                    <span>·</span>
                    <span>{t.due}</span>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  borderRadius: '999px',
                  background: config.bg,
                  color: config.color,
                  fontSize: '13px',
                  fontWeight: 600
                }}>
                  <span>{config.icon}</span>
                  <span>{status}</span>
                </div>
              </div>
            );
          })}
        </div>

        {showNewModal && (
          <div className="ww-modal-overlay">
            <div className="ww-modal" style={{ width: '450px' }}>
              <h3 className="ww-modal-title">Nueva Tarea</h3>
              <form onSubmit={handleSaveNewTask} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="ww-form-group">
                  <label className="ww-label">Título</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Descripción de la tarea"
                    className="ww-input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="ww-form-group">
                    <label className="ww-label">Tipo</label>
                    <select
                      value={newTask.type}
                      onChange={(e) => setNewTask((p) => ({ ...p, type: e.target.value }))}
                      className="ww-select"
                      style={{ width: '100%' }}
                    >
                      <option value="">General</option>
                      <option value="ensayo">Ensayo</option>
                      <option value="montaje">Montaje</option>
                      <option value="audio/vídeo">Audio/Vídeo</option>
                    </select>
                  </div>
                  <div className="ww-form-group">
                    <label className="ww-label">Responsable</label>
                    <select
                      value={newTask.responsible}
                      onChange={(e) => setNewTask((p) => ({ ...p, responsible: e.target.value }))}
                      className="ww-select"
                      style={{ width: '100%' }}
                    >
                      <option value="">Equipo</option>
                      <option value="Rollout">Rollout</option>
                    </select>
                  </div>
                </div>
                <div className="ww-form-group">
                  <label className="ww-label">Fecha límite</label>
                  <input
                    type="date"
                    value={newTask.due}
                    onChange={(e) => setNewTask((p) => ({ ...p, due: e.target.value }))}
                    className="ww-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => { setShowNewModal(false); resetNewTask(); }}
                    className="ww-btn ww-btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="ww-btn ww-btn-primary"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
