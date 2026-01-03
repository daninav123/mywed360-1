/**
 * Plantillas de email espec�ficas para seguimiento de eventos y tareas de la boda
 */

const seguimientoTemplates = [
  {
    id: 'template_seguimiento_tareas_1',
    name: 'Seguimiento de tareas pendientes',
    category: 'Seguimiento',
    subject: 'Seguimiento de tareas pendientes - Boda {{fecha_boda}}',
    body: `
Hola {{nombre_destinatario}},

Espero que todo vaya bien con los preparativos de la boda. Te escribo para hacer un seguimiento de las tareas pendientes que hab�amos acordado:

TAREAS PENDIENTES:
- {{tarea_1}}: Fecha l�mite {{fecha_limite_1}}
- {{tarea_2}}: Fecha l�mite {{fecha_limite_2}}
- {{tarea_3}}: Fecha l�mite {{fecha_limite_3}}

�Podr�as confirmarme el estado de estas tareas? Si hay alg�n problema o retraso, av�same lo antes posible para poder buscar alternativas.

Si necesitas ayuda con alguna de estas tareas, por favor h�zmelo saber.

Gracias por tu atenci�n.

Saludos,
{{nombre_remitente}}
    `,
    isSystem: true,
    variables: [
      'nombre_destinatario',
      'fecha_boda',
      'tarea_1',
      'fecha_limite_1',
      'tarea_2',
      'fecha_limite_2',
      'tarea_3',
      'fecha_limite_3',
      'nombre_remitente',
    ],
  },
  {
    id: 'template_seguimiento_confirmacion_1',
    name: 'Seguimiento de confirmaciones',
    category: 'Seguimiento',
    subject: 'Recordatorio: Confirmaciones pendientes de invitados',
    body: `
Hola {{nombre_destinatario}},

Quer�a comentarte que a�n tenemos {{numero_pendientes}} invitados pendientes de confirmar su asistencia a nuestra boda del {{fecha_boda}}.

Lista de invitados pendientes de confirmaci�n:
{{lista_invitados_pendientes}}

�Podr�as ayudarme a contactar con los siguientes invitados para confirmar su asistencia?
{{invitados_asignados}}

Necesitamos tener todas las confirmaciones antes del {{fecha_limite_confirmaciones}} para poder cerrar el n�mero final con el catering y la distribuci�n de las mesas.

Muchas gracias por tu ayuda.

Un abrazo,
{{nombre_remitente}}
    `,
    isSystem: true,
    variables: [
      'nombre_destinatario',
      'numero_pendientes',
      'fecha_boda',
      'lista_invitados_pendientes',
      'invitados_asignados',
      'fecha_limite_confirmaciones',
      'nombre_remitente',
    ],
  },
  {
    id: 'template_seguimiento_pagos_1',
    name: 'Seguimiento de pagos a proveedores',
    category: 'Seguimiento',
    subject: 'Seguimiento de pagos pendientes - Boda {{fecha_boda}}',
    body: `
Hola {{nombre_destinatario}},

Te escribo para llevar un seguimiento de los pagos pendientes a proveedores para nuestra boda del {{fecha_boda}}.

ESTADO DE PAGOS:
- {{proveedor_1}}: {{estado_pago_1}} - Fecha l�mite pr�ximo pago: {{fecha_pago_1}} - Importe: {{importe_1}}
- {{proveedor_2}}: {{estado_pago_2}} - Fecha l�mite pr�ximo pago: {{fecha_pago_2}} - Importe: {{importe_2}}
- {{proveedor_3}}: {{estado_pago_3}} - Fecha l�mite pr�ximo pago: {{fecha_pago_3}} - Importe: {{importe_3}}

Pagos realizados hasta la fecha: {{total_pagado}}
Pagos pendientes: {{total_pendiente}}

�Podemos revisar juntos estos pagos para asegurarnos de que cumplimos con los plazos acordados?

Gracias por tu atenci�n.

Un saludo,
{{nombre_remitente}}
    `,
    isSystem: true,
    variables: [
      'nombre_destinatario',
      'fecha_boda',
      'proveedor_1',
      'estado_pago_1',
      'fecha_pago_1',
      'importe_1',
      'proveedor_2',
      'estado_pago_2',
      'fecha_pago_2',
      'importe_2',
      'proveedor_3',
      'estado_pago_3',
      'fecha_pago_3',
      'importe_3',
      'total_pagado',
      'total_pendiente',
      'nombre_remitente',
    ],
  },
  {
    id: 'template_seguimiento_despedida_1',
    name: 'Organizaci�n despedida de soltero/a',
    category: 'Seguimiento',
    subject: 'Organizaci�n despedida de {{tipo_despedida}}',
    body: `
Hola a todos/as,

Como sab�is, estamos organizando la despedida de {{tipo_despedida}} de {{nombre_homenajeado/a}} y quer�a hacer un seguimiento de los preparativos.

Fecha de la despedida: {{fecha_despedida}}
Lugar: {{lugar_despedida}}
Presupuesto por persona: {{presupuesto_persona}}

ESTADO ACTUAL:
- Confirmados: {{numero_confirmados}}
- Pendientes de confirmar: {{numero_pendientes}}
- Actividades confirmadas: {{actividades_confirmadas}}
- Pendiente de organizar: {{pendiente_organizar}}

Si alguien tiene alguna sugerencia o idea para a�adir a la planificaci�n, por favor hac�dmelo saber. Tambi�n necesitamos confirmar el pago de las reservas antes del {{fecha_limite_pago}}.

Para los que a�n no hab�is confirmado, por favor hacedlo antes del {{fecha_limite_confirmacion}} para poder cerrar todos los detalles.

�Gracias a todos por vuestra colaboraci�n!

Un abrazo,
{{nombre_organizador/a}}
    `,
    isSystem: true,
    variables: [
      'tipo_despedida',
      'nombre_homenajeado/a',
      'fecha_despedida',
      'lugar_despedida',
      'presupuesto_persona',
      'numero_confirmados',
      'numero_pendientes',
      'actividades_confirmadas',
      'pendiente_organizar',
      'fecha_limite_pago',
      'fecha_limite_confirmacion',
      'nombre_organizador/a',
    ],
  },
  {
    id: 'template_seguimiento_regalos_1',
    name: 'Seguimiento de regalos recibidos',
    category: 'Seguimiento',
    subject: 'Registro de regalos recibidos - Boda {{fecha_boda}}',
    body: `
Hola {{nombre_destinatario}},

Estoy actualizando el registro de los regalos que hemos recibido para nuestra boda. Hasta el momento hemos recibido:

REGALOS F�SICOS:
{{lista_regalos_fisicos}}

TRANSFERENCIAS/INGRESOS:
{{lista_transferencias}}

REGALOS PENDIENTES DE LISTA DE BODAS:
{{lista_pendientes}}

�Podr�as revisar si tienes constancia de alg�n otro regalo que no est� en esta lista? Quiero asegurarme de que agradecemos correctamente a todos los invitados que han tenido el detalle de hacernos un regalo.

Tambi�n necesito que confirmemos las direcciones postales de {{invitados_sin_direccion}} para poder enviarles la tarjeta de agradecimiento.

Gracias por tu ayuda con esto.

Un abrazo,
{{nombre_remitente}}
    `,
    isSystem: true,
    variables: [
      'nombre_destinatario',
      'fecha_boda',
      'lista_regalos_fisicos',
      'lista_transferencias',
      'lista_pendientes',
      'invitados_sin_direccion',
      'nombre_remitente',
    ],
  },
  {
    id: 'template_seguimiento_timing_1',
    name: 'Confirmaci�n de timing del evento',
    category: 'Seguimiento',
    subject: 'Confirmaci�n de horarios - Boda {{fecha_boda}}',
    body: `
Estimado/a {{nombre_proveedor}},

Me pongo en contacto para confirmar los horarios de todos los servicios para nuestra boda del {{fecha_boda}}:

TIMING GENERAL DEL EVENTO:
- Llegada de los novios: {{hora_llegada_novios}}
- Ceremonia: {{hora_ceremonia}}
- C�ctel: {{hora_coctel}}
- Banquete: {{hora_banquete}}
- Baile: {{hora_baile}}
- Finalizaci�n del evento: {{hora_fin}}

En relaci�n a vuestro servicio de {{servicio_proveedor}}, quer�amos confirmar que:
- Hora de montaje: {{hora_montaje}}
- Hora de inicio del servicio: {{hora_inicio_servicio}}
- Hora de finalizaci�n del servicio: {{hora_fin_servicio}}
- Hora de desmontaje: {{hora_desmontaje}}

�Son correctos estos horarios seg�n lo acordado? Si hay alg�n ajuste necesario, por favor h�zmelo saber lo antes posible para poder coordinarlo con el resto de proveedores.

Agradezco de antemano tu confirmaci�n.

Un cordial saludo,
{{nombre_cliente}}
{{telefono_cliente}}
    `,
    isSystem: true,
    variables: [
      'nombre_proveedor',
      'fecha_boda',
      'hora_llegada_novios',
      'hora_ceremonia',
      'hora_coctel',
      'hora_banquete',
      'hora_baile',
      'hora_fin',
      'servicio_proveedor',
      'hora_montaje',
      'hora_inicio_servicio',
      'hora_fin_servicio',
      'hora_desmontaje',
      'nombre_cliente',
      'telefono_cliente',
    ],
  },
];

export default seguimientoTemplates;
