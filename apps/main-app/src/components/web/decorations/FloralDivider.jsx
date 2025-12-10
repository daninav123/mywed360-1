import React from 'react';

/**
 * Divisor floral entre secciones
 */
const FloralDivider = ({ color = 'currentColor', height = 60, opacity = 0.2 }) => {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        margin: '2rem 0',
        opacity: opacity,
      }}
    >
      <svg
        width="300"
        height={height}
        viewBox="0 0 300 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Línea central */}
        <line x1="0" y1="30" x2="120" y2="30" stroke={color} strokeWidth="1" opacity="0.5" />
        <line x1="180" y1="30" x2="300" y2="30" stroke={color} strokeWidth="1" opacity="0.5" />

        {/* Flor central */}
        <g transform="translate(150, 30)">
          {/* Centro */}
          <circle cx="0" cy="0" r="6" fill={color} />

          {/* Pétalos */}
          <ellipse cx="0" cy="-12" rx="5" ry="8" fill={color} opacity="0.8" />
          <ellipse cx="12" cy="0" rx="8" ry="5" fill={color} opacity="0.8" />
          <ellipse cx="0" cy="12" rx="5" ry="8" fill={color} opacity="0.8" />
          <ellipse cx="-12" cy="0" rx="8" ry="5" fill={color} opacity="0.8" />

          {/* Pétalos diagonales */}
          <ellipse
            cx="8"
            cy="-8"
            rx="5"
            ry="7"
            fill={color}
            opacity="0.6"
            transform="rotate(45 8 -8)"
          />
          <ellipse
            cx="8"
            cy="8"
            rx="5"
            ry="7"
            fill={color}
            opacity="0.6"
            transform="rotate(-45 8 8)"
          />
          <ellipse
            cx="-8"
            cy="8"
            rx="5"
            ry="7"
            fill={color}
            opacity="0.6"
            transform="rotate(45 -8 8)"
          />
          <ellipse
            cx="-8"
            cy="-8"
            rx="5"
            ry="7"
            fill={color}
            opacity="0.6"
            transform="rotate(-45 -8 -8)"
          />
        </g>

        {/* Hojas laterales */}
        <g transform="translate(130, 30)">
          <ellipse
            cx="0"
            cy="-5"
            rx="4"
            ry="10"
            fill={color}
            opacity="0.5"
            transform="rotate(-30 0 -5)"
          />
          <ellipse
            cx="0"
            cy="5"
            rx="4"
            ry="10"
            fill={color}
            opacity="0.5"
            transform="rotate(30 0 5)"
          />
        </g>

        <g transform="translate(170, 30)">
          <ellipse
            cx="0"
            cy="-5"
            rx="4"
            ry="10"
            fill={color}
            opacity="0.5"
            transform="rotate(30 0 -5)"
          />
          <ellipse
            cx="0"
            cy="5"
            rx="4"
            ry="10"
            fill={color}
            opacity="0.5"
            transform="rotate(-30 0 5)"
          />
        </g>
      </svg>
    </div>
  );
};

export default FloralDivider;
