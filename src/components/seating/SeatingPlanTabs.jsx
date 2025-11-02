/**
 * Componente Tabs especializado para el plan de asientos
 * Navegación entre ceremonia y banquete con indicadores visuales
 */

import { Church, Utensils, Users, Grid } from 'lucide-react';
import React from 'react';

const SeatingPlanTabs = ({
  activeTab,
  onTabChange,
  ceremonyCount = 0,
  banquetCount = 0,
  // New: completion percentage for each tab (0-100)
  ceremonyProgress = 0,
  banquetProgress = 0,
  className = '',
}) => {
  const tabs = [
    {
      id: 'ceremony',
      label: 'Ceremonia',
      icon: Church,
      count: ceremonyCount,
      description: 'Disposición de asientos para la ceremonia',
  return (
    <div className="flex items-center justify-between py-4" data-tour="tabs">
      <div className="flex">
        {stats.tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === stats.activeTab;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all
                ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
              title={tab.description}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>

              {/* Contador de elementos */}
              {tab.count > 0 && (
                <span
                  className={`
                  px-2 py-0.5 text-xs rounded-full
                  ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
                `}
                >
                  {tab.count}
                </span>
              )}
              {/* Progreso por pestaña (badge pequeño) */}
              <span
                className={`px-1.5 py-0.5 text-[10px] rounded border ${isActive ? 'border-blue-200 text-blue-700' : 'border-gray-200 text-gray-500'}`}
                title={
                  tab.id === 'ceremony'
                    ? `Sillas preparadas: ${Math.round(ceremonyProgress)}%`
                    : `Invitados asignados: ${Math.round(banquetProgress)}%`
                }
              >
                {tab.id === 'ceremony'
                  ? `${Math.round(ceremonyProgress)}%`
                  : `${Math.round(banquetProgress)}%`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Indicador de progreso */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{
            width: `${Math.max(0, Math.min(100, activeTab === 'ceremony' ? ceremonyProgress : banquetProgress))}%`,
          }}
        />
      </div>
    </div>
  );
};

export default React.memo(SeatingPlanTabs);
