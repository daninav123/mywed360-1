import React from 'react';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  AlignVerticalSpaceAround,
  AlignHorizontalSpaceAround
} from 'lucide-react';

export default function AlignmentTools({ canvasRef }) {
  const align = (type) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const objWidth = activeObject.width * activeObject.scaleX;
    const objHeight = activeObject.height * activeObject.scaleY;

    switch (type) {
      case 'left':
        activeObject.set({ left: 0 });
        break;
      case 'center-h':
        activeObject.set({ left: (canvasWidth - objWidth) / 2 });
        break;
      case 'right':
        activeObject.set({ left: canvasWidth - objWidth });
        break;
      case 'top':
        activeObject.set({ top: 0 });
        break;
      case 'center-v':
        activeObject.set({ top: (canvasHeight - objHeight) / 2 });
        break;
      case 'bottom':
        activeObject.set({ top: canvasHeight - objHeight });
        break;
      case 'center':
        activeObject.set({ 
          left: (canvasWidth - objWidth) / 2,
          top: (canvasHeight - objHeight) / 2
        });
        break;
    }

    activeObject.setCoords();
    canvas.renderAll();
  };

  const distribute = (type) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const activeSelection = canvas.getActiveObject();
    if (!activeSelection || activeSelection.type !== 'activeSelection') {
      alert('Selecciona múltiples elementos para distribuir');
      return;
    }

    const objects = activeSelection.getObjects().slice().sort((a, b) => {
      if (type === 'horizontal') {
        return a.left - b.left;
      } else {
        return a.top - b.top;
      }
    });

    if (objects.length < 3) {
      alert('Necesitas al menos 3 elementos para distribuir');
      return;
    }

    if (type === 'horizontal') {
      const first = objects[0];
      const last = objects[objects.length - 1];
      const totalSpace = last.left - first.left;
      const spacing = totalSpace / (objects.length - 1);

      objects.forEach((obj, i) => {
        obj.set({ left: first.left + (spacing * i) });
      });
    } else {
      const first = objects[0];
      const last = objects[objects.length - 1];
      const totalSpace = last.top - first.top;
      const spacing = totalSpace / (objects.length - 1);

      objects.forEach((obj, i) => {
        obj.set({ top: first.top + (spacing * i) });
      });
    }

    canvas.renderAll();
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-gray-600 mr-2">Alinear:</span>
        
        <button
          onClick={() => align('left')}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Alinear a la izquierda"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => align('center-h')}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Centrar horizontalmente"
        >
          <AlignHorizontalJustifyCenter className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => align('right')}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Alinear a la derecha"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-gray-300 mx-1" />
        
        <button
          onClick={() => align('top')}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Alinear arriba"
        >
          <AlignLeft className="w-4 h-4 rotate-90" />
        </button>
        
        <button
          onClick={() => align('center-v')}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Centrar verticalmente"
        >
          <AlignVerticalJustifyCenter className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => align('bottom')}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Alinear abajo"
        >
          <AlignRight className="w-4 h-4 rotate-90" />
        </button>

        <div className="h-5 w-px bg-gray-300 mx-1" />
        
        <button
          onClick={() => align('center')}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Centrar en canvas"
        >
          <AlignCenter className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-gray-300 mx-2" />
        
        <span className="text-xs font-medium text-gray-600 mr-2">Distribuir:</span>
        
        <button
          onClick={() => distribute('horizontal')}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Distribuir horizontalmente"
        >
          <AlignHorizontalSpaceAround className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => distribute('vertical')}
          className="p-1.5 hover:bg-gray-100 rounded"
          title="Distribuir verticalmente"
        >
          <AlignVerticalSpaceAround className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
