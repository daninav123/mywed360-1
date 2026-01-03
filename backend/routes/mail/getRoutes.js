import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  const maLove = sanitizeEmail(profile.maLoveEmail);
  const login = sanitizeEmail(profile.email);
  if (alias) set.add(alias);
  if (maLove) set.add(maLove);
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
    // Buscar en PostgreSQL
    const profile = await prisma.userProfile.findFirst({
      where: {
        OR: [
          { maLoveEmail: normalized },
          { myWed360Email: normalized },
        ]
      },
      select: { userId: true }
    });
    
    if (profile) {
      userLookupCache.set(normalized, profile.userId);
      return profile.userId;
    }
    
    // Fallback: buscar por email de login
    const user = await prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true }
    });
    
    if (user) {
      userLookupCache.set(normalized, user.id);
      return user.id;
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
  const authUid = req.user?.uid || null;
  const addresses = new Set([sanitizeEmail(userNorm)].filter(Boolean));
  const profileAddresses = collectProfileAddresses(req.userProfile);
  for (const addr of profileAddresses) addresses.add(addr);
  
  const afterDate = after instanceof Date ? after : 
    (typeof after === 'string' && after.trim() ? new Date(after) : null);

  try {
    // Prisma query simplificada - buscar por userId y folder
    const where = {
      folder: folder,
    };
    
    // Si hay usuario autenticado, filtrar por userId
    if (authUid) {
      where.userId = authUid;
    }
    
    // Si hay cursor de paginación
    if (afterDate && !isNaN(afterDate.getTime())) {
      where.date = { lt: afterDate };
    }
    
    const mails = await prisma.mail.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
    });
    
    if (mails.length) {
      return mails;
    }
  } catch (err) {
    console.warn('[fetchFolderMails] Prisma query failed:', err?.message || err);
  }

  // Fallback: buscar sin userId (para mails antiguos o compartidos)
  try {
    const where = { folder: folder };
    
    // Filtrar por email si se especificó
    if (userNorm) {
      if (normalizedFolder === 'sent') {
        where.from = userNorm;
      } else {
        where.to = { contains: userNorm }; // 'to' puede ser una lista
      }
    }
    
    if (afterDate && !isNaN(afterDate.getTime())) {
      where.date = { lt: afterDate };
    }
    
    const mails = await prisma.mail.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
    });
    
    if (mails.length) return mails;
  } catch (err) {
    console.warn('[fetchFolderMails] Fallback query failed:', err?.message || err);
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
  console.error('🔍🔍🔍 LISTMAILS EJECUTANDOSE 🔍🔍🔍');
  try {
    const { folder: folderParam, isAll } = adjustFolder(req.query.folder);
    const { user, userNorm } = resolveTargetUser(req, req.query.user);
    const rawLimit = Number.parseInt(req.query.limit, 10);
    const limit =
      !Number.isNaN(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 500) : DEFAULT_LIST_LIMIT;

    console.error(`🔍 [MAIL] folder=${folderParam}, userNorm=${userNorm}, uid=${req.user?.uid}, email=${req.userProfile?.myWed360Email}`);

    if (isAll) {
      const items = await fetchAllFolderMails({ req, userNorm, limit });
      console.log(`[MAIL-DEBUG] ALL folders - items found: ${items.length}`);
      return res.json(mapMailArray(items));
    }

    const items = await fetchFolderMails({ req, folder: folderParam, userNorm, limit });
    console.log(`[MAIL-DEBUG] folder=${folderParam} - items found: ${items.length}`);
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

    const mail = await prisma.mail.findUnique({ 
      where: { id },
      include: {
        // Si tienes relación con attachments en Prisma, incluirla aquí
      }
    });
    if (!mail) return res.status(404).json({ error: 'not-found' });
    const data = mail;

    try {
      const profile = req.userProfile || {};
      const role = String(profile.role || '').toLowerCase();
      const isPrivileged = role === 'admin' || role === 'planner';
      const myAlias = sanitizeEmail(profile.myWed360Email);
      const myLogin = sanitizeEmail(profile.email);
      const authUid = req.user?.uid || null;
      const ownerTarget = sanitizeEmail(data.folder === 'sent' ? data.from : data.to);
      const ownerUid = typeof data.ownerUid === 'string' ? data.ownerUid.trim() : '';
      const uidOk = authUid && ownerUid && ownerUid === authUid;
      if (!isPrivileged && !uidOk && ownerTarget && !(ownerTarget === myAlias || ownerTarget === myLogin)) {
        return res.status(403).json({ error: 'forbidden' });
      }
    } catch (_) {}

    let attachments = Array.isArray(data.attachments) ? data.attachments : [];
    // Attachments desde Prisma (si existe relación)
    try {
      // TODO: Si hay modelo MailAttachment en Prisma, usar eso
      const list = []; // Por ahora vacío hasta migrar attachments
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

router.get('/', listMails);
router.get('/page', listMailsPage);
router.get('/:id', getMailDetail);

export default router;

