import { SUPPLIER_CATEGORIES } from '../../shared/supplierCategories';

/**
 * ⚡ DINÁMICO: Mapeo de alias generado desde SUPPLIER_CATEGORIES
 * Usa las keywords de cada categoría como alias automáticos
 */
const CATEGORY_ALIAS_MAP = new Map(
  SUPPLIER_CATEGORIES.map((cat) => [cat.id, [...cat.keywords, cat.name.toLowerCase()]])
);

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
