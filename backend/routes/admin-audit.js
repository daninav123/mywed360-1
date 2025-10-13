import express from 'express';
import admin from 'firebase-admin';

import { db } from '../db.js';

// Router protegido para registrar eventos de auditoría admin
// POST /api/admin/audit { action, actor?, resourceType?, resourceId?, payload?, outcome?, metadata? }
// Responde 204 en éxito
const router = express.Router();

function sanitizeString(v, max = 512) {
  if (typeof v !== 'string') return '';
  const s = v.trim();
  return s.length > max ? s.slice(0, max) : s;
}

router.post('/', async (req, res) => {
  try {
    const { action, actor, resourceType, resourceId, payload, outcome, metadata } = req.body || {};
    const act = sanitizeString(action);
    if (!act) {
      return res.status(400).json({ error: 'action_required' });
    }

    const doc = {
      action: act,
      actor: sanitizeString(actor || (req?.userProfile?.email || 'admin')), // best-effort
      resourceType: sanitizeString(resourceType || ''),
      resourceId: sanitizeString(resourceId || ''),
      outcome: sanitizeString(outcome || 'SUCCESS'),
      payload: payload && typeof payload === 'object' ? payload : sanitizeString(String(payload || '')),
      metadata: metadata && typeof metadata === 'object' ? metadata : undefined,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      requestId: req?.id || null,
    };

    await db.collection('adminAuditLogs').add(doc);
    return res.status(204).send();
  } catch (error) {
    // No filtrar detalles: devolver código genérico
    return res.status(500).json({ error: 'audit_write_failed' });
  }
});

export default router;
