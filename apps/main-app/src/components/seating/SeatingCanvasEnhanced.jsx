/**
 * SeatingCanvasEnhanced - Canvas mejorado con grid adaptativo y efectos visuales
 */
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, Grid3x3 } from 'lucide-react';

const GridPattern = ({ width, height, zoom, offset }) => {
  // Grid adaptativo que se ajusta al zoom
  const gridOpacity = useMemo(() => {
    if (zoom < 0.5) return 0.15;
    if (zoom < 0.8) return 0.25;
    if (zoom < 1.2) return 0.35;
    return 0.5;
  }, [zoom]);

  const smallStep = 50; // Grid pequeño cada 50px
  const largeStep = 200; // Grid grande cada 200px

  const smallLines = useMemo(() => {
    const lines = [];
    // Verticales
    for (let x = 0; x <= width; x += smallStep) {
      lines.push(
        <line
          key={`v-small-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="#374151"
          strokeWidth={0.5}
          opacity={gridOpacity * 0.5}
        />
      );
    }
    // Horizontales
    for (let y = 0; y <= height; y += smallStep) {
      lines.push(
        <line
          key={`h-small-${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="#374151"
          strokeWidth={0.5}
          opacity={gridOpacity * 0.5}
        />
      );
    }
    return lines;
  }, [width, height, gridOpacity]);

  const largeLines = useMemo(() => {
    const lines = [];
    // Verticales
    for (let x = 0; x <= width; x += largeStep) {
      lines.push(
        <line
          key={`v-large-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="#4B5563"
          strokeWidth={1}
          opacity={gridOpacity}
        />
      );
    }
    // Horizontales
    for (let y = 0; y <= height; y += largeStep) {
      lines.push(
        <line
          key={`h-large-${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="#4B5563"
          strokeWidth={1}
          opacity={gridOpacity}
        />
      );
    }
    return lines;
  }, [width, height, gridOpacity]);

  return (
    <g className="grid-pattern">
      {smallLines}
      {largeLines}
    </g>
  );
};

const ZoomControls = ({ zoom, onZoomIn, onZoomOut, onFitToScreen }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className="absolute top-4 right-4 z-10
               flex flex-col gap-2
               bg-[#1A1A1D]
               border border-white/20 rounded-lg
               p-2 shadow-xl"
  >
    <button
      onClick={onZoomIn}
      className="w-8 h-8 flex items-center justify-center
                 text-gray-400 hover:text-white hover:bg-white/10
                 rounded transition-colors"
      title="Zoom In (Ctrl++)"
    >
      <ZoomIn size={16} />
    </button>
    
    <div className="text-xs text-gray-400">
      {Math.round(zoom * 100)}%
    </div>
    
    <button
      onClick={onZoomOut}
      className="w-8 h-8 flex items-center justify-center
                 text-gray-400 hover:text-white hover:bg-white/10
                 rounded transition-colors"
      title="Zoom Out (Ctrl+-)"
    >
      <ZoomOut size={16} />
    </button>
    
    <div className="h-px bg-white/10 my-1" />
    
    <button
      onClick={onFitToScreen}
      className="w-8 h-8 flex items-center justify-center
                 text-gray-400 hover:text-white hover:bg-white/10
                 rounded transition-colors"
      title="Ajustar a pantalla (Ctrl+0)"
    >
      <Maximize2 size={16} />
    </button>
  </motion.div>
);

const MiniMap = ({ width, height, tables, currentViewport, onNavigate }) => {
  const scale = 0.15; // Mini mapa al 15%
  const miniWidth = width * scale;
  const miniHeight = height * scale;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute top-4 left-20 z-10
                 bg-[#1A1A1D]
                 border border-white/20 rounded-lg
                 p-2 shadow-xl"
    >
      <div className="text-xs text-gray-400 mb-1 px-1">Vista general</div>
      <svg
        width={miniWidth}
        height={miniHeight}
        className="border border-white/10 rounded cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left) / scale;
          const y = (e.clientY - rect.top) / scale;
          onNavigate?.(x, y);
        }}
      >
        {/* Fondo */}
        <rect width={miniWidth} height={miniHeight} fill="#0F0F10" />
        
        {/* Mesas */}
        {tables?.map((table) => (
          <rect
            key={table.id}
            x={table.x * scale}
            y={table.y * scale}
            width={(table.width || 100) * scale}
            height={(table.height || 100) * scale}
            fill="#3B82F6"
            opacity={0.6}
            rx={table.shape === 'circle' ? ((table.width || 100) * scale) / 2 : 2}
          />
        ))}
        
        {/* Viewport actual */}
        <rect
          x={currentViewport.x * scale}
          y={currentViewport.y * scale}
          width={currentViewport.width * scale}
          height={currentViewport.height * scale}
          fill="none"
          stroke="#6366F1"
          strokeWidth={2}
          opacity={0.8}
        />
      </svg>
    </motion.div>
  );
};

const SnapGuides = ({ guides }) => (
  <g className="snap-guides">
    {guides.map((guide, i) => (
      <motion.line
        key={i}
        x1={guide.type === 'vertical' ? guide.pos : 0}
        y1={guide.type === 'vertical' ? 0 : guide.pos}
        x2={guide.type === 'vertical' ? guide.pos : 9999}
        y2={guide.type === 'vertical' ? 9999 : guide.pos}
        stroke="#6366F1"
        strokeWidth={1}
        strokeDasharray="5,5"
        opacity={0.6}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }}
      />
    ))}
  </g>
);

export default function SeatingCanvasEnhanced({
  width = 1800,
  height = 1200,
  tables = [],
  children,
  onZoomChange,
  onPanChange,
  showGrid = true,
  showMiniMap = true,
  className = '',
}) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [snapGuides, setSnapGuides] = useState([]);
  const [viewport, setViewport] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Calcular viewport visible
  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setViewport({
      x: -pan.x / zoom,
      y: -pan.y / zoom,
      width: rect.width / zoom,
      height: rect.height / zoom,
    });
  }, [zoom, pan]);

  // Zoom con rueda del ratón
  useEffect(() => {
    const handleWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((prev) => Math.max(0.1, Math.min(3, prev * delta)));
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, []);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+0: Fit to screen
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleFitToScreen();
      }
      // Ctrl++: Zoom in
      if ((e.ctrlKey || e.metaKey) && e.key === '+') {
        e.preventDefault();
        handleZoomIn();
      }
      // Ctrl+-: Zoom out
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(3, prev * 1.2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.1, prev / 1.2));
  };

  const handleFitToScreen = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / width;
    const scaleY = rect.height / height;
    const newZoom = Math.min(scaleX, scaleY) * 0.9;
    setZoom(newZoom);
    setPan({ x: 0, y: 0 });
  };

  const handleNavigate = (x, y) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPan({
      x: -(x * zoom - rect.width / 2),
      y: -(y * zoom - rect.height / 2),
    });
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-[#0F0F10] ${className}`}
    >
      {/* Zoom Controls */}
      <ZoomControls
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToScreen={handleFitToScreen}
      />

      {/* Mini Map */}
      {showMiniMap && (
        <MiniMap
          width={width}
          height={height}
          tables={tables}
          currentViewport={viewport}
          onNavigate={handleNavigate}
        />
      )}

      {/* SVG Canvas */}
      <svg
        width="100%"
        height="100%"
        style={{
          cursor: isPanning ? 'grabbing' : 'grab',
        }}
        onMouseDown={(e) => {
          if (e.button === 1 || e.shiftKey) {
            setIsPanning(true);
          }
        }}
        onMouseMove={(e) => {
          if (isPanning) {
            setPan((prev) => ({
              x: prev.x + e.movementX,
              y: prev.y + e.movementY,
            }));
          }
        }}
        onMouseUp={() => setIsPanning(false)}
        onMouseLeave={() => setIsPanning(false)}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Grid */}
          {showGrid && <GridPattern width={width} height={height} zoom={zoom} offset={pan} />}
          
          {/* Snap Guides */}
          <SnapGuides guides={snapGuides} />
          
          {/* Contenido del canvas */}
          {children}
        </g>
      </svg>

      {/* Indicador de coordenadas (esquina inferior izquierda) */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-500 font-mono">
        {Math.round(-pan.x / zoom)}, {Math.round(-pan.y / zoom)}
      </div>
    </div>
  );
}
