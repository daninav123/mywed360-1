#!/usr/bin/env node
'use strict';
/**
 * rsvpDashboardDryRun.js (dry run)
 * - Inspecciona el flujo de RSVP (docs) y presencia de piezas técnicas relacionadas
 * - No toca BBDD; solo genera un reporte con hallazgos y sugerencias
 * - Salida: logs/outputs/rsvp_dashboard.report.json
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
    flujoRSVP: exists('docs/flujos-especificos/flujo-9-rsvp-confirmaciones.md')
  },
  frontend: {
    rsvpConfirm: exists('src/pages/RSVPConfirm.jsx') || exists('src/components/RSVPConfirm.jsx') || exists('src/routes/RSVPConfirm.jsx'),
    acceptInvitation: exists('src/pages/AcceptInvitation.jsx') || exists('src/components/AcceptInvitation.jsx')
  },
  e2e: {
    rsvpConfirmByTokenSpec: exists('cypress/e2e/rsvp/rsvp_confirm_by_token.cy.js'),
    rsvpInvalidTokenSpec: exists('cypress/e2e/rsvp/rsvp_invalid_token.cy.js'),
    rsvpRemindersSpec: exists('cypress/e2e/rsvp/rsvp_reminders.cy.js')
  },
  backend: {
    emailService: exists('backend/services/budgetEmailService.js') || exists('backend/services/emailService.js'),
    mailgunWebhook: exists('backend/routes/mailgun-webhook.js')
  },
  suggestions: [
    'Añadir dashboard de seguimiento RSVP con métricas en tiempo real (/rsvp/stats)',
    'Implementar recordatorios programados (cron en backend o Cloud Functions) y plantillas de email',
    'Integrar con Seating y Catering para actualizar conteos al confirmar',
    'Cubrir confirmaciones grupales y roles de colaboradores'
  ]
};

const report = {
  timestamp: new Date().toISOString(),
  type: 'rsvp_dashboard_dryrun',
  checks,
  summary: 'Dry run OK. Revisa las sugerencias y los specs E2E presentes para priorizar el dashboard y recordatorios.'
};

const outFile = path.join(outDir, 'rsvp_dashboard.report.json');
try {
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2), 'utf8');
  console.log('[rsvpDashboardDryRun] Reporte generado en', path.relative(repoRoot, outFile));
  process.exit(0);
} catch (e) {
  console.error('[rsvpDashboardDryRun] No se pudo escribir el reporte:', e.message);
  process.exit(1);
}
