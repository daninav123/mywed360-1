import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

let openaiClient = null;

function getOpenAIClient() {
  if (!openaiClient) {
    console.log('[AI Training] Inicializando cliente OpenAI (lazy)...');
    const apiKey = process.env.OPENAI_API_KEY;
    const projectId = process.env.OPENAI_PROJECT_ID || 'proj_7IWFKysvJciPmnkpqop9rrpT';
    
    console.log('[AI Training] API Key ends with:', apiKey.substring(apiKey.length - 10));
    console.log('[AI Training] Project ID:', projectId);
    
    openaiClient = new OpenAI({
      apiKey,
      project: projectId,
    });
  }
  return openaiClient;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'));
    }
  },
});

/**
 * DEBUG: Endpoint para verificar configuración de OpenAI
 * PROTEGIDO: Solo admin puede acceder
 */
router.get('/debug-config', requireAdmin, (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY || 'NO_SET';
  const projectId = process.env.OPENAI_PROJECT_ID || 'NO_SET';
  
  return res.json({
    success: true,
    config: {
      apiKeyPrefix: apiKey !== 'NO_SET' ? apiKey.substring(0, 10) + '...' : 'NO_SET',
      apiKeySuffix: apiKey !== 'NO_SET' ? '...' + apiKey.substring(apiKey.length - 4) : 'NO_SET',
      projectId: projectId,
      openaiConfigured: apiKey !== 'NO_SET',
    }
  });
});

/**
 * POST /api/admin/ai-training/extract-pdf
 * Sube un PDF y extrae automáticamente todos los datos del presupuesto usando IA
 */
router.post('/extract-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se recibió ningún archivo PDF',
      });
    }

    console.log('[AI Training] Procesando PDF:', req.file.originalname);

    // Usar pdfjs-dist en lugar de pdf-parse (que tiene bug con archivo test)
    // Convertir Buffer a Uint8Array (requerido por pdfjs-dist)
    const uint8Array = new Uint8Array(req.file.buffer);
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdfDocument = await loadingTask.promise;
    
    let pdfText = '';
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      pdfText += pageText + '\n';
    }

    if (!pdfText || pdfText.trim().length < 50) {
      console.log('[AI Training] Texto insuficiente:', pdfText.length);
      return res.status(400).json({
        success: false,
        error: 'El PDF no contiene suficiente texto para analizar. Puede ser un PDF escaneado o de solo imágenes.',
      });
    }

    console.log('[AI Training] Texto extraído del PDF (longitud:', pdfText.length, '):', pdfText.substring(0, 500) + '...');
    
    // Limitar longitud del texto para evitar tokens excesivos
    const maxChars = 15000; // ~4000 tokens aprox
    if (pdfText.length > maxChars) {
      console.log('[AI Training] Texto muy largo, truncando de', pdfText.length, 'a', maxChars);
      pdfText = pdfText.substring(0, maxChars) + '\n\n[... texto truncado ...]';
    }

    const prompt = `Analiza el siguiente presupuesto de boda y extrae TODOS los datos en formato JSON estructurado.

PRESUPUESTO:
${pdfText}

Extrae la siguiente información:
- categoryName: Categoría del servicio (Música, Fotografía, Catering, Decoración, Floristería, Videografía, etc.)
- supplierName: Nombre COMERCIAL del proveedor (el nombre por el que se conoce el negocio, no el nombre legal/fiscal)
- supplierLegalName: Nombre legal/fiscal del proveedor (si aparece, ej: "Juan Pérez García", "Eventos y Servicios S.L.")
- totalPrice: Precio total en euros (solo número, sin símbolo €)
- servicesIncluded: Array de servicios incluidos (cada servicio en un string separado)
- paymentTerms: Condiciones de pago
- deliveryTime: Tiempo de entrega o disponibilidad
- emailBody: Texto completo del presupuesto (todo el contenido relevante)
- additionalNotes: Notas o información adicional relevante

IMPORTANTE:
- supplierName debe ser el nombre COMERCIAL con el que opera el negocio (ej: "MusicEvents", "Flores Bonitas", "DJ Carlos")
- supplierLegalName es el nombre legal/fiscal si aparece (ej: "Juan García Pérez", "Eventos Musicales SL")
- Si solo encuentras un nombre, ponlo en supplierName y deja supplierLegalName como null
- Si no encuentras algún dato, devuelve null
- totalPrice debe ser un número (ej: 1500, no "1500€")
- servicesIncluded debe ser un array de strings
- Sé exhaustivo en la extracción

Responde SOLO con el JSON, sin explicaciones adicionales.`;

    console.log('[AI Training] Enviando a OpenAI...');
    
    const openaiClient = getOpenAIClient();
    
    // Timeout de 45 segundos para OpenAI
    const completionPromise = openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto extrayendo datos estructurados de presupuestos de bodas. Devuelves siempre JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: OpenAI tardó más de 45 segundos')), 45000)
    );
    
    const completion = await Promise.race([completionPromise, timeoutPromise]);

    if (!completion || !completion.choices || !completion.choices[0]) {
      console.error('[AI Training] Respuesta de OpenAI vacía o malformada');
      return res.status(500).json({
        success: false,
        error: 'La IA no devolvió una respuesta válida',
      });
    }
    
    const extractedText = completion.choices[0].message.content;
    console.log('[AI Training] Respuesta IA recibida (longitud:', extractedText.length, ')');
    console.log('[AI Training] Respuesta IA:', extractedText.substring(0, 200) + '...');

    let extractedData;
    try {
      extractedData = JSON.parse(extractedText);
    } catch (parseError) {
      console.error('[AI Training] Error parseando JSON de IA:', parseError);
      console.error('[AI Training] Texto recibido:', extractedText);
      return res.status(500).json({
        success: false,
        error: 'La IA devolvió un formato inválido. Intenta con otro PDF.',
      });
    }

    // Normalizar y validar datos extraídos
    if (typeof extractedData.totalPrice === 'string') {
      const priceMatch = extractedData.totalPrice.match(/[\d.,]+/);
      extractedData.totalPrice = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : null;
    }

    if (!Array.isArray(extractedData.servicesIncluded)) {
      if (typeof extractedData.servicesIncluded === 'string') {
        extractedData.servicesIncluded = [extractedData.servicesIncluded];
      } else {
        extractedData.servicesIncluded = [];
      }
    }
    
    // Validar que tengamos al menos datos mínimos
    const hasMinimumData = extractedData.categoryName || extractedData.supplierName || extractedData.totalPrice;
    if (!hasMinimumData) {
      console.log('[AI Training] Advertencia: Datos extraídos muy limitados');
    }

    console.log('[AI Training] Datos extraídos y procesados:', JSON.stringify(extractedData, null, 2));

    console.log('✅ [AI Training] Proceso completado exitosamente');
    return res.json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error('❌ [AI Training] Error procesando PDF:', error);
    console.error('❌ [AI Training] Error stack:', error.stack);
    console.error('❌ [AI Training] Error message:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error procesando el PDF',
    });
  }
});

