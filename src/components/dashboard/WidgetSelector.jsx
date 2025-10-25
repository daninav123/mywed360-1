import React, { useState } from 'react';

import { WidgetTypes } from './widgets/WidgetTypes';
import { useTranslations } from '../../hooks/useTranslations';

const WIDGET_OPTIONS = [
  {
  const { t } = useTranslations();

    type: WidgetTypes.CALENDAR,
    title: 'Calendario',
    description: t('common.muestra_los_proximos_eventos_fechas'),
    icon: '📅',
  },
  {
    type: WidgetTypes.TASKS,
    title: 'Tareas',
    description: 'Seguimiento de tareas pendientes',
    icon: '✅',
  },
  {
    type: WidgetTypes.BUDGET,
    title: 'Presupuesto',
    description: 'Resumen de gastos e ingresos',
    icon: '💰',
  },
  {
    type: WidgetTypes.GUEST_LIST,
    title: 'Invitados',
    description: 'Lista de invitados confirmados',
    icon: '👥',
  },
  {
    type: WidgetTypes.TIMELINE,
    title: 'Cronograma',
    description: t('common.linea_tiempo_del_evento'),
    icon: '⏱️',
  },
];

export const WidgetSelector = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAddWidget = (widgetType) => {
    onSelect(widgetType);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-full min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors"
      >
        <span className="text-2xl mb-2">+</span>
        <span>Agregar Widget</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-64 mt-2 bg-white rounded-md shadow-lg overflow-hidden">
          <div className="py-1">
            <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b">
              Seleccionar widget
            </div>
            {WIDGET_OPTIONS.map((widget) => (
              <button
                key={widget.type}
                onClick={() => handleAddWidget(widget.type)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <span className="text-lg mr-3">{widget.icon}</span>
                <div>
                  <div className="font-medium">{widget.title}</div>
                  <div className="text-xs text-gray-500">{widget.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
