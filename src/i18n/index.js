import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// Local resources embedded
import enTranslations from './locales/en/common.json';
import esTranslations from './locales/es/common.json';
import esFinance from './locales/es/finance.json';
import arTranslations from './locales/ar/common.json';
import bgTranslations from './locales/bg/common.json';
import caTranslations from './locales/ca/common.json';
import csTranslations from './locales/cs/common.json';
import daTranslations from './locales/da/common.json';
import deTranslations from './locales/de/common.json';
import elTranslations from './locales/el/common.json';
import esArTranslations from './locales/es-AR/common.json';
import esMxTranslations from './locales/es-MX/common.json';
import etTranslations from './locales/et/common.json';
import euTranslations from './locales/eu/common.json';
import fiTranslations from './locales/fi/common.json';
import frTranslations from './locales/fr/common.json';
import frCaTranslations from './locales/fr-CA/common.json';
import hrTranslations from './locales/hr/common.json';
import huTranslations from './locales/hu/common.json';
import isTranslations from './locales/is/common.json';
import itTranslations from './locales/it/common.json';
import ltTranslations from './locales/lt/common.json';
import lvTranslations from './locales/lv/common.json';
import mtTranslations from './locales/mt/common.json';
import nlTranslations from './locales/nl/common.json';
import noTranslations from './locales/no/common.json';
import plTranslations from './locales/pl/common.json';
import ptTranslations from './locales/pt/common.json';
import roTranslations from './locales/ro/common.json';
import ruTranslations from './locales/ru/common.json';
import skTranslations from './locales/sk/common.json';
import slTranslations from './locales/sl/common.json';
import svTranslations from './locales/sv/common.json';
import trTranslations from './locales/tr/common.json';

export const AVAILABLE_LANGUAGES = [
  { code: 'es', name: 'Español (España)', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Español (México)', flag: '🇲🇽' },
  { code: 'es-AR', name: 'Español (Argentina)', flag: '🇦🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'fr-CA', name: 'Français (Canada)', flag: '🇨🇦' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
  { code: 'is', name: 'Íslenska', flag: '🇮🇸' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰' },
  { code: 'no', name: 'Norsk', flag: '🇳🇴' },
  { code: 'lv', name: 'Latviešu', flag: '🇱🇻' },
  { code: 'lt', name: 'Lietuvių', flag: '🇱🇹' },
  { code: 'et', name: 'Eesti', flag: '🇪🇪' },
  { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
  { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
  { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
  { code: 'ro', name: 'Română', flag: '🇷🇴' },
  { code: 'bg', name: 'Български', flag: '🇧🇬' },
  { code: 'sl', name: 'Slovenščina', flag: '🇸🇮' },
  { code: 'hr', name: 'Hrvatski', flag: '🇭🇷' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'mt', name: 'Malti', flag: '🇲🇹' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ca', name: 'Català', flag: '🇪🇸' },
  { code: 'eu', name: 'Euskara', flag: '🇪🇸' }
];

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
    fallbackLng: ['en', 'es'],
    lng: (typeof window !== 'undefined' && localStorage.getItem('i18nextLng')) || 'es',
    supportedLngs: AVAILABLE_LANGUAGES.map((lang) => lang.code),
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    // Embedded resources to avoid network requests
    resources: buildResources(),
    defaultNS: 'common',
    ns: ['common', 'finance'],
    fallbackNS: ['common'],
    interpolation: { escapeValue: false },
    debug: process.env.NODE_ENV === 'development',
    load: 'currentOnly',
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
export const getAvailableLanguages = () => AVAILABLE_LANGUAGES;

export const formatDate = (date, options = {}) =>
  new Intl.DateTimeFormat(getCurrentLanguage(), options).format(new Date(date));
export const formatCurrency = (amount, currency = 'EUR') =>
  new Intl.NumberFormat(getCurrentLanguage(), { style: 'currency', currency }).format(amount);
export const formatNumber = (number) => new Intl.NumberFormat(getCurrentLanguage()).format(number);

export default i18n;

function buildResources() {
  const englishFinanceNs = (enTranslations && enTranslations.finance) || {};
  const englishResource = createResource(enTranslations, englishFinanceNs);
  const spanishResource = { common: esTranslations, finance: esFinance };
  const resources = {
    en: englishResource,
    es: spanishResource,
  };
  const spanishVariants = {
    'es-MX': esMxTranslations,
    'es-AR': esArTranslations,
  };
  Object.entries(spanishVariants).forEach(([code, bundle]) => {
    resources[code] = createResource(bundle, esFinance);
  });

  const localizedBundles = {
    fr: frTranslations,
    'fr-CA': frCaTranslations,
    de: deTranslations,
    it: itTranslations,
    pt: ptTranslations,
    nl: nlTranslations,
    pl: plTranslations,
    fi: fiTranslations,
    is: isTranslations,
    sv: svTranslations,
    da: daTranslations,
    no: noTranslations,
    lv: lvTranslations,
    lt: ltTranslations,
    et: etTranslations,
    cs: csTranslations,
    sk: skTranslations,
    hu: huTranslations,
    ro: roTranslations,
    bg: bgTranslations,
    sl: slTranslations,
    hr: hrTranslations,
    el: elTranslations,
    mt: mtTranslations,
    tr: trTranslations,
    ar: arTranslations,
    ru: ruTranslations,
    ca: caTranslations,
    eu: euTranslations,
  };

  Object.entries(localizedBundles).forEach(([code, bundle]) => {
    resources[code] = createResource(bundle, englishFinanceNs);
  });

  return resources;
}

function createResource(bundle, fallbackFinance) {
  return {
    common: bundle,
    finance: (bundle && bundle.finance) || fallbackFinance,
  };
}
