import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  createSignatureRequest,
  listSignatureRequests,
  updateSignatureStatus,
  getSignatureStatus,
} from '../services/signatureService.js';

const router = express.Router();

function buildActor(req) {
  try {
    const profile = req.userProfile || {};
    const user = req.user || {};
    return {
      uid: user.uid || profile.uid || null,
      email: profile.email || user.email || null,
      name: profile.displayName || profile.name || user.name || user.email || null,
      role: profile.role || null,
    };
  } catch {
    return { uid: null, email: null, name: null, role: null };
  }
}

// Crear solicitud de firma digital con envío real de notificaciones
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { weddingId, documentMeta, signers, sendEmails, skipEmails } = req.body || {};
    const payload = await createSignatureRequest(
      weddingId,
      documentMeta,
      signers || [],
      {
        actor: buildActor(req),
        disableEmail: sendEmails === false || skipEmails === true,
      },
    );
    res.json({ success: true, request: payload });
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'createSignature error' });
  }
});

// Listar solicitudes
router.get('/list', requireAuth, async (req, res) => {
  try {
    const { weddingId, limit } = req.query;
    const list = await listSignatureRequests(weddingId, Number(limit) || 50);
    res.json({ success: true, signatures: list });
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'listSignature error' });
  }
});

// Obtener estado
router.get('/status/:id', requireAuth, async (req, res) => {
  try {
    const { weddingId } = req.query;
    const status = await getSignatureStatus(weddingId, req.params.id);
    res.json({ success: true, status });
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'getSignature error' });
  }
});

// Actualizar estado
router.post('/status/:id', requireAuth, async (req, res) => {
  try {
    const { weddingId, updates } = req.body || {};
    const saved = await updateSignatureStatus(weddingId, req.params.id, updates || {});
    res.json({ success: true, status: saved });
  } catch (e) {
    res.status(400).json({ success: false, error: e?.message || 'updateSignature error' });
  }
});

export default router;
