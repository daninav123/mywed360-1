import React, { useEffect, useRef, useState } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';

// Componente para el diagrama Gantt
export const GanttChart = ({
  tasks = [],
  onTaskClick,
  viewMode = ViewMode.Month,
  listCellWidth = 0,
  columnWidth = 65,
  rowHeight = 44,
  ganttHeight,
  preStepsCount = 0,
  viewDate,
  markerDate, // fecha para marcar con una ldnea roja (p.ej., boda)
  gridStartDate,
  gridEndDate,   // tope visual estricto del grid (fin)
}) => {
  // Debug opt-in: activa con localStorage.setItem('lovenda_gantt_debug','1') o window.__GANTT_DEBUG__=true
  const debugEnabled = (() => {
    try {
      if (typeof window !== 'undefined' && window.__GANTT_DEBUG__) return true;
      const v = (typeof localStorage !== 'undefined') ? localStorage.getItem('lovenda_gantt_debug') : null;
      return v === '1' || /^true$/i.test(String(v || ''));
    } catch { return false; }
  })();
  const dbg = (...args) => { if (debugEnabled) console.log('[GanttDebug]', ...args); };
  try { dbg('GanttDebug init', { debugEnabled, viewMode, columnWidth, markerDate }); } catch {}
  // ErrorBoundary local para evitar que la pÃƒÆ’Ã‚Â¡gina caiga si la librerÃƒÆ’Ã‚Â­a falla
  class LocalErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(err) { console.error('[GanttChart] Error atrapado:', err); }
    render() {
      if (this.state.hasError) {
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            No se pudo renderizar el diagrama Gantt (datos invÃƒÆ’Ã‚Â¡lidos)
          </div>
        );
      }
      return this.props.children;
    }
  }

  // Tooltip simple que muestra solo el nombre del proceso
  const NameOnlyTooltip = ({ task }) => (
    <div
      style={{
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: 6,
        padding: 8,
        boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
        maxWidth: 320,
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        lineHeight: 1.25,
      }}
    >
      <div style={{ fontWeight: 600 }}>{task.name}</div>
    </div>
  );

  // Normalizar fechas y filtrar tareas invÃƒÆ’Ã‚Â¡lidas
  const normalizeDate = (d) => {
    if (!d) return null;
    try {
      if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
      if (typeof d?.toDate === 'function') {
        const conv = d.toDate();
        return isNaN(conv.getTime()) ? null : conv;
      }
      if (typeof d === 'number') {
        const num = new Date(d);
        return isNaN(num.getTime()) ? null : num;
      }
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch (_) {
      return null;
    }
  };

  let cleanTasks = Array.isArray(tasks)
    ? tasks
        .map((t) => {
          if (!t) return null;
          // Aceptar campos legacy como startDate/endDate/date/when
          const startRaw = t.start ?? t.startDate ?? t.date ?? t.when;
          const endRaw = t.end ?? t.endDate ?? t.until ?? t.finish ?? t.to;
          const start = normalizeDate(startRaw);
          const end = normalizeDate(endRaw);
          if (!start || !end) return null;
          if (end.getTime() < start.getTime()) return null;
          return { ...t, start, end };
        })
        .filter(
          (t) =>
            !!t &&
            t.start instanceof Date &&
            t.end instanceof Date &&
            !isNaN(t.start.getTime()) &&
            !isNaN(t.end.getTime())
        )
    : [];

  // Orden estable por fecha de inicio
  if (Array.isArray(cleanTasks)) {
    cleanTasks = cleanTasks.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  if (cleanTasks.length === 0) {
    // Evitar renderizar el componente de la librerÃƒÆ’Ã‚Â­a con datos vacÃƒÆ’Ã‚Â­os o corruptos
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No hay tareas vÃƒÆ’Ã‚Â¡lidas para mostrar
      </div>
    );
  }

  const handleClick = (task) => {
    if (typeof onTaskClick === 'function') onTaskClick(task);
  };

  const wrapperRef = useRef(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [contentOffsetX, setContentOffsetX] = useState(0);
  const [containerScrollLeft, setContainerScrollLeft] = useState(0); // scroll del contenedor vertical (header+grid)
  const scrollerRef = useRef(null);
  const [scrollerNode, setScrollerNode] = useState(null);
  const movingGroupRef = useRef(null);

  const [verticalNode, setVerticalNode] = useState(null);
  const autoCenteredRef = useRef(false);
  useEffect(() => {
    const root = wrapperRef.current;
    if (!root) {
      setScrollerNode(null);
      setVerticalNode(null);
      return;
    }
    // Buscar el contenedor scrollable interno del Gantt (preferir verticalContainer de la librerÃ­a)
    let scroller = null;
    try {
      const vertical = root.querySelector('div[class*="ganttVerticalContainer"], .ganttVerticalContainer');
      if (vertical && vertical.scrollWidth > vertical.clientWidth) scroller = vertical;
    } catch {}
    if (!scroller) {
      const all = root.querySelectorAll('*');
      for (const el of all) {
        try {
          const style = window.getComputedStyle(el);
          const hasOverflowX = /(auto|scroll)/.test(style.overflowX || '');
          if (hasOverflowX && el.scrollWidth > el.clientWidth + 2) { scroller = el; break; }
        } catch {}
      }
    }
    if (!scroller) {
      dbg('No se encontrÃ³ scroller interno');
      setScrollerNode(null);
      return;
    }
    scrollerRef.current = scroller;
    setScrollerNode(scroller);
    const onScroll = () => setScrollLeft(scroller.scrollLeft || 0);
    onScroll();
    scroller.addEventListener('scroll', onScroll);
    // guardar referencia del contenedor principal de scroll
    setVerticalNode(scroller);

    return () => {
      scroller.removeEventListener('scroll', onScroll);
      if (scrollerRef.current === scroller) scrollerRef.current = null;
      setScrollerNode(prev => (prev === scroller ? null : prev));
      setVerticalNode(null);
    };
  }, [viewMode, columnWidth, cleanTasks.length]);

  // Capturar scroll horizontal del contenedor que envuelve cabecera y grid (afecta a ambos)
  useEffect(() => {
    const root = wrapperRef.current;
    if (!root) return;
    // El contenedor suele llevar una clase ofuscada que contiene 'ganttVerticalContainer'
    const vertical = root.querySelector('div[class*="ganttVerticalContainer"], .ganttVerticalContainer');
    if (!vertical) return;
    const onScroll = () => setContainerScrollLeft(vertical.scrollLeft || 0);
    onScroll();
    vertical.addEventListener('scroll', onScroll);
    return () => vertical.removeEventListener('scroll', onScroll);
  }, [viewMode, columnWidth, cleanTasks.length]);

  // Capturar scroll de cualquier descendiente (por si cambia el nodo scrollable)
  useEffect(() => {
    const root = wrapperRef.current;
    if (!root) return;
    const onScrollCapture = (e) => {
      const el = e.target;
      if (el && typeof el.scrollLeft === 'number' && el.scrollWidth > el.clientWidth + 1) {
        setScrollLeft(el.scrollLeft || 0);
      }
    };
    root.addEventListener('scroll', onScrollCapture, true);
    return () => root.removeEventListener('scroll', onScrollCapture, true);
  }, [viewMode, columnWidth]);

  // Detectar translateX aplicado al contenido del Gantt (cuando el control de scroll es custom)
  useEffect(() => {
    const root = wrapperRef.current;
    if (!root) return;

    const findMovingGroup = () => {
      const svgs = root.querySelectorAll('svg g');
      let best = null;
      for (const g of svgs) {
        const attr = g.getAttribute && g.getAttribute('transform');
        const css = (typeof window !== 'undefined' && window.getComputedStyle)
          ? window.getComputedStyle(g).transform
          : '';
        if ((attr && /translate|matrix/i.test(attr)) || (css && css !== 'none')) {
          best = g; break;
        }
      }
      return best;
    };

    const parseTX = (tr) => {
      try {
        if (!tr) return 0;
        // translate3d(x, y, z)
        let m = tr.match(/translate3d\(([-0-9\.]+)[ ,]/i);
        if (m) return parseFloat(m[1]);
        // translate(x[, y])
        m = tr.match(/translate\(([-0-9\.]+)[ ,]/i);
        if (m) return parseFloat(m[1]);
        // matrix(a,b,c,d,e,f) => e = translateX
        m = tr.match(/matrix\(([-0-9\.]+),\s*([-0-9\.]+),\s*([-0-9\.]+),\s*([-0-9\.]+),\s*([-0-9\.]+),\s*([-0-9\.]+)\)/i);
        if (m) return parseFloat(m[5]);
        return 0;
      } catch { return 0; }
    };

    const g = findMovingGroup();
    if (!g) return;
    movingGroupRef.current = g;
    // Inicial
    const tr0 = (g.getAttribute && g.getAttribute('transform')) || (window.getComputedStyle ? window.getComputedStyle(g).transform : '') || '';
    setContentOffsetX(-parseTX(tr0));

    const obs = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === 'attributes') {
          const tr = (g.getAttribute && g.getAttribute('transform')) || (window.getComputedStyle ? window.getComputedStyle(g).transform : '') || '';
          setContentOffsetX(-parseTX(tr));
        }
      }
    });
    obs.observe(g, { attributes: true });
    return () => obs.disconnect();
  }, [viewMode, columnWidth, cleanTasks.length]);

  // AnimaciÃƒÆ’Ã‚Â³n: seguimiento continuo de scroll/transform por si no disparan eventos
  useEffect(() => {
    let rafId = null;
    const tick = () => {
      try {
        const s = scrollerRef.current;
        if (s) {
          const sl = (s?.scrollLeft ?? containerScrollLeft ?? 0);
          if (sl !== scrollLeft) setScrollLeft(sl);
        }
        const g = movingGroupRef.current;
        if (g) {
          const tr = (g.getAttribute && g.getAttribute('transform')) || (window.getComputedStyle ? window.getComputedStyle(g).transform : '') || '';
          const tx = -parseTX(tr);
          if (tx !== contentOffsetX) setContentOffsetX(tx);
        }
      } catch {}
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, [scrollLeft, contentOffsetX]);

  // Forzar el ancho scrollable (fin del scroll) exactamente hasta gridEndDate (modo Mes)
  useEffect(() => {
    try {
      if (viewMode !== ViewMode.Month) return;
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const endOk = gridEndDate instanceof Date && !isNaN(gridEndDate.getTime());
      const base = (gridStartDate instanceof Date && !isNaN(gridStartDate.getTime()))
        ? gridStartDate
        : ((viewDate instanceof Date && !isNaN(viewDate.getTime())) ? viewDate : (cleanTasks[0]?.start || null));
      if (!endOk || !base) return;

      const colW = Math.max(8, Number(columnWidth) || 65);
      const gridStart = new Date(base.getFullYear(), base.getMonth(), 1);
      const gridEnd = new Date(gridEndDate.getFullYear(), gridEndDate.getMonth(), 1);
      const monthsInclusive = (gridEnd.getFullYear() - gridStart.getFullYear()) * 12 + (gridEnd.getMonth() - gridStart.getMonth()) + 1;
      const wantedWidth = Math.max(1, monthsInclusive * colW);

      // 1) Contenedor scrolleable (div) que determina el fin del scroll
      scroller.style.width = `${wantedWidth}px`;

      // 2) SVG del grid (contenido)
      const innerSvg = scroller.querySelector('svg');
      if (innerSvg) innerSvg.setAttribute('width', String(wantedWidth));

      // 3) SVG de cabecera (hermano anterior en el contenedor vertical)
      const vertical = scroller.parentElement; // div.ganttVerticalContainer
      if (vertical) {
        const headerSvg = vertical.querySelector('svg');
        if (headerSvg) headerSvg.setAttribute('width', String(wantedWidth));
      }
      try {
        const s = scrollerRef.current;
        if (debugEnabled && s) dbg('ScrollWidth forzado', { wantedWidth, clientWidth: s.clientWidth, scrollWidth: s.scrollWidth });
      } catch {}
    } catch {}
  }, [viewMode, columnWidth, gridStartDate, gridEndDate, viewDate, cleanTasks.length]);

  // Ajuste duro del ancho interno: forzar que el SVG y el contenedor horizontal no excedan el mes lÃƒÂ­mite
  useEffect(() => {
    try {
      if (viewMode !== ViewMode.Month) return;
      if (!wrapperRef.current) return;
      const endOk = gridEndDate instanceof Date && !isNaN(gridEndDate.getTime());
      const base = (gridStartDate instanceof Date && !isNaN(gridStartDate.getTime()))
        ? gridStartDate
        : ((viewDate instanceof Date && !isNaN(viewDate.getTime())) ? viewDate : (cleanTasks[0]?.start || null));
      if (!endOk || !base) return;

      const colW = Math.max(8, Number(columnWidth) || 65);
      const gridStart = new Date(base.getFullYear(), base.getMonth(), 1);
      const gridEnd = new Date(gridEndDate.getFullYear(), gridEndDate.getMonth(), 1);
      const monthsInclusive = (gridEnd.getFullYear() - gridStart.getFullYear()) * 12 + (gridEnd.getMonth() - gridStart.getMonth()) + 1;
      const wantedWidth = Math.max(1, monthsInclusive * colW);

      const root = wrapperRef.current;
      const vertical = root.querySelector('div[class*="ganttVerticalContainer"], .ganttVerticalContainer');
      if (!vertical) return;
      const horizontal = vertical.querySelector('div[class*="horizontalContainer"], .horizontalContainer');
      const svgs = vertical.querySelectorAll('svg');

      if (horizontal) {
        horizontal.style.width = `${wantedWidth}px`;
      }
      svgs.forEach(svg => {
        try { svg.setAttribute('width', String(wantedWidth)); } catch {}
      });
    } catch {}
  }, [viewMode, columnWidth, gridStartDate, gridEndDate, viewDate, cleanTasks.length]);

  // Desplazar (una vez) al mes actual para que sea visible al cargar
  useEffect(() => {
    try {
      if (autoCenteredRef?.current) return; // solo la primera vez
      if (viewMode !== ViewMode.Month) return;
      const s = scrollerRef.current;
      const root = wrapperRef.current;
      if (!s || !root) return;
      const endOk = gridEndDate instanceof Date && !isNaN(gridEndDate.getTime());
      if (!endOk) return;
      const base = (gridStartDate instanceof Date && !isNaN(gridStartDate.getTime()))
        ? gridStartDate
        : ((viewDate instanceof Date && !isNaN(viewDate.getTime())) ? viewDate : (cleanTasks[0]?.start || null));
      if (!base) return;
      const colW = Math.max(8, Number(columnWidth) || 65);
      const gridStart = new Date(base.getFullYear(), base.getMonth(), 1);
      const today = new Date();
      const monthsDiff = (today.getFullYear() - gridStart.getFullYear()) * 12 + (today.getMonth() - gridStart.getMonth());
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const dayIndex = Math.max(0, Math.min(daysInMonth, today.getDate())) - 1;
      const frac = daysInMonth > 0 ? dayIndex / daysInMonth : 0;
      const todayLeft = Math.max(0, (monthsDiff + frac) * colW);
      const targetLeft = Math.max(0, Math.min(todayLeft - (s.clientWidth * 0.35), Math.max(0, s.scrollWidth - s.clientWidth)));
      if (Math.abs((s.scrollLeft || 0) - targetLeft) > 2) {
        s.scrollTo({ left: targetLeft, behavior: 'auto' });
        try { if (debugEnabled) dbg('Auto-centering to current month', { targetLeft, todayLeft, clientW: s.clientWidth, scrollW: s.scrollWidth }); } catch {}
      }
      if (autoCenteredRef) autoCenteredRef.current = true;
    } catch {}
  }, [scrollerNode, viewMode, columnWidth, gridStartDate, gridEndDate, viewDate, cleanTasks.length]);

  // Calcular offset horizontal en px para el marcador (modo Month fiable)
  let markerLeftPx = null;
  let markerViewportLeftPx = null; // posiciÃ³n dentro del wrapper (tras restar scroll)
  try {
    const markerOk = markerDate instanceof Date && !isNaN(markerDate.getTime());
    if (markerOk) {
      const base = (gridStartDate instanceof Date && !isNaN(gridStartDate.getTime()))
        ? gridStartDate
        : ((viewDate instanceof Date && !isNaN(viewDate.getTime())) ? viewDate : (cleanTasks[0]?.start || null));
      if (base) {
        if (viewMode === ViewMode.Month) {
          // En Month, columnWidth representa el ancho por MES en gantt-task-react
          const colW = Math.max(8, Number(columnWidth) || 65);
          const gridStart = new Date(base.getFullYear(), base.getMonth(), 1);
          const monthsDiff = (markerDate.getFullYear() - gridStart.getFullYear()) * 12 + (markerDate.getMonth() - gridStart.getMonth());
          const daysInMonth = new Date(markerDate.getFullYear(), markerDate.getMonth() + 1, 0).getDate();
          const dayIndex = Math.max(0, Math.min(daysInMonth, markerDate.getDate())) - 1;
          const frac = daysInMonth > 0 ? dayIndex / daysInMonth : 0;
          markerLeftPx = Math.max(0, (monthsDiff + frac) * colW);
          // Posición dentro del wrapper usando delta geométrico (contenido vs viewport)
          const s = scrollerRef.current;
          if (wrapperRef.current) {
            let baseOffset = 0;
            let delta = 0;
            try {
              const wr = wrapperRef.current.getBoundingClientRect();
              const viewportRect = s?.getBoundingClientRect ? s.getBoundingClientRect() : null;
              baseOffset = viewportRect ? Math.max(0, Math.round(viewportRect.left - wr.left)) : 0;

              const inner = (s || wrapperRef.current)?.querySelector?.('div[class*="horizontalContainer"], .horizontalContainer')
                || (s || wrapperRef.current)?.querySelector?.('svg');
              const contentRect = inner?.getBoundingClientRect ? inner.getBoundingClientRect() : null;
              delta = (contentRect && viewportRect)
                ? Math.round(contentRect.left - viewportRect.left)
                : 0;
            } catch {}

            markerViewportLeftPx = Math.max(0, baseOffset + markerLeftPx + delta);
            if (debugEnabled) console.log('[GanttDebug] Marker calculado', {
              base,
              gridStart: gridStart.toISOString(),
              markerDate: markerDate?.toISOString?.() || markerDate,
              colW,
              monthsDiff,
              daysInMonth,
              dayIndex,
              frac,
              markerLeftPx,
              baseOffset,
              delta,
              markerViewportLeftPx,
              wrapperW: wrapperRef.current?.clientWidth,
              scrollerW: s?.clientWidth,
              scrollerSW: s?.scrollWidth
            });
          }
        }
      }
    } else {
      if (debugEnabled) console.warn('[GanttDebug] markerDate invÃ¡lido o no definido', { markerDate });
    }
  } catch (e) {
    console.warn('[GanttDebug] Error calculando marker', e);
  }

  // Right mask placeholder\n
  return (
    <LocalErrorBoundary>
      <div ref={wrapperRef} style={{ position: 'relative', overflow: 'hidden' }}>
        <Gantt
          tasks={cleanTasks}
          viewMode={viewMode}
          preStepsCount={preStepsCount}
          listCellWidth={listCellWidth}
          columnWidth={columnWidth}
          locale="es"
          rowHeight={rowHeight}
          ganttHeight={typeof ganttHeight === 'number' ? ganttHeight : undefined}
          fontSize="12px"
          TooltipContent={NameOnlyTooltip}
          barFill={60}
          barCornerRadius={4}
          barProgressColor="#4f46e5"
          barProgressSelectedColor="#4338ca"
          barBackgroundColor="#a5b4fc"
          barBackgroundSelectedColor="#818cf8"
          todayColor="rgba(252,165,165,0.2)"
          viewDate={viewDate}
          onClick={handleClick}
          onSelect={(task) => handleClick(task)}
          onDoubleClick={(task) => handleClick(task)}
        />
        {wrapperRef.current && typeof markerViewportLeftPx === 'number' && markerViewportLeftPx >= 0 && (
          <div
            data-testid="wedding-marker"
            title="Dia de la boda"
            style={{
              position: 'absolute',
              top: 0,
              left: Math.max(0, markerViewportLeftPx),
              height: (wrapperRef.current ? (wrapperRef.current.clientHeight || '100%') : '100%'),
              pointerEvents: 'none',
              zIndex: 4
            }}
          >
            {/* Poste vertical */}
            <div style={{ position: 'absolute', top: 0, left: -1, width: 2, height: '100%', background: '#ef4444', opacity: 0.95 }} />
            {/* Bandera tipo F1 (chequered) */}
            <svg
              width="18"
              height="14"
              viewBox="0 0 18 14"
              style={{ position: 'absolute', top: 6, left: 2, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }}
              aria-hidden="true"
              focusable="false"
            >
              {/* paÃƒÆ’Ã‚Â±o blanco */}
              <rect x="4" y="2" width="12" height="8" rx="1" ry="1" fill="#ffffff" opacity="0.95" />
              {/* cuadros negros */}
              <rect x="4" y="2" width="3" height="3" fill="#111" />
              <rect x="10" y="2" width="3" height="3" fill="#111" />
              <rect x="7" y="5" width="3" height="3" fill="#111" />
              <rect x="13" y="5" width="3" height="3" fill="#111" />
              {/* borde rojo fino para armonizar con el poste */}
              <rect x="4" y="2" width="12" height="8" rx="1" ry="1" fill="none" stroke="#ef4444" strokeWidth="0.8" opacity="0.9" />
            </svg>
          </div>
        )}
      </div>
    </LocalErrorBoundary>
  );
};








