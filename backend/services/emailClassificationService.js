/**
 * Servicio de Clasificación IA de Emails
 * 
 * Usa OpenAI GPT para clasificar emails automáticamente en categorías
 * y sugerir acciones (carpetas, etiquetas, auto-respuestas).
 */

import OpenAI from 'openai';
import { db } from '../db.js';

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT_ID,
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'; // Más rápido y económico
const MAX_RETRIES = 2;
const TIMEOUT_MS = 30000; // 30 segundos

// Categorías predefinidas
const CATEGORIES = [
  'Proveedor', // Emails de/para proveedores
  'Invitado', // Confirmaciones, preguntas de invitados
  'Finanzas', // Pagos, facturas, presupuestos
  'Contratos', // Documentos legales, firmas
  'Facturas', // Facturas específicamente
  'Reuniones', // Propuestas de reunión, calendarios
  'RSVP', // Confirmaciones de asistencia
  'General', // Otros
];

// Carpetas sugeridas
const FOLDERS = ['inbox', 'sent', 'trash', 'important', 'archive'];

/**
 * Clasifica un email usando OpenAI
 * 
 * @param {Object} emailData - Datos del email
 * @param {string} emailData.from - Remitente
 * @param {string} emailData.to - Destinatario(s)
 * @param {string} emailData.subject - Asunto
 * @param {string} emailData.body - Cuerpo del email
 * @param {Object} context - Contexto adicional (weddingId, etc.)
 * @returns {Promise<Object>} Clasificación
 */
