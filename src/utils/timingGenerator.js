// Utilidad para generar el Timing (bloques del día de la boda)
// a partir de respuestas del tutorial inicial.

/**
 * Suma minutos a una hora HH:MM devolviendo HH:MM
 * @param {string} hhmm - Hora base en formato HH:MM
 * @param {number} minutes - Minutos a sumar
 */
export function addMinutes(hhmm, minutes = 0) {
  try {
    const [h, m] = (hhmm || '00:00').split(':').map((x) => parseInt(x, 10));
    const base = new Date(1970, 0, 1, isNaN(h) ? 0 : h, isNaN(m) ? 0 : m);
    const out = new Date(base.getTime() + (minutes || 0) * 60 * 1000);
    const hh = String(out.getHours()).padStart(2, '0');
    const mm = String(out.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return hhmm || '00:00';
  }
}

/**
 * Genera los bloques de timing y un timeline resumen a partir de las respuestas.
 * @param {Object} answers
 * @param {boolean} answers.hasCeremony
 * @param {('civil'|'religiosa'|null)} [answers.ceremonyType]
 * @param {string} answers.ceremonyTime - HH:MM
 * @param {boolean} answers.hasCocktail
 * @param {number} answers.cocktailDuration - minutos
 * @param {boolean} answers.hasBanquet
 * @param {number} answers.banquetDuration - minutos
 * @param {boolean} answers.hasParty
 * @param {number} answers.partyDuration - minutos
 * @param {number} [answers.bufferMinutes] - transición entre bloques
 */
export function generateTimingFromAnswers(answers) {
  const {
    hasCeremony = true,
    ceremonyType = null,
    ceremonyTime = '17:00',
    hasCocktail = true,
    cocktailDuration = 90,
    hasBanquet = true,
    banquetDuration = 120,
    hasParty = true,
    partyDuration = 180,
    bufferMinutes = 15,
    differentLocations = false,
    transferMinutes = 0,
  } = answers || {};

  const blocks = [];
  let currentStart = ceremonyTime || '17:00';

  if (hasCeremony) {
    const ceremonyDur = ceremonyType === 'religiosa' ? 45 : 30; // heurística sencilla
    const ceremonyEnd = addMinutes(currentStart, ceremonyDur);
    blocks.push({
      id: 'ceremonia',
      name: 'Ceremonia',
      startTime: currentStart,
      endTime: ceremonyEnd,
      status: 'on-time',
      moments: [],
    });
    currentStart = addMinutes(ceremonyEnd, bufferMinutes);
  }

  if (hasCocktail) {
    // Añadir traslado si ceremonia y cóctel están en ubicaciones diferentes
    if (hasCeremony && differentLocations && Number.isFinite(transferMinutes) && transferMinutes > 0) {
      currentStart = addMinutes(currentStart, transferMinutes);
    }
    const end = addMinutes(currentStart, Number.isFinite(cocktailDuration) ? cocktailDuration : 90);
    blocks.push({
      id: 'coctel',
      name: 'Cóctel',
      startTime: currentStart,
      endTime: end,
      status: 'on-time',
      moments: [],
    });
    currentStart = addMinutes(end, bufferMinutes);
  }

  if (hasBanquet) {
    const end = addMinutes(currentStart, Number.isFinite(banquetDuration) ? banquetDuration : 120);
    blocks.push({
      id: 'banquete',
      name: 'Banquete',
      startTime: currentStart,
      endTime: end,
      status: 'on-time',
      moments: [],
    });
    currentStart = addMinutes(end, bufferMinutes);
  }

  if (hasParty) {
    const end = addMinutes(currentStart, Number.isFinite(partyDuration) ? partyDuration : 180);
    blocks.push({
      id: 'disco',
      name: 'Disco',
      startTime: currentStart,
      endTime: end,
      status: 'on-time',
      moments: [],
    });
    currentStart = end;
  }

  const timeline = blocks.map((b) => ({ label: b.name, time: b.startTime }));

  // Datos iniciales para Momentos Especiales según bloques incluidos (localStorage)
  const specialMomentsInit = {
    ...(hasCeremony
      ? {
          ceremonia: [
            { id: Date.now() + 1, order: 1, title: 'Entrada Novio', song: '' },
            { id: Date.now() + 2, order: 2, title: 'Entrada Novia', song: '' },
            { id: Date.now() + 3, order: 3, title: ceremonyType === 'religiosa' ? 'Lectura' : 'Votos', song: '' },
            { id: Date.now() + 4, order: 4, title: 'Intercambio de Anillos', song: '' },
            { id: Date.now() + 5, order: 5, title: 'Salida', song: '' },
          ],
        }
      : {}),
    ...(hasCocktail
      ? {
          coctail: [
            { id: Date.now() + 6, order: 1, title: 'Brindis de bienvenida', song: '' },
            { id: Date.now() + 7, order: 2, title: 'Fotos de grupo', song: '' },
          ],
        }
      : {}),
    ...(hasBanquet
      ? {
          banquete: [
            { id: Date.now() + 8, order: 1, title: 'Entrada Novios', song: '' },
            { id: Date.now() + 9, order: 2, title: 'Corte de tarta', song: '' },
            { id: Date.now() + 10, order: 3, title: 'Discursos', song: '' },
          ],
        }
      : {}),
    ...(hasParty
      ? {
          disco: [
            { id: Date.now() + 11, order: 1, title: 'Primer baile', song: '' },
            { id: Date.now() + 12, order: 2, title: 'Abrir pista', song: '' },
          ],
        }
      : {}),
  };

  return { blocks, timeline, specialMomentsInit };
}
