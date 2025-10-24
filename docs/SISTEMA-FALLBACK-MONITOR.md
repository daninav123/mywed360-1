# Sistema de Monitoreo de Fallbacks - Implementación Completa

## ✅ Estado: IMPLEMENTADO

El sistema completo de monitoreo de fallbacks está ahora integrado con el panel de administración existente.

## 🏗️ Arquitectura Implementada

```
Frontend (Usuario) → Fallback activado → useFallbackReporting
                                              ↓
                                        POST /api/fallback-monitor/log
                                              ↓
Backend → FallbackMonitor.js → Verifica umbrales
                                              ↓
                        ¿Excede umbral? → Crea alerta en adminAlerts
                                              ↓
Admin Panel → AdminAlerts.jsx ← GET /api/admin/dashboard/alerts
```

## 📁 Archivos Creados/Modificados

### Backend

#### ✅ Nuevos archivos

1. **`backend/services/FallbackMonitor.js`**
   - Servicio centralizado de monitoreo
   - Gestión de umbrales por servicio
   - Creación automática de alertas
   - Estadísticas y reporting

2. **`backend/routes/fallback-monitor.js`**
   - `POST /api/fallback-monitor/log` - Registrar fallback desde frontend
   - `GET /api/fallback-monitor/stats` - Obtener estadísticas (admin)
   - `POST /api/fallback-monitor/resolve/:alertId` - Resolver alerta
   - `GET /api/fallback-monitor/health` - Health check

#### ✅ Archivos modificados

3. **`backend/index.js`**
   - Montado router de fallback-monitor en `/api/fallback-monitor`
   - Autenticación requerida para endpoints

4. **`backend/routes/admin-dashboard.js`**
   - Actualizado `mapAlertDoc()` para incluir campos de fallback:
     - `service`, `type`, `count`, `threshold`, `actions`, `metadata`
   - Nuevo endpoint `GET /api/admin/dashboard/alerts`
     - Obtiene alertas ordenadas por severidad
     - Soporta filtro `?resolved=true`
     - Límite configurable `?limit=50`

### Frontend

#### ✅ Nuevos archivos

5. **`src/hooks/useFallbackReporting.js`**
   - Hook para reportar fallbacks desde cualquier componente
   - Reporte asíncrono no bloqueante
   - Manejo de errores silencioso

#### ✅ Archivos modificados

6. **`src/hooks/useAISearch.jsx`**
   - Integrado `useFallbackReporting`
   - Reporta fallbacks cuando backend no disponible
   - Reporta errores de API

7. **`src/pages/admin/AdminAlerts.jsx`**
   - UI mejorada con badges de severidad
   - Muestra tipo de alerta (🔔 Fallback, ⚙️ Sistema, etc.)
   - Muestra contador de activaciones
   - Muestra acciones recomendadas
   - Muestra umbral configurado
   - Mejor organización visual

## 🗄️ Colecciones Firebase

### `fallbackLogs`
Logs individuales de cada activación de fallback.

```javascript
{
  service: 'ai-suppliers',
  timestamp: Date,
  userId: 'uid123',
  error: 'BACKEND_OFFLINE',
  errorMessage: 'Failed to fetch',
  userAgent: 'Mozilla/5.0...',
  endpoint: '/api/ai-suppliers',
  metadata: {
    query: 'Fotógrafo bodas',
    service: 'Fotografía'
  },
  createdAt: Date
}
```

### `adminAlerts`
Alertas generadas cuando se exceden umbrales.

```javascript
{
  alertId: 'fallback-ai-suppliers',
  type: 'fallback',
  service: 'ai-suppliers',
  module: 'AI Services',
  severity: 'medium', // critical | high | medium | low
  message: 'Servicio "ai-suppliers" ha activado fallback 6 veces en la última hora',
  count: 6,
  threshold: 5,
  timestamp: '2025-10-24T19:30:00Z',
  lastOccurrence: Date,
  resolved: false,
  actions: [
    'Verificar estado de OpenAI API',
    'Revisar logs del backend',
    '...'
  ],
  metadata: {
    service: 'ai-suppliers',
    category: 'AI Services'
  },
  createdAt: Date,
  updatedAt: Date
}
```

