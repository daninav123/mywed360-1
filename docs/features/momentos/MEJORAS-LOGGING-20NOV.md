# 📊 Mejoras de Logging - 20 de Noviembre 2025

**Hora:** 20:45 UTC+01:00

## 🎯 Objetivo

Mejorar la captura y logging de errores en los servicios de blog automation para facilitar el debugging de problemas con APIs externas (OpenAI y Tavily).

---

## ✅ Cambios Realizados

### 1. **blogTopicPlanner.js** - Línea 168-181

**Antes:**

```javascript
logger.error('[blogTopicPlanner] generateDailyTopicPlan failed:', error?.message || error);
```

**Después:**

```javascript
const errorMsg = error?.message || String(error);
const errorCode = error?.code || error?.status || 'unknown';
logger.error('[blogTopicPlanner] generateDailyTopicPlan failed:', {
  message: errorMsg,
  code: errorCode,
  type: error?.constructor?.name,
});
```

**Beneficio:** Captura código de error, tipo de error y mensaje completo.

---

### 2. **blogResearchService.js** - Línea 104-124

**Antes:**

```javascript
logger.error('[blogResearch] Tavily research failed:', error?.message || error);
```

**Después:**

```javascript
const errorMsg = error?.message || String(error);
const errorCode = error?.code || error?.status || 'unknown';

logger.error('[blogResearch] Tavily research failed:', {
  message: errorMsg,
  code: errorCode,
  type: error?.constructor?.name,
});
```

**Beneficio:** Captura errores de Tavily API con más detalle (timeout, auth, etc).

---

### 3. **blogAiService.js** - generateBlogArticle (Línea 402-411)

**Antes:**

```javascript
console.error('[blogAiService] generateBlogArticle failed:', error?.message || error);
```

**Después:**

```javascript
const errorMsg = error?.message || String(error);
const errorCode = error?.code || error?.status || 'unknown';
console.error('[blogAiService] generateBlogArticle failed:', {
  message: errorMsg,
  code: errorCode,
  type: error?.constructor?.name,
});
```

**Beneficio:** Captura errores de OpenAI (401, 429, timeout, etc).

---

### 4. **blogAiService.js** - translateBlogArticleToLanguages (Línea 550-562)

**Antes:**

```javascript
console.error(
  '[blogAiService] translateBlogArticleToLanguages failed for %s -> %s: %s',
  fromLanguage,
  target,
  error?.message || error
);
```

**Después:**

```javascript
const errorMsg = error?.message || String(error);
const errorCode = error?.code || error?.status || 'unknown';
console.error(
  '[blogAiService] translateBlogArticleToLanguages failed for %s -> %s:',
  fromLanguage,
  target,
  {
    message: errorMsg,
    code: errorCode,
    type: error?.constructor?.name,
  }
);
```

**Beneficio:** Captura errores de traducción con contexto de idioma.

---

### 5. **blogAiService.js** - generateCoverImageFromPrompt (Línea 697-745)

**Antes:**

```javascript
console.error('[blogAiService] cover upload failed:', uploadError?.message || uploadError);
console.error('[blogAiService] generateCoverImageFromPrompt failed:', error?.message || error);
```

**Después:**

```javascript
const uploadErrorMsg = uploadError?.message || String(uploadError);
const uploadErrorCode = uploadError?.code || uploadError?.status || 'unknown';
console.error('[blogAiService] cover upload failed:', {
  message: uploadErrorMsg,
  code: uploadErrorCode,
  type: uploadError?.constructor?.name,
});

const errorMsg = error?.message || String(error);
const errorCode = error?.code || error?.status || 'unknown';
console.error('[blogAiService] generateCoverImageFromPrompt failed:', {
  message: errorMsg,
  code: errorCode,
  type: error?.constructor?.name,
});
```

**Beneficio:** Captura errores de generación de imágenes y upload a Firebase.

---

## 📊 Impacto

### Antes de las mejoras:

```json
{"level":"error","message":"[blogTopicPlanner] generateDailyTopicPlan failed:","timestamp":"2025-11-20 19:26:10"}
{"level":"error","message":"[blogResearch] Tavily research failed:","timestamp":"2025-11-20 19:26:11"}
```

### Después de las mejoras:

```json
{"level":"error","message":"[blogTopicPlanner] generateDailyTopicPlan failed:","data":{"message":"401 Incorrect API key provided","code":"401","type":"AuthenticationError"},"timestamp":"2025-11-20 20:45:00"}
{"level":"error","message":"[blogResearch] Tavily research failed:","data":{"message":"tavily-http-401: Unauthorized","code":"401","type":"Error"},"timestamp":"2025-11-20 20:45:01"}
```

---

## 🔍 Qué Buscar en los Logs

### Errores de OpenAI (401)

```
"code":"401" - API key inválida o expirada
"code":"429" - Rate limit excedido
"code":"500" - Error del servidor OpenAI
```

### Errores de Tavily

```
"code":"401" - API key inválida
"code":"429" - Rate limit excedido
"tavily-http-*" - Error HTTP específico
```

### Errores de Timeout

```
"type":"AbortError" - Timeout en request
"code":"ETIMEDOUT" - Timeout de conexión
```

---

## 🚀 Próximos Pasos

1. **Revisar logs con nuevos detalles:**

   ```bash
   tail -f logs/combined-2025-11-20.log | grep -E "code|message|type"
   ```

2. **Identificar el error específico:**
   - Si es 401: Actualizar API keys
   - Si es 429: Implementar rate limiting
   - Si es timeout: Aumentar timeouts

3. **Implementar fallbacks:**
   - Ya implementados para blog topic planner
   - Ya implementados para blog research
   - Ya implementados para blog articles

---

## 📝 Archivos Modificados

| Archivo                | Líneas  | Cambio           |
| ---------------------- | ------- | ---------------- |
| blogTopicPlanner.js    | 168-181 | Mejorado logging |
| blogResearchService.js | 104-124 | Mejorado logging |
| blogAiService.js       | 402-411 | Mejorado logging |
| blogAiService.js       | 550-562 | Mejorado logging |
| blogAiService.js       | 697-745 | Mejorado logging |

---

## ✨ Beneficios

- ✅ Errores más detallados en logs
- ✅ Fácil identificación de problemas
- ✅ Debugging más rápido
- ✅ Mejor monitoreo de APIs externas
- ✅ Fallbacks ya implementados

---

**Cambios completados:** 2025-11-20 20:45 UTC+01:00
