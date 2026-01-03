# Estrategia SEO Completa - Planivia 2026

## ✅ Ya Implementado (Fase 1)

- ✅ 2,373 páginas SEO únicas (88 países, 339 ciudades)
- ✅ Contenido extenso (guide, FAQs, tips, venues, timeline)
- ✅ Sitemap.xml con 2,470 URLs
- ✅ Hero images optimizadas por servicio
- ✅ Meta tags dinámicos (title, description)
- ✅ Schema.org markup básico
- ✅ URLs amigables (/es/madrid/gestion-invitados-boda)
- ✅ Hub pages por país (/es, /mx, /it)

---

## 🚀 Próximas Acciones Prioritarias

### **1. CONTENIDO Y ENLACES INTERNOS** (Impacto: ALTO)

#### 1.1 Blog SEO Automatizado
**Objetivo:** 500+ artículos de blog posicionados para long-tail keywords

**Implementación:**
- Crear template de artículos: "Cómo organizar una boda en [Ciudad]"
- Categorías: Guías por ciudad, Tips por servicio, Comparativas
- Ejemplos:
  - "Boda en Santorini vs Mykonos: Guía completa 2026"
  - "Presupuesto boda Madrid: Desglose detallado"
  - "Mejores venues para bodas en París"
  
**Automatización:**
```javascript
// Script: generateBlogPosts.mjs
// - Leer cities.json
// - Generar 3-5 artículos por ciudad
// - Long-tail keywords específicos
// - Enlaces internos a páginas de servicio
```

**Impacto SEO:** +500 páginas indexables, long-tail traffic

---

#### 1.2 Interlinking Inteligente
**Problema actual:** Páginas aisladas sin enlaces internos

**Solución:**
- Añadir sección "Artículos relacionados" en cada página
- Enlaces desde blog → páginas de servicio
- Enlaces entre ciudades del mismo país
- Enlaces a servicios relacionados

**Implementación en DynamicServicePage.jsx:**
```jsx
// Sección "Lee también"
<RelatedArticles>
  - "Guía completa de bodas en {ciudad}"
  - "Compara {ciudad} vs {ciudadCercana}"
  - "{servicio} en otras ciudades de {país}"
</RelatedArticles>
```

---

### **2. OPTIMIZACIÓN TÉCNICA** (Impacto: ALTO)

#### 2.1 Schema.org Avanzado
**Actual:** Schema básico WebSite + Organization

**Mejorar con:**
```json
{
  "@type": "FAQPage",
  "mainEntity": [...faqs]
}
```
```json
{
  "@type": "LocalBusiness",
  "address": { "addressLocality": "Madrid", "addressCountry": "ES" }
}
```
```json
{
  "@type": "HowTo",
  "step": [...timeline items]
}
```

**Impacto:** Rich snippets en Google (FAQs, HowTo)

---

#### 2.2 Velocidad y Core Web Vitals
**Acciones:**
- Lazy load de imágenes (ya con Unsplash)
- Preload de fonts críticos
- Code splitting por ruta
- Minificar CSS/JS
- Usar CDN para static assets

**Target:**
- LCP < 2.5s ✅
- FID < 100ms ✅
- CLS < 0.1 ✅

---

#### 2.3 Imágenes Optimizadas
**Mejoras:**
- WebP con fallback a JPEG
- Dimensiones específicas: `?w=1200&h=630&fit=crop`
- Alt text descriptivo: "Boda en {venue} {ciudad}"
- Lazy loading nativo

```jsx
<img 
  src={`${serviceData.heroImage}&fm=webp`}
  alt={`Boda en ${cityData.name} - ${serviceData.name}`}
  loading="lazy"
  width="1200"
  height="630"
/>
```

---

### **3. CONTENIDO LOCAL ÚNICO** (Impacto: MEDIO)

#### 3.1 Contenido Generado por IA (Más Extenso)
**Objetivo:** Pasar de 400-600 palabras a 1,500-2,000 palabras

