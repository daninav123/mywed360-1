/**
 * Componente Sidebar especializado para el plan de asientos
 * Maneja la información de mesas seleccionadas, herramientas de dibujo e invitados
 */

import {
  Settings,
  Users,
  Move,
  Hand,
  Minus,
  Square,
  Search,
  UserPlus,
  Eraser,
  DoorOpen,
  Hexagon,
  Copy,
  Trash2,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

import TableEditor from './TableEditor';
import useTranslations from '../../hooks/useTranslations';
import GuestItem from '../GuestItem';
import { TABLE_TYPES, computeTableCapacity } from '../../utils/seatingTables';

const SeatingPlanSidebar = ({
  selectedTable,
  onTableDimensionChange,
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
  toggleTableLocked,
  // Conflicts & guided assignment
  conflicts = [],
  onFixTable,
  onFocusTable,
  onSelectTable,
  guidedGuestId,
  onGuideGuest,
  suggestForGuest,
  scoringWeights,
  onUpdateScoringWeights,
  globalMaxSeats = 0,
  className = '',
}) => {
  const { t } = useTranslations();
  const [guestSearch, setGuestSearch] = useState('');
  const [guestSide, setGuestSide] = useState(''); // '', 'novia', 'novio'
  const [guestIsChild, setGuestIsChild] = useState(''); // '', 'si', 'no'
  const [guestAllergen, setGuestAllergen] = useState('');
  const [guestGroup, setGuestGroup] = useState('');
  const [showAvailableGuests, setShowAvailableGuests] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);
  const [showGuided, setShowGuided] = useState(false);
  const [conflictFilters, setConflictFilters] = useState({
    perimeter: true,
    obstacle: true,
    spacing: true,
    overbooking: true,
  });

  // Herramientas de dibujo específicas para banquete
  const drawingTools = [
    { id: 'pan', label: t('seating.tools.pan', { defaultValue: {t('common.panoramica')} }), icon: Hand },
    {
      id: 'move',
      label: t('seating.tools.moveTables', { defaultValue: 'Mover mesas' }),
      icon: Move,
    },
    {
      id: 'boundary',
      label: t('seating.tools.boundary', { defaultValue: {t('common.perimetro')} }),
      icon: Square,
    },
    { id: 'door', label: t('seating.tools.doors', { defaultValue: 'Puertas' }), icon: DoorOpen },
    {
      id: 'obstacle',
      label: t('seating.tools.obstacles', { defaultValue: {t('common.obstaculos')} }),
      icon: Hexagon,
    },
    { id: 'aisle', label: t('seating.tools.aisles', { defaultValue: 'Pasillos' }), icon: Minus },
    { id: 'erase', label: t('seating.tools.erase', { defaultValue: 'Borrar' }), icon: Eraser },
  ];

  // Filtrar invitados disponibles (sin asignar a mesa) con saneo defensivo
  const availableGuests = useMemo(() => {
    return guests.filter((guest) => {
      const noTable = !guest?.table && !guest?.tableId;
      if (!noTable) return false;
      const name = typeof guest?.name === 'string' ? guest.name : '';
      const term = typeof guestSearch === 'string' ? guestSearch.toLowerCase() : '';
      if (term && !name.toLowerCase().includes(term)) return false;
      if (guestSide && String(guest?.side || '').toLowerCase() !== guestSide) return false;
      if (guestIsChild === 'si' && !guest?.isChild) return false;
      if (guestIsChild === 'no' && guest?.isChild) return false;
      if (guestAllergen) {
        const all = String(guest?.allergens || guest?.alergenos || '').toLowerCase();
        if (!all.includes(guestAllergen.toLowerCase())) return false;
      }
      if (guestGroup) {
        const g1 = String(
          guest?.group || guest?.groupName || guest?.companionGroupId || ''
        ).toLowerCase();
        if (!g1.includes(guestGroup.toLowerCase())) return false;
      }
      return true;
    });
  }, [guests, guestSearch, guestSide, guestIsChild, guestAllergen, guestGroup]);

  const pendingCount = availableGuests.length;

  const assignedGuests = useMemo(() => {
    return guests.filter((guest) => guest.tableId === selectedTable?.id);
  }, [guests, selectedTable?.id]);

  const selectedTableType = useMemo(() => {
    if (!selectedTable) return null;
    const typeId =
      selectedTable.tableType ||
      (selectedTable.shape === 'circle' ? 'round' : 'square');
    return TABLE_TYPES.find((t) => t.id === typeId) || null;
  }, [selectedTable?.tableType, selectedTable?.shape]);

  const recommendedCapacity = useMemo(() => {
    if (!selectedTable) return 0;
    return computeTableCapacity(selectedTable);
  }, [selectedTable]);

  const assignedGuestsWithCompanions = useMemo(() => {
    return assignedGuests.reduce(
      (sum, guest) => sum + 1 + (parseInt(guest?.companion, 10) || 0),
      0
    );
  }, [assignedGuests]);

  const remainingCapacity = selectedTable
    ? (selectedTable.seats || 0) - assignedGuestsWithCompanions
    : 0;

  const guidedSuggestions = (() => {
    try {
      if (!guidedGuestId || typeof suggestForGuest !== 'function') return [];
      return (suggestForGuest(guidedGuestId) || []).slice(0, 5);
    } catch (_) {
      return [];
    }
  })();

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
              {t('seating.sidebar.pending', {
                count: pendingCount,
                defaultValue: `Pendientes (${pendingCount})`,
              })}
            </h4>
            <button
              onClick={() => setShowAvailableGuests(!showAvailableGuests)}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <UserPlus className="h-4 w-4" />
              {showAvailableGuests
                ? t('seating.sidebar.hideGuests', { defaultValue: 'Ocultar Invitados' })
                : t('seating.sidebar.showGuests', { defaultValue: 'Mostrar Invitados' })}
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

              {/* Filtros avanzados */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select
                  value={guestSide}
                  onChange={(e) => setGuestSide(e.target.value)}
                  className="px-2 py-1 border rounded text-xs"
                >
                  <option value="">Lado (todos)</option>
                  <option value="novia">Novia</option>
                  <option value="novio">Novio</option>
                </select>
                <select
                  value={guestIsChild}
                  onChange={(e) => setGuestIsChild(e.target.value)}
                  className="px-2 py-1 border rounded text-xs"
                >
                  <option value="">Niños (todos)</option>
                  <option value="si">Niños</option>
                  <option value="no">Adultos</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <input
                  value={guestAllergen}
                  onChange={(e) => setGuestAllergen(e.target.value)}
                  placeholder="Alergias..."
                  className="px-2 py-1 border rounded text-xs"
                />
                <input
                  value={guestGroup}
                  onChange={(e) => setGuestGroup(e.target.value)}
                  placeholder="Grupo..."
                  className="px-2 py-1 border rounded text-xs"
                />
              </div>

              {/* Lista de invitados disponibles (drag source + click-assign) */}
              <div className="max-h-32 overflow-y-auto space-y-1">
                {availableGuests.length > 0 ? (
                  availableGuests.map((guest) => (
                    <GuestItem
                      key={guest.id}
                      guest={guest}
                      onClick={() => selectedTable && onAssignGuest?.(selectedTable.id, guest.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-2 text-gray-500 text-xs">
                    {guestSearch
                      ? t('seating.sidebar.noResults')
                      : t('seating.sidebar.allAssigned')}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Conflictos */}
      {tab === 'banquet' && (
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">
              {t('seating.sidebar.conflictsTitle', { defaultValue: 'Conflictos' })}
            </h4>
            <button
              onClick={() => setShowConflicts(!showConflicts)}
              className="text-sm text-blue-600 hover:underline"
            >
              {showConflicts
                ? t('common.hide', { defaultValue: 'Ocultar' })
                : t('common.view', { defaultValue: 'Ver' })}
            </button>
          </div>
          {showConflicts && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {/* Resumen y filtros */}
              <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                {/* Resumen por tipo */}
                {(() => {
                  const counts = (conflicts || []).reduce((m, c) => {
                    m[c.type] = (m[c.type] || 0) + 1;
                    return m;
                  }, {});
                  const badge = (label, k, color) => (
                    <span
                      key={`b-${k}`}
                      className={`px-2 py-0.5 rounded-full text-white`}
                      style={{ background: color }}
                      title={`${counts[k] || 0} ${label}`}
                    >
                      {label}: {counts[k] || 0}
                    </span>
                  );
                  return (
                    <>
                      {badge(
                        t('seating.sidebar.conflictPerimeter', { defaultValue: {t('common.perimetro')} }),
                        'perimeter',
                        '#ef4444'
                      )}
                      {badge(
                        t('seating.sidebar.conflictObstacle', { defaultValue: {t('common.obstaculos')} }),
                        'obstacle',
                        '#dc2626'
                      )}
                      {badge(
                        t('seating.sidebar.conflictAisles', { defaultValue: 'Pasillos' }),
                        'spacing',
                        '#f59e0b'
                      )}
                      {badge(
                        t('seating.sidebar.conflictOverbooking', { defaultValue: 'Overbooking' }),
                        'overbooking',
                        '#f97316'
                      )}
                    </>
                  );
                })()}
                <span className="mx-2 opacity-40">|</span>
                {['perimeter', 'obstacle', 'spacing', 'overbooking'].map((k) => (
                  <label key={k} className="inline-flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={!!conflictFilters[k]}
                      onChange={(e) =>
                        setConflictFilters((prev) => ({ ...prev, [k]: e.target.checked }))
                      }
                    />
                    <span className="capitalize">{k}</span>
                  </label>
                ))}
                <button
                  className="ml-auto text-blue-600 hover:underline"
                  onClick={() =>
                    setConflictFilters({
                      perimeter: true,
                      obstacle: true,
                      spacing: true,
                      overbooking: true,
                    })
                  }
                >
                  {t('common.all', { defaultValue: 'Todos' })}
                </button>
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() =>
                    setConflictFilters({
                      perimeter: false,
                      obstacle: false,
                      spacing: false,
                      overbooking: false,
                    })
                  }
                >
                  {t('common.none', { defaultValue: 'Ninguno' })}
                </button>
              </div>
              {(conflicts || []).filter((c) => conflictFilters[c.type]).length === 0 ? (
                <div className="text-xs text-gray-500">
                  {t('seating.sidebar.noConflicts', { defaultValue: 'Sin conflictos' })}
                </div>
              ) : (
                conflicts
                  .filter((c) => conflictFilters[c.type])
                  .slice(0, 50)
                  .map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs bg-red-50 border border-red-200 rounded px-2 py-1"
                    >
                      <button
                        className="text-left flex-1 hover:underline"
                        title={t('seating.sidebar.focusTable', {
                          defaultValue: 'Centrar en el plano',
                        })}
                        onClick={() => {
                          onFocusTable?.(c.tableId);
                          onSelectTable?.(c.tableId, false);
                        }}
                      >
                        <span className="font-semibold">Mesa {c.tableId}:</span> {c.message}
                      </button>
                      <button
                        className="text-blue-600 hover:underline mr-2"
                        title={t('seating.sidebar.goTo', { defaultValue: 'Ir a mesa' })}
                        onClick={() => {
                          onFocusTable?.(c.tableId);
                          onSelectTable?.(c.tableId, false);
                        }}
                      >
                        Ir
                      </button>
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => onFixTable?.(c.tableId)}
                      >
                        {t('seating.sidebar.fix', { defaultValue: 'Arreglar' })}
                      </button>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Asignación guiada */}
      {tab === 'banquet' && (
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Asignación guiada</h4>
            <button
              onClick={() => setShowGuided(!showGuided)}
              className="text-sm text-blue-600 hover:underline"
            >
              {showGuided
                ? t('common.hide', { defaultValue: 'Ocultar' })
                : t('common.view', { defaultValue: 'Ver' })}
            </button>
          </div>
          {showGuided && (
            <div className="space-y-2">
              <select
                value={guidedGuestId || ''}
                onChange={(e) => onGuideGuest?.(e.target.value || null)}
                className="w-full px-2 py-1 border rounded text-sm"
              >
                <option value="">Selecciona invitado…</option>
                {availableGuests.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              {guidedGuestId && (
                <div className="space-y-1">
                  {guidedSuggestions.length === 0 ? (
                    <div className="text-xs text-gray-500">
                      {t('seating.sidebar.noSuggestions', { defaultValue: 'Sin sugerencias' })}
                    </div>
                  ) : (
                    guidedSuggestions.map((s) => (
                      <div
                        key={s.tableId}
                        className="flex items-center justify-between text-xs bg-blue-50 border border-blue-200 rounded px-2 py-1"
                      >
                        <div>
                          Mesa {s.tableId} - Score {s.score}
                        </div>
                        <button
                          className="text-blue-600 hover:underline"
                          onClick={() => onAssignGuest?.(s.tableId, guidedGuestId)}
                        >
                          {t('seating.sidebar.assignGuestButton', { defaultValue: 'Asignar' })}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
              {/* Pesos del scoring */}
              <div className="mt-2 p-2 bg-gray-50 rounded border">
                <div className="text-xs font-medium mb-2">
                  {t('seating.sidebar.weightsTitle', { defaultValue: 'Pesos' })}
                </div>
                {[
                  {
                    key: 'fit',
                    label: t('seating.sidebar.weightFit', { defaultValue: 'Encaje' }),
                    min: 0,
                    max: 100,
                    step: 5,
                  },
                  {
                    key: 'side',
                    label: t('seating.sidebar.weightSide', { defaultValue: 'Lado' }),
                    min: 0,
                    max: 20,
                    step: 1,
                  },
                  {
                    key: 'wants',
                    label: t('seating.sidebar.weightTogether', { defaultValue: 'Juntos' }),
                    min: 0,
                    max: 30,
                    step: 1,
                  },
                  {
                    key: 'avoid',
                    label: t('seating.sidebar.weightAvoid', { defaultValue: 'Evitar' }),
                    min: -50,
                    max: 0,
                    step: 1,
                  },
                ].map((cfg) => (
                  <div key={cfg.key} className="mb-2">
                    <div className="flex justify-between">
                      <span className="text-xs">{cfg.label}</span>
                      <span className="text-[11px] font-semibold">{scoringWeights?.[cfg.key]}</span>
                    </div>
                    <input
                      type="range"
                      min={cfg.min}
                      max={cfg.max}
                      step={cfg.step}
                      value={scoringWeights?.[cfg.key] ?? 0}
                      onChange={(e) =>
                        onUpdateScoringWeights?.({ [cfg.key]: parseInt(e.target.value, 10) })
                      }
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
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
          <TableEditor
            table={selectedTable}
            globalMaxSeats={globalMaxSeats}
            onChange={onTableDimensionChange}
            onClose={() => setShowAvailableGuests(false)}
          />
          {/* Contenido de Mesa Seleccionada */}
          <div className="p-4 space-y-4">
            {/* Información básica */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t('seating.sidebar.scope', { defaultValue: 'Espacio' })}:</span>
                <span className="font-medium capitalize">
                  {tab === 'ceremony'
                    ? t('seating.toolbar.ceremony')
                    : t('seating.toolbar.banquet')}
                </span>
              </div>

              {tab === 'banquet' && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {t('seating.sidebar.tableType', { defaultValue: 'Tipo de mesa' })}:
                    </span>
                    <span className="font-medium">
                      {selectedTableType?.label || t('common.custom', { defaultValue: 'Personalizada' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {t('seating.sidebar.capacity', { defaultValue: 'Capacidad' })}:
                    </span>
                    <span className="font-medium">
                      {(selectedTable.seats || 0)} {t('seating.sidebar.guests', { defaultValue: 'invitados' })}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {t('seating.sidebar.assignedCount', {
                      defaultValue: {t('common.asignados_incluye_acompanantes_count')},
                      count: assignedGuestsWithCompanions,
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {selectedTable.autoCapacity !== false
                      ? t('seating.sidebar.autoCapacity', {
                          defaultValue: {t('common.capacidad_calculada_automaticamente_sugerido_count')},
                          count: recommendedCapacity || 0,
                        })
                      : t('seating.sidebar.manualCapacity', {
                          defaultValue: 'Capacidad manual: {current}. Recomendado {recommended}',
                          current: selectedTable.seats || 0,
                          recommended: recommendedCapacity || 0,
                        })}
                  </div>
                  <div
                    className={`text-xs ${
                      remainingCapacity < 0 ? 'text-red-600' : 'text-gray-500'
                    }`}
                  >
                    {remainingCapacity < 0
                      ? t('seating.sidebar.capacityExceeded', {
                          defaultValue: 'Capacidad excedida por {count} invitado(s)',
                          count: Math.abs(remainingCapacity),
                        })
                      : t('seating.sidebar.capacityRemaining', {
                          defaultValue: 'Quedan {count} invitado(s) disponibles',
                          count: remainingCapacity,
                        })}
                  </div>
                </>
              )}
            </div>

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
                          <div className="text-xs text-blue-600 capitalize">{guest.side}</div>
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
                  {showAvailableGuests ? t('common.hide') : t('common.show')}{' '}
                  {t('seating.sidebar.guests')}
                </button>
              )}

              {/* Acciones de mesa: duplicar / eliminar / bloquear */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => duplicateTable?.(selectedTable.id)}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                  title={t('seating.sidebar.duplicateTable')}
                >
                  <Copy className="h-4 w-4" /> {t('common.duplicate')}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm({t('common.eliminar_esta_mesa')})) deleteTable?.(selectedTable.id);
                  }}
                  className="px-3 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                  title={t('seating.sidebar.deleteTable')}
                >
                  <Trash2 className="h-4 w-4" /> {t('common.delete')}
                </button>
                <button
                  onClick={() => toggleTableLocked?.(selectedTable.id)}
                  className="col-span-2 px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
                  title={selectedTable?.locked ? 'Desbloquear mesa' : 'Bloquear mesa'}
                >
                  {selectedTable?.locked ? 'Desbloquear mesa' : 'Bloquear mesa'}
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