/**
 * POST /api/admin/ai-training/save-comparison
 * Guarda una comparación de presupuestos como ejemplo de entrenamiento para la IA
 */
router.post('/save-comparison', async (req, res) => {
  try {
    const { quoteA, quoteB, winner, factors, notes, adminUserId } = req.body;
    
    console.log('[AI Training] Guardando comparación de entrenamiento...');
    console.log('   Winner:', winner);
    console.log('   Factors:', factors);
    
    // Validaciones básicas
    if (!quoteA || !quoteB || !winner) {
      return res.status(400).json({
        success: false,
        error: 'Datos incompletos: se requieren ambos presupuestos y el ganador',
      });
    }
    
    if (!['A', 'B'].includes(winner)) {
      return res.status(400).json({
        success: false,
        error: 'Winner debe ser "A" o "B"',
      });
    }
    
    // Crear documento de comparación para training
    const comparisonExample = {
      type: 'comparison',
      timestamp: new Date().toISOString(),
      adminUserId: adminUserId || 'unknown',
      
      // Presupuesto A
      quoteA: {
        categoryName: quoteA.categoryName,
        supplierName: quoteA.supplierName,
        totalPrice: quoteA.totalPrice,
        servicesIncluded: quoteA.servicesIncluded || [],
        paymentTerms: quoteA.paymentTerms,
        deliveryTime: quoteA.deliveryTime,
        cancellationPolicy: quoteA.cancellationPolicy,
        confidence: quoteA.confidence || null,
        supplierRating: quoteA.supplierRating || null,
        supplierReviews: quoteA.supplierReviews || null,
      },
      
      // Presupuesto B
      quoteB: {
        categoryName: quoteB.categoryName,
        supplierName: quoteB.supplierName,
        totalPrice: quoteB.totalPrice,
        servicesIncluded: quoteB.servicesIncluded || [],
        paymentTerms: quoteB.paymentTerms,
        deliveryTime: quoteB.deliveryTime,
        cancellationPolicy: quoteB.cancellationPolicy,
        confidence: quoteB.confidence || null,
        supplierRating: quoteB.supplierRating || null,
        supplierReviews: quoteB.supplierReviews || null,
      },
      
      // Decisión y factores
      decision: {
        winner: winner, // 'A' o 'B'
        factors: factors || [], // Array de factores que influyeron
        notes: notes || '',
      },
      
      // Calcular diferencias automáticamente
      analysis: {
        priceDiff: Math.abs(quoteA.totalPrice - quoteB.totalPrice),
        cheaperQuote: quoteA.totalPrice < quoteB.totalPrice ? 'A' : 'B',
        moreServices: (quoteA.servicesIncluded?.length || 0) > (quoteB.servicesIncluded?.length || 0) ? 'A' : 'B',
        betterRating: (quoteA.supplierRating || 0) > (quoteB.supplierRating || 0) ? 'A' : 'B',
      },
    };
    
    // En una implementación real, guardarías esto en una base de datos
    // Por ahora, lo guardamos en un archivo JSON para entrenamiento
    const fs = await import('fs');
    const path = await import('path');
    const trainingDir = path.join(process.cwd(), 'ai-training-data');
    
    // Crear directorio si no existe
    if (!fs.existsSync(trainingDir)) {
      fs.mkdirSync(trainingDir, { recursive: true });
    }
    
    const filename = `comparison_${Date.now()}_${winner}.json`;
    const filepath = path.join(trainingDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(comparisonExample, null, 2));
    
    console.log('[AI Training] ✅ Comparación guardada:', filename);
    
    return res.json({
      success: true,
      message: 'Comparación guardada como ejemplo de entrenamiento',
      data: {
        id: filename,
        winner,
        factorsCount: factors?.length || 0,
      },
    });
    
  } catch (error) {
    console.error('[AI Training] Error guardando comparación:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al guardar la comparación: ' + error.message,
    });
  }
});

export default router;
