# Solución Crítica: Workers Bloqueando el Sistema

## 🔴 Problema Identificado

El backend está extremadamente lento porque **3 workers automáticos** se ejecutan en bucle y fallan constantemente por **índices Firestore faltantes**:

### Workers Afectados

| Worker | Archivo | Intervalo | Error |
|--------|---------|-----------|-------|
| Email Scheduler | `emailSchedulerWorker.js` | Cada 60s | Query a `emailAutomationQueue` sin índice |
| Momentos Moderation | `momentosModerationWorker.js` | Cada 2min | Query a collection `photos` sin índice |
| Momentos Cleanup | `momentosCleanupWorker.js` | Cada 6h | Query a collection `albums` sin índice |

### Impacto

- **CPU al 100%**: Queries fallidas continuas
- **Logs infinitos**: Errores cada 60-120 segundos
- **Sistema colgado**: No puede procesar requests normales
- **Rendimiento degradado**: Timeouts en frontend

---

## ✅ Solución Inmediata (5 minutos)

### Paso 1: Deshabilitar Workers Temporalmente

Añade estas variables a tu archivo `backend/.env`:

```bash
# ===== DESHABILITAR WORKERS TEMPORALMENTE =====
EMAIL_SCHEDULER_DISABLED=1
MOMENTOS_AUTO_MODERATION_DISABLED=1
MOMENTOS_CLEANUP_DISABLED=1
```

### Paso 2: Reiniciar Backend

```powershell
# Detén el backend actual (Ctrl+C en la terminal)
# Luego reinicia:
cd backend
npm run dev
```

**Resultado**: Los workers no se iniciarán y el sistema volverá a funcionar normalmente.

---

## 🔧 Solución Permanente: Crear Índices en Firestore

### Índice 1: emailAutomationQueue

1. Abre este enlace (reemplaza con tu proyecto):
```
https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Clpwcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9lbWFpbEF1dG9tYXRpb25RdWV1ZS9pbmRleGVzL18QARoKCgZzdGF0dXMQARoPCgtzY2hlZHVsZWRBdBABGgwKCF9fbmFtZV9fEAE
```

2. O crea manualmente en Firebase Console:
   - **Collection**: `emailAutomationQueue`
   - **Campos indexados**:
     - `status` (Ascending)
     - `scheduledAt` (Ascending)
     - `__name__` (Ascending)

### Índice 2: photos

1. Abre este enlace:
```
https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9waG90b3MvaW5kZXhlcy9fEAIaCgoGc3RhdHVzEAEaDQoJY3JlYXRlZEF0EAEaDAoIX19uYW1lX18QAQ
```

2. O crea manualmente:
   - **Collection Group**: `photos`
   - **Campos indexados**:
     - `status` (Ascending)
     - `createdAt` (Ascending)
     - `__name__` (Ascending)

### Índice 3: albums

1. Abre este enlace:
```
https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9hbGJ1bXMvaW5kZXhlcy9fEAIaCAoEc2x1ZxABGh4KGnVwbG9hZFdpbmRvdy5jbGVhbnVwU3RhdHVzEAEaGgoWdXBsb2FkV2luZG93LmNsZWFudXBBdBABGgwKCF9fbmFtZV9fEAE
```

2. O crea manualmente:
   - **Collection Group**: `albums`
   - **Campos indexados**:
     - `slug` (Ascending)
     - `uploadWindow.cleanupStatus` (Ascending)
     - `uploadWindow.cleanupAt` (Ascending)
     - `__name__` (Ascending)

### Tiempo de Creación

- Los índices tardan **5-15 minutos** en construirse
- Firebase te enviará un email cuando estén listos
- Puedes monitorear el estado en: Firebase Console → Firestore → Indexes

---

## 🔄 Reactivar Workers (Después de Crear Índices)

Una vez que los 3 índices estén activos:

### Opción A: Eliminar Variables (Recomendado)

Borra las líneas del `backend/.env`:

```bash
# ===== DESHABILITAR WORKERS TEMPORALMENTE =====
# EMAIL_SCHEDULER_DISABLED=1  ← Eliminar o comentar
# MOMENTOS_AUTO_MODERATION_DISABLED=1  ← Eliminar o comentar
# MOMENTOS_CLEANUP_DISABLED=1  ← Eliminar o comentar
```

