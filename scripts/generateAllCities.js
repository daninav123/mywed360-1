const fs = require('fs');
const path = require('path');

// Cargar la lista maestra de países y ciudades
const masterList = require('../data/cities-master-list.json');

// Cargar cities.json actual
const citiesPath = path.join(__dirname, '../apps/main-app/src/data/cities.json');
const existingCities = require(citiesPath);

// Templates de contenido por país
const countryTemplates = {
  mx: {
    traditions: ['mariachis', 'padrinos de lazo y arras', 'vals', 'hora loca'],
    venues: ['haciendas', 'quintas', 'jardines', 'salones de eventos'],
    food: ['taquiza gourmet', 'mole', 'pozole', 'tamales', 'mezcal artesanal'],
    tips: [
      'Reserva con 12-18 meses de anticipación en temporada alta',
      'Incluye mariachi o grupo versátil - es tradición muy apreciada',
      'La estación de tacos a medianoche es imprescindible',
      'Considera transporte para invitados por seguridad'
    ]
  },
  ar: {
    traditions: ['vals', 'tango', 'zapatos de novia', 'liga'],
    venues: ['estancias', 'quintas', 'salones de fiesta', 'bodegas'],
    food: ['asado', 'empanadas', 'choripán', 'dulce de leche', 'vino argentino'],
    tips: [
      'Las fiestas argentinas son largas - calcula hasta las 6am',
      'El asado es protagonista - busca buenos parrilleros',
      'Incluye mesa dulce con alfajores y postres argentinos',
      'La música en vivo (banda, DJ) es fundamental'
    ]
  },
  co: {
    traditions: ['vals', 'hora loca', 'salsa', 'aguardiente'],
    venues: ['fincas', 'haciendas cafeteras', 'clubs', 'hoteles boutique'],
    food: ['bandeja paisa', 'ajiaco', 'lechona', 'sancocho', 'aguardiente'],
    tips: [
      'La hora loca con disfraces es tradición imperdible',
      'Incluye música tropical y salsa - colombianos bailan toda la noche',
      'Temporada seca: dic-mar y jun-ago',
      'Considera clima de cada región - Costa cálida, Bogotá fría'
    ]
  },
  cl: {
    traditions: ['vals', 'cueca', 'juegos', 'discursos emotivos'],
    venues: ['viñedos', 'haciendas', 'salones', 'playas'],
    food: ['pastel de choclo', 'empanadas', 'cazuela', 'pisco sour', 'vino chileno'],
    tips: [
      'Chile tiene excelentes viñedos para bodas premium',
      'Invierno (jun-ago) ideal para bodas en ski resorts del sur',
      'Santiago concentra mejor oferta de proveedores',
      'Pisco sour en barra libre es tradición'
    ]
  },
  pe: {
    traditions: ['vals', 'marinera', 'pisco sour', 'rituales andinos'],
    venues: ['haciendas', 'casonas coloniales', 'hoteles históricos', 'jardines'],
    food: ['ceviche', 'lomo saltado', 'anticuchos', 'causa', 'pisco sour'],
    tips: [
      'Cusco es destino top para bodas simbólicas con Machu Picchu',
      'Lima tiene gastronomía mundialmente reconocida',
      'Temporada seca en sierra: may-oct',
      'Incluye pisco sour y chilcano en barra de tragos'
    ]
  },
  us: {
    traditions: ['first dance', 'cake cutting', 'bouquet toss', 'open bar'],
    venues: ['ballrooms', 'gardens', 'beaches', 'vineyards', 'hotels'],
    food: ['buffet', 'plated dinner', 'food trucks', 'BBQ', 'cocktails'],
    tips: [
      'Presupuestos más altos - promedio $30-50k USD',
      'Save the dates 8-12 meses antes',
      'Wedding planner casi obligatorio',
      'Considera tradiciones latinas + americanas para bodas biculturales'
    ]
  }
};