**Añadir secciones:**
- Historia de bodas en la ciudad
- Tendencias locales actuales
- Estadísticas específicas
- Comparación con ciudades vecinas
- Mejor época del año (detallado)
- Transporte y logística
- Alojamiento para invitados
- Costos desglosados

**Script:** `generateExtendedContent.mjs`

---

#### 3.2 User-Generated Content
**Estrategia:**
- Reviews de usuarios por ciudad
- Fotos de bodas reales
- Testimonios localizados
- Ratings y valoraciones

**Implementación:**
```jsx
<UserReviews citySlug={cityData.slug}>
  <Review author="María G." rating={5}>
    "Organicé mi boda en {ciudad} con Planivia..."
  </Review>
</UserReviews>
```

---

### **4. AUTORIDAD Y BACKLINKS** (Impacto: ALTO)

#### 4.1 Contenido de Autoridad
**Crear:**
- Guías definitivas (10,000+ palabras): "La Guía Definitiva para Bodas en España 2026"
- Estudios con datos: "Análisis de 10,000 bodas: Presupuestos por ciudad"
- Infografías compartibles
- Herramientas gratuitas (calculadoras, checklists PDF)

---

#### 4.2 Estrategia de Link Building
**Tácticas:**
1. **Guest posting** en blogs de bodas
2. **Menciones locales**: Contactar venues y proveedores
3. **Directorios**: Bodas.net, Zankyou, etc.
4. **Prensa local**: "Startup española ayuda a organizar bodas"
5. **HARO** (Help A Reporter Out): Responder consultas de periodistas

---

### **5. INTERNACIONALIZACIÓN** (Impacto: MEDIO)

#### 5.1 Hreflang Tags
**Implementar:**
```html
<link rel="alternate" hreflang="es-ES" href="/es/madrid/..." />
<link rel="alternate" hreflang="es-MX" href="/mx/ciudad-de-mexico/..." />
<link rel="alternate" hreflang="en-US" href="/us/miami/..." />
<link rel="alternate" hreflang="it-IT" href="/it/roma/..." />
<link rel="alternate" hreflang="fr-FR" href="/fr/paris/..." />
```

**Ya parcialmente implementado**, pero falta:
- Validación en Google Search Console
- Detectar idioma del browser
- Selector de país/idioma visible

---

#### 5.2 Contenido Multiidioma Real
**Actual:** Todo en español

**Expandir a:**
- Inglés (mercado USA, UK, Australia)
- Italiano (Italia)
- Francés (Francia)
- Portugués (Brasil)
- Alemán (Alemania)

**Script:** `translateAllCities.mjs` (usando GPT-4 API)

---

### **6. LOCAL SEO** (Impacto: ALTO para ciudades)

#### 6.1 Google Business Profile
**Para cada ciudad:**
- Crear perfil virtual
- Fotos de la ciudad
- Reviews
- Preguntas frecuentes

---

#### 6.2 Local Citations
**Registrarse en:**
- Bodas.net
- Zankyou
- The Knot (USA)
- Hitched (UK)
- Mariages.net (Francia)

---

### **7. CONTENIDO MULTIMEDIA** (Impacto: MEDIO)

#### 7.1 Videos
**Crear:**
- Video tours de ciudades
- Testimonios de parejas
- Tutoriales: "Cómo usar Planivia"

**Embeber en páginas SEO:**
```jsx
<YouTubeEmbed 
  videoId="..."
  title="Bodas en {ciudad}: Todo lo que necesitas saber"
/>
```

---

#### 7.2 Podcasts
**Serie:** "Bodas por el Mundo"
- Episodio por ciudad
- Entrevistas a wedding planners locales
- Transcripciones para SEO

---

### **8. CONVERSIÓN Y UX** (Impacto: MEDIO)

#### 8.1 CTAs Optimizados
**Mejorar:**
- Botones más visibles
- A/B testing de copy
- Exit-intent popups
- Formularios cortos

---

#### 8.2 Proof Social
**Añadir:**
- "1,234 bodas organizadas en Madrid"
- "4.8★ en Google Reviews"
- Logos de medios que mencionan Planivia
- Contador en tiempo real de usuarios

---

