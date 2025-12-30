import express from 'express';
import { db } from '../config/firebase.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/suggest', requireAuth, async (req, res) => {
  try {
    const { category, optionLabel, description, type } = req.body;
    const userId = req.user.uid;

    if (!category || !optionLabel) {
      return res.status(400).json({ 
        error: 'Categoría y label son requeridos' 
      });
    }

    // TEMPORAL: Comentado mientras se construye el índice de Firestore (2-5 min)
    // TODO: Descomentar cuando el índice esté listo
    /*
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const userSuggestionsToday = await db.collection('supplier_option_suggestions')
      .where('suggestedBy.userId', '==', userId)
      .where('metadata.createdAt', '>=', today)
      .get();

    if (userSuggestionsToday.size >= 3) {
      return res.status(429).json({ 
        error: 'Has alcanzado el límite de 3 sugerencias por día' 
      });
    }
    */

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data() || {};

    const suggestion = {
      category,
      categoryName: req.body.categoryName || category,
      optionLabel: optionLabel.trim(),
      description: description?.trim() || '',
      type: type || null,
      suggestedBy: {
        userId,
        userName: userData.displayName || userData.name || 'Usuario',
        email: userData.email || req.user.email || null
      },
      status: 'pending',
      aiValidation: null,
      votes: {
        upvotes: 0,
        downvotes: 0,
        voters: []
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: null,
        approvedBy: null
      }
    };

    const docRef = await db.collection('supplier_option_suggestions').add(suggestion);

    res.json({ 
      success: true, 
      suggestionId: docRef.id,
      message: 'Sugerencia enviada. La IA la validará pronto.' 
    });
  } catch (error) {
    console.error('Error creando sugerencia:', error);
    res.status(500).json({ error: 'Error al crear sugerencia' });
  }
});

router.post('/vote/:suggestionId', requireAuth, async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const { vote } = req.body;
    const userId = req.user.uid;

    if (!['up', 'down'].includes(vote)) {
      return res.status(400).json({ error: 'Voto inválido' });
    }

    const suggestionRef = db.collection('supplier_option_suggestions').doc(suggestionId);
    const suggestionDoc = await suggestionRef.get();

    if (!suggestionDoc.exists) {
      return res.status(404).json({ error: 'Sugerencia no encontrada' });
    }

    const suggestion = suggestionDoc.data();
    const voters = suggestion.votes?.voters || [];

    if (voters.includes(userId)) {
      return res.status(400).json({ error: 'Ya has votado esta sugerencia' });
    }

    const updateData = {
      'votes.voters': [...voters, userId],
      'metadata.updatedAt': new Date()
    };

    if (vote === 'up') {
      updateData['votes.upvotes'] = (suggestion.votes?.upvotes || 0) + 1;
    } else {
      updateData['votes.downvotes'] = (suggestion.votes?.downvotes || 0) + 1;
    }

    await suggestionRef.update(updateData);

    res.json({ 
      success: true, 
      message: 'Voto registrado' 
    });
  } catch (error) {
    console.error('Error registrando voto:', error);
    res.status(500).json({ error: 'Error al registrar voto' });
  }
});

router.get('/pending', requireAuth, async (req, res) => {
  try {
    const snapshot = await db.collection('supplier_option_suggestions')
      .where('status', '==', 'pending')
      .orderBy('metadata.createdAt', 'desc')
      .limit(50)
      .get();

    const suggestions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ suggestions });
  } catch (error) {
    console.error('Error obteniendo sugerencias:', error);
    res.status(500).json({ error: 'Error al obtener sugerencias' });
  }
});

router.get('/dynamic/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const doc = await db.collection('supplier_dynamic_specs')
      .doc(category)
      .get();

    if (!doc.exists) {
      return res.json({ dynamicOptions: {} });
    }

    res.json({ 
      dynamicOptions: doc.data().dynamicOptions || {} 
    });
  } catch (error) {
    console.error('Error obteniendo opciones dinámicas:', error);
    res.status(500).json({ error: 'Error al obtener opciones' });
  }
});

router.get('/my-suggestions', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const snapshot = await db.collection('supplier_option_suggestions')
      .where('suggestedBy.userId', '==', userId)
      .orderBy('metadata.createdAt', 'desc')
      .limit(20)
      .get();

    const suggestions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ suggestions });
  } catch (error) {
    console.error('Error obteniendo sugerencias del usuario:', error);
    res.status(500).json({ error: 'Error al obtener sugerencias' });
  }
});

router.get('/review-queue', requireAuth, async (req, res) => {
  try {
    if (req.userProfile?.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de admin.' });
    }

    const status = req.query.status || 'pending';
    
    // Query sin orderBy para evitar necesidad de índice compuesto
    const snapshot = await db.collection('supplier_option_suggestions')
      .where('status', '==', status)
      .limit(50)
      .get();

    // Ordenar en memoria por fecha
    const suggestions = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => {
        const dateA = a.metadata?.createdAt?.toMillis?.() || 0;
        const dateB = b.metadata?.createdAt?.toMillis?.() || 0;
        return dateB - dateA; // Más recientes primero
      });

    res.json({ suggestions, total: suggestions.length });
  } catch (error) {
    console.error('Error obteniendo cola de revisión:', error);
    res.status(500).json({ error: 'Error al obtener cola de revisión' });
  }
});

