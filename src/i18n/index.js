import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Importar traducciones
import esTranslations from './locales/es/common.json';
import enTranslations from './locales/en/common.json';
import frTranslations from './locales/fr/common.json';
import esFinance from './locales/es/finance.json';

// ConfiguraciÃƒÆ’Ã‚Â³n de i18next
i18n
  // Detectar idioma del navegador
  .use(LanguageDetector)
  // Cargar traducciones desde archivos
  .use(Backend)
  // Integrar con React
  .use(initReactI18next)
  // Inicializar
  .init({
    // Idioma por defecto
    fallbackLng: 'es',
    // Idioma inicial por defecto (si no hay preferencia en localStorage)
    lng: (typeof window !== 'undefined' && localStorage.getItem('i18nextLng')) || 'es',
    
    // Idiomas soportados
    supportedLngs: ['es', 'en', 'fr'],
    
    // ConfiguraciÃƒÆ’Ã‚Â³n de detecciÃƒÆ’Ã‚Â³n de idioma
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      checkWhitelist: true
    },
    
    // ConfiguraciÃƒÆ’Ã‚Â³n de backend para cargar traducciones
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    // Recursos de traducciÃƒÆ’Ã‚Â³n embebidos (fallback)
    resources: {
      es: {
        common: esTranslations,
        finance: esFinance,
      },
      en: {
        common: enTranslations
      },
      fr: {
        common: frTranslations
      }
    },
    
    // Namespace por defecto
    defaultNS: 'common',
    ns: ['common', 'finance'],
    fallbackNS: ['common'],
    
    // ConfiguraciÃƒÆ’Ã‚Â³n de interpolaciÃƒÆ’Ã‚Â³n (nuevo formato)
    interpolation: {
      escapeValue: false, // React ya escapa por defecto
      formatSeparator: ','
    },
    
    // ConfiguraciÃƒÆ’Ã‚Â³n de formateo (nuevo formato)
    formatting: {
      uppercase: (value) => value.toUpperCase(),
      lowercase: (value) => value.toLowerCase(),
      currency: (value, lng) => {
        return new Intl.NumberFormat(lng, {
          style: 'currency',
          currency: 'EUR'
        }).format(value);
      },
      date: (value, lng) => {
        return new Intl.DateTimeFormat(lng).format(new Date(value));
      }
    },
    
    // ConfiguraciÃƒÆ’Ã‚Â³n de desarrollo
    debug: process.env.NODE_ENV === 'development',
    
    // ConfiguraciÃƒÆ’Ã‚Â³n de carga
    load: 'languageOnly', // Solo cargar idioma, no regiÃƒÆ’Ã‚Â³n (es en lugar de es-ES)
    
    // ConfiguraciÃƒÆ’Ã‚Â³n de pluralizaciÃƒÆ’Ã‚Â³n
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // ConfiguraciÃƒÆ’Ã‚Â³n de React
    react: {
      useSuspense: false, // Evitar suspense para mejor UX
      bindI18n: 'languageChanged',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'span']
    }
  });

// FunciÃƒÆ’Ã‚Â³n para cambiar idioma
export const changeLanguage = (lng) => {
  return i18n.changeLanguage(lng);
};

// FunciÃƒÆ’Ã‚Â³n para obtener idioma actual
export const getCurrentLanguage = () => {
  return i18n.language || 'es';
};

// FunciÃƒÆ’Ã‚Â³n para obtener idiomas disponibles
export const getAvailableLanguages = () => {
  return [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];
};

// FunciÃƒÆ’Ã‚Â³n para formatear fechas segÃƒÆ’Ã‚Âºn el idioma
export const formatDate = (date, options = {}) => {
  const lng = getCurrentLanguage();
  return new Intl.DateTimeFormat(lng, options).format(new Date(date));
};

// FunciÃƒÆ’Ã‚Â³n para formatear moneda segÃƒÆ’Ã‚Âºn el idioma
export const formatCurrency = (amount, currency = 'EUR') => {
  const lng = getCurrentLanguage();
  return new Intl.NumberFormat(lng, {
    style: 'currency',
    currency
  }).format(amount);
};

// FunciÃƒÆ’Ã‚Â³n para formatear nÃƒÆ’Ã‚Âºmeros segÃƒÆ’Ã‚Âºn el idioma
export const formatNumber = (number) => {
  const lng = getCurrentLanguage();
  return new Intl.NumberFormat(lng).format(number);
};

export default i18n;
