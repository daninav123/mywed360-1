# 🔍 DESCUBRIBILIDAD - Páginas de Servicios

**Fecha:** 3 de enero de 2026, 20:37
**Pregunta:** ¿Cómo pueden usuarios y Google acceder a las páginas de servicios?

---

## ❌ Problema Actual

Las páginas dinámicas como `/es/valencia/bodas` **NO son descubribles** porque:

### 1. **No hay Sitemap.xml**
- Google no sabe que existen estas URLs
- No hay archivo `sitemap.xml` generado

### 2. **No hay Links Internos**
- La home page no enlaza a estas páginas
- No hay navegación por países/ciudades
- Google no puede "crawlear" estas páginas

### 3. **SPA con React Router**
- Son rutas client-side (JavaScript)
- Sin SSR, Google ve HTML vacío inicialmente
- Aunque Googlebot ejecuta JS, es más lento y menos confiable

### 4. **No hay Landing Pages de Entrada**
- No existe `/es` (página de España)
- No existe `/es/valencia` (página de Valencia)
- Solo existe `/es/valencia/bodas` (específica)

---

## ✅ Soluciones Necesarias

### 1. 🗺️ **Sitemap.xml Dinámico**

Generar un `sitemap.xml` con todas las combinaciones válidas de ciudad+servicio.

**Ubicación:** `/public/sitemap.xml`

**Contenido ejemplo:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Páginas estáticas -->
  <url>
    <loc>https://planivia.net/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Páginas de servicios dinámicas -->
  <url>
    <loc>https://planivia.net/es/madrid/bodas</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://planivia.net/es/valencia/bodas</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- ... más URLs ... -->
</urlset>
```

**Cómo generarlo:**
- Script Node.js que lee `cities.json` y `services.json`
- Genera todas las combinaciones válidas
- Se ejecuta en build time o con un cron

---

### 2. 🔗 **Links Internos desde Home**

Agregar sección en la home page con enlaces a:

#### **Opción A: Por País**
```
España 🇪🇸
├─ Madrid - Organizar Bodas
├─ Barcelona - Organizar Bodas
└─ Valencia - Organizar Bodas

México 🇲🇽
├─ Ciudad de México - Organizar Bodas
└─ Guadalajara - Organizar Bodas
```

#### **Opción B: Ciudades Destacadas**
```
🏙️ Organiza tu Boda en:
[Madrid]  [Barcelona]  [Valencia]  [Sevilla]
[CDMX]    [Bogotá]     [Lima]      [Buenos Aires]
```

**Implementación:**
```jsx
<section>
  <h2>Organiza tu boda en tu ciudad</h2>
  <div className="grid">
    {featuredCities.map(city => (
      <Link to={`/${city.country}/${city.slug}/bodas`}>
        {city.name}
      </Link>
    ))}
  </div>
</section>
```

---

### 3. 📄 **Páginas Hub Intermedias**

Crear páginas de entrada por país y ciudad:

#### **País Hub: `/es`**
```
Organiza tu Boda en España

Ciudades destacadas:
- Madrid → /es/madrid/bodas
- Barcelona → /es/barcelona/bodas
- Valencia → /es/valencia/bodas
- ...

Servicios disponibles:
- Gestión de Invitados
- Presupuesto de Boda
- Buscar Proveedores
```

#### **Ciudad Hub: `/es/valencia`**
```
Organiza tu Boda en Valencia

Servicios disponibles:
- Bodas en Valencia → /es/valencia/bodas
- Gestión de Invitados → /es/valencia/gestion-invitados-boda
- Presupuesto → /es/valencia/presupuesto-boda-online
- ...

