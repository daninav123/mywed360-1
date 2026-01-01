import citiesData from './cities.json';
import servicesData from './services.json';

/**
 * Obtiene datos de una ciudad por su slug
 * @param {string} citySlug - Slug de la ciudad (ej: "madrid")
 * @returns {Object|null} Datos de la ciudad o null si no existe
 */
export function getCityData(citySlug) {
  return citiesData[citySlug] || null;
}

/**
 * Obtiene datos de un servicio por su slug
 * @param {string} serviceSlug - Slug del servicio (ej: "gestion-invitados-boda")
 * @returns {Object|null} Datos del servicio o null si no existe
 */
export function getServiceData(serviceSlug) {
  return servicesData[serviceSlug] || null;
}

/**
 * Obtiene todas las ciudades de un país
 * @param {string} countryCode - Código del país (ej: "es", "mx")
 * @returns {Array} Array de objetos ciudad
 */
export function getCitiesByCountry(countryCode) {
  return Object.values(citiesData).filter(city => city.country === countryCode);
}

/**
 * Obtiene todas las ciudades
 * @returns {Array} Array de todas las ciudades
 */
export function getAllCities() {
  return Object.values(citiesData);
}

/**
 * Obtiene todos los servicios
 * @returns {Array} Array de todos los servicios
 */
export function getAllServices() {
  return Object.values(servicesData);
}

/**
 * Obtiene ciudades cercanas a una ciudad dada
 * @param {string} citySlug - Slug de la ciudad
 * @returns {Array} Array de ciudades cercanas
 */
export function getNearbyCities(citySlug) {
  const city = getCityData(citySlug);
  if (!city || !city.nearbyCities) return [];
  
  return city.nearbyCities
    .map(nearbySlug => getCityData(nearbySlug))
    .filter(Boolean);
}

/**
 * Obtiene servicios relacionados a un servicio dado
 * @param {string} serviceSlug - Slug del servicio
 * @returns {Array} Array de servicios relacionados
 */
export function getRelatedServices(serviceSlug) {
  const service = getServiceData(serviceSlug);
  if (!service || !service.relatedServices) return [];
  
  return service.relatedServices
    .map(relatedSlug => getServiceData(relatedSlug))
    .filter(Boolean);
}

/**
 * Verifica si existe una combinación ciudad + servicio
 * @param {string} citySlug - Slug de la ciudad
 * @param {string} serviceSlug - Slug del servicio
 * @returns {boolean} True si la combinación existe
 */
export function isValidCityService(citySlug, serviceSlug) {
  const city = getCityData(citySlug);
  const service = getServiceData(serviceSlug);
  
  if (!city || !service) return false;
  
  // Verificar si la ciudad tiene datos para ese servicio
  return city.services && city.services[serviceSlug];
}

/**
 * Obtiene estadísticas de una ciudad para un servicio específico
 * @param {string} citySlug - Slug de la ciudad
 * @param {string} serviceSlug - Slug del servicio
 * @returns {Object|null} Stats del servicio en esa ciudad
 */
export function getCityServiceStats(citySlug, serviceSlug) {
  const city = getCityData(citySlug);
  if (!city || !city.services || !city.services[serviceSlug]) return null;
  
  return city.services[serviceSlug];
}

/**
 * Genera schema.org LocalBusiness para SEO
 * @param {Object} city - Datos de la ciudad
 * @param {Object} service - Datos del servicio
 * @returns {Object} Schema.org JSON-LD
 */
export function generateLocalBusinessSchema(city, service) {
  const serviceStats = city.services[service.slug];
  
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Planivia ${service.name} ${city.name}`,
    "description": `${service.shortDesc} en ${city.name}. ${serviceStats?.vendorCount || 0} proveedores verificados.`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": city.name,
      "addressCountry": city.countryCode
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": city.lat,
      "longitude": city.lng
    },
    "priceRange": serviceStats?.priceRange || "€",
    "url": `https://planivia.net/${city.country}/${city.slug}/${service.slug}`
  };
}

/**
 * Genera título SEO dinámico
 * @param {Object} city - Datos de la ciudad
 * @param {Object} service - Datos del servicio
 * @returns {string} Título optimizado
 */
export function generateSEOTitle(city, service) {
  return `${service.name} en ${city.name} | Planivia`;
}

/**
 * Genera descripción SEO dinámica
 * @param {Object} city - Datos de la ciudad
 * @param {Object} service - Datos del servicio
 * @returns {string} Descripción optimizada
 */
export function generateSEODescription(city, service) {
  const serviceStats = city.services[service.slug];
  const vendorCount = serviceStats?.vendorCount || 0;
  const avgPrice = serviceStats?.avgPrice || serviceStats?.avgBudget || 'Consulta precios';
  
  return `${service.shortDesc} en ${city.name}. ${vendorCount} proveedores verificados. Precio medio: ${avgPrice}${city.currencySymbol}. Gratis hasta 80 invitados.`;
}

/**
 * Genera keywords SEO dinámicas
 * @param {Object} city - Datos de la ciudad
 * @param {Object} service - Datos del servicio
 * @returns {string} Keywords separadas por comas
 */
