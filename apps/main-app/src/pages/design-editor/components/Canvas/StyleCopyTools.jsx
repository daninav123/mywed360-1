import React, { useState } from 'react';
import { Pipette, Paintbrush } from 'lucide-react';

export default function StyleCopyTools({ canvasRef }) {
  const [copiedStyle, setCopiedStyle] = useState(null);

  const copyStyle = () => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      alert('Selecciona un elemento para copiar su estilo');
      return;
    }

    // Copiar propiedades de estilo
    const style = {
      fill: activeObject.fill,
      stroke: activeObject.stroke,
      strokeWidth: activeObject.strokeWidth,
      opacity: activeObject.opacity,
      shadow: activeObject.shadow ? {
        color: activeObject.shadow.color,
        blur: activeObject.shadow.blur,
        offsetX: activeObject.shadow.offsetX,
        offsetY: activeObject.shadow.offsetY,
      } : null,
    };

    // Si es texto, copiar también propiedades de texto
    if (activeObject.type === 'i-text' || activeObject.type === 'text') {
      style.fontFamily = activeObject.fontFamily;
      style.fontSize = activeObject.fontSize;
      style.fontWeight = activeObject.fontWeight;
      style.fontStyle = activeObject.fontStyle;
      style.textAlign = activeObject.textAlign;
      style.lineHeight = activeObject.lineHeight;
      style.charSpacing = activeObject.charSpacing;
    }

    setCopiedStyle(style);
    console.log('✅ Estilo copiado:', style);
    alert('✅ Estilo copiado. Ahora selecciona otro elemento y haz click en "Pegar estilo"');
  };

  const pasteStyle = () => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    if (!copiedStyle) {
      alert('Primero debes copiar un estilo. Selecciona un elemento y haz click en "Copiar estilo"');
      return;
    }

    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      alert('Selecciona un elemento para aplicarle el estilo');
      return;
    }

    // Aplicar propiedades básicas
    activeObject.set({
      fill: copiedStyle.fill,
      stroke: copiedStyle.stroke,
      strokeWidth: copiedStyle.strokeWidth,
      opacity: copiedStyle.opacity,
    });

    // Aplicar sombra si existe
    if (copiedStyle.shadow) {
      activeObject.set('shadow', {
        color: copiedStyle.shadow.color,
        blur: copiedStyle.shadow.blur,
        offsetX: copiedStyle.shadow.offsetX,
        offsetY: copiedStyle.shadow.offsetY,
      });
    }

    // Si ambos son texto, copiar propiedades de texto
    if ((activeObject.type === 'i-text' || activeObject.type === 'text') && 
        (copiedStyle.fontFamily)) {
      activeObject.set({
        fontFamily: copiedStyle.fontFamily,
        fontSize: copiedStyle.fontSize,
        fontWeight: copiedStyle.fontWeight,
        fontStyle: copiedStyle.fontStyle,
        textAlign: copiedStyle.textAlign,
        lineHeight: copiedStyle.lineHeight,
        charSpacing: copiedStyle.charSpacing,
      });
    }

    canvas.renderAll();
    console.log('✅ Estilo aplicado');
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-medium text-gray-600 mr-2">Estilo:</span>
      
      <button
        onClick={copyStyle}
        className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-gray-100 rounded text-xs font-medium"
        title="Copiar estilo del elemento seleccionado"
      >
        <Pipette className="w-4 h-4" />
        <span>Copiar</span>
      </button>
      
      <button
        onClick={pasteStyle}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium ${
          copiedStyle 
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
            : 'hover:bg-gray-100 text-gray-600'
        }`}
        title="Pegar estilo al elemento seleccionado"
        disabled={!copiedStyle}
      >
        <Paintbrush className="w-4 h-4" />
        <span>Pegar</span>
      </button>
      
      {copiedStyle && (
        <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full">
          ✓ Copiado
        </span>
      )}
    </div>
  );
}
