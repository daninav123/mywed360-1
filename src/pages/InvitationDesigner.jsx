import React, { useState, useRef } from 'react';

import InvitationCanvas from '../components/invitations/InvitationCanvas';
import LayerPanel from '../components/invitations/LayerPanel';
import PropertyPanel from '../components/invitations/PropertyPanel';
import TemplateGallery from '../components/invitations/TemplateGallery';
import Toolbar from '../components/invitations/Toolbar';
import useHistory from '../hooks/useHistory';
import { exportElementToPdf } from '../utils/pdfExport';

function InvitationDesigner() {
  const [template, setTemplate] = useState(null);
  // scale for zoom
  const [scale, setScale] = useState(1);
  const canvasRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);

  // history for elements on canvas
  const [elements, setElementsHistory, { undo, redo, canUndo, canRedo }] = useHistory([]);

  const handleZoomIn = () => setScale((s) => Math.min(3, +(s + 0.1).toFixed(2)));
  const handleZoomOut = () => setScale((s) => Math.max(0.3, +(s - 0.1).toFixed(2)));

  const setElements = (updater) => {
    setElementsHistory(updater);
  };

  const handleAddText = () => {
    const id = Date.now();
    setElements((prev) => [...prev, { id, type: 'text', content: 'Nuevo texto', x: 50, y: 50 }]);
    setSelectedId(id);
  };

  const handleAddImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const id = Date.now();
        setElements((prev) => [...prev, { id, type: 'image', src: reader.result, x: 50, y: 50 }]);
        setSelectedId(id);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleExportPdf = () => {
    if (canvasRef.current) {
      exportElementToPdf(canvasRef.current);
    }
  };

  if (!template) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Selecciona una plantilla</h1>
        <TemplateGallery onSelect={setTemplate} />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Side panels */}
      <aside className="md:w-60 border-r p-2 overflow-y-auto bg-white shadow-md">
        <Toolbar
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onAddText={handleAddText}
          onAddImage={handleAddImage}
          onExportPdf={handleExportPdf}
        />
        <LayerPanel />
        <PropertyPanel
          element={elements.find((el) => el.id === selectedId)}
          updateElement={(mutator) =>
            setElements((prev) =>
              prev.map((el) =>
                el.id === selectedId
                  ? typeof mutator === 'function'
                    ? mutator(el)
                    : { ...el, ...mutator }
                  : el
              )
            )
          }
        />
      </aside>

      {/* Canvas area */}
      <main className="flex-1 flex flex-col items-center justify-center bg-gray-100">
        <InvitationCanvas
          ref={canvasRef}
          template={template}
          elements={elements}
          setElements={setElements}
          scale={scale}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </main>
    </div>
  );
}

export default InvitationDesigner;
