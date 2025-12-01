import dotenv from 'dotenv';
import path from 'path';
import logger from '../utils/logger.js';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';

let openai = null;
async function ensureOpenAI() {
  if (openai || !OPENAI_API_KEY) return;
  try {
    const { default: OpenAI } = await import('openai');
    openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    console.log('✅ Cliente OpenAI inicializado en emailAnalysis');
  } catch (err) {
    console.error('❌ Error inicializando OpenAI en emailAnalysis:', err);
  }
}

/**
 * Analiza el contenido de un correo y devuelve acciones estructuradas.
 * @param {Object} params
 * @param {string} params.subject - Asunto del correo
 * @param {string} params.body - Cuerpo (texto plano preferido)
 * @returns {Promise<Object>} JSON con tasks, meetings, budgets, contracts...
 */
export async function analyzeEmail({
  subject = '',
  body = '',
  attachments = [],
  attachmentsText = [],
}) {
  await ensureOpenAI();
  if (!openai) {
    logger.warn('OPENAI_API_KEY no definido; análisis omitido');
    return { tasks: [], meetings: [], budgets: [], contracts: [] };
  }

  const INCLUDE_ATTACHMENTS = process.env.EMAIL_ANALYSIS_INCLUDE_ATTACHMENTS
    ? process.env.EMAIL_ANALYSIS_INCLUDE_ATTACHMENTS !== 'false'
    : true;
  const PER_FILE_LIMIT = parseInt(process.env.EMAIL_ANALYSIS_MAX_ATTACHMENT_CHARS || '5000', 10);
  const TOTAL_LIMIT = parseInt(process.env.EMAIL_ANALYSIS_TOTAL_CHARS || '20000', 10);

  function truncate(s, n) {
    const str = String(s || '');
    return str.length > n ? str.slice(0, n) + '\n[...truncated...]' : str;
  }

  let attachmentsBlock = '';
  try {
    if (INCLUDE_ATTACHMENTS && Array.isArray(attachmentsText) && attachmentsText.length) {
      const blocks = [];
      let used = 0;
      for (const a of attachmentsText) {
        const piece = truncate(
          a.text || '',
          Math.min(PER_FILE_LIMIT, Math.max(1000, PER_FILE_LIMIT))
        );
        if (!piece) continue;
        const header = `\n\n[ADJUNTO] ${a.filename || 'archivo'} (${a.mime || 'desconocido'})\n`;
        const chunk = header + piece + '\n';
        if (used + chunk.length > TOTAL_LIMIT) break;
        blocks.push(chunk);
        used += chunk.length;
      }
      if (blocks.length) {
        attachmentsBlock = `\nAdjuntos extraídos (texto):${blocks.join('')}`;
      }
    }
  } catch {}

  const promptUser = `Email recibido:\nAsunto: ${subject}\nCuerpo:\n${body}${Array.isArray(attachments) && attachments.length ? '\nAdjuntos (' + attachments.length + '):\n' + attachments.map((a, i) => '- ' + (a.filename || a.name || 'adjunto' + (i + 1)) + ' (' + (a.type || a.contentType || 'desconocido') + ')').join('\\n') : ''}${attachmentsBlock}\n---\nSi los adjuntos incluyen presupuestos, convocatorias o contratos, tenlos en cuenta. Extrae acciones relevantes (tareas, reuniones, presupuestos, contratos). Devuelve JSON tal como se indica en la función.`;

  const functions = [
    {
      name: 'extractEmailActions',
      description:
        'Extrae acciones desde un correo para generar tareas, reuniones, presupuestos, contratos',
      parameters: {
        type: 'object',
        properties: {
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                due: { type: 'string', description: 'Fecha ISO o vacío' },
                priority: { type: 'string', enum: ['alta', 'media', 'baja'], default: 'media' },
              },
              required: ['title'],
            },
          },
          meetings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                date: { type: 'string', description: 'Fecha/hora ISO' },
                participants: { type: 'array', items: { type: 'string' } },
              },
              required: ['title', 'date'],
            },
          },
          budgets: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                client: { type: 'string' },
                amount: { type: 'number' },
                currency: { type: 'string', default: 'EUR' },
                status: {
                  type: 'string',
                  enum: ['pending', 'accepted', 'rejected'],
                  description: 'Estado detectado del presupuesto',
                },
                supplierId: {
                  type: 'string',
                  description: 'Opcional, si se deduce un ID conocido',
                },
                description: {
                  type: 'string',
                  description: 'Resumen del presupuesto (p.ej., asunto)',
                },
              },
              required: ['client', 'amount'],
            },
          },
          contracts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                party: { type: 'string' },
                type: { type: 'string' },
                action: { type: 'string', description: 'review, sign, send, etc.' },
              },
              required: ['party', 'type'],
            },
          },
        },
        required: [],
      },
    },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      temperature: 0,
      messages: [
        { role: 'system', content: 'Eres un asistente que produce JSON estructurado' },
        { role: 'user', content: promptUser },
      ],
      functions,
      function_call: { name: 'extractEmailActions' },
    });
    const msg = completion.choices?.[0]?.message;
    let extracted = {};
    if (msg?.function_call?.arguments) {
      try {
        extracted = JSON.parse(msg.function_call.arguments);
      } catch (err) {
        logger.warn('No se pudo parsear JSON en emailAnalysis:', err);
      }
    }
    return extracted;
  } catch (err) {
    logger.error('Error analizando correo:', err);
    return { error: true, message: err.message };
  }
}
