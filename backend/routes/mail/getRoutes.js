import express from 'express';
import { db } from '../../db.js';
import { requireMailAccess } from '../../middleware/authMiddleware.js';

const router = express.Router();
const DEFAULT_LIST_LIMIT = 200;
const userLookupCache = new Map();

function sanitizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function legacyAlias(email) {
  if (!email) return '';
  return email.replace(/@mywed360\.com$/i, '@mywed360');
}

function collectProfileAddresses(profile) {
  const set = new Set();
  if (!profile) return set;
  const alias = sanitizeEmail(profile.myWed360Email);
  const login = sanitizeEmail(profile.email);
  if (alias) set.add(alias);
  if (login) set.add(login);
  const legacy = legacyAlias(alias);
  if (legacy) set.add(legacy);
  return set;
}

function normalizeRecipientList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => {
        if (typeof entry === 'string') {
          return entry
            .split(/[;,]/)
            .map((piece) => piece.trim())
            .filter(Boolean);
        }
        if (entry && typeof entry === 'object') {
          const email = entry.email || entry.address || entry.value;
          if (typeof email === 'string') return [email.trim()];
        }
        return [];
      })
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function textToHtml(text) {
  if (!text) return '';
  return String(text)
    .split('\n')
    .map((line) => escapeHtml(line))
    .join('<br>');
}

export function formatMailRecord(record = {}) {
  const mail = { ...(record || {}) };
  if (record && record.id && !mail.id) mail.id = record.id;
  const recipientsExisting = Array.isArray(record.recipients) ? record.recipients : [];
  const recipientsNormalized = normalizeRecipientList(
    recipientsExisting.length ? recipientsExisting : record.toList || record.to
  );
  const recipients = recipientsNormalized.length ? recipientsNormalized : recipientsExisting;
  const toArrayNormalized = normalizeRecipientList(
    Array.isArray(record.to) ? record.to : record.toList || recipients || record.to
  );
  const toArray =
    toArrayNormalized.length > 0
      ? toArrayNormalized
      : recipients.length > 0
        ? recipients
        : [];
  const recipientsFinal = recipients.length ? recipients : toArray;
  mail.recipients = Array.isArray(mail.recipients) && mail.recipients.length
    ? mail.recipients
    : recipientsFinal;
  mail.toList = toArray;
  mail.to = toArray.slice();
  mail.toAddress = toArray[0] || null;
  mail.toPrimary = toArray[0] || null;
  mail.toDisplay = toArray.join(', ');
  const bodyText =
    typeof record.bodyText === 'string'
      ? record.bodyText
      : typeof record.body === 'string'
        ? record.body
        : '';
  mail.bodyText = bodyText;
  if (typeof mail.body !== 'string') mail.body = bodyText;
  const bodyHtml =
    typeof record.bodyHtml === 'string' && record.bodyHtml.trim()
      ? record.bodyHtml
      : textToHtml(bodyText);
  mail.bodyHtml = bodyHtml;
  const ccList = normalizeRecipientList(record.ccList || record.cc);
  if (ccList.length) {
    mail.ccList = ccList;
    if (typeof mail.cc !== 'string' || !mail.cc.trim()) {
      mail.cc = ccList.join(', ');
    }
  }
  const bccList = normalizeRecipientList(record.bccList || record.bcc);
  if (bccList.length) {
    mail.bccList = bccList;
    if (typeof mail.bcc !== 'string' || !mail.bcc.trim()) {
      mail.bcc = bccList.join(', ');
    }
  }
  const createdAt = record.createdAt || record.date || null;
  if (createdAt && !mail.createdAt) mail.createdAt = createdAt;
  if (!mail.updatedAt) mail.updatedAt = record.updatedAt || createdAt || null;
  if (!mail.folder) mail.folder = record.folder || 'inbox';
  return mail;
}

function mapMailArray(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => formatMailRecord({ ...(item || {}), id: item?.id }));
}

function adjustFolder(folderRaw) {
  const value = typeof folderRaw === 'string' && folderRaw.trim() ? folderRaw.trim() : 'inbox';
  const normalized = value.toLowerCase();
  const isAll = normalized === 'all';
  return { folder: value, normalized, isAll };
}