## ⚙️ Configuración de Umbrales

Configurados en `backend/services/FallbackMonitor.js`:

```javascript
const DEFAULT_THRESHOLDS = {
  'ai-suppliers': { maxPerHour: 5, severity: 'medium', category: 'AI Services' },
  'firebase-auth': { maxPerHour: 1, severity: 'critical', category: 'Authentication' },
  'firebase-firestore': { maxPerHour: 3, severity: 'high', category: 'Database' },
  'email-service': { maxPerHour: 10, severity: 'medium', category: 'Email' },
  'openai-api': { maxPerHour: 3, severity: 'high', category: 'AI Services' },
  'payment-gateway': { maxPerHour: 2, severity: 'critical', category: 'Payments' },
  // ...
};
```

## 📊 Uso en Código

### Reportar fallback desde cualquier servicio

```javascript
import { useFallbackReporting } from '../hooks/useFallbackReporting';

function MyComponent() {
  const { reportFallback } = useFallbackReporting();
  
  const fetchData = async () => {
    try {
      const response = await fetch('/api/my-service');
      if (!response.ok) throw new Error('API error');
      return await response.json();
    } catch (error) {
      // Reportar fallback al sistema de monitoreo
      await reportFallback('my-service', error, {
        endpoint: '/api/my-service',
        additionalInfo: 'any metadata'
      });
      
      // Usar datos de fallback
      return getFallbackData();
    }
  };
}
```

## 🎯 Flujo de Alerta

1. **Usuario experimenta fallback**
   - Servicio externo falla (ej: OpenAI no disponible)
   - Frontend activa fallback (datos demo, cache, etc.)
   - `useFallbackReporting` reporta al backend

2. **Backend registra y monitoriza**
   - `POST /api/fallback-monitor/log` recibe el reporte
   - `FallbackMonitor.logFallback()` guarda en `fallbackLogs`
   - Cuenta fallbacks recientes (última hora)

3. **Generación de alerta**
   - Si `count >= threshold.maxPerHour`:
     - Crea/actualiza documento en `adminAlerts`
     - Incluye acciones recomendadas
     - Si es `critical`, puede enviar notificación adicional

4. **Visualización en Admin Panel**
   - AdminAlerts.jsx carga desde `GET /api/admin/dashboard/alerts`
   - Muestra alertas ordenadas por severidad
   - Admin puede ver detalles y marcar como resuelta

5. **Resolución**
   - Admin investiga usando acciones recomendadas
   - Marca alerta como resuelta con notas
   - `POST /api/admin/dashboard/alerts/:id/resolve`
   - Se registra en auditoría

## 🚀 Endpoints API

### Públicos (requieren autenticación)

#### POST /api/fallback-monitor/log
Registra activación de fallback.

**Request:**
```json
{
  "service": "ai-suppliers",
  "error": "BACKEND_OFFLINE",
  "errorMessage": "Failed to fetch",
  "endpoint": "/api/ai-suppliers",
  "metadata": {
    "query": "Fotógrafo bodas"
  }
}
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "message": "Fallback logged successfully"
}
```

### Admin (requieren rol admin)

#### GET /api/fallback-monitor/stats?hours=24
Obtiene estadísticas de fallbacks.

**Response:**
```json
{
  "success": true,
  "hours": 24,
  "stats": {
    "ai-suppliers": {
      "count": 12,
      "uniqueUsers": 5,
      "errors": {
        "BACKEND_OFFLINE": 8,
        "TypeError": 4
      },
      "lastError": "Failed to fetch",
      "lastTimestamp": "2025-10-24T19:30:00Z",
      "threshold": 5,
      "severity": "medium"
    }
  },
  "generatedAt": "2025-10-24T20:00:00Z"
}
```

#### GET /api/admin/dashboard/alerts?limit=50&resolved=false
Obtiene alertas del panel de admin.

