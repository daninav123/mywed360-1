# Estrategia de Fallbacks y Monitoreo - MyWed360

## Decisión Arquitectónica

**MANTENER FALLBACKS + SISTEMA DE ALERTAS EN ADMIN PANEL**

## Principios Fundamentales

### 1. Graceful Degradation
```
Funcionalidad Reducida > App Rota
```

### 2. Fail Fast en Dev, Fail Gracefully en Prod
```javascript
const FALLBACK_MODE = process.env.NODE_ENV === 'production';
```

### 3. Observabilidad Total
```
Cada fallback debe registrarse y monitorizarse
```

## Categorías de Fallbacks

### 🟢 Nivel 1: CRÍTICO - Nunca debe fallar
**Servicios:** Auth, Base de datos principal
**Estrategia:** Retry con exponential backoff + Circuit breaker
**Fallback:** Modo offline limitado (solo lectura de cache)

### 🟡 Nivel 2: IMPORTANTE - Funcionalidad reducida aceptable
**Servicios:** Búsqueda IA, Email, Notificaciones
**Estrategia:** Fallback a alternativas (demo, local, cola diferida)
**Alerta:** Sí, después de 3 activaciones en 1 hora

### 🟠 Nivel 3: OPCIONAL - Feature enhancement
**Servicios:** Métricas, Analytics, A/B testing
**Estrategia:** Silencioso, log en segundo plano
**Alerta:** Solo si tasa > 50% usuarios afectados

## Implementación del Sistema de Alertas

### Backend: Servicio de Monitoreo de Fallbacks

```javascript
// backend/services/FallbackMonitor.js
import { db } from '../firebaseAdmin.js';
import logger from '../logger.js';

class FallbackMonitor {
  constructor() {
    this.thresholds = {
      'ai-suppliers': { maxPerHour: 5, severity: 'medium' },
      'firebase-auth': { maxPerHour: 1, severity: 'critical' },
      'email-service': { maxPerHour: 10, severity: 'medium' },
      'openai-api': { maxPerHour: 3, severity: 'high' },
    };
  }

  /**
   * Registra activación de fallback
   * @param {string} service - Nombre del servicio
   * @param {object} context - Contexto del error (userId, message, etc)
   */
  async logFallback(service, context = {}) {
    const timestamp = new Date();
    const fallbackDoc = {
      service,
      timestamp,
      userId: context.userId || 'unknown',
      error: context.error || 'unknown',
      userAgent: context.userAgent || '',
      location: context.location || '',
      metadata: context.metadata || {},
    };

    try {
      // Guardar en Firestore
      await db.collection('fallbackLogs').add(fallbackDoc);

      // Verificar si excede umbral
      const recentCount = await this.getRecentFallbackCount(service, 60); // últimos 60 min
      const threshold = this.thresholds[service];

      if (threshold && recentCount >= threshold.maxPerHour) {
        await this.triggerAlert(service, recentCount, threshold.severity);
      }

      logger.info(`[FallbackMonitor] Fallback logged: ${service}`, {
        count: recentCount,
        threshold: threshold?.maxPerHour,
      });
    } catch (error) {
      logger.error('[FallbackMonitor] Failed to log fallback', { error: error.message });
    }
  }

  /**
   * Obtiene número de fallbacks recientes
   */
  async getRecentFallbackCount(service, minutes = 60) {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    const snapshot = await db
      .collection('fallbackLogs')
      .where('service', '==', service)
      .where('timestamp', '>=', since)
      .get();
    
    return snapshot.size;
  }

  /**
   * Dispara alerta en panel de admin
   */
  async triggerAlert(service, count, severity) {
    const alert = {
      type: 'fallback_threshold_exceeded',
      service,
      severity, // 'low' | 'medium' | 'high' | 'critical'
      message: `Servicio "${service}" ha activado fallback ${count} veces en la última hora`,
      count,
      timestamp: new Date(),
      resolved: false,
      actions: this.getRecommendedActions(service),
    };

    // Guardar en colección de alertas del admin
    await db.collection('adminAlerts').add(alert);

    // Notificación push a admins (opcional)
    if (severity === 'critical') {
      await this.notifyAdmins(alert);
    }

    logger.warn(`[FallbackMonitor] Alert triggered for ${service}`, alert);
  }

  /**
   * Recomendaciones automáticas según servicio
   */
  getRecommendedActions(service) {
    const actions = {
      'ai-suppliers': [
        'Verificar estado de OpenAI API',
        'Revisar logs del backend para errores de API key',
        'Considerar aumentar rate limits',
        'Verificar conectividad con api.openai.com',
      ],
      'firebase-auth': [
        '🚨 CRÍTICO: Verificar configuración Firebase inmediatamente',
        'Revisar reglas de Firestore',
        'Verificar cuotas de Firebase',
        'Comprobar service account credentials',
      ],
      'email-service': [
        'Verificar API key de Mailgun',
        'Revisar cuotas de Mailgun',
        'Comprobar configuración de dominio',
      ],
    };

    return actions[service] || ['Revisar logs del servicio', 'Verificar configuración'];
  }

  /**
   * Notifica a administradores (Slack, Email, etc)
   */
  async notifyAdmins(alert) {
    // TODO: Implementar notificación a Slack
    // TODO: Implementar email a equipo técnico
    logger.error(`[FallbackMonitor] CRITICAL ALERT: ${alert.message}`);
  }

  /**
   * Obtiene estadísticas de fallbacks para dashboard
   */
  async getStats(hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const snapshot = await db
      .collection('fallbackLogs')
      .where('timestamp', '>=', since)
      .get();

    const stats = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!stats[data.service]) {
        stats[data.service] = { count: 0, users: new Set(), errors: {} };
      }
      stats[data.service].count++;
      if (data.userId) stats[data.service].users.add(data.userId);
      
      const errorKey = data.error || 'unknown';
      stats[data.service].errors[errorKey] = (stats[data.service].errors[errorKey] || 0) + 1;
    });

    // Convertir Sets a arrays para serialización
    Object.keys(stats).forEach(service => {
      stats[service].uniqueUsers = stats[service].users.size;
      delete stats[service].users;
    });

    return stats;
  }
}

export const fallbackMonitor = new FallbackMonitor();
export default fallbackMonitor;
```

