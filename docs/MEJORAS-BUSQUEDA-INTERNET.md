# 🚀 MEJORAS EN BÚSQUEDA DE INTERNET (Tavily)

**Fecha:** 2025-10-28  
**Archivo:** `backend/routes/suppliers-hybrid.js`  
**Estado:** ✅ Implementado y listo

---

## 📋 RESUMEN DE MEJORAS

Se han implementado **6 mejoras críticas** en el sistema de búsqueda en internet usando Tavily API:

1. ✅ Query más inteligente y específica
2. ✅ Filtrado de resultados de baja calidad
3. ✅ Priorización avanzada por score y fuente
4. ✅ Extracción de más información (redes sociales)
5. ✅ Exclusión de más dominios irrelevantes
6. ✅ Guardado automático en Firestore

---

## 🔍 1. QUERY MÁS INTELIGENTE

### **ANTES:**

```javascript
const searchQuery = `${service} bodas ${location} ${query || ''} profesional contacto -"buscar"`;
```

**Problemas:**

- Query genérica
- No usa términos del usuario efectivamente
- Negativos demasiado simples

### **AHORA:**

```javascript
// Construcción dinámica de query
const queryTerms = [
  service, // Servicio principal
  query.trim(), // Términos del usuario
  'bodas', // Contexto
  location, // Ubicación
  'profesional OR empresa OR estudio', // Calidad
];

const excludeTerms = [
  '-"buscar"',
  '-"encuentra"',
  '-"listado"',
  '-"directorio"',
  '-"comparar"',
  '-"precios desde"',
  '-"opiniones de"',
];

const searchQuery = `${queryTerms.join(' ')} ${excludeTerms.join(' ')}`;
```

**Ejemplo real:**

```
INPUT:  service="música", query="dj", location="valencia"
OUTPUT: "música dj bodas valencia profesional OR empresa OR estudio -\"buscar\" -\"encuentra\" -\"listado\" -\"directorio\" -\"comparar\" -\"precios desde\" -\"opiniones de\""
```

**Beneficios:**

- ✅ Query más específica y efectiva
- ✅ Excluye agregadores y directorios
- ✅ Prioriza resultados profesionales

---

## 🗑️ 2. EXCLUSIÓN DE DOMINIOS IRRELEVANTES

### **ANTES:** 8 dominios excluidos

```javascript
exclude_domains: [
  'wikipedia.org',
  'youtube.com',
  'amazon',
  'pinterest',
  'ebay',
  'aliexpress',
  'milanuncios',
  'wallapop',
];
```

### **AHORA:** 20 dominios excluidos

```javascript
exclude_domains: [
  // Marketplaces (8)
  'wikipedia.org',
  'youtube.com',
  'amazon',
  'pinterest',
  'ebay',
  'aliexpress',
  'milanuncios',
  'wallapop',

  // ✅ NUEVOS: Directorios de bodas (5)
  'weddyplace.com',
  'eventosybodas.com',
  'tulistadebodas.com',
  'zankyou.es',
  'matrimonio.com',

  // ✅ NUEVOS: Agregadores (4)
  'casamientos.com.ar',
  'bodasyweddings.com',
  'eventopedia.es',
  'guianovias.com',

  // ✅ NUEVOS: Portales genéricos (5)
  'milanuncios.com',
  'segundamano.es',
  'olx.es',
  'vibbo.com',
  'tablondeanuncios.com',
];
```

**Resultado:**

- ✅ Excluye directorios que solo listan proveedores
- ✅ Excluye marketplaces de segunda mano
- ✅ Resultados más directos y útiles

---

## 🎯 3. FILTRADO DE CALIDAD

### **NUEVO:** Sistema de filtrado inteligente

```javascript
// 1. Filtrar duplicados (email/URL ya en Firestore)
if (email && registeredEmails.has(email)) return false;
if (url && registeredUrls.has(url)) return false;

// 2. ✅ Filtrar indicadores de baja calidad
const lowQualityIndicators = [
  'opiniones de',
  'precios desde',
  'comparar precios',
  'encuentra los mejores',
  'directorio de',
  'listado de',
  'guía de proveedores',
  'selección de',
];

if (hasLowQualityIndicator) return false;

// 3. ✅ Validación básica
if (!r.title || !r.url) return false;

// 4. ✅ Score mínimo de Tavily
if ((r.score || 0) < 0.3) return false;
```

**Logs de ejemplo:**

```
📊 [TAVILY] Respuesta: 15 resultados brutos
   ❌ Filtrado por baja calidad: "Opiniones de fotógrafos en Valencia"
   ❌ Filtrado por score bajo (0.25): "Directorio de proveedores"
   ✅ Tras filtrado de calidad: 8 resultados
```

