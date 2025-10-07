// routes/ai.js
// Handles AI-powered endpoints: parse-dialog via OpenAI GPT and image generation via Stability SDK
// Note: requires environment variables OPENAI_API_KEY and STABILITY_API_KEY

import dotenv from 'dotenv';
import path from 'path';
// Cargar variables de entorno desde el .env raíz
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
import express from 'express';
import logger from '../logger.js';
import axios from 'axios';
import admin from 'firebase-admin';

// Definir la API key directamente como respaldo si no se encuentra en las variables de entorno
// Soportar variables de entorno tanto OPENAI_API_KEY como VITE_OPENAI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';

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
    openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    console.log('✅ Cliente OpenAI inicializado correctamente.');
  } catch (err) {
    console.error('Error al inicializar OpenAI SDK:', err.message);
  }
}

// Al arrancar intentamos inicializar, pero si las variables aún no están cargadas no fallamos
ensureOpenAI().catch(err => console.error('❌ Error al inicializar OpenAI:', err.message));


// ---------- Firestore (optional) ----------
let db = null;
try {
  if (admin.apps.length === 0 && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({});
  }
  db = admin.apps.length ? admin.firestore() : null;
} catch {}

// Función de fallback local para cuando OpenAI no está disponible
function generateLocalResponse(text, history = []) {
  const lowerText = text.toLowerCase();
  let reply = '';
  let extracted = {};
  
  // Respuestas contextuales basadas en palabras clave
  if (lowerText.includes('hola') || lowerText.includes('hi') || lowerText.includes('hello')) {
    reply = '¡Hola! Soy tu asistente de bodas. Aunque tengo algunos problemas técnicos temporales, puedo ayudarte con información básica sobre tu boda. ¿En qué puedo asistirte?';
  } else if (lowerText.includes('invitado') || lowerText.includes('guest')) {
    reply = 'Te puedo ayudar con la gestión de invitados. Puedes añadir invitados manualmente desde la sección de Invitados en el menú principal. ¿Necesitas ayuda con algo específico sobre los invitados?';
  } else if (lowerText.includes('presupuesto') || lowerText.includes('dinero') || lowerText.includes('coste') || lowerText.includes('precio')) {
    reply = 'Para gestionar tu presupuesto de boda, ve a la sección de Finanzas donde puedes añadir gastos e ingresos. ¿Quieres que te explique cómo funciona el control de presupuesto?';
  } else if (lowerText.includes('fecha') || lowerText.includes('cuando') || lowerText.includes('día')) {
    reply = 'Puedes gestionar las fechas importantes de tu boda en el calendario. ¿Necesitas ayuda para planificar alguna fecha específica?';
  } else if (lowerText.includes('proveedor') || lowerText.includes('vendor') || lowerText.includes('fotógrafo') || lowerText.includes('catering')) {
    reply = 'En la sección de Proveedores puedes buscar y gestionar todos los servicios para tu boda. ¿Buscas algún tipo de proveedor en particular?';
  } else if (lowerText.includes('mesa') || lowerText.includes('seating') || lowerText.includes('asiento')) {
    reply = 'El plan de mesas te permite organizar dónde se sentarán tus invitados. Puedes acceder desde el menú principal. ¿Necesitas ayuda con la distribución de mesas?';
  } else if (lowerText.includes('ayuda') || lowerText.includes('help') || lowerText.includes('cómo')) {
    reply = 'Estoy aquí para ayudarte con tu boda. Aunque tengo limitaciones técnicas temporales, puedo orientarte sobre:\n\n• Gestión de invitados\n• Control de presupuesto\n• Planificación de fechas\n• Búsqueda de proveedores\n• Organización de mesas\n\n¿En qué área necesitas más ayuda?';
  } else if (lowerText.includes('problema') || lowerText.includes('error') || lowerText.includes('no funciona')) {
    reply = 'Entiendo que hay algunos problemas técnicos. Estamos trabajando para solucionarlos. Mientras tanto, puedes usar todas las funciones de la aplicación manualmente desde el menú. ¿Hay algo específico que no funcione?';
  } else {
    reply = 'Disculpa, tengo algunas limitaciones técnicas temporales y no puedo procesar completamente tu consulta. Sin embargo, puedes:\n\n• Usar el menú principal para navegar\n• Gestionar invitados, presupuesto y fechas manualmente\n• Buscar proveedores en la sección correspondiente\n\n¿Puedes ser más específico sobre lo que necesitas?';
  }
  
  // Heurística simple: intentar extraer invitados/reuniones en modo local
  try {
    const ex = { guests: [], tasks: [], meetings: [], budgetMovements: [], commands: [] };
    // Invitados
    const mInv = text.match(/(?:añade|agrega|crea)\s+(?:un|una|al|a\s+)?invitad[oa]\s+([^,.\n]+?)(?:\s+con\s+tel[eé]fono\s+(\+?[\d\s-()]{6,}))?(?:\s|[,.]|$)/i);
    if (mInv) {
      const name = (mInv[1] || '').trim();
      const phone = (mInv[2] || '').trim();
      if (name) {
        ex.guests.push({ name, phone });
        ex.commands.push({ entity: 'guest', action: 'add', payload: { name, phone } });
        if (!reply) reply = `He añadido al invitado ${name}${phone ? ` (tel. ${phone})` : ''}.`;
      }
    }
    // Reuniones
    if (/(reuni[óo]n|cita|llamada|meeting)/i.test(text) && /(añade|agrega|program|crea)/i.test(text)) {
      const now = new Date();
      let start = null;
      let end = null;
      const mHoy = text.match(/\b(hoy|mañana)\b.*?(?:a\s+las\s+)?(\d{1,2})(?::(\d{2}))?/i);
      if (mHoy) {
        const base = new Date();
        if (mHoy[1].toLowerCase() === 'mañana') base.setDate(base.getDate() + 1);
        const hh = Math.max(0, Math.min(23, parseInt(mHoy[2], 10)));
        const mm = mHoy[3] ? Math.max(0, Math.min(59, parseInt(mHoy[3], 10))) : 0;
        base.setHours(hh, mm, 0, 0);
        start = base;
        end = new Date(base.getTime() + 60 * 60 * 1000);
      }
      const mFecha = text.match(/\bel\s+(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?(?:\s+a\s+las\s+(\d{1,2})(?::(\d{2}))?)?/i);
      if (!start && mFecha) {
        const d = parseInt(mFecha[1], 10);
        const m = parseInt(mFecha[2], 10) - 1;
        const y = mFecha[3] ? parseInt(mFecha[3], 10) : now.getFullYear();
        const hh = mFecha[4] ? parseInt(mFecha[4], 10) : 10;
        const mm = mFecha[5] ? parseInt(mFecha[5], 10) : 0;
        const base = new Date(y < 100 ? 2000 + y : y, m, d, hh, mm, 0, 0);
        start = base;
        end = new Date(base.getTime() + 60 * 60 * 1000);
      }
      const titleMatch = text.match(/(?:sobre|para|con)\s+([^\n,.]+)(?:\.|,|$)/i);
      const title = (titleMatch ? titleMatch[1] : 'Reunión').trim();
      if (start) {
        ex.meetings.push({ title, start: start.toISOString(), end: end.toISOString() });
        ex.commands.push({ entity: 'meeting', action: 'add', payload: { title, start: start.toISOString(), end: end.toISOString() } });
        if (!reply) reply = `He programado "${title}" el ${start.toLocaleDateString('es-ES')} a las ${start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.`;
      }
    }

    // Movimientos (gasto/ingreso)
    if (/(gasto|ingreso)/i.test(text)) {
      const type = /ingreso/i.test(text) ? 'income' : 'expense';
      const mAmt = text.match(/(\d+[\.,]?\d*)\s*(?:€|eur|euros)?/i);
      const rawAmt = mAmt ? mAmt[1] : '';
      const amount = rawAmt ? Number(String(rawAmt).replace(',', '.')) : 0;
      const mConcept = text.match(/(?:de|en|por)\s+([^\d,.\n]+?)(?:\s+el\s+|\.|,|$)/i);
      const concept = (mConcept ? mConcept[1] : '').trim() || (type === 'income' ? 'Ingreso' : 'Gasto');
      let dateStr = new Date().toISOString().slice(0, 10);
      const mFecha2 = text.match(/\bel\s+(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/i);
      if (mFecha2) {
        const d = parseInt(mFecha2[1], 10);
        const m = parseInt(mFecha2[2], 10) - 1;
        const y = mFecha2[3] ? parseInt(mFecha2[3], 10) : new Date().getFullYear();
        const dt = new Date(y < 100 ? 2000 + y : y, m, d);
        dateStr = dt.toISOString().slice(0, 10);
      }
      if (amount > 0) {
        ex.budgetMovements.push({ concept, amount, date: dateStr, type });
        ex.commands.push({ entity: 'movement', action: 'add', payload: { name: concept, concept, amount, date: dateStr, type } });
        if (!reply) reply = `${type === 'income' ? 'Ingreso' : 'Gasto'} registrado: ${concept} por ${amount}€`;
      }
    }

    // Proveedores: alta simple
    if (/(proveedor|provider)/i.test(text) && /(a..ade|agrega|crea)/i.test(text)) {
      const mName = text.match(/proveedor(?:\s+de)?\s+([^,\.\n]+)(?:,|\.|\n|$)/i);
      const name = (mName ? mName[1] : '').trim();
      if (name) {
        ex.commands.push({ entity: 'supplier', action: 'add', payload: { name } });
        if (!reply) reply = `Proveedor "${name}" añadido.`;
      }
    }

    if (ex.guests.length || ex.tasks.length || ex.meetings.length || ex.budgetMovements.length || ex.commands.length) {
      extracted = ex;
    }
  } catch {}

  return { reply, extracted };
}

// GET /api/ai/debug-env - Endpoint temporal para verificar variables de entorno
router.get('/debug-env', (req, res) => {
  const envVars = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` : 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
    ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || 'NOT_SET',
    MAILGUN_API_KEY: process.env.MAILGUN_API_KEY ? `${process.env.MAILGUN_API_KEY.substring(0, 10)}...` : 'NOT_SET',
    PORT: process.env.PORT || 'NOT_SET'
  };
  
  logger.info('🔍 Debug env vars:', envVars);
  res.json({ 
    status: 'debug', 
    environment: envVars,
    timestamp: new Date().toISOString()
  });
});

// POST /api/parse-dialog
// Body: { text: "free form conversation" }
// Returns: { extracted: {...} }
router.post('/parse-dialog', async (req, res) => {
  let { text, history = [] } = req.body || {};
  // Validación opcional con Zod si está disponible; fallback básico
  try {
    const mod = await import('zod').catch(() => null);
    if (mod) {
      const z = mod.z || mod.default;
      const schema = z.object({
        text: z.string().min(1).max(5000),
        history: z.array(z.object({ role: z.string().optional(), content: z.string() })).optional().default([]),
      });
      const parsed = schema.safeParse({ text, history });
      if (!parsed.success) {
        return res.status(400).json({ error: 'invalid-payload', details: parsed.error.issues?.map(i => i.message).join('; ') });
      }
      ({ text, history } = parsed.data);
    } else {
      if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text required' });
      if (!Array.isArray(history)) history = [];
    }
  } catch {}
  logger.info('↪️  parse-dialog recibido', { textLen: text.length, historyLen: history.length });
  if (!text) return res.status(400).json({ error: 'text required' });

  // Early fallback: si no hay OPENAI_API_KEY, usar heurística local
  if (!OPENAI_API_KEY) {
    logger.warn('OPENAI_API_KEY ausente, usando heurística local (early)');
    const local = generateLocalResponse(text, history);
    return res.json(local);
  }

  // ---- Fallback local si no hay OPENAI_API_KEY configurada ----
  if (!OPENAI_API_KEY) {
    logger.warn('OPENAI_API_KEY ausente, usando heurística local');
    return res.json({
      extracted: {},
      reply: 'Lo siento, la IA no está disponible en este momento. Pero aquí estoy para ayudarte en lo que pueda.'
    });
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
                  when: { type: 'string', description: 'Expresión natural de fecha/hora' }
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
                  entity: { type: 'string', enum: ['task','meeting','guest','movement','table','config','supplier'] },
                  action: { type: 'string', enum: ['add','update','delete','complete','move','set','search'] },
                  payload: { type: 'object' }
                },
                required: ['entity','action','payload']
              }
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
            content:
              'Eres un asistente que extrae información estructurada para una aplicación de bodas. Devuelve solo datos válidos en la función.',
          },
          { role: 'user', content: text },
        ],
        functions,
        function_call: { name: 'extractWeddingData' },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout-openai')), 10000))
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
          { role: 'system', content: 'Eres un asistente wedding planner que responde de forma breve y amistosa a la pareja, resumiendo las acciones o dudas detectadas.' },
          { role: 'user', content: text },
          { role: 'assistant', content: `He extraído estos datos: ${JSON.stringify(extracted)}` },
          { role: 'user', content: 'Por favor, responde de forma cercana en español.' }
            
          ]
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout-openai-summary')), 10000))
      ]);
      logger.info('🧠 Resumen generado');
      reply = summaryCompletion.choices?.[0]?.message?.content || '';
    } catch (sumErr) {
      logger.warn('No se pudo generar respuesta amigable:', sumErr);
    }

    // Guardar en Firestore si está configurado
    if (db) {
      db.collection('aiParsedDialogs').doc().set({ text, extracted, reply, createdAt: admin.firestore.FieldValue.serverTimestamp() })
      .catch(err => logger.warn('Firestore set failed', err));
    // No esperamos a que Firestore termine para responder
    }

    logger.info('✅ parse-dialog completado', { extractedKeys: Object.keys(extracted), replyLen: reply.length });
    res.json({ extracted, reply });
  } catch (err) {
    logger.error('❌ parse-dialog error', err);
    
    // Fallback inteligente local cuando OpenAI no está disponible
    const localResponse = generateLocalResponse(text, history);
    
    // Devuelve 200 para que el frontend no lo trate como fallo de red
    res.json({
      error: 'AI parsing failed',
      details: err?.message || 'unknown',
      extracted: localResponse.extracted,
      reply: localResponse.reply
    });
  }
});

// GET /api/ai/search-suppliers?q=photographer+Madrid
router.get('/search-suppliers', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'q required' });
  const { SERPAPI_API_KEY } = process.env;
  if (!SERPAPI_API_KEY) {
    return res.status(500).json({ error: 'SERPAPI_API_KEY missing' });
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
    res.json({ results });
  } catch (err) {
    console.error('Supplier search failed:', err);
    res.status(500).json({ error: 'search failed', details: err?.message || 'unknown' });
  }
});

export default router;


