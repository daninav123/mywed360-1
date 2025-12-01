/**
 * OccupancyHeatmap - Mapa de calor de ocupación de mesas
 * Visualización rápida del estado de cada mesa
 */
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, AlertCircle, CheckCircle, Circle } from 'lucide-react';

const OccupancyHeatmap = ({ tables = [], guests = [], onTableClick }) => {
  // Calcular ocupación por mesa
  const tableOccupancy = useMemo(() => {
    return tables.map((table) => {
      const capacity = parseInt(table.seats || table.capacity || 0, 10);

      // Contar invitados asignados a esta mesa
      const assignedGuests = guests.filter((g) => {
        const tableMatch =
          String(g.tableId) === String(table.id) ||
          String(g.table).trim() === String(table.name || table.id);
        return tableMatch;
      });

      // Contar asientos ocupados (invitados + acompañantes)
      const occupied = assignedGuests.reduce(
        (sum, g) => sum + 1 + (parseInt(g.companion || g.companions || 0, 10) || 0),
        0
      );

      const percentage = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;

      // Determinar estado
      let status = 'empty';
      let color = 'bg-gray-200 dark:bg-gray-700';
      let textColor = 'text-gray-600 dark:text-gray-400';
      let icon = Circle;

      if (percentage === 0) {
        status = 'empty';
        color = 'bg-gray-200 dark:bg-gray-700';
        textColor = 'text-gray-600 dark:text-gray-400';
        icon = Circle;
      } else if (percentage < 50) {
        status = 'low';
        color = 'bg-blue-200 dark:bg-blue-900';
        textColor = 'text-blue-700 dark:text-blue-300';
        icon = AlertCircle;
      } else if (percentage < 80) {
        status = 'medium';
        color = 'bg-yellow-200 dark:bg-yellow-900';
        textColor = 'text-yellow-700 dark:text-yellow-300';
        icon = Users;
      } else if (percentage < 100) {
        status = 'high';
        color = 'bg-orange-200 dark:bg-orange-900';
        textColor = 'text-orange-700 dark:text-orange-300';
        icon = Users;
      } else if (percentage === 100) {
        status = 'full';
        color = 'bg-green-200 dark:bg-green-900';
        textColor = 'text-green-700 dark:text-green-300';
        icon = CheckCircle;
      } else {
        // Sobrecapacidad
        status = 'over';
        color = 'bg-red-200 dark:bg-red-900';
        textColor = 'text-red-700 dark:text-red-300';
        icon = AlertCircle;
      }

      return {
        ...table,
        capacity,
        occupied,
        percentage,
        status,
        color,
        textColor,
        icon,
        assignedGuests: assignedGuests.length,
      };
    });
  }, [tables, guests]);

  // Calcular estadísticas globales
  const stats = useMemo(() => {
    const empty = tableOccupancy.filter((t) => t.status === 'empty').length;
    const low = tableOccupancy.filter((t) => t.status === 'low').length;
    const medium = tableOccupancy.filter((t) => t.status === 'medium').length;
    const high = tableOccupancy.filter((t) => t.status === 'high').length;
    const full = tableOccupancy.filter((t) => t.status === 'full').length;
    const over = tableOccupancy.filter((t) => t.status === 'over').length;

    return { empty, low, medium, high, full, over };
  }, [tableOccupancy]);

  if (tables.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p>No hay mesas para mostrar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Leyenda */}
      <div className="flex flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
          <span className="text-gray-600 dark:text-gray-400">Vacía ({stats.empty})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-200 dark:bg-blue-900" />
          <span className="text-gray-600 dark:text-gray-400">&lt;50% ({stats.low})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-200 dark:bg-yellow-900" />
          <span className="text-gray-600 dark:text-gray-400">50-79% ({stats.medium})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-200 dark:bg-orange-900" />
          <span className="text-gray-600 dark:text-gray-400">80-99% ({stats.high})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-200 dark:bg-green-900" />
          <span className="text-gray-600 dark:text-gray-400">100% ({stats.full})</span>
        </div>
        {stats.over > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-200 dark:bg-red-900" />
            <span className="text-gray-600 dark:text-gray-400">&gt;100% ({stats.over})</span>
          </div>
        )}
      </div>

      {/* Grid de mesas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        {tableOccupancy.map((table) => {
          const Icon = table.icon;

          return (
            <motion.button
              key={table.id}
              onClick={() => onTableClick && onTableClick(table.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative p-3 rounded-lg transition-all
                ${table.color}
                ${table.textColor}
                hover:shadow-md
                focus:outline-none focus:ring-2 focus:ring-indigo-500
              `}
              title={`${table.name || table.id}: ${table.occupied}/${table.capacity} (${table.percentage}%)`}
            >
              {/* Icono de estado */}
              <div className="flex items-center justify-between mb-1">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-bold">{table.percentage}%</span>
              </div>

              {/* Nombre de mesa */}
              <div className="text-sm font-semibold truncate">
                {table.name || `Mesa ${table.number || table.id}`}
              </div>

              {/* Ocupación */}
              <div className="text-xs mt-1">
                {table.occupied}/{table.capacity}
              </div>

              {/* Barra de progreso mini */}
              <div className="mt-2 h-1 bg-white/30 dark:bg-black/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(table.percentage, 100)}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className={`h-full ${
                    table.status === 'full'
                      ? 'bg-green-600'
                      : table.status === 'over'
                        ? 'bg-red-600'
                        : table.status === 'high'
                          ? 'bg-orange-600'
                          : table.status === 'medium'
                            ? 'bg-yellow-600'
                            : table.status === 'low'
                              ? 'bg-blue-600'
                              : 'bg-gray-400'
                  }`}
                />
              </div>

              {/* Badge de alerta si está sobre capacidad */}
              {table.percentage > 100 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  !
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Resumen estadístico */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Resumen de Ocupación
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total mesas:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
              {tables.length}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Ocupadas:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
              {tables.length - stats.empty}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Vacías:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">{stats.empty}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Completas:</span>
            <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
              {stats.full}
            </span>
          </div>
          {stats.over > 0 && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Sobrecarga:</span>
              <span className="ml-2 font-semibold text-red-600 dark:text-red-400">
                {stats.over}
              </span>
            </div>
          )}
          <div>
            <span className="text-gray-500 dark:text-gray-400">Asientos libres:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
              {tableOccupancy.reduce((sum, t) => sum + Math.max(0, t.capacity - t.occupied), 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OccupancyHeatmap;
