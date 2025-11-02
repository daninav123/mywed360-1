import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

const localeModules = import.meta.glob('./locales/*/*.json', { eager: true });

const resources = Object.entries(localeModules).reduce((acc, [path, module]) => {
  const match = path.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/);
  if (!match) {
    return acc;
  }

  const [, locale, namespace] = match;
  const data = module?.default ?? module;
  if (!data) {
    return acc;
  }

  acc[locale] ??= {};
  acc[locale][namespace] = data;
  return acc;
}, {});

// Código de debug para visualizar qué elementos tienen traducción i18n
// Usa 'en-x-i18n' que es válido según BCP 47 (extensión privada)
const DEBUG_LANGUAGE_CODE = 'en-x-i18n';
// Crear recursos vacíos para el modo debug - devolverá las claves
resources[DEBUG_LANGUAGE_CODE] = {};
Object.values(resources).forEach((namespaceMap) => {
  Object.keys(namespaceMap).forEach((ns) => {
    if (!resources[DEBUG_LANGUAGE_CODE][ns]) {
      resources[DEBUG_LANGUAGE_CODE][ns] = {};
    }
  });
});

const missingKeyLog = [];
const registerMissingKey = (languages, namespace, key, res) => {
  const normalizedLanguages = Array.isArray(languages) ? languages : [languages].filter(Boolean);
  const entry = {
    languages: normalizedLanguages.length ? normalizedLanguages : ['unknown'],
    namespace,
    key,
    resource: res,
    timestamp: Date.now(),
  };
  const exists = missingKeyLog.some(
    (item) =>
      item.key === entry.key &&
      item.namespace === entry.namespace &&
      item.languages.some((lng) => entry.languages.includes(lng))
  );
  if (!exists) {
    missingKeyLog.push(entry);
  }
  if (typeof window !== 'undefined') {
    window.__I18N_MISSING_KEYS__ = missingKeyLog;
  }
};

const LANGUAGE_METADATA = {
  [DEBUG_LANGUAGE_CODE]: {
    name: '🔍 i18n Debug (mostrar claves)',
    flag: '🔍',
    order: -1,
  },
  ar: { name: 'Arabic', flag: 'AR', dir: 'rtl', order: 20 },
  bg: { name: 'Bulgarian', flag: 'BG', order: 20 },
  ca: { name: 'Catalan', flag: 'CA', order: 20 },
  cs: { name: 'Czech', flag: 'CZ', order: 20 },
  da: { name: 'Danish', flag: 'DK', order: 20 },
  de: { name: 'German', flag: 'DE', order: 8 },
  el: { name: 'Greek', flag: 'GR', order: 20 },
  en: { name: 'English', flag: 'EN', order: 3 },
  es: { name: 'Spanish (Spain)', flag: 'ES', order: 0 },
  'es-AR': { name: 'Spanish (Argentina)', flag: 'AR', order: 2 },
  'es-MX': { name: 'Spanish (Mexico)', flag: 'MX', order: 1 },
  et: { name: 'Estonian', flag: 'EE', order: 20 },
  eu: { name: 'Basque', flag: 'EU', order: 20 },
  fi: { name: 'Finnish', flag: 'FI', order: 20 },
  fr: { name: 'French (France)', flag: 'FR', order: 5 },
  'fr-CA': { name: 'French (Canada)', flag: 'CA', order: 6 },
  hr: { name: 'Croatian', flag: 'HR', order: 20 },
  hu: { name: 'Hungarian', flag: 'HU', order: 20 },
  is: { name: 'Icelandic', flag: 'IS', order: 20 },
  it: { name: 'Italian', flag: 'IT', order: 7 },
  lt: { name: 'Lithuanian', flag: 'LT', order: 20 },
  lv: { name: 'Latvian', flag: 'LV', order: 20 },
  mt: { name: 'Maltese', flag: 'MT', order: 20 },
  nl: { name: 'Dutch', flag: 'NL', order: 12 },
  no: { name: 'Norwegian', flag: 'NO', order: 20 },
  pl: { name: 'Polish', flag: 'PL', order: 20 },
  pt: { name: 'Portuguese', flag: 'PT', order: 9 },
  ro: { name: 'Romanian', flag: 'RO', order: 20 },
  ru: { name: 'Russian', flag: 'RU', order: 20 },
  sk: { name: 'Slovak', flag: 'SK', order: 20 },
  sl: { name: 'Slovenian', flag: 'SI', order: 20 },
  sv: { name: 'Swedish', flag: 'SE', order: 20 },
  tr: { name: 'Turkish', flag: 'TR', order: 20 },
};

const FALLBACK_LANGUAGE = 'es';
const FALLBACK_LANGUAGES = [FALLBACK_LANGUAGE, 'en'];

