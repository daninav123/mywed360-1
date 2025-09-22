import express from 'express';
import { db } from '../../db.js';
import { requireMailAccess } from '../../middleware/authMiddleware.js';
import mailgunJs from 'mailgun-js';

const router = express.Router();

// POST /api/mail/alias  { alias }
router.post('/alias', requireMailAccess, async (req, res) => {
  try {
    const { alias } = req.body || {};
    const user = req.user || {};
    const profile = req.userProfile || {};
    if (!user?.uid) return res.status(401).json({ success: false, error: 'unauthorized' });
    const raw = String(alias || '').trim().toLowerCase();
    const usernameRegex = /^[a-z0-9][a-z0-9._-]{2,29}$/i;
    const RESERVED = new Set(['admin','soporte','noreply','contacto','info','ayuda','sistema','mywed360','staff','test','prueba']);
    if (!raw || !usernameRegex.test(raw) || RESERVED.has(raw)) {
      return res.status(400).json({ success: false, error: 'invalid_alias' });
    }

    const existing = await db.collection('emailUsernames').doc(raw).get();
    if (existing.exists) {
      const data = existing.data() || {};
      if (data.userId && data.userId !== user.uid) {
        return res.status(409).json({ success: false, error: 'alias_taken' });
      }
    }
    const DOMAIN = (process.env.MY_EMAIL_DOMAIN || 'mywed360.com').toLowerCase();
    const email = `${raw}@${DOMAIN}`;

    await db.collection('emailUsernames').doc(raw).set(
      {
        username: raw,
        userId: user.uid,
        email,
        updatedAt: new Date().toISOString(),
        createdAt: existing.exists ? existing.data()?.createdAt || new Date().toISOString() : new Date().toISOString(),
      },
      { merge: true }
    );

    await db.collection('users').doc(user.uid).set(
      {
        emailUsername: raw,
        myWed360Email: email,
      },
      { merge: true }
    );

    let routeResult = null;
    try {
      const ENABLE_ROUTES = (process.env.MAILGUN_CREATE_ROUTES || '').toString().toLowerCase() === 'true';
      const API_KEY = process.env.VITE_MAILGUN_API_KEY || process.env.MAILGUN_API_KEY;
      const EU = (process.env.VITE_MAILGUN_EU_REGION || process.env.MAILGUN_EU_REGION || '').toString() === 'true';
      const BASE = process.env.BACKEND_PUBLIC_BASE_URL || process.env.VITE_BACKEND_BASE_URL || '';
      const inboundUrl = BASE ? `${BASE.replace(/\/$/, '')}/api/inbound/mailgun` : null;
      if (ENABLE_ROUTES && API_KEY && inboundUrl) {
        const cfg = { apiKey: API_KEY, ...(EU ? { host: 'api.eu.mailgun.net' } : {}) };
        const mg = mailgunJs(cfg);
        const expression = `match_recipient('${email}')`;
        const action = [`forward('${inboundUrl}')`, 'stop()'];
        try {
          routeResult = await mg.routes().create({ priority: 0, description: `Alias ${email}`, expression, action });
        } catch (routeErr) {
          console.warn('No se pudo crear ruta Mailgun para alias', email, routeErr?.message || routeErr);
        }
      }
    } catch (routeWrapErr) {
      console.warn('Alias route creation wrapper failed', routeWrapErr?.message || routeWrapErr);
    }

    return res.status(200).json({ success: true, alias: raw, email, route: routeResult || null });
  } catch (e) {
    console.error('POST /api/mail/alias failed', e);
    return res.status(500).json({ success: false, error: 'alias_failed' });
  }
});

export default router;

