import React, { useMemo } from 'react';
import Card from '../ui/Card';

const ServicesProgressBar = ({ serviceCards = [] }) => {
  // Calcular progreso
  const progress = useMemo(() => {
    const total = serviceCards.length;
    if (total === 0) return { completed: 0, total: 0, percentage: 0 };

    const completed = serviceCards.filter((card) => card.confirmed).length;
    const percentage = Math.round((completed / total) * 100);

    return { completed, total, percentage };
  }, [serviceCards]);

  if (serviceCards.length === 0) {
    return null; // No mostrar si no hay servicios
  }

  return (
    <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Progreso General</h3>
          <span className="text-2xl font-bold text-purple-600">{progress.percentage}%</span>
        </div>
        <div className="w-full bg-white rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <p className="text-sm text-gray-600">
          {progress.completed} de {progress.total} servicios confirmados
        </p>
      </div>
    </Card>
  );
};

export default ServicesProgressBar;
