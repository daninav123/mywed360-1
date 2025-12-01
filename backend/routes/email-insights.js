import express from 'express';
import { db } from '../db.js';
import OpenAI from 'openai';
import logger from '../utils/logger.js';
import { extractTextForMail } from '../services/attachmentText.js';
import { classifyEmailContent } from '../services/emailClassification.js';

const router = express.Router();

// GET /api/email-insights/:mailId
router.get('/:mailId', async (req, res) => {
  const { mailId } = req.params;
  if (!mailId) return res.status(400).json({ error: 'mailId required' });
  try {
    const doc = await db.collection('emailInsights').doc(mailId).get();
    if (!doc.exists) {
      return res.json({});
    }
    return res.json(doc.data());
  } catch (err) {
    console.error('Error fetching emailInsights:', err);
    res.status(500).json({ error: 'internal', details: err.message });
  }
});

export default router;

// --- Helpers de análisis ---
function heuristicAnalyze({ subject = '', body = '' }) {
  const text = `${subject}\n\n${body}`.trim();
  const tasks = [];
  const meetings = [];
  const budgets = [];
  const contracts = [];
  const payments = [];

  try {
    // Detectar fechas simples (YYYY-MM-DD o DD/MM/YYYY)
    const dateRegex = /(\b\d{4}-\d{2}-\d{2}\b)|(\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b)/gi;
    const timeRegex = /(\b\d{1,2}[:\.]\d{2}\b)|(\b\d{1,2}\s*(am|pm)\b)/gi;
    const moneyRegex =
      /(\b[€$]\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\b)|(\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\s?(€|eur|usd)\b)/gi;
    const providerKeywords =
      /(fot[oó]grafo|catering|m[úu]sica|dj|flor(?:ista|er[íi]a)|invitaciones|pastel(?:er[íi]a)?|joyer[íi]a|transporte|decoraci[óo]n|lugar|finca|banquete)/gi;

    // Reuniones simples por presencia de fecha y posible hora
    const dateMatches = text.match(dateRegex) || [];
    if (dateMatches.length) {
      dateMatches.slice(0, 3).forEach((d) => {
        const around = text.substring(
          Math.max(0, text.indexOf(d) - 40),
          Math.min(text.length, text.indexOf(d) + 40)
        );
        const time = (around.match(timeRegex) || [])[0] || null;
        const when = `${d}${time ? ' ' + time : ''}`;
        meetings.push({ title: 'Reunión', date: when, when });
      });
    }

    // Presupuestos por cantidades de dinero
    const amounts = text.match(moneyRegex) || [];
    if (amounts.length) {
      amounts.slice(0, 5).forEach((a) => {
        budgets.push({ client: 'Proveedor', amount: a, currency: /\$/.test(a) ? 'USD' : 'EUR' });
      });
    }

    // Contratos por palabras clave
    if (/contrato|firma|acuerdo|se[c|ç]i[óo]n/i.test(text)) {
      contracts.push({ party: 'Proveedor', type: 'Contrato', action: 'revisar' });
    }

    // Tareas básicas
    if (/recordatorio|pendiente|por hacer|to\s*do/i.test(text)) {
      tasks.push({ title: 'Revisar correo y crear tareas', due: null });
    }
    if (providerKeywords.test(text)) {
      tasks.push({ title: 'Contactar proveedor mencionado', due: null });
    }
  } catch (e) {}

  return { tasks, meetings, budgets, contracts, payments };
}

// POST /api/email-insights/classify  { subject, body }
router.post('/classify', async (req, res) => {
  try {
    const {
      subject = '',
      body = '',
      mailId = '',
      persist = true,
      ownerUid = null,
    } = req.body || {};
    if (!subject && !body) return res.status(400).json({ error: 'subject_or_body_required' });

    const normalizedMailId = typeof mailId === 'string' && mailId.trim() ? mailId.trim() : null;
    const normalizedOwnerUid =
      typeof ownerUid === 'string' && ownerUid.trim() ? ownerUid.trim() : null;

    const result = await classifyEmailContent({
      subject,
      body,
      mailId: normalizedMailId,
      ownerUid: normalizedOwnerUid,
      persist: persist !== false,
    });

    return res.json(result);
  } catch (error) {
    logger.error('[email-insights] classify falló', error?.message || error);
    return res.status(500).json({ error: 'classification_failed' });
  }
});

