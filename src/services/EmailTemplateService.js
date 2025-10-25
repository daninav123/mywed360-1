import i18n from '../i18n';

/**
 * Servicio para gestionar plantillas de correo electrónico para diferentes tipos de proveedores
 * y contextos de búsqueda AI.
 */
class EmailTemplateService {
  /**
   * Construye el servicio de plantillas de correo
   */
  constructor() {
    this.templates = {};
    this.loadDefaultTemplates();
  }

  /**
   * Carga las plantillas predeterminadas para diferentes categorías de proveedores
   * @private
   */
  loadDefaultTemplates() {
    // Plantillas base por categoría de proveedor
    this.templates = {
      fotografía: {
        subject: i18n.t('common.consulta_sobre_servicios_fotografia_para_boda'),
        body: `
Hola {providerName},

Estoy organizando mi boda y me ha llamado la atención su trabajo como fotógrafo. {aiInsight}

Me gustaría consultarle sobre:
- Disponibilidad para el {date} (fecha provisional)
- Su estilo y enfoque fotográfico
- Paquetes y precios que ofrece
- Proceso de reserva

Busco específicamente: {searchQuery}

¿Podría proporcionarme información más detallada? Si lo prefiere, también podríamos concertar una llamada.

Gracias de antemano,
{userName}
        `,
      },
      catering: {
        subject: i18n.t('common.informacion_sobre_servicios_catering_para_boda'),
        body: `
Hola {providerName},

Estoy en proceso de planificación de mi boda y estoy interesado/a en sus servicios de catering. {aiInsight}

Me gustaría obtener información sobre:
- Menús disponibles y opciones especiales (vegetarianas, alergias, etc.)
- Capacidad de servicio para aproximadamente {guests} invitados
- Costes estimados y opciones de personalización
- Degustación de menú y proceso de reserva

Estoy especialmente interesado/a en: {searchQuery}

¿Podría enviarme información detallada de sus servicios? También me interesaría conocer su disponibilidad para la fecha {date}.

Muchas gracias,
{userName}
        `,
      },
      florista: {
        subject: i18n.t('common.consulta_sobre_decoracion_floral_para_boda'),
        body: `
Hola {providerName},

Estoy organizando mi boda y me gustaría consultar sobre sus servicios de decoración floral. {aiInsight}

Me interesa conocer:
- Estilos y opciones de arreglos florales para ceremonia y recepción
- Disponibilidad para la fecha {date}
- Presupuesto aproximado y opciones según diferentes rangos de precio
- Proceso de diseño y planificación

Mi idea para la decoración floral es: {searchQuery}

¿Sería posible concertar una cita para hablar sobre estas ideas en mayor detalle?

Atentamente,
{userName}
        `,
      },
      música: {
        subject: i18n.t('common.solicitud_informacion_sobre_servicios_musicales_para'),
        body: `
Hola {providerName},

Estamos organizando nuestra boda y nos gustaría contar con su música para el evento. {aiInsight}

Nos interesaría conocer:
- Su repertorio y estilos musicales
- Disponibilidad para el {date}
- Equipamiento y necesidades técnicas
- Duración de las actuaciones y precios

Estamos buscando específicamente: {searchQuery}

¿Sería posible obtener esta información y quizás algunos ejemplos de su trabajo?

Saludos cordiales,
{userName}
        `,
      },
      local: {
        subject: 'Consulta sobre disponibilidad de espacio para boda - {providerName}i18n.t('common.body_hola_providername_estamos_proceso_elegir')Consulta sobre servicios para boda - {providerName}i18n.t('common.body_hola_providername_estoy_organizando_boda')NFD')
          .replace(/[\u0300-\u036f]/g, '')
      : 'i18n.t('common.buscar_plantilla_especifica_devolver_general_normalizedcategoryincludes')foto') || normalizedCategory.includes('fotograi18n.t('common.return_thistemplatesfotografia_else_normalizedcategoryincludes')catering') ||
      normalizedCategory.includes('comida') ||
      normalizedCategory.includes('gastronomia')
    ) {
      return this.templates.catering;
    } else if (
      normalizedCategory.includes('flor') ||
      normalizedCategory.includes('florista') ||
      normalizedCategory.includes('decoracion floral')
    ) {
      return this.templates.florista;
    } else if (
      normalizedCategory.includes('music') ||
      normalizedCategory.includes('dj') ||
      normalizedCategory.includes('bandai18n.t('common.return_thistemplatesmusica_else_normalizedcategoryincludes')local') ||
      normalizedCategory.includes('finca') ||
      normalizedCategory.includes('salon') ||
      normalizedCategory.includes('espacioi18n.t('common.return_thistemplateslocal_plantilla_generica_por_defecto')g');
      result = result.replace(regex, data[key] || 'i18n.t('common.return_result_registra_analiza_uso_plantillas')Template usage logged:', {
      category,
      aiResultId: aiResult?.id,
      wasCustomized,
    });
  }
}

export default EmailTemplateService;
