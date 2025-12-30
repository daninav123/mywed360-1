import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Grid, Ruler } from 'lucide-react';
import CanvasSizeSelector from './CanvasSizeSelector';

export default function CanvasToolbar({ canvasRef, canvasSize, onSizeChange }) {
  const [zoom, setZoom] = useState(50);
  const [showGrid, setShowGrid] = useState(true); // Activado por defecto
  const [showRulers, setShowRulers] = useState(false);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 10, 400);
    setZoom(newZoom);
    if (canvasRef.current) {
      canvasRef.current.setZoom(newZoom / 100);
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 10, 25);
    setZoom(newZoom);
    if (canvasRef.current) {
      canvasRef.current.setZoom(newZoom / 100);
    }
  };

  const handleZoomFit = () => {
    setZoom(100);
    if (canvasRef.current) {
      canvasRef.current.setZoom(1);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={handleZoomOut}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Alejar (Zoom -)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium min-w-[60px] text-center">{zoom}%</span>
        <button
          onClick={handleZoomIn}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Acercar (Zoom +)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomFit}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Ajustar"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <div className="h-6 w-px bg-gray-300" />

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-1.5 rounded ${showGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
          title="Mostrar/Ocultar cuadrícula"
        >
          <Grid className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowRulers(!showRulers)}
          className={`p-1.5 rounded ${showRulers ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
          title="Mostrar/Ocultar reglas"
        >
          <Ruler className="w-4 h-4" />
        </button>
      </div>

      <div className="ml-auto text-xs text-gray-500">
        A5 (148 × 210 mm) • 300 DPI
      </div>
    </div>
  );
}