### Endpoint en Backend

```javascript
// backend/routes/fallback-monitor.js
import express from 'express';
import { fallbackMonitor } from '../services/FallbackMonitor.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/fallback-monitor/log
// Registra activación de fallback desde frontend
router.post('/log', requireAuth, async (req, res) => {
  try {
    const { service, error, metadata } = req.body;
    
    await fallbackMonitor.logFallback(service, {
      userId: req.user?.uid,
      error: error || 'unknown',
      userAgent: req.headers['user-agent'],
      metadata,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/fallback-monitor/stats
// Obtiene estadísticas (solo admins)
router.get('/stats', requireAuth, async (req, res) => {
  try {
    // TODO: Verificar que usuario es admin
    const hours = parseInt(req.query.hours) || 24;
    const stats = await fallbackMonitor.getStats(hours);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### Frontend: Hook para reportar fallbacks

```javascript
// src/hooks/useFallbackReporting.js
import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { post as apiPost } from '../services/apiClient';

export function useFallbackReporting() {
  const { user } = useAuth();

  const reportFallback = useCallback(
    async (service, error, metadata = {}) => {
      // Log local inmediato
      console.warn(`[Fallback] ${service}:`, error);

      // Reportar al backend (no bloqueante)
      try {
        await apiPost(
          '/api/fallback-monitor/log',
          {
            service,
            error: error?.message || String(error),
            metadata: {
              ...metadata,
              timestamp: new Date().toISOString(),
              userEmail: user?.email,
            },
          },
          { auth: true, silent: true }
        );
      } catch (reportError) {
        // Fallar silenciosamente al reportar
        console.debug('[useFallbackReporting] Failed to report:', reportError);
      }
    },
    [user]
  );

  return { reportFallback };
}
```

### Frontend: Uso en servicios

```javascript
// src/hooks/useAISearch.jsx
import { useFallbackReporting } from './useFallbackReporting';

export const useAISearch = () => {
  const { reportFallback } = useFallbackReporting();
  
  const searchProviders = useCallback(async (query, opts = {}) => {
    try {
      // Intento normal
      const res = await apiPost('/api/ai-suppliers', { query }, { auth: true });
      if (res?.ok) {
        return await res.json();
      }
    } catch (backendError) {
      // Detectar backend offline
      if (backendError?.message?.includes('fetch') || backendError?.name === 'TypeError') {
        // 🔔 REPORTAR FALLBACK
        await reportFallback('ai-suppliers', backendError, {
          query,
          attemptedEndpoint: '/api/ai-suppliers',
        });
        
        // 🛡️ ACTIVAR FALLBACK
        console.info('[useAISearch] Backend offline, usando resultados demo');
        const demoResults = generateDemoResults(query);
        setResults(demoResults);
        setUsedFallback(true);
        return demoResults;
      }
    }
  }, [reportFallback]);
};
```

### Admin Panel: Dashboard de Fallbacks

```jsx
// src/pages/admin/AdminFallbackMonitor.jsx
import React, { useEffect, useState } from 'react';
import { get as apiGet } from '../../services/apiClient';

