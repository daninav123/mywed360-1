import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar datos existentes
const consolidatedPath = path.join(__dirname, '../data/cities-master-consolidated.json');
const phase2Path = path.join(__dirname, '../data/cities-global-phase2.json');
const outputPath = path.join(__dirname, '../data/cities-master-consolidated.json');

const consolidated = JSON.parse(fs.readFileSync(consolidatedPath, 'utf-8'));
const phase2 = JSON.parse(fs.readFileSync(phase2Path, 'utf-8'));

console.log('🌍 Añadiendo Fase 2: +35 países, +150 ciudades...\n');

// Combinar países
const allCountries = [
  ...consolidated.countries,
  ...phase2.phase2Countries
];

// Calcular nuevo total de ciudades
const totalCities = allCountries.reduce((sum, country) => {
  return sum + (Array.isArray(country.cities) ? country.cities.length : (country.cities || 0));
}, 0);

// Actualizar estructura consolidada
const updatedData = {
  countries: allCountries,
  stats: {
    totalCountries: allCountries.length,
    totalCities: totalCities,
    servicesCount: 7,
    totalSEOPages: totalCities * 7
  },
  metadata: {
    version: '2.0.0',
    lastUpdated: new Date().toISOString(),
    phases: {
      phase1: { countries: 53, cities: 255, status: 'completed' },
      phase2: { countries: 35, cities: 150, status: 'in_progress' },
      total: { countries: allCountries.length, cities: totalCities }
    }
  }
};

fs.writeFileSync(outputPath, JSON.stringify(updatedData, null, 2), 'utf-8');

console.log('✅ Consolidación completada:');
console.log(`   - Total países: ${updatedData.stats.totalCountries}`);
console.log(`   - Total ciudades: ${updatedData.stats.totalCities}`);
console.log(`   - Páginas SEO totales: ${updatedData.stats.totalSEOPages}`);
console.log(`\n🚀 Ejecuta generateAllCities.mjs para generar las nuevas ciudades`);
