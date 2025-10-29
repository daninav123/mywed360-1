/**
 * Utilidades para matching de ubicaciones con ámbito geográfico MUNDIAL
 *
 * Jerarquía: Ciudad < Estado/Provincia/Región < País < Continental < Global
 *
 * Usa librería country-state-city con datos de:
 * - 250+ países
 * - 5000+ estados/provincias
 * - 150000+ ciudades
 */

import { Country, State, City } from 'country-state-city';

// Cache para mejorar performance
const locationCache = new Map();

// Mapeo de regiones españolas (para retrocompatibilidad)
const PROVINCIAS_A_COMUNIDADES_ES = {
  // Comunidad Valenciana
  valencia: 'comunidad valenciana',
  alicante: 'comunidad valenciana',
  castellon: 'comunidad valenciana',
  castellón: 'comunidad valenciana',

  // Cataluña
  barcelona: 'cataluña',
  girona: 'cataluña',
  lleida: 'cataluña',
  tarragona: 'cataluña',

  // Andalucía
  sevilla: 'andalucía',
  málaga: 'andalucía',
  malaga: 'andalucía',
  granada: 'andalucía',
  córdoba: 'andalucía',
  cordoba: 'andalucía',
  cádiz: 'andalucía',
  cadiz: 'andalucía',
  huelva: 'andalucía',
  jaén: 'andalucía',
  jaen: 'andalucía',
  almería: 'andalucía',
  almeria: 'andalucía',

  // Madrid
  madrid: 'comunidad de madrid',

  // País Vasco
  vizcaya: 'país vasco',
  bizkaia: 'país vasco',
  guipúzcoa: 'país vasco',
  gipuzkoa: 'país vasco',
  álava: 'país vasco',
  araba: 'país vasco',

  // Galicia
  'a coruña': 'galicia',
  coruña: 'galicia',
  lugo: 'galicia',
  ourense: 'galicia',
  pontevedra: 'galicia',

  // Otras
  asturias: 'principado de asturias',
  cantabria: 'cantabria',
  'la rioja': 'la rioja',
  navarra: 'comunidad foral de navarra',
  aragón: 'aragón',
  aragon: 'aragón',
  zaragoza: 'aragón',
  huesca: 'aragón',
  teruel: 'aragón',
  'castilla y león': 'castilla y león',
  'castilla-la mancha': 'castilla-la mancha',
  extremadura: 'extremadura',
  murcia: 'región de murcia',
  baleares: 'islas baleares',
  canarias: 'islas canarias',
};

// Ciudades principales de cada provincia (para diferenciar ciudad vs provincia)
const CIUDADES_PRINCIPALES = {
  valencia: ['valencia', 'torrent', 'paterna', 'burjassot', 'mislata', 'xirivella'],
  alicante: ['alicante', 'elche', 'torrevieja', 'orihuela', 'benidorm'],
  castellon: ['castellón', 'castellon', 'vila-real', 'burriana'],
  barcelona: ['barcelona', 'hospitalet', 'badalona', 'terrassa', 'sabadell'],
  madrid: ['madrid', 'móstoles', 'alcalá de henares', 'fuenlabrada'],
  sevilla: ['sevilla', 'dos hermanas', 'alcalá de guadaíra'],
};

/**
 * Normaliza texto para comparación
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .trim();
}

/**
 * Busca un país por nombre (con normalización)
 */
function findCountry(locationName) {
  const normalized = normalizeText(locationName);
  const cacheKey = `country:${normalized}`;

  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey);
  }

  const country = Country.getAllCountries().find(
    (c) =>
      normalizeText(c.name) === normalized ||
      normalizeText(c.isoCode) === normalized ||
      c.name.toLowerCase() === locationName.toLowerCase()
  );

  locationCache.set(cacheKey, country || null);
  return country || null;
}

/**
 * Busca un estado/provincia por nombre (con normalización)
 */
function findState(locationName, countryCode = null) {
  const normalized = normalizeText(locationName);
  const cacheKey = `state:${countryCode || 'any'}:${normalized}`;

  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey);
  }

  let states = countryCode ? State.getStatesOfCountry(countryCode) : State.getAllStates();

  const state = states.find(
    (s) =>
      normalizeText(s.name) === normalized ||
      normalizeText(s.isoCode) === normalized ||
      s.name.toLowerCase() === locationName.toLowerCase()
  );

  locationCache.set(cacheKey, state || null);
  return state || null;
}

/**
 * Busca una ciudad por nombre
 */
