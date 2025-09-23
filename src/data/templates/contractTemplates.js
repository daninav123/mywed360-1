// Plantillas simples para contratos de proveedores

const contractTemplates = [
  {
    id: 'contrato_generico_servicios',
    name: 'Contrato genérico de prestación de servicios',
    ext: 'txt',
    mime: 'text/plain',
    body: `CONTRATO DE PRESTACIÓN DE SERVICIOS

Entre las partes:

CLIENTE: {{clienteNombre}}
PROVEEDOR: {{providerName}}
SERVICIO: {{service}}

FECHA DE FIRMA: {{signedDate}}
FECHA DEL SERVICIO: {{serviceDate}}

1. Objeto: El PROVEEDOR se compromete a prestar el servicio de {{service}} en la fecha indicada.
2. Honorarios: Las partes acuerdan definir el importe final por escrito.
3. Pagos: El CLIENTE realizará los pagos según lo acordado entre las partes.
4. Cancelaciones: Cualquier cancelación deberá notificarse por escrito.
5. Jurisdicción: Las partes se someten a la legislación aplicable en su territorio.

Firmas:

CLIENTE: __________________________
PROVEEDOR: ________________________
`,
  },
  {
    id: 'acuerdo_basico_reserva',
    name: 'Acuerdo básico de reserva',
    ext: 'txt',
    mime: 'text/plain',
    body: `ACUERDO BÁSICO DE RESERVA DE SERVICIOS

Proveedor: {{providerName}}
Servicio: {{service}}
Fecha del evento: {{serviceDate}}

Se confirma la reserva del servicio indicado para la fecha señalada.
Condiciones de señal, pago y cancelación se anexarán o pactarán por escrito.

Firmado por ambas partes en fecha {{signedDate}}.
`,
  },
];

export default contractTemplates;
