#!/usr/bin/env node

/**
 * Script para generar mapeo inteligente de ciudades a imágenes genéricas
 * 
 * Analiza cities.json y blog-posts.json y crea un mapeo de cada ciudad
 * a una imagen genérica basada en sus características
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Imágenes genéricas disponibles
const GENERIC_IMAGES = {
  // España
  'es-madrid': '/assets/cities/es-madrid.webp',
  'es-barcelona': '/assets/cities/es-barcelona.webp',
  'es-valencia': '/assets/cities/es-valencia.webp',
  'es-sevilla': '/assets/cities/es-sevilla.webp',
  'es-coast': '/assets/cities/es-coast.webp',
  'es-interior': '/assets/cities/es-interior.webp',
  
  // México
  'mx-cdmx': '/assets/cities/mx-cdmx.webp',
  'mx-guadalajara': '/assets/cities/mx-guadalajara.webp',
  'mx-cancun': '/assets/cities/mx-cancun.webp',
  'mx-playadelcarmen': '/assets/cities/mx-playadelcarmen.webp',
  
  // Argentina
  'ar-buenosaires': '/assets/cities/ar-buenosaires.webp',
  'ar-mendoza': '/assets/cities/ar-mendoza.webp',
  'ar-cordoba': '/assets/cities/ar-cordoba.webp',
  
  // Francia
  'fr-paris': '/assets/cities/fr-paris.webp',
  'fr-provence': '/assets/cities/fr-provence.webp',
  
  // Genéricas
  'generic-beach': '/assets/cities/generic-beach.webp',
  'generic-mountain': '/assets/cities/generic-mountain.webp',
  'generic-garden': '/assets/cities/generic-garden.webp',
  'generic-historic': '/assets/cities/generic-historic.webp',
  'generic-modern': '/assets/cities/generic-modern.webp',
};

// Ciudades específicas con imágenes dedicadas
const SPECIFIC_CITIES = {
  'madrid': 'es-madrid',
  'barcelona': 'es-barcelona',
  'valencia': 'es-valencia',
  'sevilla': 'es-sevilla',
  'seville': 'es-sevilla',
  'ciudad de méxico': 'mx-cdmx',
  'mexico city': 'mx-cdmx',
  'cdmx': 'mx-cdmx',
  'guadalajara': 'mx-guadalajara',
  'cancún': 'mx-cancun',
  'cancun': 'mx-cancun',
  'playa del carmen': 'mx-playadelcarmen',
  'buenos aires': 'ar-buenosaires',
  'mendoza': 'ar-mendoza',
  'córdoba': 'ar-cordoba',
  'cordoba': 'ar-cordoba',
  'paris': 'fr-paris',
  'parís': 'fr-paris',
  'provence': 'fr-provence',
};

// Palabras clave para clasificación
const KEYWORDS = {
  beach: ['playa', 'beach', 'costa', 'coast', 'mar', 'sea', 'océano', 'ocean', 'caribe', 'caribbean'],
  mountain: ['montaña', 'mountain', 'sierra', 'alpes', 'alps', 'cordillera'],
  garden: ['jardín', 'garden', 'botánico', 'botanical', 'parque', 'park'],
  historic: ['histórico', 'historic', 'medieval', 'castillo', 'castle', 'palacio', 'palace'],
  modern: ['moderno', 'modern', 'contemporáneo', 'contemporary', 'urbano', 'urban'],
};

function normalizeText(text) {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function classifyCity(cityName, description = '', country = '') {
  const text = normalizeText(`${cityName} ${description}`);
  
  // Verificar si es una ciudad específica
  const normalized = normalizeText(cityName);
  if (SPECIFIC_CITIES[normalized]) {
    return GENERIC_IMAGES[SPECIFIC_CITIES[normalized]];
  }
  
  // Clasificar por palabras clave
  for (const [type, keywords] of Object.entries(KEYWORDS)) {
    if (keywords.some(kw => text.includes(normalizeText(kw)))) {
      return GENERIC_IMAGES[`generic-${type}`];
    }
  }
  
  // Clasificar por país y ubicación
  if (country === 'es' || country === 'ES') {
    // España - diferenciar costa vs interior
    if (text.includes('costa') || text.includes('playa') || 
        text.includes('mar') || text.includes('mediterr')) {
      return GENERIC_IMAGES['es-coast'];
    }
    return GENERIC_IMAGES['es-interior'];
  }
  
  if (country === 'mx' || country === 'MX') {
    // México - usar imagen genérica según región
    if (text.includes('playa') || text.includes('cancun') || text.includes('riviera')) {
      return GENERIC_IMAGES['mx-cancun'];
    }
    return GENERIC_IMAGES['mx-cdmx'];
  }
  
  if (country === 'ar' || country === 'AR') {
    return GENERIC_IMAGES['ar-buenosaires'];
  }
  
  if (country === 'fr' || country === 'FR') {
    return GENERIC_IMAGES['fr-paris'];
  }
  
  // Default: elegante y moderno
  return GENERIC_IMAGES['generic-modern'];
}

// Procesar cities.json
console.log('\n🗺️  Generando mapeo de ciudades...\n');

const citiesPath = path.join(rootDir, 'apps/main-app/src/data/cities.json');
let cityMappings = {};
let totalCities = 0;

if (fs.existsSync(citiesPath)) {
  const citiesData = JSON.parse(fs.readFileSync(citiesPath, 'utf8'));
  
  for (const [slug, cityData] of Object.entries(citiesData)) {
    const localImage = classifyCity(
      cityData.name || slug,
      cityData.description || '',
      cityData.country || cityData.countryCode || ''
    );
    
    cityMappings[slug] = localImage;
    totalCities++;
  }
  
  console.log(`✅ Procesadas ${totalCities} ciudades de cities.json`);
}

// Guardar mapeo
const outputPath = path.join(rootDir, 'apps/main-app/src/data/city-image-mappings.json');
fs.writeFileSync(outputPath, JSON.stringify(cityMappings, null, 2), 'utf8');

console.log(`\n💾 Mapeo guardado en: apps/main-app/src/data/city-image-mappings.json`);
console.log(`\n📊 Total: ${totalCities} ciudades mapeadas`);
console.log('\n✨ Proceso completado!\n');

// Mostrar estadísticas de uso de imágenes
console.log('📸 Distribución de imágenes:\n');
const distribution = {};
for (const image of Object.values(cityMappings)) {
  distribution[image] = (distribution[image] || 0) + 1;
}

Object.entries(distribution)
  .sort((a, b) => b[1] - a[1])
  .forEach(([image, count]) => {
    console.log(`   ${image}: ${count} ciudades`);
  });

console.log('\n');