### **9. ANÁLISIS Y MEDICIÓN** (Impacto: CRÍTICO)

#### 9.1 Implementar Tracking Completo
**Herramientas:**
- Google Analytics 4 ✅
- Google Search Console ✅
- Hotjar (heatmaps)
- Ahrefs / SEMrush (keywords)

**Métricas clave:**
- Tráfico orgánico por página
- Keywords posicionados
- CTR en SERPs
- Conversión de orgánico

---

#### 9.2 Monitoreo de Posiciones
**Trackear:**
- "bodas en [ciudad]"
- "[servicio] [ciudad]"
- "wedding planner [ciudad]"

**Objetivo:** Top 3 para keywords principales en 6 meses

---

### **10. CONTENIDO ESTACIONAL** (Impacto: MEDIO)

#### 10.1 Calendario Editorial
**Temporada alta bodas:**
- Febrero-Marzo: "Bodas de primavera en..."
- Junio-Julio: "Bodas de verano en..."
- Septiembre-Octubre: "Bodas de otoño en..."

---

## 📊 ROADMAP PRIORIZADO

### **Mes 1-2: Quick Wins**
1. Schema.org avanzado (FAQPage, HowTo)
2. Interlinking entre páginas existentes
3. Alt text y optimización de imágenes
4. Google Search Console setup completo
5. Fix any broken links

### **Mes 3-4: Contenido**
6. Generar 100 artículos de blog (automatizado)
7. Extender contenido de páginas a 1,500+ palabras
8. Crear 5 guías definitivas
9. User testimonials por ciudad

### **Mes 5-6: Autoridad**
10. Guest posting (5-10 artículos)
11. Link building (directorios, menciones)
12. Lanzar infografías y herramientas
13. Traducción a inglés (mercado USA/UK)

### **Mes 7-12: Escala**
14. Expandir blog a 500+ artículos
15. Traducción a 5 idiomas
16. Video content (50 videos)
17. Podcast semanal

---

## 🎯 KPIs y Objetivos

| Métrica | Actual | 6 meses | 12 meses |
|---------|--------|---------|----------|
| **Páginas indexadas** | 2,470 | 5,000 | 10,000 |
| **Tráfico orgánico/mes** | 0 | 50,000 | 200,000 |
| **Keywords Top 10** | 0 | 500 | 2,000 |
| **Domain Authority** | 10 | 30 | 45 |
| **Backlinks** | 10 | 200 | 1,000 |

---

## 💰 Inversión Estimada

**Mes 1-6 (Setup):** €5,000
- Herramientas SEO: €500/mes
- Contenido (freelancers): €2,000
- Link building: €1,000
- Videos: €1,500

**Mes 7-12 (Escala):** €10,000
- Herramientas: €500/mes
- Contenido: €4,000
- Link building: €2,000
- Traducciones: €3,000
- Promoción: €500

**ROI esperado:** 10:1 en 12 meses

---

## ⚠️ Riesgos y Mitigaciones

**Riesgo 1:** Contenido generado automáticamente penalizado
- **Mitigación:** Review humano, edición, valor único

**Riesgo 2:** Canibalización de keywords
- **Mitigación:** Keyword mapping, diferenciación clara

**Riesgo 3:** Competencia fuerte en mercados maduros
- **Mitigación:** Focus en long-tail, nichos específicos

---

## 🚀 Próximo Paso Inmediato

**RECOMENDACIÓN #1:** Implementar Schema.org avanzado (FAQPage) en todas las páginas
- Impacto: ALTO
- Esfuerzo: BAJO (2-3 horas)
- Rich snippets inmediatos en Google

**RECOMENDACIÓN #2:** Generar 100 artículos de blog automatizados
- Impacto: ALTO
- Esfuerzo: MEDIO (1 día de script)
- +100 páginas indexables con long-tail keywords

**RECOMENDACIÓN #3:** Interlinking automático entre páginas
- Impacto: MEDIO-ALTO
- Esfuerzo: BAJO (4-5 horas)
- Mejora arquitectura de información

---

**Documento creado:** Enero 2026
**Próxima revisión:** Marzo 2026
