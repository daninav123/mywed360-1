# Tavily vs Google Places - Análisis de Uso

**Fecha:** 20 de Noviembre 2025

---

## 📊 Resumen Rápido

| Aspecto                | Tavily                                  | Google Places             |
| ---------------------- | --------------------------------------- | ------------------------- |
| **Tipo**               | Buscador web (como Google)              | Base de datos de negocios |
| **Uso en el proyecto** | Blog research + Búsqueda de proveedores | Búsqueda de proveedores   |
| **Estado**             | ⚠️ API key inválida                     | ✅ Funcionando            |
| **Crítico**            | ⚠️ Parcialmente (fallback activo)       | ✅ Sí                     |

---

## 🔍 ¿Qué es Tavily?

**Tavily es un buscador web** (similar a Google, pero especializado en búsqueda de información).

### Características:

- ✅ Busca en internet en tiempo real
- ✅ Retorna artículos, blogs, noticias
- ✅ Puede extraer respuestas resumidas
- ✅ Permite búsquedas avanzadas
- ✅ Incluye imágenes y contenido raw

### Endpoint:

```
https://api.tavily.com/search
```

---

## 📍 ¿Qué es Google Places?

**Google Places es una base de datos de negocios** (restaurantes, tiendas, servicios, etc.).

### Características:

- ✅ Información estructurada de negocios
- ✅ Reseñas y calificaciones
- ✅ Horarios de apertura
- ✅ Teléfono y dirección
- ✅ Fotos del negocio

### Endpoint:

```
https://maps.googleapis.com/maps/api/place/...
```

---

## 🎯 Cómo se Usan en el Proyecto

### 1. **Tavily - Blog Research**

**Archivo:** `backend/services/blogResearchService.js`

**Propósito:** Investigar tópicos para artículos de blog

**Query Ejemplo:**

```
"Tendencias de decoración de bodas 2025 España"
```

**Retorna:**

- Artículos sobre tendencias
- Blogs de bodas
- Noticias de la industria
- Resumen de información

**Uso en Blog Automation:**

```javascript
const researchData = await researchTopic({
  topic: 'Decoración de bodas modernas',
  language: 'es',
});
// Retorna: { summary, references, provider: 'tavily' }
```

---

### 2. **Tavily - Búsqueda de Proveedores**

**Archivo:** `backend/routes/ai-suppliers-web.js`

**Propósito:** Buscar proveedores de bodas en internet

**Query Ejemplo:**

```
"Fotógrafo de bodas Madrid proveedor bodas"
```

**Retorna:**

- Sitios web de fotógrafos
- Portales de bodas (bodas.net, etc.)
- Perfiles en Instagram
- Información de contacto

**Uso:**

```javascript
const webResults = await searchWithTavily('Fotógrafo', 'Madrid', { service: 'Fotografía' });
// Luego procesa con OpenAI para extraer info estructurada
```

---

### 3. **Google Places - Búsqueda de Proveedores**

**Archivo:** `backend/routes/suppliers-hybrid.js`

**Propósito:** Buscar proveedores locales con información estructurada

**Query Ejemplo:**

```
"Fotógrafo de bodas" en Madrid
```

**Retorna:**

- Nombre del negocio
- Dirección exacta
- Teléfono
- Reseñas y calificación
- Horarios
- Fotos

**Uso:**

```javascript
const places = await searchGooglePlaces('Fotógrafo de bodas', { lat: 40.4168, lng: -3.7038 });
// Retorna: [{ name, address, phone, rating, ... }]
```

---

## 🔄 Flujo de Búsqueda Híbrida

```
Usuario busca: "Fotógrafo en Madrid"
        ↓
┌───────────────────────────────────┐
│  Búsqueda Híbrida (suppliers-hybrid.js)
└───────────────────────────────────┘
        ↓
    ┌─────────────────┬──────────────────┐
    ↓                 ↓
Google Places      Tavily Search
(Datos locales)    (Web search)
    ↓                 ↓
Negocios          Sitios web
Reseñas           Portales
Teléfono          Redes sociales
    ↓                 ↓
    └─────────────────┬──────────────────┘
            ↓
    Resultados combinados
    (Google Places + Tavily)
            ↓
    Procesar con OpenAI
    (Extraer info estructurada)
            ↓
    Mostrar al usuario
```

---

## 📊 Estado Actual

### ✅ Google Places - FUNCIONANDO

- API key: `AIzaSyDntGoRsW-5Bb8ojYqVa-ZIUYclj-nVtVk`
- Estado: ✅ Válida y funcionando
- Uso: Búsqueda de proveedores locales

### ⚠️ Tavily - INVÁLIDA

- API key: `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`
- Estado: ❌ Expirada o deshabilitada
- Error: `401 Unauthorized`
- Impacto: Blog research y búsqueda web de proveedores

---

## 🎯 Casos de Uso

### Tavily es NECESARIO para:

1. **Blog Research** - Investigar tópicos para artículos
   - Buscar tendencias de bodas
   - Encontrar información actualizada
   - Generar resúmenes

2. **Búsqueda Web de Proveedores** - Encontrar sitios web
   - Fotógrafos en redes sociales
   - Portales de bodas
   - Información en internet

### Google Places es NECESARIO para:

1. **Búsqueda Local de Proveedores** - Información estructurada
   - Dirección exacta
   - Teléfono
   - Reseñas
   - Horarios

---

## 💡 ¿Se Usa Solo Google Places?

**NO.** Se usan ambos:

- **Google Places** → Información local estructurada
- **Tavily** → Búsqueda web en tiempo real

**Complementarios, no sustitutos.**

---

## 🔧 Solución Actual

### Con Tavily inválida:

- ✅ Google Places sigue funcionando
- ✅ Búsqueda local de proveedores funciona
- ⚠️ Blog research usa fallback (contenido por defecto)
- ⚠️ Búsqueda web de proveedores usa fallback

### Fallbacks implementados:

```javascript
// Si Tavily falla, retorna:
{
  provider: 'tavily-error',
  summary: '',
  references: [],
  raw: { error: 'Unauthorized' }
}

// Blog automation continúa con contenido por defecto
```

---

## 📋 Resumen

| Aspecto      | Tavily                    | Google Places             |
| ------------ | ------------------------- | ------------------------- |
| **¿Qué es?** | Buscador web              | Base de datos de negocios |
| **¿Se usa?** | ✅ Sí (blog + web search) | ✅ Sí (búsqueda local)    |
| **Estado**   | ❌ Inválida               | ✅ Funcionando            |
| **Crítico**  | ⚠️ Parcialmente           | ✅ Sí                     |
| **Fallback** | ✅ Activo                 | ✅ Activo                 |

---

## 🚀 Próximos Pasos

1. **Obtener API key válida de Tavily**
   - Ir a https://tavily.com/
   - Crear nueva API key
   - Actualizar `backend/.env` línea 64

2. **Reiniciar backend**

   ```bash
   pkill -9 node
   npm run dev:all
   ```

3. **Verificar funcionamiento**
   - Blog research debería funcionar
   - Búsqueda web de proveedores debería funcionar

---

**Conclusión:** Se usan ambas APIs. Tavily es para búsqueda web, Google Places es para información local estructurada. Actualmente Google Places funciona, Tavily está inválida pero con fallback activo.
