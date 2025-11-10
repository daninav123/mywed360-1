export const venueTemplates = [
  {
    id: 'rect_hall',
    name: 'Salón rectangular',
    description: 'Plano básico rectangular con escenario y pista central',
    hallSize: { width: 1800, height: 1200 },
    pointsOfInterest: [
      { id: 'stage', label: 'Escenario', x: 900, y: 120, type: 'stage' },
      { id: 'dancefloor', label: 'Pista de baile', x: 900, y: 600, type: 'dancefloor' },
      { id: 'dj', label: 'Cabina DJ', x: 1550, y: 220, type: 'dj' },
      { id: 'bar', label: 'Barra', x: 200, y: 250, type: 'bar' },
      { id: 'exit', label: 'Salida principal', x: 900, y: 1180, type: 'exit' },
    ],
    overlays: {
      distance: { aisleMin: 140 },
      notes: ['Mantener pasillos de 1.4 m alrededor de la pista', 'Reservar mesas VIP frente al escenario'],
    },
  },
  {
    id: 'garden_l',
    name: 'Jardín en L',
    description: 'Zona exterior con formato L, altar y barra lateral',
    hallSize: { width: 2000, height: 1500 },
    pointsOfInterest: [
      { id: 'altar', label: 'Altar', x: 300, y: 300, type: 'altar' },
      { id: 'dancefloor', label: 'Pista exterior', x: 1200, y: 900, type: 'dancefloor' },
      { id: 'bar', label: 'Barra', x: 1700, y: 400, type: 'bar' },
      { id: 'kids', label: 'Zona infantil', x: 450, y: 1200, type: 'kids' },
      { id: 'exit', label: 'Acceso principal', x: 80, y: 80, type: 'exit' },
    ],
    overlays: {
      distance: { aisleMin: 120 },
      notes: ['Considerar iluminación adicional en la zona L', 'Respetar rutas accesibles cerca del altar'],
    },
  },
  {
    id: 'coastal',
    name: 'Carpa en costa',
    description: 'Carpa abierta con vista al mar, pista lateral y zona lounge',
    hallSize: { width: 2200, height: 1300 },
    pointsOfInterest: [
      { id: 'altar', label: 'Altar frente al mar', x: 1100, y: 160, type: 'altar' },
      { id: 'dancefloor', label: 'Pista lateral', x: 1700, y: 700, type: 'dancefloor' },
      { id: 'lounge', label: 'Zona lounge', x: 400, y: 850, type: 'lounge' },
      { id: 'bar', label: 'Barra central', x: 1100, y: 650, type: 'bar' },
      { id: 'exit', label: 'Acceso carpa', x: 1100, y: 1250, type: 'exit' },
    ],
    overlays: {
      distance: { aisleMin: 130 },
      notes: ['Reforzar anclajes por viento', 'Garantizar pasillos despejados hacia lounge y bar'],
    },
  },
];