### Opción B: Cambiar a 0

```bash
EMAIL_SCHEDULER_DISABLED=0
MOMENTOS_AUTO_MODERATION_DISABLED=0
MOMENTOS_CLEANUP_DISABLED=0
```

### Reiniciar Backend

```powershell
cd backend
npm run dev
```

---

## 📊 Verificación Post-Solución

### 1. Logs Limpios

Deberías ver en el terminal:

```
✅ Firebase Admin initialized successfully
[backend] Admin metrics routes mounted on /api/admin/metrics
[backend] Admin dashboard routes mounted on /api/admin/dashboard
MaLoveApp backend up on http://localhost:4004
```

**SIN** errores de `[email-scheduler]`, `[momentos-moderation]` o `[momentos-cleanup]`.

### 2. Rendimiento Normal

- CPU del proceso Node.js: < 10% en idle
- Logs: Solo requests HTTP normales
- Frontend: Responde en < 500ms

### 3. Workers Funcionando (Después de Índices)

Una vez reactivados, verás logs ocasionales:

```
[email-scheduler] Procesados 3 correos programados.
[momentos-moderation] Procesadas 5 fotos para moderación automática.
[momentos-cleanup] Limpieza procesada para 1 álbumes (retención 30 días).
```

---

## 🚨 Si el Problema Persiste

### Escenario 1: Workers Siguen Fallando

Si después de crear índices siguen los errores:

1. **Verifica que los índices estén "Enabled"** en Firebase Console
2. **Espera 30 minutos** (en proyectos grandes puede tardar más)
3. **Reinicia backend completamente** (no solo reload)

### Escenario 2: Otro Worker Falla

Si ves errores de `[metric-aggregator]` u otros:

1. **Busca el archivo del worker** en `backend/workers/`
2. **Identifica la variable de entorno** para deshabilitarlo
3. **Añade al `.env`** siguiendo el mismo patrón
4. **Documenta en este archivo**

### Escenario 3: Lentitud Sin Errores

Si no hay errores pero sigue lento:

1. **Monitorea Firestore reads** en Firebase Console → Usage
2. **Revisa listeners activos** del frontend (posibles loops)
3. **Analiza queries costosas** con Firestore debug

---

## 📝 Notas Técnicas

### ¿Por Qué Pasó Esto?

Los workers fueron desarrollados asumiendo que las colecciones Firestore ya existían con datos. Al ejecutarse sobre colecciones vacías o con queries complejas, Firestore **requiere índices compuestos** que no se crearon automáticamente.

### ¿Cómo Prevenirlo?

1. **Siempre deshabilitar workers en desarrollo local** por defecto
2. **Crear índices en staging** antes de desplegar a producción
3. **Añadir health checks** que detecten queries fallidas
4. **Documentar índices requeridos** en el repositorio

### Variables de Entorno de Workers

Todos los workers soportan estas variables:

```bash
# Deshabilitar completamente
<WORKER>_DISABLED=1

# Modo dry-run (ejecuta sin hacer cambios)
<WORKER>_DRY_RUN=1

# Ajustar intervalo (en milisegundos)
<WORKER>_INTERVAL_MS=300000

# Limitar batch size
<WORKER>_BATCH_LIMIT=5
```

---

## ✅ Checklist de Solución

- [ ] Añadir variables `*_DISABLED=1` al `backend/.env`
- [ ] Reiniciar backend y verificar que no hay errores
- [ ] Crear los 3 índices en Firebase Console
- [ ] Esperar a que Firebase envíe email de confirmación
- [ ] Verificar índices en estado "Enabled"
- [ ] Eliminar/comentar variables `*_DISABLED` del `.env`
- [ ] Reiniciar backend nuevamente
- [ ] Monitorear logs durante 5 minutos
- [ ] Confirmar que workers procesan sin errores

---

**Fecha**: 27 de octubre de 2025  
**Estado**: Solución validada y documentada  
**Impacto**: Crítico (sistema inutilizable sin la solución)
