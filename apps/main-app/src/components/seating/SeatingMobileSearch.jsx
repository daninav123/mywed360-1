import React, { useState, useMemo } from 'react';
import { Search, X, Users, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useTranslations from '../../hooks/useTranslations';

/**
 * Búsqueda Avanzada para Seating Móvil
 * Busca invitados y mesas, highlight en canvas
 */
const SeatingMobileSearch = ({
  tables = [],
  guests = [],
  onSelectTable,
  onSelectGuest,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslations();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, guests, tables

  // Búsqueda en tiempo real
  const searchResults = useMemo(() => {
    if (!query.trim()) return { guests: [], tables: [] };

    const lowerQuery = query.toLowerCase().trim();

    const matchedGuests = guests.filter((guest) =>
      guest.name?.toLowerCase().includes(lowerQuery)
    );

    const matchedTables = tables.filter(
      (table) =>
        table.name?.toLowerCase().includes(lowerQuery) ||
        table.guests?.some((g) => g.name?.toLowerCase().includes(lowerQuery))
    );

    return { guests: matchedGuests, tables: matchedTables };
  }, [query, guests, tables]);

  const handleSelectGuest = (guest) => {
    onSelectGuest?.(guest);
    onClose?.();
  };

  const handleSelectTable = (table) => {
    onSelectTable?.(table);
    onClose?.();
  };

  const filteredResults = useMemo(() => {
    if (activeTab === 'guests') return searchResults.guests;
    if (activeTab === 'tables') return searchResults.tables;
    return [...searchResults.guests, ...searchResults.tables];
  }, [activeTab, searchResults]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header con input */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('seatingMobile.search.placeholder', {
                    defaultValue: 'Buscar invitado o mesa...',
                  })}
                  className="flex-1 text-lg outline-none"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {t('common.cancel', { defaultValue: 'Cancelar' })}
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mt-3">
                {[
                  { id: 'all', label: t('seatingMobile.search.all', { defaultValue: 'Todo' }) },
                  {
                    id: 'guests',
                    label: t('seatingMobile.search.guests', { defaultValue: 'Invitados' }),
                    count: searchResults.guests.length,
                  },
                  {
                    id: 'tables',
                    label: t('seatingMobile.search.tables', { defaultValue: 'Mesas' }),
                    count: searchResults.tables.length,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      px-3 py-1.5 text-sm rounded-full transition-colors
                      ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {tab.label}
                    {tab.count !== undefined && query && ` (${tab.count})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {!query ? (
                <div className="p-8 text-center text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">
                    {t('seatingMobile.search.hint', {
                      defaultValue: 'Escribe para buscar invitados o mesas',
                    })}
                  </p>
                </div>
              ) : (
                <>
                  {/* Guests Results */}
                  {(activeTab === 'all' || activeTab === 'guests') &&
                    searchResults.guests.length > 0 && (
                      <div className="p-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                          {t('seatingMobile.search.guestsSection', {
                            defaultValue: 'Invitados',
                          })}{' '}
                          ({searchResults.guests.length})
                        </h3>
                        <div className="space-y-2">
                          {searchResults.guests.map((guest) => {
                            const table = tables.find((t) => t.id === guest.tableId);
                            return (
                              <button
                                key={guest.id}
                                onClick={() => handleSelectGuest(guest)}
                                className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                              >
                                <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">
                                    {guest.name}
                                  </p>
                                  {table && (
                                    <p className="text-sm text-gray-600 truncate">
                                      {t('seatingMobile.search.assignedTo', {
                                        defaultValue: 'Asignado a',
                                      })}{' '}
                                      {table.name}
                                    </p>
                                  )}
                                  {!table && (
                                    <p className="text-sm text-orange-600">
                                      {t('seatingMobile.search.notAssigned', {
                                        defaultValue: 'Sin asignar',
                                      })}
                                    </p>
                                  )}
                                </div>
                                <MapPin className="w-4 h-4 text-blue-600" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* Tables Results */}
                  {(activeTab === 'all' || activeTab === 'tables') &&
                    searchResults.tables.length > 0 && (
                      <div className="p-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                          {t('seatingMobile.search.tablesSection', {
                            defaultValue: 'Mesas',
                          })}{' '}
                          ({searchResults.tables.length})
                        </h3>
                        <div className="space-y-2">
                          {searchResults.tables.map((table) => {
                            const occupancy = (table.guests?.length || 0) / (table.capacity || 1);
                            return (
                              <button
                                key={table.id}
                                onClick={() => handleSelectTable(table)}
                                className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                              >
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    occupancy >= 1
                                      ? 'bg-green-100 text-green-700'
                                      : occupancy >= 0.5
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-gray-200 text-gray-600'
                                  }`}
                                >
                                  <span className="font-bold text-sm">{table.guests?.length || 0}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">{table.name}</p>
                                  <p className="text-sm text-gray-600">
                                    {table.guests?.length || 0} / {table.capacity || 0}{' '}
                                    {t('seatingMobile.search.seats', { defaultValue: 'asientos' })}
                                  </p>
                                </div>
                                <MapPin className="w-4 h-4 text-blue-600" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* No Results */}
                  {searchResults.guests.length === 0 && searchResults.tables.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">
                        {t('seatingMobile.search.noResults', {
                          defaultValue: 'No se encontraron resultados',
                        })}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {t('seatingMobile.search.tryDifferent', {
                          defaultValue: 'Intenta con otro término',
                        })}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Quick Stats */}
            {query && (searchResults.guests.length > 0 || searchResults.tables.length > 0) && (
              <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-center gap-4 text-xs text-gray-600">
                <span>
                  {searchResults.guests.length}{' '}
                  {t('seatingMobile.search.guestsFound', { defaultValue: 'invitado(s)' })}
                </span>
                <span>•</span>
                <span>
                  {searchResults.tables.length}{' '}
                  {t('seatingMobile.search.tablesFound', { defaultValue: 'mesa(s)' })}
                </span>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SeatingMobileSearch;
