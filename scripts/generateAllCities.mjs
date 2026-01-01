import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar datos consolidados
const consolidatedData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/cities-master-consolidated.json'), 'utf-8')
);

// Cargar cities.json actual
const citiesPath = path.join(__dirname, '../apps/main-app/src/data/cities.json');
const existingCities = JSON.parse(fs.readFileSync(citiesPath, 'utf-8'));

// Templates de contenido por país
const contentTemplates = {
  mx: { traditions: ['mariachis', 'padrinos', 'lazo', 'arras'], venues: ['haciendas', 'quintas'], food: ['taquiza', 'mole'] },
  ar: { traditions: ['vals', 'tango'], venues: ['estancias', 'quintas'], food: ['asado', 'empanadas'] },
  co: { traditions: ['hora loca', 'salsa'], venues: ['fincas', 'haciendas'], food: ['bandeja paisa', 'aguardiente'] },
  cl: { traditions: ['cueca', 'vals'], venues: ['viñedos', 'haciendas'], food: ['empanadas', 'pisco sour'] },
  pe: { traditions: ['marinera', 'pisco'], venues: ['casonas', 'jardines'], food: ['ceviche', 'lomo saltado'] },
  us: { traditions: ['first dance', 'bouquet toss'], venues: ['ballrooms', 'gardens'], food: ['buffet', 'cocktails'] },
  it: { traditions: ['confetti', 'la tarantella'], venues: ['villas', 'castelli'], food: ['pasta', 'tiramisu'] },
  fr: { traditions: ['croquembouche', 'vin d\'honneur'], venues: ['châteaux', 'domaines'], food: ['champagne', 'macarons'] },
  uk: { traditions: ['afternoon tea', 'wedding cake'], venues: ['manor houses', 'gardens'], food: ['afternoon tea', 'cake'] },
  br: { traditions: ['samba', 'bem-casados'], venues: ['fazendas', 'praias'], food: ['feijoada', 'caipirinha'] },
  default: { traditions: ['ceremony', 'reception'], venues: ['hotels', 'venues'], food: ['dinner', 'cake'] }
};

function getTemplate(countryCode) {
  return contentTemplates[countryCode] || contentTemplates.default;
}

function getRandomUnsplashId() {
  const ids = ['1518659425952-23e728a37e4a', '1511795409834-ef04bbd61622', '1519167758481-83f29da8fd8e'];
  return ids[Math.floor(Math.random() * ids.length)];
}

function generateCityContent(city, country) {
  const template = getTemplate(country.code);
  const cityId = Object.keys(existingCities).length + 1;
  
  return {
    id: cityId.toString(),
    name: city.name,
    slug: city.slug,
    country: country.code,
    countryCode: country.code.toUpperCase(),
    countryName: country.name,
    locale: country.locale,
    currency: country.currency,
    currencySymbol: country.currencySymbol,
    lat: city.lat,
    lng: city.lng,
    population: city.population,
    heroImage: `https://images.unsplash.com/photo-${getRandomUnsplashId()}?w=1200`,
    description: `${city.name} ofrece bodas únicas con ${template.venues[0]} y ${template.venues[1]}.`,
    weddingStats: {
      avgBudget: getBudget(country.code),
      avgGuests: 130,
      popularMonths: ['Mayo', 'Junio', 'Septiembre', 'Octubre'],
      popularVenues: [template.venues[0], template.venues[1], 'salones']
    },
    services: {
      'gestion-invitados-boda': { avgPrice: '0-100', vendorCount: 50, description: 'Control de invitados' },
      'presupuesto-boda-online': { avgPrice: '0-100', vendorCount: 50, description: 'Administra presupuesto' },
      'seating-plan-boda': { avgPrice: '0-100', vendorCount: 50, description: 'Organiza mesas' },
      'checklist-boda': { avgPrice: '0-100', vendorCount: 50, description: 'Timeline completo' },
      'invitaciones-boda-online': { avgPrice: '0-100', vendorCount: 50, description: 'Invitaciones digitales' },
      'buscar-proveedores-boda': { avgPrice: '0-100', vendorCount: 70, description: 'Proveedores verificados' },
      'web-boda-gratis': { avgPrice: '0-100', vendorCount: 50, description: 'Tu web de boda' }
    },
    contentSections: {
      guide: {
        title: `Guía Completa para tu Boda en ${city.name}`,
        content: `${city.name} es un destino excepcional para bodas en ${country.name}. Con ${city.population.toLocaleString()} habitantes, ofrece ${template.venues.join(' y ')} perfectos para tu celebración. La gastronomía incluye ${template.food.join(', ')}. Las tradiciones locales como ${template.traditions.join(', ')} añaden magia a tu día especial. Reserva con anticipación para los mejores venues.`
      },
      faqs: [
        { question: `¿Cuánto cuesta una boda en ${city.name}?`, answer: `El presupuesto promedio varía según el venue y número de invitados. Incluye catering, música y fotografía.` },
        { question: `¿Cuál es la mejor época?`, answer: `Los meses más populares son mayo, junio y septiembre con clima ideal.` },
        { question: `¿Qué tradiciones son típicas?`, answer: `Las tradiciones incluyen ${template.traditions.join(', ')}.` }
      ],
      tips: [
        `Reserva con 12 meses de anticipación para venues populares`,
        `Prueba el menú antes de contratar catering`,
        `Considera transporte para invitados`,
        `Incluye tradiciones locales para experiencia auténtica`
      ],
      venues: [
        { name: `${template.venues[0]} ${city.name}`, type: template.venues[0], capacity: '200', priceRange: '$$$', highlight: 'Espacio elegante' },
        { name: `${template.venues[1]} Premium`, type: template.venues[1], capacity: '150', priceRange: '$$$$', highlight: 'Ambiente exclusivo' },
        { name: 'Salón Elite', type: 'salon', capacity: '180', priceRange: '$$$', highlight: 'Ubicación privilegiada' }
      ],
      timeline: {
        '12months': 'Definir presupuesto y fecha. Reservar venue',
        '10months': 'Contratar fotógrafo y música',
        '8months': 'Elegir catering y probar menús',
        '6months': 'Enviar save the dates',
        '4months': 'Enviar invitaciones formales',
        '2months': 'Lista final y seating plan',
        '1month': 'Reunión final con proveedores',
        '1week': 'Confirmar todos los detalles'
      }
    }
  };
}

function getBudget(code) {
  const budgets = { mx: '450000', ar: '15000000', us: '40000', uk: '25000', eur: '20000' };
  return budgets[code] || '20000';
}

console.log('🌍 Generando ciudades globales...\n');

let citiesGenerated = 0;
const allCities = { ...existingCities };

consolidatedData.countries.forEach(country => {
  if (!Array.isArray(country.cities)) return;
  
  console.log(`\n🌐 ${country.name} (${country.cities.length} ciudades)...`);
  
  country.cities.forEach(city => {
    if (allCities[city.slug]) {
      console.log(`  ⏭️  ${city.name} ya existe`);
      return;
    }
    
    const cityData = generateCityContent(city, country);
    allCities[city.slug] = cityData;
    citiesGenerated++;
    console.log(`  ✅ ${city.name}`);
  });
});

fs.writeFileSync(citiesPath, JSON.stringify(allCities, null, 2), 'utf-8');

console.log(`\n🎉 Generación completada!`);
console.log(`📊 Ciudades generadas: ${citiesGenerated}`);
console.log(`📄 Total ciudades: ${Object.keys(allCities).length}`);
console.log(`🌍 Páginas SEO totales: ${Object.keys(allCities).length * 7}`);
