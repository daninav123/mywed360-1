/**
 * useIsMobile Hook
 * Detecta si el viewport actual es móvil (<=1024px)
 * Parte del Sprint 2 - Completar Seating Plan
 */

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 1024;

/**
 * Hook para detectar si el dispositivo es móvil basándose en el ancho de viewport
 * @returns {boolean} true si el viewport es <= 1024px
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    // Inicialización con SSR-safe check
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    // Handler para cambios de tamaño de ventana
    const handleResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobile);
    };

    // Añadir listener
    window.addEventListener('resize', handleResize);
    
    // Verificar tamaño inicial
    handleResize();

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

/**
 * Hook mejorado que incluye orientación del dispositivo
 * @returns {Object} { isMobile: boolean, isPortrait: boolean, isLandscape: boolean, width: number, height: number }
 */
export function useViewport() {
  const [viewport, setViewport] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isPortrait: false,
        isLandscape: true,
        width: 1920,
        height: 1080
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    return {
      isMobile: width <= MOBILE_BREAKPOINT,
      isPortrait: height > width,
      isLandscape: width >= height,
      width,
      height
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setViewport({
        isMobile: width <= MOBILE_BREAKPOINT,
        isPortrait: height > width,
        isLandscape: width >= height,
        width,
        height
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
}

/**
 * Hook para detectar si el dispositivo tiene capacidad táctil
 * @returns {boolean} true si el dispositivo soporta touch
 */
export function useTouchDevice() {
  const [isTouch, setIsTouch] = useState(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkTouch();
  }, []);

  return isTouch;
}

export default useIsMobile;
