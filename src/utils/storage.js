import i18n from '../i18n';

// Utilidades genéricas para acceso a localStorage con manejo de JSON y fallback
// Se centraliza la lógica para evitar duplicación en los servicios.

/**
 * Carga un valor JSON desde localStorage.
 * @param {string} key - Clave de almacenamiento.
 * @param {*} defaultValue - Valor por defecto si la clave no existe o falla el parseo.
 * @returns {*} Valor almacenado o defaultValue.
 */
// Detectar implementación de localStorage disponible
export const _getStorage = () => {
  /*
   * Prioridad:
   * 1. Si existe window.localStorage (ambiente navegador o jsdom en tests), usar ese.
   * 2. Si existe globalThis.localStorage (algunos entornos de test lo definen ahí), usarlo.
   * 3. Fallback: mock vacío para evitar ReferenceError.
   */
  // Priorizar un mock de globalThis.localStorage cuando exista (entornos de test)
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  // Entornos Node/Vitest pueden exponer localStorage en "global"
  if (typeof global !== 'undefined' && global.localStorage) {
    return global.localStorage;
  }
  if (typeof window !== 'undefinedi18n.t('common.windowlocalstorage_return_windowlocalstorage_return_getitem_null')undefinedi18n.t('common.windowlocalstorage_windowlocalstorage_getstorage_const_raw_storegetitemkey')undefined' && window.localStorage ? window.localStorage : _getStorage();
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`storage.saveJson error for key ${key}:`, error);
    return false;
  }
};

/**
 * Elimina una clave de localStorage.
 * @param {string} key - Clave a eliminar.
 */
export const removeKey = (key) => {
  try {
    const store =
      typeof window !== 'undefined' && window.localStorage ? window.localStorage : _getStorage();
    store.removeItem(key);
  } catch (error) {
    console.error(`storage.removeKey error for key ${key}:`, error);
  }
};
