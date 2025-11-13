/**
 * SeatingToolbarFloating - Toolbar vertical flotante con diseño moderno
 * Inspirado en Figma/Canva
 */
import React from 'react';
import { motion } from 'framer-motion';
import {
  Move,
  Plus,
  Pencil,
  Sparkles,
  Undo2,
  Redo2,
  Settings,
  Layers,
  LayoutGrid,
  PenTool,
  Map,
} from 'lucide-react';

const ToolbarButton = ({ icon: Icon, label, onClick, isActive, disabled, shortcut, badge }) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      className={`
        relative group w-12 h-12 rounded-lg
        flex items-center justify-center
        transition-all duration-200
        ${
          isActive
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/50'
            : disabled
              ? 'bg-transparent text-gray-600 cursor-not-allowed opacity-40'
              : 'bg-transparent text-gray-400 hover:bg-white/10 hover:text-white'
        }
      `}
      aria-label={label}
      title={label}
    >
      <Icon size={20} strokeWidth={2} />

      {/* Badge (ej: BETA) */}
      {badge && (
        <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-bold px-1 rounded">
          {badge}
        </span>
      )}

      {/* Tooltip */}
      <div
        className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg 
                      opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity
                      whitespace-nowrap z-50 shadow-xl"
      >
        <div className="flex items-center gap-2">
          <span>{label}</span>
          {shortcut && (
            <kbd className="px-2 py-0.5 bg-gray-800 rounded text-xs font-mono">{shortcut}</kbd>
          )}
        </div>
        {/* Arrow */}
        <div
          className="absolute right-full top-1/2 -translate-y-1/2 
                        border-4 border-transparent border-r-gray-900"
        />
      </div>
    </motion.button>
  );
};

const ToolbarDivider = () => <div className="h-px bg-white/10 my-2 mx-2" />;

export default function SeatingToolbarFloating({
  mode,
  onModeChange,
  onAddTable,
  onOpenDrawMode,
  onAutoAssign,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenSettings,
  onOpenTemplates,
  onOpenLayoutGenerator, // FASE 1
  onToggleDrawingTools, // FASE 2
  hasDrawingElements, // FASE 2
  onClearDrawing, // FASE 2
  onToggleMinimap, // FASE 3
  showMinimap = false, // FASE 3
  onGenerarTodoAutomatico, // FASE 4 - Generación completa ✨
  isGeneratingAuto = false, // FASE 4
}) {
  const tools = [
    {
      id: 'move',
      icon: Move,
      label: 'Mover',
      shortcut: '1',
      onClick: () => onModeChange('navigate'),
    },
    {
      id: 'add',
      icon: Plus,
      label: 'Añadir mesa',
      shortcut: 'A',
      onClick: onAddTable,
    },
    {
      id: 'draw',
      icon: Pencil,
      label: 'Dibujar áreas',
      shortcut: 'D',
      onClick: onOpenDrawMode,
    },
    {
      id: 'templates',
      icon: Layers,
      label: 'Plantillas',
      shortcut: 'T',
      onClick: onOpenTemplates,
    },
    {
      id: 'layout-generator',
      icon: LayoutGrid,
      label: 'Auto-generar Layout',
      shortcut: 'L',
      badge: 'NEW',
      onClick: onOpenLayoutGenerator,
    },
    {
      id: 'auto-complete',
      icon: Sparkles,
      label: isGeneratingAuto ? 'Generando...' : 'Generar TODO Automático',
      shortcut: 'Ctrl+G',
      badge: '✨',
      onClick: onGenerarTodoAutomatico,
      disabled: isGeneratingAuto,
    },
    {
      id: 'drawing-tools',
      icon: PenTool,
      label: 'Herramientas de Dibujo',
      shortcut: 'B',
      badge: hasDrawingElements ? `${hasDrawingElements}` : null,
      onClick: onToggleDrawingTools,
    },
  ];

  const actions = [
    {
      id: 'magic',
      icon: Sparkles,
      label: 'Auto-IA',
      shortcut: 'Shift+A',
      badge: 'AI',
      onClick: onAutoAssign,
    },
  ];

  const history = [
    {
      id: 'undo',
      icon: Undo2,
      label: 'Deshacer',
      shortcut: 'Ctrl+Z',
      onClick: onUndo,
      disabled: !canUndo,
    },
    {
      id: 'redo',
      icon: Redo2,
      label: 'Rehacer',
      shortcut: 'Ctrl+Y',
      onClick: onRedo,
      disabled: !canRedo,
    },
  ];

  const settings = [
    {
      id: 'minimap',
      icon: Map,
      label: showMinimap ? 'Ocultar Minimap' : 'Mostrar Minimap',
      shortcut: 'M',
      onClick: onToggleMinimap,
      isActive: showMinimap,
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Configuración',
      shortcut: ',',
      onClick: onOpenSettings,
    },
  ];

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-4 top-1/2 -translate-y-1/2 z-30
                 w-16 bg-[#1A1A1D]/95 backdrop-blur-xl
                 border border-white/10 rounded-2xl shadow-2xl
                 py-3 px-2
                 flex flex-col items-center gap-1"
    >
      {/* Herramientas principales */}
      {tools.map((tool) => (
        <ToolbarButton
          key={tool.id}
          {...tool}
          isActive={mode === tool.id || (tool.id === 'move' && mode === 'navigate')}
        />
      ))}

      <ToolbarDivider />

      {/* Acciones especiales */}
      {actions.map((action) => (
        <ToolbarButton key={action.id} {...action} />
      ))}

      <ToolbarDivider />

      {/* Historial */}
      {history.map((item) => (
        <ToolbarButton key={item.id} {...item} />
      ))}

      <ToolbarDivider />

      {/* Configuración */}
      {settings.map((item) => (
        <ToolbarButton key={item.id} {...item} />
      ))}

      {/* Indicador de posición */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full" />
    </motion.aside>
  );
}
