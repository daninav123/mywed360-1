# 🚀 Configuración Tavily - Búsqueda Real de Proveedores

## ✅ ¿Por qué Tavily?

**Tavily** es una API de búsqueda web optimizada específicamente para aplicaciones de IA. A diferencia de Google Search, Tavily:

- ✅ **Diseñada para IA/RAG** - Resultados pre-procesados para modelos de lenguaje
- ✅ **1,000 búsquedas/mes GRATIS** - 10x más que Google (100/mes)
- ✅ **Setup en 2 minutos** - Solo 1 API key
- ✅ **Resultados más limpios** - Menos ruido, más precisión
- ✅ **Más económica** - $1/1000 adicionales vs $5/1000 de Google

---

## 🔧 Configuración (2 minutos)

### Paso 1: Obtener API Key de Tavily

1. Ve a https://tavily.com/
2. Regístrate gratis (email + contraseña)
3. Verifica tu email
4. Copia tu **API Key** (empieza con `tvly-`)

🎉 **Ya tienes 1,000 búsquedas/mes gratis**

---

### Paso 2: Configurar Backend

Añade tu API key en `backend/.env`:

```env
# Tavily Search API
TAVILY_API_KEY=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

# OpenAI (ya deberías tenerla)
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
```

---

### Paso 3: Activar en Frontend

Añade en `.env` (raíz del proyecto):

```env
VITE_SEARCH_PROVIDER=tavily
```

---

### Paso 4: Reiniciar Servicios

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd ..
npm run dev
```

---

## 🧪 Probar que Funciona

1. Abre http://localhost:5173
2. Ve a la página de **Proveedores**
3. Busca: `"fotógrafo de bodas en Madrid"`
4. Verifica en consola del navegador:
   ```
   [useAISearch] ✅ Respuesta exitosa de ai-suppliers: [...]
   ```
5. Los resultados deben tener **URLs reales** (bodas.net, Instagram, etc.)

---

## 🔍 Cómo Funciona

```
Tu búsqueda
    ↓
Frontend (useAISearch.jsx)
    ↓
POST /api/ai-suppliers-tavily
    ↓
Backend consulta Tavily API
    ↓ (Resultados web reales)
Backend usa OpenAI para estructurar
    ↓
Frontend muestra proveedores reales
```

---

## 💰 Límites y Costos

### Plan Gratuito (el que tienes)
- ✅ **1,000 búsquedas/mes** gratis
- ✅ Sin tarjeta de crédito requerida
- ✅ Suficiente para desarrollo y pruebas

### Si excedes 1,000/mes
- **Básico**: $1 por cada 1,000 búsquedas
- **Pro**: $49/mes por 10,000 búsquedas
- Ver: https://tavily.com/pricing

### Costo típico mensual (producción pequeña)
- Tavily: **$0** (dentro del límite gratuito)
- OpenAI: **~$2-5** (estructurar resultados con gpt-4o-mini)
- **Total: $2-5/mes** 🎉

---

## 📊 Comparación: Tavily vs Google vs Solo GPT

| Característica | Tavily ⭐ | Google Search | Solo GPT |
|---------------|-----------|---------------|----------|
| **Datos reales** | ✅ Sí | ✅ Sí | ❌ Ficticios |
| **Búsquedas gratis** | 1,000/mes | 100/día | ∞ |
| **Setup** | 2 min (1 key) | 5 min (2 keys) | 0 min |
| **Optimizado IA** | ✅ Sí | ❌ No | N/A |
| **Costo extra** | $1/1000 | $5/1000 | $0 |
| **Calidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |

---

## 🐛 Troubleshooting

### Error: "TAVILY_API_KEY missing"

**Causa**: No has configurado la variable de entorno

**Solución**:
1. Verifica que `TAVILY_API_KEY` esté en `backend/.env`
2. Reinicia el backend
3. Comprueba en logs: `[ai-suppliers-tavily] Cliente OpenAI inicializado`

---

### Error: "Tavily API error 401"

**Causa**: API key inválida

**Solución**:
1. Verifica que copiaste la key completa (empieza con `tvly-`)
2. Regenera la key en https://tavily.com/dashboard
3. Actualiza `.env` y reinicia

---

### Los resultados siguen siendo ficticios

**Causa**: Frontend no está usando Tavily

**Solución**:
1. Verifica que `.env` tenga `VITE_SEARCH_PROVIDER=tavily`
2. Reinicia el frontend
3. Limpia caché: `rm -rf node_modules/.vite`
4. Verifica en logs que use `/api/ai-suppliers-tavily`

---

### Error: "Tavily API error 429"

**Causa**: Excediste 1,000 búsquedas/mes

**Solución**:
- Espera al siguiente ciclo mensual
- O configura billing en Tavily para búsquedas adicionales

---

## 🎯 Dominios Incluidos

El endpoint de Tavily prioriza resultados de:
- ✅ `bodas.net`
- ✅ `bodas.com.mx`
- ✅ `instagram.com` (perfiles de proveedores)
- ✅ `facebook.com` (páginas de proveedores)

Puedes añadir más dominios editando `backend/routes/ai-suppliers-tavily.js`:

```javascript
include_domains: [
  'bodas.net',
  'bodas.com.mx',
  'instagram.com',
  'facebook.com',
  'tusitio.com',  // Añade aquí
],
```

---

## 📈 Monitorear Uso

### Ver tus estadísticas en Tavily:
1. Ve a https://tavily.com/dashboard
2. Sección "Usage"
3. Verás: búsquedas usadas, restantes, histórico

### Logs en tu backend:
Busca en los logs del backend:
```
[ai-suppliers-tavily] Iniciando búsqueda real con Tavily
[ai-suppliers-tavily] Resultados de Tavily obtenidos { count: 10 }
[ai-suppliers-tavily] Proveedores estructurados { count: 6 }
```

---

## 🚀 Optimizaciones Opcionales

### Usar caché para búsquedas repetidas

Puedes guardar resultados en Firestore por 24h para no consumir búsquedas innecesarias:

```javascript
// En backend/routes/ai-suppliers-tavily.js
// Antes de llamar a Tavily, buscar en caché:
const cacheKey = `search:${query}:${location}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Después de obtener resultados, guardar:
await redis.set(cacheKey, JSON.stringify(results), 'EX', 86400); // 24h
```

### Ajustar profundidad de búsqueda

En `backend/routes/ai-suppliers-tavily.js`:

```javascript
search_depth: 'advanced', // 'basic' o 'advanced'
// 'advanced' da mejores resultados pero consume 2 créditos por búsqueda
```

---

## ✅ Resumen

**Ya tienes configurado:**
- ✅ Tavily API Key en backend
- ✅ Frontend configurado para usar Tavily
- ✅ 1,000 búsquedas/mes gratis

**Próximos pasos:**
1. Probar una búsqueda en el frontend
2. Verificar que los resultados tengan URLs reales
3. Disfrutar de datos reales sin inventos 🎉

---

## 📞 Soporte

- **Tavily Docs**: https://docs.tavily.com/
- **Tavily Discord**: https://discord.gg/tavily
- **Issues**: Crear issue en tu repositorio GitHub
