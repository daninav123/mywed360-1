import React, { useState, useEffect, useMemo } from 'react';
import { Menu, Search, Users, Plus, Grid, List, Map, Filter, Presentation } from 'lucide-react';
import useTranslations from '../../hooks/useTranslations';
import useSeatingGestures from '../../hooks/useSeatingGestures';
import SeatingRadialFAB from './SeatingRadialFAB';
import SeatingMobileBottomPanel from './SeatingMobileBottomPanel';
import SeatingCollaborationBadge from './SeatingCollaborationBadge';
import SeatingMobileCanvas from './SeatingMobileCanvas';
import SeatingMobileTableDetails from './SeatingMobileTableDetails';
import SeatingMobileSearch from './SeatingMobileSearch';
import SeatingMobileFilters from './SeatingMobileFilters';
import SeatingPresentationMode from './SeatingPresentationMode';

/**
 * Interfaz móvil optimizada para Seating Plan
 */
const SeatingMobile = ({
  tables = [],
  guests = [],
  onAssignGuest,
  onUpdateTable,
  onAddTable,
  onAddGuest,
  onExport,
  onImport,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  collaborativeEditors = {},
  currentUser,
  onDeleteTable,
  onDuplicateTable,
  onToggleLock,
  onEditTable,
  hallSize = { width: 800, height: 600 },
}) => {
  const [viewMode, setViewMode] = useState('grid'); // grid, list, canvas
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showBottomPanel, setShowBottomPanel] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showPresentationMode, setShowPresentationMode] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ occupancy: [], locked: null, shape: [] });
  const { t } = useTranslations();

  // Gestos táctiles para el canvas
  const {
    ref: canvasRef,
    scale,
    position,
    reset,
  } = useSeatingGestures({
    onZoom: (newScale) => {
      console.log('Zoom:', newScale);
    },
    onPan: (deltaX, deltaY) => {
      console.log('Pan:', deltaX, deltaY);
    },
    onDoubleTap: (x, y) => {
      console.log('Double tap:', x, y);
      reset(); // Reset zoom en double tap
    },
    minZoom: 0.5,
    maxZoom: 3,
  });

  // Detectar orientación
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filtrar invitados no asignados
  const unassignedGuests = guests.filter((g) => !g.tableId);

  // Aplicar filtros y búsqueda
  const filteredTables = useMemo(() => {
    let result = tables;

    // Filtro de búsqueda
    if (searchQuery.trim()) {
      result = result.filter((t) =>
        t.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro de ocupación
    if (activeFilters.occupancy.length > 0) {
      result = result.filter((table) => {
        const occupancy = (table.guests?.length || 0) / (table.capacity || 1);
        return activeFilters.occupancy.some((filter) => {
          if (filter === 'empty') return occupancy === 0;
          if (filter === 'partial') return occupancy > 0 && occupancy < 1;
          if (filter === 'full') return occupancy === 1;
          if (filter === 'over') return occupancy > 1;
          return true;
        });
      });
    }

    // Filtro de estado bloqueado
    if (activeFilters.locked !== null) {
      result = result.filter((table) => table.locked === activeFilters.locked);
    }

    // Filtro de forma (si las mesas tienen propiedad shape)
    if (activeFilters.shape.length > 0) {
      result = result.filter((table) =>
        activeFilters.shape.includes(table.shape || 'round')
      );
    }

    return result;
  }, [tables, searchQuery, activeFilters]);

  // Handlers
  const handleSelectTable = (table) => {
    setSelectedTable(table);
    setShowBottomPanel(true);
  };

  const handleClosePanel = () => {
    setShowBottomPanel(false);
    setTimeout(() => setSelectedTable(null), 300);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header Mobile */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-1">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
          <button
            onClick={() => setShowPresentationMode(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title={t('seatingMobile.header.presentation', { defaultValue: 'Modo presentación' })}
          >
            <Presentation className="w-5 h-5" />
          </button>
        </div>

        <h1 className="text-lg font-semibold truncate flex-1 text-center">
          {t('seatingMobile.header.title', { defaultValue: 'Seating plan' })}
        </h1>

        <div className="flex items-center gap-1">
          {/* Búsqueda */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title={t('seatingMobile.header.search', { defaultValue: 'Buscar' })}
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Filtros */}
          <button
            onClick={() => setShowFiltersModal(true)}
            className="p-2 hover:bg-gray-100 rounded-lg relative"
            title={t('seatingMobile.header.filters', { defaultValue: 'Filtros' })}
          >
            <Filter className="w-5 h-5" />
            {(activeFilters.occupancy.length > 0 || activeFilters.locked !== null || activeFilters.shape.length > 0) && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
            )}
          </button>

          {/* Toggle vista */}
          <button
            onClick={() => {
              if (viewMode === 'grid') setViewMode('list');
              else if (viewMode === 'list') setViewMode('canvas');
              else setViewMode('grid');
            }}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title={t('seatingMobile.viewMode.toggle', { defaultValue: 'Cambiar vista' })}
          >
            {viewMode === 'canvas' ? <Map className="w-5 h-5" /> : viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Quick Search Bar (opcional - mostrar solo si hay búsqueda activa) */}
      {searchQuery && (
        <div className="bg-blue-50 px-4 py-2 border-b border-blue-200 flex items-center justify-between">
          <span className="text-sm text-blue-900">
            {filteredTables.length} {t('seatingMobile.search.results', { defaultValue: 'resultado(s)' })}
          </span>
          <button
            onClick={() => setSearchQuery('')}
            className="text-sm text-blue-600 font-medium"
          >
            {t('common.clear', { defaultValue: 'Limpiar' })}
          </button>
        </div>
      )}

      {/* Stats Bar */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <p className="text-gray-600">
              {t('seatingMobile.stats.tables', { defaultValue: 'Mesas' })}
            </p>
            <p className="font-semibold text-lg">{tables.length}</p>
          </div>
          <div>
            <p className="text-gray-600">
              {t('seatingMobile.stats.guests', { defaultValue: 'Invitados' })}
            </p>
            <p className="font-semibold text-lg">{guests.length}</p>
          </div>
          <div>
            <p className="text-gray-600">
              {t('seatingMobile.stats.pending', { defaultValue: 'Pendientes' })}
            </p>
            <p className="font-semibold text-lg text-orange-600">{unassignedGuests.length}</p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'canvas' ? (
          <SeatingMobileCanvas
            tables={filteredTables}
            selectedTableId={selectedTable?.id}
            onSelectTable={handleSelectTable}
            hallSize={hallSize}
          />
        ) : (
        <div className="h-full overflow-y-auto">
        {viewMode === 'grid' ? (
          <div className={`grid gap-3 p-4 ${isLandscape ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {filteredTables.map((table) => (
              <div
                key={table.id}
                onClick={() => handleSelectTable(table)}
                className="bg-white rounded-lg border border-gray-200 p-4 active:bg-gray-50 relative"
              >
                {/* Badge de colaboración */}
                {collaborativeEditors[table.id] && (
                  <SeatingCollaborationBadge
                    editors={collaborativeEditors[table.id]}
                    position="top-right"
                    size="md"
                  />
                )}

                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{table.name}</h3>
                  <span className="text-sm text-gray-600">
                    {table.guests?.length || 0}/{table.capacity || 0}
                  </span>
                </div>

                {table.guests?.length > 0 ? (
                  <div className="space-y-1">
                    {table.guests.slice(0, 3).map((guest) => (
                      <div key={guest.id} className="text-sm text-gray-700 truncate">
                        • {guest.name}
                      </div>
                    ))}
                    {table.guests.length > 3 && (
                      <div className="text-sm text-gray-500">+{table.guests.length - 3} más</div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    {t('seatingMobile.tables.empty', { defaultValue: 'Mesa vacía' })}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTables.map((table) => (
              <div
                key={table.id}
                onClick={() => handleSelectTable(table)}
                className="bg-white px-4 py-3 active:bg-gray-50 relative"
              >
                {/* Badge de colaboración */}
                {collaborativeEditors[table.id] && (
                  <SeatingCollaborationBadge
                    editors={collaborativeEditors[table.id]}
                    position="top-right"
                    size="sm"
                  />
                )}

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{table.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('seatingMobile.tables.assignedGuests', {
                        count: table.guests?.length || 0,
                        defaultValue: '{{count}} invitados asignados',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {table.guests?.length || 0}/{table.capacity || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t('seatingMobile.tables.occupancyLabel', { defaultValue: 'ocupación' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
        )}

        {/* Unassigned Guests Section (solo en vistas lista/grid) */}
        {viewMode !== 'canvas' && unassignedGuests.length > 0 && (
          <div className="bg-orange-50 border-t border-orange-200 p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-orange-900">
                {t('seatingMobile.pending.title', {
                  count: unassignedGuests.length,
                  defaultValue: 'Invitados pendientes ({{count}})',
                })}
              </h3>
            </div>
            <div className="space-y-2">
              {unassignedGuests.slice(0, 5).map((guest) => (
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

      {/* FAB Radial con acciones múltiples */}
      <SeatingRadialFAB
        onAddTable={onAddTable}
        onAddGuest={onAddGuest}
        onExport={onExport}
        onImport={onImport}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Table Detail Bottom Panel */}
      <SeatingMobileBottomPanel
        isOpen={showBottomPanel}
        onClose={handleClosePanel}
        title={selectedTable?.name || ''}
        defaultHeight="medium"
      >
        <SeatingMobileTableDetails
          table={selectedTable}
          guests={guests}
          onAssignGuest={(guestId, tableId) => onAssignGuest?.(guestId, tableId)}
          onRemoveGuest={(guestId) => onAssignGuest?.(guestId, null)}
          onEditTable={onEditTable}
          onDeleteTable={onDeleteTable}
          onDuplicateTable={onDuplicateTable}
          onToggleLock={onToggleLock}
        />
      </SeatingMobileBottomPanel>

      {/* Search Modal */}
      <SeatingMobileSearch
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        tables={tables}
        guests={guests}
        onSelectTable={(table) => {
          handleSelectTable(table);
          setShowSearchModal(false);
        }}
        onSelectGuest={(guest) => {
          // Si el invitado tiene mesa, ir a esa mesa
          if (guest.tableId) {
            const table = tables.find((t) => t.id === guest.tableId);
            if (table) handleSelectTable(table);
          }
          setShowSearchModal(false);
        }}
      />

      {/* Filters Modal */}
      <SeatingMobileFilters
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        currentFilters={activeFilters}
        onApply={(filters) => {
          setActiveFilters(filters);
          setShowFiltersModal(false);
        }}
      />

      {/* Presentation Mode */}
      <SeatingPresentationMode
        isOpen={showPresentationMode}
        onClose={() => setShowPresentationMode(false)}
        tables={filteredTables}
        guests={guests}
        autoPlayInterval={5000}
      />
    </div>
  );
};

export default SeatingMobile;