export function generateSEOKeywords(city, service) {
  const baseKeywords = [
    `${service.slug} ${city.slug}`,
    `${service.name.toLowerCase()} ${city.name.toLowerCase()}`,
    ...service.keywords.map(k => `${k} ${city.name.toLowerCase()}`)
  ];
  
  return baseKeywords.join(', ');
}

/**
 * Genera schema.org FAQPage para SEO
 * @param {Object} city - Datos de la ciudad
 * @param {Object} service - Datos del servicio
 * @returns {Object} Schema.org JSON-LD FAQPage
 */
export function generateFAQSchema(city, service) {
  if (!city.contentSections || !city.contentSections.faqs) return null;
  
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": city.contentSections.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

/**
 * Genera schema.org HowTo para el timeline de planificación
 * @param {Object} city - Datos de la ciudad
 * @param {Object} service - Datos del servicio
 * @returns {Object} Schema.org JSON-LD HowTo
 */
export function generateHowToSchema(city, service) {
  if (!city.contentSections || !city.contentSections.timeline) return null;
  
  const timeline = city.contentSections.timeline;
  const steps = Object.entries(timeline).map(([period, description], index) => ({
    "@type": "HowToStep",
    "position": index + 1,
    "name": period.replace('months', ' meses antes').replace('month', ' mes antes').replace('week', ' semana antes'),
    "text": description
  }));
  
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": `Cómo planificar tu boda en ${city.name} paso a paso`,
    "description": `Guía completa para organizar tu ${service.name.toLowerCase()} en ${city.name}. Timeline de 12 meses.`,
    "step": steps,
    "totalTime": "P12M"
  };
}

/**
 * Genera schema.org BreadcrumbList para navegación
 * @param {Object} city - Datos de la ciudad
 * @param {Object} service - Datos del servicio
 * @returns {Object} Schema.org JSON-LD BreadcrumbList
 */
export function generateBreadcrumbSchema(city, service) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": "https://planivia.net/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": city.countryName,
        "item": `https://planivia.net/${city.country}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": city.name,
        "item": `https://planivia.net/${city.country}/${city.slug}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": service.name,
        "item": `https://planivia.net/${city.country}/${city.slug}/${service.slug}`
      }
    ]
  };
}

/**
 * Genera schema.org Event para servicios de boda
 * @param {Object} city - Datos de la ciudad
 * @param {Object} service - Datos del servicio
 * @returns {Object} Schema.org JSON-LD Event
 */
export function generateEventSchema(city, service) {
  const serviceStats = city.services[service.slug];
  
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": `${service.name} en ${city.name}`,
    "description": `${service.shortDesc} en ${city.name}. Organiza tu boda perfecta con Planivia.`,
    "location": {
      "@type": "Place",
      "name": city.name,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": city.name,
        "addressCountry": city.countryName
      }
    },
    "offers": {
      "@type": "Offer",
      "url": `https://planivia.net/${city.country}/${city.slug}/${service.slug}`,
      "priceCurrency": city.currency,
      "price": serviceStats?.avgPrice || "0",
      "availability": "https://schema.org/InStock",
      "validFrom": new Date().toISOString().split('T')[0]
    },
    "organizer": {
      "@type": "Organization",
      "name": "Planivia",
      "url": "https://planivia.net"
    }
  };
}

/**
 * Genera schema.org Offer para servicios
 * @param {Object} city - Datos de la ciudad
 * @param {Object} service - Datos del servicio
 * @returns {Object} Schema.org JSON-LD Offer
 */
export function generateOfferSchema(city, service) {
  const serviceStats = city.services[service.slug];
  const priceRange = serviceStats?.priceRange || city.currencySymbol;
  
  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    "name": `${service.name} en ${city.name}`,
    "description": service.shortDesc,
    "url": `https://planivia.net/${city.country}/${city.slug}/${service.slug}`,
    "priceCurrency": city.currency,
    "price": serviceStats?.avgPrice || serviceStats?.avgBudget || "0",
    "priceRange": priceRange,
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "Planivia"
    },
    "itemOffered": {
      "@type": "Service",
      "name": service.name,
      "description": service.shortDesc
    }
  };
}

/**
 * Genera schema.org AggregateRating simulado para SEO
 * @param {Object} city - Datos de la ciudad
 * @param {Object} service - Datos del servicio
 * @returns {Object} Schema.org JSON-LD AggregateRating
 */
export function generateAggregateRatingSchema(city, service) {
  const serviceStats = city.services[service.slug];
  const reviewCount = serviceStats?.vendorCount || Math.floor(city.population / 5000) || 10;
  const rating = 4.5 + (Math.random() * 0.4);
  
  return {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    "ratingValue": rating.toFixed(1),
    "reviewCount": reviewCount,
    "bestRating": "5",
    "worstRating": "1"
  };
}

/**
 * Genera schema.org Organization para Planivia
 * @returns {Object} Schema.org JSON-LD Organization
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Planivia",
    "url": "https://planivia.net",
    "logo": "https://planivia.net/logo.png",
    "description": "Plataforma líder para organizar bodas. Gestiona invitados, presupuesto, seating plan y más. Gratis hasta 80 invitados.",
    "sameAs": [
      "https://www.facebook.com/planivia",
      "https://www.instagram.com/planivia",
      "https://twitter.com/planivia"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "hello@planivia.net",
      "availableLanguage": ["Spanish", "English"]
    }
  };
}
