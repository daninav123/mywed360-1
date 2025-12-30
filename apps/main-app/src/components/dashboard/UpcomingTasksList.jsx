import React, { useMemo } from 'react';
import { Card } from '../ui/Card';
import { CheckCircle, Circle, Check } from 'lucide-react';
import useTranslations from '../../hooks/useTranslations';

export default function UpcomingTasksList({ tasks = [], onTaskClick }) {
  const { t } = useTranslations();

  const sortedTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    
    return tasks
      .filter(task => !task.completed && !task.done && !task.isDone)
      .slice(0, 4)
      .map((task, index) => ({
        id: task.id || index,
        title: task.title || task.name || task.label || t('home2.tasks.untitled', { defaultValue: 'Untitled task' }),
        icon: task.icon || 'circle',
        color: task.color || '#9ca3af',
        completed: task.completed || task.done || task.isDone || false,
      }));
  }, [tasks, t]);

  if (sortedTasks.length === 0) {
    return (
      <Card className="p-6 rounded-2xl shadow-sm" style={{ backgroundColor: 'transparent' }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {t('home2.tasks.title', { defaultValue: 'Upcoming Tasks' })}
          </h3>
          <button className="text-sm text-gray-500 hover:text-gray-700">•••</button>
        </div>
        <p className="text-sm text-gray-500 text-center py-8">
          {t('home2.tasks.noTasks', { defaultValue: 'No pending tasks. Great job!' })}
        </p>
      </Card>
    );
  }

  return (
    <Card style={{
      backgroundColor: 'transparent',
      borderRadius: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      border: '1px solid #EEF2F7',
      padding: '24px',
    }}>
      <div className="flex justify-between items-center mb-4">
        <h3 style={{
          fontFamily: "'DM Sans', 'Inter', sans-serif",
          fontSize: '16px',
          fontWeight: 600,
          color: '#2D3748',
        }}>
          {t('home2.tasks.title', { defaultValue: 'Upcoming Tasks' })}
        </h3>
        <button className="text-gray-400 hover:text-gray-600">•••</button>
      </div>
      <div className="space-y-3">
        {sortedTasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onTaskClick?.(task)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: task.color }}
            >
              <Circle className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <span style={{
              fontFamily: "'DM Sans', 'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              color: '#2D3748',
              flex: 1,
            }}>{task.title}</span>
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#66BB6A' }}>
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