const buildAvailableLanguages = () =>
  Object.keys(resources)
    .filter((code) => {
      // Incluir modo debug SIEMPRE para detectar claves faltantes
      if (code === DEBUG_LANGUAGE_CODE) {
        return true;
      }
      // Filtrar solo idiomas con traducciones válidas
      return Object.keys(resources[code] || {}).length > 0;
    })
    .map((code) => {
      const meta = LANGUAGE_METADATA[code] ?? {
        name: code,
        flag: code.toUpperCase(),
        order: 100,
      };
      return {
        code,
        name: meta.name,
        flag: meta.flag,
        dir: meta.dir ?? 'ltr',
        order: meta.order ?? 100,
      };
    })
    .sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.name.localeCompare(b.name);
    })
    .map(({ order, ...lang }) => lang);

export const AVAILABLE_LANGUAGES = buildAvailableLanguages();

const SUPPORTED_NAMESPACES = (() => {
  const namespaces = new Set();
  Object.values(resources).forEach((namespaceMap) => {
    Object.keys(namespaceMap).forEach((ns) => namespaces.add(ns));
  });

  if (!namespaces.size) {
    ['common', 'finance', 'tasks', 'seating', 'email', 'admin', 'marketing', 'chat'].forEach((ns) =>
      namespaces.add(ns)
    );
  }

  return Array.from(namespaces).sort((a, b) => {
    if (a === b) {
      return 0;
    }
    if (a === 'common') {
      return -1;
    }
    if (b === 'common') {
      return 1;
    }
    return a.localeCompare(b);
  });
})();

const resolveInitialLanguage = () => {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage?.getItem('i18nextLng');
    if (stored && resources[stored]) {
      return stored;
    }
  }
  return FALLBACK_LANGUAGE;
};

const applyDocumentAttributes = (lng) => {
  if (typeof document === 'undefined') {
    return;
  }
  const meta = LANGUAGE_METADATA[lng] ?? {};
  document.documentElement.lang = lng;
  document.documentElement.dir = meta.dir ?? 'ltr';
};

i18n.on('languageChanged', applyDocumentAttributes);
i18n.on('missingKey', registerMissingKey);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: (code) => {
      const candidates = Array.isArray(code) ? code : [code];
      // En modo debug, no usar fallback para ver claves faltantes
      if (candidates.includes(DEBUG_LANGUAGE_CODE)) {
        return [];
      }
      return FALLBACK_LANGUAGES;
    },
    supportedLngs: AVAILABLE_LANGUAGES.map((lang) => lang.code),
    lng: resolveInitialLanguage(),
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    defaultNS: 'common',
    ns: SUPPORTED_NAMESPACES,
    fallbackNS: ['common'],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    debug: process.env.NODE_ENV === 'development',
  })
  .then(() => {
    applyDocumentAttributes(i18n.language || FALLBACK_LANGUAGE);
  })
  .catch((error) => {
    console.error('[i18n] initialization failed', error);
  });

export const changeLanguage = (lng) => {
  const target = AVAILABLE_LANGUAGES.find((lang) => lang.code === lng)?.code ?? FALLBACK_LANGUAGE;
  return i18n.changeLanguage(target);
};

export const getCurrentLanguage = () => i18n.language || FALLBACK_LANGUAGE;
const getIntlLanguage = () => {
  const current = getCurrentLanguage();
  // En modo debug, usar español para formateo de fechas/números
  return current === DEBUG_LANGUAGE_CODE ? FALLBACK_LANGUAGE : current;
};
export const getAvailableLanguages = () => AVAILABLE_LANGUAGES.map((lang) => ({ ...lang }));

export const formatDate = (date, options = {}) =>
  new Intl.DateTimeFormat(getIntlLanguage(), options).format(new Date(date));
export const formatCurrency = (amount, currency = 'EUR') =>
  new Intl.NumberFormat(getIntlLanguage(), { style: 'currency', currency }).format(amount);
export const formatNumber = (number) => new Intl.NumberFormat(getIntlLanguage()).format(number);

export const getMissingTranslationLog = () => missingKeyLog.slice();

/**
 * Exporta las claves faltantes en formato JSON organizado por idioma y namespace
 */
export const exportMissingKeys = () => {
  const organized = {};
  missingKeyLog.forEach((entry) => {
    entry.languages.forEach((lang) => {
      if (!organized[lang]) organized[lang] = {};
      if (!organized[lang][entry.namespace]) organized[lang][entry.namespace] = [];
      if (!organized[lang][entry.namespace].includes(entry.key)) {
        organized[lang][entry.namespace].push(entry.key);
      }
    });
  });
  return organized;
};

if (typeof window !== 'undefined') {
  window.__I18N_INSTANCE__ = i18n;
  window.__I18N_RESET_MISSING__ = () => {
    missingKeyLog.length = 0;
    window.__I18N_MISSING_KEYS__ = missingKeyLog;
    return missingKeyLog;
  };
  window.__I18N_GET_MISSING__ = () => missingKeyLog.slice();
  window.__I18N_EXPORT_MISSING__ = exportMissingKeys;
  window.__I18N_DOWNLOAD_MISSING__ = () => {
    const data = exportMissingKeys();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `missing-i18n-keys-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return data;
  };
}

export default i18n;
