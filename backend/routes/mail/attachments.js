import express from 'express';
import { db } from '../../db.js';
import { requireMailAccess } from '../../middleware/authMiddleware.js';
import admin from 'firebase-admin';

const router = express.Router();

// GET /api/mail/:id/attachments/:attId -> descarga binaria
router.get('/:id/attachments/:attId', requireMailAccess, async (req, res) => {
  try {
    const { id, attId } = req.params;
    if (!id || !attId) return res.status(400).json({ error: 'id-required' });

    const ref = db.collection('mails').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'not-found' });
    const data = snap.data() || {};

    try {
      const profile = req.userProfile || {};
      const role = String(profile.role || '').toLowerCase();
      const isPrivileged = role === 'admin' || role === 'planner';
      const myAlias = String(profile.myWed360Email || '').toLowerCase();
      const myMaLoveEmail = String(profile.maLoveEmail || '').toLowerCase();
      const myLogin = String(profile.email || '').toLowerCase();
      const authUid = req.user?.uid || null;
      const ownerTarget = String(data.folder === 'sent' ? data.from || '' : data.to || '').toLowerCase();
      const ownerUid = typeof data.ownerUid === 'string' ? data.ownerUid.trim() : '';
      const uidOk = authUid && ownerUid && ownerUid === authUid;
      if (!isPrivileged && !uidOk && ownerTarget && !(ownerTarget === myAlias || ownerTarget === myMaLoveEmail || ownerTarget === myLogin)) {
        return res.status(403).json({ error: 'forbidden' });
      }
    } catch {}

    const attRef = ref.collection('attachments').doc(attId);
    const attSnap = await attRef.get();
    if (!attSnap.exists) return res.status(404).json({ error: 'attachment-not-found' });
    const att = attSnap.data() || {};
    if (att.dataBase64) {
      const buf = Buffer.from(att.dataBase64, 'base64');
      res.setHeader('Content-Type', att.contentType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${att.filename || 'attachment'}"`);
      return res.status(200).send(buf);
    }
    const storagePath = att.storagePath || att.gcsPath || null;
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || null;
    if (storagePath && bucketName) {
      try {
        res.setHeader('Content-Type', att.contentType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${att.filename || 'attachment'}"`);
        const stream = admin.storage().bucket(bucketName).file(storagePath).createReadStream();
        stream.on('error', (err) => {
          console.error('Attachment stream error', err);
          if (!res.headersSent) res.status(500).json({ error: 'attachment-stream-error' });
        });
        return stream.pipe(res);
      } catch (e) {
        console.error('Attachment download from storage failed', e);
      }
    }
    return res.status(410).json({ error: 'attachment-too-large-or-missing' });
  } catch (e) {
    console.error('GET /api/mail/:id/attachments/:attId', e);
    return res.status(500).json({ error: 'attachment-download-failed' });
  }
});

// GET /api/mail/:id/attachments/:attId/url -> Signed URL
router.get('/:id/attachments/:attId/url', requireMailAccess, async (req, res) => {
  try {
    const { id, attId } = req.params;
    if (!id || !attId) return res.status(400).json({ error: 'id-required' });

    const ref = db.collection('mails').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'not-found' });
    const data = snap.data() || {};

    try {
      const profile = req.userProfile || {};
      const role = String(profile.role || '').toLowerCase();
      const isPrivileged = role === 'admin' || role === 'planner';
      const myAlias = String(profile.myWed360Email || '').toLowerCase();
      const myMaLoveEmail = String(profile.maLoveEmail || '').toLowerCase();
      const myLogin = String(profile.email || '').toLowerCase();
      const authUid = req.user?.uid || null;
      const ownerTarget = String(data.folder === 'sent' ? data.from || '' : data.to || '').toLowerCase();
      const ownerUid = typeof data.ownerUid === 'string' ? data.ownerUid.trim() : '';
      const uidOk = authUid && ownerUid && ownerUid === authUid;
      if (!isPrivileged && !uidOk && ownerTarget && !(ownerTarget === myAlias || ownerTarget === myMaLoveEmail || ownerTarget === myLogin)) {
        return res.status(403).json({ error: 'forbidden' });
      }
    } catch {}

    const attSnap = await ref.collection('attachments').doc(attId).get();
    if (!attSnap.exists) return res.status(404).json({ error: 'attachment-not-found' });
    const att = attSnap.data() || {};
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || null;
    if (!bucketName) return res.status(503).json({ error: 'storage-not-configured' });
    const storagePath = att.storagePath || att.gcsPath || null;
    if (!storagePath) return res.status(410).json({ error: 'no-storage-path' });

    const file = admin.storage().bucket(bucketName).file(storagePath);
    const ttlSec = Math.max(60, parseInt(process.env.ATTACHMENT_SIGNED_URL_TTL_SECONDS || '3600', 10));
    const expires = Date.now() + ttlSec * 1000;
    const [url] = await file.getSignedUrl({ action: 'read', expires });
    return res.status(200).json({ url, expiresAt: new Date(expires).toISOString() });
  } catch (e) {
    console.error('GET /api/mail/:id/attachments/:attId/url', e);
    return res.status(500).json({ error: 'signed-url-failed' });
  }
});

export default router;

