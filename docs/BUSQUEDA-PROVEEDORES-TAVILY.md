# 🔍 Búsqueda de Proveedores con Tavily Search API

> **Última actualización:** 2025-10-27  
> **Estado:** ✅ IMPLEMENTADO Y FUNCIONAL

---

## 🎯 Objetivo

Búsqueda **inteligente** de proveedores de bodas usando **GPT + Tavily Search API** + **scraping automático**:

- 🧠 **GPT enriquece la búsqueda**: Analiza qué datos son relevantes (ubicación, presupuesto, estilo)
- 🌐 **Tavily busca en internet REAL**: bodas.net, sitios propios, Instagram profesional
- 🗑️ **Filtra páginas de listado**: Solo perfiles específicos, NO buscadores de bodas.net
- 🔄 **Deduplica por contacto**: Email > Teléfono > URL > Nombre (un proveedor = una tarjeta)
- 📇 **Tarjeta completa**: Nombre, descripción, imagen, email, teléfono, web, Instagram

**Resultado final:**
- ✅ **Proveedores REALES únicos** con datos de contacto verificados
- ❌ **NO listados**, NO directorios, NO duplicados

---

## 🔄 **Flujo Completo del Sistema**

### **PASO 1: 🧠 GPT Enriquece la Búsqueda**

**Entrada:**
```javascript
query: "fotógrafo"
location: "Valencia"
budget: "2000€"
service: "fotografía"
```

**Proceso:**
```javascript
// GPT analiza y decide qué datos añadir a la búsqueda
async function enrichQueryWithGPT(query, location, budget, service) {
  // Prompt: "Analiza esta búsqueda y crea query optimizada..."
  // GPT decide: ubicación es crítica, presupuesto puede omitirse
}
```

**Salida:**
```javascript
enrichedQuery: "fotógrafo de bodas Valencia contacto email teléfono"
```

**¿Por qué GPT?**
- ✅ Decide automáticamente qué datos son relevantes
- ✅ No sobrecarga la búsqueda con info innecesaria
- ✅ Optimiza para encontrar proveedores con datos de contacto

---

### **PASO 2: 🌐 Tavily Busca en Internet Real**

**Query enviada a Tavily:**
```javascript
searchQuery: "fotógrafo de bodas Valencia contacto -buscar -encuentra -directorio"
```

**Tavily busca en:**
- ✅ bodas.net (motor especializado en bodas España)
- ✅ bodas.com.mx, matrimonio.com.co (otros países)
- ✅ zankyou.es, casar.com (directorios especializados)
- ✅ Sitios web propios (.com, .es)
- ✅ Instagram profesional

**Excluye automáticamente:**
- ❌ wikipedia.org
- ❌ wallapop.com, milanuncios.com
- ❌ amazon, ebay, pinterest
- ❌ youtube.com

**Resultados Tavily (50 URLs):**
```javascript
[
  { url: "bodas.net/fotografia/delia--e123456", title: "Delia Fotógrafos", ... },
  { url: "bodas.net/fotografia", title: "Fotógrafos Valencia", ... },  // ← Listado
  { url: "juanlopezfoto.com", title: "Juan López Fotografía", ... },
  { url: "bodas.net/fotografia/juan--e789012", title: "Juan López", ... },  // ← Duplicado
  { url: "instagram.com/deliafotografos", title: "Delia Fotógrafos IG", ... },  // ← Duplicado
  { url: "wikipedia.org/...", title: "Fotografía", ... }  // ← No relevante
]
```

---

### **PASO 3: 🗑️ Filtrar Páginas de Listado**

**Filtros aplicados:**

**A. Dominio no relevante:**
```javascript
❌ wikipedia.org → DESCARTADO
❌ wallapop.com → DESCARTADO
✅ bodas.net → PASA (puede tener perfiles)
✅ juanlopezfoto.com → PASA
```

**B. Patrón de listado en URL:**
```javascript
❌ bodas.net/fotografia → DESCARTADO (categoría sin ID)
❌ bodas.net/buscar?q=foto → DESCARTADO (buscador)
✅ bodas.net/fotografia/delia--e123456 → PASA (tiene ID)
✅ juanlopezfoto.com → PASA
```

**C. Título de listado:**
```javascript
❌ "Encuentra los mejores fotógrafos" → DESCARTADO
❌ "Directorio de proveedores" → DESCARTADO
✅ "Delia Fotógrafos" → PASA
✅ "Juan López Fotografía" → PASA
```

**D. Contenido de listado:**
```javascript
❌ "Compara precios de todos los fotógrafos..." → DESCARTADO
✅ "Somos un equipo de fotógrafos profesionales..." → PASA
```

**Resultados después del filtrado (20 proveedores):**
```javascript
[
  { url: "bodas.net/fotografia/delia--e123456", ... },
  { url: "juanlopezfoto.com", ... },
  { url: "bodas.net/fotografia/juan--e789012", ... },
  { url: "instagram.com/deliafotografos", ... }
]
```

