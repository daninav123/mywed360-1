import { PlusSquare, Ruler, Layers, DoorOpen, Hexagon, Minus, Square, Circle, Grid, Eye, EyeOff, Magnet, Rows, Palette, Users } from 'lucide-react';
import React from 'react';

const Section = ({ title, icon: Icon, children }) => (
  <div className="px-4 py-3 border-b">
    <div className="flex items-center gap-2 mb-2">
      {Icon && <Icon className="h-4 w-4 text-gray-600" />}
      <h4 className="text-sm font-medium text-gray-900">{title}</h4>
    </div>
    {children}
  </div>
);

export default function SeatingLibraryPanel({
  drawMode,
  onDrawModeChange,
  onOpenTemplates,
  showTables,
  onToggleShowTables,
  showRulers,
  onToggleRulers,
  snapToGrid,
  onToggleSnap,
  showSeatNumbers,
  onToggleSeatNumbers,
  gridStep = 20,
  onAddTable,
  onOpenGuestDrawer,
  pendingCount = 0,
}) {
  return (
    <div className="bg-white border rounded-lg h-full overflow-hidden">
      {/* Biblioteca */}
      <Section title="Biblioteca" icon={PlusSquare}>
        <div className="space-y-2">
          <div className="text-xs text-gray-500 mb-1">Perímetro y estructuras</div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onDrawModeChange?.('boundary')} className={`px-2 py-1 rounded text-xs ${drawMode==='boundary'?'bg-blue-600 text-white':'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
              <Square className="inline h-3 w-3 mr-1"/> Perímetro
            </button>
            <button onClick={() => onDrawModeChange?.('aisle')} className={`px-2 py-1 rounded text-xs ${drawMode==='aisle'?'bg-blue-600 text-white':'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
              <Minus className="inline h-3 w-3 mr-1"/> Pasillos
            </button>
          </div>

          <div className="text-xs text-gray-500 mt-3 mb-1">Puertas y obstáculos</div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onDrawModeChange?.('door')} className={`px-2 py-1 rounded text-xs ${drawMode==='door'?'bg-blue-600 text-white':'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
              <DoorOpen className="inline h-3 w-3 mr-1"/> Puerta
            </button>
            <button onClick={() => onDrawModeChange?.('obstacle')} className={`px-2 py-1 rounded text-xs ${drawMode==='obstacle'?'bg-blue-600 text-white':'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
              <Hexagon className="inline h-3 w-3 mr-1"/> Obstáculo
            </button>
          </div>

          <div className="text-xs text-gray-500 mt-3 mb-1">Mesas estándar</div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onAddTable?.({ shape: 'rectangle', width: 80, height: 60, seats: 8 })} className="px-2 py-1 rounded text-xs bg-gray-200 hover:bg-gray-300 text-gray-700">
              <Square className="inline h-3 w-3 mr-1"/> Rectangular
            </button>
            <button onClick={() => onAddTable?.({ shape: 'circle', diameter: 80, seats: 8 })} className="px-2 py-1 rounded text-xs bg-gray-200 hover:bg-gray-300 text-gray-700">
              <Circle className="inline h-3 w-3 mr-1"/> Circular
            </button>
          </div>
        </div>
      </Section>

      {/* Capas / Preferencias del lienzo */}
      <Section title="Capas y guías" icon={Layers}>
        <div className="space-y-2">
          <button onClick={onToggleShowTables} className="flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-gray-100">
            {showTables ? <EyeOff className="h-3 w-3"/> : <Eye className="h-3 w-3"/>}
            {showTables ? 'Ocultar mesas' : 'Mostrar mesas'}
          </button>
          <button onClick={onToggleRulers} className={`flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-gray-100 ${showRulers?'text-blue-700':''}`}>
            <Ruler className="h-3 w-3"/> Reglas
          </button>
          <button onClick={onToggleSnap} className={`flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-gray-100 ${snapToGrid?'text-blue-700':''}`}>
            <Magnet className="h-3 w-3"/> Snap a cuadrícula ({gridStep} cm)
          </button>
          <button onClick={onToggleSeatNumbers} className={`flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-gray-100 ${showSeatNumbers?'text-blue-700':''}`}>
            <Rows className="h-3 w-3"/> Números de asiento
          </button>
        </div>
      </Section>

      {/* Plantillas y recursos */}
      <Section title="Plantillas y recursos" icon={Palette}>
        <div className="flex items-center justify-between">
          <button onClick={onOpenTemplates} className="px-2 py-1 text-xs rounded border hover:bg-gray-50">Abrir plantillas</button>
          <button onClick={onOpenGuestDrawer} className="px-2 py-1 text-xs rounded border hover:bg-gray-50 flex items-center gap-1" title="Pendientes por asignar">
            <Users className="h-3 w-3"/>
            Pendientes {pendingCount > 0 ? `(${pendingCount})` : ''}
          </button>
        </div>
      </Section>
    </div>
  );
}
