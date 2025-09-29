import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// Local resources embedded
import enTranslations from './locales/en/common.json';
import esTranslations from './locales/es/common.json';
import esFinance from './locales/es/finance.json';
import frTranslations from './locales/fr/common.json';

// Light, safe mojibake repair on read
function fixMojibake(s) {
  if (typeof s !== 'string' || !s) return s;
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
    },
    // Embedded resources to avoid network requests
    resources: {
      es: { common: esTranslations, finance: esFinance },
      // For en/fr, expose finance subtree from their common.json if present
      en: { common: enTranslations, finance: (enTranslations && enTranslations.finance) || {} },
      fr: { common: frTranslations, finance: (frTranslations && frTranslations.finance) || {} },
    },
    defaultNS: 'common',
    ns: ['common', 'finance'],
    fallbackNS: ['common'],
    interpolation: { escapeValue: false },
    debug: process.env.NODE_ENV === 'development',
    load: 'languageOnly',
    react: { useSuspense: false, bindI18n: 'languageChanged', bindI18nStore: 'added removed' },
  });

// Wrap i18n.t to repair mojibake at read-time y soporte de variables derivadas
const _origT = i18n.t.bind(i18n);
i18n.t = (key, opts) => {
  try {
    // Inyectar p2Suffix para mensajes que lo necesiten sin usar ICU/formatters
    if (key === 'guests.saveTheDate.message') {
      const p2 = opts && typeof opts.p2 === 'string' ? opts.p2 : '';
      const p2Suffix = p2 ? ` y ${p2}` : '';
      return fixMojibake(_origT(key, { ...opts, p2Suffix }));
    }
  } catch {}
  return fixMojibake(_origT(key, opts));
};

export const changeLanguage = (lng) => i18n.changeLanguage(lng);
export const getCurrentLanguage = () => i18n.language || 'es';
export const getAvailableLanguages = () => [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export const formatDate = (date, options = {}) =>
  new Intl.DateTimeFormat(getCurrentLanguage(), options).format(new Date(date));
export const formatCurrency = (amount, currency = 'EUR') =>
  new Intl.NumberFormat(getCurrentLanguage(), { style: 'currency', currency }).format(amount);
export const formatNumber = (number) => new Intl.NumberFormat(getCurrentLanguage()).format(number);

export default i18n;
