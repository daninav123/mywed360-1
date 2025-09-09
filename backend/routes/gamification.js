import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { awardPoints, getStats, getAchievements } from '../services/gamificationService.js';

const router = express.Router();

// Otorgar puntos por evento
router.post('/award', requireAuth, async (req, res) => {
  try {
    const { weddingId, uid, eventType, meta } = req.body || {};
    const result = await awardPoints(weddingId, uid || req.user?.uid, eventType, meta || {});
    res.json({ success: true, result });
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'award error' });
  }
});

// Obtener estadísticas del usuario
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const { weddingId, uid } = req.query;
    const stats = await getStats(weddingId, uid || req.user?.uid);
    res.json({ success: true, stats });
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'stats error' });
  }
});

// Obtener logros
router.get('/achievements', requireAuth, async (req, res) => {
  try {
    const { weddingId, uid } = req.query;
    const achievements = await getAchievements(weddingId, uid || req.user?.uid);
    res.json({ success: true, achievements });
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'achievements error' });
  }
});

export default router;
