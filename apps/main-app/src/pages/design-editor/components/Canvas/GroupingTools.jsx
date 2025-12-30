import React from 'react';
import { Group, Ungroup, Layers } from 'lucide-react';

export default function GroupingTools({ canvasRef }) {
  const handleGroup = () => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const activeSelection = canvas.getActiveObject();
    
    if (!activeSelection) {
      alert('Selecciona al menos 2 elementos para agrupar (mantén Shift y haz click)');
      return;
    }

    if (activeSelection.type !== 'activeSelection') {
      alert('Debes seleccionar múltiples elementos. Mantén Shift y haz click en varios elementos');
      return;
    }

    if (!activeSelection._objects || activeSelection._objects.length < 2) {
      alert('Selecciona al menos 2 elementos');
      return;
    }

    // Convertir selección activa en grupo
    const group = activeSelection.toGroup();
    canvas.requestRenderAll();
    console.log('✅ Elementos agrupados:', group._objects.length, 'elementos');
  };

  const handleUngroup = () => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    
    if (!activeObject) {
      alert('Selecciona un grupo primero');
      return;
    }

    if (activeObject.type !== 'group') {
      alert('El elemento seleccionado no es un grupo');
      return;
    }

    // Desagrupar
    activeObject.toActiveSelection();
    canvas.requestRenderAll();
    console.log('✅ Grupo desagrupado');
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-medium text-gray-600 mr-2">Agrupar:</span>
      
      <button
        onClick={handleGroup}
        className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-gray-100 rounded text-xs font-medium"
        title="Agrupar elementos (Ctrl+G)"
      >
        <Group className="w-4 h-4" />
        <span>Agrupar</span>
      </button>
      
      <button
        onClick={handleUngroup}
        className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-gray-100 rounded text-xs font-medium"
        title="Desagrupar (Ctrl+Shift+G)"
      >
        <Ungroup className="w-4 h-4" />
        <span>Desagrupar</span>
      </button>
    </div>
  );
}
