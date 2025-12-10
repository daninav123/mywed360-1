// routes/ai.js
// Handles AI-powered endpoints: parse-dialog via OpenAI GPT and image generation via Stability SDK
// Note: requires environment variables OPENAI_API_KEY and STABILITY_API_KEY

import dotenv from 'dotenv';
import path from 'path';
// Cargar variables de entorno desde el .env raíz
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
import express from 'express';
import logger from '../utils/logger.js';
import axios from 'axios';
import admin from 'firebase-admin';
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendInternalError,
  sendServiceUnavailable,
} from '../utils/apiResponse.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

// Definir la API key directamente como respaldo si no se encuentra en las variables de entorno
// Soportar variables de entorno tanto OPENAI_API_KEY como VITE_OPENAI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';
const OPENAI_PROJECT_ID = process.env.OPENAI_PROJECT_ID || process.env.VITE_OPENAI_PROJECT_ID || '';

const router = express.Router();

// ---------- OpenAI Client (opcional) ----------
let openai = null;

async function ensureOpenAI() {
  // Si ya está inicializado o no hay API key, salir temprano
  if (openai || !OPENAI_API_KEY) {
    if (!OPENAI_API_KEY) {
      console.warn('⚠️  OPENAI_API_KEY no definido. Se usará modo simulación.');
    }
    return;
  }
  try {
    const { default: OpenAI } = await import('openai');
    openai = new OpenAI({ apiKey: OPENAI_API_KEY, project: OPENAI_PROJECT_ID || undefined });
    console.log('✅ Cliente OpenAI inicializado correctamente.', {
      projectId: OPENAI_PROJECT_ID || null,
    });
  } catch (err) {
    console.error('Error al inicializar OpenAI SDK:', err.message);
  }
}

// Al arrancar intentamos inicializar, pero si las variables aún no están cargadas no fallamos
ensureOpenAI().catch((err) => console.error('❌ Error al inicializar OpenAI:', err.message));

// ---------- Firestore (optional) ----------
let db = null;
try {
  if (admin.apps.length === 0 && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({});
  }
  db = admin.apps.length ? admin.firestore() : null;
} catch {}

function describeEvent(context) {
  if (!context || typeof context !== 'object') return 'tu boda';
  const rawType = String(context.eventType || '').toLowerCase();
  const kind = rawType && !rawType.includes('boda') ? 'tu evento' : 'tu boda';
  const style = context.styleLabel || context.style;
  const location = context.location;
  const pieces = [];
  if (style) pieces.push(`de estilo ${style}`);
  if (location) pieces.push(`en ${location}`);
  return pieces.length ? `${kind} ${pieces.join(' ')}` : kind;
}

function buildContextSummary(context) {
  if (!context || typeof context !== 'object') return '';
  const parts = [];
  if (context.eventType) parts.push(`tipo ${context.eventType}`);
  const style = context.styleLabel || context.style;
  if (style) parts.push(`estilo ${style}`);
  const guest = context.guestCountLabel || context.guestCountRange;
  if (guest) parts.push(`invitados ${guest}`);
  const formality = context.formalityLabel || context.formalityLevel;
  if (formality) parts.push(`formalidad ${formality}`);
  const ceremony = context.ceremonyLabel || context.ceremonyType;
  if (ceremony) parts.push(`ceremonia ${ceremony}`);
  if (context.location) parts.push(`ubicación ${context.location}`);
  if (context.weddingDate) parts.push(`fecha ${context.weddingDate}`);
  return parts.join(', ');
}

// El modo de fallback local ha sido retirado para exponer fallos de configuración.

// GET /api/ai/debug-env - Endpoint temporal para verificar variables de entorno
// PROTEGIDO: Solo admin puede acceder para evitar exposición de información sensible
router.get('/debug-env', requireAdmin, (req, res) => {
  const envVars = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
    ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN ? 'SET' : 'NOT_SET',
    MAILGUN_API_KEY: process.env.MAILGUN_API_KEY ? 'SET' : 'NOT_SET',
    PORT: process.env.PORT || 'NOT_SET',
  };

  logger.info('🔍 Debug env vars requested by admin');
  return sendSuccess(req, res, {
    environment: envVars,
    timestamp: new Date().toISOString(),
  });
});

