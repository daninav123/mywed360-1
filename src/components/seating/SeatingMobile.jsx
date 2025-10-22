import React, { useState, useEffect } from 'react';
import { Menu, Search, Users, Plus, Grid, List } from 'lucide-react';
import useTranslations from '../../hooks/useTranslations';

/**
 * Interfaz móvil optimizada para Seating Plan
 */
const SeatingMobile = ({ tables = [], guests = [], onAssignGuest, onUpdateTable }) => {
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  // Detectar orientación
  const [isLandscape, setIsLandscape] = useState(
    window.innerWidth > window.innerHeight
  );

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filtrar invitados no asignados
  const unassignedGuests = guests.filter(g => !g.tableId);

  // Buscar
  const filteredTables = tables.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header Mobile */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>

        <h1 className="text-lg font-semibold">{t('seatingMobile.header.title', { defaultValue: 'Seating plan' })}</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white px-4 py-2 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('seatingMobile.search.placeholder', { defaultValue: 'Buscar mesas o invitados...' })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <p className="text-gray-600">{t('seatingMobile.stats.tables', { defaultValue: 'Mesas' })}</p>
            <p className="font-semibold text-lg">{tables.length}</p>
          </div>
          <div>
            <p className="text-gray-600">{t('seatingMobile.stats.guests', { defaultValue: 'Invitados' })}</p>
            <p className="font-semibold text-lg">{guests.length}</p>
          </div>
          <div>
            <p className="text-gray-600">{t('seatingMobile.stats.pending', { defaultValue: 'Pendientes' })}</p>
            <p className="font-semibold text-lg text-orange-600">
              {unassignedGuests.length}
            </p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'grid' ? (
          <div className={`grid gap-3 p-4 ${isLandscape ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {filteredTables.map(table => (
              <div
                key={table.id}
                onClick={() => setSelectedTable(table)}
                className="bg-white rounded-lg border border-gray-200 p-4 active:bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{table.name}</h3>
                  <span className="text-sm text-gray-600">
                    {table.guests?.length || 0}/{table.capacity || 0}
                  </span>
                </div>

                {table.guests?.length > 0 ? (
                  <div className="space-y-1">
                    {table.guests.slice(0, 3).map(guest => (
                      <div key={guest.id} className="text-sm text-gray-700 truncate">
                        • {guest.name}
                      </div>
                    ))}
                    {table.guests.length > 3 && (
                      <div className="text-sm text-gray-500">
                        +{table.guests.length - 3} más
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">{t('seatingMobile.tables.empty', { defaultValue: 'Mesa vacía' })}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTables.map(table => (
              <div
                key={table.id}
                onClick={() => setSelectedTable(table)}
                className="bg-white px-4 py-3 active:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{table.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('seatingMobile.tables.assignedGuests', { count: table.guests?.length || 0, defaultValue: '{{count}} invitados asignados' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {table.guests?.length || 0}/{table.capacity || 0}
                    </div>
                    <div className="text-xs text-gray-500">{t('seatingMobile.tables.occupancyLabel', { defaultValue: 'ocupación' })}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Unassigned Guests Section */}
        {unassignedGuests.length > 0 && (
          <div className="bg-orange-50 border-t border-orange-200 p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-orange-900">
                {t('seatingMobile.pending.title', { count: unassignedGuests.length, defaultValue: 'Invitados pendientes ({{count}})' })}
              </h3>
            </div>
            <div className="space-y-2">
              {unassignedGuests.slice(0, 5).map(guest => (
                <div
                  key={guest.id}
                  className="bg-white rounded-lg p-3 flex items-center justify-between"
                >
                  <span className="text-sm text-gray-900">{guest.name}</span>
                  <button
                    onClick={() => onAssignGuest?.(guest.id)}
                    className="text-blue-600 text-sm font-medium"
                  >
                    {t('seatingMobile.actions.assign', { defaultValue: 'Asignar' })}
                  </button>
                </div>
              ))}
              {unassignedGuests.length > 5 && (
                <p className="text-sm text-orange-700 text-center">
                  +{unassignedGuests.length - 5} invitados más
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FAB para añadir mesa */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-20"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Table Detail Modal (Mobile Bottom Sheet) */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setSelectedTable(null)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {selectedTable.name}
              </h2>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                <span>Capacidad: {selectedTable.capacity}</span>
                <span>•</span>
                <span>Ocupación: {selectedTable.guests?.length || 0}</span>
              </div>

              {selectedTable.guests?.length > 0 ? (
                <div className="space-y-2 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Invitados</h3>
                  {selectedTable.guests.map(guest => (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-gray-900">{guest.name}</span>
                      <button className="text-red-600 text-sm">Quitar</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No hay invitados asignados</p>
              )}

              <button
                onClick={() => setSelectedTable(null)}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatingMobile;
