# 🌐 Propuesta: Análisis Web de Proveedores para Clasificación Mejorada

## **Problema Actual**

El clasificador actual se basa únicamente en:
- Nombre del proveedor
- Descripción de Google Places/búsqueda
- Keywords predefinidas

**Limitación:** Si el nombre no contiene keywords claras (ej: "Alkilaudio" → no tiene "DJ" explícito), puede fallar la clasificación.

---

## **Solución Propuesta: Web Scraping Inteligente**

### **Flujo:**

```
1. Proveedor encontrado → Tiene website
   ↓
2. Scraper lee página principal
   ↓
3. Extrae:
   - Servicios ofrecidos
   - Palabras clave del contenido
   - Secciones "Servicios", "Qué ofrecemos"
   ↓
4. IA analiza contenido
   ↓
5. Clasifica con mayor precisión
   ↓
6. Cache resultado (no re-analizar cada vez)
```

---

## **Implementación Técnica**

### **Backend Service (Node.js)**

```javascript
// services/webScraperService.js

import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Analiza la web de un proveedor para extraer servicios
 */
export async function analyzeSupplierWebsite(url) {
  try {
    // 1. Fetch HTML
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MyWed360Bot/1.0)'
      }
    });

    const $ = cheerio.load(response.data);
    
    // 2. Extraer textos relevantes
    const title = $('title').text();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const h1s = $('h1').map((i, el) => $(el).text()).get().join(' ');
    const h2s = $('h2').map((i, el) => $(el).text()).get().join(' ');
    
    // 3. Buscar secciones de servicios
    const serviceSections = [];
    $('section, div').each((i, el) => {
      const text = $(el).text().toLowerCase();
      if (text.includes('servicio') || text.includes('ofrecemos') || 
          text.includes('especialidad') || text.includes('qué hacemos')) {
        serviceSections.push($(el).text());
      }
    });

    // 4. Combinar todo el texto
    const fullText = [
      title,
      metaDescription,
      h1s,
      h2s,
      ...serviceSections
    ].join(' ');

    return {
      success: true,
      data: {
        title,
        metaDescription,
        services: serviceSections,
        fullText: fullText.substring(0, 5000), // Límite para no sobrecargar
        detectedServices: detectServices(fullText)
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Detecta servicios mencionados en el texto
 */
function detectServices(text) {
  const normalized = text.toLowerCase();
  const services = [];
  
  // DJ
  if (normalized.includes('dj') || normalized.includes('disc jockey') || 
      normalized.includes('pincha')) {
    services.push({ category: 'dj', confidence: 90 });
  }
  
  // Música
  if (normalized.includes('música') || normalized.includes('musica') || 
      normalized.includes('orquesta') || normalized.includes('banda')) {
    services.push({ category: 'musica', confidence: 90 });
  }
  
  // Sonido / Audio
  if (normalized.includes('sonido') || normalized.includes('audio') || 
      normalized.includes('equipos de sonido') || normalized.includes('iluminación')) {
    services.push({ category: 'musica', confidence: 80 });
    services.push({ category: 'dj', confidence: 80 });
  }
  
  // Fotografía
  if (normalized.includes('fotograf') || normalized.includes('photo')) {
    services.push({ category: 'fotografia', confidence: 95 });
  }
  
  // Vídeo
  if (normalized.includes('video') || normalized.includes('film') || 
      normalized.includes('cinematograf')) {
    services.push({ category: 'video', confidence: 95 });
  }
  
  // Catering
  if (normalized.includes('catering') || normalized.includes('banquete') || 
      normalized.includes('menú')) {
    services.push({ category: 'catering', confidence: 90 });
  }
  
  return services;
}
```

### **API Endpoint**

```javascript
// routes/suppliers.js

app.post('/api/suppliers/:id/analyze-website', async (req, res) => {
  const { id } = req.params;
  
  try {
    // 1. Obtener proveedor
    const supplier = await getSupplier(id);
    
    if (!supplier.website) {
      return res.status(400).json({ 
        error: 'Proveedor no tiene website' 
      });
    }
    
    // 2. Verificar cache (no analizar cada vez)
    const cached = await getCachedAnalysis(supplier.website);
    if (cached) {
      return res.json({ cached: true, ...cached });
    }
    
    // 3. Analizar website
    const analysis = await analyzeSupplierWebsite(supplier.website);
    
    if (!analysis.success) {
      return res.status(500).json({ error: analysis.error });
    }
    
    // 4. Guardar en cache (válido 30 días)
    await cacheAnalysis(supplier.website, analysis.data, 30);
    
    // 5. Actualizar clasificación del proveedor
    const updatedCategories = mergeWithWebAnalysis(
      supplier.category,
      supplier.alternativeCategories,
      analysis.data.detectedServices
    );
    
    return res.json({
      success: true,
      analysis: analysis.data,
      updatedCategories
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### **Frontend Integration**

```javascript
// En supplierCategoryClassifier.js

