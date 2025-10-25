import { useTranslations } from '../../hooks/useTranslations';
export const EVENT_TYPE_OPTIONS = [
  {
  const { t } = useTranslations();
 value: 'boda', label: 'Boda' },
  { value: 'evento', label: 'Otro evento' },
];

export const EVENT_STYLE_OPTIONS = [
  { value: 'clasico', label: t('common.clasico') },
  { value: 'boho', label: 'Boho' },
  { value: 'moderno', label: 'Moderno' },
  { value: 'rustico', label: t('common.rustico') },
  { value: 'glam', label: 'Glam' },
  { value: 'minimal', label: 'Minimalista' },
];

export const GUEST_COUNT_OPTIONS = [
  { value: 'menos-50', label: 'Hasta 50 personas' },
  { value: '50-100', label: 'Entre 50 y 100 personas' },
  { value: '100-200', label: 'Entre 100 y 200 personas' },
  { value: '200-plus', label: t('common.mas_200_personas') },
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
  { value: 'simbolica', label: t('common.simbolica') },
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
