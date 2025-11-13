# 🔐 Migración de API Keys al Backend

## Resumen

Las API keys han sido movidas del frontend al backend por razones de seguridad. Esto previene:
- Exposición de API keys en el código del cliente
- Uso no autorizado de las APIs
- Costos inesperados por abuso
- Violaciones de términos de servicio

## ✅ APIs Migradas

### 1. Google Translation API
**Antes:**
```javascript
// Frontend - API key expuesta
const API_KEY = import.meta.env.VITE_TRANSLATE_KEY;
const response = await axios.post(
  `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
  { q: text, target: 'es' }
);
```

**Ahora:**
```javascript
// Frontend - Sin API key
const response = await axios.post('/api/proxy/translate', {
  text,
  targetLang: 'es',
  sourceLang: 'en'
});
```

**Backend:**
```javascript
// Backend - API key segura
router.post('/translate', async (req, res) => {
  const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY; // Segura en backend
  // ...proxy a Google API
});
```

### 2. OpenAI API
**Antes:** Llamadas directas desde frontend (riesgo de exposición)
**Ahora:** Proxy `POST /api/proxy/openai`

### 3. Tavily Search API
**Antes:** API key en frontend
**Ahora:** Proxy `POST /api/proxy/tavily-search`

## 🔧 Cambios Necesarios

### Variables de Entorno

#### Backend (.env)
```bash
# Añadir estas variables al backend
GOOGLE_TRANSLATE_API_KEY=AIza...
OPENAI_API_KEY=sk-proj-...
TAVILY_API_KEY=tvly-...
```

#### Frontend (.env)
```bash
# ELIMINAR estas variables (ya no se usan)
# VITE_TRANSLATE_KEY=xxx  ❌ ELIMINAR
# VITE_OPENAI_API_KEY=xxx ❌ ELIMINAR

# Mantener solo la URL del backend
VITE_BACKEND_BASE_URL=https://mywed360-backend.onrender.com
```

### Archivos Actualizados

1. **Backend:**
   - `backend/routes/proxy.js` - Nuevo router de proxy
   - `backend/index.js` - Importar y registrar router

2. **Frontend:**
   - `apps/main-app/src/services/translationService.js` - Actualizado
   - `apps/main-app/src/services/webSearchService.js` - Ya usa proxy
   - `apps/main-app/src/services/aiService.js` - Pendiente de actualizar

## 📋 Endpoints Disponibles

### POST /api/proxy/translate
Traduce texto usando Google Translation API

**Request:**
```json
{
  "text": "Hello world",
  "targetLang": "es",
  "sourceLang": "en"
}
```

**Response:**
```json
{
  "success": true,
  "translated": "Hola mundo",
  "source": "en",
  "target": "es"
}
```

### POST /api/proxy/openai
Llamada a OpenAI ChatGPT

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Hola" }
  ],
  "model": "gpt-4o-mini",
  "maxTokens": 1000
}
```

**Response:**
```json
{
  "success": true,
  "response": "¡Hola! ¿En qué puedo ayudarte?",
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 15,
    "total_tokens": 25
  }
}
```

### POST /api/proxy/tavily-search
Búsqueda web optimizada para IA

**Request:**
```json
{
  "query": "wedding venues in Madrid",
  "searchDepth": "basic",
  "maxResults": 5
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "title": "...",
      "url": "...",
      "content": "..."
    }
  ],
  "answer": "..."
}
```

### GET /api/proxy/status
Verifica disponibilidad de servicios

**Response:**
```json
{
  "available": {
    "translate": true,
    "openai": true,
    "tavily": false,
    "googlePlaces": true
  },
  "count": 3,
  "total": 4
}
```

## 🔒 Seguridad

### Rate Limiting
Todos los endpoints de proxy tienen rate limiting:
- **Límite:** 30 requests por minuto por IP
- **Ventana:** 60 segundos
- **Acción:** HTTP 429 Too Many Requests

### Autenticación
- Requiere autenticación mediante Firebase Auth
- Token JWT verificado en cada petición
- Sin token = 401 Unauthorized

### Timeouts
- Translation: 10 segundos
- OpenAI: 30 segundos
- Tavily: 15 segundos

## 🚀 Próximos Pasos

### Inmediato
1. ✅ Crear endpoints de proxy en backend
2. ✅ Actualizar translationService.js
3. ⏳ Actualizar webSearchService.js (Google Places ya usa proxy)
4. ⏳ Actualizar aiService.js para OpenAI
5. ⏳ Eliminar VITE_*_API_KEY del .env frontend

### Corto Plazo
1. Configurar API keys en producción (Render, Netlify)
2. Actualizar documentación de deployment
3. Tests E2E de los proxies
4. Monitoring de uso de APIs

### Largo Plazo
1. Implementar caching de traducciones
2. Métricas de uso por usuario
3. Sistema de cuotas
4. Optimización de costos

## 📊 Beneficios

| Aspecto | Antes | Después |
|---------|-------|---------|
| Seguridad | ❌ Keys expuestas | ✅ Keys seguras |
| Control | ❌ Sin límites | ✅ Rate limiting |
| Monitoreo | ❌ No visible | ✅ Logs completos |
| Costos | ⚠️ Riesgo alto | ✅ Controlados |
| Debugging | ❌ Difícil | ✅ Centralizado |

## ⚠️ Notas Importantes

1. **Google Places API**: Ya usa proxy desde el backend, no requiere cambios
2. **Backwards Compatibility**: Los servicios devuelven el texto original como fallback si el backend no está disponible
3. **Environment Variables**: Las API keys NUNCA deben estar en archivos versionados (usar .env, no .env.example)
4. **Production**: Configurar las API keys en Render/Netlify usando variables de entorno secretas

## 🔗 Referencias

- [Google Translation API](https://cloud.google.com/translate/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [Tavily Search API](https://docs.tavily.com)
- [Express Rate Limiting](https://www.npmjs.com/package/express-rate-limit)

---
**Fecha**: 13 de Noviembre, 2024
**Estado**: ✅ Migración completada para Translation API
**Pendiente**: OpenAI y eliminación de variables antiguas
