import React from 'react';

import { WidgetTypes } from './widgets/WidgetTypes';

export const WidgetConfig = ({ config, onUpdate }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    onUpdate({ [name]: newValue });
  };

  const renderConfigFields = () => {
    switch (config.type) {
      case WidgetTypes.CALENDAR:
        return (
          <>
            <div className="mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="showWeekends"
                  checked={config.showWeekends}
                  onChange={handleChange}
                  className="mr-2"
                />
                Mostrar fines de semana
              </label>
            </div>
            <div className="mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="showHolidays"
                  checked={config.showHolidays}
                  onChange={handleChange}
                  className="mr-2"
                />
                Mostrar festivos
              </label>
            </div>
          </>
        );
      case WidgetTypes.TASKS:
        return (
          <>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Ordenar por:</label>
              <select
                name="sortBy"
                value={config.sortBy}
                onChange={handleChange}
                className="w-full p-1 border rounded"
              >
                <option value="dueDate">Fecha de vencimiento</option>
                <option value="priority">Prioridad</option>
                <option value="title">Título</option>
              </select>
            </div>
            <div className="mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="showCompleted"
                  checked={config.showCompleted}
                  onChange={handleChange}
                  className="mr-2"
                />
                Mostrar tareas completadas
              </label>
            </div>
          </>
        );
      case WidgetTypes.BUDGET:
        return (
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">Moneda:</label>
            <select
              name="currency"
              value={config.currency}
              onChange={handleChange}
              className="w-full p-1 border rounded"
            >
              <option value="€">Euro (€)</option>
              <option value="$">Dólar ($)</option>
              <option value="£">Libra (£)</option>
              <option value="¥">Yen (¥)</option>
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-sm font-medium mb-1">Título:</label>
        <input
          type="text"
          name="title"
          value={config.title || ''}
          onChange={handleChange}
          className="w-full p-1 border rounded"
        />
      </div>
      {renderConfigFields()}
    </div>
  );
};
