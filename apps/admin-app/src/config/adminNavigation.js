const ADMIN_NAVIGATION = [
  {
    id: 'overview',
    title: '📊 Resumen',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/admin/dashboard',
        description: 'Métricas clave, salud de servicios y tareas operativas.',
      },
    ],
  },
  {
    id: 'daily-management',
    title: '🏢 Gestión Diaria',
    items: [
      {
        id: 'portfolio',
        label: 'Bodas',
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
        id: 'suppliers',
        label: 'Proveedores',
        path: '/admin/suppliers',
        description: 'Catálogo, verificaciones y analítica del ecosistema de proveedores.',
      },
    ],
  },
  {
    id: 'revenue',
    title: '💰 Ingresos',
    items: [
      {
        id: 'commerce',
        label: 'Comerciales',
        path: '/admin/commerce',
        description: 'Enlaces de descuento, responsables y facturación generada.',
      },
      {
        id: 'payouts',
        label: 'Pagos comerciales',
        path: '/admin/finance/payouts',
        description: 'Liquidaciones de comisiones y pagos automáticos programados.',
      },
      {
        id: 'revolut',
        label: 'Revolut',
        path: '/admin/finance/revolut',
        description: 'Saldo, movimientos y webhooks de la cuenta Revolut del proyecto.',
      },
    ],
  },
  {
    id: 'analytics',
    title: '📈 Análisis',
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
    id: 'catalog',
    title: '🎨 Contenido & Catálogo',
    items: [
      {
        id: 'blog',
        label: 'Blog',
        path: '/admin/blog',
        description: 'Gestión editorial y publicaciones generadas por IA.',
      },
      {
        id: 'supplier-catalog',
        label: 'Catálogo Proveedores',
        path: '/admin/supplier-catalog',
        description: 'Especificaciones base y sugerencias de usuarios (crowdsourcing).',
      },
      {
        id: 'task-templates',
        label: 'Plantillas tareas',
        path: '/admin/task-templates',
        description: 'Seed maestro de tareas padre/subtareas y versionado del checklist.',
      },
    ],
  },
  {
    id: 'system',
    title: '⚙️ Sistema',
    items: [
      {
        id: 'automations',
        label: 'Automatizaciones',
        path: '/admin/automations',
        description: 'Mensajería programada (WhatsApp aniversario) y reglas globales.',
      },
      {
        id: 'alerts',
        label: 'Alertas',
        path: '/admin/alerts',
        description: 'Alertas en curso, severidad y flujo de resolución.',
      },
      {
        id: 'broadcast',
        label: 'Broadcast',
        path: '/admin/broadcast',
        description: 'Comunicaciones masivas y avisos críticos controlados.',
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
    id: 'development',
    title: '🔧 Desarrollo',
    items: [
      {
        id: 'ai-training',
        label: 'Entrenamiento IA',
        path: '/admin/ai-training',
        description: 'Añadir ejemplos de presupuestos para entrenar la IA.',
      },
      {
        id: 'debug-payments',
        label: 'Debug Pagos',
        path: '/admin/debug/payments',
        description: 'Diagnóstico técnico del sistema de facturación.',
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