// Función para generar contenido único por ciudad
function generateCityContent(city, country) {
  const template = countryTemplates[country.code] || countryTemplates.mx;
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
    description: `${city.name} ofrece bodas únicas con ${template.venues.join(', ')} y una experiencia inolvidable.`,
    weddingStats: {
      avgBudget: getAvgBudget(country.code),
      avgGuests: getAvgGuests(country.code),
      popularMonths: getPopularMonths(country.code),
      popularVenues: template.venues.slice(0, 3)
    },
    services: {
      "gestion-invitados-boda": {
        avgPrice: getPriceRange(country.code),
        vendorCount: Math.floor(Math.random() * 50) + 40,
        description: "Control total de tu lista de invitados"
      },
      "presupuesto-boda-online": {
        avgPrice: getPriceRange(country.code),
        vendorCount: Math.floor(Math.random() * 50) + 40,
        description: `Administra tu presupuesto en ${country.currency}`
      },
      "seating-plan-boda": {
        avgPrice: getPriceRange(country.code),
        vendorCount: Math.floor(Math.random() * 50) + 40,
        description: "Organiza mesas con drag & drop"
      },
      "checklist-boda": {
        avgPrice: getPriceRange(country.code),
        vendorCount: Math.floor(Math.random() * 50) + 40,
        description: "Timeline adaptado a tradiciones locales"
      },
      "invitaciones-boda-online": {
        avgPrice: getPriceRange(country.code),
        vendorCount: Math.floor(Math.random() * 50) + 40,
        description: "Invitaciones digitales elegantes"
      },
      "buscar-proveedores-boda": {
        avgPrice: getPriceRange(country.code),
        vendorCount: Math.floor(Math.random() * 80) + 60,
        description: `Proveedores verificados en ${city.name}`
      },
      "web-boda-gratis": {
        avgPrice: getPriceRange(country.code),
        vendorCount: Math.floor(Math.random() * 50) + 40,
        description: "Tu web de boda personalizada"
      }
    },
    contentSections: {
      guide: {
        title: `Guía Completa para tu Boda en ${city.name}`,
        content: generateGuideContent(city, country, template)
      },
      faqs: generateFAQs(city, country, template),
      tips: template.tips,
      venues: generateVenues(city, template),
      timeline: generateTimeline(country)
    }
  };
}

// Funciones auxiliares
function getRandomUnsplashId() {
  const ids = [
    '1518659425952-23e728a37e4a',
    '1511795409834-ef04bbd61622',
    '1519167758481-83f29da8fd8e',
    '1464366400600-7168b8af9bc3',
    '1606800052052-a08af7148866',
    '1492684223066-81342ee5ff30'
  ];
  return ids[Math.floor(Math.random() * ids.length)];
}

function getAvgBudget(countryCode) {
  const budgets = {
    mx: '450000', ar: '15000000', co: '60000000', 
    cl: '15000000', pe: '45000', us: '40000',
    ec: '15000', uy: '1500000', bo: '80000', py: '120000000'
  };
  return budgets[countryCode] || '20000';
}

function getAvgGuests(countryCode) {
  const guests = {
    mx: 150, ar: 140, co: 160, cl: 120, pe: 140,
    us: 120, ec: 130, uy: 110, bo: 150, py: 160
  };
  return guests[countryCode] || 130;
}

function getPopularMonths(countryCode) {
  const months = {
    mx: ['Octubre', 'Noviembre', 'Diciembre', 'Marzo'],
    ar: ['Octubre', 'Noviembre', 'Marzo', 'Abril'],
    co: ['Diciembre', 'Enero', 'Febrero', 'Julio'],
    cl: ['Diciembre', 'Enero', 'Febrero', 'Marzo'],
    pe: ['Abril', 'Mayo', 'Septiembre', 'Octubre'],
    us: ['Mayo', 'Junio', 'Septiembre', 'Octubre']
  };
  return months[countryCode] || ['Mayo', 'Junio', 'Septiembre', 'Octubre'];
}

function getPriceRange(countryCode) {
  const prices = {
    mx: '0-2500', ar: '0-150000', co: '0-3500000',
    cl: '0-800000', pe: '0-250', us: '0-300',
    ec: '0-120', uy: '0-50000', bo: '0-600', py: '0-2500000'
  };
  return prices[countryCode] || '0-100';
}

function generateGuideContent(city, country, template) {
  return `${city.name} es un destino excepcional para bodas en ${country.name}. Con ${city.population.toLocaleString()} habitantes, ofrece una combinación única de ${template.venues.join(', ')} que hacen de cada celebración algo inolvidable.\n\nLa ciudad destaca por sus ${template.venues[0]} y ${template.venues[1]}, espacios perfectos para bodas desde 80 hasta 300 invitados. La gastronomía local incluye delicias como ${template.food.slice(0, 3).join(', ')}, que puedes incorporar en tu menú para darle un toque auténtico.\n\nLas tradiciones incluyen ${template.traditions.join(', ')}, elementos que añaden magia y significado a tu ceremonia. El presupuesto promedio ronda los ${getAvgBudget(country.code)} ${country.currency} para ${getAvgGuests(country.code)} invitados.\n\nLa mejor época para casarse es durante ${getPopularMonths(country.code).slice(0, 2).join(' y ')}, cuando el clima es ideal y los venues lucen espectaculares. Reserva con anticipación para asegurar los mejores proveedores.`;
}

