/**
 * useSeatingGestures Hook
 * Implementa gestos táctiles para Seating Plan
 * Pinch zoom, double tap, swipe
 * Sprint 2 - Completar Seating Plan
 */

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Hook para manejar gestos táctiles en el canvas de seating
 * @param {Object} options
 * @param {Function} options.onZoom - Callback para zoom (scale, originX, originY)
 * @param {Function} options.onPan - Callback para pan (deltaX, deltaY)
 * @param {Function} options.onDoubleTap - Callback para doble tap (x, y)
 * @param {Function} options.onLongPress - Callback para long press (x, y)
 * @param {number} options.minZoom - Zoom mínimo (default: 0.5)
 * @param {number} options.maxZoom - Zoom máximo (default: 3)
 * @param {number} options.doubleTapDelay - Delay para detectar doble tap en ms (default: 300)
 * @param {number} options.longPressDelay - Delay para long press en ms (default: 500)
 * @returns {Object} { ref, scale, position, reset }
 */
export function useSeatingGestures(options = {}) {
  const {
    onZoom,
    onPan,
    onDoubleTap,
    onLongPress,
    minZoom = 0.5,
    maxZoom = 3,
    doubleTapDelay = 300,
    longPressDelay = 500,
  } = options;

  const ref = useRef(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Estado interno para gestos
  const gestureState = useRef({
    lastTap: 0,
    lastTapPos: { x: 0, y: 0 },
    initialDistance: 0,
    initialScale: 1,
    isPinching: false,
    isPanning: false,
    startPos: { x: 0, y: 0 },
    longPressTimer: null,
    touchStartTime: 0,
  });

  /**
   * Calcula la distancia entre dos puntos táctiles
   */
  const getDistance = useCallback((touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  /**
   * Calcula el punto medio entre dos puntos táctiles
   */
  const getMidpoint = useCallback((touch1, touch2) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }, []);

  /**
   * Limpia el timer de long press
   */
  const clearLongPressTimer = useCallback(() => {
    if (gestureState.current.longPressTimer) {
      clearTimeout(gestureState.current.longPressTimer);
      gestureState.current.longPressTimer = null;
    }
  }, []);

  /**
   * Handler para touchstart
   */
  const handleTouchStart = useCallback((e) => {
    const touches = e.touches;
    const now = Date.now();
    gestureState.current.touchStartTime = now;

    if (touches.length === 1) {
      // Detectar doble tap
      const touch = touches[0];
      const tapPos = { x: touch.clientX, y: touch.clientY };
      const timeSinceLastTap = now - gestureState.current.lastTap;
      const distanceFromLastTap = Math.sqrt(
        Math.pow(tapPos.x - gestureState.current.lastTapPos.x, 2) +
        Math.pow(tapPos.y - gestureState.current.lastTapPos.y, 2)
      );

      if (timeSinceLastTap < doubleTapDelay && distanceFromLastTap < 50) {
        // Doble tap detectado
        e.preventDefault();
        clearLongPressTimer();
        if (onDoubleTap) {
          const rect = ref.current?.getBoundingClientRect();
          if (rect) {
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            onDoubleTap(x, y);
          }
        }
        gestureState.current.lastTap = 0;
      } else {
        gestureState.current.lastTap = now;
        gestureState.current.lastTapPos = tapPos;

        // Iniciar pan
        gestureState.current.isPanning = true;
        gestureState.current.startPos = tapPos;

        // Iniciar timer para long press
        if (onLongPress) {
          gestureState.current.longPressTimer = setTimeout(() => {
            const rect = ref.current?.getBoundingClientRect();
            if (rect) {
              const x = touch.clientX - rect.left;
              const y = touch.clientY - rect.top;
              onLongPress(x, y);
            }
          }, longPressDelay);
        }
      }
    } else if (touches.length === 2) {
      // Iniciar pinch zoom
      e.preventDefault();
      clearLongPressTimer();
      gestureState.current.isPinching = true;
      gestureState.current.isPanning = false;
      gestureState.current.initialDistance = getDistance(touches[0], touches[1]);
      gestureState.current.initialScale = scale;
    }
  }, [scale, onDoubleTap, onLongPress, doubleTapDelay, longPressDelay, getDistance, clearLongPressTimer]);

  /**
   * Handler para touchmove
   */
  const handleTouchMove = useCallback((e) => {
    const touches = e.touches;

    // Cancelar long press si hay movimiento
    clearLongPressTimer();

    if (touches.length === 2 && gestureState.current.isPinching) {
      // Pinch zoom
      e.preventDefault();
      const currentDistance = getDistance(touches[0], touches[1]);
      const scaleChange = currentDistance / gestureState.current.initialDistance;
      let newScale = gestureState.current.initialScale * scaleChange;

      // Limitar zoom
      newScale = Math.max(minZoom, Math.min(maxZoom, newScale));

      setScale(newScale);

      if (onZoom) {
        const midpoint = getMidpoint(touches[0], touches[1]);
        const rect = ref.current?.getBoundingClientRect();
        if (rect) {
          const originX = midpoint.x - rect.left;
          const originY = midpoint.y - rect.top;
          onZoom(newScale, originX, originY);
        }
      }
    } else if (touches.length === 1 && gestureState.current.isPanning && !gestureState.current.isPinching) {
      // Pan
      const touch = touches[0];
      const currentPos = { x: touch.clientX, y: touch.clientY };
      const deltaX = currentPos.x - gestureState.current.startPos.x;
      const deltaY = currentPos.y - gestureState.current.startPos.y;

      // Detectar si realmente se está moviendo (threshold de 5px)
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        gestureState.current.startPos = currentPos;
        
        const newPosition = {
          x: position.x + deltaX,
          y: position.y + deltaY,
        };
        
        setPosition(newPosition);

        if (onPan) {
          onPan(deltaX, deltaY);
        }
      }
    }
  }, [scale, position, minZoom, maxZoom, onZoom, onPan, getDistance, getMidpoint, clearLongPressTimer]);

  /**
   * Handler para touchend
   */
  const handleTouchEnd = useCallback((e) => {
    clearLongPressTimer();
    
    if (e.touches.length === 0) {
      gestureState.current.isPinching = false;
      gestureState.current.isPanning = false;
    } else if (e.touches.length === 1 && gestureState.current.isPinching) {
      // Transición de pinch a pan
      gestureState.current.isPinching = false;
      gestureState.current.isPanning = true;
      const touch = e.touches[0];
      gestureState.current.startPos = { x: touch.clientX, y: touch.clientY };
    }
  }, [clearLongPressTimer]);

  /**
   * Handler para wheel (zoom con mouse/trackpad)
   */
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    const delta = e.deltaY * -0.01;
    let newScale = scale + delta;
    newScale = Math.max(minZoom, Math.min(maxZoom, newScale));

    setScale(newScale);

    if (onZoom) {
      const rect = ref.current?.getBoundingClientRect();
      if (rect) {
        const originX = e.clientX - rect.left;
        const originY = e.clientY - rect.top;
        onZoom(newScale, originX, originY);
      }
    }
  }, [scale, minZoom, maxZoom, onZoom]);

  /**
   * Resetear zoom y posición
   */
  const reset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    if (onZoom) onZoom(1, 0, 0);
    if (onPan) onPan(0, 0);
  }, [onZoom, onPan]);

  /**
   * Añadir event listeners
   */
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('wheel', handleWheel);
      clearLongPressTimer();
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleWheel, clearLongPressTimer]);

  return {
    ref,
    scale,
    position,
    reset,
  };
}

/**
 * Hook simplificado solo para pinch zoom
 */
export function usePinchZoom(options = {}) {
  const { minZoom = 0.5, maxZoom = 3, onZoomChange } = options;
  
  return useSeatingGestures({
    minZoom,
    maxZoom,
    onZoom: (scale) => {
      if (onZoomChange) onZoomChange(scale);
    },
  });
}

/**
 * Hook para detectar solo doble tap
 */
export function useDoubleTap(callback, delay = 300) {
  const lastTapRef = useRef(0);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const handleTap = useCallback((event) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    const x = event.clientX || event.touches?.[0]?.clientX || 0;
    const y = event.clientY || event.touches?.[0]?.clientY || 0;
    
    const distance = Math.sqrt(
      Math.pow(x - lastPosRef.current.x, 2) +
      Math.pow(y - lastPosRef.current.y, 2)
    );

    if (timeSinceLastTap < delay && distance < 50) {
      callback(event);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      lastPosRef.current = { x, y };
    }
  }, [callback, delay]);

  return handleTap;
}

export default useSeatingGestures;
