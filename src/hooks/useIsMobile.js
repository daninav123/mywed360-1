/**
 * Hook useIsMobile
 * Detecta si el dispositivo es móvil basado en el viewport
 * Considera móvil cuando el ancho es <= 1024px
 */

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 1024;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    // Inicialización con SSR-safe check
    if (typeof window === 'undefined') return false;
