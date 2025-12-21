/**
 * 🎓 API de validación y entrenamiento de IA
 * 
 * Endpoints para:
 * - Actualizar campos de quotes corregidos por usuarios
 * - Marcar quotes como ejemplos validados (golden examples)
 * - Obtener estadísticas de precisión de IA
 * - Añadir ejemplos manualmente desde admin panel
 */

import express from 'express';
import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * PATCH /api/quote-validation/:quoteId/field
 * Actualizar un campo específico de un quote (corrección de usuario)
 */
router.patch('/:quoteId/field', async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { fieldName, value, userId } = req.body;

    if (!fieldName || value === undefined) {
      return res.status(400).json({ error: 'fieldName y value son requeridos' });
    }

    const quoteRef = db.collection('quote-responses').doc(quoteId);
    const quoteDoc = await quoteRef.get();

    if (!quoteDoc.exists) {
      return res.status(404).json({ error: 'Quote no encontrado' });
    }

    // Actualizar campo + trackear corrección
    await quoteRef.update({
      [fieldName]: value,
      [`userCorrections.${fieldName}`]: {
        originalValue: quoteDoc.data()[fieldName],
        correctedValue: value,
        correctedBy: userId,
        correctedAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info(`[quote-validation] Campo ${fieldName} corregido en quote ${quoteId}`);

    res.json({ 
      success: true,
      message: `Campo ${fieldName} actualizado correctamente` 
    });

  } catch (error) {
    logger.error('[quote-validation] Error actualizando campo:', error);
    res.status(500).json({ error: 'Error actualizando campo' });
  }
});

/**
 * POST /api/quote-validation/:quoteId/validate
 * Marcar quote como validado (con o sin correcciones)
 */
router.post('/:quoteId/validate', async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { wasEdited, editedFields, userId } = req.body;

    const quoteRef = db.collection('quote-responses').doc(quoteId);
    const quoteDoc = await quoteRef.get();

    if (!quoteDoc.exists) {
      return res.status(404).json({ error: 'Quote no encontrado' });
    }

    const quoteData = quoteDoc.data();

    // Marcar como validado
    await quoteRef.update({
      'validation': {
        isValidated: true,
        wasEdited,
        editedFields: editedFields || [],
        validatedBy: userId,
        validatedAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Si está validado y no tiene errores, guardarlo como golden example
    if (!wasEdited || editedFields.length === 0) {
      await db.collection('quote-golden-examples').add({
        quoteId,
        emailSubject: quoteData.emailSubject,
        emailBody: quoteData.emailBody,
        categoryName: quoteData.categoryName,
        supplierName: quoteData.supplierName,
        validatedData: {
          totalPrice: quoteData.totalPrice,
          priceBreakdown: quoteData.priceBreakdown || [],
          servicesIncluded: quoteData.servicesIncluded || [],
          extras: quoteData.extras || [],
          paymentTerms: quoteData.paymentTerms,
          deliveryTime: quoteData.deliveryTime,
          cancellationPolicy: quoteData.cancellationPolicy,
        },
        confidence: 100,
        isGoldenExample: true,
        source: 'user_validation',
        createdBy: userId,
        createdAt: FieldValue.serverTimestamp(),
      });

      logger.info(`[quote-validation] ⭐ Golden example creado desde quote ${quoteId}`);
    }

    logger.info(`[quote-validation] Quote ${quoteId} validado (editado: ${wasEdited})`);

    res.json({ 
      success: true,
      message: wasEdited 
        ? 'Correcciones guardadas. ¡Gracias por mejorar la IA!' 
        : '¡Datos validados! La IA aprenderá de este ejemplo perfecto.',
      isGoldenExample: !wasEdited
    });

  } catch (error) {
    logger.error('[quote-validation] Error validando quote:', error);
    res.status(500).json({ error: 'Error validando quote' });
  }
});

/**
 * GET /api/quote-validation/stats
 * Obtener estadísticas de precisión de IA
 */
router.get('/stats', async (req, res) => {
  try {
    const { categoryName } = req.query;

    let query = db.collection('quote-responses')
      .where('validation.isValidated', '==', true);

    if (categoryName) {
      query = query.where('categoryName', '==', categoryName);
    }

    const validatedQuotes = await query.get();

    const stats = {
      total: validatedQuotes.size,
      perfect: 0, // Sin correcciones
      withCorrections: 0,
      fieldAccuracy: {},
      mostCorrectedFields: [],
    };

    const fieldCorrectionCount = {};

    validatedQuotes.forEach(doc => {
      const data = doc.data();
      
      if (data.validation.wasEdited) {
        stats.withCorrections++;
        
        // Contar qué campos se corrigieron
        (data.validation.editedFields || []).forEach(field => {
          fieldCorrectionCount[field] = (fieldCorrectionCount[field] || 0) + 1;
        });
      } else {
        stats.perfect++;
      }
    });

    // Calcular precisión por campo
    const totalQuotes = stats.total;
    Object.keys(fieldCorrectionCount).forEach(field => {
      const corrections = fieldCorrectionCount[field];
      const accuracy = ((totalQuotes - corrections) / totalQuotes * 100).toFixed(1);
      stats.fieldAccuracy[field] = {
        accuracy: parseFloat(accuracy),
        corrections,
        total: totalQuotes,
      };
    });

    // Ordenar campos más corregidos
    stats.mostCorrectedFields = Object.entries(fieldCorrectionCount)
      .sort((a, b) => b[1] - a[1])
      .map(([field, count]) => ({ field, count }));

    // Precisión general
    stats.overallAccuracy = totalQuotes > 0 
      ? ((stats.perfect / totalQuotes) * 100).toFixed(1) 
      : 0;

    res.json(stats);

  } catch (error) {
    logger.error('[quote-validation] Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

/**
 * POST /api/quote-validation/manual-example
 * Añadir ejemplo manualmente desde admin panel
 */
router.post('/manual-example', async (req, res) => {
  try {
    const { 
      emailBody,
      categoryName,
      supplierName,
      totalPrice,
      servicesIncluded,
      paymentTerms,
      deliveryTime,
      additionalNotes,
      adminUserId 
    } = req.body;

    if (!emailBody || !categoryName) {
      return res.status(400).json({ 
        error: 'emailBody y categoryName son requeridos' 
      });
    }

    const goldenExample = await db.collection('quote-golden-examples').add({
      emailBody,
      categoryName,
      supplierName: supplierName || 'Manual Entry',
      validatedData: {
        totalPrice: totalPrice || null,
        servicesIncluded: servicesIncluded || [],
        paymentTerms: paymentTerms || null,
        deliveryTime: deliveryTime || null,
        additionalNotes: additionalNotes || null,
      },
      confidence: 100,
      isGoldenExample: true,
      source: 'admin_manual',
      createdBy: adminUserId,
      createdAt: FieldValue.serverTimestamp(),
    });

    logger.info(`[quote-validation] ⭐ Golden example manual creado: ${goldenExample.id}`);

    res.json({ 
      success: true,
      id: goldenExample.id,
      message: 'Ejemplo añadido correctamente. La IA lo usará para aprender.' 
    });

  } catch (error) {
    logger.error('[quote-validation] Error creando ejemplo manual:', error);
    res.status(500).json({ error: 'Error creando ejemplo manual' });
  }
});

/**
 * GET /api/quote-validation/golden-examples
 * Obtener golden examples para una categoría (usado por IA)
 */
router.get('/golden-examples', async (req, res) => {
  try {
    const { categoryName, limit = 3 } = req.query;

    let query = db.collection('quote-golden-examples')
      .where('isGoldenExample', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit));

    if (categoryName) {
      query = query.where('categoryName', '==', categoryName);
    }

    const snapshot = await query.get();
    
    const examples = [];
    snapshot.forEach(doc => {
      examples.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ examples });

  } catch (error) {
    logger.error('[quote-validation] Error obteniendo golden examples:', error);
    res.status(500).json({ error: 'Error obteniendo ejemplos' });
  }
});

export default router;
