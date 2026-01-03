/**
 * Servicio frontend para personalización de tareas con IA
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

/**
 * Personaliza la plantilla de tareas según el contexto de la boda
 * @param {Object} weddingContext - Contexto de la boda
 * @returns {Promise<Object>} Plantilla personalizada
 */
export async function personalizeTaskTemplate(weddingContext) {
  try {
    const response = await fetch(`${API_URL}/api/task-templates/personalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ weddingContext }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al personalizar plantilla');
    }

    const data = await response.json();
    return {
      success: true,
      template: data.template,
      personalized: data.personalized,
      usedAI: data.usedAI,
      analysis: data.analysis,
    };
  } catch (error) {
    console.error('[taskPersonalizationService] Error:', error);
    return {
      success: false,
      error: error.message,
      template: null,
      personalized: false,
      usedAI: false,
    };
  }
}

/**
 * Construye el contexto de la boda desde los datos del formulario
 * @param {Object} weddingData - Datos de la boda desde Firestore
 * @returns {Object} Contexto formateado para IA
 */
export function buildWeddingContext(weddingData) {
  if (!weddingData) {
    console.warn('[buildWeddingContext] No hay datos de boda, usando defaults');
    return getDefaultContext();
  }

  console.log('[buildWeddingContext] 🔍 Datos de entrada completos:', JSON.stringify(weddingData, null, 2));

  // IMPORTANTE: Los datos de Info Boda están en weddingData.weddingInfo
  const weddingInfo = weddingData.weddingInfo || {};
  
  console.log('[buildWeddingContext] 📋 weddingInfo extraído:', weddingInfo);

  const {
    eventProfile = {},
    preferences = {},
    weddingDate,
    eventDate,
    date,
    guestCount,
    estimatedGuests,
    location,
    banquetPlace,
    ceremonyPlace,
    eventType,
  } = weddingData;

  // Extraer datos de weddingInfo (Info Boda)
  const {
    ceremonyType: weddingInfoCeremonyType,
    weddingDate: weddingInfoDate,
    numGuests: weddingInfoNumGuests,
    weddingStyle: weddingInfoStyle,
    celebrationPlace,
    indoorOutdoor,
    manyChildren,
    guestsFromOutside,
    samePlaceCeremonyReception,
  } = weddingInfo;

  // Calcular lead time en meses (probar múltiples campos de fecha)
  let leadTimeMonths = 12; // default
  const dateValue = weddingInfoDate || weddingDate || eventDate || date;
  
  console.log('[buildWeddingContext] 📅 Fecha de boda encontrada:', dateValue);
  
  if (dateValue) {
    // Manejar Timestamp de Firestore
    let dateObj;
    if (dateValue?.toDate) {
      dateObj = dateValue.toDate();
    } else if (typeof dateValue === 'string') {
      dateObj = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      dateObj = dateValue;
    }

    if (dateObj && !isNaN(dateObj.getTime())) {
      const now = new Date();
      const diffTime = dateObj - now;
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
      leadTimeMonths = Math.max(1, Math.min(36, diffMonths));
    }
  }

  // Determinar tipo de ceremonia (PRIORIZAR weddingInfo)
  let ceremonyType = 'civil';
  
  const typeMap = {
    civil: 'civil',
    religiosa: 'religiosa',
    catolica: 'religiosa',
    simbolica: 'simbolica',
    destino: 'destino',
  };
  
  // PRIORIDAD 1: Desde weddingInfo (Info Boda)
  if (weddingInfoCeremonyType) {
    ceremonyType = typeMap[weddingInfoCeremonyType.toLowerCase()] || 'civil';
    console.log('[buildWeddingContext] ✅ Tipo ceremonia desde weddingInfo.ceremonyType:', ceremonyType);
  }
  // PRIORIDAD 2: Desde eventProfile.ceremonyType
  else if (eventProfile?.ceremonyType) {
    ceremonyType = typeMap[eventProfile.ceremonyType.toLowerCase()] || 'civil';
    console.log('[buildWeddingContext] Tipo ceremonia desde eventProfile:', ceremonyType);
  }
  // PRIORIDAD 3: Desde weddingData.ceremonyType directo
  else if (weddingData.ceremonyType) {
    ceremonyType = typeMap[weddingData.ceremonyType.toLowerCase()] || 'civil';
    console.log('[buildWeddingContext] Tipo ceremonia desde weddingData directo:', ceremonyType);
  }
  // PRIORIDAD 4: Inferir desde location
  else if (weddingData.location && weddingData.location.toLowerCase().includes('destino')) {
    ceremonyType = 'destino';
    console.log('[buildWeddingContext] Tipo ceremonia inferido desde location:', ceremonyType);
  }
  
  console.log('[buildWeddingContext] 🎯 Tipo ceremonia FINAL:', ceremonyType);

  // Determinar presupuesto (múltiples fuentes)
  let budget = 'medium';
  
  // Opción 1: Desde eventProfile.budget si existe
  if (eventProfile?.budget) {
    budget = eventProfile.budget;
  }
  // Opción 2: Aproximar desde número de invitados
  else {
    const guests = guestCount || estimatedGuests || 100;
    if (guests < 50) {
      budget = 'medium';
    } else if (guests < 150) {
      budget = 'medium';
    } else if (guests < 250) {
      budget = 'high';
    } else {
      budget = 'luxury';
    }
  }

  // Opción 3: Desde guestCountRange
  if (eventProfile?.guestCountRange) {
    const range = eventProfile.guestCountRange.toLowerCase();
    if (range.includes('íntima') || range.includes('pequeña') || range.includes('small')) {
      budget = 'medium';
    } else if (range.includes('grande') || range.includes('large')) {
      budget = 'high';
    } else if (range.includes('macro') || range.includes('masiva')) {
      budget = 'luxury';
    }
  }

  // Determinar número de invitados (PRIORIZAR weddingInfo.numGuests)
  let finalGuestCount = 100; // default
  
  if (weddingInfoNumGuests && weddingInfoNumGuests > 0) {
    finalGuestCount = parseInt(weddingInfoNumGuests);
    console.log('[buildWeddingContext] ✅ Invitados desde weddingInfo.numGuests:', finalGuestCount);
  } else if (guestCount && guestCount > 0) {
    finalGuestCount = guestCount;
    console.log('[buildWeddingContext] Invitados desde guestCount:', finalGuestCount);
  } else if (estimatedGuests && estimatedGuests > 0) {
    finalGuestCount = estimatedGuests;
    console.log('[buildWeddingContext] Invitados desde estimatedGuests:', finalGuestCount);
  } else if (weddingData.numGuests && weddingData.numGuests > 0) {
    finalGuestCount = weddingData.numGuests;
    console.log('[buildWeddingContext] Invitados desde weddingData.numGuests:', finalGuestCount);
  } else if (eventProfile?.guestCountRange) {
    const range = eventProfile.guestCountRange.toLowerCase();
    if (range.includes('íntima') || range.includes('pequeña')) finalGuestCount = 50;
    else if (range.includes('mediana')) finalGuestCount = 150;
    else if (range.includes('grande')) finalGuestCount = 250;
    console.log('[buildWeddingContext] Invitados desde guestCountRange:', finalGuestCount);
  }
  
  console.log('[buildWeddingContext] 🎯 Invitados FINAL:', finalGuestCount);

  // Determinar estilo (PRIORIZAR weddingInfo.weddingStyle)
  const style = weddingInfoStyle || 
    preferences?.style || 
    preferences?.theme || 
    eventProfile?.style || 
    'classic';
  
  console.log('[buildWeddingContext] 🎨 Estilo final:', style);

  // Determinar ubicación (local vs destino)
  let locationType = 'local';
  const locationStr = (location || banquetPlace || ceremonyPlace || '').toLowerCase();
  
  if (locationStr.includes('destino') || 
      ceremonyType === 'destino' ||
      eventProfile?.location === 'destino') {
    locationType = 'destino';
  }

  // Ciudad específica
  const city = celebrationPlace || weddingInfo.banquetPlace || location || banquetPlace || '';
  console.log('[buildWeddingContext] 🏙️ Ciudad:', city);

  // Fecha específica de la boda
  const specificWeddingDate = weddingInfoDate || weddingDate || eventDate || date || '';
  console.log('[buildWeddingContext] 📅 Fecha específica:', specificWeddingDate);

  // Tipo de espacio (interior/exterior)
  let venueType = 'mixto';
  if (indoorOutdoor) {
    const indoor = indoorOutdoor.toLowerCase();
    if (indoor.includes('interior')) venueType = 'interior';
    else if (indoor.includes('exterior')) venueType = 'exterior';
    else if (indoor.includes('jardin') || indoor.includes('finca')) venueType = 'jardin';
    else if (indoor.includes('playa')) venueType = 'playa';
  }
  console.log('[buildWeddingContext] 🏛️ Tipo de espacio:', venueType);

  // Información contextual
  const hasManyChildren = manyChildren || false;
  const hasGuestsFromOutside = guestsFromOutside || false;
  const samePlace = samePlaceCeremonyReception || false;

  // Wedding planner
  const hasPlanner = eventProfile?.hasPlanner || weddingData.hasPlanner || false;

  const context = {
    ceremonyType,
    budget,
    leadTimeMonths,
    guestCount: finalGuestCount,
    style,
    location: locationType,
    city: city,
    weddingDate: specificWeddingDate,
    venueType: venueType,
    manyChildren: hasManyChildren,
    guestsFromOutside: hasGuestsFromOutside,
    samePlaceCeremonyReception: samePlace,
    hasPlanner,
  };

  console.log('[buildWeddingContext] 🎯 CONTEXTO GENERADO FINAL:');
  console.log('  - Tipo ceremonia:', ceremonyType);
  console.log('  - Presupuesto:', budget);
  console.log('  - Meses hasta boda:', leadTimeMonths);
  console.log('  - Número invitados:', finalGuestCount);
  console.log('  - Estilo:', style);
  console.log('  - Ubicación tipo:', locationType);
  console.log('  - Ciudad/Lugar:', city);
  console.log('  - Fecha específica:', specificWeddingDate);
  console.log('  - Tipo espacio:', venueType);
  console.log('  - Muchos niños:', hasManyChildren);
  console.log('  - Invitados de fuera:', hasGuestsFromOutside);
  console.log('  - Mismo lugar:', samePlace);
  console.log('  - Tiene planner:', hasPlanner);

  return context;
}

/**
 * Contexto por defecto cuando no hay datos
 */
function getDefaultContext() {
  return {
    ceremonyType: 'civil',
    budget: 'medium',
    leadTimeMonths: 12,
    guestCount: 100,
    style: 'classic',
    location: 'local',
    hasPlanner: false,
  };
}

export default {
  personalizeTaskTemplate,
  buildWeddingContext,
};
