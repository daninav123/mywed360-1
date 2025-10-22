const CATEGORY_ALIAS_MAP = new Map([
  [
    'catering',
    ['banquete', 'comida', 'restauracion', 'restauración', 'menu', 'menú', 'meal', 'banqueteria'],
  ],
  ['photo', ['fotografia', 'fotografía', 'foto', 'photos', 'fotografos', 'fotógrafos']],
  ['video', ['video', 'vídeo', 'filmacion', 'filmación', 'videografo']],
  ['music', ['musica', 'música', 'dj', 'band', 'orquesta', 'sonido']],
  ['flowers', ['flores', 'floristeria', 'floristería', 'decor floral', 'floral']],
  ['venue', ['lugar', 'espacio', 'salon', 'salón', 'venue']],
  ['planner', ['wedding planner', 'planificador', 'coordinacion', 'coordinación']],
  ['beauty', ['maquillaje', 'peluqueria', 'peluquería', 'beauty', 'estética', 'estetica']],
  ['stationery', ['papeleria', 'papelería', 'invitaciones', 'invitacion', 'seatings']],
  ['lighting', ['luces', 'iluminacion', 'iluminación', 'sonido e iluminación']],
  ['transport', ['transporte', 'autobus', 'autobús', 'bus', 'coche']],
  ['cake', ['tarta', 'pastel', 'postre']],
  ['decor', ['decoracion', 'decoración', 'ambientacion', 'ambientación']],
]);

export const normalizeBudgetCategoryName = (value) => {
  if (!value) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase();
};

export const normalizeBudgetCategoryKey = (value) => {
  const normalized = normalizeBudgetCategoryName(value);
  if (!normalized) return '';
  for (const [key, aliases] of CATEGORY_ALIAS_MAP.entries()) {
    if (key === normalized) return key;
    if (aliases.includes(normalized)) return key;
  }
  return normalized;
};

export const computeGuestBucket = (guestCount, size = 50) => {
  const count = Number(guestCount) || 0;
  if (count <= 0) return '0-0';
  const start = Math.floor((count - 1) / size) * size + 1;
  const end = start + size - 1;
  return `${start}-${end}`;
};
