import React from 'react';

/**
 * Marco floral para imágenes
 */
const FloralFrame = ({ children, color = 'currentColor', thickness = 2 }) => {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {children}

      {/* Esquina superior izquierda */}
      <svg
        width="60"
        height="60"
        viewBox="0 0 60 60"
        style={{
          position: 'absolute',
          top: -10,
          left: -10,
          pointerEvents: 'none',
        }}
      >
        <path
          d="M5 5 L5 25 M5 5 L25 5"
          stroke={color}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="15" cy="15" r="8" fill={color} opacity="0.3" />
        <circle cx="12" cy="12" r="4" fill={color} opacity="0.5" />
      </svg>

      {/* Esquina superior derecha */}
      <svg
        width="60"
        height="60"
        viewBox="0 0 60 60"
        style={{
          position: 'absolute',
          top: -10,
          right: -10,
          pointerEvents: 'none',
          transform: 'scaleX(-1)',
        }}
      >
        <path
          d="M5 5 L5 25 M5 5 L25 5"
          stroke={color}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="15" cy="15" r="8" fill={color} opacity="0.3" />
        <circle cx="12" cy="12" r="4" fill={color} opacity="0.5" />
      </svg>

      {/* Esquina inferior izquierda */}
      <svg
        width="60"
        height="60"
        viewBox="0 0 60 60"
        style={{
          position: 'absolute',
          bottom: -10,
          left: -10,
          pointerEvents: 'none',
          transform: 'scaleY(-1)',
        }}
      >
        <path
          d="M5 5 L5 25 M5 5 L25 5"
          stroke={color}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="15" cy="15" r="8" fill={color} opacity="0.3" />
        <circle cx="12" cy="12" r="4" fill={color} opacity="0.5" />
      </svg>

      {/* Esquina inferior derecha */}
      <svg
        width="60"
        height="60"
        viewBox="0 0 60 60"
        style={{
          position: 'absolute',
          bottom: -10,
          right: -10,
          pointerEvents: 'none',
          transform: 'scale(-1)',
        }}
      >
        <path
          d="M5 5 L5 25 M5 5 L25 5"
          stroke={color}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="15" cy="15" r="8" fill={color} opacity="0.3" />
        <circle cx="12" cy="12" r="4" fill={color} opacity="0.5" />
      </svg>
    </div>
  );
};

export default FloralFrame;
