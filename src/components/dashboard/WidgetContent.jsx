import React from 'react';

// Import widget components
import { BudgetWidget } from './widgets/BudgetWidget';
import { CalendarWidget } from './widgets/CalendarWidget';
import { GuestListWidget } from './widgets/GuestListWidget';
import { TasksWidget } from './widgets/TasksWidget';
import { TimelineWidget } from './widgets/TimelineWidget';
import { WidgetTypes } from './widgets/WidgetTypes';

export const WidgetContent = ({ widget }) => {
  const { type, config } = widget;

  const renderWidget = () => {
    switch (type) {
      case WidgetTypes.CALENDAR:
        return <CalendarWidget config={config} />;
      case WidgetTypes.TASKS:
        return <TasksWidget config={config} />;
      case WidgetTypes.BUDGET:
        return <BudgetWidget config={config} />;
      case WidgetTypes.GUEST_LIST:
        return <GuestListWidget config={config} />;
      case WidgetTypes.TIMELINE:
        return <TimelineWidget config={config} />;
      default:
        return <div>Widget no soportado: {type}</div>;
    }
  };

  return <div className="h-full">{renderWidget()}</div>;
};
