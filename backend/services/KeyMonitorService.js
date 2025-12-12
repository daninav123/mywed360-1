/**
 * Servicio de monitorización de API keys
 * Verifica el estado, uso y expiración de todas las API keys
 */

import logger from '../utils/logger.js';

class KeyMonitorService {
  constructor() {
    this.keys = [
      {
        name: 'OpenAI',
        envVar: 'OPENAI_API_KEY',
        prefix: 'sk-proj-',
        testUrl: 'https://api.openai.com/v1/models',
        critical: true,
        rotationDays: 90,
      },
      {
        name: 'Tavily',
        envVar: 'TAVILY_API_KEY',
        prefix: 'tvly-',
        testUrl: 'https://api.tavily.com/search',
        critical: true,
        rotationDays: 90,
      },
      {
        name: 'Stripe (Secret)',
        envVar: 'STRIPE_SECRET_KEY',
        prefix: 'sk_',
        testUrl: 'https://api.stripe.com/v1/charges',
        critical: true,
        rotationDays: 180,
      },
      {
        name: 'Stripe (Publishable)',
        envVar: 'STRIPE_PUBLISHABLE_KEY',
        prefix: 'pk_',
        testUrl: null,
        critical: false,
        rotationDays: 180,
      },
      {
        name: 'Mailgun',
        envVar: 'MAILGUN_API_KEY',
        prefix: null,
        testUrl: null,
        critical: false,
        rotationDays: 180,
      },
      {
        name: 'Firebase',
        envVar: 'FIREBASE_API_KEY',
        prefix: null,
        testUrl: null,
        critical: false,
        rotationDays: 180,
      },
      {
        name: 'Twilio',
        envVar: 'TWILIO_AUTH_TOKEN',
        prefix: null,
        testUrl: null,
        critical: false,
        rotationDays: 180,
      },
      {
        name: 'Google Places',
        envVar: 'GOOGLE_PLACES_API_KEY',
        prefix: 'AIza',
        testUrl: null,
        critical: false,
        rotationDays: 180,
      },
    ];

    this.statusCache = new Map();
    this.lastCheckTime = new Map();
  }

