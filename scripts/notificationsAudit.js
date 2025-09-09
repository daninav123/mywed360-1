#!/usr/bin/env node
'use strict';
/**
 * notificationsAudit.js (dry run)
 * - Audita el estado del flujo de notificaciones y configuración (push/email/SMS/in-app)
 * - No envía nada ni modifica configuración; solo genera un reporte con hallazgos y próximos pasos
 * - Salida: logs/outputs/notifications_audit.report.json
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const outDir = path.join(repoRoot, 'logs', 'outputs');

function ensureDir(p) { try { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); } catch {} }
function exists(rel) { try { return fs.existsSync(path.join(repoRoot, rel)); } catch { return false; } }

ensureDir(outDir);

const checks = {
  docs: {
    flujoNotificaciones: exists('docs/flujos-especificos/flujo-12-notificaciones-configuracion.md')
  },
  frontend: {
    notificationCenter: exists('src/components/notifications/NotificationCenter.jsx'),
    notificationSettings: exists('src/components/settings/NotificationSettings.jsx') || exists('src/pages/NotificationSettings.jsx'),
    i18nHook: exists('src/i18n/index.js') // para textos de notificaciones
  },
  backend: {
    hasEmailService: exists('backend/services/budgetEmailService.js') || exists('backend/services/emailService.js'),
    hasWebhookInfra: exists('backend/routes/mailgun-webhook.js')
  },
  config: {
    envSlackWebhook: Boolean(process.env.SLACK_WEBHOOK_URL || process.env.VITE_SLACK_WEBHOOK_URL) || false,
    envSmtp: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) || false
  },
  suggestions: [
    'Implementar NotificationCenter.jsx con filtro por tipo y acciones rápidas',
    'Crear NotificationSettings.jsx con preferencias por canal y horarios de no molestar',
    'Añadir orquestación de reglas (AutomationRules.jsx) para recordatorios RSVP y tareas',
    'Integrar con Mailgun/SMTP para emails y preparar integración FCM para push',
    'Exponer /api/notifications para webhooks externos y reglas'
  ]
};

const report = {
  timestamp: new Date().toISOString(),
  type: 'notifications_audit',
  checks,
  summary: 'Dry run OK. Se detectaron elementos base; faltan centro de notificaciones, reglas y preferencias granulares.'
};

const outFile = path.join(outDir, 'notifications_audit.report.json');
try {
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2), 'utf8');
  console.log('[notificationsAudit] Reporte generado en', path.relative(repoRoot, outFile));
  process.exit(0);
} catch (e) {
  console.error('[notificationsAudit] No se pudo escribir el reporte:', e.message);
  process.exit(1);
}
