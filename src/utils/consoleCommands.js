/*
  Registro de comandos de consola para diagnóstico y utilidades.
  Se carga automáticamente desde src/main.jsx.
*/

// Aseguramos que no se ejecute en entornos donde window no está disponible (SSR tests)
if (typeof window !== 'undefined') {
  // Espacio global para evitar colisiones
  window.mywed = window.mywed || {};

  /**
   * Ejecuta todas las comprobaciones de diagnóstico disponibles.
   * Ejemplo de uso en consola: mywed.checkAll()
   */
  window.mywed.checkAll = async () => {
    try {
      const diagService = await import('../services/diagnosticService.js');
      const report = await diagService.default.runFullDiagnostics?.();
      console.info('✅ Diagnóstico completo ejecutado', report);
      return report;
    } catch (err) {
      console.error('❌ Error al ejecutar checkAll()', err);
      throw err;
    }
  };

  /**
   * Limpia todos los logs del panel de diagnóstico.
   */
  window.mywed.clearDiagnostics = () => {
    try {
      const errorLogger = window.errorLogger;
      if (errorLogger?.clearAll) {
        errorLogger.clearAll();
        console.log('🗑️ Diagnósticos limpiados');
      }
    } catch (err) {
      console.error('Error limpiando diagnósticos', err);
    }
  };

  console.info(
    '✅  Comandos de consola MaLoveApp registrados: mywed.checkAll(), mywed.clearDiagnostics()'
  );
}

/**
 * Comandos de Consola para Diagnóstico y Debugging
 * Proporciona comandos fáciles de usar desde la consola del navegador
 */

import errorLogger from './errorLogger';
// Carga perezosa para evitar doble import (estático + dinámico)
let __diagnosticSvc = null;
async function getDiagnosticService() {
  if (__diagnosticSvc) return __diagnosticSvc;
  const mod = await import('../services/diagnosticService');
  __diagnosticSvc = mod.default || mod;
  return __diagnosticSvc;
}

class ConsoleCommands {
  constructor() {
    this.setupCommands();
  }

  setupCommands() {
    // Hacer comandos disponibles globalmente
    window.mywed = {
      // Diagnósticos rápidos
      checkAll: () => this.checkAll(),
      checkEmails: () => this.checkEmails(),
      checkAI: () => this.checkAI(),
      checkFirebase: () => this.checkFirebase(),
      
      // Diagnóstico específico de sesión admin
      checkAdminSession: () => this.checkAdminSession(),
      testAdminRestore: () => this.testAdminRestore(),
      showAdminStorage: () => this.showAdminStorage(),
      clearAdminSession: () => this.clearAdminSession(),

      // Gestión de errores
      errors: () => this.showErrors(),
      clearErrors: () => this.clearErrors(),
      copyErrors: () => this.copyErrors(),

      // Información del sistema
      info: () => this.showSystemInfo(),
      env: () => this.showEnvironment(),

      // Utilidades
      help: () => this.showHelp(),
      reload: () => this.reloadApp(),

      // Acceso directo a servicios
      logger: errorLogger,
      diagnostic: undefined,
    };

    // Cargar servicio en background y exponerlo cuando esté listo
    getDiagnosticService().then((svc) => {
      try {
        window.mywed.diagnostic = svc;
      } catch {}
    });

    // Mostrar mensaje de bienvenida
    this.showWelcomeMessage();
  }

  showWelcomeMessage() {
    console.log(`
✅ MaLoveApp - Sistema de Diagnóstico Activado
===

Comandos disponibles:
→ mywed.help()        - Mostrar ayuda completa
→ mywed.checkAll()    - Diagnóstico completo
→ mywed.errors()      - Ver errores recientes
→ mywed.info()        - Información del sistema

💡 Tip: Usa mywed.help() para ver todos los comandos
    `);
  }

