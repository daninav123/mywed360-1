import React from 'react';

import useTranslations from '../../hooks/useTranslations';

export default function TasksHeader({ onNewTask, onShowAllTasks }) {
  const { t } = useTranslations();

  return (
    <div className="flex items-center justify-between">
      <h1 className="page-title">{t('tasks.page.header.title')}</h1>
      <div className="flex space-x-2">
        {typeof onShowAllTasks === 'function' && (
          <button
            onClick={onShowAllTasks}
            className="border border-pink-500 text-pink-600 px-4 py-2 rounded-md transition-colors hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50"
          >
            {t('tasks.page.header.viewAll')}
          </button>
        )}
        <button
          onClick={onNewTask}
          className="bg-pink-500 text-white px-4 py-2 rounded-md transition-colors hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50"
        >
          {t('tasks.page.header.newTask')}
        </button>
      </div>
    </div>
  );
}
