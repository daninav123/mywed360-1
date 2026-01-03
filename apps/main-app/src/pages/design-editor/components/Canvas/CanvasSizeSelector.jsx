import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';

const CANVAS_SIZES = [
  { id: 'a5', name: 'A5', width: 1050, height: 1485, desc: '148 × 210 mm' },
  { id: 'a4', name: 'A4', width: 1754, height: 2480, desc: '210 × 297 mm' },
  { id: 'square', name: 'Cuadrado', width: 1500, height: 1500, desc: '1:1' },
  { id: 'instagram', name: 'Instagram', width: 1080, height: 1080, desc: '1:1' },
  { id: 'story', name: 'Story', width: 1080, height: 1920, desc: '9:16' },
  { id: 'custom', name: 'Personalizado', width: 0, height: 0, desc: 'Custom' },
];

export default function CanvasSizeSelector({ currentSize, onSizeChange }) {
  const [showMenu, setShowMenu] = useState(false);
  const [customWidth, setCustomWidth] = useState(1050);
  const [customHeight, setCustomHeight] = useState(1485);
  const [showCustomDialog, setShowCustomDialog] = useState(false);

  const handleSizeSelect = (size) => {
    if (size.id === 'custom') {
      setShowCustomDialog(true);
      setShowMenu(false);
    } else {
      onSizeChange(size.width, size.height);
      setShowMenu(false);
    }
  };

  const handleCustomApply = () => {
    onSizeChange(customWidth, customHeight);
    setShowCustomDialog(false);
  };

  const currentSizeName = CANVAS_SIZES.find(
    s => s.width === currentSize?.width && s.height === currentSize?.height
  )?.name || 'Personalizado';

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border  rounded hover:" className="border-default" className="bg-page"
        >
          <Maximize2 className="w-4 h-4" />
          {currentSizeName}
          <span className="text-xs " className="text-muted">
            {currentSize?.width} × {currentSize?.height}px
          </span>
        </button>

        {showMenu && (
          <div className="absolute top-full left-0 mt-1  border  rounded-lg shadow-lg z-50 min-w-[240px]" className="border-default" className="bg-surface">
            <div className="p-2">
              <div className="text-xs font-semibold  px-2 py-1" className="text-muted">Tamaño del canvas</div>
              {CANVAS_SIZES.map((size) => (
                <button
                  key={size.id}
                  onClick={() => handleSizeSelect(size)}
                  className="w-full text-left px-3 py-2 hover: rounded flex items-center justify-between" className="bg-page"
                >
                  <div>
                    <div className="font-medium text-sm">{size.name}</div>
                    <div className="text-xs " className="text-muted">{size.desc}</div>
                  </div>
                  {size.width > 0 && (
                    <div className="text-xs " className="text-muted">{size.width}×{size.height}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCustomDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className=" rounded-lg p-6 w-96" className="bg-surface">
            <h3 className="text-lg font-semibold mb-4">Tamaño Personalizado</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ancho (px)</label>
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border  rounded" className="border-default"
                  min="100"
                  max="5000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Alto (px)</label>
                <input
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border  rounded" className="border-default"
                  min="100"
                  max="5000"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCustomApply}
                  className="flex-1 px-4 py-2  text-white rounded hover:bg-blue-700" style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Aplicar
                </button>
                <button
                  onClick={() => setShowCustomDialog(false)}
                  className="flex-1 px-4 py-2 border  rounded hover:" className="border-default" className="bg-page"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
