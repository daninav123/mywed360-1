import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Globe } from 'lucide-react';

export default function LegalStats({ progress, totalRequirements, countryInfo, legalType }) {
  const completedCount = Object.values(progress || {}).filter((item) => {
    if (typeof item === 'object') return item.done;
    return item;
  }).length;

  const completionRate = totalRequirements > 0 ? Math.round((completedCount / totalRequirements) * 100) : 0;

  const withFilesCount = Object.values(progress || {}).filter((item) => {
    return typeof item === 'object' && item.file;
  }).length;

  const stats = [
    {
      icon: CheckCircle2,
      label: 'Completados',
      value: `${completedCount}/${totalRequirements}`,
      color: 'green',
      percentage: completionRate,
    },
    {
      icon: Clock,
      label: 'Pendientes',
      value: totalRequirements - completedCount,
      color: 'orange',
    },
    {
      icon: AlertTriangle,
      label: 'Con archivos',
      value: withFilesCount,
      color: 'blue',
    },
    {
      icon: Globe,
      label: 'País',
      value: countryInfo?.name || 'No seleccionado',
      color: 'purple',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const colorClasses = {
          green: 'bg-green-100 text-green-700 border-green-300',
          orange: 'bg-orange-100 text-orange-700 border-orange-300',
          blue: 'bg-blue-100 text-blue-700 border-blue-300',
          purple: 'bg-purple-100 text-purple-700 border-purple-300',
        };

        return (
          <div
            key={index}
            className={`rounded-lg border-2 p-4 ${colorClasses[stat.color] || 'bg-gray-100'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={20} />
              <span className="text-sm font-medium">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.percentage !== undefined && (
              <div className="mt-2">
                <div className="w-full bg-white rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
                <span className="text-xs mt-1 block">{stat.percentage}% completado</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
