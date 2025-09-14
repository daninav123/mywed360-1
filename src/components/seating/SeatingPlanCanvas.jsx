/**
 * Componente Canvas especializado para el plan de asientos
 * Maneja la visualización y interacción con mesas y sillas
 */

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import SeatingCanvas from '../../features/seating/SeatingCanvas';

const SeatingPlanCanvas = ({
  tab,
  areas,
  tables,
  seats,
  hallSize,
  selectedTable,
  onSelectTable,
  onTableDimensionChange,
  onAssignGuest,
  onToggleEnabled,
  onAddArea,
  onAddTable,
  moveTable,
  onToggleSeat,
  guests = [],
  onDeleteArea,
  onUpdateArea,
  drawMode = 'pan',
  onDrawModeChange,
  canvasRef,
  className = ""
}) => {
  // DnDProvider se gestiona en el componente padre (SeatingPlanRefactored)

  // Estado local de zoom/offset
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [minScale, setMinScale] = useState(0.3);

  // Fit to content: calcula bounding box en coordenadas "mundo" y ajusta escala/offset
  const fitToContent = useCallback(() => {
    try {
      const el = canvasRef?.current;
      if (!el) { setScale(1); setOffset({ x: 0, y: 0 }); return; }
      const rect = el.getBoundingClientRect();
      const viewW = rect.width || 800;
      const viewH = rect.height || 600;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      const extend = (x, y) => {
        if (x < minX) minX = x; if (y < minY) minY = y;
        if (x > maxX) maxX = x; if (y > maxY) maxY = y;
      };

      // Areas (acepta array de puntos o {points})
      (areas || []).forEach((a) => {
        const pts = Array.isArray(a) ? a : (Array.isArray(a?.points) ? a.points : []);
        pts.forEach(p => extend(p.x, p.y));
      });

      // Mesas (centro + half sizes)
      (tables || []).forEach((t) => {
        const shape = t.shape || 'rectangle';
        const sizeX = shape === 'circle' ? (t.diameter || 60) : (t.width || 80);
        const sizeY = shape === 'circle' ? (t.diameter || 60) : (t.height || t.length || 60);
        const halfX = (sizeX) / 2;
        const halfY = (sizeY) / 2;
        const cx = t.x || 0, cy = t.y || 0;
        extend(cx - halfX, cy - halfY);
        extend(cx + halfX, cy + halfY);
      });

      // Sillas
      (seats || []).forEach((s) => { extend(s.x || 0, s.y || 0); });

      // Hall (ayuda a no dejar bounds vacíos en banquete)
      if (hallSize && typeof hallSize.width === 'number' && typeof hallSize.height === 'number') {
        extend(0, 0);
        extend(hallSize.width, hallSize.height);
      }

      if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
        setScale(1); setOffset({ x: 0, y: 0 });
        return;
      }

      const pad = 80; // px de margen visual objetivo
      const contentW = Math.max(10, maxX - minX);
      const contentH = Math.max(10, maxY - minY);
      const scaleX = (viewW - pad) / contentW;
      const scaleY = (viewH - pad) / contentH;
      const newScale = Math.max(0.05, Math.min(3, Math.min(scaleX, scaleY)));

      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const newOffset = {
        x: (viewW / 2) - (newScale * cx),
        y: (viewH / 2) - (newScale * cy),
      };
      setScale(newScale);
      setMinScale(newScale);
      setOffset(newOffset);
    } catch (e) {
      // fallback
      setScale(1); setOffset({ x: 0, y: 0 });
    }
  }, [areas, tables, seats, hallSize, canvasRef]);

  // Recalcular minScale (fit) cuando cambie el contenido, sin alterar el zoom actual
  useEffect(() => {
    try {
      const el = canvasRef?.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewW = rect.width || 800;
      const viewH = rect.height || 600;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      const extend = (x, y) => { if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y; };
      (areas || []).forEach((a) => { const pts = Array.isArray(a) ? a : (Array.isArray(a?.points) ? a.points : []); pts.forEach(p => extend(p.x, p.y)); });
      (tables || []).forEach((t) => { const shape = t.shape || 'rectangle'; const sx = shape === 'circle' ? (t.diameter || 60) : (t.width || 80); const sy = shape === 'circle' ? (t.diameter || 60) : (t.height || t.length || 60); const hx = sx/2, hy = sy/2; const cx = t.x || 0, cy = t.y || 0; extend(cx - hx, cy - hy); extend(cx + hx, cy + hy); });
      (seats || []).forEach((s) => { extend(s.x || 0, s.y || 0); });
      if (hallSize && typeof hallSize.width === 'number' && typeof hallSize.height === 'number') { extend(0, 0); extend(hallSize.width, hallSize.height); }
      if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) return;
      const pad = 80;
      const contentW = Math.max(10, maxX - minX);
      const contentH = Math.max(10, maxY - minY);
      const scaleX = (viewW - pad) / contentW;
      const scaleY = (viewH - pad) / contentH;
      const fit = Math.max(0.05, Math.min(3, Math.min(scaleX, scaleY)));
      setMinScale(fit);
    } catch (e) { /* ignore */ }
  }, [areas, tables, seats, hallSize, canvasRef]);

  // Handlers de eventos del canvas
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setScale((prevScale) => {
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      let nextScale = prevScale * zoomFactor;
      nextScale = Math.max(minScale, Math.min(3, nextScale));
      const scaleRatio = nextScale / prevScale;

      setOffset((prevOffset) => ({
        x: mouseX - (mouseX - prevOffset.x) * scaleRatio,
        y: mouseY - (mouseY - prevOffset.y) * scaleRatio,
      }));

      return nextScale;
    });
  }, [minScale, canvasRef]);
  
  const handlePointerDown = useCallback((e) => {
    if (drawMode !== 'pan') return;
    const start = { x: e.clientX, y: e.clientY };
    const startOffset = { ...offset };
    let rafId = null;
    let nextDX = 0, nextDY = 0;

    const schedule = () => {
      if (rafId != null) return;
      rafId = window.requestAnimationFrame(() => {
        setOffset({ x: startOffset.x + nextDX, y: startOffset.y + nextDY });
        rafId = null;
      });
    };

    const move = (ev) => {
      nextDX = ev.clientX - start.x;
      nextDY = ev.clientY - start.y;
      schedule();
    };
    const up = () => {
      if (rafId != null) { window.cancelAnimationFrame(rafId); rafId = null; }
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [drawMode, offset]);
  
  const handlePointerMove = useCallback((e) => {
    // Lógica de movimiento
  }, []);
  
  const handlePointerUp = useCallback(() => {
    // Lógica de fin de interacción
  }, []);
  
  // Configurar eventos del canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handleWheel, handlePointerDown, handlePointerMove, handlePointerUp]);
  
  return (
    <div className={`relative bg-gray-50 border rounded-lg overflow-hidden ${className}`}>
      {/* Canvas principal */}
      <div
        ref={canvasRef}
        className="w-full h-full min-h-[600px] relative cursor-crosshair"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          backgroundColor:'#f3f4f6',
        }}
      >
        {/* Componente SeatingCanvas existente */}
        <SeatingCanvas
          tab={tab}
          areas={areas}
          tables={tables}
          seats={seats}
          hallSize={hallSize}
          selectedTable={selectedTable}
          onSelectTable={onSelectTable}
          onAssignGuest={onAssignGuest}
          onToggleEnabled={onToggleEnabled}
          addArea={onAddArea}
          onAddTable={onAddTable}
          drawMode={drawMode}
          canPan={drawMode === 'pan'}
          canMoveTables={drawMode === 'move'}
          moveTable={moveTable}
          onToggleSeat={onToggleSeat}
          guests={guests}
          scale={scale}
          offset={offset}
          onDeleteArea={onDeleteArea}
          onUpdateArea={onUpdateArea}
        />
        
        {/* Indicadores de dimensiones del salón y pasillo mínimo */}
        <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-xs text-gray-600">
          <div>{(hallSize.width/100).toFixed(1)} × {(hallSize.height/100).toFixed(1)} m</div>
          <div>Pasillo: {(hallSize.aisleMin ?? 80)} cm</div>
        </div>
        
        {/* Controles de zoom */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.1))}
            className="w-8 h-8 bg-white shadow-md rounded flex items-center justify-center hover:bg-gray-50"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => setScale((s) => Math.max(minScale, s - 0.1))}
            className="w-8 h-8 bg-white shadow-md rounded flex items-center justify-center hover:bg-gray-50"
            title="Zoom out"
          >
            −
          </button>
          <button
            onClick={fitToContent}
            className="w-8 h-8 bg-white shadow-md rounded flex items-center justify-center hover:bg-gray-50"
            title="Ajustar a pantalla"
          >
            ⌂
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SeatingPlanCanvas);
