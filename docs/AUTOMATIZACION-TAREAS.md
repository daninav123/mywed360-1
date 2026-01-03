# 🤖 Automatización de Tareas - MaLoveApp

**Fecha:** 23 Octubre 2025  
**Estado:** ✅ DOCUMENTACIÓN COMPLETA

---

## 📋 RESUMEN

Sistema de ejecución automática de tareas basado en roadmap, con logging centralizado, gestión de errores y notificaciones.

---

## 🎯 Ejecución Automática de Tareas

### 1.1 Detección de Tareas Pendientes

**Fuente de datos:**
- `docs/ROADMAP_DETAILED_TASKS.json` - Roadmap estructurado
- Estado: `"pending"` indica tarea lista para ejecución

**Script de ejecución:**
```bash
node scripts/runTask.js --id=<taskId>
```

### 1.2 Logging de Tareas

**Ubicación:** `/logs/tasks.log`

**Formato:**
```json
{"timestamp":"2025-10-23T12:00:00Z","taskId":"123","action":"start"}
{"timestamp":"2025-10-23T12:05:00Z","taskId":"123","action":"end","status":"success"}
{"timestamp":"2025-10-23T12:05:00Z","taskId":"456","error":"TimeoutError"}
```

### 1.3 Estados de Tareas

- `pending` - Lista para ejecutar
- `in_progress` - En ejecución
- `completed` - Completada con éxito
- `failed` - Falló (ver logs)
- `blocked` - Bloqueada por dependencias

---

## 🔄 Gestión de Errores

### 2.1 Health Check Automático

**Tras completar tareas, ejecuta:**
```bash
npm run test:unit && npm run lint && npm run validate:schemas
```

### 2.2 Reintentos

**Estrategia:**
- Máximo 3 reintentos
- Delay exponencial: 2s, 4s, 8s
- Solo para errores recuperables (timeout, network)

**Implementación:**
```javascript
const retryDelays = [2000, 4000, 8000];
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    await executeTask(taskId);
    break;
  } catch (error) {
    if (attempt === 2 || !isRetryable(error)) throw error;
    await sleep(retryDelays[attempt]);
  }
}
```

### 2.3 Notificaciones

**Tras 3 fallos consecutivos:**

1. **Slack:**
   - Canal: `#wind-surf-alerts`
   - Webhook: `SLACK_WEBHOOK_URL` (ver `.env`)
   - Formato: `❌ Tarea {taskId} falló 3 veces. Último error: {message}`

2. **Email:**
   - Destinatarios: `ALERT_EMAIL_TO`
   - Servidor: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
   - Asunto: `[MaLoveApp] Fallo crítico en tarea {taskId}`

### 2.4 Documentación de Incidentes

**Ubicación:** `docs/incidents/YYYY-MM-DD_task_errors.md`

**Plantilla:**
```markdown
### {Fecha y Hora}
- **Tarea:** {taskId}
- **Error:** {mensaje de error}
- **Acciones:** {reintentos realizados, rollback aplicado, etc.}
- **Responsable:** {quien manejó el incidente}
- **Resolución:** {cómo se resolvió}
```

---

## 📊 Monitorización Proactiva

### 3.1 Stack de Monitorización

**Componentes:**
- **Prometheus** - Recolección de métricas
- **Grafana** - Visualización y dashboards
- **Alertmanager** - Gestión de alertas

**Ver:** `docs/monitoring/README.md`

### 3.2 Métricas Clave

| Métrica | Descripción | Fuente |
|---------|-------------|--------|
| **Disponibilidad** | Uptime de frontend/backend | `/health` endpoints |
| **Rendimiento** | Latencia, RPS, errores 4xx/5xx | `http_requests_total` |
| **Recursos** | CPU, memoria, disco | `prom-client` defaults |
| **Tareas** | Éxito/fallo de ejecución | `task_execution_total{status}` |

### 3.3 Alertas Configuradas

**Archivo:** `docs/monitoring/alerting_rules.yml`

```yaml
# Alta tasa de errores 5xx
alert: HighErrorRate
expr: increase(http_requests_total{status=~"5.."}[5m]) > 5
for: 1m
labels:
  severity: warning
annotations:
  summary: "Alta tasa de errores 5xx"

# Latencia P95 alta
alert: SlowRequestsP95
expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 1
for: 2m
labels:
  severity: warning
annotations:
  summary: "Latencia P95 > 1s durante 2 minutos"
```

### 3.4 Frecuencia de Checks

- **Health checks:** Cada 5 minutos
- **Métricas:** Scrape cada 15 segundos
- **Alertas:** Evaluación cada 1 minuto

