#!/usr/bin/env node

/**
 * Script para actualizar heroImages en cities.json y ogImages en blog-posts.json
 * Reemplaza URLs de Unsplash con imágenes locales generadas por IA
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const CITY_IMAGES = {
  'es-madrid': '/assets/cities/es-madrid.webp',
  'es-barcelona': '/assets/cities/es-barcelona.webp',
  'es-valencia': '/assets/cities/es-valencia.webp',
  'es-sevilla': '/assets/cities/es-sevilla.webp',
  'es-coast': '/assets/cities/es-coast.webp',
  'es-interior': '/assets/cities/es-interior.webp',
  'mx-cdmx': '/assets/cities/mx-cdmx.webp',
  'mx-guadalajara': '/assets/cities/mx-guadalajara.webp',
  'mx-cancun': '/assets/cities/mx-cancun.webp',
  'mx-playadelcarmen': '/assets/cities/mx-playadelcarmen.webp',
  'ar-buenosaires': '/assets/cities/ar-buenosaires.webp',
  'ar-mendoza': '/assets/cities/ar-mendoza.webp',
  'ar-cordoba': '/assets/cities/ar-cordoba.webp',
  'fr-paris': '/assets/cities/fr-paris.webp',
  'fr-provence': '/assets/cities/fr-provence.webp',
  'generic-beach': '/assets/cities/generic-beach.webp',
  'generic-mountain': '/assets/cities/generic-mountain.webp',
  'generic-garden': '/assets/cities/generic-garden.webp',
  'generic-historic': '/assets/cities/generic-historic.webp',
  'generic-modern': '/assets/cities/generic-modern.webp',
};

const SPECIFIC_CITIES = {
  madrid: 'es-madrid',
  barcelona: 'es-barcelona',
  valencia: 'es-valencia',
  sevilla: 'es-sevilla',
  'ciudad de mexico': 'mx-cdmx',
  cdmx: 'mx-cdmx',
  guadalajara: 'mx-guadalajara',
  cancun: 'mx-cancun',
  'playa del carmen': 'mx-playadelcarmen',
  'buenos aires': 'ar-buenosaires',
  mendoza: 'ar-mendoza',
  cordoba: 'ar-cordoba',
  paris: 'fr-paris',
  provence: 'fr-provence',
};

const KEYWORDS = {
  beach: ['playa', 'beach', 'costa', 'coast', 'mar', 'sea'],
  mountain: ['montana', 'mountain', 'sierra', 'alpes'],
  garden: ['jardin', 'garden', 'botanico', 'park'],
  historic: ['historico', 'medieval', 'castillo', 'palacio'],
  modern: ['moderno', 'modern', 'urbano'],
};

function normalizeText(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function classifyCity(cityName, description = '', country = '') {
  const text = normalizeText(`${cityName} ${description}`);
  const normalized = normalizeText(cityName);

  if (SPECIFIC_CITIES[normalized]) {
    return CITY_IMAGES[SPECIFIC_CITIES[normalized]];
  }

  for (const [type, keywords] of Object.entries(KEYWORDS)) {
    if (keywords.some((kw) => text.includes(normalizeText(kw)))) {
      return CITY_IMAGES[`generic-${type}`];
    }
  }

  const countryCode = (country || '').toLowerCase();
  if (countryCode === 'es') {
    if (text.includes('costa') || text.includes('playa')) {
      return CITY_IMAGES['es-coast'];
    }
    return CITY_IMAGES['es-interior'];
  }
  if (countryCode === 'mx') {
    return text.includes('playa') || text.includes('cancun')
      ? CITY_IMAGES['mx-cancun']
      : CITY_IMAGES['mx-cdmx'];
  }
  if (countryCode === 'ar') return CITY_IMAGES['ar-buenosaires'];
  if (countryCode === 'fr') return CITY_IMAGES['fr-paris'];

  return CITY_IMAGES['generic-modern'];
}

console.log('\n🌍 Actualizando imágenes en cities.json y blog-posts.json...\n');

const citiesPath = path.join(rootDir, 'apps/main-app/src/data/cities.json');
if (fs.existsSync(citiesPath)) {
  const citiesData = JSON.parse(fs.readFileSync(citiesPath, 'utf8'));
  let citiesUpdated = 0;

  for (const [slug, cityData] of Object.entries(citiesData)) {
    const localImage = classifyCity(
      cityData.name || slug,
      cityData.description || '',
      cityData.country || cityData.countryCode || ''
    );

    if (cityData.heroImage && cityData.heroImage.includes('unsplash')) {
      citiesData[slug].heroImage = localImage;
      citiesUpdated++;
    }
  }

  fs.writeFileSync(citiesPath, JSON.stringify(citiesData, null, 2), 'utf8');
  console.log(`✅ cities.json: ${citiesUpdated} imágenes actualizadas`);
}

const blogPath = path.join(rootDir, 'apps/main-app/src/data/blog-posts.json');
if (fs.existsSync(blogPath)) {
  const blogData = JSON.parse(fs.readFileSync(blogPath, 'utf8'));
  let blogsUpdated = 0;

  for (const post of blogData) {
    if (post.seo?.ogImage && post.seo.ogImage.includes('unsplash')) {
      const localImage = classifyCity(
        post.city || post.title || '',
        post.excerpt || '',
        post.country || ''
      );
      post.seo.ogImage = localImage;
      blogsUpdated++;
    }
  }

  fs.writeFileSync(blogPath, JSON.stringify(blogData, null, 2), 'utf8');
  console.log(`✅ blog-posts.json: ${blogsUpdated} imágenes actualizadas`);
}

console.log('\n✨ Actualización completada!\n');
