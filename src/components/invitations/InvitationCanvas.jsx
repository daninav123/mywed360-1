import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import Draggable from 'react-draggable';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 850; // A5 vertical

const InvitationCanvas = React.forwardRef(function InvitationCanvas(
  { template, elements, setElements, scale, selectedId, onSelect },
  ref
) {
  // Seed demo elements only once
  useEffect(() => {
    if (elements.length === 0) {
      setElements([
        { id: 1, type: 'text', content: 'Nombre de los novios', x: 100, y: 200 },
        { id: 2, type: 'text', content: 'Fecha del evento', x: 100, y: 260 },
      ]);
    }
  }, [elements.length, setElements]);

  const handleStop = (e, data, id) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, x: data.x, y: data.y } : el)));
  };

  return (
    <div className="p-4">
      <div
        ref={ref}
        className="relative bg-white shadow-md border mx-auto"
        style={{
          width: CANVAS_WIDTH * scale,
          height: CANVAS_HEIGHT * scale,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
        }}
        role="region"
        aria-label={t('common.aria_lienzo_de_invitacion')}
      >
        {/* Bleed area */}
        <div
          className="absolute inset-0 border-dashed border-red-400 pointer-events-none"
          style={{ margin: 12 }}
          aria-hidden="true"
        />

        {elements.map((el) => (
          <Draggable
            key={el.id}
            position={{ x: el.x, y: el.y }}
            onStop={(e, d) => handleStop(e, d, el.id)}
            bounds="parent"
          >
            {el.type === 'text' ? (
              <div
                className={`cursor-move select-none text-gray-800 ${selectedId === el.id ? 'ring-2 ring-blue-500' : ''}`}
                onMouseDown={() => onSelect(el.id)}
              >
                {el.content}
              </div>
            ) : null}
          </Draggable>
        ))}
      </div>
      <p className="text-xs text-gray-500 text-center mt-2">
        Arrastra los textos para recolocarlos (demo). Próximamente: añadir nuevos elementos y
        propiedades.
      </p>
    </div>
  );
});

InvitationCanvas.propTypes = {
  template: PropTypes.object.isRequired,
  elements: PropTypes.array.isRequired,
  setElements: PropTypes.func.isRequired,
  scale: PropTypes.number.isRequired,
  selectedId: PropTypes.number,
  onSelect: PropTypes.func.isRequired,
};

export default InvitationCanvas;
