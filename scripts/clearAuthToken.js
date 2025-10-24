/**
 * Script para limpiar token de autenticación expirado
 * Ejecutar en consola del navegador o como script standalone
 */

// Para ejecutar en consola del navegador
if (typeof window !== 'undefined') {
  console.log('🧹 Limpiando tokens expirados...');
  
  // Limpiar token de localStorage
  try {
    localStorage.removeItem('mw360_auth_token');
    console.log('✅ Token de localStorage eliminado');
  } catch (e) {
    console.error('❌ Error limpiando localStorage:', e);
  }
  
  // Limpiar otros datos de auth
  try {
    const keys = Object.keys(localStorage);
    const authKeys = keys.filter(k => k.includes('firebase') || k.includes('auth') || k.includes('token'));
    authKeys.forEach(key => {
      if (!key.includes('persist')) { // Mantener persistencia de sesión
        localStorage.removeItem(key);
        console.log(`✅ Eliminado: ${key}`);
      }
    });
  } catch (e) {
    console.error('❌ Error limpiando datos de auth:', e);
  }
  
  console.log('✅ Limpieza completada. Recargando página...');
  setTimeout(() => location.reload(), 500);
}

// Para ejecutar como módulo Node.js (playwright/puppeteer)
export const clearAuthTokenInBrowser = async (page) => {
  await page.evaluate(() => {
    localStorage.removeItem('mw360_auth_token');
    const keys = Object.keys(localStorage);
    const authKeys = keys.filter(k => k.includes('firebase') || k.includes('auth') || k.includes('token'));
    authKeys.forEach(key => {
      if (!key.includes('persist')) {
        localStorage.removeItem(key);
      }
    });
  });
};

console.log('✅ Script de limpieza de tokens cargado');
console.log('💡 Para usar en navegador: Copia y pega este archivo en la consola');
console.log('💡 Para usar en tests: import { clearAuthTokenInBrowser } from "./clearAuthToken.js"');