---

### **PASO 4: 🔄 Deduplicación por Contacto**

**Prioridad de deduplicación:** Email > Teléfono > URL > Nombre

**Ejemplo:**

```javascript
ANTES (4 resultados):
1. "Delia Fotógrafos" (bodas.net)
   email: info@deliafotografos.com
   phone: +34 612 345 678

2. "Delia Photography" (deliafotografos.com)
   email: info@deliafotografos.com  ← MISMO EMAIL
   phone: +34 612 345 678

3. "Delia Studio" (instagram.com/deliafotografos)
   email: contacto@deliafotografos.com
   phone: +34 612 345 678  ← MISMO TELÉFONO

4. "Juan López Fotografía" (juanlopezfoto.com)
   email: juan@lopez.com
   phone: +34 666 777 888

DEDUPLICACIÓN:
→ #1: ✅ SE MANTIENE (primer email)
→ #2: ❌ DESCARTADO (email duplicado)
→ #3: ❌ DESCARTADO (teléfono duplicado)
→ #4: ✅ SE MANTIENE (email y teléfono únicos)

DESPUÉS (2 resultados únicos):
1. "Delia Fotógrafos" (bodas.net)
2. "Juan López Fotografía" (juanlopezfoto.com)
```

**Logs:**
```
🗑️ [DEDUP-EMAIL] Delia Photography (info@deliafotografos.com)
🗑️ [DEDUP-PHONE] Delia Studio (+34 612 345 678)
🔄 [DEDUP] 4 → 2 resultados únicos
```

**Beneficio:** **Un proveedor = una tarjeta**, aunque tenga múltiples URLs

---

### **PASO 5: 📇 Tarjeta Completa del Proveedor**

**Scraping automático de cada URL:**
```javascript
// Para cada proveedor único, scraping de:
- Email (regex en contenido HTML)
- Teléfono (regex +34, 6XX, 9XX)
- Instagram (buscar links a instagram.com)
- Imagen (og:image, twitter:image, primera imagen grande)
```

**Formato final de cada tarjeta:**
```json
{
  "name": "Delia Fotógrafos",
  "snippet": "Especialistas en fotografía de bodas en Valencia. Estilo natural y reportaje documental.",
  "image": "https://bodas.net/img/delia-portfolio.jpg",
  "email": "info@deliafotografos.com",
  "phone": "+34 612 345 678",
  "link": "https://bodas.net/fotografia/delia-fotografos--e123456",
  "instagram": "https://instagram.com/deliafotografos",
  "location": "Valencia",
  "service": "Fotografía",
  "score": 0.95
}
```

**Todos los campos que el usuario necesita:**
- ✅ Nombre limpio
- ✅ Descripción breve
- ✅ Imagen del trabajo
- ✅ Email de contacto
- ✅ Teléfono
- ✅ Enlace al perfil completo
- ✅ Instagram profesional

---

### **Resumen del Flujo:**

```
USUARIO → "fotógrafo"
    ↓
GPT → "fotógrafo de bodas Valencia contacto"
    ↓
TAVILY → 50 URLs de internet
    ↓
FILTRO → 20 perfiles específicos (sin listados)
    ↓
DEDUPLICACIÓN → 12 proveedores únicos
    ↓
SCRAPING → Datos completos
    ↓
USUARIO ← 12 tarjetas con email/teléfono/Instagram
```

---

## ⚠️ **CRÍTICO: Perfil de Proveedor Específico vs Página de Listado**

### **✅ PERFIL ESPECÍFICO DE PROVEEDOR (CORRECTO)**

**El enlace de la tarjeta DEBE llevar a:**

- 🎯 **Perfil/página de UN SOLO proveedor específico**
- 📄 **Contenido sobre ESE proveedor**: sus servicios, portfolio, sobre nosotros
- 📧 **Datos de contacto del proveedor**: email, teléfono, redes sociales
- 📸 **Fotos del trabajo de ESE proveedor**
- ❌ **NO debe mostrar múltiples proveedores** en la misma página

**✅ SE ACEPTAN URLs de directorios/plataformas SI llevan a un perfil específico:**

```
✅ CORRECTO: bodas.net con perfil específico
   URL: https://www.bodas.net/fotografia/delia-fotografos--e123456
   → Lleva al PERFIL de "Delia Fotógrafos" (UN proveedor)
   → bodas.net actúa como plataforma, pero muestra 1 proveedor

✅ CORRECTO: Sitio web propio
   URL: https://www.juanlopezfoto.com
   → Sitio web del fotógrafo Juan López (UN proveedor)
   
✅ CORRECTO: Perfil en Instagram
   URL: https://www.instagram.com/estudiofotovalencia
   → Perfil específico del Estudio Fotográfico Valencia (UN proveedor)

✅ CORRECTO: Perfil en otro directorio
   URL: https://www.proveedoresbodas.com/perfil/catering-martinez-12345
   → Lleva al PERFIL de "Catering Martínez" (UN proveedor)
```