// POST /api/parse-dialog
// Body: { text: "free form conversation" }
// Returns: { extracted: {...} }
router.post('/parse-dialog', async (req, res) => {
  let { text, history = [], context = null } = req.body || {};
  // Validación opcional con Zod si está disponible; fallback básico
  try {
    const mod = await import('zod').catch(() => null);
    if (mod) {
      const z = mod.z || mod.default;
      const schema = z.object({
        text: z.string().min(1).max(5000),
        history: z
          .array(z.object({ role: z.string().optional(), content: z.string() }))
          .optional()
          .default([]),
        context: z
          .object({
            eventType: z.string().max(64).optional(),
            style: z.string().max(128).optional().nullable(),
            styleLabel: z.string().max(128).optional().nullable(),
            guestCountRange: z.string().max(64).optional().nullable(),
            guestCountLabel: z.string().max(128).optional().nullable(),
            formalityLevel: z.string().max(64).optional().nullable(),
            formalityLabel: z.string().max(128).optional().nullable(),
            ceremonyType: z.string().max(64).optional().nullable(),
            ceremonyLabel: z.string().max(128).optional().nullable(),
            relatedEvents: z.array(z.string()).max(20).optional(),
            location: z.string().max(160).optional().nullable(),
            weddingDate: z.string().max(64).optional().nullable(),
            weddingId: z.string().max(64).optional().nullable(),
            name: z.string().max(160).optional().nullable(),
          })
          .partial()
          .optional()
          .nullable(),
      });
      const parsed = schema.safeParse({ text, history, context });
      if (!parsed.success) {
        return sendValidationError(req, res, parsed.error.errors);
      }
      ({ text, history, context } = parsed.data);
    } else {
      if (!text || typeof text !== 'string') {
        return sendValidationError(req, res, [{ message: 'text is required' }]);
      }
      if (!Array.isArray(history)) history = [];
      if (!context || typeof context !== 'object') context = null;
    }
  } catch {}
  logger.info('↪️  parse-dialog recibido', { textLen: text.length, historyLen: history.length });
  if (!text) {
    return sendValidationError(req, res, [{ message: 'text is required' }]);
  }

  const historyMessages = Array.isArray(history)
    ? history
        .filter((msg) => msg && typeof msg.content === 'string' && msg.content.trim().length)
        .map((msg) => ({
          role: ['assistant', 'user', 'system'].includes(msg.role) ? msg.role : 'user',
          content: msg.content,
        }))
    : [];
  const conversationMessages = historyMessages.length
    ? historyMessages
    : [{ role: 'user', content: text }];
  const contextSummary = buildContextSummary(context);

  if (!OPENAI_API_KEY) {
    logger.error('OPENAI_API_KEY ausente; parse-dialog no puede ejecutarse');
    return sendServiceUnavailable(
      req,
      res,
      'La integración con OpenAI no está configurada. Proporciona OPENAI_API_KEY en el backend.'
    );
  }

  // Forzar inicialización de OpenAI si aún no se ha hecho
  if (!openai) {
    await ensureOpenAI();
  }

  try {
    // Define function schema for structured output
    const functions = [
      {
        name: 'extractWeddingData',
        description:
          'Extrae datos relevantes de la conversación para la aplicación de planificación de boda',
        parameters: {
          type: 'object',
          properties: {
            guests: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Nombre del invitado' },
                  phone: { type: 'string', description: 'Teléfono' },
                  address: { type: 'string' },
                  companions: { type: 'integer', minimum: 0 },
                  table: { type: 'string' },
                },
              },
            },
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  due: { type: 'string', description: 'Fecha ISO' },
                },
              },
            },
            meetings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  start: { type: 'string', description: 'Fecha/hora inicio ISO' },
                  end: { type: 'string', description: 'Fecha/hora fin ISO' },
                  date: { type: 'string', description: 'Fecha ISO shorthand' },
                  when: { type: 'string', description: 'Expresión natural de fecha/hora' },
                },
              },
            },
            budgetMovements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  concept: { type: 'string' },
                  amount: { type: 'number' },
                  date: { type: 'string' },
                  type: { type: 'string', enum: ['expense', 'income'] },
                },
              },
            },
            commands: {
              description: 'Acciones que el usuario quiere realizar en la aplicación',
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  entity: {
                    type: 'string',
                    enum: ['task', 'meeting', 'guest', 'movement', 'table', 'config', 'supplier'],
                  },
                  action: {
                    type: 'string',
                    enum: ['add', 'update', 'delete', 'complete', 'move', 'set', 'search'],
                  },
                  payload: { type: 'object' },
                },
                required: ['entity', 'action', 'payload'],
              },
            },
          },
        },
        required: [],
      },
    ];

    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    logger.info('🧠 Llamando a OpenAI');
    // --- Llamada a OpenAI con timeout (10s) ---
    const completion = await Promise.race([
      openai.chat.completions.create({
        model,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: contextSummary
              ? `Eres un asistente que extrae información estructurada para una aplicación de bodas. Contexto del evento: ${contextSummary}. Devuelve solo datos válidos en la función.`
              : 'Eres un asistente que extrae información estructurada para una aplicación de bodas. Devuelve solo datos válidos en la función.',
          },
          ...conversationMessages,
        ],
        functions,
        function_call: { name: 'extractWeddingData' },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout-openai')), 10000)),
    ]);

    logger.info('🧠 OpenAI respondió');
    const responseMessage = completion.choices?.[0]?.message;
    let extracted = {};
    if (responseMessage?.function_call?.arguments) {
      try {
        extracted = JSON.parse(responseMessage.function_call.arguments);
      } catch (parseErr) {
        logger.warn('⚠️  No se pudo parsear JSON de la función:', parseErr);
        extracted = { raw: responseMessage.function_call.arguments };
      }
    }

    logger.info('🧠 Generando respuesta amigable');
    // ----- Conversational friendly reply -----
    let reply = '';
    try {
      const summaryCompletion = await Promise.race([
        openai.chat.completions.create({
          model,
          temperature: 0.7,
          messages: [
            {
              role: 'system',
              content: contextSummary
                ? `Eres un asistente wedding planner que responde de forma breve y amistosa a la pareja, resumiendo las acciones o dudas detectadas. Evento actual: ${contextSummary}.`
                : 'Eres un asistente wedding planner que responde de forma breve y amistosa a la pareja, resumiendo las acciones o dudas detectadas.',
            },
            ...conversationMessages,
            { role: 'assistant', content: `He extraído estos datos: ${JSON.stringify(extracted)}` },
            { role: 'user', content: 'Por favor, responde de forma cercana en español.' },
          ],
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout-openai-summary')), 10000)
        ),
      ]);
      logger.info('🧠 Resumen generado');
      reply = summaryCompletion.choices?.[0]?.message?.content || '';
    } catch (sumErr) {
      logger.warn('No se pudo generar respuesta amigable:', sumErr);
    }

    // Guardar en Firestore si está configurado
    if (db) {
      db.collection('aiParsedDialogs')
        .doc()
        .set({ text, extracted, reply, createdAt: admin.firestore.FieldValue.serverTimestamp() })
        .catch((err) => logger.warn('Firestore set failed', err));
      // No esperamos a que Firestore termine para responder
    }

    logger.info('✅ parse-dialog completado', {
      extractedKeys: Object.keys(extracted),
      replyLen: reply.length,
    });
    return sendSuccess(req, res, { extracted, reply });
  } catch (err) {
    logger.error('❌ parse-dialog error', err);
    return sendError(
      req,
      res,
      'openai_request_failed',
      err?.message || 'Error al procesar la solicitud con OpenAI',
      502
    );
  }
});

// GET /api/ai/search-suppliers?q=photographer+Madrid
router.get('/search-suppliers', async (req, res) => {
  const q = req.query.q;
  if (!q) {
    return sendValidationError(req, res, [{ message: 'Query parameter "q" is required' }]);
  }
  const { SERPAPI_API_KEY } = process.env;
  if (!SERPAPI_API_KEY) {
    return sendServiceUnavailable(req, res, 'SERPAPI_API_KEY no está configurado');
  }
  try {
    const resp = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google',
        q,
        num: 10,
        api_key: SERPAPI_API_KEY,
      },
    });
    const results = (resp.data?.organic_results || []).slice(0, 5).map((r) => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet,
    }));
    return sendSuccess(req, res, { results });
  } catch (err) {
    logger.error('Supplier search failed:', err);
    return sendInternalError(req, res, err);
  }
});

export default router;
