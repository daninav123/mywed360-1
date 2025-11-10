/**
 * SeatingSearchBar - Búsqueda y filtros avanzados para invitados
 * FASE 2: Productividad Core
 */
import React, { useState, useMemo } from 'react';
import { Search, X, Filter, Users, UserX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SeatingSearchBar({
  guests = [],
  tables = [],
  onGuestFound,
  onTableFound,
  className = '',
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssigned, setFilterAssigned] = useState(true);
  const [filterUnassigned, setFilterUnassigned] = useState(true);
  const [filterTable, setFilterTable] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [isOpen, setIsOpen] = useState(false);

  // Búsqueda fuzzy simple
  const fuzzyMatch = (text, search) => {
    if (!search) return true;
    const pattern = search
      .toLowerCase()
      .split('')
      .map((char) => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*');
    return new RegExp(pattern).test(text.toLowerCase());
  };

  // Filtrar invitados
  const filteredGuests = useMemo(() => {
    let results = guests;

    // Filtro de búsqueda
    if (searchTerm) {
      results = results.filter((g) => {
        const fullName = `${g.name || ''} ${g.surname || ''}`.trim();
        return (
          fuzzyMatch(fullName, searchTerm) ||
          fuzzyMatch(g.email || '', searchTerm) ||
          fuzzyMatch(g.phone || '', searchTerm)
        );
      });
    }

    // Filtro asignados/sin asignar
    results = results.filter((g) => {
      const hasTable = g.tableId || g.table;
      if (hasTable && !filterAssigned) return false;
      if (!hasTable && !filterUnassigned) return false;
      return true;
    });

    // Filtro por mesa
    if (filterTable !== 'all') {
      results = results.filter((g) => {
        if (!g.tableId && !g.table) return false;
        return String(g.tableId || g.table) === String(filterTable);
      });
    }

    // Filtro por grupo
    if (filterGroup !== 'all') {
      results = results.filter((g) => g.group === filterGroup);
    }

    return results;
  }, [guests, searchTerm, filterAssigned, filterUnassigned, filterTable, filterGroup]);

  // Obtener grupos únicos
  const groups = useMemo(() => {
    const groupSet = new Set();
    guests.forEach((g) => {
      if (g.group) groupSet.add(g.group);
    });
    return Array.from(groupSet).sort();
  }, [guests]);

  // Obtener mesas únicas
  const tableOptions = useMemo(() => {
    const tableMap = new Map();
    tables.forEach((t) => {
      tableMap.set(String(t.id), t.name || `Mesa ${t.id}`);
    });
    return Array.from(tableMap.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [tables]);

  // Manejar selección de resultado
  const handleSelectGuest = (guest) => {
    if (onGuestFound) {
      onGuestFound(guest);
    }

    // Si el invitado tiene mesa, hacer zoom a ella
    if ((guest.tableId || guest.table) && onTableFound) {
      const tableId = guest.tableId || guest.table;
      const table = tables.find((t) => String(t.id) === String(tableId));
      if (table) {
        onTableFound(table);
      }
    }
  };

  // Limpiar búsqueda
  const handleClear = () => {
    setSearchTerm('');
    setFilterTable('all');
    setFilterGroup('all');
  };

  // Hotkey: Ctrl+F
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      {/* Botón de búsqueda */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 
                   rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        title="Buscar invitado (Ctrl+F)"
      >
        <Search className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Buscar</span>
        {filteredGuests.length < guests.length && (
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
            {filteredGuests.length}
          </span>
        )}
      </button>

      {/* Panel expandido */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 left-0 w-96 bg-white rounded-lg shadow-2xl 
                       border border-gray-200 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Buscar Invitado</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/50 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Campo de búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nombre, email o teléfono..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                           text-sm"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 
                             hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Filtros */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-semibold text-gray-700">Filtros</span>
              </div>

              {/* Asignados/Sin asignar */}
              <div className="flex items-center gap-3 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterAssigned}
                    onChange={(e) => setFilterAssigned(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Asignados
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterUnassigned}
                    onChange={(e) => setFilterUnassigned(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 flex items-center gap-1">
                    <UserX className="w-3 h-3" />
                    Sin asignar
                  </span>
                </label>
              </div>

              {/* Filtro por mesa */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Mesa</label>
                <select
                  value={filterTable}
                  onChange={(e) => setFilterTable(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm
                           focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">Todas las mesas</option>
                  {tableOptions.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por grupo */}
              {groups.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Grupo/Familia
                  </label>
                  <select
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm
                             focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">Todos los grupos</option>
                    {groups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Resultados */}
            <div className="max-h-80 overflow-y-auto">
              {filteredGuests.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium">No se encontraron invitados</p>
                  <p className="text-xs mt-1">Intenta ajustar los filtros</p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredGuests.map((guest, index) => {
                    const fullName = `${guest.name || ''} ${guest.surname || ''}`.trim();
                    const hasTable = guest.tableId || guest.table;
                    const tableName = hasTable
                      ? tables.find((t) => String(t.id) === String(guest.tableId || guest.table))
                          ?.name || `Mesa ${guest.tableId || guest.table}`
                      : null;

                    return (
                      <motion.button
                        key={guest.id || index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handleSelectGuest(guest)}
                        className="w-full p-3 rounded-lg hover:bg-indigo-50 text-left
                                 transition-colors border border-transparent hover:border-indigo-200
                                 group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate group-hover:text-indigo-700">
                              {fullName || 'Sin nombre'}
                            </p>
                            {guest.email && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">{guest.email}</p>
                            )}
                            {guest.group && (
                              <p className="text-xs text-gray-600 mt-1">Grupo: {guest.group}</p>
                            )}
                          </div>
                          <div className="ml-3">
                            {tableName ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                {tableName}
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                Sin mesa
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer con stats */}
            <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <span>
                  Mostrando {filteredGuests.length} de {guests.length} invitados
                </span>
                <span className="text-gray-400">Ctrl+F para abrir</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