  async checkAll() {
    console.log('✅ Ejecutando diagnóstico completo...');

    try {
      const diagnosticService = await getDiagnosticService();
      const results = await diagnosticService.runFullDiagnostic();

      console.group('📊 RESULTADOS DEL DIAGNÓSTICO COMPLETO');
      console.log('Timestamp:', new Date().toLocaleString());
      console.log('Resultados:', results);

      // Resumen
      const services = ['email', 'ai', 'firebase'];
      const summary = services
        .map((service) => {
          const status = results[service]?.status || 'unknown';
          const icon = status === 'success' ? '✅' : status === 'warning' ? '⚠️' : '❌';
          return `${icon} ${service}`;
        })
        .join(' | ');

      console.log('Resumen:', summary);
      console.groupEnd();

      return results;
    } catch (error) {
      console.error('❌ Error en diagnóstico completo:', error);
      return { error: error.message };
    }
  }

  async checkEmails() {
    console.log('📧 Diagnosticando sistema de emails...');

    try {
      const diagnosticService = await getDiagnosticService();
      const result = await diagnosticService.diagnoseEmailSystem();

      console.group('📧 DIAGNÓSTICO DE EMAILS');
      console.log('Mailgun Config:', result.mailgunConfig);
      console.log('Backend Routes:', result.backendMailRoutes);
      console.log('Email Database:', result.emailDatabase);
      console.log('Webhooks:', result.webhooks);
      console.groupEnd();

      return result;
    } catch (error) {
      console.error('❌ Error en diagnóstico de emails:', error);
      return { error: error.message };
    }
  }

  async checkAI() {
    console.log('🤖 Diagnosticando chat IA...');

    try {
      const diagnosticService = await getDiagnosticService();
      const result = await diagnosticService.diagnoseAIChat();

      console.group('🤖 DIAGNÓSTICO DE IA');
      console.log('OpenAI Config:', result.openaiConfig);
      console.log('Backend AI Routes:', result.backendAIRoutes);
      console.log('API Quota:', result.apiQuota);
      console.groupEnd();

      return result;
    } catch (error) {
      console.error('❌ Error en diagnóstico de IA:', error);
      return { error: error.message };
    }
  }

  async checkFirebase() {
    console.log('🔥 Diagnosticando Firebase...');

    try {
      const diagnosticService = await getDiagnosticService();
      const result = await diagnosticService.diagnoseFirebase();

      console.group('🔥 DIAGNÓSTICO DE FIREBASE');
      console.log('Authentication:', result.authentication);
      console.log('Firestore:', result.firestore);
      console.log('Storage:', result.storage);
      console.log('Rules:', result.rules);
      console.groupEnd();

      return result;
    } catch (error) {
      console.error('❌ Error en diagnóstico de Firebase:', error);
      return { error: error.message };
    }
  }

