# Reporte de Gaps de Implementación

**Fecha:** 20 de octubre de 2025  
**Objetivo:** Alinear el código con la documentación del proyecto

## Resumen Ejecutivo

Se han identificado gaps entre el código actual y los estándares definidos en la documentación, principalmente en:
- Formato de respuestas API inconsistente
- Validación de entrada incompleta
- Manejo de errores no estandarizado
- Exposición de información sensible (PII)

## 1. Convenciones de API (API_CONVENTIONS.md)

### 1.1 Formato de Respuestas

**Documentado:**
```json
// Éxito
{ "success": true, "data": { /* payload */ } }

// Error
{ "success": false, "error": { "code": "<slug>", "message": "<humano>" }, "requestId": "<uuid>" }
```

**Gap Identificado:**
Múltiples rutas no siguen este formato estándar:

#### backend/routes/ai.js
- `POST /api/parse-dialog`: Devuelve `{ extracted, reply }` en vez de `{ success: true, data: { extracted, reply } }`
- `GET /api/ai/search-suppliers`: Devuelve `{ results }` en vez de `{ success: true, data: { results } }`
- Errores devuelven `{ error: 'code', message: '...' }` sin `success: false` ni `requestId`

#### backend/routes/guests.js
- `POST /api/guests/:weddingId/invite`: Devuelve `{ token, link }` en vez de `{ success: true, data: { token, link } }`
- `GET /api/guests/:weddingId/:token`: Devuelve `{ name, status, ... }` directamente
- `PUT /api/guests/:weddingId/:token`: Devuelve `{ ok: true }` en vez de `{ success: true }`
- Errores devuelven `{ error: 'code' }` sin formato completo

### 1.2 Request ID

**Documentado:**
- Todas las respuestas de error deben incluir `requestId` generado en middleware

**Gap Identificado:**
- backend/index.js genera `req.id` correctamente
- Pero muchas rutas no incluyen `requestId` en respuestas de error
- El middleware global de errores sí lo incluye, pero respuestas manuales de error no

### 1.3 Validación de Entrada

**Documentado:**
- Zod recomendado para validación
- Esquemas por ruta y DTOs compartidos

**Gap Identificado:**
- ai.js: Validación manual con try/catch, esquema Zod importado dinámicamente
- guests.js: Usa Zod correctamente pero podría consolidarse
- Falta validación estricta en límites de tamaño (ej: arrays grandes)

## 2. Seguridad y Privacidad (SECURITY_PRIVACY.md)

### 2.1 Protección de PII

**Documentado:**
- Minimizar exposición de PII (email, teléfono, datos sensibles)
- Filtrar campos en UI y logs

**Gap Identificado:**
- `GET /api/guests/:weddingId/:token`: Expone datos del invitado sin autenticación robusta
- Podría filtrar más campos sensibles (teléfono, email)
- Logs podrían contener PII en errores

### 2.2 Rate Limiting

**Documentado:**
- Rate limiting por usuario (uid) en rutas de IA
- Configurable con RATE_LIMIT_AI_MAX

**Gap Identificado:**
- ✅ Implementado correctamente en backend/index.js
- Usa uid cuando está disponible, fallback a IP

### 2.3 Manejo de Secretos

**Documentado:**
- Mantener API keys en backend
- No exponer en logs

**Gap Identificado:**
- ai.js: Endpoint `/api/ai/debug-env` expone parcialmente API keys (primeros 10 chars)
- Esto es para debugging pero podría ser un riesgo en producción
- Recomendación: Proteger con requireAdmin o desactivar en producción

## 3. Modelo de Datos (DATA_MODEL.md)

### 3.1 Estructura de Documentos

**Documentado:**
- Estructura específica para guests, weddings, tasks, etc.
- Campos requeridos y opcionales definidos

**Gap Identificado:**
- guests.js crea guests con estructura básica pero falta:
  - `group` (string)
  - `rsvpStatus` vs `status` (inconsistencia de nombres)
  - Validación de límites (companions max 20 está bien)

## 4. Testing (TESTING.md)

**Documentado:**
- E2E con Cypress para seating
- Unit tests para servicios críticos
- Tests de reglas Firestore

**Gap Identificado:**
- ✅ Tests E2E seating implementados
- ❌ Faltan unit tests para rutas críticas (ai.js, guests.js)
- ❌ Falta cobertura de código mínima definida

## 5. Arquitectura (ARCHITECTURE.md)

### 5.1 Integración con Firebase

**Documentado:**
- Firebase Auth como fuente de identidad
- Reglas Firestore para autorización

**Gap Identificado:**
- ✅ Implementación correcta
- guests.js podría verificar permisos del usuario autenticado
- Algunas rutas son públicas por diseño (RSVP) - correcto

## Prioridades de Implementación

### Alta Prioridad
1. ✅ Estandarizar formato de respuestas API (success/error)
2. ✅ Incluir requestId en todas las respuestas de error
3. ✅ Mejorar manejo de PII en endpoints públicos
4. ✅ Proteger endpoint de debug en producción

### Media Prioridad
5. ⚠️ Consolidar validación Zod en todas las rutas
6. ⚠️ Añadir tests unitarios para rutas críticas
7. ⚠️ Estandarizar nombres de campos (status vs rsvpStatus)

### Baja Prioridad
8. ⬜ Documentar DTOs compartidos
9. ⬜ Métricas de cobertura de tests
10. ⬜ Auditoría completa de logs para PII

## Plan de Acción

1. **Crear utilidad de respuesta estándar:** Función helper para formato consistente
2. **Refactorizar ai.js:** Aplicar formato estándar de respuestas
3. **Refactorizar guests.js:** Aplicar formato estándar de respuestas
4. **Proteger debug endpoints:** Añadir requireAdmin o desactivar en producción
5. **Añadir tests:** Unit tests básicos para validación

## Notas Adicionales

- La mayor parte de la arquitectura está bien implementada
- Los gaps son principalmente de consistencia y estandarización
- No hay vulnerabilidades críticas de seguridad
- El código funciona pero podría ser más mantenible con estos cambios
