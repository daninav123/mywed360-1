# 🔍 Búsqueda de Proveedores con Tavily Search API

> **Última actualización:** 2025-10-27  
> **Estado:** ✅ IMPLEMENTADO Y FUNCIONAL

---

## 🎯 Objetivo

Búsqueda **web real** de proveedores de bodas usando **Tavily Search API** + **scraping automático** para obtener:

- ✅ **Tarjetas de PROVEEDORES REALES**: Perfiles de empresas/profesionales específicos
- ✅ **Datos de contacto reales**: Email, Teléfono, Instagram del proveedor
- ✅ **Información completa**: Nombre, Ubicación, Imagen, Link
- ❌ **NO se aceptan**: Motores de búsqueda, directorios, listados de múltiples proveedores

---

## ⚠️ **CRÍTICO: Tarjeta de Proveedor Real vs Motor de Búsqueda**

### **✅ TARJETA DE PROVEEDOR REAL (CORRECTO)**

Una tarjeta de proveedor **DEBE SER**:

- 🏢 **Perfil específico de UNA empresa/profesional**
- 📧 **Datos de contacto directos** del proveedor
- 🌐 **Sitio web propio** o perfil único en un directorio
- 📸 **Fotos del trabajo** del proveedor
- 📝 **Descripción del proveedor** en primera persona ("Somos", "Ofrecemos")

**Ejemplos correctos:**
```
✅ "Delia Fotógrafos - Valencia"
   URL: https://www.bodas.net/fotografia/delia-fotografos--e123456
   → Perfil específico con ID único
   
✅ "Juan López Fotografía"
   URL: https://www.juanlopezfoto.com
   → Sitio web propio del fotógrafo
   
✅ "Estudio Fotográfico Valencia"
   URL: https://www.instagram.com/estudiofotovalencia
   → Perfil específico en Instagram
```

---

### **❌ MOTOR DE BÚSQUEDA / LISTADO (INCORRECTO)**

Una tarjeta **NO DEBE SER**:

- 🚫 **Página de búsqueda** de proveedores
- 🚫 **Directorio** con múltiples proveedores
- 🚫 **Categoría** genérica de servicios
- 🚫 **Listado** de opciones
- 🚫 **Comparador** de precios/proveedores

**Ejemplos incorrectos que SE DESCARTAN:**
```
❌ "Encuentra fotógrafos en Madrid"
   URL: https://www.bodas.net/fotografos?ciudad=madrid
   → Motor de búsqueda, NO proveedor específico
   
❌ "Mejores fotógrafos para bodas"
   URL: https://www.bodas.net/fotografia
   → Categoría genérica, NO perfil único
   
❌ "Directorio de DJ en Valencia"
   URL: https://www.proveedores.com/dj/valencia
   → Listado múltiple, NO proveedor individual
   
❌ "Compara precios de catering"
   URL: https://www.bodas.net/catering/compara
   → Comparador, NO proveedor directo
```

---

## 🔍 **Cómo Distinguir una Tarjeta Real**

### **Checklist de Validación:**

| Criterio | ✅ Tarjeta Real | ❌ Motor de Búsqueda |
|----------|----------------|---------------------|
| **URL** | Tiene ID único o dominio propio | Tiene `/buscar`, `/categoria`, `?q=` |
| **Título** | Nombre propio de empresa | "Encuentra", "Mejores", "Directorio" |
| **Contenido** | "Nuestros servicios", "Sobre nosotros" | "Compara", "Todos los proveedores" |
| **Email** | Email específico del proveedor | Email genérico o ausente |
| **Teléfono** | Teléfono directo | Sin teléfono o múltiples |
| **Imágenes** | Fotos del trabajo del proveedor | Logos genéricos o múltiples |
| **Descripción** | Primera persona ("Somos", "Ofrecemos") | Tercera persona ("Encuentra", "Compara") |

---

## 🎯 **Ejemplos Reales de Filtrado**

### **Caso 1: bodas.net**

```
❌ INCORRECTO:
   https://www.bodas.net/fotografos
   → Listado de todos los fotógrafos

❌ INCORRECTO:
   https://www.bodas.net/fotografia/valencia
   → Categoría de fotógrafos en Valencia
   
✅ CORRECTO:
   https://www.bodas.net/fotografia/delia-fotografos--e123456
   → Perfil específico con ID numérico (e123456)
```

