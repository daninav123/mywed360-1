import React from 'react';

/**
 * Componente de esquinas florales decorativas
 * Positions: top-left, top-right, bottom-left, bottom-right
 */
const FloralCorners = ({
  position = 'top-left',
  color = 'currentColor',
  size = 120,
  opacity = 0.15,
}) => {
  const corners = {
    'top-left': {
      style: { position: 'absolute', top: 0, left: 0, transform: 'rotate(0deg)' },
    },
    'top-right': {
      style: { position: 'absolute', top: 0, right: 0, transform: 'rotate(90deg)' },
    },
    'bottom-left': {
      style: { position: 'absolute', bottom: 0, left: 0, transform: 'rotate(-90deg)' },
    },
    'bottom-right': {
      style: { position: 'absolute', bottom: 0, right: 0, transform: 'rotate(180deg)' },
    },
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        ...corners[position].style,
        opacity: opacity,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {/* Rama principal */}
      <path
        d="M10 10 Q30 30 50 40 Q70 50 90 55"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Hojas */}
      <ellipse cx="25" cy="25" rx="8" ry="15" fill={color} transform="rotate(-45 25 25)" />
      <ellipse cx="45" cy="35" rx="7" ry="13" fill={color} transform="rotate(-30 45 35)" />
      <ellipse cx="65" cy="45" rx="6" ry="12" fill={color} transform="rotate(-20 65 45)" />

      {/* Flores pequeñas */}
      <g transform="translate(20, 20)">
        <circle cx="0" cy="0" r="4" fill={color} />
        <circle cx="6" cy="0" r="3" fill={color} opacity="0.8" />
        <circle cx="3" cy="5" r="3" fill={color} opacity="0.8" />
        <circle cx="-3" cy="3" r="3" fill={color} opacity="0.8" />
        <circle cx="0" cy="-5" r="3" fill={color} opacity="0.8" />
      </g>

      <g transform="translate(60, 50)">
        <circle cx="0" cy="0" r="3" fill={color} />
        <circle cx="5" cy="0" r="2.5" fill={color} opacity="0.7" />
        <circle cx="2.5" cy="4" r="2.5" fill={color} opacity="0.7" />
        <circle cx="-2.5" cy="2.5" r="2.5" fill={color} opacity="0.7" />
        <circle cx="0" cy="-4" r="2.5" fill={color} opacity="0.7" />
      </g>
    </svg>
  );
};

export default FloralCorners;
