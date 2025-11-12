/**
 * Export Wizard Constants
 * Constantes y configuraciones para el wizard de exportación
 */

import {
  FileText,
  FileImage,
  FileSpreadsheet,
  Code,
  Monitor,
  Palette,
  Settings,
  Eye,
  Download,
} from 'lucide-react';

// Formatos disponibles para exportación
export const EXPORT_FORMATS = {
  pdf: {
    id: 'pdf',
    name: 'PDF',
    description: 'Documento portable ideal para imprimir',
    icon: FileText,
    color: '#DC2626',
    extensions: ['.pdf'],
    features: ['Vectorial', 'Imprimible', 'Multipage'],
    sizes: ['A4', 'A3', 'Letter', 'Legal', 'A2'],
    defaultOrientation: 'landscape',
  },
  png: {
    id: 'png',
    name: 'PNG',
    description: 'Imagen de alta calidad con transparencia',
    icon: FileImage,
    color: '#10B981',
    extensions: ['.png'],
    features: ['Alta calidad', 'Transparencia', 'Web-ready'],
    resolutions: [
      { label: 'SD (720p)', value: 720, width: 1280, height: 720 },
      { label: 'HD (1080p)', value: 1080, width: 1920, height: 1080 },
      { label: '2K', value: 1440, width: 2560, height: 1440 },
      { label: '4K', value: 2160, width: 3840, height: 2160 },
      { label: 'Personalizado', value: 'custom', width: null, height: null },
    ],
  },
  svg: {
    id: 'svg',
    name: 'SVG',
    description: 'Formato vectorial escalable',
    icon: Code,
    color: '#8B5CF6',
    extensions: ['.svg'],
    features: ['Vectorial', 'Editable', 'Escalable'],
  },
  excel: {
    id: 'excel',
    name: 'Excel / CSV',
    description: 'Lista de invitados y asignaciones',
    icon: FileSpreadsheet,
    color: '#059669',
    extensions: ['.xlsx', '.csv'],
    features: ['Datos estructurados', 'Filtrable', 'Editable'],
    includeStats: true,
  },
  print: {
    id: 'print',
    name: 'Imprimir',
    description: 'Enviar directamente a la impresora',
    icon: Monitor,
    color: '#F59E0B',
    features: ['Directo', 'Configuración de impresora'],
  },
};

