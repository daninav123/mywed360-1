const mockInbox = [
  {
    id: 'email001',
    from: 'proveedor@florista.com',
    to: 'maria.garcia@maloveapp.com',
    subject: 'Presupuesto de flores para boda',
    body: `<p>Estimada María,</p><p>Adjunto el presupuesto para las flores de tu boda.</p><p>Saludos cordiales,<br/>Floristas Bella</p>`,
    attachments: [
      {
        name: 'presupuesto.pdf',
        url: 'https://example.com/presupuesto.pdf',
        size: 1024,
        type: 'application/pdf',
      },
    ],
    date: '2025-07-10T14:32:15.000Z',
    read: false,
    starred: false,
    folder: 'inbox',
    tags: ['tag1'],
  },
  {
    id: 'email002',
    from: 'fotografia@capturamos.com',
    to: 'maria.garcia@maloveapp.com',
    subject: 'Catálogo de fotos',
    body: `<p>Hola María,</p><p>Te enviamos nuestro catálogo de fotografías.</p>`,
    attachments: [],
    date: '2025-07-09T10:15:30.000Z',
    read: true,
    starred: true,
    folder: 'inbox',
    tags: ['tag2'],
  },
  {
    id: 'email003',
    from: 'catering@delicioso.com',
    to: 'maria.garcia@maloveapp.com',
    subject: 'Menús disponibles',
    body: `<p>Buenas tardes,</p><p>Te adjunto los diferentes menús disponibles para tu evento.</p>`,
    attachments: [
      {
        name: 'menu-bodas-2025.pdf',
        url: 'https://example.com/menus.pdf',
        size: 2048,
        type: 'application/pdf',
      },
      {
        name: 'opciones-vegetarianas.docx',
        url: 'https://example.com/vegetarianas.docx',
        size: 1536,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    ],
    date: '2025-07-08T16:45:22.000Z',
    read: true,
    starred: false,
    folder: 'inbox',
    tags: ['tag1', 'tag3'],
  },
  {
    id: 'email004',
    from: 'vestidos@elegancia.com',
    to: 'maria.garcia@maloveapp.com',
    subject: 'Confirmación de cita para prueba',
    body: `<p>Estimada María:</p><p>Te confirmamos la cita para la prueba del vestido el día 20 de julio a las 16:00h.</p>`,
    attachments: [],
    date: '2025-07-07T09:30:10.000Z',
    read: false,
    starred: true,
    folder: 'inbox',
    tags: [],
  },
  {
    id: 'email005',
    from: 'local@jardines.com',
    to: 'maria.garcia@maloveapp.com',
    subject: 'Presupuesto actualizado para reserva',
    body: `<p>Hola María,</p><p>Te enviamos el presupuesto actualizado para la reserva del jardín.</p>`,
    attachments: [
      {
        name: 'presupuesto-jardin.pdf',
        url: 'https://example.com/jardin.pdf',
        size: 1024,
        type: 'application/pdf',
      },
    ],
    date: '2025-07-06T11:20:45.000Z',
    read: true,
    starred: false,
    folder: 'inbox',
    tags: ['tag1'],
  },
  {
    id: 'email006',
    from: 'eventos@coordinacion.com',
    to: 'maria.garcia@maloveapp.com',
    subject: 'Planificación de eventos - Confirmación',
    body: `<p>Estimados novios:</p><p>Les confirmamos la recepción del pago inicial para la coordinación del evento.</p>`,
    attachments: [
      {
        name: 'recibo-pago.pdf',
        url: 'https://example.com/recibo.pdf',
        size: 512,
        type: 'application/pdf',
      },
    ],
    date: '2025-07-05T15:10:30.000Z',
    read: true,
    starred: false,
    folder: 'inbox',
    tags: ['tag2'],
  },
  {
    id: 'email007',
    from: 'invitaciones@papeleria.com',
    to: 'maria.garcia@maloveapp.com',
    subject: 'Diseños personalizados para invitaciones',
    body: `<p>Buenas tardes María,</p><p>Te adjunto los diseños personalizados para las invitaciones que solicitaste.</p>`,
    attachments: [
      {
        name: 'diseño1.jpg',
        url: 'https://example.com/diseno1.jpg',
        size: 2048,
        type: 'image/jpeg',
      },
      {
        name: 'diseño2.jpg',
        url: 'https://example.com/diseno2.jpg',
        size: 2048,
        type: 'image/jpeg',
      },
      {
        name: 'diseño3.jpg',
        url: 'https://example.com/diseno3.jpg',
        size: 2048,
        type: 'image/jpeg',
      },
    ],
    date: '2025-07-04T14:25:40.000Z',
    read: false,
    starred: true,
    folder: 'inbox',
    tags: ['tag3'],
  },
  {
    id: 'email008',
    from: 'musica@melodias.com',
    to: 'maria.garcia@maloveapp.com',
    subject: 'Lista de canciones propuestas',
    body: `<p>Hola María y Juan,</p><p>Les envío la lista de canciones propuestas para su evento basada en sus preferencias.</p>`,
    attachments: [
      {
        name: 'repertorio-bodas.xlsx',
        url: 'https://example.com/repertorio.xlsx',
        size: 1024,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ],
    date: '2025-07-03T18:50:15.000Z',
    read: true,
    starred: false,
    folder: 'inbox',
    tags: [],
  },
  {
    id: 'email009',
    from: 'transporte@viajes.com',
    to: 'maria.garcia@maloveapp.com',
    subject: 'Confirmación de reserva de transporte',
    body: `<p>Estimada María:</p><p>Le confirmamos la reserva de los vehículos para el transporte de invitados.</p>`,
    attachments: [],
    date: '2025-07-02T10:35:20.000Z',
    read: true,
    starred: false,
    folder: 'inbox',
    tags: ['tag2'],
  },
  {
    id: 'email010',
    from: 'alojamiento@hotel.com',
    to: 'maria.garcia@maloveapp.com',
    subject: 'Bloque de habitaciones reservado',
    body: `<p>Buenas tardes,</p><p>Le informamos que el bloque de habitaciones para sus invitados ha sido reservado correctamente.</p>`,
    attachments: [
      {
        name: 'confirmacion-reserva.pdf',
        url: 'https://example.com/reserva-hotel.pdf',
        size: 1024,
        type: 'application/pdf',
      },
    ],
    date: '2025-07-01T12:40:55.000Z',
    read: false,
    starred: false,
    folder: 'inbox',
    tags: ['tag1'],
  },
];

const mockSent = [
  {
    id: 'email101',
    from: 'maria.garcia@maloveapp.com',
    to: 'proveedor@florista.com',
    subject: 'Re: Presupuesto de flores para boda',
    body: `<p>Estimada Florista Bella,</p><p>Gracias por el presupuesto. Me gustaría consultar si es posible modificar las cantidades de rosas blancas.</p><p>Saludos cordiales,<br/>María García</p>`,
    attachments: [],
    date: '2025-07-11T09:15:22.000Z',
    read: true,
    starred: false,
    folder: 'sent',
    tags: [],
  },
  {
    id: 'email102',
    from: 'maria.garcia@maloveapp.com',
    to: 'invitados@listado.com',
    subject: 'Información importante sobre la boda',
    body: `<p>Queridos invitados,</p><p>Os enviamos información importante sobre la celebración de nuestra boda.</p><p>Saludos,<br/>María y Juan</p>`,
    attachments: [
      {
        name: 'info-boda.pdf',
        url: 'https://example.com/info-boda.pdf',
        size: 1536,
        type: 'application/pdf',
      },
    ],
    date: '2025-07-10T18:40:35.000Z',
    read: true,
    starred: false,
    folder: 'sent',
    tags: ['tag4'],
  },
  {
    id: 'email103',
    from: 'maria.garcia@maloveapp.com',
    to: 'musica@melodias.com',
    subject: 'Consulta sobre repertorio',
    body: `<p>Buenas tardes,</p><p>Hemos revisado el repertorio propuesto y nos gustaría hacer algunas modificaciones.</p><p>Saludos,<br/>María García</p>`,
    attachments: [
      {
        name: 'cambios-repertorio.docx',
        url: 'https://example.com/cambios-repertorio.docx',
        size: 512,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    ],
    date: '2025-07-09T14:25:10.000Z',
    read: true,
    starred: false,
    folder: 'sent',
    tags: [],
  },
  {
    id: 'email104',
    from: 'maria.garcia@maloveapp.com',
    to: 'catering@delicioso.com',
    subject: 'Confirmación de menú',
    body: `<p>Estimado equipo de catering,</p><p>Después de revisar las opciones, confirmamos la selección del menú número 3 con las modificaciones acordadas.</p><p>Saludos cordiales,<br/>María García</p>`,
    attachments: [],
    date: '2025-07-08T11:30:45.000Z',
    read: true,
    starred: true,
    folder: 'sent',
    tags: ['tag2'],
  },
  {
    id: 'email105',
    from: 'maria.garcia@maloveapp.com',
    to: 'alojamiento@hotel.com',
    subject: 'Confirmación de reserva',
    body: `<p>Buenos días,</p><p>Confirmamos la reserva del bloque de habitaciones según el presupuesto enviado.</p><p>Saludos,<br/>María García</p>`,
    attachments: [],
    date: '2025-07-07T10:15:30.000Z',
    read: true,
    starred: false,
    folder: 'sent',
    tags: ['tag1'],
  },
];

const mockTrash = [
  {
    id: 'email201',
    from: 'newsletter@moda.com',
    to: 'maria.garcia@maloveapp.com',
    subject: 'Ofertas de temporada',
    body: `<p>Descubre las nuevas ofertas de vestidos para invitadas.</p>`,
    attachments: [],
    date: '2025-06-20T09:01:00.000Z',
    read: true,
    starred: false,
    folder: 'trash',
    tags: [],
  },
  {
    id: 'email202',
    from: 'spam@random.com',
    to: 'maria.garcia@maloveapp.com',
    subject: 'Gana un viaje a la playa',
    body: `<p>Participa en nuestro sorteo y gana un viaje.</p>`,
    attachments: [],
    date: '2025-06-18T08:15:10.000Z',
    read: false,
    starred: false,
    folder: 'trash',
    tags: [],
  },
];

const mockTags = [
  { id: 'tag1', name: 'Urgente', color: '#FF5733', systemTag: true },
  { id: 'tag2', name: 'Proveedores', color: '#33FF57', systemTag: false },
  { id: 'tag3', name: 'Presupuestos', color: '#3357FF', systemTag: false },
  { id: 'tag4', name: 'Invitados', color: '#F3FF33', systemTag: false },
  { id: 'tag5', name: 'Decoración', color: '#FF33F3', systemTag: false },
];

const mockTemplates = [
  {
    id: 'template-01',
    name: 'Confirmación proveedor',
    category: 'Proveedores',
    subjectTemplate: 'Confirmación de colaboración - [Proveedor]',
    messageTemplate:
      'Hola [Proveedor],\n\nConfirmamos la colaboración para [Servicio]. Adjunto los detalles acordados.\n\nGracias,\nMaría',
  },
  {
    id: 'template-02',
    name: 'Recordatorio invitados',
    category: 'Invitados',
    subjectTemplate: 'Detalles importantes de la boda',
    messageTemplate:
      'Hola [Nombre],\n\nQueríamos recordarte que la boda se celebrará el [Fecha] en [Lugar].\n\n¡Te esperamos!',
  },
  {
    id: 'template-03',
    name: 'Solicitud de presupuesto',
    category: 'Proveedores',
    subjectTemplate: 'Solicitud de presupuesto para [Servicio]',
    messageTemplate:
      'Hola [Proveedor],\n\nEstamos interesados en recibir un presupuesto para [Servicio]. ¿Podrías indicarnos disponibilidad y precios?\n\nGracias,\nMaría',
  },
];

const customFolderMailMap = {
  folder1: [mockInbox[0], mockSent[0]],
  folder2: [mockInbox[6]],
};

const mockCustomFolders = [
  { id: 'folder1', name: 'Proveedores', unread: 1, system: false },
  { id: 'folder2', name: 'Ideas', unread: 0, system: false },
];

function cloneMail(mail) {
  return JSON.parse(JSON.stringify(mail));
}

export function getMockMailDataset() {
  return {
    inbox: mockInbox.map(cloneMail),
    sent: mockSent.map(cloneMail),
    trash: mockTrash.map(cloneMail),
    customFolders: Object.fromEntries(
      Object.entries(customFolderMailMap).map(([key, value]) => [key, value.map(cloneMail)])
    ),
    templates: mockTemplates.map((tpl) => ({ ...tpl })),
    tags: mockTags.map((tag) => ({ ...tag })),
  };
}

export function getMockMails(folder = 'inbox') {
  if (!folder || folder === 'inbox') return mockInbox.map(cloneMail);
  if (folder === 'sent') return mockSent.map(cloneMail);
  if (folder === 'trash') return mockTrash.map(cloneMail);
  if (folder.startsWith('custom:')) {
    const id = folder.slice(7);
    return (customFolderMailMap[id] || []).map(cloneMail);
  }
  return [];
}

export function findMockMailById(id) {
  if (!id) return null;
  const all = [...mockInbox, ...mockSent, ...mockTrash, ...Object.values(customFolderMailMap).flat()];
  const found = all.find((mail) => mail.id === id);
  return found ? cloneMail(found) : null;
}

export function getMockTemplates() {
  return mockTemplates.map((tpl) => ({ ...tpl }));
}

export const mockCustomFolderList = mockCustomFolders.map((folder) => ({ ...folder }));

export const mockTagList = mockTags.map((tag) => ({ ...tag }));