export async function classifySupplierWithWebAnalysis(supplier) {
  // 1. Clasificación normal
  const basicClassification = classifySupplier(supplier);
  
  // 2. Si tiene website y clasificación es incierta, analizar web
  if (supplier.website && basicClassification.confidence < 60) {
    try {
      const webAnalysis = await fetch(`/api/suppliers/${supplier.id}/analyze-website`, {
        method: 'POST'
      });
      
      const data = await webAnalysis.json();
      
      if (data.success && data.updatedCategories) {
        return {
          ...basicClassification,
          ...data.updatedCategories,
          method: 'web_analysis',
          confidence: 85
        };
      }
    } catch (error) {
      console.warn('Web analysis failed, using basic classification');
    }
  }
  
  return basicClassification;
}
```

---

## **Mejoras con IA (OpenAI)**

### **Usar GPT para análisis más inteligente**

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function analyzeWithAI(websiteText, supplierName) {
  const prompt = `
Analiza el siguiente texto de la página web de "${supplierName}" y determina qué servicios de boda ofrece.

Servicios posibles:
- Fotografía
- Vídeo
- Música (bandas, orquestas)
- DJ
- Catering
- Lugares (salones, fincas)
- Decoración
- Flores

Texto:
${websiteText.substring(0, 3000)}

Responde en JSON con este formato:
{
  "services": [
    { "category": "dj", "confidence": 95, "evidence": "Mencionan 'DJ profesional para bodas'" },
    { "category": "musica", "confidence": 85, "evidence": "Ofrecen equipos de sonido" }
  ]
}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content);
}
```

---

## **Caché y Performance**

### **Estructura de caché en Firestore**

```javascript
// Collection: supplier_web_analysis
{
  website: "https://alkilaudio.com",
  analyzedAt: Timestamp,
  expiresAt: Timestamp, // 30 días después
  services: [
    { category: 'dj', confidence: 95, evidence: '...' },
    { category: 'musica', confidence: 90, evidence: '...' }
  ],
  fullText: "...", // Para referencia
  metadata: {
    title: "Alkilaudio - Alquiler DJ y Sonido",
    description: "...",
    scrapedAt: Timestamp
  }
}
```

---

## **Alternativa: Google Custom Search API**

Si scraping es complejo, usar Google Custom Search para obtener más información:

```javascript
async function enhanceWithGoogleSearch(supplierName) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;
  
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(supplierName + ' bodas servicios')}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  // Analizar snippets de resultados
  const snippets = data.items?.map(item => item.snippet).join(' ') || '';
  
  return detectServices(snippets);
}
```

---

## **Roadmap de Implementación**

### **Fase 1: Scraping Básico (1-2 semanas)**
- [x] Boost automático para nombres con "audio"
- [ ] Backend scraper básico con Cheerio
- [ ] Endpoint `/analyze-website`
- [ ] Caché en Firestore
- [ ] Integración frontend

### **Fase 2: IA Avanzada (2-3 semanas)**
- [ ] Integrar OpenAI GPT-4
- [ ] Prompts optimizados
- [ ] Detección de múltiples servicios simultáneos
- [ ] Confidence scoring mejorado

### **Fase 3: Automatización (1-2 semanas)**
- [ ] Análisis automático al agregar proveedor
- [ ] Background jobs para re-analizar periódicamente
- [ ] Dashboard de clasificaciones revisadas
- [ ] Feedback loop: usuario corrige → sistema aprende

---

## **Pros y Contras**

### **✅ Ventajas**
- **Mayor precisión**: Lee directamente lo que el proveedor dice en su web
- **Múltiples servicios**: Detecta mejor empresas multi-servicio
- **Actualizable**: Cache se puede refrescar periódicamente
- **Escalable**: Una vez implementado, funciona para todos

### **⚠️ Desventajas**
- **Complejidad**: Requiere backend adicional
- **Coste**: APIs de OpenAI o scraping pueden tener coste
- **Mantenimiento**: Webs cambian, puede necesitar ajustes
- **Legalidad**: Verificar términos de scraping

---

## **Solución Temporal ACTUAL**

Mientras tanto, he implementado:

### **✅ Boost del 60% para nombres con audio/sonido**
```javascript
Si nombre contiene "audio" | "sonido" | "sound"
→ Música: 60% confidence mínimo
→ DJ: 60% confidence mínimo
→ NUNCA clasificar como "Otros"
```

### **✅ Clasificación forzada**
```javascript
Si es empresa de audio pero score < 10
→ FORZAR clasificación como Música o DJ
→ Añadir la otra automáticamente como alternativa (50%)
```

---

## **Recomendación**

**Corto plazo (ahora):**
- Usar sistema actual con boost del 60%
- Recargar página y probar de nuevo

**Medio plazo (1-2 meses):**
- Implementar scraping básico
- Solo para proveedores con confidence < 60%
- Cache de 30 días

**Largo plazo (3-6 meses):**
- IA avanzada con GPT-4
- Análisis automático
- Sistema de aprendizaje

---

**Estado:** 💡 **Propuesta / Análisis**  
**Prioridad:** 🔶 **Media**  
**Esfuerzo estimado:** 4-6 semanas para MVP completo
