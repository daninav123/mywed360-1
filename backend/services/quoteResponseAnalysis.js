/**
 * 🤖 Servicio de análisis de respuestas de presupuestos con IA
 * 
 * Analiza emails de proveedores que responden a solicitudes de presupuesto,
 * extrayendo información estructurada de texto libre y PDFs adjuntos.
 */

console.log('📦 [quoteResponseAnalysis] Módulo cargándose...');
console.log('   OPENAI_API_KEY al cargar módulo:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 15)}...` : '❌ UNDEFINED');
console.log('   OPENAI_PROJECT_ID al cargar módulo:', process.env.OPENAI_PROJECT_ID || '❌ UNDEFINED');

import OpenAI from 'openai';
import logger from '../utils/logger.js';
import { extractTextFromAttachment } from './attachmentText.js';

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const TIMEOUT_MS = 15000;

let openaiClient = null;

console.log('📦 [quoteResponseAnalysis] Módulo cargado. openaiClient inicial:', openaiClient);

function initOpenAI() {
  if (openaiClient) {
    console.log('🔄 [initOpenAI] Cliente ya inicializado');
    return;
  }
  
  console.log('🔧 [initOpenAI] Iniciando cliente OpenAI...');
  
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const projectId = process.env.OPENAI_PROJECT_ID;
    
    console.log('📋 [initOpenAI] Variables disponibles:');
    console.log('   - OPENAI_API_KEY:', apiKey ? `${apiKey.substring(0, 15)}...` : '❌ UNDEFINED');
    console.log('   - OPENAI_PROJECT_ID:', projectId || '❌ UNDEFINED');
    
    if (!apiKey) {
      logger.error('[quoteResponseAnalysis] ❌ FALTA OPENAI_API_KEY');
      console.error('❌ [initOpenAI] OPENAI_API_KEY no configurada - OpenAI NO funcionará');
      return;
    }
    
    if (!projectId) {
      logger.warn('[quoteResponseAnalysis] ⚠️ OPENAI_PROJECT_ID no configurado - esto puede causar errores');
      console.warn('⚠️ [initOpenAI] OPENAI_PROJECT_ID no configurado');
    }
    
    console.log('🚀 [initOpenAI] Creando cliente OpenAI...');
    
    openaiClient = new OpenAI({
      apiKey,
      project: projectId,
      timeout: TIMEOUT_MS,
      maxRetries: 2,
    });
    
    console.log('✅ [initOpenAI] Cliente OpenAI creado exitosamente');
    
    logger.info('✅ Cliente OpenAI inicializado en quoteResponseAnalysis', {
      projectId: projectId || '❌ NOT SET',
      apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'not set',
    });
  } catch (err) {
    console.error('❌ [initOpenAI] Error creando cliente:', err.message);
    logger.error('❌ Error inicializando OpenAI:', err);
  }
}

// NO inicializar aquí - hacerlo lazy cuando se use por primera vez
// initOpenAI();

/**
 * Analiza un email de respuesta de presupuesto y extrae datos estructurados
 * 
 * @param {Object} params
 * @param {string} params.subject - Asunto del email
 * @param {string} params.body - Cuerpo del email (texto plano)
 * @param {Array} params.attachments - Adjuntos con texto extraído
 * @param {string} [params.supplierName] - Nombre del proveedor (opcional)
 * @param {string} [params.categoryName] - Categoría del servicio (opcional)
 * @returns {Promise<Object>} Datos del presupuesto extraídos
 */
