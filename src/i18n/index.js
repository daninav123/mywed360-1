import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import esCommon from './locales/es/common.json';
import esFinance from './locales/es/finance.json';
import esTasks from './locales/es/tasks.json';
import esSeating from './locales/es/seating.json';
import esEmail from './locales/es/email.json';
import esAdmin from './locales/es/admin.json';
import esMarketing from './locales/es/marketing.json';
import esChat from './locales/es/chat.json';
import esMxCommon from './locales/es-MX/common.json';
import esArCommon from './locales/es-AR/common.json';

export const AVAILABLE_LANGUAGES = [
  { code: 'es', name: 'Español (España)', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Español (México)', flag: '🇲🇽' },
  { code: 'es-AR', name: 'Español (Argentina)', flag: '🇦🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

const SPANISH_BUNDLE = { 
  common: esCommon, 
  finance: esFinance,
  tasks: esTasks,
  seating: esSeating,
  email: esEmail,
  admin: esAdmin,
  marketing: esMarketing,
  chat: esChat
};

const resources = {
  en: createResource(enCommon, undefined, {
    tasks: esTasks,
    seating: esSeating,
    email: esEmail,
    admin: esAdmin,
    marketing: esMarketing,
    chat: esChat,
  }),
  es: SPANISH_BUNDLE,
  'es-MX': createResource(esMxCommon || esCommon, esFinance, {
    tasks: esTasks,
    seating: esSeating,
    email: esEmail,
    admin: esAdmin,
    marketing: esMarketing,
    chat: esChat,
  }),
  'es-AR': createResource(esArCommon || esCommon, esFinance, {
    tasks: esTasks,
    seating: esSeating,
    email: esEmail,
    admin: esAdmin,
    marketing: esMarketing,
    chat: esChat,
  }),
};

function createResource(commonBundle, financeBundle, fallbackBundles = {}) {
  return {
    common: commonBundle,
    finance: financeBundle ?? fallbackBundles.finance ?? {},
    tasks: fallbackBundles.tasks ?? {},
    seating: fallbackBundles.seating ?? {},
    email: fallbackBundles.email ?? {},
    admin: fallbackBundles.admin ?? {},
    marketing: fallbackBundles.marketing ?? {},
    chat: fallbackBundles.chat ?? {},
  };
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: ['es', 'en'],
    supportedLngs: AVAILABLE_LANGUAGES.map((lang) => lang.code),
    lng:
      (typeof window !== 'undefined' && window.localStorage?.getItem('i18nextLng')) ||
      'es',
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    defaultNS: 'common',
    ns: ['common', 'finance', 'tasks', 'seating', 'email', 'admin', 'marketing', 'chat'],
    fallbackNS: ['common'],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    debug: process.env.NODE_ENV === 'development',
  });

export const changeLanguage = (lng) => {
  const target = AVAILABLE_LANGUAGES.find((lang) => lang.code === lng)?.code ?? 'es';
  return i18n.changeLanguage(target);
};

export const getCurrentLanguage = () => i18n.language || 'es';
export const getAvailableLanguages = () => AVAILABLE_LANGUAGES;

export const formatDate = (date, options = {}) =>
  new Intl.DateTimeFormat(getCurrentLanguage(), options).format(new Date(date));
export const formatCurrency = (amount, currency = 'EUR') =>
  new Intl.NumberFormat(getCurrentLanguage(), { style: 'currency', currency }).format(
    amount
  );
export const formatNumber = (number) =>
  new Intl.NumberFormat(getCurrentLanguage()).format(number);

export default i18n;