export async function callClassificationAPI(emailData, context = {}) {
  const startTime = Date.now();
  
  try {
    console.log('[emailClassificationService] Clasificando email...', {
      subject: emailData.subject,
      from: emailData.from,
    });

    // Validar que tenemos API key
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[emailClassificationService] OPENAI_API_KEY no configurada, usando heurística');
      return fallbackClassification(emailData);
    }

    // Preparar prompt
    const prompt = buildClassificationPrompt(emailData, context);
    
    // Llamar a OpenAI con timeout
    const response = await Promise.race([
      openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `Eres un asistente experto en clasificar emails de planificación de bodas.
Tu tarea es analizar el email y devolver una clasificación estructurada en JSON.

Categorías disponibles: ${CATEGORIES.join(', ')}
Carpetas disponibles: ${FOLDERS.join(', ')}

Responde SOLO con JSON válido, sin texto adicional.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Más determinista
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('OpenAI timeout')), TIMEOUT_MS)
      ),
    ]);

    // Parsear respuesta
    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Respuesta vacía de OpenAI');
    }

    const classification = JSON.parse(content);
    
    // Validar estructura
    const validated = validateClassification(classification);
    
    const duration = Date.now() - startTime;
    
    console.log('[emailClassificationService] Clasificación exitosa', {
      category: validated.category,
      confidence: validated.confidence,
      durationMs: duration,
    });

    // Registrar métricas
    await recordClassificationMetric({
      success: true,
      durationMs: duration,
      model: MODEL,
      category: validated.category,
      confidence: validated.confidence,
    });

    return {
      ...validated,
      source: 'openai',
      model: MODEL,
      durationMs: duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('[emailClassificationService] Error en clasificación:', error.message);

    // Registrar error
    await recordClassificationMetric({
      success: false,
      durationMs: duration,
      error: error.message,
    });

    // Fallback a heurística local
    console.log('[emailClassificationService] Usando fallback heurístico');
    return fallbackClassification(emailData);
  }
}

/**
 * Construye el prompt para OpenAI
 */
function buildClassificationPrompt(emailData, context) {
  let prompt = `Analiza este email y clasifícalo:\n\n`;
  
  prompt += `De: ${emailData.from}\n`;
  prompt += `Para: ${emailData.to}\n`;
  prompt += `Asunto: ${emailData.subject}\n`;
  prompt += `Cuerpo:\n${emailData.body.substring(0, 1000)}\n`; // Primeros 1000 caracteres
  
  if (context.weddingId) {
    prompt += `\nContexto: Este email está relacionado con la boda ID ${context.weddingId}`;
  }
  
  prompt += `\n\nDevuelve un JSON con esta estructura:
{
  "category": "<una de: ${CATEGORIES.join(', ')}>",
  "tags": ["<etiquetas relevantes>"],
  "folder": "<carpeta sugerida: ${FOLDERS.join(', ')}>",
  "confidence": <número entre 0 y 1>,
  "reason": "<breve explicación de la clasificación>",
  "autoReply": <true si el email necesita respuesta automática>,
  "priority": "<low, medium, high>",
  "actionItems": ["<acciones sugeridas>"]
}`;
  
  return prompt;
}

/**
 * Valida y normaliza la clasificación de OpenAI
 */
function validateClassification(classification) {
  return {
    category: CATEGORIES.includes(classification.category) ? classification.category : 'General',
    tags: Array.isArray(classification.tags) ? classification.tags.slice(0, 5) : [],
    folder: FOLDERS.includes(classification.folder) ? classification.folder : 'inbox',
    confidence: typeof classification.confidence === 'number'
      ? Math.min(Math.max(classification.confidence, 0), 1)
      : 0.5,
    reason: typeof classification.reason === 'string' ? classification.reason.substring(0, 200) : '',
    autoReply: Boolean(classification.autoReply),
    priority: ['low', 'medium', 'high'].includes(classification.priority)
      ? classification.priority
      : 'medium',
    actionItems: Array.isArray(classification.actionItems) ? classification.actionItems.slice(0, 3) : [],
  };
}

/**
 * Clasificación heurística local (fallback cuando OpenAI falla)
 */
function fallbackClassification(emailData) {
  console.log('[emailClassificationService] Usando clasificación heurística local');
  
  const subject = (emailData.subject || '').toLowerCase();
  const body = (emailData.body || '').toLowerCase();
  const from = (emailData.from || '').toLowerCase();
  const text = `${subject} ${body} ${from}`;
  
  let category = 'General';
  let tags = [];
  let folder = 'inbox';
  let autoReply = false;
  let priority = 'medium';
  let confidence = 0.4; // Baja confianza en heurística
  
  // Detectar categoría por palabras clave
  if (/(proveedor|vendor|supplier|catering|fotografo|florist)/i.test(text)) {
    category = 'Proveedor';
    tags.push('proveedor');
    priority = 'high';
    confidence = 0.6;
  } else if (/(confirmaci[oó]n|asist|rsvp|invited)/i.test(text)) {
    category = 'RSVP';
    tags.push('rsvp');
    autoReply = true;
    priority = 'high';
    confidence = 0.7;
  } else if (/(factura|invoice|pago|payment|presupuesto|quote)/i.test(text)) {
    if (/(factura|invoice)/i.test(text)) {
      category = 'Facturas';
      tags.push('factura');
    } else {
      category = 'Finanzas';
      tags.push('finanzas');
    }
    priority = 'high';
    confidence = 0.65;
  } else if (/(contrato|contract|firma|sign|legal)/i.test(text)) {
    category = 'Contratos';
    tags.push('contrato', 'legal');
    priority = 'high';
    confidence = 0.7;
  } else if (/(reuni[oó]n|meeting|cita|appointment)/i.test(text)) {
    category = 'Reuniones';
    tags.push('reunion');
    priority = 'medium';
    confidence = 0.6;
  } else if (/(invitado|guest|invite)/i.test(text)) {
    category = 'Invitado';
    tags.push('invitado');
    confidence = 0.5;
  }
  
  // Detectar carpeta
  if (/(urgent|importante|asap)/i.test(text)) {
    folder = 'important';
    priority = 'high';
  }
  
  return {
    category,
    tags,
    folder,
    confidence,
    reason: 'Clasificación basada en palabras clave (heurística local)',
    autoReply,
    priority,
    actionItems: [],
    source: 'heuristic',
    model: 'local',
  };
}

/**
 * Registra métricas de clasificación
 */
async function recordClassificationMetric(metric) {
  try {
    await db.collection('emailClassificationMetrics').add({
      ...metric,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('[emailClassificationService] No se pudo guardar métrica:', error.message);
  }
}

/**
 * Obtiene estadísticas de clasificación
 */
export async function getClassificationStats(days = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const snapshot = await db.collection('emailClassificationMetrics')
      .where('timestamp', '>=', startDate.toISOString())
      .get();
    
    const total = snapshot.size;
    let successful = 0;
    let failed = 0;
    let usingOpenAI = 0;
    let usingHeuristic = 0;
    let totalDuration = 0;
    const categoryCounts = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      if (data.success) {
        successful++;
        if (data.model && data.model !== 'local') {
          usingOpenAI++;
        } else {
          usingHeuristic++;
        }
        
        if (data.category) {
          categoryCounts[data.category] = (categoryCounts[data.category] || 0) + 1;
        }
      } else {
        failed++;
      }
      
      if (data.durationMs) {
        totalDuration += data.durationMs;
      }
    });
    
    return {
      period: `${days} days`,
      total,
      successful,
      failed,
      successRate: total > 0 ? successful / total : 0,
      usingOpenAI,
      usingHeuristic,
      avgDurationMs: total > 0 ? totalDuration / total : 0,
      categoryCounts,
    };
  } catch (error) {
    console.error('[emailClassificationService] Error obteniendo stats:', error);
    throw error;
  }
}

export default {
  callClassificationAPI,
  getClassificationStats,
};
