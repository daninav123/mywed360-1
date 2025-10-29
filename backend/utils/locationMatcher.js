/**
 * Utilidades para matching de ubicaciones con ámbito geográfico
 *
 * Jerarquía: Ciudad < Provincia < Comunidad Autónoma < País
 */

// Mapeo de provincias a comunidades autónomas
const PROVINCIAS_A_COMUNIDADES = {
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
 * Determina el nivel jerárquico de una ubicación
 * @returns {Object} { level: 'ciudad'|'provincia'|'comunidad'|'pais', normalized: string }
 */
function determineLocationLevel(location) {
  if (!location) {
    return { level: 'pais', normalized: 'españa' };
  }

  const normalized = normalizeText(location);

  // Nivel 1: País
  if (
    normalized === 'espana' ||
    normalized === 'españa' ||
    normalized === 'nacional' ||
    normalized === 'toda españa'
  ) {
    return { level: 'pais', normalized: 'españa' };
  }

  // Nivel 2: Comunidad Autónoma
  const comunidad = Object.values(PROVINCIAS_A_COMUNIDADES).find(
    (c) => normalizeText(c) === normalized
  );
  if (comunidad) {
    return { level: 'comunidad', normalized: normalizeText(comunidad) };
  }

  // Nivel 3: Provincia
  if (PROVINCIAS_A_COMUNIDADES[normalized]) {
    return { level: 'provincia', normalized };
  }

  // Nivel 4: Ciudad (si está en lista de ciudades principales)
  for (const [provincia, ciudades] of Object.entries(CIUDADES_PRINCIPALES)) {
    if (ciudades.some((ciudad) => normalizeText(ciudad) === normalized)) {
      return { level: 'ciudad', normalized, provincia };
    }
  }

  // Default: Asumir que es ciudad/localidad
  return { level: 'ciudad', normalized };
}

/**
 * Obtiene la comunidad autónoma de una provincia
 */
function getComunidadFromProvincia(provincia) {
  const normalized = normalizeText(provincia);
  return PROVINCIAS_A_COMUNIDADES[normalized] || null;
}

/**
 * Verifica si un proveedor puede trabajar en la ubicación solicitada
 *
 * @param {Object} supplier - Proveedor con estructura location: { city, province, serviceArea }
 * @param {string} searchLocation - Ubicación de búsqueda
 * @returns {boolean}
 */
function canSupplierWorkInLocation(supplier, searchLocation) {
  // Si no hay ubicación de búsqueda, mostrar todos
  if (!searchLocation) return true;

  const searchLevel = determineLocationLevel(searchLocation);

  // Determinar el ámbito del proveedor
  const supplierServiceArea = supplier.location?.serviceArea || supplier.serviceArea;

  // Si el proveedor define explícitamente su área de servicio
  if (supplierServiceArea) {
    const areaLevel = determineLocationLevel(supplierServiceArea);

    // Si el proveedor trabaja en toda España, acepta cualquier búsqueda
    if (areaLevel.level === 'pais') {
      return true;
    }

    // Si el proveedor trabaja en una comunidad
    if (areaLevel.level === 'comunidad') {
      // Aceptar si la búsqueda es en esa comunidad o cualquier provincia/ciudad de esa comunidad
      if (searchLevel.level === 'comunidad') {
        return areaLevel.normalized === searchLevel.normalized;
      }
      if (searchLevel.level === 'provincia' || searchLevel.level === 'ciudad') {
        const searchComunidad = getComunidadFromProvincia(searchLevel.normalized);
        return normalizeText(searchComunidad) === areaLevel.normalized;
      }
    }

    // Si el proveedor trabaja en una provincia
    if (areaLevel.level === 'provincia') {
      // Aceptar si la búsqueda es en esa provincia o una ciudad de esa provincia
      if (searchLevel.level === 'provincia') {
        return areaLevel.normalized === searchLevel.normalized;
      }
      if (searchLevel.level === 'ciudad') {
        return searchLevel.provincia === areaLevel.normalized;
      }
    }

    // Si el proveedor solo trabaja en una ciudad específica
    if (areaLevel.level === 'ciudad') {
      // Solo acepta búsquedas en esa ciudad exacta
      return areaLevel.normalized === searchLevel.normalized;
    }
  }

  // Fallback: Si no hay serviceArea, usar location.city y location.province
  const supplierCity = normalizeText(supplier.location?.city || '');
  const supplierProvince = normalizeText(supplier.location?.province || '');

  // Si el proveedor tiene provincia definida, asumir que trabaja en toda la provincia
  if (supplierProvince) {
    const provLevel = determineLocationLevel(supplierProvince);

    if (searchLevel.level === 'provincia') {
      return provLevel.normalized === searchLevel.normalized;
    }
    if (searchLevel.level === 'ciudad') {
      return (
        searchLevel.provincia === provLevel.normalized || supplierCity === searchLevel.normalized
      );
    }
    if (searchLevel.level === 'comunidad') {
      const supplierComunidad = getComunidadFromProvincia(supplierProvince);
      return normalizeText(supplierComunidad) === searchLevel.normalized;
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
  getComunidadFromProvincia,
  canSupplierWorkInLocation,
  filterSuppliersByLocation,
  PROVINCIAS_A_COMUNIDADES,
  CIUDADES_PRINCIPALES,
};
