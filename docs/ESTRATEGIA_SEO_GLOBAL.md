# 🌍 Estrategia SEO Global - Planivia

**Documento de Referencia - Enero 2026**

## 📋 Índice

1. [Visión General](#visión-general)
2. [Roadmap de Expansión](#roadmap-de-expansión)
3. [Arquitectura Técnica](#arquitectura-técnica)
4. [Páginas Implementadas](#páginas-implementadas)
5. [Internal Linking Strategy](#internal-linking-strategy)
6. [Content Strategy](#content-strategy)
7. [Métricas y KPIs](#métricas-y-kpis)

---

## Visión General

### Objetivo
Posicionar Planivia como plataforma #1 de planificación de bodas en mercados de habla hispana (España, LATAM) y expandir gradualmente a mercados anglosajones.

### Estrategia Core
**Programmatic SEO**: Generar cientos/miles de páginas optimizadas usando templates dinámicos + base de datos de ciudades/servicios.

### Por Qué Funciona
- Airbnb: 6M páginas
- Zillow: 110M páginas  
- TripAdvisor: 200M páginas
- Bodas.net: 50K páginas

**No es contraproducente generar muchas páginas si:**
1. Contenido es único y valioso
2. Internal linking es inteligente
3. No saturas la navegación principal

---

## Roadmap de Expansión

### Fase 1: España (Meses 1-6) 🇪🇸

**Objetivo:** Dominar mercado español con SEO local

**Ciudades Prioritarias (50):**
- Madrid, Barcelona, Valencia, Sevilla, Bilbao, Málaga, Murcia, Alicante, Zaragoza, Granada
- Las Palmas, Córdoba, Valladolid, Vigo, Gijón, Palma, Santander, San Sebastián, Pamplona, Salamanca
- + 30 ciudades más (>100K habitantes)

**Servicios por Ciudad (5):**
1. Gestión de Invitados
2. Presupuesto de Boda
3. Seating Plan
4. Fotografía
5. Catering

**Total Páginas España:** 50 ciudades × 5 servicios = **250 páginas**

**Resultado Esperado (Mes 6):**
- 5,000-8,000 visitas/mes
- Top 10 en 50+ keywords locales
- Domain Authority +5 puntos

---

### Fase 2: México (Meses 6-12) 🇲🇽

**Por qué México:**
- Mercado bodas más grande LATAM
- Mismo idioma
- Cultura similar

**Ciudades (30):**
- Ciudad de México, Guadalajara, Monterrey, Cancún, Playa del Carmen, Puebla, Querétaro, Mérida, San Miguel de Allende, Los Cabos
- + 20 ciudades más

**Adaptaciones:**
- Precios en MXN
- Proveedores locales
- Modismos mexicanos

**Total Páginas México:** 30 × 5 = **150 páginas**

**Resultado Esperado (Mes 12):**
- 15,000-25,000 visitas/mes total
- Presencia en 2 mercados principales

---

### Fase 3: Colombia + Argentina (Meses 12-18) 🇨🇴🇦🇷

**Colombia (20 ciudades):**
- Bogotá, Medellín, Cali, Cartagena, Barranquilla, Santa Marta, Pereira, Bucaramanga

**Argentina (15 ciudades):**
- Buenos Aires, Córdoba, Rosario, Mendoza, Bariloche

**Adaptaciones:**
- "Casamiento" en vez de "boda" (Argentina)
- Precios locales (COP, ARS)

**Total Páginas:** 35 × 5 = **175 páginas**

---

### Fase 4: USA - Nicho Hispano (Meses 18-24) 🇺🇸

**Estrategia:** Enfoque en mercado hispano + Destination Weddings

**Ciudades (15):**
- Miami, Los Angeles, San Antonio, Houston, Phoenix, Dallas, San Diego, New York, Chicago

**Keywords Nicho:**
- "wedding planning software español"
- "hispanic wedding planning"
- "destination weddings spain"
- "affordable destination weddings europe"

**Total Páginas:** 15 × 5 = **75 páginas**

---

### Fase 5: UK/Europa (Meses 24-36) 🇬🇧🇫🇷

**UK (10 ciudades):**
- London, Manchester, Edinburgh, Birmingham, Bristol

**Francia (10 ciudades):**
- Paris, Lyon, Marseille, Bordeaux, Nice

**Total Páginas:** 20 × 5 = **100 páginas**

---

## Arquitectura Técnica

### Estructura de Archivos

```
src/
├── pages/
│   └── marketing/
│       ├── DynamicServicePage.jsx     ← Template único para todas las páginas
│       ├── CountryHub.jsx             ← /es, /mx, /co, etc.
│       └── ServiceHub.jsx             ← /gestion-invitados-boda (global)
│
├── data/
│   ├── cities.json                    ← Base de datos ciudades
│   ├── services.json                  ← Base de datos servicios
│   ├── content/                       ← Contenido específico
│   │   ├── madrid.json
│   │   ├── barcelona.json
│   │   └── ...
│   └── dataLoader.js                  ← Helper functions
│
├── components/
│   └── seo/
│       ├── RelatedPages.jsx           ← Internal linking automático
│       ├── CityCard.jsx
│       └── ServiceCard.jsx
│
└── scripts/
    └── generateSitemap.js             ← Genera sitemap.xml automático
```

---

### Rutas Dinámicas

**App.jsx:**

```jsx
// Una sola ruta genera miles de páginas
<Route path="/:country/:city/:service" element={<DynamicServicePage />} />

// Ejemplos de URLs generadas:
// /es/madrid/gestion-invitados-boda
// /es/barcelona/presupuesto-boda-online
// /mx/ciudad-mexico/seating-plan-boda
// /co/bogota/fotografia-bodas
```

---

### cities.json - Estructura

```json
{
  "madrid": {
    "name": "Madrid",
    "slug": "madrid",
    "country": "es",
    "countryCode": "ES",
    "countryName": "España",
    "locale": "es-ES",
    "currency": "EUR",
    "lat": "40.4168",
    "lng": "-3.7038",
    "population": 3200000,
    "heroImage": "/images/cities/madrid.jpg",
    "description": "La capital de España es un destino perfecto para bodas elegantes y tradicionales.",
    "weddingStats": {
      "avgBudget": "22000",
      "avgGuests": 120,
      "popularMonths": ["Mayo", "Junio", "Septiembre", "Octubre"]
    },
    "services": {
      "gestion-invitados": {
        "avgPrice": "0-85",
        "vendorCount": 156,
        "topVenues": ["Palacio de Cibeles", "Jardín Botánico", "Quinta de los Molinos"]
      },
      "presupuesto": {
        "avgBudget": "22000",
        "breakdown": {
          "catering": 8000,
          "fotografia": 2500,
          "vestido": 1800
        }
      },
      "fotografia": {
        "avgPrice": "2500",
        "vendorCount": 450,
        "styles": ["Natural", "Editorial", "Documental"]
      }
    },
    "nearbyCities": ["toledo", "segovia", "avila"],
    "seoKeywords": ["bodas madrid", "organizar boda madrid", "proveedores boda madrid"]
  }
}
```

---

### services.json - Estructura

```json
{
  "gestion-invitados": {
    "name": "Gestión de Invitados",
    "slug": "gestion-invitados-boda",
    "icon": "Users",
    "shortDesc": "Software para gestionar tu lista de invitados, RSVPs y seating plan",
    "longDesc": "Control completo de invitados con confirmaciones en tiempo real, gestión de dietas y seating plan drag & drop.",
    "benefits": [
      "Control de confirmaciones en tiempo real",
      "Gestión de dietas y alergias",
      "Seating plan visual",
      "Invitaciones digitales",
      "Exportación Excel/PDF"
    ],
    "keywords": ["gestión invitados boda", "lista invitados", "control rsvp", "seating plan"],
    "ctaText": "Gestiona tus Invitados Gratis",
    "relatedServices": ["presupuesto", "seating-plan"]
  },
  "presupuesto": {
    "name": "Presupuesto de Boda",
    "slug": "presupuesto-boda-online",
    "icon": "DollarSign",
    "shortDesc": "Calculadora y control de gastos de boda en tiempo real",
    "keywords": ["presupuesto boda", "calculadora boda", "control gastos"],
    "relatedServices": ["gestion-invitados", "catering"]
  }
}
```

---

### DynamicServicePage.jsx - Template

**Componente que genera todas las páginas:**

```jsx
import { useParams } from 'react-router-dom';
import { getCityData, getServiceData } from '../../data/dataLoader';

export default function DynamicServicePage() {
  const { country, city, service } = useParams();
  
  const cityData = getCityData(city);
  const serviceData = getServiceData(service);

  // SEO dinámico
  const seoTitle = `${serviceData.name} en ${cityData.name} | Planivia`;
  const seoDescription = `${serviceData.shortDesc} en ${cityData.name}. ${cityData.weddingStats.avgBudget}€ presupuesto medio. ${cityData.services[service].vendorCount} proveedores.`;

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={`https://planivia.net/${country}/${city}/${service}`} />
        
        {/* Schema LocalBusiness */}
        <script type="application/ld+json">
          {JSON.stringify(generateSchema(cityData, serviceData))}
        </script>
      </Helmet>
      
      <PageWrapper>
        <HeroSection
          title={`${serviceData.name} en ${cityData.name}`}
          subtitle={`${cityData.services[service].vendorCount} proveedores verificados`}
          image={cityData.heroImage}
        />
        
        {/* Contenido dinámico */}
        <ServiceContent city={cityData} service={serviceData} />
        
        {/* Internal linking automático */}
        <RelatedPages city={cityData} service={serviceData} />
      </PageWrapper>
    </>
  );
}
```

---

## Internal Linking Strategy

### Nivel 1: Navbar (Solo Top Pages)

**Máximo 7-8 links visibles:**

```jsx
<nav>
  <Link to="/">Inicio</Link>
  <Link to="/precios">Precios</Link>
  
  <Dropdown title="Servicios">
    <Link to="/gestion-invitados-boda">Gestión Invitados</Link>
    <Link to="/presupuesto-boda-online">Presupuesto</Link>
    <Link to="/seating-plan-boda">Seating Plan</Link>
  </Dropdown>
  
  <Dropdown title="Ubicaciones">
    <Link to="/es">España</Link>
    <Link to="/mx">México</Link>
    <Link to="/co">Colombia</Link>
  </Dropdown>
  
  <Link to="/blog">Blog</Link>
</nav>
```

---

### Nivel 2: Hub Pages

**CountryHub.jsx** - Ejemplo `/es`

```jsx
<PageWrapper>
  <h1>Organiza tu Boda en España</h1>
  
  {/* Grid de ciudades */}
  <div className="grid md:grid-cols-4 gap-6">
    {cities.filter(c => c.country === 'es').map(city => (
      <CityCard
        key={city.slug}
        name={city.name}
        image={city.heroImage}
        weddingCount={city.weddingStats.avgGuests}
        href={`/es/${city.slug}`}
      />
    ))}
  </div>
  
  {/* Servicios disponibles */}
  <h2>Servicios en Todas las Ciudades</h2>
  <ServiceGrid services={services} country="es" />
</PageWrapper>
```

**CityHub** - Ejemplo `/es/madrid`

```jsx
<PageWrapper>
  <h1>Organiza tu Boda en Madrid</h1>
  
  {/* Stats de Madrid */}
  <StatsSection city={madridData} />
  
  {/* Grid de servicios disponibles */}
  <div className="grid md:grid-cols-3 gap-6">
    {services.map(service => (
      <ServiceCard
        key={service.slug}
        {...service}
        href={`/es/madrid/${service.slug}`}
      />
    ))}
  </div>
  
  {/* Ciudades cercanas */}
  <h2>Otras Ciudades Cercanas</h2>
  <CityGrid cities={nearbyCities} />
</PageWrapper>
```

---

### Nivel 3: Footer (Todas las Ciudades Principales)

```jsx
<footer>
  <div className="grid md:grid-cols-4 gap-8">
    <div>
      <h3>España</h3>
      <ul>
        <li><Link to="/es/madrid">Madrid</Link></li>
        <li><Link to="/es/barcelona">Barcelona</Link></li>
        {/* ... 20 ciudades principales */}
      </ul>
    </div>
    
    <div>
      <h3>México</h3>
      <ul>
        <li><Link to="/mx/ciudad-mexico">Ciudad de México</Link></li>
        {/* ... */}
      </ul>
    </div>
    
    <div>
      <h3>Servicios</h3>
      <ul>
        <li><Link to="/gestion-invitados-boda">Gestión Invitados</Link></li>
        <li><Link to="/presupuesto-boda-online">Presupuesto</Link></li>
        {/* ... */}
      </ul>
    </div>
  </div>
</footer>
```

---

### Nivel 4: Páginas Relacionadas (Automáticas)

**RelatedPages.jsx**

```jsx
export function RelatedPages({ city, service }) {
  const relatedServices = getRelatedServices(service);
  const nearbyCities = getNearbyCities(city);

  return (
    <section>
      {/* Otros servicios en esta ciudad */}
      <h3>Otros Servicios en {city.name}</h3>
      <div className="grid md:grid-cols-3 gap-4">
        {relatedServices.map(s => (
          <ServiceCard
            key={s.slug}
            {...s}
            href={`/${city.country}/${city.slug}/${s.slug}`}
          />
        ))}
      </div>
      
      {/* Este servicio en otras ciudades */}
      <h3>{service.name} en Otras Ciudades</h3>
      <div className="grid md:grid-cols-4 gap-4">
        {nearbyCities.map(c => (
          <CityCard
            key={c.slug}
            {...c}
            href={`/${c.country}/${c.slug}/${service.slug}`}
          />
        ))}
      </div>
    </section>
  );
}
```

---

## Content Strategy

### Long-tail Keywords

**En lugar de competir por keywords imposibles:**

❌ "wedding planning" (Competencia brutal)
❌ "bodas" (Demasiado genérico)

**Atacar long-tail específicas:**

✅ "software gestión invitados boda madrid"
✅ "presupuesto boda sevilla 2026"
✅ "seating plan boda barcelona gratis"
✅ "fotografos boda valencia precios"

**Ventaja:**
- Menos competencia
- Intención clara
- Mayor conversión

---

### Comparativas (Growth Hack)

**Páginas de comparación:**

```
/vs/bodas-net
/vs/zankyou
/vs/the-knot
/alternatives-to-bodas-net
```

**Template:**

```markdown
# Planivia vs Bodas.net: ¿Cuál Elegir en 2026?

## Comparación Directa
| Feature | Planivia | Bodas.net |
|---------|----------|-----------|
| Precio | Gratis hasta 80 | Desde 99€ |
| Gestión Invitados | ✅ Ilimitado | ❌ Limitado |
| ...

## Por qué Planivia es Mejor
- Software completo vs directorio
- Control total vs dependencia proveedores
- ...

[CTA: Prueba Planivia Gratis]
```

---

### Blog Posts que Enlazan a Páginas de Servicio

**Estrategia:**

```
Blog Post: "Cómo Organizar una Boda en Madrid (Guía 2026)"
├── Enlace interno → /es/madrid/gestion-invitados-boda
├── Enlace interno → /es/madrid/presupuesto-boda-online
└── Enlace interno → /es/madrid/fotografia-bodas
```

**Topics de Blog:**
- Guías por ciudad
- Checklists descargables
- Tendencias bodas 2026
- Historias reales de parejas

---

## Métricas y KPIs

### Objetivos por Fase

**Mes 6 (España):**
- 5,000-8,000 visitas/mes orgánicas
- 250 páginas indexadas
- 50+ keywords en Top 10
- Domain Authority: 40+

**Mes 12 (España + México):**
- 15,000-25,000 visitas/mes
- 400 páginas indexadas
- 150+ keywords Top 10
- DA: 45+

**Mes 24 (Multipaís):**
- 50,000-80,000 visitas/mes
- 750+ páginas indexadas
- 500+ keywords Top 10
- DA: 55+

---

### Métricas a Monitorizar

**SEO:**
- Impresiones (Google Search Console)
- Clics orgánicos
- CTR
- Posición promedio
- Páginas indexadas
- Backlinks

**Conversión:**
- Tráfico orgánico → Signups
- Bounce rate por página
- Time on page
- Pages per session

**Herramientas:**
- Google Search Console (gratis)
- Google Analytics 4 (gratis)
- Ahrefs ($99/mes) - Análisis competencia
- SEMrush ($119/mes) - Keywords research

---

## Checklist de Implementación

### Setup Inicial
- [x] Crear 3 páginas de servicios estáticas
- [ ] Crear DynamicServicePage.jsx
- [ ] Crear cities.json (10 ciudades España)
- [ ] Crear services.json
- [ ] Implementar ruta dinámica en App.jsx
- [ ] Crear CountryHub.jsx (/es)
- [ ] Actualizar footer con ciudades

### Contenido
- [ ] Poblar cities.json con 50 ciudades España
- [ ] Añadir stats reales por ciudad
- [ ] Crear contenido específico top 10 ciudades
- [ ] Fotografías hero por ciudad

### SEO Técnico
- [ ] Script generateSitemap.js automático
- [ ] Implementar hreflang tags
- [ ] Schema.org LocalBusiness por página
- [ ] Breadcrumbs en todas las páginas
- [ ] Internal linking automático (RelatedPages)

### Expansión
- [ ] 30 ciudades México
- [ ] Traducción contenido
- [ ] 20 ciudades Colombia
- [ ] 15 ciudades Argentina

---

## Recursos

### Documentación
- `/docs/ESTRATEGIA_SEO_GLOBAL.md` (este documento)
- `/docs/SEO_CHECKLIST.md` (por crear)
- `/docs/CONTENT_GUIDELINES.md` (por crear)

### Código
- `/src/pages/marketing/DynamicServicePage.jsx`
- `/src/data/cities.json`
- `/src/data/services.json`
- `/scripts/generateSitemap.js`

---

**Última actualización:** Enero 2026  
**Mantenido por:** Equipo Planivia  
**Próxima revisión:** Cada 3 meses
