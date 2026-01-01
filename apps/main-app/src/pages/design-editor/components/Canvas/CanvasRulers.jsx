import React from 'react';

export default function CanvasRulers({ width, height, visible = false }) {
  if (!visible) return null;

  const horizontalMarks = [];
  const verticalMarks = [];
  
  // Generar marcas cada 100px
  for (let i = 0; i <= width; i += 100) {
    horizontalMarks.push(i);
  }
  for (let i = 0; i <= height; i += 100) {
    verticalMarks.push(i);
  }

  return (
    <>
      {/* Regla horizontal superior */}
      <div 
        className="absolute top-0 left-0  border-b " style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-bg)' }}
        style={{ 
          width: `${width}px`, 
          height: '20px',
          fontSize: '10px',
          lineHeight: '20px'
        }}
      >
        {horizontalMarks.map(mark => (
          <div
            key={`h-${mark}`}
            className="absolute " style={{ color: 'var(--color-muted)' }}
            style={{
              left: `${mark}px`,
              borderLeft: mark % 500 === 0 ? '2px solid #6b7280' : '1px solid #d1d5db',
              height: '100%',
              paddingLeft: '2px'
            }}
          >
            {mark % 500 === 0 && <span className="text-[9px]">{mark}</span>}
          </div>
        ))}
      </div>

      {/* Regla vertical izquierda */}
      <div 
        className="absolute top-0 left-0  border-r " style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-bg)' }}
        style={{ 
          width: '20px', 
          height: `${height}px`,
          fontSize: '10px',
        }}
      >
        {verticalMarks.map(mark => (
          <div
            key={`v-${mark}`}
            className="absolute  text-center" style={{ color: 'var(--color-muted)' }}
            style={{
              top: `${mark}px`,
              borderTop: mark % 500 === 0 ? '2px solid #6b7280' : '1px solid #d1d5db',
              width: '100%',
              height: '1px',
            }}
          >
            {mark % 500 === 0 && (
              <span 
                className="text-[9px]  px-0.5" style={{ backgroundColor: 'var(--color-bg)' }}
                style={{
                  transform: 'translateY(-8px)',
                  display: 'inline-block'
                }}
              >
                {mark}
              </span>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