function findCity(locationName, countryCode = null, stateCode = null) {
  const normalized = normalizeText(locationName);
  const cacheKey = `city:${countryCode || 'any'}:${stateCode || 'any'}:${normalized}`;

  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey);
  }

  let cities;
  if (stateCode && countryCode) {
    cities = City.getCitiesOfState(countryCode, stateCode);
  } else if (countryCode) {
    cities = City.getCitiesOfCountry(countryCode);
  } else {
    // Buscar en España por defecto si no se especifica país
    cities = City.getCitiesOfCountry('ES');
  }

  const city = cities?.find(
    (c) =>
      normalizeText(c.name) === normalized || c.name.toLowerCase() === locationName.toLowerCase()
  );

  locationCache.set(cacheKey, city || null);
  return city || null;
}

/**
 * Determina el nivel jerárquico de una ubicación MUNDIAL
 * @returns {Object} { level, normalized, countryCode, stateCode }
 */
function determineLocationLevel(location) {
  if (!location) {
    return { level: 'global', normalized: 'global' };
  }

  const normalized = normalizeText(location);

  // Palabras clave globales/continentales
  if (['global', 'mundial', 'international', 'worldwide'].includes(normalized)) {
    return { level: 'global', normalized: 'global' };
  }

  // Continentes
  const continents = ['europa', 'europe', 'asia', 'africa', 'america', 'oceania', 'antartica'];
  if (continents.includes(normalized)) {
    return { level: 'continental', normalized };
  }

  // 1. Buscar como país
  const country = findCountry(location);
  if (country) {
    return {
      level: 'pais',
      normalized: normalizeText(country.name),
      countryCode: country.isoCode,
      countryName: country.name,
    };
  }

  // 2. Buscar como estado/provincia (primero en España, luego global)
  let state = findState(location, 'ES'); // España por defecto
  if (!state) {
    state = findState(location); // Buscar globalmente
  }

  if (state) {
    return {
      level: 'estado',
      normalized: normalizeText(state.name),
      stateCode: state.isoCode,
      stateName: state.name,
      countryCode: state.countryCode,
    };
  }

  // 3. Buscar como ciudad (primero en España)
  let city = findCity(location, 'ES');
  if (!city) {
    city = findCity(location); // Buscar globalmente
  }

  if (city) {
    return {
      level: 'ciudad',
      normalized: normalizeText(city.name),
      cityName: city.name,
      stateCode: city.stateCode,
      countryCode: city.countryCode,
    };
  }

  // 4. Fallback: Buscar en mapeo manual español (retrocompatibilidad)
  const comunidad = Object.values(PROVINCIAS_A_COMUNIDADES_ES).find(
    (c) => normalizeText(c) === normalized
  );
  if (comunidad) {
    return { level: 'comunidad', normalized: normalizeText(comunidad), countryCode: 'ES' };
  }

  if (PROVINCIAS_A_COMUNIDADES_ES[normalized]) {
    return { level: 'provincia', normalized, countryCode: 'ES' };
  }

  // Default: Ciudad desconocida
  return { level: 'ciudad', normalized };
}

/**
 * Verifica si un proveedor puede trabajar en la ubicación solicitada MUNDIAL
 *
 * @param {Object} supplier - Proveedor con estructura location: { city, province, country, serviceArea }
 * @param {string} searchLocation - Ubicación de búsqueda
 * @returns {boolean}
 */
