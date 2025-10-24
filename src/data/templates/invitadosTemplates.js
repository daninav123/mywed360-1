/**
 * Plantillas de email predefinidas para comunicaci�n con invitados
 */

const invitadosTemplates = [
  {
    id: 'template_invitados_info_1',
    name: 'Informaci�n inicial y save the date',
    category: 'Invitados - Informaci�n',
    subject: 'Save the Date - Nuestra boda el {{fecha_boda}}',
    body: `
Querido/a {{nombre_invitado}},

�Nos casamos! Y queremos que formes parte de este d�a tan especial.

Te escribimos para que reserves la fecha del {{fecha_boda}}, d�a en que celebraremos nuestra boda en {{lugar_boda}}.

En las pr�ximas semanas recibir�s la invitaci�n oficial con todos los detalles del evento, pero quer�amos que fueras de los primeros en conocer la noticia y apartar la fecha en tu agenda.

Estamos muy ilusionados de poder compartir este momento tan importante con las personas que queremos.

Con cari�o,
{{nombre_novios}}
    `,
    isSystem: true,
    variables: ['nombre_invitado', 'fecha_boda', 'lugar_boda', 'nombre_novios'],
  },
  {
    id: 'template_invitados_info_2',
    name: 'Invitaci�n formal',
    category: 'Invitados - Informaci�n',
    subject: 'Invitaci�n a nuestra boda - {{fecha_boda}}',
    body: `
Querido/a {{nombre_invitado}},

Tenemos el placer de invitarte formalmente a nuestra ceremonia de boda que se celebrar� el {{fecha_boda}} a las {{hora_ceremonia}} en {{lugar_ceremonia}}.

Despu�s de la ceremonia, la celebraci�n continuar� en {{lugar_recepcion}} a partir de las {{hora_recepcion}}.

Informaci�n importante:
- C�digo de vestimenta: {{codigo_vestimenta}}
- Confirmaci�n de asistencia: Por favor, confirma tu asistencia antes del {{fecha_limite_confirmacion}}
- Alojamiento: {{informacion_alojamiento}}
- C�mo llegar: {{informacion_transporte}}

Si tienes alguna restricci�n alimentaria o necesidad especial, h�zmelo saber lo antes posible para poder tenerlo en cuenta.

Esperamos poder compartir este d�a tan especial contigo.

Con mucho cari�o,
{{nombre_novios}}

P.D.: Hemos creado un sitio web con toda la informaci�n detallada sobre la boda. Puedes visitarlo aqu�: {{enlace_web_boda}}
    `,
    isSystem: true,
    variables: [
      'nombre_invitado',
      'fecha_boda',
      'hora_ceremonia',
      'lugar_ceremonia',
      'lugar_recepcion',
      'hora_recepcion',
      'codigo_vestimenta',
      'fecha_limite_confirmacion',
      'informacion_alojamiento',
      'informacion_transporte',
      'nombre_novios',
      'enlace_web_boda',
    ],
  },
  {
    id: 'template_invitados_info_3',
    name: 'Informaci�n sobre lista de bodas',
    category: 'Invitados - Informaci�n',
    subject: 'Informaci�n sobre nuestra lista de bodas',
    body: `
Querido/a {{nombre_invitado}},

Muchas gracias por confirmar tu asistencia a nuestra boda el pr�ximo {{fecha_boda}}. Estamos muy ilusionados de poder contar con tu presencia en este d�a tan especial.

Como respuesta a las preguntas que algunos nos hab�is hecho sobre regalos, hemos creado una lista de bodas que puedes consultar a trav�s del siguiente enlace:

{{enlace_lista_bodas}}

Por supuesto, tu presencia es el mejor regalo que podemos recibir, as� que no sientas ninguna obligaci�n. Lo m�s importante para nosotros es poder compartir este d�a contigo.

Si tienes cualquier duda, no dudes en contactarnos.

Con cari�o,
{{nombre_novios}}
    `,
    isSystem: true,
    variables: ['nombre_invitado', 'fecha_boda', 'enlace_lista_bodas', 'nombre_novios'],
  },
  {
    id: 'template_invitados_recordatorio_1',
    name: 'Recordatorio de confirmaci�n',
    category: 'Invitados - Recordatorio',
    subject: 'Recordatorio: Confirmaci�n de asistencia a nuestra boda',
    body: `
Querido/a {{nombre_invitado}},

Esperamos que te encuentres bien. Te escribimos porque la fecha de nuestra boda ({{fecha_boda}}) se acerca y estamos finalizando los preparativos.

Nos gustar�a saber si podr�s acompa�arnos en este d�a tan especial. Si a�n no has confirmado tu asistencia, �podr�as hacerlo antes del {{fecha_limite_confirmacion}}? Puedes responder a este email o utilizar el siguiente enlace:

{{enlace_confirmacion}}

Tu respuesta nos ayudar� mucho con la organizaci�n final del evento.

Si tienes alguna restricci�n alimentaria o necesidad especial, por favor h�zmelo saber.

�Gracias por tu atenci�n!

Con cari�o,
{{nombre_novios}}
    `,
    isSystem: true,
    variables: [
      'nombre_invitado',
      'fecha_boda',
      'fecha_limite_confirmacion',
      'enlace_confirmacion',
      'nombre_novios',
    ],
  },
  {
    id: 'template_invitados_recordatorio_2',
    name: 'Recordatorio final con detalles',
    category: 'Invitados - Recordatorio',
    subject: 'Recordatorio y detalles finales - Nuestra boda este {{dia_semana}}',
    body: `
Querido/a {{nombre_invitado}},

�Ya queda muy poco para nuestra boda! Este {{dia_semana}} {{fecha_boda}} por fin celebraremos nuestro gran d�a y estamos muy ilusionados de poder compartirlo contigo.

Quer�a recordarte los detalles m�s importantes:

- Ceremonia: {{hora_ceremonia}} en {{lugar_ceremonia}}
- Recepci�n: {{hora_recepcion}} en {{lugar_recepcion}}
- C�digo de vestimenta: {{codigo_vestimenta}}
- Aparcamiento: {{informacion_aparcamiento}}
- Previsi�n meteorol�gica: {{prevision_tiempo}}

Si necesitas cualquier indicaci�n adicional o tienes alguna duda de �ltima hora, no dudes en contactarnos.

�Estamos deseando verte y celebrar juntos!

Con mucha ilusi�n,
{{nombre_novios}}
    `,
    isSystem: true,
    variables: [
      'nombre_invitado',
      'dia_semana',
      'fecha_boda',
      'hora_ceremonia',
      'lugar_ceremonia',
      'hora_recepcion',
      'lugar_recepcion',
      'codigo_vestimenta',
      'informacion_aparcamiento',
      'prevision_tiempo',
      'nombre_novios',
    ],
  },
  {
    id: 'template_invitados_agradecimiento',
    name: 'Agradecimiento post-boda',
    category: 'Invitados - Informaci�n',
    subject: 'Gracias por compartir nuestro d�a especial',
    body: `
Querido/a {{nombre_invitado}},

Queremos expresar nuestro m�s sincero agradecimiento por haber sido parte de nuestra boda el pasado {{fecha_boda}}. Tu presencia y cari�o hicieron de este d�a algo verdaderamente memorable para nosotros.

{{agradecimiento_regalo}}

Estamos muy felices de haber podido compartir este momento tan importante de nuestras vidas con las personas que m�s queremos.

En las pr�ximas semanas compartiremos algunas fotos del evento.

Con todo nuestro cari�o y gratitud,
{{nombre_novios}}
    `,
    isSystem: true,
    variables: ['nombre_invitado', 'fecha_boda', 'agradecimiento_regalo', 'nombre_novios'],
  },
];

export default invitadosTemplates;
