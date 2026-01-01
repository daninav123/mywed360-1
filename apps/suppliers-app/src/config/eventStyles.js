export const getEventTypeOptions = (t) => [
  { value: 'boda', label: t('eventType.wedding') },
  { value: 'evento', label: t('eventType.other') },
];

export const getEventStyleOptions = (t) => [
  { value: 'clasico', label: t('eventStyles.classic') },
  { value: 'boho', label: t('eventStyles.boho') },
  { value: 'moderno', label: t('eventStyles.modern') },
  { value: 'rustico', label: t('eventStyles.rustic') },
  { value: 'glam', label: t('eventStyles.glam') },
  { value: 'minimal', label: t('eventStyles.minimal') },
  { value: 'aire-libre', label: t('eventStyles.outdoor') },
  { value: 'playa', label: t('eventStyles.beach') },
  { value: 'jardin', label: t('eventStyles.garden') },
  { value: 'vintage', label: t('eventStyles.vintage') },
  { value: 'industrial', label: t('eventStyles.industrial') },
  { value: 'romantico', label: t('eventStyles.romantic') },
  { value: 'tropical', label: t('eventStyles.tropical') },
  { value: 'destino', label: t('eventStyles.destination') },
  { value: 'intimo', label: t('eventStyles.intimate') },
  { value: 'campestre', label: t('eventStyles.countryside') },
];

export const getGuestCountOptions = (t) => [
  { value: 'menos-50', label: t('guestCount.upTo50') },
  { value: '50-100', label: t('guestCount.50to100') },
  { value: '100-200', label: t('guestCount.100to200') },
  { value: '200-plus', label: t('guestCount.over200') },
];

export const getFormalityOptions = (t) => [
  { value: 'casual', label: t('formality.casual') },
  { value: 'semi-formal', label: t('formality.semiFormal') },
  { value: 'formal', label: t('formality.formal') },
  { value: 'black-tie', label: t('formality.blackTie') },
];

export const getCeremonyTypeOptions = (t) => [
  { value: 'civil', label: t('ceremonyType.civil') },
  { value: 'religiosa', label: t('ceremonyType.religious') },
  { value: 'simbolica', label: t('ceremonyType.symbolic') },
  { value: 'otro', label: t('ceremonyType.other') },
];

export const getRelatedEventOptions = (t) => [
  { value: 'preboda', label: t('relatedEvents.preWedding') },
  { value: 'despedida', label: t('relatedEvents.bachelorParty') },
  { value: 'brunch', label: t('relatedEvents.postWeddingBrunch') },
  { value: 'luna-miel', label: t('relatedEvents.honeymoon') },
  { value: 'otro', label: t('relatedEvents.other') },
];

// Backwards compatibility - export constants for components that haven't migrated yet
export const EVENT_TYPE_OPTIONS = [
  { value: 'boda', label: 'Boda' },
  { value: 'evento', label: 'Otro evento' },
];

export const EVENT_STYLE_OPTIONS = [
  { value: 'clasico', label: 'Clásico' },
  { value: 'boho', label: 'Boho' },
  { value: 'moderno', label: 'Moderno' },
  { value: 'rustico', label: 'Rústico' },
  { value: 'glam', label: 'Glam' },
  { value: 'minimal', label: 'Minimalista' },
  { value: 'aire-libre', label: 'Al aire libre' },
  { value: 'playa', label: 'Playa' },
  { value: 'jardin', label: 'Jardín' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'romantico', label: 'Romántico' },
  { value: 'tropical', label: 'Tropical' },
  { value: 'destino', label: 'Destino' },
  { value: 'intimo', label: 'Íntimo' },
  { value: 'campestre', label: 'Campestre' },
];

export const GUEST_COUNT_OPTIONS = [
  { value: 'menos-50', label: 'Hasta 50 personas' },
  { value: '50-100', label: 'Entre 50 y 100 personas' },
  { value: '100-200', label: 'Entre 100 y 200 personas' },
  { value: '200-plus', label: 'Más de 200 personas' },
];

export const FORMALITY_OPTIONS = [
  { value: 'casual', label: 'Casual' },
  { value: 'semi-formal', label: 'Semi formal' },
  { value: 'formal', label: 'Formal' },
  { value: 'black-tie', label: 'Etiqueta / Black tie' },
];

export const CEREMONY_TYPE_OPTIONS = [
  { value: 'civil', label: 'Civil' },
  { value: 'religiosa', label: 'Religiosa' },
  { value: 'simbolica', label: 'Simbólica' },
  { value: 'otro', label: 'Otra / Personalizada' },
];

export const RELATED_EVENT_OPTIONS = [
  { value: 'preboda', label: 'Evento preboda' },
  { value: 'despedida', label: 'Despedida (ellas / ellos)' },
  { value: 'brunch', label: 'Brunch postboda' },
  { value: 'luna-miel', label: 'Luna de miel' },
  { value: 'otro', label: 'Otro' },
];

export const EVENT_TYPE_LABELS = EVENT_TYPE_OPTIONS.reduce((map, option) => {
  map[option.value] = option.label;
  return map;
}, {});

export const DEFAULT_EVENT_TYPE = EVENT_TYPE_OPTIONS[0].value;
export const DEFAULT_STYLE = EVENT_STYLE_OPTIONS[0].value;
export const DEFAULT_GUEST_COUNT = GUEST_COUNT_OPTIONS[1].value;
export const DEFAULT_FORMALITY = FORMALITY_OPTIONS[1].value;
export const DEFAULT_CEREMONY_TYPE = CEREMONY_TYPE_OPTIONS[0].value;
