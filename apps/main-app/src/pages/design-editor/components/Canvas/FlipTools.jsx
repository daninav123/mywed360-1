import React from 'react';
import { FlipHorizontal, FlipVertical, RotateCw, Lock, Unlock } from 'lucide-react';

export default function FlipTools({ canvasRef }) {
  const flipHorizontal = () => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      alert('Selecciona un elemento primero');
      return;
    }

    activeObject.set('flipX', !activeObject.flipX);
    canvas.renderAll();
  };

  const flipVertical = () => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      alert('Selecciona un elemento primero');
      return;
    }

    activeObject.set('flipY', !activeObject.flipY);
    canvas.renderAll();
  };

  const rotate90 = () => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      alert('Selecciona un elemento primero');
      return;
    }

    const currentAngle = activeObject.angle || 0;
    activeObject.rotate((currentAngle + 90) % 360);
    canvas.renderAll();
  };

  const toggleLockMovement = () => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      alert('Selecciona un elemento primero');
      return;
    }

    const isLocked = activeObject.lockMovementX && activeObject.lockMovementY;
    activeObject.set({
      lockMovementX: !isLocked,
      lockMovementY: !isLocked,
      lockRotation: !isLocked,
      hasControls: isLocked, // Mostrar controles si se desbloquea
    });
    
    canvas.renderAll();
  };

  const toggleAspectRatio = () => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      alert('Selecciona un elemento primero');
      return;
    }

    const isLocked = activeObject.lockScalingFlip;
    activeObject.set({
      lockScalingFlip: !isLocked,
      lockUniScaling: !isLocked, // Mantener proporción al escalar
    });
    
    canvas.renderAll();
  };

  return (
    <div className=" border-b  px-4 py-2" className="border-default" className="bg-surface">
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium  mr-2" className="text-secondary">Transformar:</span>
        
        <button
          onClick={flipHorizontal}
          className="p-1.5 hover: rounded" className="bg-page"
          title="Voltear horizontalmente"
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>
        
        <button
          onClick={flipVertical}
          className="p-1.5 hover: rounded" className="bg-page"
          title="Voltear verticalmente"
        >
          <FlipVertical className="w-4 h-4" />
        </button>
        
        <button
          onClick={rotate90}
          className="p-1.5 hover: rounded" className="bg-page"
          title="Rotar 90°"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-gray-300 mx-1" />
        
        <button
          onClick={toggleLockMovement}
          className="p-1.5 hover: rounded" className="bg-page"
          title="Bloquear/Desbloquear posición"
        >
          <Lock className="w-4 h-4" />
        </button>
        
        <button
          onClick={toggleAspectRatio}
          className="p-1.5 hover: rounded" className="bg-page"
          title="Bloquear/Desbloquear proporción"
        >
          <Unlock className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