### **Caso 2: Sitios propios**

```
❌ INCORRECTO:
   https://www.fotografosbodas.com/buscar?ciudad=madrid
   → Buscador dentro del sitio

✅ CORRECTO:
   https://www.deliafotografos.com
   → Sitio web propio del proveedor
   
✅ CORRECTO:
   https://www.deliafotografos.com/sobre-nosotros
   → Página específica del proveedor
```

### **Caso 3: Redes sociales**

```
❌ INCORRECTO:
   https://www.instagram.com/explore/tags/fotografosbodas
   → Hashtag genérico

✅ CORRECTO:
   https://www.instagram.com/deliafotografos
   → Perfil específico del proveedor
```

---

## 📋 Requisitos de cada Tarjeta de Proveedor

Cada proveedor devuelto por la API **DEBE** tener:

| Campo | Descripción | Obligatorio | Ejemplo |
|-------|-------------|-------------|---------|
| `title` | Nombre del proveedor (limpio) | ✅ Sí | "Delia Fotógrafos" |
| `link` | URL específica del perfil | ✅ Sí | "https://bodas.net/fotografia/delia-123456" |
| `email` | Email de contacto | ⚠️ Recomendado | "info@deliafotografos.com" |
| `phone` | Teléfono español | ⚠️ Recomendado | "+34 666 777 888" |
| `instagram` | URL del perfil de Instagram | ⚠️ Opcional | "https://instagram.com/deliafotografos" |
| `image` | URL de imagen principal | ⚠️ Recomendado | "https://cdn.bodas.net/img/..." |
| `location` | Ciudad española | ⚠️ Recomendado | "Valencia" |
| `snippet` | Descripción breve | ✅ Sí | "Fotografía de bodas con estilo..." |
| `service` | Tipo de servicio | ✅ Sí | "Fotografía" |
| `score` | Relevancia (0-1) | ✅ Sí | 0.95 |

---

## 🔧 Implementación Técnica

### **Endpoint**

```
POST /api/ai-suppliers-tavily
```

### **Request**

```json
{
  "query": "fotógrafo de bodas",
  "service": "Fotografía",
  "location": "Madrid",
  "budget": 3000,
  "profile": {
    "style": "moderno",
    "guests": 120,
    "date": "2025-06-15"
  },
  "useRanking": false
}
```

### **Response**

```json
[
  {
    "title": "Delia Fotógrafos",
    "link": "https://www.bodas.net/fotografia/delia-fotografos--e123456",
    "image": "https://cdn.bodas.net/img/fotografos/delia-123.jpg",
    "snippet": "Fotografía de bodas con estilo natural y moderno. 15 años de experiencia...",
    "service": "Fotografía",
    "location": "Valencia",
    "email": "info@deliafotografos.com",
    "phone": "+34 666 777 888",
    "instagram": "https://www.instagram.com/deliafotografos",
    "priceRange": "",
    "tags": [],
    "score": 0.95
  }
]
```

---

## 🎨 Visualización en el Frontend

### **Componente: AIResultList.jsx**

Cada tarjeta muestra:

```jsx
<Card>
  {/* Imagen del proveedor */}
  <img src={result.image} alt={result.title} />
  
  {/* Nombre y ubicación */}
  <h3>{result.title}</h3>
  <p>{result.location}</p>
  
  {/* Iconos de contacto */}
  <div className="flex gap-3">
    {result.email && (
      <a href={`mailto:${result.email}`}>
        <Mail size={14} /> {result.email}
      </a>
    )}
    
    {result.phone && (
      <a href={`tel:${result.phone}`}>
        <Phone size={14} /> {result.phone}
      </a>
    )}
    
    {result.instagram && (
      <a href={result.instagram} target="_blank">
        <Instagram size={14} /> Instagram
      </a>
    )}
  </div>
  
  {/* Descripción */}
  <p>{result.snippet}</p>
  
  {/* Enlace al sitio */}
  <a href={result.link} target="_blank">
    Ver perfil completo →
  </a>
</Card>
```

---

## 🚫 Filtrado de Calidad

### **URLs Descartadas:**

