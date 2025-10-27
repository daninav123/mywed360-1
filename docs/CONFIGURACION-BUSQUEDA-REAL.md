# Configuración de Búsqueda Real de Proveedores

## 📋 Problema

Por defecto, OpenAI GPT **NO tiene acceso a internet** y genera proveedores ficticios/mockeados. Para obtener resultados **REALES**, necesitas integrar una API de búsqueda web.

## ✅ Solución Implementada

Se ha creado un nuevo endpoint `/api/ai-suppliers-real` que integra:
- **Google Custom Search API** para buscar proveedores reales en internet
- **OpenAI GPT** para estructurar y filtrar los resultados

---

## 🔧 Pasos de Configuración

### 1. Obtener Google Custom Search API Key

#### 1.1 Crear un proyecto en Google Cloud Console
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API "Custom Search API":
   - Ve a "APIs y servicios" → "Biblioteca"
   - Busca "Custom Search API"
   - Haz clic en "Habilitar"

#### 1.2 Crear credenciales
1. Ve a "APIs y servicios" → "Credenciales"
2. Haz clic en "Crear credenciales" → "Clave de API"
3. Copia la **API Key** generada

### 2. Crear un Custom Search Engine (CSE)

1. Ve a [Programmable Search Engine](https://programmablesearchengine.google.com/controlpanel/all)
2. Haz clic en "Add" (Agregar)
3. Configura tu motor de búsqueda:
   ```
   Nombre: Proveedores de Bodas España
   Qué buscar: Sitios específicos o toda la web
   Seleccionar: "Buscar en toda la web"
   ```
4. Haz clic en "Crear"
5. En la configuración, activa "Búsqueda de imágenes" (opcional)
6. Copia el **Search Engine ID** (cx)

### 3. Configurar Variables de Entorno

Añade estas variables en tu archivo `.env` del **backend**:

```env
# Google Custom Search API
GOOGLE_SEARCH_API_KEY=tu_api_key_aqui
GOOGLE_SEARCH_CX=tu_search_engine_id_aqui

# OpenAI (ya debería estar configurada)
OPENAI_API_KEY=tu_openai_key_aqui
OPENAI_MODEL=gpt-4o-mini
```

### 4. Activar Búsqueda Real en Frontend

En el archivo `.env` del **frontend**, añade:

```env
# Activar búsqueda real (en lugar de generada)
VITE_USE_REAL_SEARCH=true
```

---

## 💰 Límites y Costos

### Google Custom Search API
- **Gratuito**: 100 búsquedas/día
- **Costo**: $5 por cada 1,000 búsquedas adicionales
- Ver: [Precios de Google Custom Search](https://developers.google.com/custom-search/v1/overview#pricing)

### OpenAI API
- Depende del modelo usado
- `gpt-4o-mini`: ~$0.15 por cada 1,000 peticiones (muy económico)
- `gpt-4-turbo`: ~$10 por cada 1,000 peticiones

---

## 🧪 Probar la Configuración

### Verificar que las variables están cargadas

1. Reinicia el backend después de configurar las variables
2. Revisa los logs al iniciar:
   ```
   [ai-suppliers-real] Cliente OpenAI inicializado
   ```

### Probar una búsqueda

1. En el frontend, ve a la página de Proveedores
2. Usa el buscador IA: "fotógrafo de bodas en Madrid"
3. Revisa los logs del navegador:
   ```
   [useAISearch] ✅ Respuesta exitosa de ai-suppliers: [...]
   ```

4. Verifica que los resultados tengan **URLs reales** de proveedores

---

## 🔄 Comparación: Búsqueda Real vs Generada

| Característica | Búsqueda Generada | Búsqueda Real |
|---------------|------------------|---------------|
| **Requiere API externa** | ❌ No | ✅ Sí (Google Search) |
| **Costo** | Solo OpenAI | OpenAI + Google Search |
| **Resultados** | Ficticios/Inventados | Reales con URLs verificables |
| **Calidad** | Suena real pero es mock | Proveedores que existen |
| **Configuración** | Solo `OPENAI_API_KEY` | Requiere 3 keys |

---

## 🐛 Troubleshooting

### Error: "GOOGLE_SEARCH_NOT_CONFIGURED"

**Causa**: No has configurado las variables de Google Search

**Solución**:
1. Verifica que `GOOGLE_SEARCH_API_KEY` y `GOOGLE_SEARCH_CX` estén en `.env`
2. Reinicia el backend
3. Verifica que las variables se cargan: `console.log(process.env.GOOGLE_SEARCH_API_KEY)`

### Error: "Google Search API error: 403"

**Causa**: API key inválida o sin permisos

**Solución**:
1. Verifica que la Custom Search API esté habilitada en tu proyecto
2. Regenera la API key si es necesario
3. Verifica que no haya restricciones de IP/dominio en la key

### Error: "Google Search API error: 429"

**Causa**: Has excedido el límite de 100 búsquedas/día gratuitas

**Solución**:
1. Espera 24 horas para que se resetee el límite
2. O configura billing en Google Cloud para búsquedas adicionales

### Los resultados siguen siendo ficticios

**Causa**: El frontend sigue usando el endpoint antiguo

**Solución**:
1. Verifica que `VITE_USE_REAL_SEARCH=true` esté en `.env` del frontend
2. Reinicia el servidor de desarrollo del frontend
3. Limpia caché: `rm -rf node_modules/.vite`
4. Verifica en los logs que use `/api/ai-suppliers-real`

---

## 📚 Alternativas

Si no quieres usar Google Custom Search API, hay otras opciones:

### Opción 2: SerpAPI
- Web: https://serpapi.com/
- Costo: $50/mes por 5,000 búsquedas
- Ventaja: Más fácil de configurar, resultados más ricos

### Opción 3: Bing Search API
- Web: https://www.microsoft.com/en-us/bing/apis/bing-web-search-api
- Costo: 1,000 búsquedas gratis/mes, luego $7/1000
- Ventaja: Integración con Azure

### Opción 4: Base de datos propia
- Scrapear/importar datos de bodas.net, bodas.com.mx, etc.
- Almacenar en Firestore o base de datos propia
- Ventaja: Sin costo por búsqueda, control total

---

## 📝 Resumen de Configuración Rápida

```bash
# 1. Backend .env
GOOGLE_SEARCH_API_KEY=AIzaSy...
GOOGLE_SEARCH_CX=017576662...
OPENAI_API_KEY=sk-proj-...

# 2. Frontend .env
VITE_USE_REAL_SEARCH=true

# 3. Reiniciar servicios
# Backend
cd backend && npm run dev

# Frontend (en otra terminal)
cd .. && npm run dev
```

¡Listo! Ahora el buscador de proveedores mostrará resultados **REALES** de internet.
