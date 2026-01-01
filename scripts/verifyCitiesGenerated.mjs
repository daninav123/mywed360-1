import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const citiesPath = path.join(__dirname, '../apps/main-app/src/data/cities.json');
const cities = JSON.parse(fs.readFileSync(citiesPath, 'utf-8'));

console.log('🔍 VERIFICACIÓN COMPLETA DE CIUDADES GENERADAS\n');
console.log('='.repeat(60));

// Agrupar por país
const byCountry = {};
Object.values(cities).forEach(city => {
  const country = city.countryName || city.country;
  if (!byCountry[country]) {
    byCountry[country] = [];
  }
  byCountry[country].push({
    name: city.name,
    slug: city.slug,
    hasContent: !!(city.contentSections && city.contentSections.guide),
    hasFAQs: !!(city.contentSections && city.contentSections.faqs && city.contentSections.faqs.length > 0),
    hasTips: !!(city.contentSections && city.contentSections.tips && city.contentSections.tips.length > 0),
    hasVenues: !!(city.contentSections && city.contentSections.venues && city.contentSections.venues.length > 0),
    hasTimeline: !!(city.contentSections && city.contentSections.timeline)
  });
});

// Ordenar países alfabéticamente
const sortedCountries = Object.keys(byCountry).sort();

console.log(`\n📊 RESUMEN GENERAL:`);
console.log(`   Total países: ${sortedCountries.length}`);
console.log(`   Total ciudades: ${Object.keys(cities).length}`);
console.log(`   Total páginas SEO: ${Object.keys(cities).length * 7}\n`);
console.log('='.repeat(60));

// Listar por país
sortedCountries.forEach(country => {
  const citiesList = byCountry[country];
  console.log(`\n🌍 ${country} (${citiesList.length} ciudades)`);
  console.log('-'.repeat(60));
  
  citiesList.forEach((city, idx) => {
    const contentCheck = city.hasContent && city.hasFAQs && city.hasTips && city.hasVenues && city.hasTimeline;
    const status = contentCheck ? '✅' : '⚠️';
    console.log(`   ${idx + 1}. ${status} ${city.name} (${city.slug})`);
    
    if (!contentCheck) {
      const missing = [];
      if (!city.hasContent) missing.push('guide');
      if (!city.hasFAQs) missing.push('FAQs');
      if (!city.hasTips) missing.push('tips');
      if (!city.hasVenues) missing.push('venues');
      if (!city.hasTimeline) missing.push('timeline');
      console.log(`      ⚠️  Falta: ${missing.join(', ')}`);
    }
  });
});

// Estadísticas finales
console.log('\n' + '='.repeat(60));
console.log('\n📈 ESTADÍSTICAS DE CONTENIDO:');

let totalComplete = 0;
let totalIncomplete = 0;

Object.values(byCountry).forEach(citiesList => {
  citiesList.forEach(city => {
    const isComplete = city.hasContent && city.hasFAQs && city.hasTips && city.hasVenues && city.hasTimeline;
    if (isComplete) totalComplete++;
    else totalIncomplete++;
  });
});

console.log(`   ✅ Ciudades con contenido completo: ${totalComplete}`);
console.log(`   ⚠️  Ciudades con contenido incompleto: ${totalIncomplete}`);

if (totalIncomplete > 0) {
  console.log(`\n⚠️  ATENCIÓN: ${totalIncomplete} ciudades necesitan contenido completo`);
} else {
  console.log(`\n🎉 ¡PERFECTO! Todas las ciudades tienen contenido completo`);
}

console.log('\n' + '='.repeat(60));
console.log('\n✅ Verificación completada\n');
