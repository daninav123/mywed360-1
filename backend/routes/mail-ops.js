import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireMailAccess } from '../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

function hasPrivilegedRole(profile) {
  const role = String((profile && profile.role) || '').toLowerCase();
  return role === 'admin' || role === 'planner';
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function legacyAlias(email) {
  if (!email) return '';
  return email.replace(/@mywed360\.com$/i, '@mywed360');
}

function resolveOwnerEmail(folder, mailData) {
  const data = mailData || {};
  const normalizedFolder = String(folder || '').toLowerCase();
  if (normalizedFolder.startsWith('sent')) {
    return normalizeEmail(data.from);
  }
  if (normalizedFolder.startsWith('trash')) {
    const meta = data.trashMeta || {};
    if (meta && meta.ownerEmail) return normalizeEmail(meta.ownerEmail);
    if (meta && meta.previousFolder && meta.previousFolder !== 'trash') {
      return resolveOwnerEmail(meta.previousFolder, data);
    }
  }
  if (normalizedFolder.startsWith('custom')) {
    return normalizeEmail(data.to || data.ownerEmail || data.owner || '');
  }
  return normalizeEmail(data.to || data.ownerEmail || data.owner || '');
}

function isOwner(profile, mailData) {
  if (!profile || !mailData) return false;
  const alias = normalizeEmail(profile.myWed360Email || '');
  const login = normalizeEmail(profile.email || '');
  const alt = alias ? legacyAlias(alias) : '';
  const target = resolveOwnerEmail(mailData.folder || 'inbox', mailData);
  if (!target) return false;
  return target === alias || target === login || target === alt;
}

async function findUserIdByEmail(email, cache) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  if (cache && cache.has(normalized)) return cache.get(normalized);
  let uid = null;
  try {
    // Buscar por myWed360Email o email en UserProfile
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalized },
          { profile: { myWed360Email: normalized } },
        ],
      },
    });
    
    if (!user) {
      const legacyValue = legacyAlias(normalized);
      if (legacyValue && legacyValue !== normalized) {
        user = await prisma.user.findFirst({
          where: { profile: { myWed360Email: legacyValue } },
        });
      }
    }
    
    if (user) uid = user.id;
  } catch (error) {
    console.warn('findUserIdByEmail failed', normalized, error?.message || error);
  }
  if (cache) cache.set(normalized, uid);
  return uid;
}

async function updateUserMailDoc(email, mailId, payload, options = {}) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  const cache = options.cache || new Map();
  const uid = await findUserIdByEmail(normalized, cache);
  if (!uid) return false;
  
  // Mail ya tiene userId, solo actualizar directamente
  if (options.delete) {
    try {
      await prisma.mail.deleteMany({
        where: { id: mailId, userId: uid },
      });
    } catch (error) {
      console.warn('user mail delete failed', normalized, mailId, error?.message || error);
    }
    return true;
  }
  
  await prisma.mail.updateMany({
    where: { id: mailId, userId: uid },
    data: payload,
  });
  return true;
}

