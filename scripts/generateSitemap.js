import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar datos
const citiesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../apps/main-app/src/data/cities.json'), 'utf-8')
);
const servicesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../apps/main-app/src/data/services.json'), 'utf-8')
);
const blogPosts = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../apps/main-app/src/data/blog-posts.json'), 'utf-8')
);

// URLs estáticas
const staticUrls = [
  { loc: 'https://malove.app/', priority: '1.0', changefreq: 'weekly', lastmod: '2026-01-01' },
  {
    loc: 'https://malove.app/precios',
    priority: '0.9',
    changefreq: 'weekly',
    lastmod: '2026-01-01',
  },
  {
    loc: 'https://malove.app/para-proveedores',
    priority: '0.9',
    changefreq: 'weekly',
    lastmod: '2026-01-01',
  },
  { loc: 'https://malove.app/app', priority: '0.8', changefreq: 'weekly' },
  { loc: 'https://malove.app/para-planners', priority: '0.8', changefreq: 'weekly' },
  {
    loc: 'https://malove.app/gestion-invitados-boda',
    priority: '0.9',
    changefreq: 'weekly',
    lastmod: '2026-01-01',
  },
  {
    loc: 'https://malove.app/presupuesto-boda-online',
    priority: '0.9',
    changefreq: 'weekly',
    lastmod: '2026-01-01',
  },
  {
    loc: 'https://malove.app/seating-plan-boda',
    priority: '0.9',
    changefreq: 'weekly',
    lastmod: '2026-01-01',
  },
  { loc: 'https://malove.app/blog', priority: '0.7', changefreq: 'daily' },
];

// Generar URLs dinámicas
const dynamicUrls = [];

// URLs de país (hub pages)
const countries = [...new Set(Object.values(citiesData).map((city) => city.country))];
countries.forEach((country) => {
  dynamicUrls.push({
    loc: `https://malove.app/${country}`,
    priority: '0.8',
    changefreq: 'weekly',
    lastmod: '2026-01-01',
  });
});

// URLs de ciudad + servicio (incluye base + long-tail)
Object.values(citiesData).forEach((city) => {
  if (city.services) {
    Object.keys(city.services).forEach((serviceSlug) => {
      const isLongTail = city.services[serviceSlug]?.longTail;
      dynamicUrls.push({
        loc: `https://malove.app/${city.country}/${city.slug}/${serviceSlug}`,
        priority: isLongTail ? '0.7' : '0.8',
        changefreq: 'weekly',
        lastmod: '2026-01-02',
      });
    });
  }
});

// URLs de blog posts
const blogUrls = blogPosts.map((post) => ({
  loc: `https://malove.app/blog/${post.slug}`,
  priority: '0.7',
  changefreq: 'monthly',
  lastmod: post.publishedAt.split('T')[0],
}));

// Combinar todas las URLs
const allUrls = [...staticUrls, ...dynamicUrls, ...blogUrls];

// Generar XML
const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
${url.lastmod ? `    <lastmod>${url.lastmod}</lastmod>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>
`;

// Escribir archivo
const outputPath = path.join(__dirname, '../apps/main-app/public/sitemap.xml');
fs.writeFileSync(outputPath, xmlContent, 'utf-8');

console.log('✅ Sitemap generado correctamente');
console.log(`📊 Total URLs: ${allUrls.length}`);
console.log(`   - Estáticas: ${staticUrls.length}`);
console.log(`   - Dinámicas: ${dynamicUrls.length}`);
console.log(`   - Blog posts: ${blogUrls.length}`);
console.log(`   - Hub pages: ${countries.length}`);
console.log(`   - Ciudad+Servicio: ${dynamicUrls.length - countries.length}`);
console.log(`📄 Archivo: ${outputPath}`);