export async function analyzeQuoteResponse({
  subject = '',
  body = '',
  attachments = [],
  supplierName = '',
  categoryName = '',
}) {
  // Inicializar OpenAI si no está inicializado (lazy initialization)
  if (!openaiClient) {
    console.log('🔄 [analyzeQuoteResponse] Cliente OpenAI no inicializado, llamando initOpenAI()...');
    initOpenAI();
    console.log('🔄 [analyzeQuoteResponse] initOpenAI() ejecutado. openaiClient ahora:', openaiClient ? 'INICIALIZADO ✅' : 'SIGUE NULL ❌');
  }
  
  if (!openaiClient) {
    logger.error('[quoteResponseAnalysis] ❌ OpenAI no disponible después de intentar inicializar');
    console.error('❌ [analyzeQuoteResponse] OpenAI client es NULL. No se puede continuar.');
    return null;
  }

  console.log('✅ [analyzeQuoteResponse] Cliente OpenAI disponible, procediendo con análisis...');

  try {
    // 🎓 Few-Shot Learning: Cargar ejemplos validados de esta categoría
    const goldenExamples = await getGoldenExamples(categoryName, 3);
    console.log(`📚 [analyzeQuoteResponse] Cargados ${goldenExamples.length} golden examples para ${categoryName}`);
    
    // Combinar todo el texto disponible
    let fullText = `Asunto: ${subject}\n\nCuerpo del email:\n${body}`;
    
    // Añadir texto de adjuntos (especialmente PDFs)
    if (attachments && attachments.length > 0) {
      fullText += '\n\n--- DOCUMENTOS ADJUNTOS ---\n';
      for (const att of attachments) {
        if (att.text && att.text.trim()) {
          fullText += `\n[${att.filename || 'Adjunto'}]:\n${att.text}\n`;
        }
      }
    }

    // Limitar tamaño para no exceder tokens
    const MAX_CHARS = 15000;
    if (fullText.length > MAX_CHARS) {
      fullText = fullText.substring(0, MAX_CHARS) + '\n... (texto truncado)';
    }

    const systemPrompt = `Eres un asistente experto en analizar presupuestos de servicios para bodas.
Tu tarea es extraer información estructurada de emails y documentos adjuntos donde proveedores envían sus presupuestos.

Extrae la siguiente información si está disponible:
- Precio total (número, sin símbolos ni comas)
- Desglose de precios por servicio/concepto
- Servicios incluidos (lista)
- Extras u opcionales disponibles
- Condiciones de pago (anticipo, forma de pago)
- Tiempo de entrega o disponibilidad
- Política de cancelación
- Garantía o seguros
- Notas adicionales relevantes

Si un campo no está disponible, devuélvelo como null.
Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional.`;

    const userPrompt = `${supplierName ? `Proveedor: ${supplierName}\n` : ''}${categoryName ? `Categoría: ${categoryName}\n` : ''}\n${fullText}

Extrae la información del presupuesto en formato JSON con esta estructura:
{
  "totalPrice": número o null,
  "priceBreakdown": [{"concept": "...", "amount": número}] o [],
  "servicesIncluded": ["servicio1", "servicio2"] o [],
  "extras": ["extra1", "extra2"] o [],
  "paymentTerms": "descripción de condiciones de pago" o null,
  "deliveryTime": "tiempo de entrega" o null,
  "cancellationPolicy": "política de cancelación" o null,
  "warranty": "garantía o seguros" o null,
  "additionalNotes": "notas adicionales" o null,
  "confidence": número 0-100 (tu confianza en la extracción)
}`;

    logger.info(`[quoteResponseAnalysis] Analizando presupuesto con ${fullText.length} caracteres`);

    const completion = await openaiClient.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    
    console.log('📥 [analyzeQuoteResponse] Respuesta OpenAI recibida, longitud:', responseText?.length || 0);
    
    if (!responseText) {
      logger.warn('[quoteResponseAnalysis] Sin respuesta de OpenAI');
      return null;
    }

    console.log('📄 [analyzeQuoteResponse] Contenido respuesta (primeros 200 chars):', responseText.substring(0, 200));

    // Limpiar respuesta (a veces viene con ```json ... ```)
    let cleanedResponse = responseText;
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      console.log('🧹 [analyzeQuoteResponse] Limpiado markdown json');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
      console.log('🧹 [analyzeQuoteResponse] Limpiado markdown');
    }

    let extracted;
    try {
      extracted = JSON.parse(cleanedResponse);
      console.log('✅ [analyzeQuoteResponse] JSON parseado exitosamente');
    } catch (parseError) {
      console.error('❌ [analyzeQuoteResponse] Error parseando JSON:', parseError.message);
      console.error('📄 [analyzeQuoteResponse] Respuesta que causó error:', cleanedResponse.substring(0, 500));
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
    }
    
    logger.info(`[quoteResponseAnalysis] ✅ Presupuesto analizado - Precio: ${extracted.totalPrice || 'N/A'}, Confianza: ${extracted.confidence || 'N/A'}%`);

    return {
      ...extracted,
      analyzedAt: new Date().toISOString(),
      model: DEFAULT_MODEL,
    };
  } catch (error) {
    console.error('\n❌ [analyzeQuoteResponse] ERROR COMPLETO:');
    console.error('   Tipo:', error.constructor.name);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    console.error('   Code:', error.code);
    console.error('   Status:', error.status);
    console.error('   Type:', error.type);
    
    // Capturar TODAS las propiedades del error
    console.error('   Todas las keys:', Object.keys(error));
    for (const key of Object.keys(error)) {
      console.error(`   ${key}:`, error[key]);
    }
    
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
    
    if (error.error) {
      console.error('   error.error:', error.error);
    }
    
    logger.error('[quoteResponseAnalysis] Error analizando presupuesto:', error.message);
    logger.error('[quoteResponseAnalysis] Stack:', error.stack);
    return null;
  }
}

