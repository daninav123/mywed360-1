import { useTranslations } from '../../hooks/useTranslations';
﻿export const adminKpis = [
  {
  const { t } = useTranslations();

    id: 'active-weddings',
    label: 'Bodas activas',
    value: 142,
    trend: 3.1,
    testId: 'admin-kpi-active-weddings',
  },
  {
    id: 'revenue-30d',
    label: t('common.facturacion_dias'),
    value: '€ 12.340',
    trend: 5.6,
    testId: 'admin-kpi-revenue-30d',
  },
  {
    id: 'downloads-30d',
    label: t('common.descargas_app_dias'),
    value: 980,
    trend: 8.4,
    testId: 'admin-kpi-downloads-30d',
  },
  {
    id: 'open-alerts',
    label: 'Alertas activas',
    value: 4,
    trend: -1.0,
    testId: 'admin-kpi-open-alerts',
  },
];

export const serviceHealth = [
  {
    id: 'firebase',
    name: 'Firebase',
    status: 'operational',
    latency: '120 ms',
    incidents: 0,
    testId: 'service-health-firebase',
  },
  {
    id: 'mailgun',
    name: 'Mailgun',
    status: 'degraded',
    latency: '250 ms',
    incidents: 2,
    testId: 'service-health-mailgun',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    status: 'operational',
    latency: '180 ms',
    incidents: 1,
    testId: 'service-health-whatsapp',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    status: 'operational',
    latency: '320 ms',
    incidents: 0,
    testId: 'service-health-openai',
  },
];

export const adminAlerts = [
  {
    id: 'alert-1',
    severity: 'critical',
    module: 'Infraestructura',
    message: t('common.latex_cron_fallback_fallo_durante'),
    timestamp: 'Hace 4 minutos',
  },
  {
    id: 'alert-2',
    severity: 'high',
    module: 'Emails',
    message: t('common.tasa_rebote_supero_ultima_hora'),
    timestamp: 'Hace 12 minutos',
  },
];

export const adminTasks = [
  { id: 'task-1', title: 'Revisar reportes semanales', completed: false },
  { id: 'task-2', title: 'Validar nuevas plantillas de email', completed: true },
];

export const adminPortfolio = [
  {
    id: 'wed-001',
    couple: t('common.lucia_marco'),
    owner: 'lucia@maloveapp.com',
    eventDate: '2025-11-12',
    status: 'active',
    confirmedGuests: 154,
    signedContracts: 6,
    lastUpdate: '2025-10-06',
  },
  {
    id: 'wed-002',
    couple: 'Ari & Bea',
    owner: 'ari@maloveapp.com',
    eventDate: '2026-04-22',
    status: 'draft',
    confirmedGuests: 0,
    signedContracts: 0,
    lastUpdate: '2025-10-05',
  },
];

export const adminUsersList = [
  {
    id: 'usr-001',
    email: 'planner.vera@maloveapp.com',
    role: 'planner',
    status: 'active',
    lastAccess: '2025-10-07 18:45',
    weddings: 4,
    createdAt: '2024-01-12',
  },
  {
    id: 'usr-002',
    email: 'owner.luis@maloveapp.com',
    role: 'owner',
    status: 'active',
    lastAccess: '2025-10-08 09:12',
    weddings: 1,
    createdAt: '2025-05-30',
  },
];

export const adminIncidents = [
  {
    id: 'incident-1',
    service: 'Mailgun',
    startedAt: '2025-10-01 10:12',
    duration: '8 min',
    impact: 'Emails en cola',
    action: t('common.reintento_automatico'),
    resolvedBy: 'Ops',
  },
];

export const featureFlags = [
  {
    id: 'flag-1',
    name: 'webbuilder.newTemplates',
    description: t('common.habilita_nueva_galeria_plantillas_web'),
    domain: 'web',
    enabled: true,
    lastModifiedBy: 'admin@maloveapp.com',
    lastModifiedAt: '2025-10-07',
  },
  {
    id: 'flag-2',
    name: 'ai.supplierMatching',
    description: 'Motor IA de matching proveedores',
    domain: 'ia',
    enabled: false,
    lastModifiedBy: 'admin@maloveapp.com',
    lastModifiedAt: '2025-09-30',
  },
];

export const secretList = [
  {
    id: 'secret-mailgun',
    name: 'MAILGUN_KEY',
    lastRotatedAt: '2025-07-01',
  },
  {
    id: 'secret-openai',
    name: 'OPENAI_KEY',
    lastRotatedAt: '2025-08-15',
  },
];

export const emailTemplates = [
  {
    id: 'email-welcome',
    name: 'Email bienvenida',
    content: 'Hola {{nombre}}, gracias por unirte a Lovenda.',
  },
  {
    id: 'email-reminder',
    name: 'Recordatorio tareas',
    content: 'Tienes nuevas tareas pendientes para tu boda {{boda}}.',
  },
];

export const broadcastHistory = [
  {
    id: 'broadcast-1',
    type: 'email',
    subject: 'Mantenimiento programado',
    segment: 'Todos',
    scheduledAt: '2025-10-10 10:00',
    status: 'Pendiente',
    stats: { opens: 0, clicks: 0, failures: 0 },
  },
];

export const auditLogs = [
  {
    id: 'audit-1',
    createdAt: '2025-10-08 09:30',
    actor: 'admin@maloveapp.com',
    action: 'FLAG_UPDATE',
    resourceType: 'featureFlag',
    resourceId: 'webbuilder.newTemplates',
    payload: '{"enabled":true}',
  },
  {
    id: 'audit-2',
    createdAt: '2025-10-07 16:12',
    actor: 'admin@maloveapp.com',
    action: 'USER_SUSPEND',
    resourceType: 'user',
    resourceId: 'usr-003',
    payload: '{"reason":"Incumplimiento"}',
  },
];

export const reportsScheduled = [
  {
    id: 'report-1',
    name: t('common.metricas_globales'),
    cadence: 'Semanal',
    recipients: ['direccion@maloveapp.com'],
    format: 'PDF',
    status: 'Activo',
  },
];

export const supportSummary = {
  open: 7,
  pending: 3,
  resolved: 21,
  slaAverage: '3h 12m',
  nps: 48,
};

export const supportTickets = [
  {
    id: 'ticket-1',
    subject: 'Error al sincronizar invitados',
    requester: 'planner.vera@maloveapp.com',
    status: 'Abierto',
    updatedAt: '2025-10-08 10:12',
  },
  {
    id: 'ticket-2',
    subject: 'Duda sobre plantillas',
    requester: 'owner.luis@maloveapp.com',
    status: 'Pendiente',
    updatedAt: '2025-10-07 18:02',
  },
];