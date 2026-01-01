const fs = require('fs');
const path = require('path');

// Cargar ambos archivos JSON
const hispanicCountries = require('../data/cities-master-list.json');
const globalExpansion = require('../data/cities-global-expansion.json');

console.log('🌍 Consolidando datos de países...\n');

// Combinar todos los países
const allCountries = [
  ...hispanicCountries.countries,
  ...globalExpansion.additionalCountries
];

// Crear estructura consolidada
const consolidatedData = {
  countries: allCountries,
  stats: {
    totalCountries: allCountries.length,
    totalCities: allCountries.reduce((sum, country) => {
      return sum + (Array.isArray(country.cities) ? country.cities.length : country.cities || 0);
    }, 0),
    servicesCount: 7,
    get totalSEOPages() {
      return this.totalCities * this.servicesCount;
    }
  },
  metadata: {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    phases: {
      phase1: {
        countries: 15,
        description: 'Países hispanohablantes',
        status: 'in_progress'
      },
      phase2: {
        countries: 30,
        description: 'Europa + Asia top',
        status: 'pending'
      },
      phase3: {
        countries: 60,
        description: 'Cobertura global completa',
        status: 'pending'
      }
    }
  }
};

// Calcular stats actualizados
console.log('📊 Estadísticas:');
console.log(`   - Total países: ${consolidatedData.stats.totalCountries}`);
console.log(`   - Total ciudades: ${consolidatedData.stats.totalCities}`);
console.log(`   - Servicios por ciudad: ${consolidatedData.stats.servicesCount}`);
console.log(`   - Total páginas SEO: ${consolidatedData.stats.totalSEOPages}`);

// Guardar archivo consolidado
const outputPath = path.join(__dirname, '../data/cities-master-consolidated.json');
fs.writeFileSync(
  outputPath,
  JSON.stringify(consolidatedData, null, 2),
  'utf-8'
);

console.log(`\n✅ Archivo consolidado guardado en: ${outputPath}`);
console.log('🚀 Listo para ejecutar generateAllCities.js');
