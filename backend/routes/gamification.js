import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  awardPoints,
  getStats,
  getAchievements,
  getEvents,
} from '../services/gamificationService.js';

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
    const { weddingId, uid, historyLimit } = req.query;
    console.log('[gamification/stats] Request:', {
      weddingId,
      uid,
      historyLimit,
      userId: req.user?.uid,
    });

    const parsedHistoryLimit = historyLimit === undefined ? undefined : Number(historyLimit);
    const historyLimitValue =
      Number.isFinite(parsedHistoryLimit) && parsedHistoryLimit >= 0 ? parsedHistoryLimit : 10;
    const historyLimitClamped = Math.min(historyLimitValue, 50);
    const stats = await getStats(weddingId, uid || req.user?.uid, {
      historyLimit: historyLimitClamped,
    });
    res.json({ success: true, stats });
  } catch (e) {
    console.error('[gamification/stats] Error:', e?.message || e);
    res.status(400).json({ success: false, error: e?.message || 'stats error' });
  }
});

// Obtener logros
router.get('/achievements', requireAuth, async (req, res) => {
  try {
    const { weddingId, uid } = req.query;
    console.log('[gamification/achievements] Request:', { weddingId, uid, userId: req.user?.uid });
    const achievements = await getAchievements(weddingId, uid || req.user?.uid);
    res.json({ success: true, achievements });
  } catch (e) {
    console.error('[gamification/achievements] Error:', e?.message || e);
    res.status(400).json({ success: false, error: e?.message || 'achievements error' });
  }
});

router.get('/events', requireAuth, async (req, res) => {
  try {
    const { weddingId, uid, limit } = req.query;
    console.log('[gamification/events] Request:', { weddingId, uid, limit, userId: req.user?.uid });
    const events = await getEvents(weddingId, uid || req.user?.uid, Number(limit) || 20);
    res.json({ success: true, events });
  } catch (e) {
    console.error('[gamification/events] Error:', e?.message || e);
    res.status(400).json({ success: false, error: e?.message || 'events error' });
  }
});

export default router;