function generateFAQs(city, country, template) {
  return [
    {
      question: `¿Cuánto cuesta una boda en ${city.name}?`,
      answer: `El presupuesto promedio es ${getAvgBudget(country.code)} ${country.currency} para ${getAvgGuests(country.code)} invitados. Incluye venue, catering, música y fotografía.`
    },
    {
      question: `¿Cuál es la mejor época para casarse en ${city.name}?`,
      answer: `Los meses más populares son ${getPopularMonths(country.code).join(', ')}. El clima es ideal y hay excelente disponibilidad.`
    },
    {
      question: `¿Qué tradiciones son típicas en bodas de ${city.name}?`,
      answer: `Las tradiciones incluyen ${template.traditions.join(', ')}. Estas costumbres añaden un toque especial y auténtico a tu celebración.`
    },
    {
      question: `¿Qué comida típica incluir en el menú?`,
      answer: `Te recomendamos ${template.food.slice(0, 4).join(', ')}. La gastronomía local es protagonista y tus invitados la adorarán.`
    },
    {
      question: `¿Con cuánta anticipación reservar?`,
      answer: `Recomendamos 12-18 meses para venues populares. Los mejores ${template.venues[0]} y ${template.venues[1]} se agotan rápido en temporada alta.`
    }
  ];
}

function generateVenues(city, template) {
  return [
    {
      name: `${template.venues[0].charAt(0).toUpperCase() + template.venues[0].slice(1)} ${city.name}`,
      type: template.venues[0],
      capacity: `${Math.floor(Math.random() * 100) + 150}`,
      priceRange: '$$$',
      highlight: `Espacio elegante con capacidad amplia y servicios completos en ${city.name}`
    },
    {
      name: `${template.venues[1].charAt(0).toUpperCase() + template.venues[1].slice(1)} Premium`,
      type: template.venues[1],
      capacity: `${Math.floor(Math.random() * 80) + 120}`,
      priceRange: '$$$$',
      highlight: 'Ambiente exclusivo con decoración personalizada y catering de alta gama'
    },
    {
      name: `${template.venues[2].charAt(0).toUpperCase() + template.venues[2].slice(1)} Elite`,
      type: template.venues[2],
      capacity: `${Math.floor(Math.random() * 60) + 100}`,
      priceRange: '$$$',
      highlight: 'Ubicación privilegiada con excelentes instalaciones y equipo profesional'
    }
  ];
}

function generateTimeline(country) {
  return {
    '12months': 'Definir presupuesto, fecha y lista preliminar. Reservar venue top',
    '10months': 'Contratar fotógrafo, música y catering. Probar menús',
    '8months': 'Buscar vestido/traje. Contratar florista y decorador',
    '6months': 'Enviar save the dates. Reservar hoteles para invitados',
    '4months': 'Enviar invitaciones formales. Confirmar todos los proveedores',
    '2months': 'Lista final confirmada. Hacer seating plan',
    '1month': 'Reunión final con proveedores. Prueba de vestido',
    '1week': 'Entregar seating plan. Confirmar horarios. Relajarse'
  };
}

// Script principal
console.log('🌍 Generando ciudades para todos los países...\n');

let citiesGenerated = 0;
const allCities = { ...existingCities };

masterList.countries.forEach(country => {
  console.log(`\n🇲🇽 Procesando ${country.name} (${country.cities.length} ciudades)...`);
  
  country.cities.forEach(city => {
    // Skip si ya existe
    if (allCities[city.slug]) {
      console.log(`  ⏭️  ${city.name} ya existe, saltando...`);
      return;
    }
    
    const cityData = generateCityContent(city, country);
    allCities[city.slug] = cityData;
    citiesGenerated++;
    console.log(`  ✅ ${city.name} generada`);
  });
});

// Guardar archivo actualizado
fs.writeFileSync(
  citiesPath,
  JSON.stringify(allCities, null, 2),
  'utf-8'
);

console.log(`\n🎉 ¡Generación completada!`);
console.log(`📊 Estadísticas:`);
console.log(`   - Ciudades generadas: ${citiesGenerated}`);
console.log(`   - Total ciudades: ${Object.keys(allCities).length}`);
console.log(`   - Páginas SEO totales: ${Object.keys(allCities).length * 7}`);
console.log(`\n✅ Archivo guardado en: ${citiesPath}`);