---

## 📊 4. PRIORIZACIÓN AVANZADA

### **ANTES:** Simple (bodas.net vs resto)

```javascript
const prioritizedResults = [...bodasNetResults, ...otherResults].slice(0, 8);
```

### **AHORA:** Triple nivel de priorización

```javascript
// 1ª Prioridad: Bodas.net
if (url.includes('bodas.net')) {
  bodasNetResults.push(r);
}
// 2ª Prioridad: Score alto (>0.7)
else if (score > 0.7) {
  highScoreResults.push(r);
}
// 3ª Prioridad: Resto (score 0.3-0.7)
else {
  otherResults.push(r);
}

// Ordenar cada grupo por score
bodasNetResults.sort(sortByScore);
highScoreResults.sort(sortByScore);
otherResults.sort(sortByScore);

// Combinar con prioridad
const prioritizedResults = [
  ...bodasNetResults, // 1º
  ...highScoreResults, // 2º
  ...otherResults, // 3º
].slice(0, 10); // ✅ Aumentado de 8 a 10
```

**Logs de ejemplo:**

```
📊 Resultados priorizados: 2 bodas.net, 3 alto score, 5 otros
```

**Badges dinámicos:**

```javascript
badge: isBodas
  ? 'Bodas.net 💒' // Prioridad 1
  : score > 0.7
    ? 'Alta calidad ⭐' // Prioridad 2
    : 'De internet 🌐'; // Prioridad 3
```

---

## 🎁 5. EXTRACCIÓN DE MÁS INFORMACIÓN

### **ANTES:** Solo datos básicos

```javascript
contact: {
  email: r.email || '',
  website: r.url,
  phone: r.phone || '',
  instagram: r.instagram || ''
}
```

### **AHORA:** Extracción inteligente

```javascript
// ✅ Extraer redes sociales del contenido
const instagramMatch = content.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
const facebookMatch = content.match(/facebook\.com\/([a-zA-Z0-9._]+)/);

contact: {
  email: r.email || '',
  website: r.url,
  phone: r.phone || '',
  instagram: instagramMatch
    ? `https://instagram.com/${instagramMatch[1]}`
    : (r.instagram || ''),
  facebook: facebookMatch
    ? `https://facebook.com/${facebookMatch[1]}`
    : ''
},
business: {
  description: r.content?.substring(0, 250), // ✅ Aumentado de 200
  services: [service],                       // ✅ Añadido
},
metrics: {
  matchScore: Math.round(score * 100),
  tavilyScore: score,                        // ✅ Score original
},
// ✅ NUEVO: Metadata de búsqueda
searchMetadata: {
  query: query || service,
  location: location,
  discoveredAt: new Date().toISOString(),
  tavilyUrl: r.url
}
```

---

## 💾 6. GUARDADO AUTOMÁTICO EN FIRESTORE

### **NUEVO:** Los resultados de internet se guardan automáticamente

```javascript
// Guardar proveedores descubiertos en Firestore
if (internetResults.length > 0) {
  console.log(`💾 [SAVE] Guardando ${internetResults.length} proveedores...`);

  for (const supplier of internetResults) {
    const urlHash = Buffer.from(supplier.contact.website)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 20);

    const supplierId = `discovered_${urlHash}_${Date.now()}`;

    const supplierData = {
      ...supplier,
      id: supplierId,
      status: 'discovered', // ✅ Estado especial
      discoverySource: 'tavily',
      autoDiscovered: true,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    };

    batch.set(docRef, supplierData, { merge: true });
  }

  await batch.commit();
  console.log(`✅ [SAVE] Proveedores guardados como 'discovered'`);
}
```

**Beneficios:**

- ✅ Los proveedores de internet se guardan para futuras búsquedas
- ✅ Estado `discovered` permite filtrarlos después
- ✅ No necesitan re-buscar en Tavily cada vez
- ✅ Pueden ser promovidos a `active` manualmente

**Estructura en Firestore:**

```
suppliers/
  ├── discovered_aHR0cHM6Ly9leGF_1730135487000/
  │   ├── name: "Studio XYZ"
  │   ├── status: "discovered"          ← Estado especial
  │   ├── autoDiscovered: true
  │   ├── discoverySource: "tavily"
  │   ├── searchMetadata: {...}
  │   └── ...
