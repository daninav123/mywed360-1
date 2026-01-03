/**
 * GuestSearchBar - Búsqueda fuzzy de invitados
 * FASE 2.2: Búsqueda y Filtros
 */
import React, { useState, useCallback, useMemo } from 'react';
import { Search, X, Users, UserCheck, UserX, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GuestSearchBar({ 
  guests = [], 
  onSelectGuest,
  onHighlightTable,
  className = ''
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, assigned, unassigned

  // Fuzzy search simple
  const fuzzyMatch = useCallback((text, search) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Búsqueda exacta
    if (textLower.includes(searchLower)) return true;
    
    // Fuzzy: cada letra debe aparecer en orden
    let searchIndex = 0;
    for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
      if (textLower[i] === searchLower[searchIndex]) {
        searchIndex++;
      }
    }
    return searchIndex === searchLower.length;
  }, []);

  // Filtrar invitados
  const filteredGuests = useMemo(() => {
    let filtered = guests;

    // Aplicar filtro de estado
    if (filter === 'assigned') {
      filtered = filtered.filter(g => g.tableId || g.table);
    } else if (filter === 'unassigned') {
      filtered = filtered.filter(g => !g.tableId && !g.table);
    }

    // Aplicar búsqueda
    if (query.trim()) {
      filtered = filtered.filter(g => 
        fuzzyMatch(g.name || '', query) ||
        fuzzyMatch(g.email || '', query) ||
        fuzzyMatch(String(g.tableId || g.table || ''), query)
      );
    }

    return filtered.slice(0, 50); // Limitar resultados
  }, [guests, query, filter, fuzzyMatch]);

  const stats = useMemo(() => ({
    total: guests.length,
    assigned: guests.filter(g => g.tableId || g.table).length,
    unassigned: guests.filter(g => !g.tableId && !g.table).length,
  }), [guests]);

  const handleSelectGuest = (guest) => {
    if (onSelectGuest) {
      onSelectGuest(guest);
    }
    
    // Si tiene mesa asignada, resaltarla
    if (onHighlightTable && (guest.tableId || guest.table)) {
      onHighlightTable(guest.tableId || guest.table);
    }
    
    setQuery(''); // Limpiar búsqueda
  };

  return (
    <div className={`relative ${className}`}>
      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar invitado..."
          className="w-full pl-10 pr-24 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                     transition-all duration-200"
        />
        
        {/* Botones de acción */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {query && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => setQuery('')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Limpiar"
            >
              <X className="w-4 h-4 text-gray-400" />
            </motion.button>
          )}
          
          {/* Dropdown de filtros */}
          <div className="relative group">
            <button
              className={`p-1 rounded-md transition-colors ${
                filter !== 'all'
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Filtros"
            >
              <Filter className="w-4 h-4" />
            </button>
            
            {/* Menú de filtros */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 
                            rounded-lg shadow-md border border-gray-200 dark:border-gray-700
                            opacity-0 invisible group-hover:opacity-100 group-hover:visible
                            transition-all duration-200 z-50">
              <button
                onClick={() => setFilter('all')}
                className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700
                           ${filter === 'all' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : ''}`}
              >
                <Users className="w-4 h-4" />
                <span className="flex-1">Todos</span>
                <span className="text-xs text-gray-500">{stats.total}</span>
              </button>
              <button
                onClick={() => setFilter('assigned')}
                className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700
                           ${filter === 'assigned' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : ''}`}
              >
                <UserCheck className="w-4 h-4" />
                <span className="flex-1">Asignados</span>
                <span className="text-xs text-gray-500">{stats.assigned}</span>
              </button>
              <button
                onClick={() => setFilter('unassigned')}
                className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-lg
                           ${filter === 'unassigned' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : ''}`}
              >
                <UserX className="w-4 h-4" />
                <span className="flex-1">Sin asignar</span>
                <span className="text-xs text-gray-500">{stats.unassigned}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <AnimatePresence>
        {query && filteredGuests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 
                       rounded-lg shadow-md border border-gray-200 dark:border-gray-700
                       max-h-96 overflow-y-auto z-50"
          >
            <div className="p-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2">
                {filteredGuests.length} {filteredGuests.length === 1 ? 'resultado' : 'resultados'}
              </div>
              
              {filteredGuests.map((guest, idx) => {
                const hasTable = guest.tableId || guest.table;
                const tableName = guest.table || guest.tableId || 'Sin mesa';
                
                return (
                  <motion.button
                    key={guest.id || idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => handleSelectGuest(guest)}
                    className="w-full px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700
                               text-left transition-colors duration-150 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {guest.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {guest.email || 'Sin email'}
                        </p>
                      </div>
                      
                      <div className={`px-2 py-1 rounded-md text-xs font-medium ${
                        hasTable
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {tableName}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
        
        {query && filteredGuests.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 
                       rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 z-50"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              No se encontraron invitados
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
