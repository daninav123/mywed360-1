import React from 'react';
import { FloralCorners, FloralDivider, FallingPetals } from './index';

/**
 * Wrapper que añade decoraciones según la configuración del tema
 */
const DecorativeWrapper = ({ children, tema, showDividers = false }) => {
  const decoraciones = tema?.decoraciones || {};

  return (
    <div style={{ position: 'relative' }}>
      {/* Pétalos cayendo */}
      {decoraciones.petalos && (
        <FallingPetals count={12} color={tema?.colores?.primario || '#FFD1DC'} />
      )}

      {/* Contenido principal */}
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>

      {/* Divisor floral (opcional) */}
      {showDividers && decoraciones.divisores && (
        <FloralDivider color={tema?.colores?.primario || 'currentColor'} opacity={0.3} />
      )}
    </div>
  );
};

export default DecorativeWrapper;
