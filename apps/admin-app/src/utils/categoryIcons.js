/**
 * Iconos y colores para categorías de servicios de boda
 */

import {
  Camera,
  Video,
  Music,
  Disc,
  UtensilsCrossed,
  Home,
  Flower2,
  Palette,
  Shirt,
  Cake,
  Sparkles,
  Car,
  Gift,
  Heart,
  Users,
  MapPin,
  Gem,
  PartyPopper,
  Briefcase
} from 'lucide-react';

// Mapeo de categorías a iconos de Lucide
export const CATEGORY_ICONS = {
  fotografia: Camera,
  video: Video,
  musica: Music,
  dj: Disc,
  catering: UtensilsCrossed,
  lugares: Home,
  restaurantes: UtensilsCrossed,
  'flores-decoracion': Flower2,
  decoracion: Palette,
  'vestidos-trajes': Shirt,
  'tartas-de-boda': Cake,
  'detalles-de-boda': Gift,
  transporte: Car,
  joyeria: Gem,
  animacion: PartyPopper,
  'wedding-planner': Users,
  otros: Briefcase,
};

// Emojis alternativos (para compatibilidad)
export const CATEGORY_EMOJIS = {
  fotografia: '📸',
  video: '🎥',
  musica: '🎵',
  dj: '🎧',
  catering: '🍽️',
  lugares: '🏛️',
  restaurantes: '🍴',
  'flores-decoracion': '💐',
  decoracion: '🎨',
  'vestidos-trajes': '👗',
  'tartas-de-boda': '🍰',
  'detalles-de-boda': '🎁',
  transporte: '🚗',
  joyeria: '💍',
  animacion: '🎪',
  'wedding-planner': '📋',
  otros: '💼',
};

// Colores por categoría (para badges y estados)
export const CATEGORY_COLORS = {
  fotografia: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
  },
  video: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-800',
  },
  musica: {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200',
    badge: 'bg-pink-100 text-pink-800',
  },
  dj: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-800',
  },
  catering: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-800',
  },
  lugares: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-800',
  },
  restaurantes: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
  },
  'flores-decoracion': {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    badge: 'bg-rose-100 text-rose-800',
  },
  decoracion: {
    bg: 'bg-fuchsia-50',
    text: 'text-fuchsia-700',
    border: 'border-fuchsia-200',
    badge: 'bg-fuchsia-100 text-fuchsia-800',
  },
  'vestidos-trajes': {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    badge: 'bg-violet-100 text-violet-800',
  },
  'tartas-de-boda': {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-800',
  },
  'detalles-de-boda': {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    badge: 'bg-teal-100 text-teal-800',
  },
  transporte: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    badge: 'bg-cyan-100 text-cyan-800',
  },
  joyeria: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
  },
  animacion: {
    bg: 'bg-lime-50',
    text: 'text-lime-700',
    border: 'border-lime-200',
    badge: 'bg-lime-100 text-lime-800',
  },
  'wedding-planner': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  otros: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-800',
  },
};

/**
 * Obtiene el icono de Lucide para una categoría
 */
export const getCategoryIcon = (categoryId) => {
  return CATEGORY_ICONS[categoryId] || Briefcase;
};

/**
 * Obtiene el emoji para una categoría
 */
export const getCategoryEmoji = (categoryId) => {
  return CATEGORY_EMOJIS[categoryId] || '💼';
};

/**
 * Obtiene los colores para una categoría
 */
export const getCategoryColors = (categoryId) => {
  return CATEGORY_COLORS[categoryId] || CATEGORY_COLORS.otros;
};

/**
 * Obtiene el estado visual de un servicio
 */
export const getServiceStatus = (confirmed, hasShortlist, hasFavorites) => {
  if (confirmed) {
    return {
      label: 'Confirmado',
      color: 'green',
      icon: '✅',
      classes: 'bg-green-100 text-green-800 border-green-200'
    };
  }
  
  if (hasShortlist) {
    return {
      label: 'En proceso',
      color: 'yellow',
      icon: '🟡',
      classes: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
  }
  
  if (hasFavorites) {
    return {
      label: 'Con favoritos',
      color: 'blue',
      icon: '⭐',
      classes: 'bg-blue-100 text-blue-800 border-blue-200'
    };
  }
  
  return {
    label: 'Sin iniciar',
    color: 'gray',
    icon: '⚪',
    classes: 'bg-gray-100 text-gray-600 border-gray-200'
  };
};
