import express from 'express';
import admin from 'firebase-admin';
import logger from '../utils/logger.js';

const router = express.Router();

// POST /api/users/upgrade-role
// Body: { newRole: 'assistant'|'planner'|'owner', tier?: string }
// Efectos:
//  - Actualiza users/{uid} con { role, subscription.tier }
//  - Registra roleHistory
//  - Inicializa plannerWeddingIds si aplica
router.post('/upgrade-role', async (req, res) => {
  try {
    const uid = req?.user?.uid || '';
    if (!uid) {
      return res.status(401).json({
        success: false,
        error: { code: 'unauthenticated', message: 'Usuario no autenticado' },
      });
    }

    const rawRole = String(req.body?.newRole || '')
      .trim()
      .toLowerCase();
    const allowed = new Set(['owner', 'assistant', 'planner']);
    if (!allowed.has(rawRole)) {
      return res
        .status(400)
        .json({ success: false, error: { code: 'bad_request', message: 'newRole inválido' } });
    }

    const tier =
      String(req.body?.tier || '').trim() ||
      (rawRole === 'planner'
        ? 'wedding_planner_1'
        : rawRole === 'assistant'
          ? 'assistant'
          : 'free');

    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();
    const before = snap.exists ? snap.data() || {} : {};
    const prevRole = String(before.role || 'particular');

    // Validaciones de plan básicas
    if (rawRole === 'planner') {
      // Si ya es planner, permitir idempotente; si no, realizar upgrade
      // (Validaciones de pago real deberían ocurrir fuera y reflejarse en `tier`)
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const roleHistoryEntry = {
      from: prevRole,
      to: rawRole,
      at: admin.firestore.Timestamp.now(),
      reason: 'upgrade',
    };

    const payload = {
      role: rawRole,
      subscription: { ...(before.subscription || {}), tier },
      updatedAt: now,
    };

    // Inicializar campos relacionados con planner
    if (rawRole === 'planner') {
      payload.plannerWeddingIds = Array.isArray(before.plannerWeddingIds)
        ? before.plannerWeddingIds
        : [];
    }

    // Persistir cambios
    await userRef.set(payload, { merge: true });
    try {
      await userRef.set(
        { roleHistory: admin.firestore.FieldValue.arrayUnion(roleHistoryEntry) },
        { merge: true }
      );
    } catch {}

    logger.info(`[users] upgrade-role ${uid}: ${prevRole} -> ${rawRole} (tier=${tier})`);
    return res.json({ success: true, role: rawRole, subscription: { tier } });
  } catch (e) {
    logger.error('[users] upgrade-role error', e);
    return res
      .status(500)
      .json({ success: false, error: { code: 'internal_error', message: 'Error interno' } });
  }
});

export default router;
