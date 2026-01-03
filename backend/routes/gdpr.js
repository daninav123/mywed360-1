import express from 'express';
import admin from 'firebase-admin';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

function canAct(req, targetUid) {
  try {
    const uid = req.user?.uid || null;
    if (!uid) return false;
    if (uid === targetUid) return true; // auto-servicio
    // Permitir planners/admins básicos vía custom claims
    const claims = req.user?.claims || {};
    if (claims.admin || claims.role === 'planner' || claims.role === 'owner') return true;
    return false;
  } catch { return false; }
}

router.get('/export', requireAuth, async (req, res) => {
  try {
    const uid = String(req.query.uid || req.user?.uid || '');
    if (!uid) return res.status(400).json({ success: false, error: 'uid requerido' });
    if (!canAct(req, uid)) return res.status(403).json({ success: false, error: 'forbidden' });

    // Recopilar datos básicos (best-effort)
    const out = { uid, profiles: {}, weddings: {} };
    try {
      const userDoc = await admin.firestore().collection('users').doc(uid).get();
      if (userDoc.exists) out.profiles.user = userDoc.data();
    } catch {}
    // Nota: expandir colecciones adicionales según esquema real

    res.json({ success: true, data: out });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || 'export error' });
  }
});

router.delete('/delete', requireAuth, async (req, res) => {
  try {
    const uid = String(req.query.uid || req.user?.uid || '');
    if (!uid) return res.status(400).json({ success: false, error: 'uid requerido' });
    if (!canAct(req, uid)) return res.status(403).json({ success: false, error: 'forbidden' });

    // Marcado lógico de borrado para cumplimiento (no hard delete por defecto)
    try {
      const ref = admin.firestore().collection('users').doc(uid);
      await ref.set({ deletedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    } catch {}
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || 'delete error' });
  }
});

export default router;