---

## 🔐 Seguridad

### 4.1 Gestión de Credenciales

**Recomendado: AWS Secrets Manager o Vault**

**Integración con AWS Secrets Manager:**
```javascript
const AWS = require('aws-sdk');
const secrets = new AWS.SecretsManager({region: 'eu-west-1'});

async function getSecret(secretName) {
  const data = await secrets.getSecretValue({SecretId: secretName}).promise();
  return JSON.parse(data.SecretString);
}
```

**Local: `.env.local`**
- Añadir a `.gitignore`
- No commitear nunca

### 4.2 Validación y Sanitización

**Schemas con Zod:**

```javascript
import { z } from 'zod';

const CreateUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  age: z.number().int().min(18).optional(),
});

// Middleware de validación
app.post('/api/users', (req, res, next) => {
  try {
    CreateUserSchema.parse(req.body);
    next();
  } catch (e) {
    res.status(400).json({ error: e.errors });
  }
});
```

**Ver:** `src/schemas/` para schemas existentes

### 4.3 Logging y Trazabilidad

**Winston Configuration:**

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

module.exports = logger;
```

**ID de Correlación:**

```javascript
// Middleware para generar X-Request-ID
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// En logs
logger.info('Request received', {
  requestId: req.id,
  method: req.method,
  path: req.path
});
```

---

## 🚀 CI/CD y Despliegue

### 5.1 Pipeline de Integración Continua

**Archivo:** `.github/workflows/ci.yml`

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build --workspaces
```

**Ver:** `docs/DEPLOYMENT_CI.md` para detalles completos

### 5.2 Despliegue Blue/Green

**Estrategia:**
1. Mantener dos entornos: `prod-blue` y `prod-green`
2. Desplegar nueva versión en entorno inactivo
3. Ejecutar health checks y smoke tests
4. Si OK, cambiar routing en NGINX/Load Balancer
5. Monitorizar `error_rate` durante 2 minutos
6. Si `error_rate > 5%`, rollback automático

**Configuración NGINX:**

```nginx
upstream backend {
    server prod-blue:4004;
    # server prod-green:4004; # Descomentar tras validación
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
```

### 5.3 Rollback Automático

**Condición de rollback:**
- `error_rate > 5%` durante 2 minutos consecutivos
- Fallo en health checks críticos

**Proceso:**
```bash
# 1. Detectar error_rate alto
if [ $(curl -s http://prod-green:4004/metrics | grep error_rate) > 5 ]; then
  # 2. Cambiar routing a versión anterior
  nginx -s reload
  # 3. Notificar
  curl -X POST $SLACK_WEBHOOK_URL -d '{"text":"🔄 Rollback ejecutado"}'
fi
```

---

## 📚 Scripts Disponibles

### Automatización
```bash
# Ejecutar tarea específica
node scripts/runTask.js --id=<taskId>

# Validar roadmap
npm run validate:roadmap

# Agregado de roadmap
node scripts/aggregateRoadmap.js
```

### Validación
```bash
# Validar traducciones
npm run validate:i18n

# Validar schemas
npm run validate:schemas

# Lint
npm run lint
```

### Testing
```bash
# Unit tests
npm run test:unit

# E2E smoke
npm run cypress:run:seating

# Coverage
npm run test:coverage
```

---

## 🎓 Buenas Prácticas

### DO ✅

1. **Logging estructurado** - JSON con requestId
2. **Reintentos exponenciales** - Para errores recuperables
3. **Health checks constantes** - Cada 5 minutos
4. **Alertas tempranas** - Detectar degradación antes de fallos
5. **Documentar incidentes** - Aprendizaje continuo

### DON'T ❌

1. **No hardcodear credenciales** - Usar secrets manager
2. **No ignorar errores** - Log y notificar siempre
3. **No desplegar sin tests** - CI debe ser gate obligatorio
4. **No asumir éxito** - Validar resultados explícitamente
5. **No escalar manualmente** - Automatizar respuestas

---

## 📞 Contacto y Soporte

**En caso de incidentes:**
1. Verificar `/logs/tasks.log`
2. Revisar `docs/incidents/` para casos similares
3. Consultar Grafana dashboards
4. Contactar equipo DevOps

**Referencias:**
- Monitorización: `docs/monitoring/README.md`
- CI/CD: `docs/DEPLOYMENT_CI.md`
- Seguridad: `docs/SECURITY_PRIVACY.md`
- Variables: `docs/ENVIRONMENT.md`

---

**Última actualización:** 23 Octubre 2025, 05:30 AM  
**Versión:** 1.0.0
