// src/utils/whDebug.js
// Utilidad simple de depuración para el flujo de WhatsApp
// Activa/desactiva en tiempo real desde la consola: window.whDebug = true/false

if (typeof window !== 'undefined' && typeof window.whDebug === 'undefined') {
  try {
    // Por defecto activo en desarrollo
    // Puedes desactivarlo manualmente con: window.whDebug = false
    window.whDebug = true;
  } catch {}
}

export function wh(step, data = {}) {
  try {
    if (typeof window !== 'undefined' && window.whDebug === false) return;
  } catch {}
  const ts = new Date().toISOString().split('T')[1]?.slice(0, 8);
  try {
    console.groupCollapsed(`[WH] ${ts} – ${step}`);
    if (data && typeof data === 'object' && Object.keys(data).length) {
      console.table(data);
    } else if (data !== undefined) {
      // console.log(data);
    }
    console.groupEnd();
  } catch (e) {
    // console.log(`[WH] ${step}`, data);
  }
}

export default wh;
