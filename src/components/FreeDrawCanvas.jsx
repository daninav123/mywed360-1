import React, { useRef, useState, useEffect } from 'react';
import useTranslations from '../hooks/useTranslations';

// Distancia (px) para detectar clic cerca del primer punto y cerrar el perímetro
const SNAP_PX = 20;


/**
 * FreeDrawCanvas
 * Simple freehand drawing canvas that captures pointer strokes, smooths them with Chaikin algorithm,
 * and renders the smoothed path as SVG.
 * Props:
 *   onFinalize(points) => called when user double-clicks / presses Finish to commit current stroke
 */
function FreeDrawCanvasComp({ className = '', style = {}, strokeColor = '#3b82f6', scale = 1, offset = { x: 0, y: 0 }, areas = [], drawMode = 'free', semanticDrawMode, onFinalize, onDeleteArea = () => {}, onUpdateArea = () => {} }) {
  const svgRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [nearStart, setNearStart] = useState(false);
  // Estado para mostrar la regla mientras se dibuja
  const [cursorPos, setCursorPos] = useState(null); // posición del cursor dentro del SVG
  const [segLength, setSegLength] = useState(null); // longitud del segmento actual en cm
  const [segAngleDeg, setSegAngleDeg] = useState(null); // ángulo con tramo previo
  const lastDirRef = useRef(null);
  const startRef = useRef(null);
  const rafRef = useRef(null);
  const pendingEventRef = useRef(null);
  const { t } = useTranslations ? useTranslations() : { t: (k, d) => (d && d.defaultValue) || k };

  // Detectar cambio de herramienta para guardar perímetro automáticamente
  const prevDrawModeRef = useRef(drawMode);
  // Listener global de Tab para fijar longitud exacta
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab' && drawing && drawMode === 'boundary') {
        e.preventDefault();
        if (segLength == null) return;
        const val = window.prompt('Longitud exacta (m):', (segLength/100).toFixed(2));
        if (!val) return;
        const lenCm = parseFloat(val)*100;
        if(!lenCm || lenCm<=0) return;
        // Dirección actual
        const dir = lastDirRef.current;
        if(!dir) return;
        const last = points[points.length-1];
        const newPt = { x: last.x + dir.x*lenCm, y: last.y + dir.y*lenCm };
        setPoints(prev => [...prev, newPt]);
        setSegLength(lenCm);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawing, drawMode, segLength, points]);

  // Atajos de teclado: Enter (finalizar), Escape (cancelar), Ctrl+Z/Backspace/Delete (deshacer)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        if (drawMode === 'boundary' && points.length >= 3) {
          e.preventDefault();
          onFinalize && onFinalize({ type: 'boundary', points: [...points, points[0]] });
          setPoints([]);
          setDrawing(false);
          setNearStart(false);
          setCursorPos(null);
          setSegLength(null);
          return;
        }
        if ((drawMode === 'free' || drawMode === 'curve') && points.length > 2) {
          e.preventDefault();
          const smoothed = smooth(points);
          onFinalize && onFinalize({ type: semanticDrawMode || drawMode, points: smoothed });
          setPoints([]);
          setDrawing(false);
          setCursorPos(null);
          setSegLength(null);
          return;
        }
        if (drawMode === 'line' && points.length >= 2) {
          e.preventDefault();
          onFinalize && onFinalize({ type: semanticDrawMode || drawMode, points: [points[0], points[points.length-1]] });
          setPoints([]);
          setDrawing(false);
          setCursorPos(null);
          setSegLength(null);
          return;
        }
        if (drawMode === 'rect' && points.length >= 4) {
          e.preventDefault();
          onFinalize && onFinalize({ type: semanticDrawMode || drawMode, points });
          setPoints([]);
          startRef.current = null;
          setDrawing(false);
          setCursorPos(null);
          setSegLength(null);
          return;
        }
      }

      if (e.key === 'Escape' && drawing) {
        e.preventDefault();
        setPoints([]);
        setDrawing(false);
        setNearStart(false);
        setCursorPos(null);
        setSegLength(null);
        return;
      }

      const isUndoKey = (e.ctrlKey || e.metaKey) && (e.key.toLowerCase?.() === 'z');
      if ((isUndoKey || e.key === 'Backspace' || e.key === 'Delete') && points.length > 0) {
        if (drawMode === 'boundary' || drawMode === 'free' || drawMode === 'curve' || drawMode === 'line' || drawMode === 'rect') {
          e.preventDefault();
          setPoints(prev => prev.slice(0, -1));
          return;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawing, drawMode, points, onFinalize, semanticDrawMode]);

  useEffect(() => {
    const prev = prevDrawModeRef.current;
    // Si salimos del modo 'boundary', guardar el perímetro en curso
    if (prev === 'boundary' && drawMode !== 'boundary') {
      if (points.length >= 3) {
        const closed = [...points, points[0]]; // cerrar polígono
        onFinalize && onFinalize({ type: semanticDrawMode || drawMode, points: closed });
      }
      // Limpiar estado temporal
      setPoints([]);
      setDrawing(false);
      setNearStart(false);
    }
    prevDrawModeRef.current = drawMode;
  }, [drawMode]);

  const toSvgPointRaw = (e) => {
    const svg = svgRef.current;
    // Fallback defensivo para tests/SSR o durante unmount
    if (!svg || typeof svg.getBoundingClientRect !== 'function') {
      const cx = typeof e?.clientX === 'number' ? e.clientX : 0;
      const cy = typeof e?.clientY === 'number' ? e.clientY : 0;
      const sc = typeof scale === 'number' && scale > 0 ? scale : 1;
      const ox = offset && typeof offset.x === 'number' ? offset.x : 0;
      const oy = offset && typeof offset.y === 'number' ? offset.y : 0;
      return { x: (cx - ox) / sc, y: (cy - oy) / sc };
    }
    const rect = svg.getBoundingClientRect();
    const cx = typeof e?.clientX === 'number' ? e.clientX : rect.left;
    const cy = typeof e?.clientY === 'number' ? e.clientY : rect.top;
    return {
      x: (cx - rect.left - offset.x) / scale,
      y: (cy - rect.top - offset.y) / scale,
    };
  };

  // Devuelve punto con snapping a ejes H/V si Shift está pulsado
  const toSvgPoint = (e, prev) => {
    const raw = toSvgPointRaw(e);
    if (!e.shiftKey || !prev) return raw;
    const dx = raw.x - prev.x;
    const dy = raw.y - prev.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal
      return { x: raw.x, y: prev.y };
    } else {
      // Vertical
      return { x: prev.x, y: raw.y };
    }
  };

  // Chaikin smoothing – one iteration
  const smooth = (pts) => {
    if (pts.length < 2) return pts;
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      out.push({ x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y });
      out.push({ x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y });
    }
    return out;
  };

  const getPathD = (pts) => {
    if (!pts.length) return '';
    const d = [`M ${pts[0].x} ${pts[0].y}`];
    for (let i = 1; i < pts.length; i++) d.push(`L ${pts[i].x} ${pts[i].y}`);
    return d.join(' ');
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    const pt = toSvgPoint(e, points[points.length-1]);
    
    if (drawMode === 'line') {
      setDrawing(true);
      setPoints([pt]);
      return;
    }
    if (drawMode === 'boundary') {
      // Autocierre: si clic cerca del primer vértice y al menos 3 puntos
    if (points.length >= 3) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const first = points[0];
      const firstPx = {
        x: first.x * scale + offset.x + svgRect.left,
        y: first.y * scale + offset.y + svgRect.top,
      };
      const dist = Math.hypot(e.clientX - firstPx.x, e.clientY - firstPx.y);
      if (dist < SNAP_PX) {
        onFinalize && onFinalize({ type: 'boundary', points: [...points, points[0]] });
        setPoints([]);
        setDrawing(false);
        setNearStart(false);
        return;
      }
    }
    // Modo perímetro: siempre agregar punto, mantener drawing activo
      if (points.length === 0) {
        setDrawing(true);
        setPoints([pt]);
      } else {
        // Agregar punto al perímetro existente
        setPoints(prev => [...prev, pt]);
      }
      return;
    }
    if (drawMode === 'rect') {
      setDrawing(true);
      startRef.current = pt;
      setPoints([pt]);
      return;
    }
    if (drawMode === 'free' || drawMode === 'curve') {
      setDrawing(true);
      setPoints([pt]);
    }
  };

  const processPointerMove = (e) => {
    const lastRef = points.length ? points[points.length-1] : null;
    // Actualizar posición del cursor relativa al SVG
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    // Punto actual en coordenadas de dibujo (cm)
    const curPt = toSvgPoint(e, lastRef);
    // Punto previo para calcular distancia
    const prevPt = points.length ? points[points.length - 1] : curPt;
    const dx = curPt.x - prevPt.x;
    const dy = curPt.y - prevPt.y;
    const l = Math.sqrt(dx*dx+dy*dy);
    setSegLength(l);
    //Actualizar ángulo
    if(points.length>1){
      const prevVec = { x: points[points.length-1].x - points[points.length-2].x, y: points[points.length-1].y - points[points.length-2].y };
      const curVec = { x: curPt.x - points[points.length-1].x, y: curPt.y - points[points.length-1].y };
      const ang = Math.acos((prevVec.x*curVec.x+prevVec.y*curVec.y)/(Math.hypot(prevVec.x,prevVec.y)*Math.hypot(curVec.x,curVec.y)));
      if(!Number.isNaN(ang)) setSegAngleDeg((ang*180/Math.PI));
    } else {
      setSegAngleDeg(null);
    }
    // Direccion unitaria ultima
    if(l>0){ lastDirRef.current = { x: dx/l, y: dy/l}; }

    // Actualizar indicador de cercanía al primer punto (para realce visual)
    if (drawMode === 'boundary') {
      if (points.length > 0) {
        const distPx = Math.hypot(curPt.x - points[0].x, curPt.y - points[0].y) * scale;
        setNearStart(distPx < SNAP_PX);
      } else {
        setNearStart(false);
      }
    } else {
      setNearStart(false);
    }

    if (!drawing) return;
    
    if (drawMode === 'line') {
      const pt = toSvgPoint(e, points[points.length-1]);
      setPoints(prev => (prev.length === 1 ? [prev[0], pt] : [prev[0], pt]));
      return;
    }
    if (drawMode === 'boundary') {
      // En modo perímetro, mostrar línea de preview al cursor
      if (points.length > 0) {
        const pt = toSvgPoint(e, points[points.length-1]);
        // No modificar los puntos existentes, solo mostrar preview
        // El preview se maneja en el render
      }
      return;
    }
    if (drawMode === 'rect') {
      const cur = toSvgPoint(e, startRef.current);
      const start = startRef.current;
      if (!start) return;
      const rectPts = [
        start,
        { x: cur.x, y: start.y },
        cur,
        { x: start.x, y: cur.y },
        start,
      ];
      setPoints(rectPts);
      return;
    }
    if (drawMode === 'free' || drawMode === 'curve') {
      const pt = toSvgPoint(e, points[points.length-1]);
      // Límite de puntos para evitar degradación de performance
      setPoints(prev => (prev.length > 4000 ? [...prev.slice(-4000), pt] : [...prev, pt]));
    }
  };

  const handlePointerMove = (e) => {
    // Throttle via requestAnimationFrame
    pendingEventRef.current = e;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const ev = pendingEventRef.current;
      pendingEventRef.current = null;
      if (ev) processPointerMove(ev);
    });
  };

  const handlePointerUp = (e) => {
    if (!drawing) return;
    if (drawMode === 'line') {
      const pt = toSvgPoint(e, points[points.length-1]);
      const line = points.length === 2 ? points : [points[0], pt];
      onFinalize && onFinalize({ type: semanticDrawMode || drawMode, points: line });
      setPoints([]);
      setDrawing(false);
      // Reiniciar regla
      setCursorPos(null);
      setSegLength(null);
      return;
    }
    if (drawMode === 'rect') {
      if (points.length >= 4) {
        onFinalize && onFinalize({ type: semanticDrawMode || drawMode, points });
      }
      setPoints([]);
      startRef.current = null;
      setDrawing(false);
    // Reiniciar regla
    setCursorPos(null);
    setSegLength(null);
      return;
    }
    // Para freehand / curva simplemente detenemos la captura; la finalización será mediante doble clic
    setDrawing(false);
    // Reiniciar regla
    setCursorPos(null);
    setSegLength(null);
  };

  const handlePointerCancel = () => {
    setDrawing(false);
    setCursorPos(null);
    setSegLength(null);
  };

  const handleDoubleClick = () => {
    if (drawMode === 'boundary') {
      // Cerrar visualmente el polígono pero NO guardar; se guardará al cambiar de herramienta
      if (points.length >= 3) {
        const closedPolygon = [...points, points[0]];
        setPoints(closedPolygon);
        setDrawing(false);
      }
      return;
    }
    if (drawMode === 'free' || drawMode === 'curve') {
      if (points.length > 2) {
        const smoothed = smooth(points);
        onFinalize && onFinalize({ type: semanticDrawMode || drawMode, points: smoothed });
        setPoints([]);
      }
    }
  };

  const handleFinalizeClick = () => {
    if (drawMode === 'boundary' && points.length >= 3) {
      onFinalize && onFinalize({ type: 'boundary', points: [...points, points[0]] });
      setPoints([]);
      setDrawing(false);
      setNearStart(false);
      setCursorPos(null);
      setSegLength(null);
      return;
    }
    if ((drawMode === 'free' || drawMode === 'curve') && points.length > 2) {
      const smoothed = smooth(points);
      onFinalize && onFinalize({ type: semanticDrawMode || drawMode, points: smoothed });
      setPoints([]);
      setDrawing(false);
      setCursorPos(null);
      setSegLength(null);
      return;
    }
    if (drawMode === 'line' && points.length >= 2) {
      onFinalize && onFinalize({ type: semanticDrawMode || drawMode, points: [points[0], points[points.length-1]] });
      setPoints([]);
      setDrawing(false);
      setCursorPos(null);
      setSegLength(null);
      return;
    }
    if (drawMode === 'rect' && points.length >= 4) {
      onFinalize && onFinalize({ type: semanticDrawMode || drawMode, points });
      setPoints([]);
      startRef.current = null;
      setDrawing(false);
      setCursorPos(null);
      setSegLength(null);
      return;
    }
  };

  const handleCancelClick = () => {
    setPoints([]);
    setDrawing(false);
    setNearStart(false);
    setCursorPos(null);
    setSegLength(null);
  };

  return (
    <div className={`relative w-full h-full ${className}`} style={style}>
      <svg
      ref={svgRef}
      className={`w-full h-full ${className}`}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Áreas existentes */}
      <g transform={`translate(${offset.x} ${offset.y}) scale(${scale})`}>
        {areas.map((poly, idx) => {
          const pts = Array.isArray(poly) ? poly : (Array.isArray(poly?.points) ? poly.points : []);
          const type = Array.isArray(poly) ? undefined : poly?.type;
          return (
            <path
              key={idx}
              d={getPathD(pts)}
              stroke="#10b981"
              strokeWidth={2}
              fill="none"
              data-area-type={type || 'poly'}
              onPointerDown={drawMode === 'erase' ? (e) => { e.stopPropagation(); onDeleteArea(idx); } : undefined}
              style={{ cursor: drawMode === 'erase' ? 'pointer' : 'default' }}
            />
          );
        })}
        {/* Trazo actual */}
        {points.length > 0 && (
          <path d={getPathD(points)} stroke={strokeColor} strokeWidth={2} fill="none" />
        )}
        
        {/* Puntos del perímetro */}
        {drawMode === 'boundary' && points.map((point, idx) => (
          <circle
            key={idx}
            cx={point.x}
            cy={point.y}
            r={idx === 0 && nearStart ? 6 : 3}
            fill={strokeColor}
            opacity={0.8}
          />
        ))}
        
        {/* Línea de preview para perímetro */}
        {drawMode === 'boundary' && points.length > 0 && cursorPos && (
          <line
            x1={points[points.length - 1].x}
            y1={points[points.length - 1].y}
            x2={(cursorPos.x - offset.x) / scale}
            y2={(cursorPos.y - offset.y) / scale}
            stroke={strokeColor}
            strokeWidth={1}
            strokeDasharray="5,5"
            opacity={0.7}
          />
        )}
      </g>
    </svg>

    {/* Etiquetas persistentes de áreas existentes */}
    {areas.map((poly, aIdx) => {
      const basePts = Array.isArray(poly) ? poly : (Array.isArray(poly?.points) ? poly.points : []);
      const segs = [];
      for (let i = 0; i < basePts.length - 1; i++) {
        const p1 = basePts[i];
        const p2 = basePts[i + 1];
        const length = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const midX = ((p1.x + p2.x) / 2) * scale + offset.x;
        const midY = ((p1.y + p2.y) / 2) * scale + offset.y;
        segs.push({ p1, p2, length, midX, midY, idx: i });
      }
      return segs.map((seg) => (
        <div
          key={`s-${aIdx}-${seg.idx}`}
          className="absolute pointer-events-auto text-[10px] bg-white bg-opacity-90 rounded px-1 cursor-pointer select-none"
          style={{ left: seg.midX, top: seg.midY, transform: 'translate(-50%, -50%)' }}
          title="Doble clic para ajustar longitud"
          onDoubleClick={() => {
            const currentM = (seg.length / 100).toFixed(2);
            const val = window.prompt('Nueva longitud (m):', currentM);
            if (!val) return;
            const newLenCm = parseFloat(val) * 100;
            if (!newLenCm || newLenCm <= 0) return;
            const factor = newLenCm / seg.length;
            const dx = seg.p2.x - seg.p1.x;
            const dy = seg.p2.y - seg.p1.y;
            const newP2 = { x: seg.p1.x + dx * factor, y: seg.p1.y + dy * factor };
            const updated = [...basePts];
            updated[seg.idx + 1] = newP2;
            if (Array.isArray(poly)) {
              onUpdateArea(aIdx, updated);
            } else {
              onUpdateArea(aIdx, { ...poly, points: updated });
            }
          }}
        >
          {(seg.length / 100).toFixed(2)} m
        </div>
      ));
    })}

    {/* Etiqueta temporal de distancia (m) */}
    {cursorPos && segLength != null && (drawMode === 'boundary' || drawing) && (

      <div
        className="absolute pointer-events-none text-[10px] bg-white bg-opacity-80 rounded px-1"
        aria-live="polite"
        style={{ left: cursorPos.x + 10, top: cursorPos.y + 10 }}
      >
        {(segLength / 100).toFixed(2)} m{segAngleDeg!=null && <span className="ml-1">{segAngleDeg.toFixed(0)}°</span>}
      </div>
    )}

    {/* Controles de finalizar/cancelar accesibles */}
    {(drawing || points.length > 0) && (
      <div className="absolute bottom-3 right-3 flex gap-2">
        <button
          type="button"
          onClick={handleCancelClick}
          className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-50"
          aria-label={t('freedraw.cancel', { defaultValue: 'Cancelar dibujo' })}
        >
          {t('freedraw.cancelShort', { defaultValue: 'Cancelar' })}
        </button>
        <button
          type="button"
          onClick={handleFinalizeClick}
          className="px-2 py-1 text-xs rounded border bg-blue-600 text-white hover:bg-blue-700"
          aria-label={t('freedraw.finish', { defaultValue: 'Finalizar y guardar dibujo' })}
          disabled={
            !(
              (drawMode === 'boundary' && points.length >= 3) ||
              ((drawMode === 'free' || drawMode === 'curve') && points.length > 2) ||
              (drawMode === 'line' && points.length >= 2) ||
              (drawMode === 'rect' && points.length >= 4)
            )
          }
        >
          {t('freedraw.finishShort', { defaultValue: 'Finalizar' })}
        </button>
      </div>
    )}
    </div>
  );

}

export default React.memo(FreeDrawCanvasComp);
