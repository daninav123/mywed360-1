import { useEffect, useCallback } from 'react';

/**
 * Hook para registrar shortcuts de teclado
 * @param {string} key - Tecla principal (ej: 'k', 'p', 'escape')
 * @param {function} callback - Función a ejecutar
 * @param {object} options - Opciones (ctrlKey, metaKey, shiftKey, altKey)
 */
const useKeyboardShortcut = (key, callback, options = {}) => {
  const {
    ctrlKey = false,
    metaKey = false,
    shiftKey = false,
    altKey = false,
    preventDefault = true,
  } = options;

  const handleKeyDown = useCallback((event) => {
    // Verificar si la tecla coincide
    const keyMatch = event.key.toLowerCase() === key.toLowerCase();
    
    // Verificar modificadores
    const modifiersMatch = (
      event.ctrlKey === ctrlKey &&
      event.metaKey === metaKey &&
      event.shiftKey === shiftKey &&
      event.altKey === altKey
    );

    if (keyMatch && modifiersMatch) {
      if (preventDefault) {
        event.preventDefault();
      }
      callback(event);
    }
  }, [key, callback, ctrlKey, metaKey, shiftKey, altKey, preventDefault]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

/**
 * Hook específico para Cmd/Ctrl + K (búsqueda global)
 */
export const useCmdK = (callback) => {
  useKeyboardShortcut('k', callback, {
    metaKey: true, // Cmd en Mac
    ctrlKey: false,
  });
  
  // También soportar Ctrl+K en Windows/Linux
  useKeyboardShortcut('k', callback, {
    metaKey: false,
    ctrlKey: true,
  });
};

/**
 * Hook para ESC
 */
export const useEscape = (callback) => {
  useKeyboardShortcut('Escape', callback);
};

export default useKeyboardShortcut;
