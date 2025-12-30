import React, { useState } from 'react';
import { X, Calendar, DollarSign, FileText, Paperclip, Trash2, Save, Sparkles, CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Sidebar de detalles de tarea con edición completa
 */
export default function TaskDetailSidebar({ task, isOpen, onClose, onUpdate, onDelete }) {
  const [editedTask, setEditedTask] = useState(task);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !task) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(editedTask);
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('¿Seguro que quieres eliminar esta tarea?')) {
      await onDelete(task.id);
      onClose();
    }
  };

  const toggleSubtask = (subtaskId) => {
    setEditedTask(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )
    }));
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Detalles de Tarea
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título
            </label>
            <input
              type="text"
              value={editedTask.title || editedTask.name || ''}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Análisis IA */}
          {(task.metadata?.aiRecommendation || task.metadata?.priorityReason) && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                    Análisis IA
                  </h4>
                  {task.metadata.priorityReason && (
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      {task.metadata.priorityReason}
                    </p>
                  )}
                  {task.metadata.aiRecommendation && (
                    <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                      task.metadata.aiRecommendation === 'critical' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {task.metadata.aiRecommendation === 'critical' ? '🔴 Crítica' : '⚪ Opcional'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Fecha límite */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fecha límite
            </label>
            <input
              type="date"
              value={editedTask.dueDate ? format(new Date(editedTask.dueDate), 'yyyy-MM-dd') : ''}
              onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            {editedTask.dueDate && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {format(new Date(editedTask.dueDate), "d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
            )}
          </div>

          {/* Presupuesto estimado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Presupuesto estimado
            </label>
            <input
              type="text"
              value={editedTask.estimatedCost || ''}
              onChange={(e) => setEditedTask({ ...editedTask, estimatedCost: e.target.value })}
              placeholder="Ej: €1,500 - €3,000"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Subtareas */}
          {editedTask.subtasks && editedTask.subtasks.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Subtareas ({editedTask.subtasks.filter(s => s.completed).length}/{editedTask.subtasks.length})
              </label>
              <div className="space-y-2">
                {editedTask.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <button
                      onClick={() => toggleSubtask(subtask.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        subtask.completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {subtask.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </button>
                    <span className={`text-sm flex-1 ${
                      subtask.completed 
                        ? 'line-through text-gray-500 dark:text-gray-400'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {subtask.title || subtask.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notas
            </label>
            <textarea
              value={editedTask.notes || ''}
              onChange={(e) => setEditedTask({ ...editedTask, notes: e.target.value })}
              rows={4}
              placeholder="Añade notas o recordatorios..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleDelete}
              className="flex-1 px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
