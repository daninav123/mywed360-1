/**
 * Hook de traducciones DUMMY para admin-app
 * El panel de admin NO necesita i18n, solo retorna textos por defecto en español
 */

const useTranslations = () => {
  // Función t que retorna defaultValue o la última parte de la key
  const t = (key, options = {}) => {
    if (options && options.defaultValue) {
      return options.defaultValue;
    }
    // Retornar la última parte de la key como fallback
    const parts = String(key).split('.');
    return parts[parts.length - 1];
  };

  return {
    t,
    translate: t,
    trans: t,
    formatDate: (date) => date ? new Date(date).toLocaleDateString('es-ES') : '',
    formatCurrency: (amount) => `${amount?.toFixed(2) || '0.00'} €`,
    formatNumber: (num) => num?.toLocaleString('es-ES') || '0',
    language: 'es',
    changeLanguage: () => {},
  };
};

export default useTranslations;
