/**
 * Toolbar contextual que muestra solo botones relevantes según el estado
 * Reduce sobrecarga cognitiva mostrando solo lo necesario
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2,
  Layout,
  Settings,
  Hand,
  Move,
  Undo2,
  Redo2,
  Copy,
  Trash2,
  RotateCw,
  Lock,
  Unlock,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  Users,
  CheckCircle2,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react';

const TOOLBAR_STATES = {
  EMPTY: 'empty', // Sin mesas
  IDLE: 'idle', // Con mesas pero ninguna seleccionada
  SINGLE: 'single', // Una mesa seleccionada
  MULTIPLE: 'multiple', // Múltiples mesas seleccionadas
};

export default function ContextualToolbar({
  // Estado
  tables = [],
  selectedTable = null,
  selectedIds = [],
  drawMode = 'pan',
  canUndo = false,
  canRedo = false,
  validationsEnabled = true,
  globalMaxSeats = 0,

  // Callbacks
  onGenerateAuto,
  onOpenTemplates,
  onOpenSpaceConfig,
  onChangeDrawMode,
  onUndo,
  onRedo,
  onDuplicateTable,
  onDeleteTable,
  onRotateTable,
  onToggleLock,
  onAlignTables,
  onDistributeTables,
  onToggleValidations,
  onOpenCapacity,
  onOpenAdvanced,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Determinar estado del toolbar
  const getToolbarState = () => {
    if (tables.length === 0) return TOOLBAR_STATES.EMPTY;
    if (selectedIds.length > 1) return TOOLBAR_STATES.MULTIPLE;
    if (selectedTable) return TOOLBAR_STATES.SINGLE;
    return TOOLBAR_STATES.IDLE;
  };

  const state = getToolbarState();

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2 flex-wrap">
      <AnimatePresence mode="wait">
        {state === TOOLBAR_STATES.EMPTY && (
          <EmptyState
            onGenerateAuto={onGenerateAuto}
            onOpenTemplates={onOpenTemplates}
            onOpenSpaceConfig={onOpenSpaceConfig}
          />
        )}

        {state === TOOLBAR_STATES.IDLE && (
          <IdleState
            drawMode={drawMode}
            canUndo={canUndo}
            canRedo={canRedo}
            validationsEnabled={validationsEnabled}
            onChangeDrawMode={onChangeDrawMode}
            onUndo={onUndo}
            onRedo={onRedo}
            onToggleValidations={onToggleValidations}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
            onOpenAdvanced={onOpenAdvanced}
          />
        )}

        {state === TOOLBAR_STATES.SINGLE && (
          <SingleState
            selectedTable={selectedTable}
            onDuplicateTable={onDuplicateTable}
            onDeleteTable={onDeleteTable}
            onRotateTable={onRotateTable}
            onToggleLock={onToggleLock}
            globalMaxSeats={globalMaxSeats}
            onOpenCapacity={onOpenCapacity}
          />
        )}

        {state === TOOLBAR_STATES.MULTIPLE && (
          <MultipleState
            selectedCount={selectedIds.length}
            onAlignTables={onAlignTables}
            onDistributeTables={onDistributeTables}
            onDeleteTables={() => selectedIds.forEach((id) => onDeleteTable?.(id))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ESTADO: Sin mesas
function EmptyState({ onGenerateAuto, onOpenTemplates, onOpenSpaceConfig }) {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 flex-wrap"
    >
      <ToolbarButton
        icon={<Wand2 className="w-4 h-4" />}
        label="Generar Automáticamente"
        onClick={onGenerateAuto}
        variant="primary"
        tooltip="Crea un layout basado en tus invitados"
      />
      <ToolbarButton
        icon={<Layout className="w-4 h-4" />}
        label="Plantillas"
        onClick={onOpenTemplates}
        tooltip="Elige una plantilla prediseñada"
      />
      <ToolbarButton
        icon={<Settings className="w-4 h-4" />}
        label="Configurar Salón"
        onClick={onOpenSpaceConfig}
        tooltip="Define el tamaño y forma del salón"
      />
    </motion.div>
  );
}

// ESTADO: Con mesas, ninguna seleccionada
function IdleState({
  drawMode,
  canUndo,
  canRedo,
  validationsEnabled,
  onChangeDrawMode,
  onUndo,
  onRedo,
  onToggleValidations,
  showAdvanced,
  onToggleAdvanced,
  onOpenAdvanced,
}) {
  return (
    <motion.div
      key="idle"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 flex-wrap w-full"
    >
      {/* Modos de interacción */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-gray-700">
        <ModeButton
          icon={<Hand className="w-4 h-4" />}
          label="Pan"
          active={drawMode === 'pan'}
          onClick={() => onChangeDrawMode?.('pan')}
          tooltip="Arrastra para mover el canvas (Space)"
        />
        <ModeButton
          icon={<Move className="w-4 h-4" />}
          label="Mover"
          active={drawMode === 'move'}
          onClick={() => onChangeDrawMode?.('move')}
          tooltip="Click y arrastra para mover mesas"
        />
      </div>

      {/* Historial */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-gray-700">
        <IconButton
          icon={<Undo2 className="w-4 h-4" />}
          onClick={onUndo}
          disabled={!canUndo}
          tooltip="Deshacer (Cmd+Z)"
        />
        <IconButton
          icon={<Redo2 className="w-4 h-4" />}
          onClick={onRedo}
          disabled={!canRedo}
          tooltip="Rehacer (Cmd+Shift+Z)"
        />
      </div>

      {/* Validaciones */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={validationsEnabled}
              onChange={(e) => onToggleValidations?.(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-300 peer-focus:ring-2 peer-focus:ring-blue-500 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
            <CheckCircle2 className="inline w-4 h-4 mr-1" />
            Validaciones
          </span>
        </label>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Opciones avanzadas */}
      <ToolbarButton
        icon={<MoreHorizontal className="w-4 h-4" />}
        label="Más"
        onClick={onOpenAdvanced}
        tooltip="Opciones avanzadas"
      />
    </motion.div>
  );
}

// ESTADO: Una mesa seleccionada
function SingleState({
  selectedTable,
  onDuplicateTable,
  onDeleteTable,
  onRotateTable,
  onToggleLock,
  globalMaxSeats,
  onOpenCapacity,
}) {
  const tableName = selectedTable?.name || `Mesa ${selectedTable?.id}`;
  const capacity = selectedTable?.seats || globalMaxSeats || 8;
  const isLocked = selectedTable?.locked;

  return (
    <motion.div
      key="single"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 flex-wrap w-full"
    >
      {/* Info de la mesa */}
      <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-sm font-medium">
        {tableName}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<Copy className="w-4 h-4" />}
          label="Duplicar"
          onClick={() => onDuplicateTable?.(selectedTable?.id)}
          tooltip="Duplicar mesa (Cmd+D)"
        />
        <ToolbarButton
          icon={<RotateCw className="w-4 h-4" />}
          label="Rotar"
          onClick={() => onRotateTable?.(selectedTable?.id, 15)}
          tooltip="Rotar +15° (E) / -15° (Q)"
        />
        <ToolbarButton
          icon={isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          label={isLocked ? 'Desbloquear' : 'Bloquear'}
          onClick={() => onToggleLock?.(selectedTable?.id)}
          tooltip={isLocked ? 'Desbloquear mesa' : 'Bloquear mesa'}
        />
      </div>

      {/* Capacidad */}
      <button
        onClick={onOpenCapacity}
        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 transition-colors"
        title="Cambiar capacidad"
      >
        <Users className="w-4 h-4" />
        {capacity} asientos
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Eliminar */}
      <ToolbarButton
        icon={<Trash2 className="w-4 h-4" />}
        label="Eliminar"
        onClick={() => onDeleteTable?.(selectedTable?.id)}
        variant="danger"
        tooltip="Eliminar mesa (Delete)"
      />
    </motion.div>
  );
}