  showErrors() {
    const errors = errorLogger.errors;
    const stats = errorLogger.getErrorStats();

    console.group('🚨 ERRORES DEL SISTEMA');
    console.log(`Total de errores: ${stats.total}`);
    console.log(`Errores recientes (5min): ${stats.recent}`);

    if (stats.total > 0) {
      console.log('\nPor tipo:');
      Object.entries(stats.byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

      console.log('\nÚltimos 5 errores:');
      errors.slice(-5).forEach((error, index) => {
        console.log(
          `${index + 1}. [${new Date(error.timestamp).toLocaleTimeString()}] ${error.type}`
        );
        console.log('   Detalles:', error.details);
      });
    } else {
      console.log('✅ No hay errores registrados');
    }

    console.groupEnd();

    return { errors, stats };
  }

  clearErrors() {
    const count = errorLogger.errors.length;
    errorLogger.errors = [];
    console.log(`🗑️ ${count} errores eliminados`);
    return true;
  }

  async copyErrors() {
    try {
      await errorLogger.copyErrorsToClipboard();
      console.log('📋 Reporte de errores copiado al portapapeles');
      return true;
    } catch (error) {
      console.error('❌ Error al copiar:', error);
      return false;
    }
  }

  showSystemInfo() {
    const info = {
      timestamp: new Date().toISOString(),
      environment: {
        mode: import.meta.env.MODE,
        dev: import.meta.env.DEV,
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
      diagnostics: errorLogger.diagnostics,
      errorStats: errorLogger.getErrorStats(),
    };

    console.group('ℹ️ INFORMACIÓN DEL SISTEMA');
    console.log('Modo:', info.environment.mode);
    console.log('Desarrollo:', info.environment.dev);
    console.log('URL:', info.environment.url);
    console.log('User Agent:', info.environment.userAgent);
    console.log('\nEstado de servicios:');

    Object.entries(info.diagnostics).forEach(([service, data]) => {
      const icon = data.status === 'success' ? '✅' : data.status === 'warning' ? '⚠️' : '❌';
      console.log(`  ${icon} ${service}: ${data.status}`);
    });

    console.log('\nEstadísticas de errores:', info.errorStats);
    console.groupEnd();

    return info;
  }

  showEnvironment() {
    const env = {
      // Variables críticas (sin mostrar valores completos por seguridad)
      firebase: {
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
      },
      backend: {
        url: import.meta.env.VITE_BACKEND_BASE_URL,
        hasConnection: !!import.meta.env.VITE_BACKEND_BASE_URL,
      },
      openai: {
        hasApiKey: !!import.meta.env.VITE_OPENAI_API_KEY,
        keyPrefix: import.meta.env.VITE_OPENAI_API_KEY?.substring(0, 10) + '...',
      },
      mailgun: {
        domain: import.meta.env.VITE_MAILGUN_DOMAIN,
        sendingDomain: import.meta.env.VITE_MAILGUN_SENDING_DOMAIN,
        hasApiKey: !!import.meta.env.VITE_MAILGUN_API_KEY,
        euRegion: import.meta.env.VITE_MAILGUN_EU_REGION,
      },
    };

    console.group('🔐 VARIABLES DE ENTORNO');
    console.log('Firebase:', env.firebase);
    console.log('Backend:', env.backend);
    console.log('OpenAI:', env.openai);
    console.log('Mailgun:', env.mailgun);
    console.groupEnd();

    return env;
  }

  showHelp() {
    console.log(`
📖 MaLoveApp - Comandos de Diagnóstico
===

DIAGNÓSTICOS:
→ mywed.checkAll()      - Diagnóstico completo del sistema
→ mywed.checkEmails()   - Diagnosticar sistema de emails
→ mywed.checkAI()       - Diagnosticar chat IA
→ mywed.checkFirebase() - Diagnosticar Firebase

SESIÓN ADMIN 🔐:
→ mywed.checkAdminSession()  - Diagnóstico completo de sesión admin
→ mywed.testAdminRestore()   - Simular restauración de sesión
→ mywed.showAdminStorage()   - Ver todo el localStorage admin
→ mywed.clearAdminSession()  - Limpiar sesión admin

ERRORES:
→ mywed.errors()        - Mostrar errores recientes
→ mywed.clearErrors()   - Limpiar todos los errores
→ mywed.copyErrors()    - Copiar reporte al portapapeles

INFORMACIÓN:
→ mywed.info()          - Información del sistema
→ mywed.env()           - Variables de entorno
→ mywed.help()          - Mostrar esta ayuda

UTILIDADES:
→ mywed.reload()        - Recargar aplicación
→ mywed.logger          - Acceso directo al logger
→ mywed.diagnostic      - Acceso directo al servicio de diagnóstico

EJEMPLOS DE USO:
→ mywed.checkAdminSession()  // ¿Por qué pide contraseña cada vez?
→ mywed.testAdminRestore()   // Simular restauración paso a paso
→ mywed.checkEmails()        // Verificar por qué no cargan los emails
→ mywed.checkAI()            // Verificar por qué no funciona el chat IA
→ mywed.errors()             // Ver todos los errores
→ mywed.copyErrors()         // Copiar errores para enviar al desarrollador

💡 Todos los comandos devuelven promesas y pueden usarse con await
📊 Los resultados se muestran tanto en consola como se devuelven como objetos
    `);
  }

  reloadApp() {
    console.log('🔄 Recargando aplicación...');
    window.location.reload();
  }

  // ========================================
  // DIAGNÓSTICO DE SESIÓN ADMIN
  // ========================================

  checkAdminSession() {
    console.group('🔍 DIAGNÓSTICO COMPLETO DE SESIÓN ADMIN');
    
    const ADMIN_SESSION_FLAG = 'isAdminAuthenticated';
    const ADMIN_PROFILE_KEY = 'MaLoveApp_admin_profile';
    const ADMIN_SESSION_TOKEN_KEY = 'MaLoveApp_admin_session_token';
    const ADMIN_SESSION_EXPIRES_KEY = 'MaLoveApp_admin_session_expires';
    const ADMIN_SESSION_ID_KEY = 'MaLoveApp_admin_session_id';
    
    // 1. Verificar existencia de claves
    console.log('\n📋 1. CLAVES EN LOCALSTORAGE:');
    const keys = {
      isAdminAuthenticated: localStorage.getItem(ADMIN_SESSION_FLAG),
      adminProfile: localStorage.getItem(ADMIN_PROFILE_KEY),
      sessionToken: localStorage.getItem(ADMIN_SESSION_TOKEN_KEY),
      sessionExpires: localStorage.getItem(ADMIN_SESSION_EXPIRES_KEY),
      sessionId: localStorage.getItem(ADMIN_SESSION_ID_KEY),
    };
    
    console.table({
      'Flag Autenticado': { existe: !!keys.isAdminAuthenticated, valor: keys.isAdminAuthenticated },
      'Perfil Admin': { existe: !!keys.adminProfile, tamaño: keys.adminProfile?.length || 0 },
      'Token Sesión': { existe: !!keys.sessionToken, tamaño: keys.sessionToken?.length || 0 },
      'Expira En': { existe: !!keys.sessionExpires, valor: keys.sessionExpires },
      'Session ID': { existe: !!keys.sessionId, valor: keys.sessionId },
    });
    
    // 2. Parsear y validar valores
    console.log('\n🔍 2. VALIDACIÓN DE VALORES:');
    
    let profile = null;
    try {
      if (keys.adminProfile) {
        profile = JSON.parse(keys.adminProfile);
        console.log('✅ Profile parseado correctamente:', profile);
      } else {
        console.error('❌ No hay perfil guardado');
      }
    } catch (e) {
      console.error('❌ Error parseando profile:', e);
    }
    
    // 3. Validar timestamp de expiración
    console.log('\n⏰ 3. VALIDACIÓN DE EXPIRACIÓN:');
    if (keys.sessionExpires) {
      const rawExpires = keys.sessionExpires;
      console.log('Valor raw:', rawExpires);
      console.log('Tipo:', typeof rawExpires);
      
      const timestamp = parseInt(rawExpires, 10);
      console.log('Timestamp parseado:', timestamp);
      console.log('¿Es número válido?:', !isNaN(timestamp));
      
      if (!isNaN(timestamp)) {
        const expiresAt = new Date(timestamp);
        const now = Date.now();
        const diff = timestamp - now;
        const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        console.log('Fecha de expiración:', expiresAt.toLocaleString());
        console.log('Fecha actual:', new Date(now).toLocaleString());
        console.log('Tiempo restante:', `${diffDays} días, ${diffHours} horas`);
        
        if (timestamp <= now) {
          console.error('❌ LA SESIÓN HA EXPIRADO');
        } else {
          console.log('✅ Sesión válida');
        }
      } else {
        console.error('❌ Timestamp inválido - NO se puede parsear');
      }
    } else {
      console.error('❌ No hay fecha de expiración guardada');
    }
    
    // 4. Verificar role del profile
    console.log('\n👤 4. VALIDACIÓN DE ROL:');
    if (profile) {
      console.log('Role en profile:', profile.role);
      if (profile.role === 'admin') {
        console.log('✅ Role admin correcto');
      } else {
        console.error('❌ Role NO es admin:', profile.role);
      }
    } else {
      console.error('❌ No se puede validar role (profile no existe)');
    }
    
    // 5. Resumen final
    console.log('\n📊 5. RESUMEN:');
    const hasFlag = !!keys.isAdminAuthenticated;
    const hasProfile = !!keys.adminProfile;
    const hasToken = !!keys.sessionToken;
    const hasExpires = !!keys.sessionExpires;
    const profileValid = profile && profile.role === 'admin';
    const sessionValid = keys.sessionExpires && 
      !isNaN(parseInt(keys.sessionExpires, 10)) && 
      parseInt(keys.sessionExpires, 10) > Date.now();
    
    const issues = [];
    if (!hasFlag) issues.push('Falta flag de autenticación');
    if (!hasProfile) issues.push('Falta perfil admin');
    if (!hasToken) issues.push('Falta token de sesión');
    if (!hasExpires) issues.push('Falta fecha de expiración');
    if (!profileValid) issues.push('Profile inválido o role incorrecto');
    if (!sessionValid) issues.push('Sesión expirada o timestamp inválido');
    
    if (issues.length === 0) {
      console.log('✅ TODO CORRECTO - La sesión debería restaurarse');
    } else {
      console.error('❌ PROBLEMAS DETECTADOS:');
      issues.forEach(issue => console.error(`   → ${issue}`));
    }
    
    console.groupEnd();
    
    return {
      hasFlag,
      hasProfile,
      hasToken,
      hasExpires,
      profileValid,
      sessionValid,
      issues,
      keys,
      profile,
    };
  }

  testAdminRestore() {
    console.group('🧪 TEST DE RESTAURACIÓN DE SESIÓN ADMIN');
    
    const ADMIN_SESSION_FLAG = 'isAdminAuthenticated';
    const ADMIN_PROFILE_KEY = 'MaLoveApp_admin_profile';
    const ADMIN_SESSION_TOKEN_KEY = 'MaLoveApp_admin_session_token';
    const ADMIN_SESSION_EXPIRES_KEY = 'MaLoveApp_admin_session_expires';
    const ADMIN_SESSION_ID_KEY = 'MaLoveApp_admin_session_id';
    
    console.log('Simulando función restoreAdminSession()...\n');
    
    try {
      const isAdminSession = localStorage.getItem(ADMIN_SESSION_FLAG);
      const rawProfile = localStorage.getItem(ADMIN_PROFILE_KEY);
      const storedToken = localStorage.getItem(ADMIN_SESSION_TOKEN_KEY);
      
      console.log('PASO 1: Verificar flag y profile');
      if (!isAdminSession || !rawProfile) {
        console.error('❌ FALLO: isAdminSession o rawProfile falta');
        console.log('isAdminSession:', isAdminSession);
        console.log('rawProfile:', !!rawProfile);
        console.groupEnd();
        return false;
      }
      console.log('✅ Flag y profile existen');
      
      console.log('\nPASO 2: Parsear profile');
      const profile = JSON.parse(rawProfile);
      if (!profile || profile.role !== 'admin') {
        console.error('❌ FALLO: Profile inválido o role no es admin');
        console.log('profile:', profile);
        console.groupEnd();
        return false;
      }
      console.log('✅ Profile válido:', profile);
      
      console.log('\nPASO 3: Leer y parsear expiración');
      const rawExpires = localStorage.getItem(ADMIN_SESSION_EXPIRES_KEY);
      const sessionId = localStorage.getItem(ADMIN_SESSION_ID_KEY);
      
      console.log('rawExpires:', rawExpires);
      console.log('sessionId:', sessionId);
      
      let expiresAt = null;
      if (rawExpires) {
        const timestamp = parseInt(rawExpires, 10);
        console.log('timestamp parseado:', timestamp);
        console.log('¿Es número?:', !isNaN(timestamp));
        
        if (!isNaN(timestamp)) {
          expiresAt = new Date(timestamp);
          console.log('expiresAt creado:', expiresAt);
          console.log('expiresAt.toLocaleString():', expiresAt.toLocaleString());
        }
      }
      
      console.log('\nPASO 4: Verificar si expiró');
      if (expiresAt && expiresAt.getTime() <= Date.now()) {
        console.error('❌ FALLO: Sesión expirada');
        console.log('expiresAt:', expiresAt.getTime());
        console.log('now:', Date.now());
        console.log('diff:', expiresAt.getTime() - Date.now());
        console.groupEnd();
        return false;
      }
      console.log('✅ Sesión NO expirada');
      
      console.log('\nPASO 5: Crear adminUser object');
      const adminUser = {
        uid: profile.id || 'admin-local',
        email: profile.email || 'admin@maloveapp.com',
        displayName: profile.name || 'Administrador MaLoveApp',
      };
      console.log('adminUser creado:', adminUser);
      
      console.log('\n🎉 ¡RESTAURACIÓN EXITOSA!');
      console.log('La sesión DEBERÍA restaurarse correctamente');
      console.log('\nDatos que se setearían:');
      console.log('- currentUser:', adminUser);
      console.log('- userProfile:', profile);
      console.log('- adminSessionToken:', storedToken ? 'exists' : 'null');
      console.log('- adminSessionExpiry:', expiresAt);
      console.log('- adminSessionId:', sessionId);
      
      console.groupEnd();
      return true;
      
    } catch (error) {
      console.error('❌ ERROR EN RESTAURACIÓN:', error);
      console.error('Stack:', error.stack);
      console.groupEnd();
      return false;
    }
  }

  showAdminStorage() {
    console.group('📦 CONTENIDO COMPLETO DE LOCALSTORAGE (ADMIN)');
    
    const adminKeys = Object.keys(localStorage).filter(key => 
      key.includes('admin') || 
      key.includes('Admin') || 
      key.includes('isAuthenticated') ||
      key.includes('MaLoveApp_admin')
    );
    
    console.log(`Total de claves relacionadas con admin: ${adminKeys.length}\n`);
    
    adminKeys.forEach(key => {
      const value = localStorage.getItem(key);
      console.group(key);
      console.log('Valor:', value);
      console.log('Longitud:', value?.length || 0);
      console.log('Tipo:', typeof value);
      
      // Intentar parsear JSON
      if (value && (value.startsWith('{') || value.startsWith('['))) {
        try {
          const parsed = JSON.parse(value);
          console.log('Parseado:', parsed);
        } catch (e) {
          console.log('No es JSON válido');
        }
      }
      
      console.groupEnd();
    });
    
    console.groupEnd();
    
    return adminKeys.map(key => ({
      key,
      value: localStorage.getItem(key),
      length: localStorage.getItem(key)?.length || 0,
    }));
  }

  clearAdminSession() {
    console.log('🗑️ Limpiando sesión admin de localStorage...');
    
    const keys = [
      'isAdminAuthenticated',
      'MaLoveApp_admin_profile',
      'MaLoveApp_admin_session_token',
      'MaLoveApp_admin_session_expires',
      'MaLoveApp_admin_session_id',
    ];
    
    keys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`✅ Eliminado: ${key}`);
    });
    
    console.log('\n✅ Sesión admin limpiada completamente');
    console.log('Recarga la página para volver al login');
    
    return true;
  }
}

// Inicializar comandos
const consoleCommands = new ConsoleCommands();

export default consoleCommands;
