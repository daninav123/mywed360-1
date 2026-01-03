import { useState, useEffect } from 'react';

/**
 * Hook para detectar viewport móvil/tablet
 * @param {number} breakpoint - Ancho máximo para considerar móvil (default: 1024px)
 * @returns {boolean} - true si el viewport es móvil/tablet
 */
export function useMobileViewport(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= breakpoint;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    // Listener para cambios de tamaño
    window.addEventListener('resize', handleResize);
    
    // Verificar al montar
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}

export default useMobileViewport;
