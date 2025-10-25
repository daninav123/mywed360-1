import i18n from '../i18n';

// Servicio de plantillas de correo para diferentes tipos de proveedores
// Este servicio proporciona plantillas predefinidas para agilizar la comunicación con proveedores

/**
 * Plantillas de correo para diferentes tipos de proveedores
 * Cada plantilla incluye asunto y cuerpo con variables que se reemplazan con datos del proveedor
 * Variables disponibles:
 * - {{providerName}} - Nombre del proveedor
 * - {{weddingDate}} - Fecha de la boda
 * - {{weddingPlace}} - Lugar de la boda
 * - {{coupleName}} - Nombre de la pareja
 * - {{userName}} - Nombre del usuario
 * - {{userPhone}} - Teléfono del usuario (si está disponible)
 * - {{userEmail}} - Email del usuario
 */

export const EMAIL_TEMPLATES = {
  // Solicitud de información general
  GENERAL_INFO: {
    name: i18n.t('common.solicitud_informacion'),
    subject: i18n.t('common.solicitud_informacion_para_boda_weddingdate_weddingplace'),
    body: `Hola {{providerName}},

Soy {{userName}} y estoy organizando mi boda que se celebrará el {{weddingDate}} en {{weddingPlace}}. 

Me gustaría recibir más información sobre sus servicios, disponibilidad para esa fecha y precios aproximados.

¿Podrían enviarme un catálogo o información detallada sobre las opciones que ofrecen?

Muchas gracias por su atención.
Un cordial saludo,
{{userName}}
{{userPhone}}
{{userEmail}}
`,
  },

  // Solicitud de presupuesto
  BUDGET_REQUEST: {
    name: 'Solicitud de presupuesto',
    subject: 'Solicitud de presupuesto para boda el {{weddingDate}}i18n.t('common.body_hola_providername_soy_username_junto')Confirmación de reserva',
    subject: i18n.t('common.confirmacion_reserva_para_nuestra_boda_weddingdate'),
    body: `Estimado/a {{providerName}},

Por la presente queremos confirmar la reserva de sus servicios para nuestra boda que se celebrará el {{weddingDate}} en {{weddingPlace}}.

Tras revisar su presupuesto y condiciones, estamos de acuerdo con los términos establecidos.

¿Podría indicarnos los siguientes pasos a seguir para formalizar la reserva? ¿Es necesario realizar algún pago por adelantado o firmar algún contrato?

Quedamos a la espera de su respuesta.

Saludos cordiales,
{{coupleName}}
{{userPhone}}
{{userEmail}}
`,
  },

  // Seguimiento
  FOLLOW_UP: {
    name: 'Seguimiento',
    subject: 'Seguimiento sobre consulta para boda {{weddingDate}}i18n.t('common.body_hola_providername_hace_unos_dias')Fotógrafo - Consulta',
    subject: i18n.t('common.consulta_sobre_servicios_fotografia_para_boda'),
    body: `Hola {{providerName}},

Soy {{userName}} y estoy organizando mi boda para el {{weddingDate}} en {{weddingPlace}}.

Estamos buscando un fotógrafo profesional que capture los momentos especiales de nuestra boda. Me gustaría saber:

- ¿Qué paquetes o servicios ofrecen?
- ¿Tienen disponibilidad para nuestra fecha?
- ¿Cuánto tiempo de cobertura incluyen?
- ¿Entregan todas las fotos editadas?
- ¿Cuánto tiempo tardan en entregar el trabajo final?
- ¿Hacen álbumes físicos?

Si es posible, me encantaría ver ejemplos de bodas anteriores que hayan fotografiado.

Muchas gracias,
{{userName}}
{{userPhone}}
{{userEmail}}
`,
  },

  // Catering
  CATERING: {
    name: 'Catering - Consulta',
    subject: 'Consulta sobre servicios de catering para boda {{weddingDate}}i18n.t('common.body_estimado_equipo_providername_pareja_estamos')DJ/Música - Consulta',
    subject: i18n.t('common.consulta_sobre_musicadj_para_boda_weddingdate'),
    body: `Hola {{providerName}},

Estamos organizando nuestra boda para el {{weddingDate}} en {{weddingPlace}} y estamos buscando servicios de DJ/música para amenizar el evento.

Nos gustaría saber:

- ¿Qué servicios ofrecen exactamente?
- ¿Disponen de equipo de sonido e iluminación?
- ¿Tienen disponibilidad para nuestra fecha?
- ¿Durante cuántas horas darían servicio?
- ¿Es posible proporcionarles una lista de canciones de nuestra elección?
- ¿Podrían encargarse también de la música durante la ceremonia?

Agradecemos de antemano su respuesta.

Saludos cordiales,
{{userName}}
{{userPhone}}
{{userEmail}}
`,
  },

  // Flores
  FLOWERS: {
    name: 'Flores - Consulta',
    subject: i18n.t('common.consulta_sobre_decoracion_floral_para_boda'),
    body: `Estimado/a {{providerName}},

Estoy organizando mi boda que se celebrará el {{weddingDate}} en {{weddingPlace}} y estoy interesado/a en sus servicios de decoración floral.

Me gustaría recibir información sobre:

- Ramos de novia y complementos florales para novios
- Decoración floral para la ceremonia
- Centros de mesa para el banquete
- Disponibilidad y precios para la fecha indicada
- Proceso de diseño y posibilidad de personalización

Si tienen un catálogo o portfolio que puedan compartirme, sería de gran ayuda.

Muchas gracias,
{{userName}}
{{userPhone}}
{{userEmail}}
`,
  },

  // Lugar de celebración
  VENUE: {
    name: i18n.t('common.lugar_celebracion_consulta'),
    subject: 'Consulta sobre disponibilidad para boda {{weddingDate}}i18n.t('common.body_estimado_equipo_providername_pareja_estamos')Vestido/Traje - Consulta',
    subject: 'Consulta sobre cita para vestido/traje de bodai18n.t('common.body_hola_providername_estoy_organizando_boda')Invitaciones - Consulta',
    subject: i18n.t('common.consulta_sobre_diseno_invitaciones_para_boda'),
    body: `Hola {{providerName}},

Estamos organizando nuestra boda que tendrá lugar el {{weddingDate}} en {{weddingPlace}} y estamos interesados en sus servicios de diseño e impresión de invitaciones.

Nos gustaría saber:

- ¿Qué tipos de invitaciones ofrecen?
- ¿Realizan diseños personalizados?
- ¿Cuál es el tiempo de producción desde la aprobación del diseño?
- ¿Cuáles son sus tarifas aproximadas?
- ¿Ofrecen servicios adicionales como sobres, etiquetas, o tarjetas complementarias?

Esperamos su respuesta para poder avanzar con este aspecto de nuestra boda.

Muchas gracias,
{{userName}}
{{userPhone}}
{{userEmail}}
`,
  },
};