// POST /api/email-insights/analyze
// Body: { mailId, subject, body, from?, to? }
router.post('/analyze', async (req, res) => {
  try {
    let { mailId, subject = '', body = '' } = req.body || {};
    if (!mailId) {
      return res.status(400).json({ error: 'mailId required' });
    }
    if (!subject && !body) {
      try {
        const snap = await db.collection('mails').doc(mailId).get();
        if (snap.exists) {
          const data = snap.data() || {};
          subject = data.subject || subject;
          body = data.body || body;
        }
      } catch (e) {}
    }
    if (!subject && !body) {
      return res.status(400).json({ error: 'subject/body missing and not found by mailId' });
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';
    let insights = null;
    let attachmentsText = [];

    // Intentar extraer texto de adjuntos desde Storage
    try {
      attachmentsText = await extractTextForMail(mailId);
    } catch {}

    if (apiKey) {
      try {
        const openai = new OpenAI({ apiKey, project: process.env.OPENAI_PROJECT_ID });
        const prompt = `Eres un asistente de boda. A partir del siguiente email, extrae acciones estructuradas en JSON con este esquema exacto:
{
  "tasks": [{"title": string, "due": string|null}],
  "meetings": [{"title": string, "date": string|null, "when": string|null}],
  "budgets": [{"client": string, "amount": string, "currency": string|null}],
  "contracts": [{\"party\": string, \"type\": string, \"action\": string}],\n  \"payments\": [{\"amount\": string, \"currency\": string|null, \"direction\": \"incoming|outgoing\"|null, \"method\": string|null, \"date\": string|null, \"note\": string|null}]
}
Responde SOLO el JSON. Email:
Asunto: ${subject}\nCuerpo: ${body.slice(0, 5000)}${Array.isArray(attachmentsText) && attachmentsText.length ? '\nAdjuntos extraídos:' + attachmentsText.map((a) => `\n[${a.filename || 'archivo'}] ${a.text.slice(0, 3000)}`).join('') : ''}`;

        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          temperature: 0,
          messages: [
            { role: 'system', content: 'Devuelve solo JSON válido según el esquema indicado.' },
            { role: 'user', content: prompt },
          ],
        });
        const content = completion.choices?.[0]?.message?.content || '';
        try {
          insights = JSON.parse(content);
        } catch {
          const match = content.match(/\{[\s\S]*\}$/);
          if (match) insights = JSON.parse(match[0]);
        }
      } catch (e) {
        logger.warn('[email-insights] OpenAI falló, usando heurística:', e?.message || e);
      }
    }

    if (!insights) insights = heuristicAnalyze({ subject, body });

    // Guardar en Firestore
    try {
      await db.collection('emailInsights').doc(mailId).set(insights, { merge: true });
    } catch (e) {
      logger.warn('[email-insights] No se pudo guardar insights:', e?.message || e);
    }

    return res.json(insights);
  } catch (err) {
    console.error('Error analyzing email:', err);
    res.status(500).json({ error: 'internal', details: err.message });
  }
});

// POST /api/email-insights/reanalyze/:mailId
// Reconstruye subject/body y adjuntos desde BD/Storage y vuelve a analizar
router.post('/reanalyze/:mailId', async (req, res) => {
  try {
    const { mailId } = req.params;
    if (!mailId) return res.status(400).json({ error: 'mailId required' });
    let subject = '',
      body = '';
    try {
      const snap = await db.collection('mails').doc(mailId).get();
      if (snap.exists) {
        const d = snap.data() || {};
        subject = d.subject || '';
        body = d.body || '';
      }
    } catch {}
    if (!subject && !body) return res.status(404).json({ error: 'mail not found' });

    const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';
    let insights = null;
    let attachmentsText = [];
    try {
      attachmentsText = await extractTextForMail(mailId);
    } catch {}

    if (apiKey) {
      try {
        const openai = new OpenAI({ apiKey, project: process.env.OPENAI_PROJECT_ID });
        const prompt = `Eres un asistente de boda. A partir del siguiente email, extrae acciones estructuradas en JSON con este esquema exacto:\n{\n  "tasks": [{"title": string, "due": string|null}],\n  "meetings": [{"title": string, "date": string|null, "when": string|null}],\n  "budgets": [{"client": string, "amount": string, "currency": string|null}],\n  "contracts": [{\"party\": string, \"type\": string, \"action\": string}],\n  \"payments\": [{\"amount\": string, \"currency\": string|null, \"direction\": \"incoming|outgoing\"|null, \"method\": string|null, \"date\": string|null, \"note\": string|null}]\n}\nResponde SOLO el JSON. Email:\nAsunto: ${subject}\nCuerpo: ${body.slice(0, 5000)}${Array.isArray(attachmentsText) && attachmentsText.length ? '\nAdjuntos extraídos:' + attachmentsText.map((a) => `\n[${a.filename || 'archivo'}] ${a.text.slice(0, 3000)}`).join('') : ''}`;
        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          temperature: 0,
          messages: [
            { role: 'system', content: 'Devuelve solo JSON válido según el esquema indicado.' },
            { role: 'user', content: prompt },
          ],
        });
        const content = completion.choices?.[0]?.message?.content || '';
        try {
          insights = JSON.parse(content);
        } catch {
          const match = content.match(/\{[\s\S]*\}$/);
          if (match) insights = JSON.parse(match[0]);
        }
      } catch (e) {
        logger.warn('[email-insights] reanalyze OpenAI falló, usando heurística:', e?.message || e);
      }
    }

    if (!insights) insights = heuristicAnalyze({ subject, body });
    try {
      await db.collection('emailInsights').doc(mailId).set(insights, { merge: true });
    } catch {}
    return res.json(insights);
  } catch (err) {
    console.error('reanalyze failed', err);
    return res.status(500).json({ error: 'internal' });
  }
});
