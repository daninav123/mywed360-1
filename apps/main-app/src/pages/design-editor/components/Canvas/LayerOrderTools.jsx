import React from 'react';
import { 
  BringToFront, 
  SendToBack, 
  ArrowUp, 
  ArrowDown 
} from 'lucide-react';

export default function LayerOrderTools({ canvasRef }) {
  const bringToFront = () => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      alert('Selecciona un elemento primero');
      return;
    }

    canvas.bringToFront(activeObject);
    canvas.renderAll();
    console.log('✅ Elemento traído al frente');
  };

  const sendToBack = () => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      alert('Selecciona un elemento primero');
      return;
    }

    canvas.sendToBack(activeObject);
    canvas.renderAll();
    console.log('✅ Elemento enviado al fondo');
  };

  const bringForward = () => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      alert('Selecciona un elemento primero');
      return;
    }

    canvas.bringForward(activeObject);
    canvas.renderAll();
    console.log('✅ Elemento subido una capa');
  };

  const sendBackwards = () => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      alert('Selecciona un elemento primero');
      return;
    }

    canvas.sendBackwards(activeObject);
    canvas.renderAll();
    console.log('✅ Elemento bajado una capa');
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-medium text-gray-600 mr-2">Orden:</span>
      
      <button
        onClick={bringToFront}
        className="p-1.5 hover:bg-gray-100 rounded"
        title="Traer al frente (Ctrl+])"
      >
        <BringToFront className="w-4 h-4" />
      </button>
      
      <button
        onClick={bringForward}
        className="p-1.5 hover:bg-gray-100 rounded"
        title="Subir una capa"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
      
      <button
        onClick={sendBackwards}
        className="p-1.5 hover:bg-gray-100 rounded"
        title="Bajar una capa"
      >
        <ArrowDown className="w-4 h-4" />
      </button>
      
      <button
        onClick={sendToBack}
        className="p-1.5 hover:bg-gray-100 rounded"
        title="Enviar al fondo (Ctrl+[)"
      >
        <SendToBack className="w-4 h-4" />
      </button>
    </div>
  );
}
