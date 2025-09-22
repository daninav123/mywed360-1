import express from 'express';
import admin from 'firebase-admin';
import logger from '../logger.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/weddings/:weddingId/permissions/autofix
// Añade al usuario autenticado a plannerIds de la boda si tiene relación válida
// Criterios de autorización:
//  - Admin siempre permitido
//  - Existe users/{uid}/weddings/{weddingId}
//  - O ya consta en ownerIds/plannerIds/assistantIds en weddings/{weddingId}
router.post('/:weddingId/permissions/autofix', requireAuth, async (req, res) => {
  try {
    const weddingId = String(req.params.weddingId || '').trim();
    const uid = req?.user?.uid || '';
    const role = String(req?.userProfile?.role || '').toLowerCase();

    if (!weddingId) {
      return res.status(400).json({ success: false, error: { code: 'bad_request', message: 'weddingId requerido' } });
    }
    if (!uid) {
      return res.status(401).json({ success: false, error: { code: 'unauthenticated', message: 'Usuario no autenticado' } });
    }

    const isAdmin = role === 'admin';

    const db = admin.firestore();

    // Cargar doc principal de la boda
    const wedRef = db.collection('weddings').doc(weddingId);
    const wedSnap = await wedRef.get();
    if (!wedSnap.exists) {
      return res.status(404).json({ success: false, error: { code: 'not_found', message: 'Boda no encontrada' } });
    }
    const wdata = wedSnap.data() || {};

    // Comprobar relación existente en doc principal
    const owners = Array.isArray(wdata.ownerIds) ? wdata.ownerIds : [];
    const planners = Array.isArray(wdata.plannerIds) ? wdata.plannerIds : [];
    const assistants = Array.isArray(wdata.assistantIds) ? wdata.assistantIds : [];
    const alreadyLinked = owners.includes(uid) || planners.includes(uid) || assistants.includes(uid);

    // Comprobar relación en subcolección del usuario
    let listedInUserSubcol = false;
    try {
      const userWedRef = db.collection('users').doc(uid).collection('weddings').doc(weddingId);
      const userWedSnap = await userWedRef.get();
      listedInUserSubcol = userWedSnap.exists;
    } catch {}

    if (!isAdmin && !listedInUserSubcol && !alreadyLinked) {
      // No hay relación previa -> denegar por seguridad
      return res.status(403).json({ success: false, error: { code: 'forbidden', message: 'No tienes relación con esta boda' } });
    }

    // Si ya está en plannerIds, devolver idempotente
    if (planners.includes(uid)) {
      return res.json({ success: true, action: 'already_member', role: 'planner', weddingId, uid });
    }

    // Añadir como planner (idempotente con arrayUnion)
    try {
      const { FieldValue } = await import('firebase-admin/firestore');
      await wedRef.set({ plannerIds: FieldValue.arrayUnion(uid), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      logger.info(`[autofix] planner añadido ${uid} -> wedding ${weddingId}`);
      return res.json({ success: true, action: 'added', role: 'planner', weddingId, uid });
    } catch (e) {
      logger.error('[autofix] error añadiendo planner:', e);
      return res.status(500).json({ success: false, error: { code: 'internal_error', message: 'No se pudo actualizar la boda' } });
    }
  } catch (e) {
    logger.error('[autofix] exception:', e);
    return res.status(500).json({ success: false, error: { code: 'internal_error', message: 'Error interno' } });
  }
});

export default router;
