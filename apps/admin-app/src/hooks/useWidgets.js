import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { WidgetTypes } from '../components/dashboard/widgets/WidgetTypes';

const WIDGETS_STORAGE_KEY = 'maloveapp_dashboard_widgets';

const DEFAULT_WIDGETS = [
  {
    id: uuidv4(),
    type: WidgetTypes.CALENDAR,
    config: {
      title: 'Calendario',
      showWeekends: true,
      showHolidays: true,
    },
  },
  {
    id: uuidv4(),
    type: WidgetTypes.TASKS,
    config: {
      title: 'Tareas',
      showCompleted: false,
      sortBy: 'dueDate',
    },
  },
  {
    id: uuidv4(),
    type: WidgetTypes.BUDGET,
    config: {
      title: 'Presupuesto',
      currency: '€',
      showGraph: true,
    },
  },
];

export const useWidgets = () => {
  const [widgets, setWidgets] = useState([]);

  // Load widgets from localStorage on mount
  useEffect(() => {
    try {
      const savedWidgets = localStorage.getItem(WIDGETS_STORAGE_KEY);
      if (savedWidgets) {
        setWidgets(JSON.parse(savedWidgets));
      } else {
        setWidgets(DEFAULT_WIDGETS);
      }
    } catch (error) {
      // console.error('Error loading widgets:', error);
      setWidgets(DEFAULT_WIDGETS);
    }
  }, []);

  // Save widgets to localStorage whenever they change
  useEffect(() => {
    if (widgets.length > 0) {
      try {
        localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(widgets));
      } catch (error) {
        // console.error('Error saving widgets:', error);
      }
    }
  }, [widgets]);

  const addWidget = (type) => {
    const newWidget = {
      id: uuidv4(),
      type,
      config: getDefaultConfig(type),
    };
    setWidgets([...widgets, newWidget]);
  };

  const removeWidget = (id) => {
    setWidgets(widgets.filter((widget) => widget.id !== id));
  };

  const moveWidget = (dragIndex, hoverIndex) => {
    const dragItem = widgets[dragIndex];
    const newWidgets = [...widgets];
    newWidgets.splice(dragIndex, 1);
    newWidgets.splice(hoverIndex, 0, dragItem);
    setWidgets(newWidgets);
  };

  const updateWidgetConfig = (id, newConfig) => {
    setWidgets(
      widgets.map((widget) =>
        widget.id === id ? { ...widget, config: { ...widget.config, ...newConfig } } : widget
      )
    );
  };

  return {
    widgets,
    addWidget,
    removeWidget,
    moveWidget,
    updateWidgetConfig,
  };
};

const getDefaultConfig = (type) => {
  switch (type) {
    case WidgetTypes.CALENDAR:
      return {
        title: 'Calendario',
        showWeekends: true,
        showHolidays: true,
      };
    case WidgetTypes.TASKS:
      return {
        title: 'Tareas',
        showCompleted: false,
        sortBy: 'dueDate',
      };
    case WidgetTypes.BUDGET:
      return {
        title: 'Presupuesto',
        currency: '€',
        showGraph: true,
      };
    case WidgetTypes.GUEST_LIST:
      return {
        title: 'Invitados',
        showRSVP: true,
        sortBy: 'name',
      };
    case WidgetTypes.TIMELINE:
      return {
        title: 'Cronograma',
        showMilestones: true,
        showTasks: true,
      };
    default:
      return { title: 'Nuevo Widget' };
  }
};

