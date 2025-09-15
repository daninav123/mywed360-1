import React, { forwardRef, memo, useRef } from 'react';



import FreeDrawCanvas from '../../components/FreeDrawCanvas';
import TableItem from '../../components/TableItem';
import ChairItem from '../../components/ChairItem';

/**
 * SeatingCanvas
 * Envoltorio del lienzo con soporte de zoom/pan y renderizado de mesas/áreas.
 * Extraído desde SeatingPlan.jsx para mejorar la legibilidad.
 */
  const SeatingCanvas = forwardRef(function SeatingCanvas(
  {
    tab,
    areas,
    tables,
    seats = [],
    scale = 1,
    offset = { x: 0, y: 0 },
    selectedTable,
    addArea,
    onDeleteArea,
    moveTable,
    onAssignGuest,
    onAssignGuestSeat,
    onToggleEnabled,
    setConfigTable,
    online,
    handleWheel,
    handlePointerDown,
    guests = [],
    onSelectTable,
    drawMode = 'free',
    canPan = true,
    canMoveTables = true,
    onToggleSeat = () => {},
    onDoubleClick = () => {}, 
    onUpdateArea = () => {}, 
    hallSize = null,
    gridStep = 20,
    selectedIds = [],
    showSeatNumbers = false,
    background = null,
    validationsEnabled = true,
    globalMaxSeats = 0,
  },
  _forwardedRef,
) {
  const containerRef = useRef(null);
  // Mapear drawMode externo a valores aceptados por FreeDrawCanvas
  const internalDrawMode =
    drawMode === 'boundary' ? 'boundary'  // Usar el nuevo modo boundary
  : drawMode === 'obstacle' ? 'rect'
  : drawMode === 'door' ? 'rect'
  : drawMode === 'aisle' ? 'line'
  : drawMode;

  return (

      <div
        className="flex-grow border border-gray-300 h-[800px] relative overflow-hidden" // adjusted height
        onDoubleClick={onDoubleClick} // added event handler
        onWheel={canPan ? handleWheel : undefined}
        onPointerDown={canPan ? handlePointerDown : undefined}
        role="main"
        aria-label="Lienzo de plano"
        ref={containerRef}
        style={{
          backgroundImage: 'linear-gradient(to right, #eaeaea 1px, transparent 1px), linear-gradient(to bottom, #eaeaea 1px, transparent 1px)',
          backgroundSize: `${Math.max(5, gridStep) * scale}px ${Math.max(5, gridStep) * scale}px`,
        }}
      >
        {/* Fondo calibrado (opcional) */}
        {background?.dataUrl && (
          <img
            src={background.dataUrl}
            alt="Plano de fondo"
            style={{
              position:'absolute',
              left: offset.x,
              top: offset.y,
              width: (background.widthCm || (hallSize?.width||1800)) * scale,
              height: 'auto',
              opacity: background.opacity == null ? 0.5 : background.opacity,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}
        {/* Área del salón (solo banquete) */}
        {tab==='banquet' && hallSize && (
          <div
            style={{
              position:'absolute',
              left: 0,
              top: 0,
              width: hallSize.width,
              height: hallSize.height,
              border: '3px dashed #4b5563',
              background: '#ffffff',
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: 'top left',
                                          pointerEvents: 'none',
                            zIndex: 0,
            }}
          />
        )}

        {/* Canvas libre */}
        <FreeDrawCanvas
          areas={areas}
          scale={scale}
          offset={offset}
          onFinalize={addArea}
          onDeleteArea={onDeleteArea}
          onUpdateArea={onUpdateArea}
          drawMode={internalDrawMode}
          semanticDrawMode={drawMode}
        />

{/* Sillas (solo ceremonia) */}
        {tab==='ceremony' && seats.map((seat, idx) => (
          <ChairItem key={`${seat.id}-${idx}`} seat={seat} scale={scale} offset={offset} onToggleEnabled={onToggleSeat} />
        ))}

        {/* Mesas (solo banquete) */}
        {tab==='banquet' && tables.map((t, idx) => (
          // Validaciones básicas: proximidad y obstáculos
          // Se calculan más abajo y se pasan como props
          <TableItem
            key={`${t.id}-${idx}`}
            table={t}
            scale={scale}
            offset={offset}
            containerRef={containerRef}
            onMove={moveTable}
            onAssignGuest={onAssignGuest}
            onAssignGuestSeat={(tableId, seatIndex, guestId) => onAssignGuestSeat ? onAssignGuestSeat(tableId, seatIndex, guestId) : (onAssignGuest && onAssignGuest(tableId, guestId))}
            onToggleEnabled={onToggleEnabled}
            onOpenConfig={setConfigTable}
            onSelect={onSelectTable}
            guests={guests}
            canMove={canMoveTables}
            selected={(selectedTable && selectedTable.id === t.id) || (selectedIds && selectedIds.some(id => String(id) === String(t.id)))}
            showNumbers={showSeatNumbers}
            danger={!validationsEnabled ? false : (() => {
              try {
                const countFromGuests = (guests||[]).reduce((sum,g)=>{
                  const matches = (()=>{
                    if (g.tableId !== undefined && g.tableId !== null) return String(g.tableId)===String(t.id);
                    if (g.table !== undefined && g.table !== null && String(g.table).trim()!=='') return String(g.table).trim()===String(t.id) || (t.name && String(g.table).trim()===String(t.name));
                    return false;
                  })();
                  if(!matches) return sum;
                  const comp = parseInt(g.companion,10)||0; return sum+1+comp;
                },0);
                const cap = (parseInt(t.seats,10) || globalMaxSeats || 0);
                return cap>0 && countFromGuests>cap;
              } catch(_) { return false; }
            })()}
            dangerReason={!validationsEnabled ? '' : 'Overbooking'}
            globalMaxSeats={globalMaxSeats}
          />
        ))}

        {/* Guías inteligentes (líneas) */}
        {tab==='banquet' && selectedTable && (() => {
          const lines = [];
          const sx = selectedTable.shape === 'circle' ? (selectedTable.diameter||60)/2 : (selectedTable.width||80)/2;
          const sy = selectedTable.shape === 'circle' ? (selectedTable.diameter||60)/2 : (selectedTable.height||selectedTable.length||60)/2;
          const cx = (selectedTable.x||0) * scale + offset.x;
          const cy = (selectedTable.y||0) * scale + offset.y;
          const selLeft = ((selectedTable.x||0) - sx) * scale + offset.x;
          const selRight = ((selectedTable.x||0) + sx) * scale + offset.x;
          const selTop = ((selectedTable.y||0) - sy) * scale + offset.y;
          const selBottom = ((selectedTable.y||0) + sy) * scale + offset.y;
          const tolPx = 8;
          const addV = (x) => lines.push(<div key={`gv-${x}`} className="absolute top-0 bottom-0 border-l-2 border-blue-400 pointer-events-none" style={{ left: x, opacity:0.4 }} />);
          const addH = (y) => lines.push(<div key={`gh-${y}`} className="absolute left-0 right-0 border-t-2 border-blue-400 pointer-events-none" style={{ top: y, opacity:0.4 }} />);
          (tables||[]).forEach(t => {
            if (!t || String(t.id)===String(selectedTable.id)) return;
            const tx = (t.x||0)*scale + offset.x;
            const ty = (t.y||0)*scale + offset.y;
            const thx = (t.shape==='circle' ? (t.diameter||60)/2 : (t.width||80)/2) * scale;
            const thy = (t.shape==='circle' ? (t.diameter||60)/2 : (t.height||t.length||60)/2) * scale;
            const left = tx - thx;
            const right = tx + thx;
            const top = ty - thy;
            const bottom = ty + thy;
            if (Math.abs(cx - tx) <= tolPx) addV(tx);
            if (Math.abs(cy - ty) <= tolPx) addH(ty);
            if (Math.abs(selLeft - left) <= tolPx) addV(left);
            if (Math.abs(selLeft - right) <= tolPx) addV(right);
            if (Math.abs(selRight - left) <= tolPx) addV(left);
            if (Math.abs(selRight - right) <= tolPx) addV(right);
            if (Math.abs(selTop - top) <= tolPx) addH(top);
            if (Math.abs(selTop - bottom) <= tolPx) addH(bottom);
            if (Math.abs(selBottom - top) <= tolPx) addH(top);
            if (Math.abs(selBottom - bottom) <= tolPx) addH(bottom);
          });
          return lines;
        })()}




      </div>

  );
});

export default memo(SeatingCanvas);
