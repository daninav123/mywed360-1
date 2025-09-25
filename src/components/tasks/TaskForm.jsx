import React from 'react';
import { createPortal } from 'react-dom';

import { categories } from './CalendarComponents.jsx';

// Componente para el formulario de tareas
const TaskForm = ({
  formData,
  editingId,
  handleChange,
  handleSaveTask,
  handleDeleteTask,
  closeModal,
  setFormData,
  parentOptions = [],
}) => {
  const modal = (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999]"
      onClick={closeModal}
    >
      <div
        className="bg-white rounded-lg w-full max-w-md p-6 space-y-4 shadow-lg relative z-[10000]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold">
          {editingId ? 'Editar tarea' : 'Crear nueva tarea'}
        </h3>
        <div className="space-y-3">
          <input
            name="title"
            onChange={handleChange}
            value={formData.title}
            placeholder="Título"
            className="w-full border rounded px-3 py-1"
          />
          <textarea
            name="desc"
            onChange={handleChange}
            value={formData.desc}
            placeholder="Descripción"
            className="w-full border rounded px-3 py-1"
          />
          <input
            name="assignee"
            onChange={handleChange}
            value={formData.assignee || ''}
            placeholder="Responsable (nombre o ID)"
            className="w-full border rounded px-3 py-1"
          />
          <select
            name="category"
            onChange={handleChange}
            value={formData.category}
            className="w-full border rounded px-3 py-1"
          >
            {Object.entries(categories).map(([key, cat]) => (
              <option key={key} value={key}>
                {cat.name}
              </option>
            ))}
          </select>
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="text-xs">Inicio</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1"
                disabled={formData.long && formData.parentTaskId && formData.unscheduled}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs invisible">time</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1"
                disabled={formData.long && formData.parentTaskId && formData.unscheduled}
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="text-xs">Fin</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1"
                disabled={formData.long && formData.parentTaskId && formData.unscheduled}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs invisible">time</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1"
                disabled={formData.long && formData.parentTaskId && formData.unscheduled}
              />
            </div>
          </div>
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              name="long"
              checked={formData.long}
              onChange={(e) => setFormData({ ...formData, long: e.target.checked })}
            />
            <span>Proceso (Gantt)</span>
          </label>
          {formData.long && (
            <div>
              <label className="text-xs">Tarea padre (opcional)</label>
              <select
                name="parentTaskId"
                value={formData.parentTaskId || ''}
                onChange={handleChange}
                className="w-full border rounded px-3 py-1"
              >
                <option value="">— Tarea raíz (sin padre) —</option>
                {Array.isArray(parentOptions) &&
                  parentOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
              </select>
              {formData.parentTaskId && (
                <label className="flex items-center space-x-2 text-sm mt-2">
                  <input
                    type="checkbox"
                    checked={!!formData.unscheduled}
                    onChange={(e) => setFormData({ ...formData, unscheduled: e.target.checked })}
                  />
                  <span>Subtarea sin fecha (aún)</span>
                </label>
              )}
              {!formData.parentTaskId && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <div className="text-xs text-gray-600">Rango automático del bloque</div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <select
                      value={formData.rangeMode || 'auto'}
                      onChange={(e) => setFormData({ ...formData, rangeMode: e.target.value })}
                      className="border rounded px-2 py-1"
                    >
                      <option value="auto">Auto</option>
                      <option value="manual">Manual</option>
                    </select>
                    <select
                      value={formData.autoAdjust || 'expand_only'}
                      onChange={(e) => setFormData({ ...formData, autoAdjust: e.target.value })}
                      className="border rounded px-2 py-1"
                      disabled={(formData.rangeMode || 'auto') !== 'auto'}
                    >
                      <option value="expand_only">Expandir solo</option>
                      <option value="expand_and_shrink">Expandir y contraer</option>
                      <option value="none">Sin ajustar</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      className="border rounded px-2 py-1"
                      value={Number(formData.bufferDays ?? 0)}
                      onChange={(e) => setFormData({ ...formData, bufferDays: Math.max(0, Number(e.target.value || 0)) })}
                      placeholder="Margen (dias)"
                      disabled={(formData.rangeMode || 'auto') !== 'auto'}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              name="completed"
              checked={!!formData.completed}
              onChange={(e) => setFormData({ ...formData, completed: e.target.checked })}
            />
            <span>Completada</span>
          </label>
        </div>
        <div className="flex justify-end space-x-2">
          {editingId && (
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTask();
              }}
              className="px-4 py-2 rounded bg-red-600 text-white mr-auto"
            >
              Eliminar
            </button>
          )}
          <button onClick={closeModal} className="px-4 py-2 rounded bg-gray-300">
            Cancelar
          </button>
          <button onClick={handleSaveTask} className="px-4 py-2 rounded bg-blue-600 text-white">
            Guardar
          </button>
        </div>
      </div>
    </div>
  );

  // Renderizar en portal para evitar problemas de stacking/overflow
  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modal, document.body);
  }
  return modal;
};

export default TaskForm;
