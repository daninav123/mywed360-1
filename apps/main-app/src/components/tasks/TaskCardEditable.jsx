import React, { useState } from 'react';
import { Calendar, DollarSign, AlertCircle, CheckCircle2, Tag, FileText, Edit2, Save, X, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const TAG_COLORS = [
  { name: 'Rojo', value: 'red', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  { name: 'Naranja', value: 'orange', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  { name: 'Amarillo', value: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  { name: 'Verde', value: 'green', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  { name: 'Azul', value: 'blue', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  { name: 'Morado', value: 'purple', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  { name: 'Rosa', value: 'pink', bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
  { name: 'Gris', value: 'gray', bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
];

/**
 * Card de tarea con edición inline y tags
 */
export default function TaskCardEditable({ task, onClick, onComplete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState({
    title: task.title || task.name || '',
    notes: task.notes || '',
    tags: task.tags || [],
    status: task.status || 'pending',
  });
  const [showTagPicker, setShowTagPicker] = useState(false);

  const isPastDue = task.dueDate && new Date(task.dueDate) < new Date();
  const isCriticalAI = task.metadata?.aiRecommendation === 'critical' || task.isCritical;

  const getDueDateText = () => {
    if (!task.dueDate) return null;
    const date = new Date(task.dueDate);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  const getPriorityColor = () => {
    if (isCriticalAI) return 'border-red-500 bg-red-50';
    if (task.priority === 'high') return 'border-orange-500 bg-orange-50';
    if (task.priority === 'medium') return 'border-blue-500 bg-blue-50';
    return 'border-gray-300 bg-white';
  };

  const getCategoryIcon = () => {
    const icons = {
      FUNDAMENTOS: '🎯', PROVEEDORES: '🤝', VESTUARIO: '👗',
      CEREMONIA: '💒', BANQUETE: '🍽️', INVITACIONES: '💌',
      DECORACION: '🎨', FOTOGRAFIA: '📸', MUSICA: '🎵',
      LOGISTICA: '🚗', GENERAL: '📋',
    };
    return icons[task.category] || '📋';
  };

  const handleSave = async () => {
    if (!editedTask.title.trim()) return;
    
    await onUpdate?.({
      ...task,
      title: editedTask.title,
      name: editedTask.title,
      notes: editedTask.notes,
      tags: editedTask.tags,
      status: editedTask.status,
    });
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTask({
      title: task.title || task.name || '',
      notes: task.notes || '',
      tags: task.tags || [],
      status: task.status || 'pending',
    });
    setIsEditing(false);
    setShowTagPicker(false);
  };

  const toggleTag = (tagColor) => {
    const tags = editedTask.tags || [];
    const exists = tags.find(t => t.color === tagColor);
    
    if (exists) {
      setEditedTask({
        ...editedTask,
        tags: tags.filter(t => t.color !== tagColor),
      });
    } else {
      setEditedTask({
        ...editedTask,
        tags: [...tags, { color: tagColor, label: tagColor }],
      });
    }
  };

  const getTagColor = (colorValue) => {
    return TAG_COLORS.find(c => c.value === colorValue) || TAG_COLORS[7];
  };

  if (isEditing) {
    return (
      <div className={`p-4 rounded-lg border-2 ${getPriorityColor()}`}>
        {/* Título editable */}
        <input
          type="text"
          value={editedTask.title}
          onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
          className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Título de la tarea..."
          autoFocus
        />

        {/* Notas */}
        <div className="mb-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <FileText className="w-4 h-4" />
            Notas
          </label>
          <textarea
            value={editedTask.notes}
            onChange={(e) => setEditedTask({ ...editedTask, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="Añade notas adicionales..."
          />
        </div>

        {/* Tags */}
        <div className="mb-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Tag className="w-4 h-4" />
            Etiquetas
          </label>
          
          {/* Tags seleccionadas */}
          <div className="flex flex-wrap gap-2 mb-2">
            {(editedTask.tags || []).map((tag, idx) => {
              const colorConfig = getTagColor(tag.color);
              return (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border}`}
                >
                  {tag.label}
                  <X
                    className="w-3 h-3 cursor-pointer hover:opacity-70"
                    onClick={() => toggleTag(tag.color)}
                  />
                </span>
              );
            })}
          </div>

          {/* Picker de colores */}
          <div className="grid grid-cols-4 gap-2">
            {TAG_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => toggleTag(color.value)}
                className={`
                  px-3 py-2 rounded-md text-xs font-medium border-2 transition-all
                  ${color.bg} ${color.text} ${color.border}
                  ${(editedTask.tags || []).find(t => t.color === color.value) ? 'ring-2 ring-offset-1 ring-blue-500' : ''}
                  hover:opacity-80
                `}
              >
                {color.name}
              </button>
            ))}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // Vista normal (no editable)
  return (
    <div
      className={`
        group relative p-4 rounded-lg border-2 cursor-pointer transition-all
        hover:shadow-lg hover:-translate-y-1
        ${getPriorityColor()}
        ${task.completed ? 'opacity-60' : ''}
      `}
    >
      {/* Badge crítica IA */}
      {isCriticalAI && (
        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
          <Sparkles className="w-3 h-3" />
          IA: Crítica
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl flex-shrink-0">{getCategoryIcon()}</span>
        <div className="flex-1 min-w-0" onClick={onClick}>
          <h4 className="font-semibold text-gray-900 truncate">
            {task.title || task.name || 'Sin título'}
          </h4>
          {task.category && (
            <span className="text-xs text-gray-500">{task.category}</span>
          )}
        </div>
        
        {/* Botones de acción */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-1.5 rounded-md hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
            title="Editar tarea"
          >
            <Edit2 className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete?.(task);
            }}
            className={`
              w-6 h-6 rounded border-2 flex items-center justify-center transition-all hover:scale-110
              ${task.completed 
                ? 'bg-green-500 border-green-500' 
                : 'border-gray-300 hover:border-green-500'
              }
            `}
          >
            {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map((tag, idx) => {
            const colorConfig = getTagColor(tag.color);
            return (
              <span
                key={idx}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border}`}
              >
                {tag.label}
              </span>
            );
          })}
        </div>
      )}

      {/* Notas preview */}
      {task.notes && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-2 mb-2">
          <div className="flex items-start gap-2">
            <FileText className="w-3 h-3 text-gray-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-700 line-clamp-2">{task.notes}</p>
          </div>
        </div>
      )}

      {/* Fecha límite */}
      {task.dueDate && (
        <div className={`
          flex items-center gap-2 text-sm mb-2
          ${isPastDue ? 'text-red-600 font-semibold' : 'text-gray-600'}
        `}>
          {isPastDue ? <AlertCircle className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
          <span>{getDueDateText()}</span>
        </div>
      )}

      {/* Análisis IA */}
      {task.metadata?.priorityReason && (
        <div className="bg-purple-50 border border-purple-200 rounded-md p-2">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-purple-800">{task.metadata.priorityReason}</p>
          </div>
        </div>
      )}
    </div>
  );
}
