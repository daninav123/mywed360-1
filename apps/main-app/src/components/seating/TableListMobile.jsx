/**
 * TableListMobile - Vista de lista de mesas optimizada para móvil
 * Alternativa al canvas para gestión rápida en dispositivos pequeños
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Users,
  UserPlus,
  UserMinus,
  Circle,
  CheckCircle,
  AlertCircle,
  Edit3,
  Trash2,
  Copy,
} from 'lucide-react';

const TableListMobile = ({
  tables = [],
  guests = [],
  onTableClick,
  onAssignGuest,
  onUnassignGuest,
  onEditTable,
  onDeleteTable,
  onDuplicateTable,
}) => {
  const [expandedTables, setExpandedTables] = useState(new Set());
  const [filter, setFilter] = useState('all'); // all, empty, partial, full

  // Calcular datos de cada mesa
  const enrichedTables = useMemo(() => {
    return tables.map((table) => {
      const capacity = parseInt(table.seats || table.capacity || 0, 10);

      const assignedGuests = guests.filter((g) => {
        const tableMatch =
          String(g.tableId) === String(table.id) ||
          String(g.table).trim() === String(table.name || table.id);
        return tableMatch;
      });

      const occupied = assignedGuests.reduce(
        (sum, g) => sum + 1 + (parseInt(g.companion || g.companions || 0, 10) || 0),
        0
      );

      const percentage = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;
      const available = Math.max(0, capacity - occupied);

      let status = 'empty';
      let statusColor = 'bg-gray-100 dark:bg-gray-800';
      let statusIcon = Circle;

      if (percentage === 0) {
        status = 'empty';
        statusColor = 'bg-gray-100 dark:bg-gray-800';
        statusIcon = Circle;
      } else if (percentage < 100) {
        status = 'partial';
        statusColor = 'bg-blue-50 dark:bg-blue-900/20';
        statusIcon = Users;
      } else if (percentage === 100) {
        status = 'full';
        statusColor = 'bg-green-50 dark:bg-green-900/20';
        statusIcon = CheckCircle;
      } else {
        status = 'over';
        statusColor = 'bg-red-50 dark:bg-red-900/20';
        statusIcon = AlertCircle;
      }

      return {
        ...table,
        capacity,
        occupied,
        percentage,
        available,
        status,
        statusColor,
        statusIcon,
        assignedGuests,
      };
    });
  }, [tables, guests]);

  // Filtrar mesas
  const filteredTables = useMemo(() => {
    if (filter === 'all') return enrichedTables;
    if (filter === 'empty') return enrichedTables.filter((t) => t.status === 'empty');
    if (filter === 'partial') return enrichedTables.filter((t) => t.status === 'partial');
    if (filter === 'full')
      return enrichedTables.filter((t) => t.status === 'full' || t.status === 'over');
    return enrichedTables;
  }, [enrichedTables, filter]);

  // Toggle expand
  const toggleExpand = (tableId) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(tableId)) {
        next.delete(tableId);
      } else {
        next.add(tableId);
      }
      return next;
    });
  };

  // Estadísticas
  const stats = useMemo(() => {
    const empty = enrichedTables.filter((t) => t.status === 'empty').length;
    const partial = enrichedTables.filter((t) => t.status === 'partial').length;
    const full = enrichedTables.filter((t) => t.status === 'full').length;
    const over = enrichedTables.filter((t) => t.status === 'over').length;

    return { empty, partial, full, over };
  }, [enrichedTables]);

  if (tables.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        <Users className="w-16 h-16 mx-auto mb-3 opacity-30" />
        <p className="text-lg">No hay mesas creadas</p>
        <p className="text-sm mt-1">Crea mesas desde el canvas o generador automático</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Todas ({tables.length})
        </button>
        <button
          onClick={() => setFilter('empty')}
          className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'empty'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Vacías ({stats.empty})
        </button>
        <button
          onClick={() => setFilter('partial')}
          className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'partial'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Parciales ({stats.partial})
        </button>
        <button
          onClick={() => setFilter('full')}
          className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'full'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Completas ({stats.full + stats.over})
        </button>
      </div>

      {/* Lista de mesas */}
      <div className="space-y-2">
        <AnimatePresence>
          {filteredTables.map((table) => {
            const isExpanded = expandedTables.has(table.id);
            const StatusIcon = table.statusIcon;

            return (
              <motion.div
                key={table.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${table.statusColor}`}
              >
                {/* Header */}
                <button
                  onClick={() => toggleExpand(table.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <StatusIcon
                      className={`w-5 h-5 ${
                        table.status === 'full'
                          ? 'text-green-600'
                          : table.status === 'over'
                            ? 'text-red-600'
                            : table.status === 'partial'
                              ? 'text-blue-600'
                              : 'text-gray-400'
                      }`}
                    />

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {table.name || `Mesa ${table.number || table.id}`}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {table.occupied}/{table.capacity} asientos • {table.percentage}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {table.status === 'over' && (
                      <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
                        LLENA
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expandible */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-200 dark:border-gray-700"
                    >
                      {/* Invitados asignados */}
                      {table.assignedGuests.length > 0 && (
                        <div className="p-4 space-y-2">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Invitados asignados:
                          </h4>
                          {table.assignedGuests.map((guest) => (
                            <div
                              key={guest.id}
                              className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {guest.name || 'Sin nombre'}
                                </p>
                                {guest.companion > 0 && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    +{guest.companion} acompañante(s)
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => onUnassignGuest && onUnassignGuest(guest.id)}
                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Desasignar"
                              >
                                <UserMinus className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Acciones */}
                      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                        <button
                          onClick={() => onTableClick && onTableClick(table.id)}
                          className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => onDuplicateTable && onDuplicateTable(table.id)}
                          className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                          title="Duplicar"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteTable && onDeleteTable(table.id)}
                          className="px-3 py-2 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Sin resultados */}
      {filteredTables.length === 0 && (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          <Circle className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>
            No hay mesas{' '}
            {filter === 'empty' ? 'vacías' : filter === 'partial' ? 'parciales' : 'completas'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TableListMobile;