router.post('/approve/:suggestionId', requireAuth, async (req, res) => {
  try {
    if (req.userProfile?.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de admin.' });
    }

    const { suggestionId } = req.params;
    const { reason } = req.body;

    const suggestionRef = db.collection('supplier_option_suggestions').doc(suggestionId);
    const suggestionDoc = await suggestionRef.get();

    if (!suggestionDoc.exists) {
      return res.status(404).json({ error: 'Sugerencia no encontrada' });
    }

    const suggestion = { id: suggestionDoc.id, ...suggestionDoc.data() };

    await suggestionRef.update({
      status: 'approved',
      'metadata.approvedAt': new Date(),
      'metadata.approvedBy': req.user.uid,
      'metadata.approvalReason': reason || 'Aprobado manualmente por admin',
      'metadata.updatedAt': new Date()
    });

    // Añadir opción al catálogo dinámico global
    const { addDynamicOption } = await import('../jobs/addDynamicOption.js');
    const { generateKey } = await import('../services/aiOptionValidation.js');
    
    const validation = suggestion.aiValidation || {
      suggestedKey: generateKey(suggestion.optionLabel),
      suggestedLabel: suggestion.optionLabel,
      suggestedType: suggestion.type || 'boolean'
    };
    
    await addDynamicOption(suggestion, validation);
    
    // TODO: Notificar usuario
    // await notifyUserApproval(suggestion);

    res.json({ 
      success: true, 
      message: 'Sugerencia aprobada y añadida al catálogo' 
    });
  } catch (error) {
    console.error('Error aprobando sugerencia:', error);
    res.status(500).json({ error: 'Error al aprobar sugerencia' });
  }
});

router.post('/reject/:suggestionId', requireAuth, async (req, res) => {
  try {
    if (req.userProfile?.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de admin.' });
    }

    const { suggestionId } = req.params;
    const { reason } = req.body;

    const suggestionRef = db.collection('supplier_option_suggestions').doc(suggestionId);
    const suggestionDoc = await suggestionRef.get();

    if (!suggestionDoc.exists) {
      return res.status(404).json({ error: 'Sugerencia no encontrada' });
    }

    const suggestion = { id: suggestionDoc.id, ...suggestionDoc.data() };

    await suggestionRef.update({
      status: 'rejected',
      'metadata.rejectedAt': new Date(),
      'metadata.rejectedBy': req.user.uid,
      'metadata.rejectionReason': reason || 'Rechazado manualmente por admin',
      'metadata.updatedAt': new Date()
    });

    // Si la sugerencia estaba aprobada previamente, eliminar del catálogo dinámico
    if (suggestion.status === 'approved' && suggestion.aiValidation?.suggestedKey) {
      try {
        const { removeDynamicOption } = await import('../jobs/removeDynamicOption.js');
        await removeDynamicOption(suggestion);
        console.log('✅ Opción eliminada del catálogo dinámico tras rechazo');
      } catch (removeError) {
        console.error('⚠️ Error eliminando opción del catálogo:', removeError);
        // No fallar la operación completa por esto
      }
    }

    // TODO: Implementar notificación al usuario
    // const { notifyUserRejection } = await import('../jobs/processOptionSuggestions.js');
    // await notifyUserRejection(suggestion, reason || 'Rechazado por el equipo de revisión');

    res.json({ 
      success: true, 
      message: 'Sugerencia rechazada y eliminada del catálogo' 
    });
  } catch (error) {
    console.error('Error rechazando sugerencia:', error);
    res.status(500).json({ error: 'Error al rechazar sugerencia' });
  }
});

router.get('/stats', requireAuth, async (req, res) => {
  try {
    if (req.userProfile?.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de admin.' });
    }

    // TEMPORAL: Sin índices, obtener todas las sugerencias sin filtros
    const allSuggestions = await db.collection('supplier_option_suggestions').get();
    
    const stats = {
      total: allSuggestions.size,
      byStatus: {
        pending: 0,
        validating: 0,
        approved: 0,
        rejected: 0,
        duplicate: 0,
        review: 0
      },
      byCategory: {},
      avgScore: 0,
      topContributors: []
    };

    let totalScore = 0;
    let scoreCount = 0;
    const contributors = {};

    allSuggestions.docs.forEach(doc => {
      const data = doc.data();
      
      stats.byStatus[data.status] = (stats.byStatus[data.status] || 0) + 1;
      
      stats.byCategory[data.category] = (stats.byCategory[data.category] || 0) + 1;
      
      if (data.aiValidation?.score) {
        totalScore += data.aiValidation.score;
        scoreCount++;
      }
      
      if (data.suggestedBy?.userId) {
        if (!contributors[data.suggestedBy.userId]) {
          contributors[data.suggestedBy.userId] = {
            userId: data.suggestedBy.userId,
            userName: data.suggestedBy.userName,
            count: 0,
            approved: 0
          };
        }
        contributors[data.suggestedBy.userId].count++;
        if (data.status === 'approved') {
          contributors[data.suggestedBy.userId].approved++;
        }
      }
    });

    stats.avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
    stats.topContributors = Object.values(contributors)
      .sort((a, b) => b.approved - a.approved)
      .slice(0, 10);

    const dynamicSpecs = await db.collection('supplier_dynamic_specs').get();
    let totalDynamicOptions = 0;
    dynamicSpecs.docs.forEach(doc => {
      const data = doc.data();
      totalDynamicOptions += Object.keys(data.dynamicOptions || {}).length;
    });
    stats.totalDynamicOptions = totalDynamicOptions;

    res.json({ stats });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

function generateKey(label) {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((word, index) => 
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
}

export default router;