/**
 * Intenta identificar a qué solicitud de presupuesto corresponde un email
 * 
 * Busca por:
 * - Email del remitente
 * - Referencias en el subject (Re: ...)
 * - Menciones en el cuerpo
 * 
 * @param {Object} params
 * @param {string} params.fromEmail - Email del remitente
 * @param {string} params.subject - Asunto del email
 * @param {string} params.body - Cuerpo del email
 * @param {Object} params.db - Instancia de Firestore
 * @returns {Promise<Object|null>} Solicitud encontrada o null
 */
export async function findMatchingQuoteRequest({
  fromEmail,
  subject = '',
  body = '',
  db,
}) {
  console.log('🔍 [findMatchingQuoteRequest] Buscando solicitud correspondiente...');
  console.log('   From:', fromEmail);
  console.log('   Subject:', subject);
  
  if (!db || !fromEmail) {
    console.log('   ❌ DB o fromEmail no disponible');
    return null;
  }

  const normalizedEmail = fromEmail.toLowerCase().trim();
    
  console.log('   📧 Email normalizado:', normalizedEmail);
  logger.info(`[quoteResponseAnalysis] Buscando solicitud para: ${normalizedEmail}`);

  // 1. Buscar en solicitudes pendientes por email del proveedor
  // Buscar en proveedores registrados
  console.log('   📋 Buscando en proveedores registrados...');
  const suppliersSnapshot = await db
    .collection('suppliers')
    .where('contact.email', '==', normalizedEmail)
    .limit(5)
    .get();

  console.log(`   → Proveedores encontrados: ${suppliersSnapshot.size}`);

  for (const supplierDoc of suppliersSnapshot.docs) {
    console.log(`   📁 Revisando proveedor: ${supplierDoc.id}`);
    
    // Buscar solicitudes en orden: pending → quoted → accepted
    const statusesToCheck = ['pending', 'quoted', 'accepted'];
    let requestsSnapshot = { empty: true };
    
    for (const status of statusesToCheck) {
      console.log(`   🔍 Buscando solicitudes con status="${status}"...`);
      requestsSnapshot = await db
        .collection('suppliers')
        .doc(supplierDoc.id)
        .collection('quote-requests')
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      
      if (!requestsSnapshot.empty) {
        console.log(`   ✅ Solicitud encontrada con status="${status}"`);
        break;
      }
    }

    if (!requestsSnapshot.empty) {
      const request = requestsSnapshot.docs[0];
      const requestData = request.data();
      console.log(`   ✅ Solicitud encontrada: ${request.id} (status: ${requestData.status})`);
      logger.info(`[quoteResponseAnalysis] ✅ Solicitud encontrada en proveedor registrado: ${request.id} (status: ${requestData.status})`);
      return {
        requestId: request.id,
        supplierId: supplierDoc.id,
        data: requestData,
        source: 'registered_supplier',
      };
    }
  }

  // 2. Buscar en solicitudes de proveedores de internet
  console.log('   🌐 Buscando en proveedores de internet...');
  try {
      const internetRequestsSnapshot = await db
        .collection('quote-requests-internet')
        .where('supplierEmail', '==', normalizedEmail)
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (!internetRequestsSnapshot.empty) {
        const request = internetRequestsSnapshot.docs[0];
        logger.info(`[quoteResponseAnalysis] ✅ Solicitud encontrada en proveedor de internet: ${request.id}`);
        return {
          requestId: request.id,
          supplierId: null,
          data: request.data(),
          source: 'internet_supplier',
        };
      }

      const quotedSnapshot = await db
        .collection('quote-requests-internet')
        .where('supplierEmail', '==', normalizedEmail)
        .where('status', '==', 'quoted')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (!quotedSnapshot.empty) {
        const request = quotedSnapshot.docs[0];
        logger.info(`[quoteResponseAnalysis] ✅ Solicitud (quoted) encontrada en proveedor de internet: ${request.id}`);
        return {
          requestId: request.id,
          supplierId: null,
          data: request.data(),
          source: 'internet_supplier',
        };
      }
    } catch (indexError) {
      // Si falla por falta de índice, buscar sin orderBy
      logger.warn('[quoteResponseAnalysis] Query con índice falló, intentando sin orderBy');
      try {
        const simpleSnapshot = await db
          .collection('quote-requests-internet')
          .where('supplierEmail', '==', normalizedEmail)
          .limit(10)
          .get();

        if (!simpleSnapshot.empty) {
          // Buscar el más reciente manualmente
          let mostRecent = null;
          simpleSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'pending' || data.status === 'quoted') {
              if (!mostRecent || (data.createdAt && data.createdAt > mostRecent.createdAt)) {
                mostRecent = { id: doc.id, data };
              }
            }
          });

          if (mostRecent) {
            logger.info(`[quoteResponseAnalysis] ✅ Solicitud encontrada (sin índice): ${mostRecent.id}`);
            return {
              requestId: mostRecent.id,
              supplierId: null,
              data: mostRecent.data,
              source: 'internet_supplier',
            };
          }
        }
      } catch (fallbackError) {
        logger.error('[quoteResponseAnalysis] Error en búsqueda fallback:', fallbackError.message);
      }
    }

    // 3. Buscar por coincidencia en subject (Re: ..., Fwd: ...)
    // Extraer posibles IDs del subject
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('solicitud') || subjectLower.includes('presupuesto')) {
      // Buscar todas las solicitudes pendientes y buscar por nombre
      const allPendingSnapshot = await db
        .collectionGroup('quote-requests')
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      for (const doc of allPendingSnapshot.docs) {
        const data = doc.data();
        // Verificar si el email coincide (aunque no sea exacto)
        if (data.supplierEmail && data.supplierEmail.toLowerCase() === normalizedEmail) {
          logger.info(`[quoteResponseAnalysis] ✅ Solicitud encontrada por collectionGroup: ${doc.id}`);
          return {
            requestId: doc.id,
            supplierId: data.supplierId,
            data,
            source: 'collection_group',
          };
        }
      }
    }

    logger.warn(`[quoteResponseAnalysis] ⚠️ No se encontró solicitud para: ${normalizedEmail}`);
    return null;
}