❌ `/buscar`, `/search`, `/resultados`  
❌ `/directorio`, `/listado`, `/categoria`  
❌ `?q=`, `?search=`, `?query=`  
❌ `/fotografos-bodas/` (categoría genérica)  
❌ `bodas.net/fotografia` (sin ID numérico)

### **URLs Aceptadas:**

✅ `bodas.net/fotografia/delia-fotografos--e123456` (con ID)  
✅ `www.fotografovalencia.com/sobre-mi`  
✅ `www.instagram.com/deliafotografos`

### **Títulos Descartados:**

❌ "Encuentra fotógrafos en Madrid"  
❌ "Mejores proveedores de bodas"  
❌ "Directorio de fotógrafos"  
❌ "Listado de DJ para bodas"

### **Títulos Aceptados:**

✅ "Delia Fotógrafos"  
✅ "Juan López Fotografía"  
✅ "Estudio Fotográfico Valencia"

### **Contenido Descartado:**

❌ "Compara precios de proveedores"  
❌ "Todos los fotógrafos en Madrid"  
❌ "Encuentra el mejor catering"

### **Contenido Aceptado:**

✅ "Nuestros servicios de fotografía"  
✅ "Sobre nosotros - Portfolio"  
✅ "Contacta con nosotros"

---

## 🔄 Proceso Interno

### **1. Tavily Search** (20 resultados iniciales)

```javascript
const response = await fetch('https://api.tavily.com/search', {
  method: 'POST',
  body: JSON.stringify({
    api_key: process.env.TAVILY_API_KEY,
    query: `"${query}" ${location} contacto portfolio sobre -directorio -buscar`,
    search_depth: 'advanced',
    include_raw_content: true,
    include_images: true,
    max_results: 20
  })
});
```

### **2. Scraping Paralelo**

Para cada URL válida:

```javascript
const scrapedData = await scrapeProviderData(url);

// Extrae:
// - Email: Regex /[\w.-]+@[\w.-]+\.\w+/
// - Teléfono: Regex /(?:\+34|0034)?\s?[6789]\d{2}\s?\d{3}\s?\d{3}/
// - Instagram: href="https://instagram.com/usuario"
// - Imagen: og:image > twitter:image > primera img válida
```

### **3. Filtrado Multicapa**

```javascript
const validResults = results.filter(result => {
  // Capa 1: URL válida
  const validUrl = isValidProviderUrl(result.url);
  
  // Capa 2: Título específico
  const validTitle = !isGenericTitle(result.title);
  
  // Capa 3: Contenido de proveedor único
  const uniqueProvider = hasUniqueProviderIndicators(result.content);
  
  return validUrl && validTitle && uniqueProvider;
});
```

### **4. 🆕 Deduplicación por Email y URL**

```javascript
const seenEmails = new Set();
const seenUrls = new Set();

const uniqueResults = validResults.filter(result => {
  // Si tiene email, verificar que no esté duplicado
  if (result.email && result.email.trim() !== '') {
    const emailLower = result.email.toLowerCase().trim();
    if (seenEmails.has(emailLower)) {
      console.log(`🗑️ [DEDUP] Duplicado por email: ${result.title}`);
      return false;
    }
    seenEmails.add(emailLower);
  }
  
  // También verificar URLs duplicadas
  const baseDomain = `${url.hostname}${url.pathname}`;
  if (seenUrls.has(baseDomain)) {
    console.log(`🗑️ [DEDUP] Duplicado por URL: ${result.title}`);
    return false;
  }
  seenUrls.add(baseDomain);
  
  return true;
});
```

**¿Por qué es necesario?**
- ⚠️ **Problema**: Tavily puede devolver el mismo proveedor en múltiples URLs
- ⚠️ **Ejemplo**: `bodas.net/fotografia/delia--e123` y `www.deliafotografos.com` → mismo email
- ✅ **Solución**: Solo mostrar el proveedor una vez (el primer resultado encontrado)

### **5. Limpieza de Nombres**

```javascript
// Antes:
"Delia Fotógrafos - Consulta disponibilidad | Bodas.net"

// Después:
"Delia Fotógrafos"
```

### **6. Extracción de Ubicación**

```javascript
// Busca ciudades españolas en el contenido:
const cities = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', ...];
const location = extractLocation(content, cities);
```

### **7. Top 8 Resultados**