// Templates de estilo predefinidos
export const STYLE_TEMPLATES = {
  minimal: {
    id: 'minimal',
    name: 'Minimalista',
    preview: '⚪',
    colors: {
      primary: '#000000',
      secondary: '#666666',
      background: '#FFFFFF',
      accent: '#E5E7EB',
      text: '#111827',
    },
    font: 'Inter, sans-serif',
    fontSize: 14,
    showGrid: false,
    showNumbers: true,
    showNames: true,
    showLogo: false,
    borderWidth: 1,
    borderStyle: 'solid',
  },
  elegant: {
    id: 'elegant',
    name: 'Elegante',
    preview: '🥂',
    colors: {
      primary: '#1F2937',
      secondary: '#6B7280',
      background: '#FAFAFA',
      accent: '#D4AF37',
      text: '#111827',
    },
    font: 'Georgia, serif',
    fontSize: 16,
    showGrid: true,
    showNumbers: true,
    showNames: true,
    showLogo: true,
    borderWidth: 2,
    borderStyle: 'double',
  },
  colorful: {
    id: 'colorful',
    name: 'Colorido',
    preview: '🎨',
    colors: {
      primary: '#6366F1',
      secondary: '#EC4899',
      background: '#FEF3C7',
      accent: '#F59E0B',
      text: '#1F2937',
    },
    font: 'Poppins, sans-serif',
    fontSize: 15,
    showGrid: true,
    showNumbers: true,
    showNames: true,
    showLogo: true,
    borderWidth: 3,
    borderStyle: 'solid',
  },
  dark: {
    id: 'dark',
    name: 'Oscuro',
    preview: '🌙',
    colors: {
      primary: '#F9FAFB',
      secondary: '#9CA3AF',
      background: '#111827',
      accent: '#6366F1',
      text: '#F9FAFB',
    },
    font: 'Roboto, sans-serif',
    fontSize: 14,
    showGrid: true,
    showNumbers: false,
    showNames: true,
    showLogo: false,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  romantic: {
    id: 'romantic',
    name: 'Romántico',
    preview: '💕',
    colors: {
      primary: '#EC4899',
      secondary: '#F9A8D4',
      background: '#FDF2F8',
      accent: '#BE185D',
      text: '#831843',
    },
    font: 'Playfair Display, serif',
    fontSize: 16,
    showGrid: false,
    showNumbers: true,
    showNames: true,
    showLogo: true,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  rustic: {
    id: 'rustic',
    name: 'Rústico',
    preview: '🌿',
    colors: {
      primary: '#78716C',
      secondary: '#A8A29E',
      background: '#F5F5F4',
      accent: '#059669',
      text: '#292524',
    },
    font: 'Merriweather, serif',
    fontSize: 15,
    showGrid: false,
    showNumbers: true,
    showNames: true,
    showLogo: false,
    borderWidth: 4,
    borderStyle: 'solid',
  },
};

// Pasos del wizard
export const WIZARD_STEPS = [
  { id: 'format', label: 'Formato', icon: FileText },
  { id: 'style', label: 'Estilo', icon: Palette },
  { id: 'content', label: 'Contenido', icon: Settings },
  { id: 'preview', label: 'Vista Previa', icon: Eye },
  { id: 'export', label: 'Exportar', icon: Download },
];

// Opciones de contenido por defecto
export const DEFAULT_EXPORT_OPTIONS = {
  // Formato y layout
  orientation: 'landscape',
  size: 'A4',
  resolution: 1080,
  scale: 2,
  quality: 0.95,

  // Elementos a incluir
  includeNames: true,
  includeNumbers: true,
  includeGrid: false,
  includeLegend: true,
  includeTitle: true,
  includeDate: true,
  includeStats: true,
  includeWatermark: false,

  // Textos
  title: 'Distribución de Invitados',
  subtitle: new Date().toLocaleDateString(),
  watermark: '',

  // Logo
  logo: null,
  logoPosition: 'top-left',
  logoSize: 40,

  // Márgenes (en pixels)
  margins: {
    top: 40,
    right: 40,
    bottom: 40,
    left: 40,
  },

  // Opciones avanzadas
  separatePages: false,
  pagesPerTable: 4,
  includeEmptyTables: false,
  highlightVIP: false,
  includeQRCode: false,
};

// Posiciones disponibles para el logo
export const LOGO_POSITIONS = [
  { id: 'top-left', label: 'Superior Izquierda', icon: '↖️' },
  { id: 'top-center', label: 'Superior Centro', icon: '⬆️' },
  { id: 'top-right', label: 'Superior Derecha', icon: '↗️' },
  { id: 'bottom-left', label: 'Inferior Izquierda', icon: '↙️' },
  { id: 'bottom-center', label: 'Inferior Centro', icon: '⬇️' },
  { id: 'bottom-right', label: 'Inferior Derecha', icon: '↘️' },
];

// Tamaños de papel estándar (en mm)
export const PAPER_SIZES = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 },
  A2: { width: 420, height: 594 },
  Tabloid: { width: 279.4, height: 431.8 },
};

// Opciones de calidad para PNG
export const QUALITY_OPTIONS = [
  { value: 0.7, label: 'Baja (web)', size: 'Pequeño' },
  { value: 0.85, label: 'Media', size: 'Medio' },
  { value: 0.95, label: 'Alta', size: 'Grande' },
  { value: 1, label: 'Máxima', size: 'Muy grande' },
];
