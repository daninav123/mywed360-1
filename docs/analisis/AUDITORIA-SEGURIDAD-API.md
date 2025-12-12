# 🔒 AUDITORÍA DE SEGURIDAD API - 18 Noviembre 2025

## 📋 RESUMEN EJECUTIVO

**Estado:** En progreso  
**Prioridad:** CRÍTICA  
**Responsable:** Cascade AI

---

## ✅ COMPLETADO

### 1. Endpoint `/api/ai/debug-env` - PROTEGIDO ✅

**Ubicación:** `backend/routes/ai.js:94`

**Estado actual:**

```javascript
router.get('/debug-env', requireAdmin, (req, res) => {
  // Solo accesible para administradores
});
```

**Protección:** `requireAdmin` middleware implementado correctamente

- Verifica rol "admin" en `userProfile.role`
- Retorna 403 si no es admin
- Middleware testado en múltiples tests

**Conclusión:** ✅ **NO REQUIERE ACCIÓN**

---

## ⚠️ EN PROGRESO

### 2. Llamadas OpenAI desde Cliente → Mover a Backend

**Archivos con llamadas directas a OpenAI:**

#### 🔴 **CRÍTICO - `aiSearchOrchestrator.js`**

**Ubicación:** `apps/main-app/src/services/aiSearchOrchestrator.js`

**Problemas identificados:**

1. **Línea 24:** Llamada directa a OpenAI Chat Completions

   ```javascript
   const response = await axios.post(
     'https://api.openai.com/v1/chat/completions',
     { ... },
     { headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` } }
   )
   ```

   - **Función:** `analyzeSearchIntent(query)`
   - **Uso:** Analizar intención de búsqueda

2. **Línea 150:** Segunda llamada a Chat Completions

   ```javascript
   const response = await axios.post(
     'https://api.openai.com/v1/chat/completions', ...
   )
   ```

   - **Función:** `enrichResultsWithAI(results, query)`
   - **Uso:** Enriquecer resultados de búsqueda

3. **Línea 285:** Tercera llamada a Chat Completions

   ```javascript
   const response = await axios.post(
     'https://api.openai.com/v1/chat/completions', ...
   )
   ```

   - **Función:** `generateSearchSuggestions(partialQuery, context)`
   - **Uso:** Generar sugerencias de búsqueda

**Exposición de seguridad:**

- ❌ API Key expuesta en cliente (`VITE_OPENAI_API_KEY`)
- ❌ Sin rate limiting
- ❌ Sin control de costos
- ❌ Sin auditoría de uso

**Acción requerida:**

- [ ] Crear endpoint backend: `POST /api/ai/search/analyze-intent`
- [ ] Crear endpoint backend: `POST /api/ai/search/enrich-results`
- [ ] Crear endpoint backend: `POST /api/ai/search/generate-suggestions`
- [ ] Actualizar `aiSearchOrchestrator.js` para usar endpoints backend
- [ ] Eliminar `VITE_OPENAI_API_KEY` del entorno cliente

---

#### 🟠 **ALTA - `ImageGeneratorAI.jsx`**

**Ubicación:** `apps/main-app/src/components/ImageGeneratorAI.jsx`

**Problema identificado:**

- **Línea 142:** Llamada directa a DALL-E
  ```javascript
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: 'dall-e-3', prompt, ... }),
  });
  ```

**Exposición de seguridad:**

- ❌ API Key expuesta en cliente
- ❌ Sin control de uso (DALL-E es costoso)
- ❌ Sin validación de prompts

**Acción requerida:**

- [ ] Crear endpoint backend: `POST /api/ai/image/generate`
- [ ] Actualizar `ImageGeneratorAI.jsx` para usar endpoint backend
- [ ] Implementar rate limiting (DALL-E es costoso)
- [ ] Implementar validación de prompts

---

#### 🟡 **MEDIA - `diagnosticService.js`**

**Ubicación:** `apps/main-app/src/services/diagnosticService.js`

**Problema identificado:**

- **Línea 267:** Test de configuración OpenAI
  ```javascript
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  ```

**Nota:** Este es solo un test de diagnóstico controlado por `VITE_ENABLE_DIRECT_OPENAI`

**Acción requerida:**

- [ ] Evaluar si eliminar completamente o mover a backend
- [ ] Considerar endpoint de diagnóstico protegido con admin

---

### 3. Filtrar PII en Endpoints Públicos

**Endpoint identificado:** `GET /api/guests/:weddingId/:token`

**Acción requerida:**

- [ ] Auditar qué información se expone
- [ ] Verificar que no se exponga información sensible sin token válido
- [ ] Implementar filtrado de campos sensibles

---

### 4. Auditar Logs del Sistema

**Ubicación:** Logs de backend (`backend/logs/`)

**Acción requerida:**

- [ ] Revisar logs existentes para PII
- [ ] Implementar sanitización de logs
- [ ] Configurar rotación de logs
- [ ] Documentar política de logs

---

## 📊 MÉTRICAS DE SEGURIDAD

| Vulnerabilidad                  | Severidad  | Estado      | ETA   |
| ------------------------------- | ---------- | ----------- | ----- |
| API Key expuesta en cliente     | 🔴 CRÍTICA | En progreso | 2h    |
| Sin rate limiting OpenAI        | 🟠 ALTA    | Pendiente   | 1h    |
| PII en logs                     | 🟡 MEDIA   | Pendiente   | 1h    |
| Endpoints públicos sin filtrado | 🟡 MEDIA   | Pendiente   | 30min |

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### **Fase 1: Mover OpenAI a Backend (AHORA)** ⏰ 2-3h

1. **Crear endpoints en backend:**

   ```
   POST /api/ai/search/analyze-intent
   POST /api/ai/search/enrich-results
   POST /api/ai/search/generate-suggestions
   POST /api/ai/image/generate
   ```

2. **Actualizar servicios frontend:**
   - `aiSearchOrchestrator.js`
   - `ImageGeneratorAI.jsx`

3. **Eliminar API key del cliente:**
   - Remover `VITE_OPENAI_API_KEY` de `.env` cliente
   - Mantener solo en backend

### **Fase 2: Rate Limiting y Control de Costos** ⏰ 1h

1. **Implementar rate limiting por usuario**
2. **Configurar límites de uso diario**
3. **Alertas de uso excesivo**

### **Fase 3: Auditoría de Logs y PII** ⏰ 1h

1. **Revisar y sanitizar logs existentes**
2. **Implementar filtrado automático**
3. **Configurar rotación**

### **Fase 4: Endpoints Públicos** ⏰ 30min

1. **Auditar `/api/guests/:weddingId/:token`**
2. **Implementar filtrado de campos**
3. **Documentar API pública**

---

## 📝 NOTAS TÉCNICAS

### Middleware `requireAdmin` verificado:

```javascript
// backend/middleware/authMiddleware.js:458
const requireAdmin = authMiddleware({
  required: true,
  roles: ['admin'],
});
```

### Jerarquía de roles:

```javascript
const roleHierarchy = {
  admin: ['admin', 'planner', 'particular'],
  planner: ['planner', 'particular'],
  particular: ['particular'],
};
```

---

## ✅ CRITERIOS DE ÉXITO

- [ ] 0 llamadas directas a OpenAI desde cliente
- [ ] API Key solo en backend
- [ ] Rate limiting activo en todos los endpoints IA
- [ ] Logs sin PII
- [ ] Endpoints públicos documentados y auditados
- [ ] Tests de seguridad pasando

---

**Próxima actualización:** Cada 30 minutos
**Fecha inicio:** 18 noviembre 2025, 18:40