/**
 * Detecta si un email es una respuesta a una solicitud de presupuesto
 * 
 * @param {Object} params
 * @param {string} params.subject
 * @param {string} params.body
 * @param {string} params.fromEmail
 * @returns {boolean}
 */
export function isQuoteResponse({ subject = '', body = '' }) {
  const subjectLower = subject.toLowerCase();
  const bodyLower = body.toLowerCase();
  
  console.log('🔍 [isQuoteResponse] Analizando email...');
  console.log('   Subject:', subject);
  console.log('   Body preview:', body.substring(0, 200));
  
  const quoteKeywords = [
    'presupuesto',
    'cotización',
    'cotizacion',
    'precio',
    'tarifa',
    'coste',
    'oferta',
    'propuesta',
    'quote',
    'budget',
    'estimate',
  ];

  const responseIndicators = [
    're:',
    'fwd:',
    'fw:',
  ];

  const attachmentIndicators = [
    'adjunto',
    'attached',
    'attachment',
    'pdf',
    'documento',
  ];

  // Debe tener indicador de respuesta en subject O mención de adjunto
  const hasResponseIndicator = responseIndicators.some(kw => subjectLower.includes(kw));
  const hasAttachmentMention = attachmentIndicators.some(kw => bodyLower.includes(kw) || subjectLower.includes(kw));
  
  // Y debe mencionar palabras relacionadas con presupuesto
  const hasQuoteKeyword = quoteKeywords.some(kw => subjectLower.includes(kw) || bodyLower.includes(kw));

  console.log('   ✓ hasResponseIndicator:', hasResponseIndicator);
  console.log('   ✓ hasAttachmentMention:', hasAttachmentMention);
  console.log('   ✓ hasQuoteKeyword:', hasQuoteKeyword);
  
  const isQuote = (hasResponseIndicator || hasAttachmentMention) && hasQuoteKeyword;
  console.log('   → Resultado:', isQuote ? '✅ SÍ es respuesta de presupuesto' : '❌ NO es respuesta de presupuesto');

  // Detección más estricta: (respuesta O adjunto) Y palabra clave de presupuesto
  return isQuote;
}