function canSupplierWorkInLocation(supplier, searchLocation) {
  // Si no hay ubicación de búsqueda, mostrar todos
  if (!searchLocation) return true;

  const searchLevel = determineLocationLevel(searchLocation);

  // Si es global/continental, mostrar todos
  if (searchLevel.level === 'global' || searchLevel.level === 'continental') {
    return true;
  }

  // Determinar el ámbito del proveedor
  const supplierServiceArea = supplier.location?.serviceArea || supplier.serviceArea;

  // Si el proveedor define explícitamente su área de servicio
  if (supplierServiceArea) {
    const areaLevel = determineLocationLevel(supplierServiceArea);

    // Jerarquía: global > continental > país > estado > ciudad

    // Si el proveedor trabaja globalmente, acepta cualquier búsqueda
    if (areaLevel.level === 'global' || areaLevel.level === 'continental') {
      return true;
    }

    // Si el proveedor trabaja en un país
    if (areaLevel.level === 'pais') {
      // Acepta búsquedas en ese país o cualquier estado/ciudad de ese país
      if (searchLevel.level === 'pais') {
        return areaLevel.countryCode === searchLevel.countryCode;
      }
      if (searchLevel.level === 'estado' || searchLevel.level === 'ciudad') {
        return areaLevel.countryCode === searchLevel.countryCode;
      }
      // Fallback: comparar nombres normalizados
      return areaLevel.normalized === searchLevel.normalized;
    }

    // Si el proveedor trabaja en un estado/provincia
    if (
      areaLevel.level === 'estado' ||
      areaLevel.level === 'provincia' ||
      areaLevel.level === 'comunidad'
    ) {
      // Acepta búsquedas en ese estado o ciudades de ese estado
      if (
        searchLevel.level === 'estado' ||
        searchLevel.level === 'provincia' ||
        searchLevel.level === 'comunidad'
      ) {
        // Comparar por código si disponible
        if (areaLevel.stateCode && searchLevel.stateCode) {
          return areaLevel.stateCode === searchLevel.stateCode;
        }
        // Fallback: comparar nombres
        return areaLevel.normalized === searchLevel.normalized;
      }
      if (searchLevel.level === 'ciudad') {
        // La ciudad debe estar en el mismo estado
        if (areaLevel.stateCode && searchLevel.stateCode) {
          return areaLevel.stateCode === searchLevel.stateCode;
        }
        // Fallback manual para España
        if (areaLevel.countryCode === 'ES' && searchLevel.countryCode === 'ES') {
          const searchEstado = PROVINCIAS_A_COMUNIDADES_ES[searchLevel.normalized];
          if (searchEstado) {
            return normalizeText(searchEstado) === areaLevel.normalized;
          }
        }
      }
    }

    // Si el proveedor solo trabaja en una ciudad específica
    if (areaLevel.level === 'ciudad') {
      // Solo acepta búsquedas en esa ciudad exacta
      return areaLevel.normalized === searchLevel.normalized;
    }
  }

  // Fallback: Si no hay serviceArea, inferir desde location
  const supplierCity = normalizeText(supplier.location?.city || '');
  const supplierState = normalizeText(
    supplier.location?.province || supplier.location?.state || ''
  );
  const supplierCountry = supplier.location?.country || supplier.location?.countryCode;

  // Si tiene país, intentar match por país
  if (supplierCountry) {
    const supplierCountryLevel = determineLocationLevel(supplierCountry);
    if (searchLevel.level === 'pais') {
      if (supplierCountryLevel.countryCode && searchLevel.countryCode) {
        return supplierCountryLevel.countryCode === searchLevel.countryCode;
      }
    }
    // Si la búsqueda es en ese país (implícito)
    if (supplierCountryLevel.countryCode === searchLevel.countryCode) {
      // Continuar con lógica de estado/ciudad
    } else {
      return false; // País diferente
    }
  }

  // Si el proveedor tiene estado/provincia definido, asumir que trabaja en todo el estado
  if (supplierState) {
    const stateLevel = determineLocationLevel(supplierState);

    if (searchLevel.level === 'estado' || searchLevel.level === 'provincia') {
      return stateLevel.normalized === searchLevel.normalized;
    }
    if (searchLevel.level === 'ciudad') {
      // Verificar si la ciudad está en ese estado
      if (stateLevel.stateCode && searchLevel.stateCode) {
        return stateLevel.stateCode === searchLevel.stateCode;
      }
      // Fallback: ciudad coincide o ciudad está en el mismo estado
      return (
        supplierCity === searchLevel.normalized || stateLevel.normalized === searchLevel.normalized
      );
    }
  }

  // Si solo tiene city, coincidencia exacta
  if (supplierCity) {
    return supplierCity === searchLevel.normalized;
  }

  // Si no tiene ubicación definida, asumir que trabaja en cualquier sitio
  return true;
}

/**
 * Filtra una lista de proveedores por ubicación
 */
function filterSuppliersByLocation(suppliers, searchLocation) {
  if (!searchLocation) return suppliers;

  const normalized = normalizeText(searchLocation);

  // Ubicaciones neutrales (nacional) → no filtrar
  const NEUTRAL_LOCATIONS = ['espana', 'españa', 'nacional', 'toda españa'];
  if (NEUTRAL_LOCATIONS.includes(normalized)) {
    return suppliers;
  }

  return suppliers.filter((supplier) => canSupplierWorkInLocation(supplier, searchLocation));
}

export {
  normalizeText,
  determineLocationLevel,
  canSupplierWorkInLocation,
  filterSuppliersByLocation,
  findCountry,
  findState,
  findCity,
  PROVINCIAS_A_COMUNIDADES_ES,
  CIUDADES_PRINCIPALES,
};
