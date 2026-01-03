import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import admin from 'firebase-admin';

const router = express.Router();

// GET /api/weddings/:weddingId/metrics
// Solo el propietario/planificador/asistente de la boda (o admin) puede consultar
router.get('/:weddingId/metrics', requireAuth, async (req, res) => {
  try {
    const weddingId = String(req.params.weddingId || '');
    const uid = req?.user?.uid || '';
    const userRole = (req?.userProfile?.role || '').toLowerCase();

    if (!weddingId) return res.status(400).json({ success: false, error: { code: 'bad_request', message: 'weddingId requerido' } });

    // Admin puede ver cualquier boda
    const isAdmin = userRole === 'admin';
    if (!isAdmin) {
      const snap = await admin.firestore().collection('weddings').doc(weddingId).get();
      if (!snap.exists) return res.status(404).json({ success: false, error: { code: 'not_found', message: 'Boda no encontrada' } });
      const data = snap.data() || {};
      const owners = Array.isArray(data.ownerIds) ? data.ownerIds : [];
      const planners = Array.isArray(data.plannerIds) ? data.plannerIds : [];
      const assistants = Array.isArray(data.assistantIds) ? data.assistantIds : [];
      const allowed = owners.includes(uid) || planners.includes(uid) || assistants.includes(uid);
      if (!allowed) return res.status(403).json({ success: false, error: { code: 'forbidden', message: 'Acceso restringido a la boda' } });
    }

    // Métricas placeholder por boda (ampliables)
    const now = Date.now();
    const response = {
      success: true,
      weddingId,
      timeSeriesData: [],
      performanceData: {},
      errorData: [],
      usageData: [],
      timestamp: now,
    };
    return res.json(response);
  } catch (e) {
    return res.status(500).json({ success: false, error: { code: 'internal_error', message: 'Error interno' } });
  }
});

export default router;