function resolveTargetUser(req, requestedUser) {
  let user = typeof requestedUser === 'string' ? requestedUser.trim() : undefined;
  let userNorm = user ? sanitizeEmail(user) : undefined;
  try {
    const profile = req.userProfile || {};
    const role = String(profile.role || '').toLowerCase();
    const isPrivileged = role === 'admin' || role === 'planner';
    let myAlias = sanitizeEmail(profile.myWed360Email);
    const myLogin = sanitizeEmail(profile.email);

    if (!myAlias && myLogin) {
      try {
        const prefix = myLogin.split('@')[0]?.slice(0, 4);
        if (prefix) myAlias = sanitizeEmail(`${prefix}@maloveapp.com`);
      } catch (_) {}
    }

    if (!isPrivileged) {
      const legacy = legacyAlias(myAlias);
      const matches =
        userNorm && (userNorm === myAlias || userNorm === myLogin || userNorm === sanitizeEmail(legacy));
      if (userNorm && !matches) {
        userNorm = myAlias || myLogin || undefined;
        user = userNorm;
      }
      if (!userNorm) {
        userNorm = myAlias || myLogin || undefined;
        user = userNorm;
      }
    }

    return { user, userNorm, isPrivileged };
  } catch (_) {
    return { user, userNorm, isPrivileged: false };
  }
}

async function resolveUidByEmail(email) {
  const normalized = sanitizeEmail(email);
  if (!normalized) return null;
  if (userLookupCache.has(normalized)) return userLookupCache.get(normalized);
  try {
    let snap = await db.collection('users').where('myWed360Email', '==', normalized).limit(1).get();
    if (!snap.empty) {
      const uid = snap.docs[0].id;
      userLookupCache.set(normalized, uid);
      return uid;
    }
    const legacy = legacyAlias(normalized);
    if (legacy && legacy !== normalized) {
      snap = await db.collection('users').where('myWed360Email', '==', legacy).limit(1).get();
      if (!snap.empty) {
        const uid = snap.docs[0].id;
        userLookupCache.set(normalized, uid);
        return uid;
      }
    }
    const loginSnap = await db.collection('users').where('email', '==', normalized).limit(1).get();
    if (!loginSnap.empty) {
      const uid = loginSnap.docs[0].id;
      userLookupCache.set(normalized, uid);
      return uid;
    }
  } catch (err) {
    console.warn('[mail][resolveUidByEmail] failed', normalized, err?.message || err);
  }
  userLookupCache.set(normalized, null);
  return null;
}

async function resolveUidForAddresses(addresses) {
  for (const address of addresses) {
    const uid = await resolveUidByEmail(address);
    if (uid) return uid;
  }
  return null;
}

function filterMailsByAddresses(items, folderNormalized, addresses) {
  if (!Array.isArray(items)) return [];
  if (!addresses || !addresses.size) return items;
  return items.filter((mail) => {
    const fromMatch = addresses.has(sanitizeEmail(mail.from));
    const recipients = normalizeRecipientList(mail.recipients || mail.toList || mail.to);
    const toMatch = recipients.some((addr) => addresses.has(sanitizeEmail(addr)));
    if (folderNormalized === 'sent') return fromMatch;
    if (folderNormalized === 'inbox') return toMatch;
    if (folderNormalized === 'trash') return fromMatch || toMatch;
    return toMatch || fromMatch;
  });
}

async function fetchFolderMails({ req, folder, userNorm, limit = DEFAULT_LIST_LIMIT, after }) {
  const normalizedFolder = folder.toLowerCase();
  const addresses = new Set([sanitizeEmail(userNorm)].filter(Boolean));
  const profileAddresses = collectProfileAddresses(req.userProfile);
  for (const addr of profileAddresses) addresses.add(addr);
  const afterIso =
    after instanceof Date
      ? after.toISOString()
      : typeof after === 'string' && after.trim()
        ? new Date(after).toISOString()
        : null;

  if (userNorm) {
    try {
      const uid = await resolveUidForAddresses(addresses);
      if (uid) {
        let userQuery = db.collection('users').doc(uid).collection('mails').where('folder', '==', folder);
        let docs = [];
        try {
          let q = userQuery.orderBy('date', 'desc');
          if (afterIso) q = q.startAfter(afterIso);
          const snap = await q.limit(limit).get();
          docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        } catch (err) {
          const snap = await userQuery.get();
          docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          docs.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
          if (limit && Number.isFinite(limit)) docs = docs.slice(0, limit);
        }
        if (docs.length) return docs;
      }
    } catch (_) {}
  }

  try {
    let query = db.collection('mails').where('folder', '==', folder);
    if (userNorm) {
      if (normalizedFolder === 'sent') query = query.where('from', '==', userNorm);
      else query = query.where('to', '==', userNorm);
    }
    let q = query.orderBy('date', 'desc');
    if (afterIso) q = q.startAfter(afterIso);
    const snapshot = await q.limit(limit).get();
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (items.length) return items;
  } catch (fireErr) {
    if (fireErr?.code !== 9 && !(fireErr?.message || '').toLowerCase().includes('index')) {
      throw fireErr;
    }
    try {
      const snapshot = await db.collection('mails').where('folder', '==', folder).limit(limit * 4).get();
      let items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      if (limit && Number.isFinite(limit)) items = items.slice(0, limit);
      if (!userNorm) return items;
      const filtered = filterMailsByAddresses(items, normalizedFolder, addresses);
      if (filtered.length) {
        filtered.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        return filtered.slice(0, limit);
      }
    } catch (fallbackErr) {
      console.error('[mail][fallback] query without index failed', fallbackErr?.message || fallbackErr);
    }
  }

  if (userNorm) {
    try {
      const snapshot = await db.collection('mails').where('folder', '==', folder).limit(limit * 4).get();
      const arr = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const filtered = filterMailsByAddresses(arr, normalizedFolder, addresses);
      if (filtered.length) {
        filtered.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        return filtered.slice(0, limit);
      }
    } catch (_) {}
  }

  return [];
}