// PUT /api/mail/:id/folder  { folder, restore?, fallbackFolder? }
router.put('/:id/folder', requireMailAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { folder: folderRaw = 'inbox', restore = false, fallbackFolder = '' } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id-required' });

    const mail = await prisma.mail.findUnique({ where: { id } });
    if (!mail) return res.status(404).json({ error: 'not-found' });
    const data = mail;
    const profile = req.userProfile || {};
    if (!hasPrivilegedRole(profile) && !isOwner(profile, data)) {
      return res.status(403).json({ error: 'forbidden' });
    }

    const previousFolder = String(data.folder || 'inbox');
    let requestedFolder = String(folderRaw || '').trim();
    const fallbackTarget = String(fallbackFolder || '').trim();
    const wantsRestore = restore || requestedFolder === 'restore' || requestedFolder === 'previous';
    const existingTrashMeta = data.trashMeta && typeof data.trashMeta === 'object' ? { ...data.trashMeta } : {};
    let nextTrashMeta = { ...existingTrashMeta };
    let deleteTrashMeta = false;

    if (wantsRestore && previousFolder === 'trash') {
      requestedFolder = fallbackTarget || existingTrashMeta.previousFolder || 'inbox';
    }
    if (!requestedFolder) requestedFolder = 'inbox';

    const resolvedFolder = requestedFolder;
    const ownerCache = new Map();
    const ownerCandidates = new Set();
    const nowIso = new Date().toISOString();

    const ownerBefore = resolveOwnerEmail(previousFolder, data);
    if (ownerBefore) ownerCandidates.add(ownerBefore);
    if (existingTrashMeta.ownerEmail) ownerCandidates.add(existingTrashMeta.ownerEmail);

    if (resolvedFolder === 'trash') {
      const previousForTrash =
        previousFolder === 'trash'
          ? existingTrashMeta.previousFolder || existingTrashMeta.restoredTo || 'inbox'
          : previousFolder;
      if (previousForTrash) {
        nextTrashMeta.previousFolder = previousForTrash;
        const prevFolders = Array.isArray(existingTrashMeta.previousFolders)
          ? existingTrashMeta.previousFolders.slice()
          : [];
        if (!prevFolders.includes(previousForTrash)) prevFolders.unshift(previousForTrash);
        nextTrashMeta.previousFolders = prevFolders.slice(0, 10);
      }
      const ownerEmail = resolveOwnerEmail(previousForTrash || previousFolder, data);
      if (ownerEmail) {
        nextTrashMeta.ownerEmail = ownerEmail;
        ownerCandidates.add(ownerEmail);
      }
      nextTrashMeta.movedAt = nowIso;
      if (req.user?.uid) nextTrashMeta.movedBy = req.user.uid;
      delete nextTrashMeta.restoredAt;
      delete nextTrashMeta.restoredTo;
    } else {
      if (previousFolder === 'trash') {
        nextTrashMeta.restoredAt = nowIso;
        nextTrashMeta.restoredTo = resolvedFolder;
        delete nextTrashMeta.previousFolder;
        delete nextTrashMeta.movedAt;
        delete nextTrashMeta.movedBy;
        if (!Array.isArray(nextTrashMeta.previousFolders) || !nextTrashMeta.previousFolders.length) {
          delete nextTrashMeta.previousFolders;
        }
        if (Object.keys(nextTrashMeta).length === 0) {
          deleteTrashMeta = true;
        }
      }
      const ownerAfter = resolveOwnerEmail(resolvedFolder, {
        ...data,
        trashMeta: nextTrashMeta,
        folder: resolvedFolder,
      });
      if (ownerAfter) ownerCandidates.add(ownerAfter);
    }

    ownerCandidates.delete('');

    const updatePayload = {
      folder: resolvedFolder,
      updatedAt: new Date(nowIso),
    };
    const hasTrashMeta = Object.keys(nextTrashMeta).length > 0;
    if (deleteTrashMeta) {
      updatePayload.trashMeta = null;
    } else if (hasTrashMeta) {
      updatePayload.trashMeta = nextTrashMeta;
    }

    await prisma.mail.update({
      where: { id },
      data: updatePayload,
    });

    const userUpdate = {
      folder: resolvedFolder,
      updatedAt: new Date(nowIso),
    };
    if (deleteTrashMeta) {
      userUpdate.trashMeta = null;
    } else if (hasTrashMeta) {
      userUpdate.trashMeta = nextTrashMeta;
    }

    for (const email of ownerCandidates) {
      if (!email) continue;
      try {
        await updateUserMailDoc(email, id, userUpdate, { cache: ownerCache });
      } catch (error) {
        console.warn('folder sync failed for user mail', email, error?.message || error);
      }
    }

    // Fallback ya no necesario - Mail tiene relación directa con userId

    res.json({
      ok: true,
      folder: resolvedFolder,
      trashMeta: deleteTrashMeta ? null : hasTrashMeta ? nextTrashMeta : null,
    });
  } catch (e) {
    console.error('PUT /api/mail/:id/folder', e);
    res.status(500).json({ error: 'update-folder-failed' });
  }
});

// POST /api/mail/:id/tags  { add?: [string], remove?: [string] }
router.post('/:id/tags', requireMailAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { add = [], remove = [] } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id-required' });
    const mail = await prisma.mail.findUnique({ where: { id } });
    if (!mail) return res.status(404).json({ error: 'not-found' });
    const data = mail;
    const profile = req.userProfile || {};
    if (!hasPrivilegedRole(profile) && !isOwner(profile, data)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    let tags = Array.isArray(data.tags) ? data.tags.slice() : [];
    for (const t of add) {
      const name = String(t || '').trim();
      if (name && !tags.includes(name)) tags.push(name);
    }
    if (remove && remove.length) {
      const setRemove = new Set(remove.map((value) => String(value || '').trim()));
      tags = tags.filter((t) => !setRemove.has(String(t || '').trim()));
    }
    await prisma.mail.update({
      where: { id },
      data: { tags },
    });
    res.json({ ok: true, tags });
  } catch (e) {
    console.error('POST /api/mail/:id/tags', e);
    res.status(500).json({ error: 'update-tags-failed' });
  }
});

