import { useTranslation } from 'react-i18next';
import { getCurrentLanguage, formatDate, formatCurrency, formatNumber } from '../i18n';

/**
 * Hook personalizado para traducciones y formateo localizado
 * Extiende useTranslation con funcionalidades adicionales especÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ficas de MyWed360
 * 
 * @returns {Object} Objeto con funciones de traducciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n y formateo
 */
const useTranslations = () => {
  const fixMojibake = (s) => {
  try {
    if (!s || typeof s !== 'string') return s;
    const replacements = [
      ['A�adir','Añadir'],['A��adir','Añadir'],
      ['S�','Sí'],['S��','Sí'],
      ['M��s','Más'],['Mǭs','Más'],
      ['Configuraci��n','Configuración'],
      ['Dise��os','Diseños'],['Disenos','Diseños'],
      ['Cerrar Sesi��n','Cerrar Sesión'],['Iniciar Sesi��n','Iniciar Sesión'],
      ['Contrase��a','Contraseña'],['Confirmar Contrase��a','Confirmar Contraseña'],
      ['Correo Electr��nico','Correo Electrónico'],
      ['Tel��fono','Teléfono'],['Direcci��n','Dirección'],
      ['Ma��ana','Mañana'],['Pr��xima','Próxima'],['Pr��ximo','Próximo'],
      ['Param��tres','Paramètres'],['D��connexion','Déconnexion'],['T��ches','Tâches'],
      ['Cr��er','Créer'],['R��initialiser','Réinitialiser'],
      ['Ã¡','á'],['Ã©','é'],['Ãí','í'],['Ã³','ó'],['Ãº','ú'],['Ãñ','ñ'],['Ã§','ç'],['Ã‰','É']
    ];
    let out = s;
    for (const [bad, good] of replacements) { out = out.split(bad).join(good); }
    if (out.includes('�')) out = out.replace(/�+/g,'');
    return out;
  } catch { return s; }
};
  // Prioriza el namespace 'finance' sobre 'common' para evitar textos corruptos en common
  const { t, i18n } = useTranslation(['common', 'finance']);
  
  // FunciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de traducciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n mejorada con fallback
  const translate = (key, options = {}) => {
    const opts = { ...options };
    let lookupKey = key;
    if (typeof key === "string" && key.startsWith("finance.")) {
      opts.ns = "finance";
      lookupKey = key.slice("finance.".length);
    }
    const translation = t(lookupKey, opts);
    // Aviso en desarrollo si falta la clave
    if (translation === key && process.env.NODE_ENV === "development") {
      console.warn(`TraducciÃƒÂ³n faltante para la clave: ${key}`);
    }
    
    return fixMojibake(translation);
  };

  // FunciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n para traducir con pluralizaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n
  const translatePlural = (key, count, options = {}) => {
    return t(key, { count, ...options });
  };

  // FunciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n para traducir con interpolaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de variables
  const translateWithVars = (key, variables = {}) => {
    return t(key, variables);
  };

  // Funciones de formateo localizadas
  const formatters = {
    // Formatear fecha segÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºn el idioma actual
    date: (date, options = {}) => {
      const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      return formatDate(date, { ...defaultOptions, ...options });
    },

    // Formatear fecha corta
    dateShort: (date) => {
      return formatDate(date, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },

    // Formatear fecha y hora
    datetime: (date) => {
      return formatDate(date, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    // Formatear solo hora
    time: (date) => {
      return formatDate(date, {
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    // Formatear moneda
    currency: (amount, currency = 'EUR') => {
      return formatCurrency(amount, currency);
    },

    // Formatear nÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºmero
    number: (number) => {
      return formatNumber(number);
    },

    // Formatear porcentaje
    percentage: (value) => {
      const lng = getCurrentLanguage();
      return new Intl.NumberFormat(lng, {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1
      }).format(value / 100);
    }
  };

  // Funciones especÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ficas para MyWed360
  const wedding = {
    // Formatear estado de invitado
    guestStatus: (status) => {
      // Normalizar variantes provenientes de backend/UI
      const norm = (s) => {
        if (!s) return 'pending';
        const x = String(s).toLowerCase();
        if (x === 'accepted' || x === 'confirmado' || x === 'confirmed') return 'confirmed';
        if (x === 'rejected' || x === 'rechazado' || x === 'declined') return 'declined';
        if (x === 'pending' || x === 'pendiente') return 'pending';
        return x;
      };
      const key = norm(status);
      const statusMap = {
        confirmed: translate('guests.confirmed'),
        pending: translate('guests.pending'),
        declined: translate('guests.declined')
      };
      return statusMap[key] || status;
    },

    // Formatear prioridad de tarea
    taskPriority: (priority) => {
      const priorityMap = {
        high: translate('tasks.high'),
        medium: translate('tasks.medium'),
        low: translate('tasks.low')
      };
      return priorityMap[priority] || priority;
    },

    // Formatear estado de tarea
    taskStatus: (status) => {
      const statusMap = {
        completed: translate('tasks.completed'),
        inProgress: translate('tasks.inProgress'),
        notStarted: translate('tasks.notStarted'),
        overdue: translate('tasks.overdue')
      };
      return statusMap[status] || status;
    },

    // Formatear mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©todo de pago
    paymentMethod: (method) => {
      const methodMap = {
        cash: translate('finance.cash'),
        card: translate('finance.card'),
        transfer: translate('finance.transfer')
      };
      return methodMap[method] || method;
    },

    // Formatear servicio de proveedor
    providerService: (service) => {
      const serviceMap = {
        photographer: translate('providers.photographer'),
        videographer: translate('providers.videographer'),
        florist: translate('providers.florist'),
        caterer: translate('providers.caterer'),
        dj: translate('providers.dj'),
        band: translate('providers.band'),
        venue: translate('providers.venue'),
        decorator: translate('providers.decorator'),
        makeup: translate('providers.makeup'),
        hairdresser: translate('providers.hairdresser')
      };
      return serviceMap[service] || service;
    }
  };

  // FunciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n para obtener traducciones de navegaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n
  const getNavigation = () => {
    return {
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
      logout: translate('navigation.logout')
    };
  };

  // FunciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n para obtener mensajes comunes
  const getMessages = () => {
    return {
      saveSuccess: translate('messages.saveSuccess'),
      saveError: translate('messages.saveError'),
      deleteSuccess: translate('messages.deleteSuccess'),
      deleteError: translate('messages.deleteError'),
      updateSuccess: translate('messages.updateSuccess'),
      updateError: translate('messages.updateError'),
      loadError: translate('messages.loadError'),
      networkError: translate('messages.networkError'),
      confirmDelete: translate('messages.confirmDelete'),
      unsavedChanges: translate('messages.unsavedChanges')
    };
  };

  // FunciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n para obtener etiquetas de formulario
  const getFormLabels = () => {
    return {
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
      invalidUrl: translate('forms.invalidUrl')
    };
  };

  return {
    // Funciones bÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡sicas de traducciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n
    t: translate,
    tPlural: translatePlural,
    tVars: translateWithVars,
    
    // Funciones de formateo
    format: formatters,
    
    // Funciones especÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ficas de MyWed360
    wedding,
    
    // Funciones de conveniencia
    getNavigation,
    getMessages,
    getFormLabels,
    
    // InformaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n del idioma actual
    currentLanguage: getCurrentLanguage(),
    isRTL: ['ar', 'he', 'fa'].includes(getCurrentLanguage()),
    
    // Acceso directo a i18n
    i18n
  };
};

export default useTranslations;
