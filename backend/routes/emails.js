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
    const out = { tasks: [], meetings: [], budgets: [], contracts: [] };

    // Fechas y horas simples
    try {
      const dateRegex = /(\b\d{4}-\d{2}-\d{2}\b)|(\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b)/g;
      const timeRegex = /(\b\d{1,2}[:\.]\d{2}\b)|(\b\d{1,2}\s*(am|pm)\b)/gi;
      const dateMatches = (subject + '\n' + body).match(dateRegex) || [];
      dateMatches.slice(0, 3).forEach((d) => {
        out.meetings.push({ title: 'Reunión', date: d, when: d });
      });
      if (!out.meetings.length && /reuni\w+|cita|meeting/.test(text)) out.meetings.push({ title: 'Reunión', date: null, when: null });
      const timeMatch = (subject + ' ' + body).match(timeRegex);
      if (timeMatch && out.meetings[0] && !out.meetings[0].when) out.meetings[0].when = timeMatch[0];
    } catch {}

    // Dinero / presupuestos
    try {
      const moneyRegex = /(\b[€$]\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\b)|(\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\s?(€|eur|usd)\b)/gi;
      const amounts = (subject + '\n' + body).match(moneyRegex) || [];
      amounts.slice(0, 5).forEach((a) => out.budgets.push({ client: 'Proveedor', amount: a, currency: /\$/.test(a) ? 'USD' : 'EUR' }));
    } catch {}

    // Contratos
    if (/contrato|firma|acuerdo/.test(text)) out.contracts.push({ party: 'Proveedor', type: 'Contrato', action: 'revisar' });

    // Tareas
    if (/pendiente|por\s+hacer|to\s*do|recordatorio/.test(text)) out.tasks.push({ title: 'Revisar correo y crear tareas', due: null });
    if (/(fot[oó]grafo|catering|m[úu]sica|dj|flor|proveedor)/.test(text)) out.tasks.push({ title: 'Contactar proveedor mencionado', due: null });

    return res.json(out);
  } catch (e) {
    return res.status(500).json({ error: 'analyze-failed' });
  }
});

export default router;

