/**
 * Componente Sidebar especializado para el plan de asientos
 * Maneja la información de mesas seleccionadas, herramientas de dibujo e invitados
 */

import React, { useState } from 'react';
import useTranslations from '../../hooks/useTranslations';
import TableEditor from './TableEditor';
import GuestItem from '../GuestItem';
import { 
  Settings, Users, Maximize2, RotateCcw, Move, Hand, 
  Pencil, Minus, Square, Zap, Search, UserPlus,
  MousePointer, Edit3, Eraser, DoorOpen, Hexagon,
  Copy, Trash2
} from 'lucide-react';

const SeatingPlanSidebar = ({
  selectedTable,
  onTableDimensionChange,
  onToggleTableShape,
  onConfigureTable,
  guests = [],
  tab,
  drawMode = 'pan',
  onDrawModeChange,
  onAssignGuest,
  onUnassignGuest,
  onAutoAssign,
  deleteTable,
  duplicateTable,
  globalMaxSeats = 0,
  className = ""
}) => {
  const { t } = useTranslations();
  const [guestSearch, setGuestSearch] = useState('');
  const [showAvailableGuests, setShowAvailableGuests] = useState(false);
  
  // Herramientas de dibujo específicas para banquete
  const drawingTools = [
    { id: 'pan',       label: t('seating.tools.pan',         { defaultValue: 'Panorámica' }),      icon: Hand },
    { id: 'move',      label: t('seating.tools.moveTables',  { defaultValue: 'Mover mesas' }),     icon: Move },
    { id: 'boundary',  label: t('seating.tools.boundary',    { defaultValue: 'Perímetro' }),       icon: Square },
    { id: 'door',      label: t('seating.tools.doors',       { defaultValue: 'Puertas' }),         icon: DoorOpen },
    { id: 'obstacle',  label: t('seating.tools.obstacles',   { defaultValue: 'Obstáculos' }),      icon: Hexagon },
    { id: 'aisle',     label: t('seating.tools.aisles',      { defaultValue: 'Pasillos' }),        icon: Minus },
    { id: 'erase',     label: t('seating.tools.erase',       { defaultValue: 'Borrar' }),          icon: Eraser }
  ];

  // Filtrar invitados disponibles (sin asignar a mesa) con saneo defensivo
  const availableGuests = guests.filter((guest) => {
    const noTable = !guest?.table && !guest?.tableId;
    const name = typeof guest?.name === 'string' ? guest.name : '';
    const term = typeof guestSearch === 'string' ? guestSearch.toLowerCase() : '';
    return noTable && name.toLowerCase().includes(term);
  });

  const pendingCount = availableGuests.length;

  const assignedGuests = guests.filter(guest => 
    guest.tableId === selectedTable?.id
  );

  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${className}`}>
      {/* Herramientas de Dibujo */}
      <div className="bg-gray-50 px-4 py-3 border-b">
        <h3 className="font-medium text-gray-900 mb-3">{t('seating.sidebar.tools')}</h3>
        <div className="grid grid-cols-2 gap-2">
          {drawingTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => onDrawModeChange?.(tool.id)}
                className={`flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors ${
                  drawMode === tool.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
                title={tool.label}
              >
                <Icon className="h-3 w-3" />
                <span className="truncate">{tool.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Instrucciones de uso */}
        {drawMode === 'boundary' && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
            <strong>{t('seating.tools.boundary')}:</strong> {t('seating.hints.boundary')}
          </div>
        )}
        {drawMode === 'obstacle' && (
          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
            <strong>{t('seating.tools.obstacles')}:</strong> {t('seating.hints.obstacle')}
          </div>
        )}
        {drawMode === 'door' && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
            <strong>{t('seating.tools.doors')}:</strong> {t('seating.hints.door')}
          </div>
        )}
        {drawMode === 'aisle' && (
          <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-800">
            <strong>{t('seating.tools.aisles')}:</strong> {t('seating.hints.aisle')}
          </div>
        )}
      </div>

      {/* Asignación Automática: removida por requerimiento */}

      {/* Panel de Invitados Disponibles */}
      {tab === 'banquet' && (
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">
              {t('seating.sidebar.pending', { count: pendingCount, defaultValue: `Pendientes (${pendingCount})` })}
            </h4>
            <button
              onClick={() => setShowAvailableGuests(!showAvailableGuests)}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <UserPlus className="h-4 w-4" />
              {showAvailableGuests ? 'Ocultar Invitados' : 'Mostrar Invitados'}
            </button>
          </div>
          
          {showAvailableGuests && (
            <>
              {/* Buscador */}
              <div className="relative mb-3">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('seating.sidebar.searchGuests')}
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Lista de invitados disponibles (drag source + click-assign) */}
              <div className="max-h-32 overflow-y-auto space-y-1">
                {availableGuests.length > 0 ? (
                  availableGuests.slice(0, 12).map((guest) => (
                    <GuestItem
                      key={guest.id}
                      guest={guest}
                      onClick={() => selectedTable && onAssignGuest?.(selectedTable.id, guest.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-2 text-gray-500 text-xs">
                    {guestSearch ? t('seating.sidebar.noResults') : t('seating.sidebar.allAssigned')}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Información de Mesa Seleccionada */}
      {selectedTable && (
        <>
          <div className="bg-gray-50 px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">
                {selectedTable.name || t('seating.sidebar.tableDefault', { id: selectedTable.id })}
              </h3>
              <button
                onClick={() => onConfigureTable?.(selectedTable)}
                className="p-1 hover:bg-gray-200 rounded"
                title={t('seating.sidebar.configureTable')}
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Editor de Mesa */}
            <TableEditor table={selectedTable} globalMaxSeats={globalMaxSeats} onChange={onTableDimensionChange} onClose={() => setShowAvailableGuests(false)} />
            {/* Contenido de Mesa Seleccionada */}
          <div className="p-4 space-y-4">
            {/* Información básica */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t('seating.sidebar.type')}:</span>
                <span className="font-medium capitalize">
                  {tab === 'ceremony' ? t('seating.toolbar.ceremony') : t('seating.toolbar.banquet')}
                </span>
              </div>
              
              {tab === 'banquet' && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t('seating.sidebar.seats')}:</span>
                    <span className="font-medium">{selectedTable.seats || 8}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t('seating.sidebar.shape')}:</span>
                    <button
                      onClick={onToggleTableShape}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    >
                      <span className="capitalize">{selectedTable.shape || 'rectangle'}</span>
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Dimensiones */}
            {tab === 'banquet' && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  <Maximize2 className="h-4 w-4" />
                  {t('seating.sidebar.dimensions')}
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      {t('seating.sidebar.widthCm')}
                    </label>
                    <input
                      type="number"
                      min="20"
                      max="400"
                      value={selectedTable.width || 80}
                      onChange={(e) => onTableDimensionChange?.('width', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      {t('seating.sidebar.lengthCm')}
                    </label>
                    <input
                      type="number"
                      min="20"
                      max="400"
                      value={selectedTable.height || selectedTable.length || 60}
                      onChange={(e) => onTableDimensionChange?.('height', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Invitados asignados a esta mesa */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center gap-1">
                <Users className="h-4 w-4" />
                {t('seating.sidebar.assignedGuests', { count: assignedGuests.length })}
              </h4>
              
              {assignedGuests.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {assignedGuests.map((guest, index) => (
                    <div
                      key={guest.id || index}
                      className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded text-sm"
                    >
                      <div>
                        <div className="font-medium text-blue-800">{guest.name}</div>
                        {guest.side && (
                          <div className="text-xs text-blue-600 capitalize">
                            {guest.side}
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => {
                          if (window.confirm(`Quitar a ${guest.name} de la mesa?`)) {
                            onUnassignGuest?.(guest.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 text-xs font-bold"
                        title={t('seating.sidebar.removeGuest')}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">{t('seating.sidebar.noAssigned')}</p>
                  <p className="text-xs mt-1">{t('seating.sidebar.usePanelToAssign')}</p>
                </div>
              )}
            </div>

            {/* Acciones rápidas */}
            <div className="pt-3 border-t space-y-2">
              <button
                onClick={() => onConfigureTable?.(selectedTable)}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                {t('seating.sidebar.configureTable')}
              </button>
              
              {tab === 'banquet' && (
                <button
                  onClick={() => setShowAvailableGuests(!showAvailableGuests)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
                >
                  {showAvailableGuests ? t('common.hide') : t('common.show')} {t('seating.sidebar.guests')}
                </button>
              )}

              {/* Acciones de mesa: duplicar / eliminar */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => duplicateTable?.(selectedTable.id)}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                  title={t('seating.sidebar.duplicateTable')}
                >
                  <Copy className="h-4 w-4" /> {t('common.duplicate')}
                </button>
                <button
                  onClick={() => { if (window.confirm('¿Eliminar esta mesa?')) deleteTable?.(selectedTable.id); }}
                  className="px-3 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                  title={t('seating.sidebar.deleteTable')}
                >
                  <Trash2 className="h-4 w-4" /> {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(SeatingPlanSidebar);
