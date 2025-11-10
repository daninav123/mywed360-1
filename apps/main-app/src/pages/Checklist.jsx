import { Plus, Edit2, Download, Filter, CheckCircle, Circle } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import PageWrapper from '../components/PageWrapper';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

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

  return (
    <PageWrapper title="Checklist">
      <div className="space-y-8">
        {/* Controles */}
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Buscar tarea"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-2 py-1 border-[color:var(--color-text)]/20 bg-[var(--color-surface)] text-[color:var(--color-text)]"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border rounded px-2 py-1 border-[color:var(--color-text)]/20 bg-[var(--color-surface)] text-[color:var(--color-text)]"
          >
            <option value="">Tipo</option>
            <option value="ensayo">Ensayo</option>
            <option value="montaje">Montaje</option>
            <option value="audio/vídeo">Audio/Vídeo</option>
          </select>
          <select
            value={responsibleFilter}
            onChange={(e) => setResponsibleFilter(e.target.value)}
            className="border rounded px-2 py-1 border-[color:var(--color-text)]/20 bg-[var(--color-surface)] text-[color:var(--color-text)]"
          >
            <option value="">Responsable</option>
            <option value="Equipo">Equipo</option>
            <option value="Rollout">Rollout</option>
          </select>
          <input
            type="date"
            value={dateFilter.from}
            onChange={(e) => setDateFilter((prev) => ({ ...prev, from: e.target.value }))}
            className="border rounded px-2 py-1 border-[color:var(--color-text)]/20 bg-[var(--color-surface)] text-[color:var(--color-text)]"
          />
          <input
            type="date"
            value={dateFilter.to}
            onChange={(e) => setDateFilter((prev) => ({ ...prev, to: e.target.value }))}
            className="border rounded px-2 py-1 border-[color:var(--color-text)]/20 bg-[var(--color-surface)] text-[color:var(--color-text)]"
          />

          <button
            onClick={() => setShowNewModal(true)}
            className="bg-[var(--color-primary)] text-white px-3 py-1 rounded flex items-center"
          >
            <Plus size={16} className="mr-1" /> Nueva Tarea
          </button>
        </div>

        {/* Bulk Actions */}
        {selected.length > 0 && (
          <div className="bg-[color:var(--color-text)]/10 p-2 rounded flex gap-2">
            <button className="bg-[var(--color-success)] text-white px-2 py-1 rounded">
              Cambiar estado ({selected.length})
            </button>
            <button className="bg-[var(--color-primary)] text-white px-2 py-1 rounded flex items-center">
              <Download size={16} className="mr-1" /> Exportar CSV
            </button>
          </div>
        )}

        {/* Vista Lista */}
        {view === 'list' && (
          <table className="w-full table-auto">
            <thead className="bg-[color:var(--color-text)]/5">
              <tr>
                <th></th>
                <th>Tarea</th>
                <th>Tipo</th>
                <th>Responsable</th>
                <th>Fecha límite</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {/* Tareas predefinidas */}
              {blocks.flatMap((block) =>
                block.tasks.map((t) => (
                  <tr key={`preset-${t.id}`} className={completed[t.id] ? 'opacity-60 line-through' : ''}>
                    <td>
                      <button
                        aria-label="Marcar completada"
                        onClick={() => toggleCompleted(t.id)}
                        className="focus:outline-none"
                      >
                        {completed[t.id] ? (
                          <CheckCircle className="text-[color:var(--color-success)]" size={20} />
                        ) : (
                          <Circle className="text-[color:var(--color-text)]/40" size={20} />
                        )}
                      </button>
                    </td>
                    <td>{t.title}</td>
                    <td>{t.type}</td>
                    <td>{t.responsible}</td>
                    <td>{t.due}</td>
                    <td>{completed[t.id] ? 'Completada' : t.status}</td>
                  </tr>
                ))
              )}
              {/* Tareas personalizadas */}
              {customTasks.map((t) => (
                <tr key={`custom-${t.id}`} className={completed[t.id] ? 'opacity-60 line-through' : ''}>
                  <td>
                    <button
                      aria-label="Marcar completada"
                      onClick={() => toggleCompleted(t.id)}
                      className="focus:outline-none"
                    >
                      {completed[t.id] ? (
                        <CheckCircle className="text-[color:var(--color-success)]" size={20} />
                      ) : (
                        <Circle className="text-[color:var(--color-text)]/40" size={20} />
                      )}
                    </button>
                  </td>
                  <td>{t.title}</td>
                  <td>{t.type}</td>
                  <td>{t.responsible}</td>
                  <td>{t.due}</td>
                  <td>{completed[t.id] ? 'Completada' : t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Modal Nueva Tarea */}
        {showNewModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <Card className="p-4 shadow w-80">
              <h3 className="font-semibold mb-2">Nueva Tarea</h3>
              <form onSubmit={handleSaveNewTask} className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Título</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Descripción de la tarea"
                    className="w-full border rounded px-2 py-1 border-[color:var(--color-text)]/20 bg-[var(--color-surface)] text-[color:var(--color-text)]"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm mb-1">Tipo</label>
                    <select
                      value={newTask.type}
                      onChange={(e) => setNewTask((p) => ({ ...p, type: e.target.value }))}
                      className="w-full border rounded px-2 py-1 border-[color:var(--color-text)]/20 bg-[var(--color-surface)] text-[color:var(--color-text)]"
                    >
                      <option value="">General</option>
                      <option value="ensayo">Ensayo</option>
                      <option value="montaje">Montaje</option>
                      <option value="audio/vídeo">Audio/Vídeo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Responsable</label>
                    <select
                      value={newTask.responsible}
                      onChange={(e) => setNewTask((p) => ({ ...p, responsible: e.target.value }))}
                      className="w-full border rounded px-2 py-1 border-[color:var(--color-text)]/20 bg-[var(--color-surface)] text-[color:var(--color-text)]"
                    >
                      <option value="">Equipo</option>
                      <option value="Rollout">Rollout</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Fecha límite</label>
                  <input
                    type="date"
                    value={newTask.due}
                    onChange={(e) => setNewTask((p) => ({ ...p, due: e.target.value }))}
                    className="w-full border rounded px-2 py-1 border-[color:var(--color-text)]/20 bg-[var(--color-surface)] text-[color:var(--color-text)]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="secondary" onClick={() => { setShowNewModal(false); resetNewTask(); }}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary">
                    Guardar
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