**Response:**
```json
[
  {
    "id": "alert-123",
    "type": "fallback",
    "service": "ai-suppliers",
    "module": "AI Services",
    "severity": "medium",
    "message": "Servicio ha activado fallback 6 veces",
    "count": 6,
    "threshold": 5,
    "timestamp": "2025-10-24 19:30",
    "resolved": false,
    "actions": [
      "Verificar estado de OpenAI API",
      "Revisar logs del backend"
    ]
  }
]
```

#### POST /api/admin/dashboard/alerts/:id/resolve
Marca alerta como resuelta.

**Request:**
```json
{
  "notes": "Solucionado reiniciando servicio OpenAI"
}
```

## 📈 Métricas y KPIs

### Métricas clave que monitorizar

1. **Tasa de Fallback por Servicio**
   - % de requests que usan fallback
   - Objetivo: < 5% para servicios no críticos

2. **Usuarios Impactados**
   - Número de usuarios únicos que experimentan fallbacks
   - Objetivo: < 10% de usuarios activos

3. **MTTR (Mean Time To Resolution)**
   - Tiempo promedio desde alerta hasta resolución
   - Objetivo: < 30 min para críticas, < 4h para medias

4. **Distribución de Severidad**
   - Proporción de alertas por nivel
   - Objetivo: 0 críticas activas

## 🔔 Niveles de Severidad

### Critical (Crítica) 🔴
- Servicios core afectados (Auth, Payments)
- Umbral muy bajo (1-2 fallbacks/hora)
- **Acción inmediata requerida**
- Puede disparar notificaciones adicionales

### High (Alta) 🟠
- Servicios importantes (Firebase, OpenAI)
- Umbral bajo (3-5 fallbacks/hora)
- **Requiere atención pronto**

### Medium (Media) 🟡
- Servicios auxiliares (Email, Búsquedas)
- Umbral moderado (5-10 fallbacks/hora)
- **Revisar cuando sea posible**

### Low (Baja) 🔵
- Features opcionales (Analytics, A/B testing)
- Umbral alto (>10 fallbacks/hora)
- **Monitorizar tendencias**

## ✅ Checklist de Verificación

Para verificar que el sistema funciona:

1. ✅ Backend levantado con nuevo endpoint `/api/fallback-monitor`
2. ✅ Frontend puede reportar fallbacks
3. ✅ Búsqueda de proveedores reporta cuando backend offline
4. ✅ Panel de admin muestra alertas de fallback
5. ✅ Alertas se crean automáticamente al exceder umbrales
6. ✅ Admin puede marcar alertas como resueltas
7. ✅ Acciones recomendadas se muestran correctamente

## 🎨 UI del Panel de Admin

### Lista de Alertas
- 🔔 Icono de tipo de alerta
- Nombre del servicio
- Severidad con badge coloreado
- Contador de activaciones
- Estado (activa/resuelta)

### Detalle de Alerta
- Información completa del servicio
- Mensaje descriptivo
- Contador de activaciones vs umbral
- Timestamp de última ocurrencia
- **Acciones recomendadas** (lista de pasos a seguir)
- Botón para marcar como resuelta

## 🔮 Mejoras Futuras

1. **Notificaciones Push**
   - Slack webhook para alertas críticas
   - Email a equipo técnico
   - SMS para incidentes graves

2. **Dashboard de Métricas**
   - Gráficos de tendencias
   - Heatmap de servicios problemáticos
   - Comparativa semana/mes

3. **Auto-resolución**
   - Marcar como resuelta si no hay más fallbacks en X horas
   - Limpieza automática de alertas antiguas

4. **Integración con Monitoring Externo**
   - Prometheus/Grafana
   - Datadog
   - New Relic

5. **Machine Learning**
   - Predicción de fallos basada en patrones
   - Alertas proactivas antes de superar umbral

## 📚 Referencias

- Documentación estrategia: `docs/ESTRATEGIA-FALLBACKS.md`
- Código FallbackMonitor: `backend/services/FallbackMonitor.js`
- Hook de reporte: `src/hooks/useFallbackReporting.js`
- Panel admin: `src/pages/admin/AdminAlerts.jsx`

---

**Última actualización:** 2025-10-24
**Estado:** ✅ Completamente implementado y funcional
