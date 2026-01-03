import express from 'express';
import getRoutes from './mail/getRoutes.js';
import postSend from './mail/postSend.js';
import attachments from './mail/attachments.js';
import readStatus from './mail/readStatus.js';
import alias from './mail/alias.js';
import { requireMailAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

// Reutilizamos las rutas de mail bajo /api/emails
router.use('/', getRoutes);
router.use('/', attachments);
router.use('/', readStatus);
router.use('/', alias);
router.use('/', postSend);
// Alias explícito para OpenAPI: POST /api/emails/send
router.use('/send', postSend);

// POST /api/emails/analyze  { subject, body }
router.post('/analyze', requireMailAccess, express.json(), async (req, res) => {
  try {
    const { subject = '', body = '' } = req.body || {};
    if (!subject && !body) return res.status(400).json({ error: 'subject_or_body_required' });
    const text = `${subject}\n\n${body}`.toLowerCase();
    const analysis = { tasks: [], meetings: [], budgets: [], contracts: [], entities: [] };

    // Fechas y horas simples
    try {
      const dateRegex = /(\b\d{4}-\d{2}-\d{2}\b)|(\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b)/g;
      const timeRegex = /(\b\d{1,2}[:\.]\d{2}\b)|(\b\d{1,2}\s*(am|pm)\b)/gi;
      const dateMatches = (subject + '\n' + body).match(dateRegex) || [];
      dateMatches.slice(0, 3).forEach((d) => {
        analysis.meetings.push({ title: 'Reunión', date: d, when: d });
        analysis.entities.push({ type: 'date', value: d });
      });
      if (!analysis.meetings.length && /reuni\w+|cita|meeting/.test(text)) {
        analysis.meetings.push({ title: 'Reunión', date: null, when: null });
      }
      const timeMatch = (subject + ' ' + body).match(timeRegex);
      if (timeMatch && analysis.meetings[0] && !analysis.meetings[0].when) {
        analysis.meetings[0].when = timeMatch[0];
        analysis.entities.push({ type: 'time', value: timeMatch[0] });
      }
    } catch {}

    // Dinero / presupuestos
    try {
      const moneyRegex = /(\b[€$]\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\b)|(\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\s?(€|eur|usd)\b)/gi;
      const amounts = (subject + '\n' + body).match(moneyRegex) || [];
      amounts.slice(0, 5).forEach((a) => {
        const currency = /\$/.test(a) ? 'USD' : 'EUR';
        analysis.budgets.push({ client: 'Proveedor', amount: a, currency });
        analysis.entities.push({ type: 'amount', value: a, currency });
      });
    } catch {}

    // Contratos
    if (/contrato|firma|acuerdo/.test(text)) {
      analysis.contracts.push({ party: 'Proveedor', type: 'Contrato', action: 'revisar' });
      analysis.entities.push({ type: 'contract', value: 'Contrato detectado' });
    }

    // Tareas
    if (/pendiente|por\s+hacer|to\s*do|recordatorio/.test(text)) {
      analysis.tasks.push({ title: 'Revisar correo y crear tareas', due: null });
      analysis.entities.push({ type: 'task', value: 'Revisar correo y crear tareas' });
    }
    if (/(fot[oó]grafo|catering|m[úu]sica|dj|flor|proveedor)/.test(text)) {
      analysis.tasks.push({ title: 'Contactar proveedor mencionado', due: null });
      analysis.entities.push({ type: 'task', value: 'Contactar proveedor mencionado' });
    }

    const summaryParts = [];
    if (analysis.meetings.length) summaryParts.push(`${analysis.meetings.length} reunión(es) potencial(es)`);
    if (analysis.budgets.length) summaryParts.push(`${analysis.budgets.length} referencia(s) de presupuesto`);
    if (analysis.contracts.length) summaryParts.push(`${analysis.contracts.length} mención(es) de contrato`);
    if (analysis.tasks.length) summaryParts.push(`${analysis.tasks.length} tarea(s) sugerida(s)`);
    analysis.summary = summaryParts.length
      ? `Se detectaron ${summaryParts.join(', ')}.`
      : 'No se identificaron elementos relevantes en el contenido analizado.';

    return res.json(analysis);
  } catch (e) {
    return res.status(500).json({ error: 'analyze-failed' });
  }
});

export default router;
