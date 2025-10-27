const TRACKING_STATUS_VALUES = [
  'pendiente',
  'contactado',
  'en seguimiento',
  'seguimiento',
  'en negociación',
  'negociación',
  'en evaluación',
  'evaluando',
  'preconfirmado',
  'pre-confirmado',
  'por revisar',
  'por-revisar',
  'analizando',
  'exploracion',
  'exploración',
  'shortlist',
  'prospecto',
  'prospect',
  'por contactar',
  'por-contactar',
  'a revisar',
];

const CONFIRMED_STATUS_VALUES = [
  'confirmado',
  'confirmada',
  'seleccionado',
  'seleccionada',
  'contratado',
  'contratada',
  'firmado',
  'en firma',
  'en-firma',
  'firmando',
  'reservado',
  'reserva',
  'cerrado',
  'ganado',
  'closed won',
  'confirming',
];

const DISCARDED_STATUS_VALUES = [
  'rechazado',
  'rechazada',
  'descartado',
  'descartada',
  'cancelado',
  'cancelada',
  'perdido',
  'perdida',
  'lost',
];

const TRACKING_STATUS_SET = new Set(TRACKING_STATUS_VALUES.map((value) => value.toLowerCase()));
const CONFIRMED_STATUS_SET = new Set(CONFIRMED_STATUS_VALUES.map((value) => value.toLowerCase()));
const DISCARDED_STATUS_SET = new Set(DISCARDED_STATUS_VALUES.map((value) => value.toLowerCase()));

export const normalizeStatus = (status) => {
  if (!status) return '';
  return String(status).trim().toLowerCase();
};

const includesAnyKeyword = (value, keywords) => {
  if (!value) return false;
  for (const keyword of keywords) {
    if (value.includes(keyword)) return true;
  }
  return false;
};

export const isConfirmedStatus = (status) => {
  const normalized = normalizeStatus(status);
  if (!normalized) return false;
  if (CONFIRMED_STATUS_SET.has(normalized)) return true;
  return includesAnyKeyword(normalized, [
    'confirm',
    'firma',
    'contrat',
    'cerrad',
    'ganad',
    'reserva',
  ]);
};

export const isDiscardedStatus = (status) => {
  const normalized = normalizeStatus(status);
  if (!normalized) return false;
  if (DISCARDED_STATUS_SET.has(normalized)) return true;
  return includesAnyKeyword(normalized, ['rechaz', 'descart', 'cancel', 'perdid', 'lost']);
};

export const isTrackingStatus = (status) => {
  const normalized = normalizeStatus(status);
  if (!normalized) return true;
  if (isConfirmedStatus(normalized)) return false;
  if (isDiscardedStatus(normalized)) return false;
  if (TRACKING_STATUS_SET.has(normalized)) return true;
  return includesAnyKeyword(normalized, [
    'pend',
    'seguim',
    'negoci',
    'evalu',
    'prospect',
    'shortlist',
  ]);
};