```

---

## 📈 RESULTADOS ESPERADOS

### **Antes de las mejoras:**

- ❌ Queries genéricas
- ❌ Muchos resultados de directorios
- ❌ No usa score de Tavily
- ❌ Resultados se pierden

### **Después de las mejoras:**

- ✅ Queries específicas y efectivas
- ✅ Solo resultados de calidad (score > 0.3)
- ✅ Priorización triple (bodas.net > alto score > resto)
- ✅ Extracción de redes sociales
- ✅ Guardado automático en Firestore
- ✅ Más dominios excluidos (20 vs 8)
- ✅ Badges dinámicos por calidad

---

## 🧪 EJEMPLO DE BÚSQUEDA COMPLETA

**Input:**

```javascript
{
  service: "música",
  query: "dj",
  location: "valencia",
  searchMode: "auto"
}
```

**Output (Logs):**

```
🔍 [TAVILY] Query construida: "música dj bodas valencia profesional OR empresa OR estudio -\"buscar\" -\"encuentra\" -\"listado\"..."
📊 [TAVILY] Respuesta: 15 resultados brutos
   ❌ Filtrado por baja calidad: "Directorio de DJs en Valencia"
   ❌ Filtrado por score bajo (0.22): "Comparar precios de música"
   ✅ Tras filtrado de calidad: 9 resultados
   📊 Resultados priorizados: 1 bodas.net, 4 alto score, 4 otros
🔄 [TAVILY] 9 proveedores nuevos (no duplicados)
💾 [SAVE] Guardando 9 proveedores de internet en Firestore...
✅ [SAVE] 9 proveedores guardados en Firestore como 'discovered'
```

**Proveedores retornados:**

```javascript
[
  {
    name: 'DJ Events Valencia',
    badge: 'Bodas.net 💒', // ← Prioridad 1
    badgeType: 'info',
    metrics: {
      matchScore: 92,
      tavilyScore: 0.92,
    },
    priority: 'high',
  },
  {
    name: 'Studio Music Pro',
    badge: 'Alta calidad ⭐', // ← Prioridad 2
    badgeType: 'success',
    metrics: {
      matchScore: 85,
      tavilyScore: 0.85,
    },
    priority: 'medium',
  },
  {
    name: 'Música Bodas VLC',
    badge: 'De internet 🌐', // ← Prioridad 3
    badgeType: 'default',
    metrics: {
      matchScore: 65,
      tavilyScore: 0.65,
    },
    priority: 'low',
  },
];
```

---

## 🎯 MÉTRICAS DE ÉXITO

| Métrica                 | Antes      | Después | Mejora               |
| ----------------------- | ---------- | ------- | -------------------- |
| Resultados brutos       | 20         | 15      | -25% (más eficiente) |
| Dominios excluidos      | 8          | 20      | +150%                |
| Score mínimo            | Sin filtro | 0.3     | ∞                    |
| Resultados finales      | 8          | 10      | +25%                 |
| Niveles de priorización | 1          | 3       | +200%                |
| Campos extraídos        | 8          | 13      | +62%                 |
| Guardado en Firestore   | ❌         | ✅      | Nuevo                |

---

## 🔧 CONFIGURACIÓN

### Variables de entorno requeridas:

```bash
TAVILY_API_KEY=tvly-xxxxx  # API Key de Tavily
```

### Límites configurables (líneas 368-405):

```javascript
const MIN_RESULTS = 5; // Mínimo de registrados antes de buscar internet
const MAX_TAVILY_RESULTS = 15; // Máximo de resultados de Tavily
const MIN_QUALITY_SCORE = 0.3; // Score mínimo de calidad
const HIGH_SCORE_THRESHOLD = 0.7; // Umbral para "alta calidad"
const FINAL_RESULTS_LIMIT = 10; // Resultados finales a retornar
```

---

## 📝 PRÓXIMAS MEJORAS SUGERIDAS

1. **Deduplicación inteligente:** Detectar nombres similares (ej: "Studio XYZ" vs "XYZ Studio")
2. **Machine Learning:** Entrenar modelo con clicks/conversions para mejorar priorización
3. **Caché de búsquedas:** Guardar resultados de búsquedas populares
4. **Scraping complementario:** Si Tavily no encuentra suficientes, hacer scraping directo de bodas.net
5. **Verificación de contactos:** Validar emails/teléfonos antes de guardar
6. **Enriquecimiento posterior:** Job nocturno para completar datos de proveedores 'discovered'

---

## ✅ ESTADO ACTUAL

- [x] Query mejorada
- [x] Filtrado de calidad
- [x] Priorización avanzada
- [x] Extracción de redes sociales
- [x] Exclusión de dominios
- [x] Guardado en Firestore
- [x] Documentación completa
- [ ] Tests unitarios
- [ ] Métricas de éxito (A/B testing)

---

**Última actualización:** 2025-10-28  
**Desarrollador:** Cascade AI  
**Archivo:** `docs/MEJORAS-BUSQUEDA-INTERNET.md`
