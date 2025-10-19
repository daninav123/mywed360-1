// routes/planners.js
// GET /api/planners/suggestions -> devuelve planners sugeridos desde Firestore

import express from 'express';
import admin from 'firebase-admin';
import logger from '../logger.js';

const router = express.Router();

const DEFAULT_PLANNERS = [
  {
    id: 'planner-demo-1',
    name: 'Maria Lopez',
    city: 'Madrid',
    rating: 4.9,
    weddingsActive: 2,
    tags: ['boho', 'destination'],
    email: 'maria.lopez@demo-planners.test',
    phone: '',
    website: '',
    specialties: [],
  },
  {
    id: 'planner-demo-2',
    name: 'Claudia Vila',
    city: 'Barcelona',
    rating: 4.7,
    weddingsActive: 1,
    tags: ['urbano', 'moderno'],
    email: 'claudia.vila@demo-planners.test',
    phone: '',
    website: '',
    specialties: [],
  },
  {
    id: 'planner-demo-3',
    name: 'Daniel Romero',
    city: 'Valencia',
    rating: 4.8,
    weddingsActive: 3,
    tags: ['clásico', 'premium'],
    email: 'daniel.romero@demo-planners.test',
    phone: '',
    website: '',
    specialties: [],
  },
];

const COLLECTION =
  process.env.PLANNER_SUGGESTIONS_COLLECTION ||
  process.env.FIRESTORE_PLANNER_COLLECTION ||
  'plannerProfiles';

const mapPlannerDoc = (doc) => {
  const data = doc.data() || {};
  return {
    id: doc.id,
    name: data.name || data.displayName || data.fullName || 'Planner sin nombre',
    city: data.city || data.location || data.baseCity || '',
    rating:
      typeof data.rating === 'number'
        ? data.rating
        : typeof data.score === 'number'
        ? data.score
        : null,
    weddingsActive:
      typeof data.weddingsActive === 'number'
        ? data.weddingsActive
        : typeof data.activeWeddings === 'number'
        ? data.activeWeddings
        : 0,
    tags: Array.isArray(data.tags) ? data.tags : Array.isArray(data.styles) ? data.styles : [],
    specialties: Array.isArray(data.specialties)
      ? data.specialties
      : Array.isArray(data.services)
      ? data.services
      : [],
    email: data.email || data.contactEmail || '',
    phone: data.phone || data.contactPhone || '',
    website: data.website || data.site || '',
  };
};

router.get('/suggestions', async (req, res) => {
  const { limit = '12' } = req.query || {};
  const max = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);

  try {
    const db = admin.firestore();
    const snapshot = await db.collection(COLLECTION).limit(max).get();

    const planners = [];
    snapshot.forEach((doc) => {
      const data = doc.data() || {};
      // Si existe un flag para publicación podemos respetarlo
      if (data.published === false || data.visible === false) return;
      planners.push(mapPlannerDoc(doc));
    });

    if (!planners.length) {
      logger.warn(
        `[planners] Colección "${COLLECTION}" vacía o sin planners publicados. Devolviendo fallback.`,
      );
      return res.json(DEFAULT_PLANNERS);
    }

    return res.json(planners);
  } catch (error) {
    logger.error('[planners] Error obteniendo planners sugeridos', error);
    return res.status(500).json({
      error: 'planner_suggestions_unavailable',
      message: 'No fue posible obtener planners sugeridos.',
      fallback: DEFAULT_PLANNERS,
    });
  }
});

export default router;
