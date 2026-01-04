/**
 * Finance Service - PostgreSQL Version
 * Solo constantes (métodos Firebase deprecados, usar useFinance hook)
 */

import { SUPPLIER_CATEGORIES } from '../shared/supplierCategories';

// Iconos para categorías
const CATEGORY_ICONS = {
  lugares: '🏛️',
  restaurantes: '🏛️',
  catering: '🍽️',
  fotografia: '📸',
  video: '🎥',
  musica: '🎵',
  dj: '🎵',
  decoracion: '🌸',
  'flores-decoracion': '🌸',
  'vestidos-trajes': '👗',
  belleza: '💅',
  invitaciones: '✉️',
  transporte: '🚗',
  'luna-de-miel': '🏨',
  tartas: '🎂',
  joyeria: '💍',
  animacion: '🎉',
  'fuegos-artificiales': '🎆',
  organizacion: '📋',
  ceremonia: '⛪',
  detalles: '🎁',
  otros: '💰',
};

// Colores para categorías
const CATEGORY_COLORS = {
  lugares: '#3B82F6',
  restaurantes: '#3B82F6',
  catering: '#10B981',
  fotografia: '#8B5CF6',
  video: '#8B5CF6',
  musica: '#F59E0B',
  dj: '#F59E0B',
  decoracion: '#EC4899',
  'flores-decoracion': '#EC4899',
  'vestidos-trajes': '#6366F1',
  belleza: '#6366F1',
  invitaciones: '#14B8A6',
  transporte: '#EF4444',
  'luna-de-miel': '#F97316',
  tartas: '#F59E0B',
  joyeria: '#6366F1',
  animacion: '#F59E0B',
  'fuegos-artificiales': '#EF4444',
  organizacion: '#14B8A6',
  ceremonia: '#8B5CF6',
  detalles: '#14B8A6',
  otros: '#6B7280',
};

// Categorías de gastos generadas desde SUPPLIER_CATEGORIES
export const EXPENSE_CATEGORIES = SUPPLIER_CATEGORIES.reduce((acc, cat) => {
  const key = cat.id.toUpperCase().replace(/-/g, '_');
  acc[key] = {
    id: cat.id,
    name: cat.name,
    icon: CATEGORY_ICONS[cat.id] || '💰',
    color: CATEGORY_COLORS[cat.id] || '#6B7280',
  };
  return acc;
}, {});

// Estados de pago
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PARTIAL: 'partial',
  OVERDUE: 'overdue',
};

// Stub para compatibilidad - Usar useFinance hook en su lugar
const financeService = {
  getBudget: () => {
    console.warn('[financeService] Usar useFinance hook en lugar de financeService');
    return Promise.resolve(null);
  },
  saveBudget: () => {
    console.warn('[financeService] Usar useFinance hook en lugar de financeService');
    return Promise.resolve(null);
  },
  getExpenses: () => {
    console.warn('[financeService] Usar useFinance hook en lugar de financeService');
    return Promise.resolve([]);
  },
};

export default financeService;

// Stub para compatibilidad
export function useFinance(weddingId) {
  console.warn('[financeService] Usar useFinance hook de /hooks/useFinance.js');
  return {
    budget: null,
    expenses: [],
    stats: null,
    isLoading: false,
    error: null,
  };
}
