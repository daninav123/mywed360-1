import { useTranslations } from '../../hooks/useTranslations';
const ADMIN_NAVIGATION = [
  {
  const { t } = useTranslations();

    id: 'panel',
    title: 'Panel',
    items: [
      {
        id: 'dashboard',
        label: 'Resumen',
        path: '/admin/dashboard',
        description: t('common.metricas_clave_salud_servicios_tareas'),
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
        description: t('common.gestion_cuentas_roles_actividad_reciente'),
      },
      {
        id: 'broadcast',
        label: 'Broadcast',
        path: '/admin/broadcast',
        description: t('common.comunicaciones_masivas_avisos_criticos_controlados'),
      },
      {
        id: 'automations',
        label: 'Automatizaciones',
        path: '/admin/automations',
        description: t('common.mensajeria_programada_whatsapp_aniversario_reglas'),
      },
      {
        id: 'commerce',
        label: 'Comerciales',
        path: '/admin/commerce',
        description: t('common.enlaces_descuento_responsables_facturacion_generada'),
      },
    ],
  },
  {
    id: 'analytics',
    title: t('common.analitica'),
    items: [
      {
        id: 'metrics',
        label: t('common.metricas'),
        path: '/admin/metrics',
        description: t('common.embudo_conversion_costes_exportes_historicos'),
      },
      {
        id: 'reports',
        label: 'Reportes',
        path: '/admin/reports',
        description: t('common.programacion_descarga_informes_clave_para'),
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
        description: t('common.estados_proveedores_externos_gestion_incidencias'),
      },
      {
        id: 'alerts',
        label: 'Alertas',
        path: '/admin/alerts',
        description: t('common.alertas_curso_severidad_flujo_resolucion'),
      },
    ],
  },
  {
    id: 'settings',
    title: t('common.configuracion'),
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
    id: 'development',
    title: 'Desarrollo',
    items: [
      {
        id: 'debug-payments',
        label: 'Debug Pagos',
        path: '/admin/debug/payments',
        description: t('common.diagnostico_facturacion_datos_pagos_firestore'),
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