---

### **❌ PÁGINA DE LISTADO MÚLTIPLE (INCORRECTO)**

**El enlace de la tarjeta NO DEBE llevar a:**

- 🚫 **Página que muestra VARIOS proveedores** (listado, directorio, resultados)
- 🚫 **Buscador** que requiere otra búsqueda
- 🚫 **Categoría genérica** sin proveedor específico
- 🚫 **Comparador** de múltiples opciones

**❌ SE DESCARTAN URLs que llevan a listados múltiples:**

```
❌ INCORRECTO: bodas.net sin perfil específico
   URL: https://www.bodas.net/fotografia
   → Muestra LISTADO de todos los fotógrafos (MÚLTIPLES proveedores)
   
❌ INCORRECTO: Buscador con resultados
   URL: https://www.bodas.net/fotografos?ciudad=madrid
   → Página de BÚSQUEDA con múltiples resultados
   
❌ INCORRECTO: Directorio sin perfil
   URL: https://www.proveedores.com/dj/valencia
   → Listado de todos los DJs en Valencia (MÚLTIPLES proveedores)
   
❌ INCORRECTO: Comparador
   URL: https://www.bodas.net/catering/compara
   → Página para comparar múltiples proveedores
```

---

## 🎯 **Regla de Oro:**

**"Si hago clic en el enlace de la tarjeta, ¿me lleva DIRECTAMENTE al perfil/página de ESE proveedor específico?"**

- ✅ **SÍ** → Tarjeta válida (aunque sea en bodas.net u otro directorio)
- ❌ **NO** (me muestra varios proveedores para elegir) → Tarjeta inválida

**Ejemplo práctico:**

```
Tarjeta: "Delia Fotógrafos - Valencia"
Link: bodas.net/fotografia/delia-fotografos--e123456

Al hacer clic:
✅ ¿Me lleva a la página de Delia Fotógrafos? → SÍ
✅ ¿Veo su portfolio, precios, contacto? → SÍ  
✅ ¿O veo una lista de 20 fotógrafos? → NO

→ TARJETA VÁLIDA ✅
```

```
Tarjeta: "Fotógrafos en Madrid"
Link: bodas.net/fotografia?ciudad=madrid

Al hacer clic:
❌ ¿Me lleva a la página de un fotógrafo? → NO
❌ ¿Veo una lista de múltiples fotógrafos? → SÍ

→ TARJETA INVÁLIDA ❌
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

### **4. 🆕 Deduplicación Triple: Email, URL y Nombre**

```javascript
const seenEmails = new Set();
const seenUrls = new Set();
const seenTitles = new Set();

// Normalizar títulos para detectar similitudes
const normalizeTitleForComparison = (title) => {
  return title
    .toLowerCase()
    .trim()
    // Eliminar palabras genéricas
    .replace(/\b(fotografía|fotógrafo|bodas|de|para|en)\b/gi, '')
    .replace(/[^\w\s]/g, '') // Sin puntuación
    .replace(/\s+/g, ''); // Sin espacios
};

const uniqueResults = validResults.filter(result => {
  // 1. DEDUPLICACIÓN POR EMAIL
  if (result.email && result.email.trim() !== '') {
    const emailLower = result.email.toLowerCase().trim();
    if (seenEmails.has(emailLower)) {
      console.log(`🗑️ [DEDUP-EMAIL] ${result.title}`);
      return false;
    }
    seenEmails.add(emailLower);
  }
  
  // 2. DEDUPLICACIÓN POR URL
  const baseDomain = `${url.hostname}${url.pathname}`;
  if (seenUrls.has(baseDomain)) {
    console.log(`🗑️ [DEDUP-URL] ${result.title}`);
    return false;
  }
  seenUrls.add(baseDomain);
  
  // 3. 🆕 DEDUPLICACIÓN POR SIMILITUD DE NOMBRE
  const normalizedTitle = normalizeTitleForComparison(result.title);
  if (seenTitles.has(normalizedTitle)) {
    console.log(`🗑️ [DEDUP-TITLE] ${result.title} (similar a existente)`);
    return false;
  }
  seenTitles.add(normalizedTitle);
  
  return true;
});
```

**¿Por qué es necesario?**
- ⚠️ **Problema 1**: Tavily devuelve el mismo proveedor en múltiples URLs
- ⚠️ **Problema 2**: Scraping puede fallar y no obtener email → no se detecta duplicado
- ⚠️ **Problema 3**: Mismo proveedor con títulos ligeramente diferentes
  - Ejemplo 1: `bodas.net/fotografia/delia--e123` y `www.deliafotografos.com` → mismo email
  - Ejemplo 2: "Fotografía Bodas" y "Fotografía Bodas" → mismo título
  - Ejemplo 3: "Juan López Fotografía" y "Juan López Fotógrafo Bodas" → mismo nombre normalizado
- ✅ **Solución**: Triple deduplicación → Email > URL > Nombre similar

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
