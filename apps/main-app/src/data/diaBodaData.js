/**
 * Día de Boda Data - Checklist y timeline del día
 * FASE 7.1 del WORKFLOW-USUARIO.md
 */

export const MOMENTOS_DIA = [
  {
    id: 'manana',
    nombre: 'Mañana (Preparación)',
    icon: '🌅',
    horaInicio: '08:00',
    horaFin: '13:00'
  },
  {
    id: 'tarde-previa',
    nombre: 'Tarde (Pre-Ceremonia)',
    icon: '☀️',
    horaInicio: '13:00',
    horaFin: '17:00'
  },
  {
    id: 'ceremonia',
    nombre: 'Ceremonia',
    icon: '💒',
    horaInicio: '17:00',
    horaFin: '18:30'
  },
  {
    id: 'coctel',
    nombre: 'Cóctel',
    icon: '🍸',
    horaInicio: '18:30',
    horaFin: '20:30'
  },
  {
    id: 'banquete',
    nombre: 'Banquete',
    icon: '🍽️',
    horaInicio: '20:30',
    horaFin: '00:00'
  },
  {
    id: 'fiesta',
    nombre: 'Fiesta',
    icon: '💃',
    horaInicio: '00:00',
    horaFin: '05:00'
  }
];

export const CHECKLIST_DEFAULT = {
  manana: [
    { texto: 'Desayuno ligero y saludable', importante: true },
    { texto: 'Ducha y cuidado personal', importante: true },
    { texto: 'Peluquería y maquillaje novia', importante: true },
    { texto: 'Arreglo personal novio', importante: true },
    { texto: 'Vestir traje/vestido', importante: true },
    { texto: 'Fotos de preparación', importante: false },
    { texto: 'Kit de emergencia preparado', importante: true },
    { texto: 'Revisión bolsos y complementos', importante: true },
    { texto: 'Alianzas verificadas', importante: true },
    { texto: 'Documentos necesarios', importante: true }
  ],
  'tarde-previa': [
    { texto: 'Llegada al lugar de ceremonia', importante: true },
    { texto: 'Coordinación con fotógrafo', importante: true },
    { texto: 'Revisión decoración ceremonia', importante: false },
    { texto: 'Ubicación de invitados VIP', importante: false },
    { texto: 'Prueba de sonido música', importante: true },
    { texto: 'Llegada de padrinos/damas', importante: true },
    { texto: 'Fotos previas a ceremonia', importante: false },
    { texto: 'Últimos retoques maquillaje', importante: false },
    { texto: 'Revisar orden de entrada', importante: true }
  ],
  ceremonia: [
    { texto: 'Entrada de invitados', importante: true },
    { texto: 'Entrada de padrinos/damas', importante: true },
    { texto: 'Entrada de novios', importante: true },
    { texto: 'Ceremonia (votos)', importante: true },
    { texto: 'Intercambio de anillos', importante: true },
    { texto: 'Beso de novios', importante: true },
    { texto: 'Salida de novios', importante: true },
    { texto: 'Foto grupal', importante: false },
    { texto: 'Arroz/pétalos', importante: false },
    { texto: 'Libro de firmas', importante: false }
  ],
  coctel: [
    { texto: 'Recepción de invitados', importante: true },
    { texto: 'Servicio de catering', importante: true },
    { texto: 'Música ambiente', importante: false },
    { texto: 'Fotos con invitados', importante: false },
    { texto: 'Sesión fotos novios', importante: true },
    { texto: 'Preparación entrada banquete', importante: true }
  ],
  banquete: [
    { texto: 'Entrada novios al salón', importante: true },
    { texto: 'Aperitivo/entrantes', importante: true },
    { texto: 'Primer plato', importante: true },
    { texto: 'Segundo plato', importante: true },
    { texto: 'Discursos y brindis', importante: true },
    { texto: 'Tarta nupcial', importante: true },
    { texto: 'Primer baile', importante: true },
    { texto: 'Café y postres', importante: false },
    { texto: 'Barra libre inicio', importante: false }
  ],
  fiesta: [
    { texto: 'Apertura pista de baile', importante: true },
    { texto: 'Baile con invitados', importante: false },
    { texto: 'Lanzamiento de ramo', importante: false },
    { texto: 'Lanzamiento de liga', importante: false },
    { texto: 'Photobooth/photocall', importante: false },
    { texto: 'Barra libre', importante: false },
    { texto: 'Sorpresas/animación', importante: false },
    { texto: 'Cierre fiesta', importante: true },
    { texto: 'Despedida invitados', importante: true }
  ]
};

