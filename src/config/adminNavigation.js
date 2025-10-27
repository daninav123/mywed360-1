const ADMIN_NAVIGATION = [
  {
    id: 'panel',
    title: 'Panel',
    items: [
      {
        id: 'dashboard',
        label: 'Resumen',
        path: '/admin/dashboard',
        description: 'Métricas clave, salud de servicios y tareas operativas.',
      },
    ],
  },
  {
    id: 'operations',
    title: 'Operaciones',
    items: [
      {
        id: 'portfolio',
        label: 'Portfolio',
        path: '/admin/portfolio',
        description: 'Estado de bodas activas, owners y seguimiento operativo.',
      },
      {
        id: 'users',
        label: 'Usuarios',
        path: '/admin/users',
        description: 'Gestión de cuentas, roles y actividad reciente.',
      },
      {
        id: 'broadcast',
        label: 'Broadcast',
        path: '/admin/broadcast',
        description: 'Comunicaciones masivas y avisos críticos controlados.',
      },
      {
        id: 'automations',
        label: 'Automatizaciones',
        path: '/admin/automations',
        description: 'Mensajería programada (WhatsApp aniversario) y reglas globales.',
      },
      {
        id: 'commerce',
        label: 'Comerciales',
        path: '/admin/commerce',
        description: 'Enlaces de descuento, responsables y facturación generada.',
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analítica',
    items: [
      {
        id: 'metrics',
        label: 'Métricas',
        path: '/admin/metrics',
        description: 'Embudo de conversión, costes IA y exportes históricos.',
      },
      {
        id: 'reports',
        label: 'Reportes',
        path: '/admin/reports',
        description: 'Programación y descarga de informes clave para dirección.',
      },
    ],
  },
  {
    id: 'infrastructure',
    title: 'Infraestructura',
    items: [
      {
        id: 'integrations',
        label: 'Integraciones',
        path: '/admin/integrations',
        description: 'Estados de proveedores externos y gestión de incidencias.',
      },
      {
        id: 'alerts',
        label: 'Alertas',
        path: '/admin/alerts',
        description: 'Alertas en curso, severidad y flujo de resolución.',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Configuración',
    items: [
      {
        id: 'settings-global',
        label: 'Global',
        path: '/admin/settings',
        description: 'Feature flags, secretos y plantillas globales.',
      },
      {
        id: 'task-templates',
        label: 'Plantillas tareas',
        path: '/admin/task-templates',
        description: 'Seed maestro de tareas padre/subtareas y versionado del checklist.',
      },
      {
        id: 'support',
        label: 'Soporte',
        path: '/admin/support',
        description: 'Estado del soporte y SLA frente a planners y proveedores.',
      },
    ],
  },
  {
    id: 'finance',
    title: 'Finanzas',
    items: [
      {
        id: 'revolut',
        label: 'Revolut',
        path: '/admin/finance/revolut',
        description: 'Saldo, movimientos y webhooks de la cuenta Revolut del proyecto.',
      },
    ],
  },
  {
    id: 'development',
    title: 'Desarrollo',
    items: [
      {
        id: 'debug-payments',
        label: 'Debug Pagos',
        path: '/admin/debug/payments',
        description: 'Diagnóstico de facturación y datos de pagos en Firestore.',
      },
    ],
  },
];

const ADMIN_ALLOWED_PATHS = new Set(['/admin']);

for (const section of ADMIN_NAVIGATION) {
  for (const item of section.items) {
    if (item.path) {
      ADMIN_ALLOWED_PATHS.add(item.path);
      const trimmed = item.path.endsWith('/') ? item.path.slice(0, -1) : item.path;
      ADMIN_ALLOWED_PATHS.add(trimmed);
    }
  }
}

ADMIN_ALLOWED_PATHS.add('/admin/');

export { ADMIN_ALLOWED_PATHS, ADMIN_NAVIGATION };