// ESTADO: Múltiples mesas seleccionadas
function MultipleState({ selectedCount, onAlignTables, onDistributeTables, onDeleteTables }) {
  return (
    <motion.div
      key="multiple"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 flex-wrap w-full"
    >
      {/* Info */}
      <div className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md text-sm font-medium">
        {selectedCount} mesas seleccionadas
      </div>

      {/* Acciones grupales */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={<AlignHorizontalJustifyCenter className="w-4 h-4" />}
          label="Alinear"
          onClick={onAlignTables}
          tooltip="Alinear horizontalmente"
        />
        <ToolbarButton
          icon={<AlignVerticalJustifyCenter className="w-4 h-4" />}
          label="Distribuir"
          onClick={onDistributeTables}
          tooltip="Distribuir uniformemente"
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Eliminar múltiples */}
      <ToolbarButton
        icon={<Trash2 className="w-4 h-4" />}
        label={`Eliminar (${selectedCount})`}
        onClick={onDeleteTables}
        variant="danger"
        tooltip="Eliminar mesas seleccionadas"
      />
    </motion.div>
  );
}

// Sub-componentes

function ToolbarButton({ icon, label, onClick, variant = 'default', tooltip, disabled = false }) {
  const variants = {
    default:
      'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`
        px-3 py-1.5 rounded-md text-sm font-medium
        flex items-center gap-2 transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
      `}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function IconButton({ icon, onClick, disabled = false, tooltip }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {icon}
    </button>
  );
}

function ModeButton({ icon, label, active, onClick, tooltip }) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`
        px-3 py-1.5 rounded-md text-sm font-medium
        flex items-center gap-2 transition-all
        ${
          active
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500'
            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
        }
      `}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
