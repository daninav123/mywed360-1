import { FieldValue } from 'firebase-admin/firestore';
import OpenAI from 'openai';

import { db } from '../db.js';
import logger from '../utils/logger.js';

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const CLASSIFICATION_TIMEOUT_MS = Number(process.env.EMAIL_CLASSIFY_TIMEOUT_MS || 7000);

function heuristicClassify({ subject = '', body = '' }) {
  const text = `${subject}\n${body}`.toLowerCase();
  const tags = new Set();
  let folder = null;

  try {
    if (/(presupuesto|budget|factura|pago|finanzas)/.test(text)) {
      tags.add('Finanzas');
      folder = folder || 'Finanzas';
    }

    if (/(contrato|firma|acuerdo|legal|anexo)/.test(text)) {
      tags.add('Contratos');
      folder = folder || 'Contratos';
    }

    if (
      /(proveedor|catering|fot(?:ó|o)grafo|dj|m(?:ú|u)sica|flor|banquete|venue|servicio)/.test(text)
    ) {
      tags.add('Proveedor');
      folder = folder || 'Proveedores';
    }

    if (/(invitaci(?:ó|o)n|rsvp|confirmaci(?:ó|o)n)/.test(text)) {
      tags.add('RSVP');
      folder = folder || 'RSVP';
    }

    if (/(reuni(?:ó|o)n|meeting|cita|call|videollamada)/.test(text)) {
      tags.add('Reuniones');
      folder = folder || 'Reuniones';
    }

    if (/(urgente|emergencia|asap|prioritario)/.test(text)) {
      tags.add('Urgente');
    }
  } catch {}

  return {
    tags: Array.from(tags),
    folder,
    source: 'heuristic',
  };
}

function normalizeClassificationPayload(result, source) {
  const tags = Array.isArray(result?.tags)
    ? result.tags
        .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
        .filter(Boolean)
        .slice(0, 10)
    : [];
  const folder = result?.folder && typeof result.folder === 'string' ? result.folder.trim() : null;

  const payload = {
    tags,
    folder,
    source: source || result?.source || 'heuristic',
  };

  if (typeof result?.confidence === 'number') {
    payload.confidence = result.confidence;
  }
  if (typeof result?.reason === 'string' && result.reason.trim()) {
    payload.reason = result.reason.trim();
  }
  if (result?.extra && typeof result.extra === 'object') {
    payload.extra = result.extra;
  }

  return payload;
}

async function callOpenAIClassification({ subject, body }) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';
  if (!apiKey) return null;

  try {
    const openai = new OpenAI({ apiKey, project: process.env.OPENAI_PROJECT_ID });
    const prompt = `Clasifica el siguiente email en etiquetas y una carpeta sugerida para una app de bodas. Devuelve SOLO JSON con este formato exacto:
{
  "tags": ["Presupuesto", "Contrato", "Proveedor", "RSVP", ...],
  "folder": "Finanzas" | "Contratos" | "Proveedores" | "RSVP" | null
}
Email:
Asunto: ${subject || '(sin asunto)'}
Cuerpo: ${(body || '').slice(0, 3000)}`;

    const completion = await Promise.race([
      openai.chat.completions.create({
        model: DEFAULT_MODEL,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content:
              'Responde solo JSON válido con los campos "tags" (array de strings) y "folder" (string o null).',
          },
          { role: 'user', content: prompt },
        ],
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout-openai-classify')), CLASSIFICATION_TIMEOUT_MS)
      ),
    ]);

    const content = completion.choices?.[0]?.message?.content || '';
    try {
      return JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}$/);
      if (match) {
        return JSON.parse(match[0]);
      }
    }
  } catch (error) {
    logger.warn('[email-classification] OpenAI classify falló', error?.message || error);
  }
  return null;
}

async function persistClassification({ mailId, ownerUid, payload }) {
  if (!mailId || !payload) return;

  const classificationDoc = {
    ...payload,
    updatedAt: FieldValue.serverTimestamp(),
  };

  try {
    await db.collection('emailInsights').doc(mailId).set(
      {
        classification: classificationDoc,
        mailId,
      },
      { merge: true }
    );
  } catch (error) {
    logger.warn(
      '[email-classification] No se pudo guardar en emailInsights',
      error?.message || error
    );
  }

  try {
    await db
      .collection('mails')
      .doc(mailId)
      .set({ aiClassification: classificationDoc }, { merge: true });
  } catch (error) {
    logger.warn(
      '[email-classification] No se pudo actualizar mails.aiClassification',
      error?.message || error
    );
  }

  if (ownerUid) {
    try {
      await db
        .collection('users')
        .doc(ownerUid)
        .collection('mails')
        .doc(mailId)
        .set({ aiClassification: classificationDoc }, { merge: true });
    } catch (error) {
      logger.warn(
        '[email-classification] No se pudo actualizar la subcolección del usuario',
        error?.message || error
      );
    }
  }
}

/**
 * Ejecuta la clasificación IA (OpenAI + heurística) y opcionalmente la persiste.
 *
 * @param {Object} params
 * @param {string} params.subject
 * @param {string} params.body
 * @param {string|null} params.mailId
 * @param {boolean} [params.persist=true]
 * @param {string|null} [params.ownerUid=null]
 * @returns {Promise<{tags:string[], folder:string|null, source:string, confidence?:number, reason?:string}>}
 */
export async function classifyEmailContent({
  subject = '',
  body = '',
  mailId = null,
  persist = true,
  ownerUid = null,
} = {}) {
  const trimmedSubject = typeof subject === 'string' ? subject : '';
  const trimmedBody = typeof body === 'string' ? body : '';

  if (!trimmedSubject && !trimmedBody) {
    const fallback = normalizeClassificationPayload(
      heuristicClassify({ subject: trimmedSubject, body: trimmedBody }),
      'heuristic'
    );
    return fallback;
  }

  const heuristic = heuristicClassify({ subject: trimmedSubject, body: trimmedBody });
  const aiRaw = await callOpenAIClassification({ subject: trimmedSubject, body: trimmedBody });
  const mergedTags = new Set(heuristic.tags || []);

  let source = heuristic.source || 'heuristic';
  let folder = heuristic.folder || null;
  let aiPayload = null;

  if (aiRaw) {
    aiPayload = normalizeClassificationPayload(aiRaw, 'ai');
    (aiPayload.tags || []).forEach((tag) => mergedTags.add(tag));
    folder = aiPayload.folder || folder;
    source = aiPayload.source || 'ai';
  }

  const resultPayload = normalizeClassificationPayload(
    {
      tags: Array.from(mergedTags),
      folder,
      confidence: aiPayload?.confidence,
      reason: aiPayload?.reason,
      extra: aiPayload?.extra,
    },
    source
  );

  if (persist && mailId) {
    await persistClassification({ mailId, ownerUid, payload: resultPayload });
  }

  return resultPayload;
}