Ciudades cercanas:
- Alicante
- Castellón
```

**Implementación:**
- Componente `CountryHub.jsx` (ya existe: `/:country`)
- Crear componente `CityHub.jsx` para `/:country/:city`

---

### 4. 🚀 **Pre-rendering / SSG**

Usar Vite con pre-rendering para generar HTML estático.

**Opciones:**
- `vite-plugin-ssr` o similar
- Generar HTML estático en build time
- Mejor indexación de Google

---

### 5. 📊 **Structured Data (Schema.org)**

Ya lo tienes implementado en `DynamicServicePage.jsx`:
- ✅ LocalBusiness schema
- ✅ BreadcrumbList schema
- ✅ FAQ schema
- ✅ Organization schema

**Perfecto para SEO.**

---

## 🎯 Prioridades de Implementación

### **Fase 1 - Inmediata (Día 1)**
1. ✅ Sitemap.xml generado
2. ✅ Links desde Home a ciudades destacadas
3. ✅ Google Search Console configurado

### **Fase 2 - Corto Plazo (Semana 1)**
1. ✅ Páginas Hub de países (`/:country`)
2. ✅ Páginas Hub de ciudades (`/:country/:city`)
3. ✅ Breadcrumbs visuales en todas las páginas

### **Fase 3 - Medio Plazo (Mes 1)**
1. ✅ Pre-rendering con SSG
2. ✅ Open Graph images optimizadas
3. ✅ robots.txt configurado

---

## 📝 Ejemplo de Implementación Rápida

### 1. **Script para generar sitemap.xml**

```javascript
// scripts/generate-sitemap.js
import fs from 'fs';
import citiesData from '../apps/main-app/src/data/cities.json' assert { type: 'json' };
import servicesData from '../apps/main-app/src/data/services.json' assert { type: 'json' };

const BASE_URL = 'https://planivia.net';

function generateSitemap() {
  const urls = [];
  
  // Páginas estáticas
  urls.push({ loc: BASE_URL, priority: 1.0, changefreq: 'daily' });
  urls.push({ loc: `${BASE_URL}/precios`, priority: 0.9, changefreq: 'weekly' });
  
  // Páginas dinámicas: país/ciudad/servicio
  const cities = Object.values(citiesData);
  const services = Object.keys(servicesData);
  
  cities.forEach(city => {
    services.forEach(service => {
      // Solo si la ciudad tiene ese servicio
      if (city.services && city.services[service]) {
        urls.push({
          loc: `${BASE_URL}/${city.country}/${city.slug}/${service}`,
          priority: 0.8,
          changefreq: 'weekly'
        });
      }
    });
  });
  
  // Generar XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
  
  fs.writeFileSync('apps/main-app/public/sitemap.xml', xml);
  console.log(`✅ Sitemap generado con ${urls.length} URLs`);
}

generateSitemap();
```

**Ejecutar:**
```bash
node scripts/generate-sitemap.js
```

---

### 2. **Sección en Home.jsx**

```jsx
<section className="py-20">
  <h2 className="text-4xl font-bold text-center mb-12">
    Organiza tu boda en tu ciudad
  </h2>
  
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
    {[
      { name: 'Madrid', country: 'es', slug: 'madrid' },
      { name: 'Barcelona', country: 'es', slug: 'barcelona' },
      { name: 'Valencia', country: 'es', slug: 'valencia' },
      { name: 'Sevilla', country: 'es', slug: 'sevilla' },
      { name: 'CDMX', country: 'mx', slug: 'ciudad-de-mexico' },
      { name: 'Guadalajara', country: 'mx', slug: 'guadalajara' },
      { name: 'Bogotá', country: 'co', slug: 'bogota' },
      { name: 'Lima', country: 'pe', slug: 'lima' },
    ].map(city => (
      <Link
        key={city.slug}
        to={`/${city.country}/${city.slug}/bodas`}
        className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
      >
        <h3 className="font-semibold text-lg">{city.name}</h3>
        <p className="text-sm text-gray-600">Ver servicios</p>
      </Link>
    ))}
  </div>
</section>
```

---

## ✅ Resultado Final

Después de implementar esto:

1. **Google encuentra las páginas** vía sitemap.xml
2. **Usuarios navegan** desde home → ciudad → servicio
3. **Mejor SEO** con links internos y estructura jerárquica
4. **Indexación completa** de todas las combinaciones ciudad+servicio

---

## 🚀 ¿Quieres que implemente algo ahora?

1. **Sitemap generator** → Script automático
2. **Links en Home** → Sección de ciudades destacadas
3. **CityHub component** → Página intermedia `/es/valencia`
4. **Todas las anteriores** → Solución completa

¿Qué prefieres hacer primero?