async function fetchAllFolderMails({ req, userNorm, limit = DEFAULT_LIST_LIMIT }) {
  const folders = ['inbox', 'sent', 'trash'];
  const perFolderLimit = Math.max(limit, DEFAULT_LIST_LIMIT);
  const results = await Promise.all(
    folders.map((folder) => fetchFolderMails({ req, folder, userNorm, limit: perFolderLimit }))
  );
  const combined = results.flat();
  combined.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
  if (!Number.isFinite(limit) || limit <= 0) return combined;
  return combined.slice(0, limit);
}

export async function listMails(req, res) {
  try {
    const { folder: folderParam, isAll } = adjustFolder(req.query.folder);
    const { user, userNorm } = resolveTargetUser(req, req.query.user);
    const rawLimit = Number.parseInt(req.query.limit, 10);
    const limit =
      !Number.isNaN(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 500) : DEFAULT_LIST_LIMIT;

    if (isAll) {
      const items = await fetchAllFolderMails({ req, userNorm, limit });
      return res.json(mapMailArray(items));
    }

    const items = await fetchFolderMails({ req, folder: folderParam, userNorm, limit });
    return res.json(mapMailArray(items));
  } catch (err) {
    console.error('Error en GET /api/mail:', err);
    return res
      .status(503)
      .json({ success: false, message: 'Fallo obteniendo correos', error: err?.message || String(err) });
  }
}

export async function listMailsPage(req, res) {
  try {
    const { folder: folderParam, normalized, isAll } = adjustFolder(req.query.folder);
    if (isAll) {
      return res.status(400).json({ error: 'pagination_not_supported_for_all' });
    }
    const { userNorm } = resolveTargetUser(req, req.query.user);
    const rawLimit = Number.parseInt(req.query.limit, 10);
    const limit =
      !Number.isNaN(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 500) : DEFAULT_LIST_LIMIT;
    const rawCursor = req.query.cursor;
    const cursorDate =
      typeof rawCursor === 'string' && rawCursor.trim() ? new Date(rawCursor) : null;
    const validCursor = cursorDate instanceof Date && !Number.isNaN(cursorDate.getTime()) ? cursorDate : null;

    const items = await fetchFolderMails({
      req,
      folder: folderParam,
      userNorm,
      limit,
      after: validCursor || null,
    });

    const formatted = mapMailArray(items);
    const nextCursor =
      formatted.length === limit
        ? formatted[formatted.length - 1].date ||
          formatted[formatted.length - 1].createdAt ||
          null
        : null;
    return res.json({ items: formatted, nextCursor });
  } catch (err) {
    console.error('Error en GET /api/mail/page:', err);
    return res
      .status(503)
      .json({ success: false, message: 'Fallo obteniendo correos', error: err?.message || String(err) });
  }
}

export async function getMailDetail(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'id-required' });

    const ref = db.collection('mails').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'not-found' });
    const data = snap.data() || {};

    try {
      const profile = req.userProfile || {};
      const role = String(profile.role || '').toLowerCase();
      const isPrivileged = role === 'admin' || role === 'planner';
      const myAlias = sanitizeEmail(profile.myWed360Email);
      const myLogin = sanitizeEmail(profile.email);
      const ownerTarget = sanitizeEmail(data.folder === 'sent' ? data.from : data.to);
      if (!isPrivileged && ownerTarget && !(ownerTarget === myAlias || ownerTarget === myLogin)) {
        return res.status(403).json({ error: 'forbidden' });
      }
    } catch (_) {}

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
    } catch (_) {}

    const payload = formatMailRecord({ id: snap.id, ...data });
    payload.attachments = attachments;
    return res.json(payload);
  } catch (e) {
    console.error('GET /api/mail/:id failed', e);
    return res.status(500).json({ error: 'mail-detail-failed' });
  }
}

router.get('/', requireMailAccess, listMails);
router.get('/page', requireMailAccess, listMailsPage);
router.get('/:id', requireMailAccess, getMailDetail);

export default router;

