import i18n from '../i18n';

const CATEGORY_ALIAS_MAP = new Map([
  [
    'catering',
    ['banquete', 'comida', 'restauracion', i18n.t('common.restauracion'), 'menu', 'menú', 'meal', 'banqueteria'],
  ],
  ['photo', ['fotografia', i18n.t('common.fotografia'), 'foto', 'photos', 'fotografos', i18n.t('common.fotografos')]],
  ['video', ['video', 'vídeo', 'filmacion', i18n.t('common.filmacion'), 'videografo']],
  ['music', ['musica', 'música', 'dj', 'band', 'orquesta', 'sonido']],
  ['flowers', ['flores', 'floristeria', i18n.t('common.floristeria'), 'decor floral', 'floral']],
  ['venue', ['lugar', 'espacio', 'salon', i18n.t('common.salon'), 'venue']],
  ['planner', ['wedding planner', 'planificador', 'coordinacion', i18n.t('common.coordinacion')]],
  ['beauty', ['maquillaje', 'peluqueria', i18n.t('common.peluqueria'), 'beauty', i18n.t('common.estetica'), 'estetica']],
  ['stationery', ['papeleria', i18n.t('common.papeleria'), 'invitaciones', 'invitacion', 'seatings']],
  ['lighting', ['luces', 'iluminacion', i18n.t('common.iluminacion'), i18n.t('common.sonido_iluminacion')]],
  ['transport', ['transporte', 'autobus', i18n.t('common.autobus'), 'bus', 'coche']],
  ['cake', ['tarta', 'pastel', 'postre']],
  ['decor', ['decoracion', i18n.t('common.decoracion'), 'ambientacion', i18n.t('common.ambientacion')]],
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
