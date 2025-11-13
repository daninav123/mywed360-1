/**
 * Sistema de Logging Centralizado
 * Reemplaza todos los console.log del proyecto
 * Controla niveles de log según el entorno
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
};

const LOG_COLORS = {
  ERROR: 'color: #ff4444; font-weight: bold;',
  WARN: 'color: #ffaa00; font-weight: bold;',
  INFO: 'color: #0099ff;',
  DEBUG: 'color: #666666;',
  TRACE: 'color: #999999;',
};

class Logger {
  constructor() {
    // Determinar nivel de log según entorno
    this.level = this.getLogLevel();
    this.isDevelopment = import.meta.env.DEV;
    this.isProduction = import.meta.env.PROD;
    this.enableConsole = import.meta.env.VITE_ENABLE_CONSOLE === 'true';

    // Buffer para almacenar logs en producción
    this.buffer = [];
    this.maxBufferSize = 100;
  }

  getLogLevel() {
    const envLevel = import.meta.env.VITE_LOG_LEVEL?.toUpperCase();

    // En producción, solo errores y warnings por defecto
    if (import.meta.env.PROD) {
      return LOG_LEVELS[envLevel] ?? LOG_LEVELS.WARN;
    }

    // En desarrollo, mostrar todo por defecto
    return LOG_LEVELS[envLevel] ?? LOG_LEVELS.DEBUG;
  }

  shouldLog(level) {
    return LOG_LEVELS[level] <= this.level;
  }

  formatMessage(level, module, message, data) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      level,
      module,
      message,
      data,
      url: window?.location?.href,
      userAgent: navigator?.userAgent,
    };
  }

  log(level, module, message, data = null) {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatMessage(level, module, message, data);

    // En desarrollo, usar console con colores
    if (this.isDevelopment || this.enableConsole) {
      const prefix = `[${logEntry.timestamp.split('T')[1].split('.')[0]}] [${module}]`;
      const style = LOG_COLORS[level];

      switch (level) {
        case 'ERROR':
          console.error(`%c${prefix} ${message}`, style, data);
          break;
        case 'WARN':
          console.warn(`%c${prefix} ${message}`, style, data);
          break;
        default:
          if (this.isDevelopment) {
            console.log(`%c${prefix} ${message}`, style, data);
          }
      }
    }

    // En producción, almacenar en buffer y enviar al backend
    if (this.isProduction) {
      this.buffer.push(logEntry);

      // Limitar tamaño del buffer
      if (this.buffer.length > this.maxBufferSize) {
        this.buffer.shift();
      }

      // Enviar errores críticos inmediatamente
      if (level === 'ERROR') {
        this.sendToBackend([logEntry]);
      }
    }
  }

  async sendToBackend(entries = null) {
    const logsToSend = entries || this.buffer;
    if (logsToSend.length === 0) return;

    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToSend }),
      });

      if (response.ok && !entries) {
        // Limpiar buffer si se enviaron todos los logs
        this.buffer = [];
      }
    } catch (error) {
      // Silenciar errores de envío de logs
    }
  }

  // Métodos de conveniencia
  error(module, message, data) {
    this.log('ERROR', module, message, data);
  }

  warn(module, message, data) {
    this.log('WARN', module, message, data);
  }

  info(module, message, data) {
    this.log('INFO', module, message, data);
  }

  debug(module, message, data) {
    this.log('DEBUG', module, message, data);
  }

  trace(module, message, data) {
    this.log('TRACE', module, message, data);
  }

  // Método para capturar errores globales
  captureError(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context,
    };

    this.error('GlobalError', error.message, errorData);

    // En producción, enviar inmediatamente
    if (this.isProduction) {
      this.sendToBackend();
    }
  }

  // Método para flush manual de logs
  async flush() {
    if (this.buffer.length > 0) {
      await this.sendToBackend();
    }
  }

  // Obtener logs almacenados (útil para debugging)
  getLogs() {
    return [...this.buffer];
  }

  // Limpiar logs almacenados
  clear() {
    this.buffer = [];
  }

  // Método para medir performance
  time(label) {
    if (this.isDevelopment) {
      performance.mark(`${label}-start`);
    }
  }

  timeEnd(label, module = 'Performance') {
    if (this.isDevelopment) {
      performance.mark(`${label}-end`);
      try {
        performance.measure(label, `${label}-start`, `${label}-end`);
        const measure = performance.getEntriesByName(label)[0];
        this.debug(module, `${label}: ${measure.duration.toFixed(2)}ms`);
        performance.clearMarks(`${label}-start`);
        performance.clearMarks(`${label}-end`);
        performance.clearMeasures(label);
      } catch (e) {
        // Silenciar errores de medición
      }
    }
  }
}

// Crear instancia singleton
const logger = new Logger();

// Configurar captura de errores globales
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.captureError(event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.captureError(new Error(event.reason), {
      type: 'unhandledRejection',
      promise: event.promise,
    });
  });

  // Enviar logs pendientes antes de cerrar la página
  window.addEventListener('beforeunload', () => {
    logger.flush();
  });
}

// Exportar logger y métodos de conveniencia
export default logger;

// Exportar funciones directas para facilitar migración
export const logError = (module, message, data) => logger.error(module, message, data);
export const logWarn = (module, message, data) => logger.warn(module, message, data);
export const logInfo = (module, message, data) => logger.info(module, message, data);
export const logDebug = (module, message, data) => logger.debug(module, message, data);
export const logTrace = (module, message, data) => logger.trace(module, message, data);