// POST /api/mail/:id/important { value: boolean }
router.post('/:id/important', requireMailAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { value } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id-required' });

    const important = Boolean(value);
    const mail = await prisma.mail.findUnique({ where: { id } });
    if (!mail) return res.status(404).json({ error: 'not-found' });

    const data = mail;
    const profile = req.userProfile || {};
    if (!hasPrivilegedRole(profile) && !isOwner(profile, data)) {
      return res.status(403).json({ error: 'forbidden' });
    }

    await prisma.mail.update({
      where: { id },
      data: { important },
    });

    const ownerCache = new Map();
    const ownerEmails = new Set();
    ownerEmails.add(resolveOwnerEmail(data.folder || 'inbox', data));
    ownerEmails.add(resolveOwnerEmail('trash', data));
    if (data.trashMeta?.ownerEmail) ownerEmails.add(normalizeEmail(data.trashMeta.ownerEmail));

    for (const email of ownerEmails) {
      if (!email) continue;
      try {
        await updateUserMailDoc(email, id, { important }, { cache: ownerCache });
      } catch (error) {
        console.warn('subcollection important sync failed', email, id, error?.message || error);
      }
    }

    res.json({ ok: true, important });
  } catch (error) {
    console.error('POST /api/mail/:id/important', error);
    res.status(500).json({ error: 'update-important-failed' });
  }
});

// DELETE /api/mail/trash/empty -> empty trash for current user (or target if admin)
router.delete('/trash/empty', requireMailAccess, async (req, res) => {
  try {
    const profile = req.userProfile || {};
    const user = req.user || {};
    const isPrivileged = hasPrivilegedRole(profile);
    const targetUserParam = normalizeEmail(req.query?.user);
    const cache = new Map();
    const userIds = new Set();

    if (isPrivileged && targetUserParam) {
      const targetUid = await findUserIdByEmail(targetUserParam, cache);
      if (targetUid) userIds.add(targetUid);
    }

    if (user?.uid) userIds.add(user.uid);

    if (!userIds.size) {
      const alias = normalizeEmail(profile.myWed360Email || '');
      const login = normalizeEmail(profile.email || '');
      if (alias) {
        const aliasUid = await findUserIdByEmail(alias, cache);
        if (aliasUid) userIds.add(aliasUid);
        const legacyUid = await findUserIdByEmail(legacyAlias(alias), cache);
        if (legacyUid) userIds.add(legacyUid);
      }
      if (login) {
        const loginUid = await findUserIdByEmail(login, cache);
        if (loginUid) userIds.add(loginUid);
      }
    }

    if (!userIds.size) {
      return res.status(400).json({ error: 'user-not-resolved' });
    }

    const deletedIds = new Set();
    let deletedCount = 0;

    // Buscar y eliminar todos los mails en trash de los usuarios
    for (const uid of userIds) {
      const trashMails = await prisma.mail.findMany({
        where: {
          userId: uid,
          folder: 'trash',
        },
      });
      
      for (const mail of trashMails) {
        deletedIds.add(mail.id);
        if (!isPrivileged && !isOwner(profile, mail)) continue;
        try {
          await prisma.mail.delete({ where: { id: mail.id } });
          deletedCount += 1;
        } catch (error) {
          console.warn('mail delete failed', mail.id, error?.message || error);
        }
      }
    }

    res.json({ ok: true, deleted: deletedCount, ids: Array.from(deletedIds) });
  } catch (e) {
    console.error('DELETE /api/mail/trash/empty', e);
    res.status(500).json({ error: 'empty-trash-failed' });
  }
});

// DELETE /api/mail/:id -> remove a single mail
router.delete('/:id', requireMailAccess, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'id-required' });

    const mail = await prisma.mail.findUnique({ where: { id } });
    if (!mail) return res.status(404).json({ error: 'not-found' });
    const data = mail;
    const profile = req.userProfile || {};
    if (!hasPrivilegedRole(profile) && !isOwner(profile, data)) {
      return res.status(403).json({ error: 'forbidden' });
    }

    await prisma.mail.delete({ where: { id } });

    const ownerCache = new Map();
    const ownerEmails = new Set();
    ownerEmails.add(resolveOwnerEmail(data.folder || 'inbox', data));
    if (data.trashMeta?.ownerEmail) ownerEmails.add(normalizeEmail(data.trashMeta.ownerEmail));
    ownerEmails.add(resolveOwnerEmail('trash', data));

    for (const email of ownerEmails) {
      if (!email) continue;
      try {
        await updateUserMailDoc(email, id, {}, { cache: ownerCache, delete: true });
      } catch (error) {
        console.warn('subcollection cleanup failed', email, error?.message || error);
      }
    }

    // Cleanup ya no necesario - Mail tiene userId directo

    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/mail/:id', e);
    res.status(500).json({ error: 'delete-mail-failed' });
  }
});

export default router;
