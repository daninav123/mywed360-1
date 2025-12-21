import React, { useMemo } from 'react';
import Card from '../ui/Card';
import { Target, TrendingUp, Heart } from 'lucide-react';

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

  // Calcular siguiente paso sugerido
  const nextStep = useMemo(() => {
    const pending = serviceCards.filter(card => !card.confirmed);
    if (pending.length === 0) return null;
    return pending[0];
  }, [serviceCards]);

  // Contar favoritos totales
  const totalFavorites = useMemo(() => {
    return serviceCards.reduce((sum, card) => sum + (card.favoritesCount || 0), 0);
  }, [serviceCards]);

  return (
    <Card className="p-6 bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 border-purple-200 shadow-sm">
      <div className="space-y-4">
        {/* Header con progreso */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Progreso General</h3>
            <p className="text-sm text-gray-600">
              {progress.completed} de {progress.total} servicios confirmados
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[color:var(--color-primary)] mb-1">
              {progress.percentage}%
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <TrendingUp className="h-3 w-3" />
              <span>{progress.completed}/{progress.total}</span>
            </div>
          </div>
        </div>

        {/* Barra de progreso mejorada */}
        <div className="relative">
          <div className="w-full bg-white rounded-full h-4 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 transition-all duration-700 ease-out relative overflow-hidden"
              style={{ width: `${progress.percentage}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
          {/* Marcadores cada 25% */}
          <div className="absolute top-5 left-0 right-0 flex justify-between text-xs text-gray-400">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center p-3 bg-white/60 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{progress.completed}</div>
            <div className="text-xs text-gray-600 mt-1">Confirmados</div>
          </div>
          <div className="text-center p-3 bg-white/60 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{progress.total - progress.completed}</div>
            <div className="text-xs text-gray-600 mt-1">Pendientes</div>
          </div>
          <div className="text-center p-3 bg-white/60 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <Heart className="h-5 w-5 text-pink-500" />
              <div className="text-2xl font-bold text-pink-600">{totalFavorites}</div>
            </div>
            <div className="text-xs text-gray-600 mt-1">Favoritos</div>
          </div>
        </div>

        {/* Próximo paso sugerido */}
        {nextStep && (
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-blue-900">Próximo paso</div>
              <div className="text-sm text-blue-700 mt-0.5">
                Buscar proveedores de <span className="font-semibold">{nextStep.name}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ServicesProgressBar;