  /**
   * Verificar estado de una API key
   */
  async checkKeyStatus(keyConfig) {
    const key = process.env[keyConfig.envVar];

    if (!key) {
      return {
        name: keyConfig.name,
        status: 'missing',
        message: 'API key not configured',
        critical: keyConfig.critical,
        timestamp: new Date().toISOString(),
      };
    }

    // Verificar prefijo
    if (keyConfig.prefix && !key.startsWith(keyConfig.prefix)) {
      return {
        name: keyConfig.name,
        status: 'invalid_format',
        message: `Invalid format (expected: ${keyConfig.prefix}...)`,
        critical: keyConfig.critical,
        timestamp: new Date().toISOString(),
      };
    }

    // Si hay URL de test, intentar validar
    if (keyConfig.testUrl) {
      try {
        const response = await fetch(keyConfig.testUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        });

        if (response.status === 401 || response.status === 403) {
          return {
            name: keyConfig.name,
            status: 'invalid',
            message: `Invalid or expired (HTTP ${response.status})`,
            critical: keyConfig.critical,
            timestamp: new Date().toISOString(),
          };
        }

        if (response.ok) {
          return {
            name: keyConfig.name,
            status: 'valid',
            message: 'Key is valid',
            critical: keyConfig.critical,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          name: keyConfig.name,
          status: 'unknown',
          message: `Unknown status (HTTP ${response.status})`,
          critical: keyConfig.critical,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          name: keyConfig.name,
          status: 'error',
          message: `Verification error: ${error.message}`,
          critical: keyConfig.critical,
          timestamp: new Date().toISOString(),
        };
      }
    }

    // Si no hay URL de test, asumir que está configurada
    return {
      name: keyConfig.name,
      status: 'configured',
      message: 'Key is configured',
      critical: keyConfig.critical,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verificar todas las API keys
   */
  async checkAllKeys() {
    const results = [];

    for (const keyConfig of this.keys) {
      const result = await this.checkKeyStatus(keyConfig);
      results.push(result);

      // Cachear resultado
      this.statusCache.set(keyConfig.name, result);
      this.lastCheckTime.set(keyConfig.name, Date.now());

      // Registrar en logs
      if (result.status === 'valid' || result.status === 'configured') {
        logger.info(`✅ ${keyConfig.name}: ${result.message}`);
      } else if (result.status === 'missing') {
        logger.warn(`⚠️ ${keyConfig.name}: ${result.message}`);
      } else {
        logger.error(`❌ ${keyConfig.name}: ${result.message}`);
      }
    }

    return results;
  }

  /**
   * Obtener estado cacheado de todas las keys
   */
  getAllStatus() {
    return Array.from(this.statusCache.values());
  }

  /**
   * Obtener estado de una key específica
   */
  getKeyStatus(keyName) {
    return this.statusCache.get(keyName);
  }

  /**
   * Verificar si hay errores críticos
   */
  hasCriticalErrors() {
    return Array.from(this.statusCache.values()).some(
      (status) =>
        status.critical &&
        (status.status === 'missing' || status.status === 'invalid')
    );
  }

  /**
   * Obtener resumen de estado
   */
  getSummary() {
    const statuses = Array.from(this.statusCache.values());

    return {
      total: statuses.length,
      valid: statuses.filter((s) => s.status === 'valid').length,
      configured: statuses.filter((s) => s.status === 'configured').length,
      missing: statuses.filter((s) => s.status === 'missing').length,
      invalid: statuses.filter((s) => s.status === 'invalid').length,
      errors: statuses.filter((s) => s.status === 'error').length,
      criticalErrors: statuses.filter(
        (s) => s.critical && s.status !== 'valid' && s.status !== 'configured'
      ).length,
      lastCheck: new Date().toISOString(),
    };
  }

  /**
   * Generar reporte de estado
   */
  generateReport() {
    const summary = this.getSummary();
    const statuses = Array.from(this.statusCache.values());

    return {
      summary,
      details: statuses,
      recommendations: this.generateRecommendations(statuses),
    };
  }

  /**
   * Generar recomendaciones basadas en el estado
   */
  generateRecommendations(statuses) {
    const recommendations = [];

    for (const status of statuses) {
      if (status.status === 'missing') {
        recommendations.push({
          severity: status.critical ? 'critical' : 'warning',
          message: `${status.name} is not configured`,
          action: `Set ${status.name} API key in environment variables`,
        });
      } else if (status.status === 'invalid') {
        recommendations.push({
          severity: status.critical ? 'critical' : 'warning',
          message: `${status.name} is invalid or expired`,
          action: `Renew ${status.name} API key and update environment variables`,
        });
      } else if (status.status === 'error') {
        recommendations.push({
          severity: 'warning',
          message: `${status.name} verification failed`,
          action: `Check ${status.name} API key and network connectivity`,
        });
      }
    }

    return recommendations;
  }

  /**
   * Iniciar monitorización periódica
   */
  startMonitoring(intervalMs = 3600000) {
    // 1 hora por defecto
    logger.info('Starting API key monitoring', { intervalMs });

    this.monitoringInterval = setInterval(async () => {
      try {
        const results = await this.checkAllKeys();
        const summary = this.getSummary();

        logger.info('API key monitoring check completed', summary);

        // Alertar si hay errores críticos
        if (this.hasCriticalErrors()) {
          logger.error('🚨 CRITICAL: API key errors detected', {
            summary,
            details: results.filter(
              (r) => r.critical && r.status !== 'valid' && r.status !== 'configured'
            ),
          });
        }
      } catch (error) {
        logger.error('Error during API key monitoring', {
          error: error.message,
          stack: error.stack,
        });
      }
    }, intervalMs);
  }

  /**
   * Detener monitorización
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      logger.info('API key monitoring stopped');
    }
  }

  /**
   * Realizar verificación inicial
   */
  async initialize() {
    logger.info('Initializing KeyMonitorService');
    await this.checkAllKeys();
    const summary = this.getSummary();

    if (this.hasCriticalErrors()) {
      logger.error('🚨 CRITICAL API KEY ERRORS DETECTED', {
        summary,
        details: this.getAllStatus().filter(
          (s) => s.critical && s.status !== 'valid' && s.status !== 'configured'
        ),
      });
    } else {
      logger.info('✅ All API keys verified', summary);
    }

    return summary;
  }
}

// Singleton instance
let instance = null;

export function getKeyMonitorService() {
  if (!instance) {
    instance = new KeyMonitorService();
  }
  return instance;
}

export default KeyMonitorService;
