import React from 'react';
import { FloralCorners, FallingPetals, FloralDivider } from './index';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';

/**
 * HOC que añade decoraciones a una sección
 */
const SectionDecorator = ({
  children,
  tema,
  showCorners = true,
  showDividers = false,
  enableAnimations = true,
  className = '',
  style = {},
}) => {
  const decoraciones = tema?.decoraciones || {};
  const [ref, isVisible] = useScrollAnimation({ threshold: 0.2 });

  const animationClass =
    decoraciones.animaciones && enableAnimations ? `fade-in-up ${isVisible ? 'visible' : ''}` : '';

  return (
    <div
      ref={ref}
      className={`${animationClass} ${className}`}
      style={{
        position: 'relative',
        ...style,
      }}
    >
      {/* Pétalos cayendo */}
      {decoraciones.petalos && (
        <FallingPetals count={15} color={tema?.colores?.primario || '#FFD1DC'} />
      )}

      {/* Flores en esquinas */}
      {decoraciones.flores && showCorners && (
        <>
          <FloralCorners
            position="top-left"
            color={tema?.colores?.primario || 'currentColor'}
            size={100}
            opacity={0.15}
          />
          <FloralCorners
            position="top-right"
            color={tema?.colores?.primario || 'currentColor'}
            size={100}
            opacity={0.15}
          />
        </>
      )}

      {/* Divisor floral superior */}
      {decoraciones.divisores && showDividers && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }}>
          <FloralDivider color={tema?.colores?.primario || 'currentColor'} opacity={0.2} />
        </div>
      )}

      {/* Contenido */}
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>

      {/* Divisor floral inferior */}
      {decoraciones.divisores && showDividers && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1,
            transform: 'scaleY(-1)',
          }}
        >
          <FloralDivider color={tema?.colores?.primario || 'currentColor'} opacity={0.2} />
        </div>
      )}
    </div>
  );
};

export default SectionDecorator;
