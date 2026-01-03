import React from 'react';

/**
 * Divisor con forma de ola orgánica
 */
const WaveDivider = ({ position = 'top', color = '#ffffff', height = 100, flip = false }) => {
  const rotateStyle = flip ? { transform: 'rotate(180deg)' } : {};
  const positionStyle = position === 'bottom' ? { bottom: 0, left: 0 } : { top: 0, left: 0 };

  return (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        ...positionStyle,
        overflow: 'hidden',
        lineHeight: 0,
        ...rotateStyle,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        style={{
          position: 'relative',
          display: 'block',
          width: 'calc(100% + 1.3px)',
          height: `${height}px`,
        }}
      >
        <path
          d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
          fill={color}
        />
      </svg>
    </div>
  );
};

export default WaveDivider;