export default function AdminFallbackMonitor() {
  const [stats, setStats] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [timeRange, setTimeRange] = useState(24);

  useEffect(() => {
    loadStats();
    loadAlerts();
  }, [timeRange]);

  const loadStats = async () => {
    const res = await apiGet(`/api/fallback-monitor/stats?hours=${timeRange}`, { auth: true });
    if (res.ok) {
      const data = await res.json();
      setStats(data);
    }
  };

  const loadAlerts = async () => {
    const res = await apiGet('/api/admin/alerts?type=fallback', { auth: true });
    if (res.ok) {
      const data = await res.json();
      setAlerts(data);
    }
  };

  const getSeverityColor = (severity) => {
    return {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-blue-100 text-blue-800 border-blue-300',
    }[severity] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Monitor de Fallbacks</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}
          className="border rounded px-3 py-2"
        >
          <option value={1}>Última hora</option>
          <option value={6}>Últimas 6 horas</option>
          <option value={24}>Últimas 24 horas</option>
          <option value={168}>Última semana</option>
        </select>
      </div>

      {/* Alertas Activas */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">🚨 Alertas Activas</h2>
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{alert.service}</h3>
                  <p className="text-sm mt-1">{alert.message}</p>
                  <p className="text-xs mt-2 opacity-75">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className="px-2 py-1 rounded text-xs font-semibold uppercase">
                  {alert.severity}
                </span>
              </div>
              
              {alert.actions && (
                <div className="mt-3 pt-3 border-t border-current/20">
                  <p className="text-sm font-semibold mb-2">Acciones recomendadas:</p>
                  <ul className="text-sm space-y-1">
                    {alert.actions.map((action, i) => (
                      <li key={i}>• {action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Estadísticas por Servicio */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">📊 Estadísticas</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(stats).map(([service, data]) => (
            <div key={service} className="border rounded-lg p-4 bg-white shadow">
              <h3 className="font-semibold text-lg">{service}</h3>
              <div className="mt-3 space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Activaciones:</span> {data.count}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Usuarios afectados:</span> {data.uniqueUsers}
                </p>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-semibold mb-1">Errores más comunes:</p>
                  {Object.entries(data.errors)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([error, count]) => (
                      <p key={error} className="text-xs truncate">
                        • {error} ({count}x)
                      </p>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Reglas de Oro

### ✅ HACER
1. **Siempre** tener fallback para servicios externos (OpenAI, Mailgun, APIs)
2. **Siempre** reportar cuando se activa un fallback
3. **Monitorizar** patrones de fallback (usuarios, regiones, horas)
4. **Documentar** qué hace cada fallback
5. **Probar** tanto path normal como path de fallback

### ❌ NO HACER
1. **Nunca** usar fallback como solución permanente
2. **Nunca** ignorar alertas de fallback repetidos
3. **Nunca** ocultar errores sin logging
4. **Nunca** hacer fallback silencioso en servicios críticos
5. **Nunca** asumir que "nunca va a fallar"

## Métricas Clave

### KPIs a Monitorizar
- **Tasa de Fallback**: % de requests que usan fallback
- **MTTR**: Mean Time To Resolution de alertas
- **Usuarios Impactados**: Usuarios únicos que experimentan fallbacks
- **Severidad**: Distribución de alertas por nivel

### Objetivos (SLIs)
- Fallbacks de AI < 5% de requests
- Fallbacks de Auth < 0.1% de requests
- Tiempo de resolución de alertas críticas < 30 minutos
- Tiempo de resolución de alertas medias < 4 horas

## Casos de Uso en MyWed360

### 1. Búsqueda de Proveedores (AI)
- **Fallback**: Resultados demo
- **Alerta**: Después de 5 activaciones/hora
- **Impacto UX**: Medio (funcionalidad reducida pero usable)

### 2. Autenticación Firebase
- **Fallback**: Modo offline con datos en cache
- **Alerta**: Inmediata (crítico)
- **Impacto UX**: Alto (puede impedir login)

### 3. Envío de Emails
- **Fallback**: Cola diferida + reintento
- **Alerta**: Después de 10 fallos/hora
- **Impacto UX**: Bajo (emails se retrasan pero llegan)

### 4. Generación de Imágenes con IA
- **Fallback**: Plantillas predeterminadas
- **Alerta**: Después de 3 activaciones/hora
- **Impacto UX**: Medio (menos personalización)

## Conclusión

**MANTENER FALLBACKS CON MONITOREO ACTIVO es la estrategia correcta porque:**

✅ Garantiza disponibilidad del sistema
✅ Mejora experiencia de usuario
✅ Proporciona visibilidad de problemas reales
✅ Permite mejora continua basada en datos
✅ Sigue principios de ingeniería moderna (Netflix, Amazon, Google)

**La clave no es eliminar fallbacks, sino monitorizarlos y actuar sobre ellos.**