Solo devuelve los **8 mejores proveedores únicos** con mayor score (después de deduplicar).

---

## ⚙️ Variables de Entorno

### **Backend (.env)**

```env
# Tavily Search API (REQUERIDO)
TAVILY_API_KEY=tvly-dev-xxxxx

# OpenAI (OPCIONAL - solo para ranking)
OPENAI_API_KEY=sk-proj-xxxxx
OPENAI_MODEL=gpt-4o-mini
```

### **Frontend (.env)**

```env
# Especifica que use Tavily
VITE_SEARCH_PROVIDER=tavily
```

---

## 📊 Límites y Costos

### **Tavily API**

- ✅ **1,000 búsquedas/mes GRATIS**
- ⚠️ `search_depth: 'advanced'` consume **2 créditos** por búsqueda
- 💰 Adicionales: **$1 por 1,000 búsquedas**

### **Scraping**

- ⏱️ Timeout: **10 segundos** por URL
- 🔄 Máximo: **20 URLs** en paralelo

---

## 🧪 Testing

### **Test Manual**

1. Ve a **Proveedores** → **Buscar con IA**
2. Busca: `"fotógrafo de bodas en Valencia"`
3. Verifica que las tarjetas tengan:
   - ✅ Email (icono azul)
   - ✅ Teléfono (icono verde)
   - ✅ Instagram (icono rosa)
   - ✅ Imagen del proveedor
   - ✅ Link que lleve a perfil específico

### **Test E2E**

```bash
npm run test:e2e -- --spec cypress/e2e/ai-supplier-search.cy.js
```

### **Verificación en Terminal**

```
================================================================================
✅ [FILTRO] 6/20 resultados son proveedores específicos

📋 Proveedores válidos encontrados:
  1. Delia Fotógrafos
     URL: https://www.bodas.net/fotografia/delia-fotografos--e123456
  2. Fotógrafo Valencia - Juan López
     URL: https://www.juanlopezfoto.com/sobre-mi
================================================================================

🎯 [FILTRO] Devolviendo los mejores 6 proveedores
```

---

## 🐛 Troubleshooting

### **No se muestran resultados**

**Posibles causas:**
1. ❌ Tavily devolvió solo páginas de búsqueda (todas filtradas)
2. ❌ Query demasiado genérica
3. ❌ Ubicación muy específica sin resultados

**Solución:**
- Intenta con búsquedas más específicas: `"delia fotógrafos valencia"`
- Amplía la ubicación: "Madrid" → "España"
- Revisa los logs en terminal para ver qué se filtró

### **Proveedores con datos incompletos**

**Posibles causas:**
1. ⚠️ Sitio web sin email/teléfono visible
2. ⚠️ Scraping falló (timeout, 403, etc.)
3. ⚠️ Formato no detectado por regex

**Solución:**
- Los proveedores se muestran aunque falten datos
- Email, teléfono e Instagram son **opcionales**
- Solo `title`, `link` y `snippet` son obligatorios

### **Sigo viendo páginas de listado**

**Causas:**
1. ❌ Filtros no están funcionando
2. ❌ Tavily devuelve URLs sin ID

**Solución:**
- Verifica los logs: `❌ [FILTRO] Descartando URL...`
- Ajusta los patrones de filtrado en el código
- Reporta las URLs problemáticas para mejorar el filtro

---

## 📝 Changelog

### **2025-10-27**
- ✅ Implementación inicial con Tavily Search API
- ✅ Scraping automático de email, teléfono, Instagram
- ✅ Filtrado multicapa (URLs, títulos, contenido)
- ✅ Limpieza de nombres de proveedores
- ✅ Extracción de ubicaciones españolas
- ✅ Visualización con iconos de contacto
- ✅ Top 8 resultados únicos

---

## 📚 Referencias

- **Tavily API Docs**: https://docs.tavily.com/
- **Flujo 5 - Proveedores**: `docs/flujos-especificos/flujo-5-proveedores-ia.md`
- **Configuración Tavily**: `docs/CONFIGURACION-TAVILY.md`
- **Código Backend**: `backend/routes/ai-suppliers-tavily.js`
- **Código Frontend**: `src/components/proveedores/ai/AIResultList.jsx`

---

**🎉 ¡Búsqueda de proveedores reales implementada con éxito!**
