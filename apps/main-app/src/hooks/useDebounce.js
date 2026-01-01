import { useEffect, useState } from 'react';

/**
 * Hook que retrasa la actualización de un valor hasta que haya pasado un tiempo sin cambios
 * Útil para evitar llamadas excesivas a APIs cuando el usuario está escribiendo
 * 
 * @param {any} value - El valor a observar
 * @param {number} delay - Milisegundos de retraso (default: 1000ms)
 * @returns {any} El valor debounced
 */
export function useDebounce(value, delay = 1000) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