export const CONTACTOS_EMERGENCIA_DEFAULT = [
  { nombre: 'Coordinador/a de boda', rol: 'Coordinación', telefono: '', importante: true },
  { nombre: 'Lugar ceremonia', rol: 'Ceremonias', telefono: '', importante: true },
  { nombre: 'Lugar banquete', rol: 'Banquete', telefono: '', importante: true },
  { nombre: 'Fotógrafo', rol: 'Fotografía', telefono: '', importante: true },
  { nombre: 'Videógrafo', rol: 'Vídeo', telefono: '', importante: false },
  { nombre: 'DJ/Música', rol: 'Música', telefono: '', importante: true },
  { nombre: 'Catering', rol: 'Comida', telefono: '', importante: true },
  { nombre: 'Florista', rol: 'Decoración', telefono: '', importante: false },
  { nombre: 'Transporte', rol: 'Logística', telefono: '', importante: false },
  { nombre: 'Padrino/Madrina', rol: 'Apoyo', telefono: '', importante: true }
];

export const TIMELINE_DEFAULT = [
  { hora: '08:00', actividad: 'Despertar y desayuno', responsable: 'Novios', duracion: 60 },
  { hora: '09:00', actividad: 'Preparación (ducha, cuidado personal)', responsable: 'Novios', duracion: 60 },
  { hora: '10:00', actividad: 'Peluquería y maquillaje novia', responsable: 'Novia + Peluquero', duracion: 180 },
  { hora: '10:30', actividad: 'Arreglo personal novio', responsable: 'Novio', duracion: 90 },
  { hora: '12:00', actividad: 'Fotos de preparación', responsable: 'Fotógrafo', duracion: 60 },
  { hora: '13:00', actividad: 'Vestir y últimos retoques', responsable: 'Novios + Equipo', duracion: 60 },
  { hora: '14:00', actividad: 'Salida hacia lugar ceremonia', responsable: 'Transporte', duracion: 30 },
  { hora: '14:30', actividad: 'Llegada y coordinación final', responsable: 'Coordinador', duracion: 30 },
  { hora: '15:00', actividad: 'Fotos previas a ceremonia', responsable: 'Fotógrafo', duracion: 60 },
  { hora: '16:00', actividad: 'Invitados toman asiento', responsable: 'Coordinador', duracion: 30 },
  { hora: '16:30', actividad: 'Inicio ceremonia', responsable: 'Oficiante', duracion: 45 },
  { hora: '17:15', actividad: 'Foto grupal y arroz/pétalos', responsable: 'Fotógrafo', duracion: 30 },
  { hora: '17:45', actividad: 'Traslado a lugar banquete', responsable: 'Transporte', duracion: 30 },
  { hora: '18:15', actividad: 'Inicio cóctel', responsable: 'Catering', duracion: 120 },
  { hora: '18:30', actividad: 'Sesión fotos novios', responsable: 'Fotógrafo', duracion: 90 },
  { hora: '20:15', actividad: 'Entrada al salón banquete', responsable: 'Maestro ceremonias', duracion: 15 },
  { hora: '20:30', actividad: 'Inicio banquete (aperitivos)', responsable: 'Catering', duracion: 30 },
  { hora: '21:00', actividad: 'Primer plato', responsable: 'Catering', duracion: 30 },
  { hora: '21:30', actividad: 'Segundo plato', responsable: 'Catering', duracion: 30 },
  { hora: '22:00', actividad: 'Discursos y brindis', responsable: 'Padrinos', duracion: 30 },
  { hora: '22:30', actividad: 'Tarta nupcial', responsable: 'Novios + Catering', duracion: 20 },
  { hora: '22:50', actividad: 'Primer baile', responsable: 'Novios + DJ', duracion: 10 },
  { hora: '23:00', actividad: 'Apertura pista baile', responsable: 'DJ', duracion: 60 },
  { hora: '00:00', actividad: 'Fiesta libre', responsable: 'DJ', duracion: 180 },
  { hora: '03:00', actividad: 'Cierre y despedida', responsable: 'Coordinador', duracion: 60 }
];

export default {
  MOMENTOS_DIA,
  CHECKLIST_DEFAULT,
  CONTACTOS_EMERGENCIA_DEFAULT,
  TIMELINE_DEFAULT
};
