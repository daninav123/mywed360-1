/**
 * Auto-fix: Limpia automáticamente tokens expirados
 * Se ejecuta al iniciar la aplicación
 */

import { auth } from '../firebaseConfig';

const TOKEN_STORAGE_KEY = 'mw360_auth_token';
const LAST_FIX_KEY = 'mw360_last_auth_fix';

/**
 * Limpia token expirado de localStorage
 */
function clearExpiredToken() {
  try {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    
    if (!storedToken) {
      console.log('[autoFixAuth] ✅ No hay token almacenado');
      return false;
    }

    // Intentar decodificar y verificar expiración
    try {
      const parts = storedToken.split('.');
      if (parts.length !== 3) {
        console.log('[autoFixAuth] 🗑️ Token con formato inválido, limpiando...');
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        return true;
      }

      const payload = JSON.parse(atob(parts[1]));
      const exp = new Date(payload.exp * 1000);
      const now = new Date();

      if (exp < now) {
        console.log('[autoFixAuth] 🗑️ Token expirado detectado, limpiando...');
        console.log('[autoFixAuth]   - Expiró:', exp.toLocaleString());
        console.log('[autoFixAuth]   - Ahora:', now.toLocaleString());
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        return true;
      } else {
        const timeLeft = Math.floor((exp - now) / 1000 / 60);
        return false;
      }
    } catch (decodeError) {
      console.log('[autoFixAuth] 🗑️ Error decodificando token, limpiando...');
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return true;
    }
  } catch (error) {
    console.error('[autoFixAuth] Error en clearExpiredToken:', error);
    return false;
  }
}

/**
 * Verifica si Firebase Auth está listo y obtiene token fresco
 */
async function ensureFreshToken() {
  try {
    // Esperar a que Firebase Auth esté listo
    await new Promise((resolve) => {
      if (auth?.currentUser) {
        resolve();
      } else {
        const unsubscribe = auth?.onAuthStateChanged((user) => {
          unsubscribe?.();
          resolve();
        });
        // Timeout de 5 segundos
        setTimeout(resolve, 5000);
      }
    });

    const user = auth?.currentUser;
    
    if (!user) {
      console.log('[autoFixAuth] ℹ️ No hay usuario autenticado');
      return null;
    }

    console.log('[autoFixAuth] 👤 Usuario detectado:', user.email);

    // Obtener token fresco
    try {
      const token = await user.getIdToken(true);
      if (token) {
        console.log('[autoFixAuth] ✅ Token fresco obtenido');
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        
        // Mostrar tiempo de expiración
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const exp = new Date(payload.exp * 1000);
          console.log('[autoFixAuth]   - Expira:', exp.toLocaleString());
        } catch {}
        
        return token;
      }
    } catch (tokenError) {
      console.error('[autoFixAuth] ❌ Error obteniendo token fresco:', tokenError);
      return null;
    }
  } catch (error) {
    console.error('[autoFixAuth] Error en ensureFreshToken:', error);
    return null;
  }
}

/**
 * Auto-fix principal: se ejecuta al cargar la app
 */
export async function autoFixAuth() {
  console.log('[autoFixAuth] 🔧 Iniciando auto-fix de autenticación...');
  
  try {
    // Verificar si ya se ejecutó recientemente (evitar múltiples ejecuciones)
    const lastFix = localStorage.getItem(LAST_FIX_KEY);
    if (lastFix) {
      const lastFixTime = new Date(parseInt(lastFix));
      const now = new Date();
      const timeSinceLastFix = (now - lastFixTime) / 1000; // segundos
      
      if (timeSinceLastFix < 10) {
        console.log('[autoFixAuth] ⏭️ Auto-fix ejecutado hace menos de 10s, omitiendo...');
        return;
      }
    }

    // Marcar última ejecución
    localStorage.setItem(LAST_FIX_KEY, Date.now().toString());

    // Paso 1: Limpiar token expirado
    const wasExpired = clearExpiredToken();
    
    if (wasExpired) {
      console.log('[autoFixAuth] 🔄 Token expirado fue limpiado, obteniendo uno nuevo...');
    }

    // Paso 2: Asegurar que hay token fresco
    const freshToken = await ensureFreshToken();
    
    if (freshToken) {
      console.log('[autoFixAuth] ✅ Auto-fix completado exitosamente');
    } else if (!auth?.currentUser) {
      console.log('[autoFixAuth] ℹ️ No hay usuario autenticado, auto-fix no necesario');
    } else {
      console.log('[autoFixAuth] ⚠️ Auto-fix completado pero no se pudo obtener token');
    }
  } catch (error) {
    console.error('[autoFixAuth] ❌ Error en auto-fix:', error);
  }
}

/**
 * Configurar auto-fix para ejecutarse periódicamente
 */
export function setupAutoFix() {
  console.log('[autoFixAuth] 🔧 Configurando auto-fix periódico...');
  
  // Ejecutar inmediatamente
  autoFixAuth();
  
  // Ejecutar cada 5 minutos para mantener token fresco
  const interval = setInterval(() => {
    autoFixAuth();
  }, 5 * 60 * 1000); // 5 minutos
  
  // Limpiar interval al desmontar (si se usa en React)
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      clearInterval(interval);
    });
  }
  
  return () => clearInterval(interval);
}

export default autoFixAuth;
