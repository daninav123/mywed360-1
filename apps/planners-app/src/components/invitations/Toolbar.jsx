import React from 'react';
import {
  FaUndo,
  FaRedo,
  FaSearchPlus,
  FaSearchMinus,
  FaPlus,
  FaFileExport,
  FaImage,
} from 'react-icons/fa';

function Toolbar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onZoomIn,
  onZoomOut,
  onAddText,
  onAddImage,
  onExportPdf,
}) {
  return (
    <div className="flex items-center space-x-2 mb-4">
      <button
        className="p-2 bg-gray-200 rounded disabled:opacity-50"
        aria-label="Deshacer (Ctrl+Z)"
        onClick={onUndo}
        disabled={!canUndo}
      >
        <FaUndo />
      </button>
      <button
        className="p-2 bg-gray-200 rounded disabled:opacity-50"
        aria-label="Rehacer (Ctrl+Y)"
        onClick={onRedo}
        disabled={!canRedo}
      >
        <FaRedo />
      </button>
      <button className="p-2 bg-gray-200 rounded" aria-label="Añadir texto" onClick={onAddText}>
        <FaPlus />
      </button>
      <button className="p-2 bg-gray-200 rounded" aria-label="Añadir imagen" onClick={onAddImage}>
        <FaImage />
      </button>
      <span className="mx-2 border-r h-4" />
      <button className="p-2 bg-gray-200 rounded" aria-label="Zoom in (Ctrl+ +)" onClick={onZoomIn}>
        <FaSearchPlus />
      </button>
      <button
        className="p-2 bg-gray-200 rounded"
        aria-label="Zoom out (Ctrl+ -)"
        onClick={onZoomOut}
      >
        <FaSearchMinus />
      </button>
      <button
        className="p-2 bg-blue-500 text-white rounded"
        aria-label="Exportar PDF"
        onClick={onExportPdf}
      >
        <FaFileExport />
      </button>
    </div>
  );
}

export default Toolbar;
