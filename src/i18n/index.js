import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Local resources embebidos
import esTranslations from './locales/es/common.json';
import enTranslations from './locales/en/common.json';
import frTranslations from './locales/fr/common.json';
import esFinance from './locales/es/finance.json';

// Reparación ligera de mojibake en tiempo de lectura
function fixMojibake(s) {
  if (typeof s !== 'string' || !s) return s;
  if (!(/[ÃÂ�ǟ]/.test(s))) return s; // heurística rápida
  try {
    const rec = decodeURIComponent(escape(s));
    return rec && rec !== s ? rec : s;
  } catch {
    return s;
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'es',
    lng: (typeof window !== 'undefined' && localStorage.getItem('i18nextLng')) || 'es',
    supportedLngs: ['es', 'en', 'fr'],
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      checkWhitelist: true,
    },
    // Cargamos recursos embebidos; evitamos peticiones a /locales
    resources: {
      es: { common: esTranslations, finance: esFinance },
      // Para en/fr, exponemos el subárbol "finance" dentro de common como namespace independiente
      en: { common: enTranslations, finance: enTranslations.finance || {} },
      fr: { common: frTranslations, finance: frTranslations.finance || {} },
    },
    defaultNS: 'common',
    ns: ['common', 'finance'],
    fallbackNS: ['common'],
    interpolation: { escapeValue: false, formatSeparator: ',' },
    debug: process.env.NODE_ENV === 'development',
    load: 'languageOnly',
    pluralSeparator: '_',
    contextSeparator: '_',
    react: { useSuspense: false, bindI18n: 'languageChanged', bindI18nStore: 'added removed' },
  });

// Wrap i18n.t to reparar mojibake en lectura
const _origT = i18n.t.bind(i18n);
i18n.t = (key, opts) => fixMojibake(_origT(key, opts));

export const changeLanguage = (lng) => i18n.changeLanguage(lng);
export const getCurrentLanguage = () => i18n.language || 'es';
export const getAvailableLanguages = () => ([
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
]);

export const formatDate = (date, options = {}) => new Intl.DateTimeFormat(getCurrentLanguage(), options).format(new Date(date));
export const formatCurrency = (amount, currency = 'EUR') => new Intl.NumberFormat(getCurrentLanguage(), { style: 'currency', currency }).format(amount);
export const formatNumber = (number) => new Intl.NumberFormat(getCurrentLanguage()).format(number);

export default i18n;

