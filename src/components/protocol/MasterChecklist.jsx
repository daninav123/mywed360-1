import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Calendar, User, AlertCircle, Filter, Search, Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Checklist maestro para gestión de tareas del evento
 */
const MasterChecklist = ({ weddingId, onUpdate }) => {
  const [checklist, setChecklist] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, completed, urgent
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'general',
    dueDate: '',
    assignedTo: '',
    priority: 'medium',
    notes: ''
  });

  // Categorías predefinidas
  const categories = {
    ceremony: 'Ceremonia',
    reception: 'Recepción',
    catering: 'Catering',
    decoration: 'Decoración',
    music: 'Música',
    photography: 'Fotografía',
    transport: 'Transporte',
    general: 'General'
  };

  // Templates de tareas comunes
  const taskTemplates = [
    { title: 'Confirmar menú final con catering', category: 'catering', priority: 'high' },
    { title: 'Revisar decoración floral', category: 'decoration', priority: 'medium' },
    { title: 'Confirmar playlist con DJ', category: 'music', priority: 'medium' },
    { title: 'Coordinar horarios con fotógrafo', category: 'photography', priority: 'high' },
    { title: 'Verificar transporte para invitados', category: 'transport', priority: 'medium' },
    { title: 'Confirmar asientos para ceremonia', category: 'ceremony', priority: 'high' },
    { title: 'Revisar montaje de mesas', category: 'reception', priority: 'high' },
    { title: 'Prueba de sonido', category: 'music', priority: 'medium' },
    { title: 'Confirmar menú infantil', category: 'catering', priority: 'low' },
    { title: 'Preparar kit de emergencia', category: 'general', priority: 'medium' }
  ];

  useEffect(() => {
    loadChecklist();
  }, [weddingId]);

  const loadChecklist = () => {
    const stored = localStorage.getItem(`checklist_${weddingId}`);
    if (stored) {
      setChecklist(JSON.parse(stored));
    }
  };

  const saveChecklist = (newChecklist) => {
    localStorage.setItem(`checklist_${weddingId}`, JSON.stringify(newChecklist));
    setChecklist(newChecklist);
    if (onUpdate) onUpdate(newChecklist);
  };

  const handleAddTask = () => {
    if (!formData.title) {
      alert('El título es obligatorio');
      return;
    }

    const newTask = {
      id: Date.now().toString(),
      ...formData,
      completed: false,
      createdAt: new Date().toISOString()
    };

    saveChecklist([...checklist, newTask]);
    resetForm();
  };

  const handleToggleComplete = (taskId) => {
    saveChecklist(
      checklist.map(task =>
        task.id === taskId
          ? { ...task, completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : null }
          : task
      )
    );
  };

  const handleDeleteTask = (taskId) => {
    if (confirm('¿Eliminar esta tarea?')) {
      saveChecklist(checklist.filter(task => task.id !== taskId));
    }
  };

  const handleUseTemplate = (template) => {
    setFormData({
      ...formData,
      title: template.title,
      category: template.category,
      priority: template.priority
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'general',
      dueDate: '',
      assignedTo: '',
      priority: 'medium',
      notes: ''
    });
    setShowAddModal(false);
  };

  // Filtrado y búsqueda
  const filteredTasks = checklist.filter(task => {
    // Filtro por estado
    if (filter === 'pending' && task.completed) return false;
    if (filter === 'completed' && !task.completed) return false;
    if (filter === 'urgent' && task.priority !== 'high') return false;

    // Búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(query) ||
        task.category.toLowerCase().includes(query) ||
        task.assignedTo?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Agrupar por categoría
  const groupedTasks = {};
  filteredTasks.forEach(task => {
    if (!groupedTasks[task.category]) {
      groupedTasks[task.category] = [];
    }
    groupedTasks[task.category].push(task);
  });

  // Stats
  const totalTasks = checklist.length;
  const completedTasks = checklist.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const urgentTasks = checklist.filter(t => !t.completed && t.priority === 'high').length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'low': return 'Baja';
      default: return 'Media';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Checklist Maestro</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona todas las tareas del evento
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Tarea
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 mb-1">Completadas</p>
          <p className="text-2xl font-bold text-green-700">{completedTasks}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700 mb-1">Pendientes</p>
          <p className="text-2xl font-bold text-blue-700">{pendingTasks}</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700 mb-1">Urgentes</p>
          <p className="text-2xl font-bold text-red-700">{urgentTasks}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progreso General</span>
          <span className="text-sm font-bold text-gray-900">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tareas..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2">
          {[
            { value: 'all', label: 'Todas' },
            { value: 'pending', label: 'Pendientes' },
            { value: 'completed', label: 'Completadas' },
            { value: 'urgent', label: 'Urgentes' }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                filter === value
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks by Category */}
      {Object.keys(groupedTasks).length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No hay tareas</p>
          <p className="text-sm text-gray-500">Añade la primera tarea para comenzar</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([category, tasks]) => (
            <div key={category} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center justify-between">
                  <span>{categories[category] || category}</span>
                  <span className="text-sm text-gray-600">
                    {tasks.filter(t => t.completed).length}/{tasks.length}
                  </span>
                </h3>
              </div>

              <div className="divide-y divide-gray-200">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      task.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleComplete(task.id)}
                        className="mt-1 flex-shrink-0"
                      >
                        {task.completed ? (
                          <CheckSquare className="w-5 h-5 text-green-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                        )}
                      </button>

                      <div className="flex-1">
                        <h4 className={`font-medium mb-1 ${
                          task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </h4>

                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(task.dueDate).toLocaleDateString('es-ES')}</span>
                            </div>
                          )}

                          {task.assignedTo && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{task.assignedTo}</span>
                            </div>
                          )}

                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                            getPriorityColor(task.priority)
                          }`}>
                            {getPriorityLabel(task.priority)}
                          </span>
                        </div>

                        {task.notes && (
                          <p className="text-sm text-gray-600 mt-2">{task.notes}</p>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nueva Tarea</h3>

            {/* Templates */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plantillas Rápidas
              </label>
              <div className="flex flex-wrap gap-2">
                {taskTemplates.map((template, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleUseTemplate(template)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {template.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Ej: Confirmar menú con catering"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    {Object.entries(categories).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asignado a
                  </label>
                  <input
                    type="text"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Nombre"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows="3"
                  placeholder="Detalles adicionales..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={resetForm}>
                Cancelar
              </Button>
              <Button onClick={handleAddTask}>
                Añadir Tarea
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterChecklist;
