import { useTranslation } from 'react-i18next';

import { getCurrentLanguage, formatDate, formatCurrency, formatNumber } from '../i18n';

const SUPPORTED_NAMESPACES = [
  'common',
  'finance',
  'tasks',
  'seating',
  'email',
  'admin',
  'marketing',
  'chat',
  'home',
];

const PREFIXED_NAMESPACES = SUPPORTED_NAMESPACES.filter((ns) => ns !== 'common');

// Hook de traducciones y formateos localizados
const useTranslations = () => {
  const { t, i18n } = useTranslation(SUPPORTED_NAMESPACES);

  // Normalize key/namespace: if key starts with a known namespace prefix drop it and set ns
  const normalizeNs = (key, opts = {}) => {
    if (typeof key !== 'string') {
      return { key, opts };
    }

    const matchedNamespace = PREFIXED_NAMESPACES.find((ns) => key.startsWith(`${ns}.`));
    if (matchedNamespace) {
      return {
        key: key.slice(matchedNamespace.length + 1),
        opts: { ...opts, ns: matchedNamespace },
      };
    }

    // Permitir prefijos explícitos con "common." sin duplicar la ruta
    if (key.startsWith('common.')) {
      return {
        key: key.slice('common.'.length),
        opts,
      };
    }

    return { key, opts };
  };

  const translate = (key, options = {}) => {
    const { key: k, opts } = normalizeNs(key, options);
    return t(k, opts);
  };

  const translatePlural = (key, count, options = {}) => {
    const { key: k, opts } = normalizeNs(key, options);
    return t(k, { count, ...opts });
  };
  const translateWithVars = (key, variables = {}) => {
    const { key: k, opts } = normalizeNs(key, variables);
    return t(k, opts);
  };

  const formatters = {
    date: (date, options = {}) =>
      formatDate(date, { year: 'numeric', month: 'long', day: 'numeric', ...options }),
    dateShort: (date) => formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' }),
    datetime: (date) =>
      formatDate(date, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    time: (date) => formatDate(date, { hour: '2-digit', minute: '2-digit' }),
    currency: (amount, currency = 'EUR') => formatCurrency(amount, currency),
    number: (n) => formatNumber(n),
    percentage: (value) =>
      new Intl.NumberFormat(getCurrentLanguage(), {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(value / 100),
  };

  const wedding = {
    guestStatus: (status) => {
      const x = String(status || '').toLowerCase();
      const norm =
        x === 'accepted' || x === 'confirmado' || x === 'confirmed'
          ? 'confirmed'
          : x === 'rejected' || x === 'rechazado' || x === 'declined'
            ? 'declined'
            : 'pending';
      const map = {
        confirmed: 'Confirmado',
        pending: 'Pendiente',
        declined: 'Rechazado',
      };
      return map[norm] || status;
    },
  };

  const getNavigation = () => ({
    home: translate('navigation.home'),
    dashboard: translate('navigation.dashboard'),
    guests: translate('navigation.guests'),
    providers: translate('navigation.providers'),
    finance: translate('navigation.finance'),
    seating: translate('navigation.seating'),
    email: translate('navigation.email'),
    protocol: translate('navigation.protocol'),
    designs: translate('navigation.designs'),
    website: translate('navigation.website'),
    contracts: translate('navigation.contracts'),
    tasks: translate('navigation.tasks'),
    profile: translate('navigation.profile'),
    settings: translate('navigation.settings'),
    logout: translate('navigation.logout'),
    more: translate('navigation.more'),
    weddings: translate('navigation.weddings'),
  });

  const getMessages = () => ({
    saveSuccess: translate('messages.saveSuccess'),
    saveError: translate('messages.saveError'),
    deleteSuccess: translate('messages.deleteSuccess'),
    deleteError: translate('messages.deleteError'),
    updateSuccess: translate('messages.updateSuccess'),
    updateError: translate('messages.updateError'),
    loadError: translate('messages.loadError'),
    networkError: translate('messages.networkError'),
    confirmDelete: translate('messages.confirmDelete'),
    unsavedChanges: translate('messages.unsavedChanges'),
  });

  const getFormLabels = () => ({
    required: translate('forms.required'),
    optional: translate('forms.optional'),
    pleaseSelect: translate('forms.pleaseSelect'),
    selectOption: translate('forms.selectOption'),
    enterText: translate('forms.enterText'),
    chooseFile: translate('forms.chooseFile'),
    uploadFile: translate('forms.uploadFile'),
    fieldRequired: translate('forms.fieldRequired'),
    invalidEmail: translate('forms.invalidEmail'),
    invalidPhone: translate('forms.invalidPhone'),
    invalidUrl: translate('forms.invalidUrl'),
  });

  return {
    t: translate,
    tPlural: translatePlural,
    tVars: translateWithVars,
    format: formatters,
    wedding,
    getNavigation,
    getMessages,
    getFormLabels,
    currentLanguage: getCurrentLanguage(),
    isRTL: ['ar', 'he', 'fa'].includes(getCurrentLanguage()),
    i18n,
  };
};

export default useTranslations;
