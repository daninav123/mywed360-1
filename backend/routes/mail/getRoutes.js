import express from 'express';
import { db } from '../../db.js';
import { requireMailAccess } from '../../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/mail?folder=inbox|sent
router.get('/', requireMailAccess, async (req, res) => {
  try {
    const { folder = 'inbox' } = req.query;
    const userRaw = req.query.user;
    let user = userRaw ? String(userRaw).trim() : undefined;
    let userNorm = user ? user.toLowerCase() : undefined;

    // Seguridad: limitar acceso al propio usuario salvo roles elevados
    try {
      const profile = req.userProfile || {};
      const role = String(profile.role || '').toLowerCase();
      let myAlias = String(profile.myWed360Email || '').toLowerCase();
      const myLogin = String(profile.email || '').toLowerCase();
      const isPrivileged = role === 'admin' || role === 'planner';
      if (!isPrivileged) {
        const legacyAlias = myAlias.replace(/@mywed360\.com$/i, '@mywed360');
        if (!myAlias && myLogin) {
          try {
            const prefix = myLogin.split('@')[0].slice(0, 4).toLowerCase();
            if (prefix) myAlias = `${prefix}@mywed360.com`;
          } catch {}
        }
        const matches = userNorm === myAlias || userNorm === myLogin || userNorm === legacyAlias;
        if (userNorm && !matches) {
          userNorm = myAlias || myLogin || undefined;
          user = userNorm;
        }
        if (!userNorm) {
          userNorm = myAlias || myLogin || undefined;
          user = userNorm;
        }
      }
    } catch {}

    // Intentar subcolección del usuario
    if (userNorm) {
      try {
        let uid = null;
        let byAlias = await db.collection('users').where('myWed360Email', '==', user).limit(1).get();
        if (byAlias.empty && userNorm) {
          const legacy = userNorm.replace(/@mywed360\.com$/i, '@mywed360');
          byAlias = await db.collection('users').where('myWed360Email', '==', legacy).limit(1).get();
        }
        if (!byAlias.empty) {
          uid = byAlias.docs[0].id;
        } else {
          const byLogin = await db.collection('users').where('email', '==', user).limit(1).get();
          if (!byLogin.empty) uid = byLogin.docs[0].id;
        }
        if (uid) {
          let uq = db.collection('users').doc(uid).collection('mails').where('folder', '==', folder);
          let udata = [];
          try {
            const usnap = await uq.orderBy('date', 'desc').get();
            udata = usnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          } catch (uerr) {
            const usnap = await uq.get();
            udata = usnap.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
          }
          return res.json(udata);
        }
      } catch {}
    }

    // Colección global
    let query = db.collection('mails').where('folder', '==', folder);
    if (userNorm) {
      if (folder === 'sent') query = query.where('from', '==', userNorm);
      else query = query.where('to', '==', userNorm);
    }

    let data = [];
    try {
      const snapshot = await query.orderBy('date', 'desc').get();
      data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (fireErr) {
      if (fireErr?.code === 9 || (fireErr?.message || '').toLowerCase().includes('index')) {
        console.warn('[GET /api/mail] Falta índice compuesto. Usando fallback sin orderBy y ordenando en memoria.');
        const snapshot = await query.get();
        data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      } else {
        throw fireErr;
      }
    }

    // Fallback extra con filtrado manual
    if (userNorm && (!Array.isArray(data) || data.length === 0)) {
      try {
        const snap2 = await db.collection('mails').where('folder', '==', folder).limit(300).get();
        const arr = snap2.docs.map((d) => ({ id: d.id, ...d.data() }));
        let addresses = new Set([userNorm]);
        try {
          const profile = req.userProfile || {};
          let myAlias = String(profile.myWed360Email || '').toLowerCase();
          const myLogin = String(profile.email || '').toLowerCase();
          const legacy = myAlias ? myAlias.replace(/@mywed360\.com$/i, '@mywed360') : '';
          [myAlias, myLogin, legacy].filter(Boolean).forEach((a) => addresses.add(a));
        } catch {}
        const filtered = arr
          .filter((m) => {
            const to = String(m.to || '').toLowerCase();
            const from = String(m.from || '').toLowerCase();
            return folder === 'sent' ? addresses.has(from) : addresses.has(to);
          })
          .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        if (filtered.length) {
          return res.json(filtered);
        }
      } catch {}
    }

    res.json(data);
  } catch (err) {
    console.error('Error en GET /api/mail:', err);
    res.status(503).json({
      success: false,
      message: 'Fallo obteniendo correos',
      error: err?.message || String(err),
      hint: 'Verifica acceso a Firestore y filtros (folder/user). Si depende de Mailgun, revisa MAILGUN_* y región EU.',
    });
  }
});

// GET /api/mail/page
router.get('/page', requireMailAccess, async (req, res) => {
  try {
    const { folder = 'inbox', limit: rawLimit, cursor: rawCursor } = req.query;
    const userRaw = req.query.user;
    let user = userRaw ? String(userRaw).trim() : undefined;
    let userNorm = user ? user.toLowerCase() : undefined;
    const lim = Math.max(1, Math.min(parseInt(rawLimit, 10) || 50, 100));
    const after = rawCursor ? new Date(String(rawCursor)) : null;

    // Seguridad similar al GET principal
    try {
      const profile = req.userProfile || {};
      const role = String(profile.role || '').toLowerCase();
      let myAlias = String(profile.myWed360Email || '').toLowerCase();
      const myLogin = String(profile.email || '').toLowerCase();
      const isPrivileged = role === 'admin' || role === 'planner';
      if (!isPrivileged) {
        const legacyAlias = myAlias.replace(/@mywed360\.com$/i, '@mywed360');
        if (!myAlias && myLogin) {
          try {
            const prefix = myLogin.split('@')[0].slice(0, 4).toLowerCase();
            if (prefix) myAlias = `${prefix}@mywed360.com`;
          } catch {}
        }
        const matches = userNorm === myAlias || userNorm === myLogin || userNorm === legacyAlias;
        if (userNorm && !matches) {
          userNorm = myAlias || myLogin || undefined;
          user = userNorm;
        }
        if (!userNorm) {
          userNorm = myAlias || myLogin || undefined;
          user = userNorm;
        }
      }
    } catch {}

    // Subcolección del usuario si es posible
    if (userNorm) {
      try {
        let uid = null;
        let byAlias = await db.collection('users').where('myWed360Email', '==', user).limit(1).get();
        if (byAlias.empty && userNorm) {
          const legacy = userNorm.replace(/@mywed360\.com$/i, '@mywed360');
          byAlias = await db.collection('users').where('myWed360Email', '==', legacy).limit(1).get();
        }
        if (!byAlias.empty) {
          uid = byAlias.docs[0].id;
        } else {
          const byLogin = await db.collection('users').where('email', '==', user).limit(1).get();
          if (!byLogin.empty) uid = byLogin.docs[0].id;
        }
        if (uid) {
          let uq = db.collection('users').doc(uid).collection('mails').where('folder', '==', folder);
          let q = uq.orderBy('date', 'desc');
          if (after && !Number.isNaN(after.getTime())) q = q.startAfter(after.toISOString());
          const usnap = await q.limit(lim).get();
          const items = usnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          const nextCursor = items.length === lim ? items[items.length - 1].date : null;
          return res.json({ items, nextCursor });
        }
      } catch {}
    }

    // Colección global
    let query = db.collection('mails').where('folder', '==', folder);
    if (userNorm) {
      if (folder === 'sent') query = query.where('from', '==', userNorm);
      else query = query.where('to', '==', userNorm);
    }
    let items = [];
    try {
      let q = query.orderBy('date', 'desc');
      if (after && !Number.isNaN(after.getTime())) q = q.startAfter(after.toISOString());
      const snap = await q.limit(lim).get();
      items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (fireErr) {
      const snap = await query.limit(lim).get();
      items = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }

    if (userNorm && (!Array.isArray(items) || items.length === 0)) {
      try {
        const snap2 = await db.collection('mails').where('folder', '==', folder).limit(lim * 4).get();
        const arr = snap2.docs.map((d) => ({ id: d.id, ...d.data() }));
        let addresses = new Set([userNorm]);
        try {
          const profile = req.userProfile || {};
          let myAlias = String(profile.myWed360Email || '').toLowerCase();
          const myLogin = String(profile.email || '').toLowerCase();
          const legacy = myAlias ? myAlias.replace(/@mywed360\.com$/i, '@mywed360') : '';
          [myAlias, myLogin, legacy].filter(Boolean).forEach((a) => addresses.add(a));
        } catch {}
        const filtered = arr
          .filter((m) => {
            const to = String(m.to || '').toLowerCase();
            const from = String(m.from || '').toLowerCase();
            return folder === 'sent' ? addresses.has(from) : addresses.has(to);
          })
          .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        items = filtered.slice(0, lim);
      } catch {}
    }
    const nextCursor = items.length === lim ? items[items.length - 1].date : null;
    return res.json({ items, nextCursor });
  } catch (err) {
    console.error('Error en GET /api/mail/page:', err);
    res.status(503).json({ success: false, message: 'Fallo obteniendo correos', error: err?.message || String(err) });
  }
});

// GET /api/mail/:id -> detalle de correo + adjuntos
router.get('/:id', requireMailAccess, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'id-required' });
    const ref = db.collection('mails').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'not-found' });
    const data = snap.data() || {};

    // Ownership check
    try {
      const profile = req.userProfile || {};
      const role = String(profile.role || '').toLowerCase();
      const isPrivileged = role === 'admin' || role === 'planner';
      const myAlias = String(profile.myWed360Email || '').toLowerCase();
      const myLogin = String(profile.email || '').toLowerCase();
      const ownerTarget = String(data.folder === 'sent' ? data.from || '' : data.to || '').toLowerCase();
      if (!isPrivileged && ownerTarget && !(ownerTarget === myAlias || ownerTarget === myLogin)) {
        return res.status(403).json({ error: 'forbidden' });
      }
    } catch {}

    // Adjuntos desde subcolección
    let attachments = Array.isArray(data.attachments) ? data.attachments : [];
    try {
      const attSnap = await ref.collection('attachments').get();
      const list = attSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
      attachments = list.map((a) => ({
        id: a.id,
        filename: a.filename || a.name || 'attachment',
        contentType: a.contentType || 'application/octet-stream',
        size: a.size || 0,
        url: `/api/mail/${encodeURIComponent(id)}/attachments/${encodeURIComponent(a.id)}`,
        signedUrl: `/api/mail/${encodeURIComponent(id)}/attachments/${encodeURIComponent(a.id)}/url`,
      }));
    } catch {}
    return res.json({ id: snap.id, ...data, attachments });
  } catch (e) {
    console.error('GET /api/mail/:id failed', e);
    return res.status(500).json({ error: 'mail-detail-failed' });
  }
});

export default router;