/**
 * Obtener todas las plantillas disponibles
 * @returns {Object} Objeto con todas las plantillas
 */
export function getAllTemplates() {
  return EMAIL_TEMPLATES;
}

/**
 * Obtener una plantilla específica por su clave
 * @param {string} templateKey - Clave de la plantilla
 * @returns {Object|null} Plantilla o null si no existe
 */
export function getTemplate(templateKey) {
  return EMAIL_TEMPLATES[templateKey] || null;
}

/**
 * Aplicar los datos del proveedor y usuario a una plantilla
 * @param {string} templateKey - Clave de la plantilla
 * @param {Object} data - Datos para reemplazar en la plantilla
 * @returns {Object} Objeto con asunto y cuerpo procesados
 */
export function applyTemplate(templateKey, data) {
  const template = getTemplate(templateKey);
  if (!template) {
    throw new Error(`La plantilla ${templateKey} no existe`);
  }

  // Función para reemplazar variables en texto
  const replaceVars = (text, data) => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return data[variable] !== undefined ? data[variable] : match;
    });
  };

  // Aplicar reemplazos a asunto y cuerpo
  return {
    name: template.name,
    subject: replaceVars(template.subject, data),
    body: replaceVars(template.body, data),
  };
}

/**
 * Obtener listado de plantillas para mostrar en selector
 * @returns {Array} Array de objetos con key y name de cada plantilla
 */
export function getTemplateOptions() {
  return Object.entries(EMAIL_TEMPLATES).map(([key, template]) => ({
    key,
    name: template.name,
  }));
}
