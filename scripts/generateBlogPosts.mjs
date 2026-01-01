import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar datos de ciudades
const citiesPath = path.join(__dirname, '../apps/main-app/src/data/cities.json');
const cities = JSON.parse(fs.readFileSync(citiesPath, 'utf-8'));
const servicesPath = path.join(__dirname, '../apps/main-app/src/data/services.json');
const services = JSON.parse(fs.readFileSync(servicesPath, 'utf-8'));

// Output directory
const blogOutputPath = path.join(__dirname, '../apps/main-app/src/data/blog-posts.json');

console.log('📝 Generando artículos de blog SEO automatizados...\n');

const blogPosts = [];

// Template 1: Guía Completa por Ciudad
Object.values(cities).forEach((city, index) => {
  const slug = `guia-completa-bodas-${city.slug}`;
  const title = `Guía Completa para Bodas en ${city.name} 2026`;
  const excerpt = `Todo lo que necesitas saber para organizar tu boda perfecta en ${city.name}: venues, presupuestos, proveedores y consejos locales.`;
  
  const content = `
# ${title}

${city.name} es uno de los destinos más populares para bodas en ${city.countryName}. Con ${city.population.toLocaleString()} habitantes y una rica oferta de venues, esta ciudad ofrece todo lo necesario para una celebración inolvidable.

## ¿Por qué casarse en ${city.name}?

${city.description || `${city.name} combina tradición y modernidad, ofreciendo venues únicos para todo tipo de bodas.`}

## Presupuesto Promedio

El presupuesto promedio para una boda en ${city.name} es de ${city.weddingStats?.avgBudget || '20000'}${city.currencySymbol} para ${city.weddingStats?.avgGuests || 130} invitados.

### Desglose de Costos:
- **Venue:** 30-40% del presupuesto
- **Catering:** 35-45% del presupuesto  
- **Fotografía y video:** 10-15%
- **Música y entretenimiento:** 8-12%
- **Decoración y flores:** 10-15%

## Mejores Venues en ${city.name}

${city.contentSections?.venues?.map(v => `### ${v.name}\n- **Tipo:** ${v.type}\n- **Capacidad:** ${v.capacity} personas\n- **Rango de precio:** ${v.priceRange}\n- ${v.highlight}\n`).join('\n') || 'Los mejores venues incluyen salones de eventos, jardines y espacios históricos.'}

## Mejor Época del Año

${city.weddingStats?.popularMonths?.join(', ') || 'Los meses más populares son primavera y otoño'} son ideales para bodas en ${city.name}.

## Proveedores Recomendados

Planivia tiene más de ${Object.values(city.services || {}).reduce((sum, s) => sum + (s.vendorCount || 0), 0)} proveedores verificados en ${city.name} para todos los servicios de boda.

## Tips de Expertos

${city.contentSections?.tips?.map((tip, i) => `${i + 1}. ${tip}`).join('\n') || '- Reserva con anticipación\n- Visita los venues personalmente\n- Lee reviews de parejas anteriores'}

## Planifica tu Boda con Planivia

[Empieza gratis](/signup) y organiza tu boda en ${city.name} con nuestras herramientas profesionales.

---

**Última actualización:** ${new Date().toLocaleDateString('es-ES')}
`;

  blogPosts.push({
    id: `blog-${index + 1}`,
    slug,
    title,
    excerpt,
    content,
    author: 'Equipo Planivia',
    category: 'Guías por Ciudad',
    tags: [`bodas ${city.name}`, city.slug, 'guía completa', city.countryName],
    city: city.slug,
    country: city.country,
    publishedAt: new Date().toISOString(),
    seo: {
      metaTitle: `${title} | Planivia`,
      metaDescription: excerpt,
      keywords: `bodas ${city.name}, guía bodas ${city.name}, venues ${city.name}, presupuesto boda ${city.name}`,
      ogImage: `${city.heroImage}?w=1200&h=630&fit=crop`
    }
  });
});

// Template 2: Comparativas entre ciudades del mismo país
const citiesByCountry = {};
Object.values(cities).forEach(city => {
  if (!citiesByCountry[city.country]) citiesByCountry[city.country] = [];
  citiesByCountry[city.country].push(city);
});

Object.entries(citiesByCountry).forEach(([country, citiesInCountry]) => {
  if (citiesInCountry.length >= 2) {
    // Comparar las 2 ciudades principales
    for (let i = 0; i < Math.min(3, citiesInCountry.length - 1); i++) {
      const city1 = citiesInCountry[i];
      const city2 = citiesInCountry[i + 1];
      
      const slug = `${city1.slug}-vs-${city2.slug}-bodas`;
      const title = `${city1.name} vs ${city2.name}: ¿Dónde hacer tu boda?`;
      const excerpt = `Comparativa completa entre ${city1.name} y ${city2.name} para ayudarte a elegir el mejor destino para tu boda.`;
      
      const content = `
# ${title}

¿Estás decidiendo entre ${city1.name} y ${city2.name} para tu boda? Esta guía comparativa te ayudará a tomar la mejor decisión.

## ${city1.name}

${city1.description}

**Presupuesto promedio:** ${city1.weddingStats?.avgBudget || 'N/A'}${city1.currencySymbol}

## ${city2.name}

${city2.description}

**Presupuesto promedio:** ${city2.weddingStats?.avgBudget || 'N/A'}${city2.currencySymbol}

## Comparativa de Costos

| Aspecto | ${city1.name} | ${city2.name} |
|---------|---------------|---------------|
| Presupuesto promedio | ${city1.weddingStats?.avgBudget || 'N/A'}${city1.currencySymbol} | ${city2.weddingStats?.avgBudget || 'N/A'}${city2.currencySymbol} |
| Invitados promedio | ${city1.weddingStats?.avgGuests || 130} | ${city2.weddingStats?.avgGuests || 130} |
| Población | ${city1.population.toLocaleString()} | ${city2.population.toLocaleString()} |

## Conclusión

Ambas ciudades ofrecen excelentes opciones para bodas. ${city1.name} es ideal si buscas [características], mientras que ${city2.name} destaca por [otras características].

[Organiza tu boda](/signup) en cualquiera de estas ciudades con Planivia.
`;

      blogPosts.push({
        id: `blog-compare-${blogPosts.length + 1}`,
        slug,
        title,
        excerpt,
        content,
        author: 'Equipo Planivia',
        category: 'Comparativas',
        tags: [city1.slug, city2.slug, 'comparativa', 'decisión boda'],
        city: null,
        country,
        publishedAt: new Date().toISOString(),
        seo: {
          metaTitle: `${title} | Planivia`,
          metaDescription: excerpt,
          keywords: `${city1.name} vs ${city2.name}, bodas ${city1.name}, bodas ${city2.name}`
        }
      });
    }
  }
});

// Template 3: Presupuesto Detallado por Ciudad
Object.values(cities).slice(0, 100).forEach(city => {
  const slug = `presupuesto-boda-${city.slug}-2026`;
  const title = `Presupuesto Boda ${city.name}: Desglose Completo 2026`;
  const excerpt = `Descubre cuánto cuesta una boda en ${city.name} con desglose detallado por categoría. Precios actualizados 2026.`;
  
  const avgBudget = city.weddingStats?.avgBudget || '20000';
  const currency = city.currencySymbol;
  
  const content = `
# ${title}

Organizar una boda en ${city.name} requiere planificación financiera cuidadosa. Aquí te mostramos el desglose completo de costos.

## Presupuesto Promedio Total

**${avgBudget}${currency}** para ${city.weddingStats?.avgGuests || 130} invitados.

## Desglose Detallado

### 1. Venue (35%)
**Costo:** ${Math.round(avgBudget * 0.35).toLocaleString()}${currency}

Los venues en ${city.name} varían según ubicación y capacidad.

### 2. Catering (40%)
**Costo:** ${Math.round(avgBudget * 0.40).toLocaleString()}${currency}

Incluye menú completo, bebidas y servicio.

### 3. Fotografía y Video (12%)
**Costo:** ${Math.round(avgBudget * 0.12).toLocaleString()}${currency}

Cobertura completa del día.

### 4. Música (8%)
**Costo:** ${Math.round(avgBudget * 0.08).toLocaleString()}${currency}

DJ, banda o ambos.

### 5. Flores y Decoración (5%)
**Costo:** ${Math.round(avgBudget * 0.05).toLocaleString()}${currency}

Ramo, centros de mesa, decoración del venue.

## Cómo Ahorrar

1. Elige temporada baja
2. Negocia paquetes con proveedores
3. Limita la lista de invitados
4. Usa herramientas digitales (como Planivia) para organizar

## Gestiona tu Presupuesto con Planivia

[Crea tu presupuesto gratis](/signup) y controla cada gasto de tu boda en ${city.name}.
`;

  blogPosts.push({
    id: `blog-budget-${blogPosts.length + 1}`,
    slug,
    title,
    excerpt,
    content,
    author: 'Equipo Planivia',
    category: 'Presupuestos',
    tags: [`presupuesto boda ${city.name}`, 'costos boda', city.slug, 'precios'],
    city: city.slug,
    country: city.country,
    publishedAt: new Date().toISOString(),
    seo: {
      metaTitle: `${title} | Planivia`,
      metaDescription: excerpt,
      keywords: `presupuesto boda ${city.name}, cuánto cuesta boda ${city.name}, precios boda ${city.name} 2026`
    }
  });
});

// Guardar archivo
fs.writeFileSync(blogOutputPath, JSON.stringify(blogPosts, null, 2), 'utf-8');

console.log('✅ Generación completada!\n');
console.log(`📊 Estadísticas:`);
console.log(`   - Total artículos: ${blogPosts.length}`);
console.log(`   - Guías por ciudad: ${Object.keys(cities).length}`);
console.log(`   - Comparativas: ${blogPosts.filter(p => p.category === 'Comparativas').length}`);
console.log(`   - Presupuestos: ${blogPosts.filter(p => p.category === 'Presupuestos').length}`);
console.log(`\n📄 Archivo guardado: ${blogOutputPath}`);
console.log(`\n🚀 Próximo paso: Crear rutas y componente de blog en la app`);
