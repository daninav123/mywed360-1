/**
 * Script para generar páginas estáticas (Pre-rendering)
 * Genera HTML estático de todas las combinaciones ciudad+servicio
 * 
 * Uso: node scripts/generate-static-pages.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const CITIES_FILE = path.join(ROOT_DIR, 'apps/main-app/src/data/cities.json');
const SERVICES_FILE = path.join(ROOT_DIR, 'apps/main-app/src/data/services.json');
const DIST_DIR = path.join(ROOT_DIR, 'apps/main-app/dist');
const TEMPLATE_FILE = path.join(ROOT_DIR, 'apps/main-app/index.html');

console.log('🚀 Generador de Páginas Estáticas');
console.log('==================================\n');

// Leer datos
console.log('📂 Cargando datos...');
const citiesData = JSON.parse(fs.readFileSync(CITIES_FILE, 'utf-8'));
const servicesData = JSON.parse(fs.readFileSync(SERVICES_FILE, 'utf-8'));
const templateHTML = fs.readFileSync(TEMPLATE_FILE, 'utf-8');

const cities = Object.values(citiesData);
const services = Object.keys(servicesData);

console.log(`✅ ${cities.length} ciudades cargadas`);
console.log(`✅ ${services.length} servicios cargados\n`);

// Función para generar HTML estático de una página
function generateStaticHTML(city, service, serviceData) {
  const seoTitle = `${serviceData.name} en ${city.name} | Planivia`;
  const seoDescription = serviceData.shortDesc || serviceData.longDesc;
  const canonicalUrl = `https://planivia.net/${city.country}/${city.slug}/${service}`;
  const ogImage = serviceData.heroImage || 'https://planivia.net/og-default.jpg';

  // Reemplazar meta tags en el template
  let html = templateHTML;
  
  // Title
  html = html.replace(/<title>.*?<\/title>/, `<title>${seoTitle}</title>`);
  
  // Meta description
  if (html.includes('<meta name="description"')) {
    html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${seoDescription}">`);
  } else {
    html = html.replace('</head>', `  <meta name="description" content="${seoDescription}">\n  </head>`);
  }
  
  // OG tags
  const ogTags = `
    <meta property="og:type" content="website">
    <meta property="og:title" content="${seoTitle}">
    <meta property="og:description" content="${seoDescription}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:image" content="${ogImage}">
    <link rel="canonical" href="${canonicalUrl}">
  `;
  
  html = html.replace('</head>', `  ${ogTags}\n  </head>`);
  
  return html;
}

// Generar páginas estáticas
console.log('📝 Generando páginas estáticas...\n');

let generatedCount = 0;
let skippedCount = 0;

cities.forEach((city) => {
  services.forEach((serviceSlug) => {
    // Solo generar si la ciudad tiene ese servicio
    if (!city.services || !city.services[serviceSlug]) {
      skippedCount++;
      return;
    }

    const serviceData = servicesData[serviceSlug];
    const relativePath = `${city.country}/${city.slug}/${serviceSlug}`;
    const outputDir = path.join(DIST_DIR, relativePath);
    const outputFile = path.join(outputDir, 'index.html');

    // Crear directorio si no existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generar HTML
    const html = generateStaticHTML(city, serviceSlug, serviceData);

    // Escribir archivo
    fs.writeFileSync(outputFile, html, 'utf-8');
    
    generatedCount++;
    
    // Log cada 100 páginas
    if (generatedCount % 100 === 0) {
      console.log(`  ✓ ${generatedCount} páginas generadas...`);
    }
  });
});

console.log('\n✅ Generación completada!');
console.log(`   📄 ${generatedCount} páginas generadas`);
console.log(`   ⏭️  ${skippedCount} combinaciones saltadas (sin datos)`);
console.log(`\n📁 Ubicación: ${DIST_DIR}`);

// Generar reporte
const reportPath = path.join(DIST_DIR, 'static-pages-report.json');
const report = {
  timestamp: new Date().toISOString(),
  generated: generatedCount,
  skipped: skippedCount,
  totalCities: cities.length,
  totalServices: services.length,
  maxPossible: cities.length * services.length
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`📊 Reporte guardado en: ${reportPath}\n`);
