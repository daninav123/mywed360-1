import express from 'express';
import { randomUUID } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';

import { db } from '../db.js';
import { requireMailAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(express.json({ limit: '1mb' }));
router.use(requireMailAccess);

function ensureUid(req, res) {
  const uid = req?.user?.uid || null;
  if (!uid) {
    res.status(401).json({ error: 'auth-required' });
    return null;
  }
  return uid;
}

function foldersDoc(uid) {
  return db.collection('users').doc(uid).collection('settings').doc('emailFolders');
}

function mappingDoc(uid) {
  return db.collection('users').doc(uid).collection('settings').doc('emailFolderMapping');
}

function sanitizeFolderName(name) {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 100);
}

function sanitizeFolderEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const idRaw = entry.id != null ? String(entry.id).trim() : '';
  const id = idRaw || randomUUID();
  const name = sanitizeFolderName(entry.name);
  if (!name) return null;
  const unreadNumber = Number(entry.unread);
  const unread = Number.isFinite(unreadNumber) && unreadNumber >= 0 ? Math.floor(unreadNumber) : 0;
  const createdAtValue = entry.createdAt && typeof entry.createdAt === 'string' ? entry.createdAt : null;
  const updatedAtValue = entry.updatedAt && typeof entry.updatedAt === 'string' ? entry.updatedAt : null;
  const nowIso = new Date().toISOString();
  return {
    id,
    name,
    unread,
    createdAt: createdAtValue && !Number.isNaN(Date.parse(createdAtValue)) ? createdAtValue : nowIso,
    updatedAt: updatedAtValue && !Number.isNaN(Date.parse(updatedAtValue)) ? updatedAtValue : nowIso,
  };
}

function sanitizeFoldersList(list) {
  if (!Array.isArray(list)) return [];
  const sanitized = list
    .map(sanitizeFolderEntry)
    .filter((folder, idx, arr) => folder && arr.findIndex((f) => f.id === folder.id) === idx);
  sanitized.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
  return sanitized;
}

function sanitizeMapping(mapping) {
  if (!mapping || typeof mapping !== 'object') return {};
  const result = {};
  for (const [emailIdRaw, folderIdRaw] of Object.entries(mapping)) {
    const emailId = typeof emailIdRaw === 'string' ? emailIdRaw.trim() : String(emailIdRaw || '').trim();
    const folderId = typeof folderIdRaw === 'string' ? folderIdRaw.trim() : String(folderIdRaw || '').trim();
    if (emailId && folderId) {
      result[emailId] = folderId;
    }
  }
  return result;
}

async function readFolders(uid) {
  const snap = await foldersDoc(uid).get();
  if (!snap.exists) return [];
  const data = snap.data() || {};
  return sanitizeFoldersList(Array.isArray(data.folders) ? data.folders : []);
}

async function writeFolders(uid, folders) {
  const sanitized = sanitizeFoldersList(folders);
  await foldersDoc(uid).set(
    {
      folders: sanitized,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return sanitized;
}

async function readMapping(uid) {
  const snap = await mappingDoc(uid).get();
  if (!snap.exists) return {};
  const data = snap.data() || {};
  return sanitizeMapping(data.mapping || {});
}

async function writeMapping(uid, mapping) {
  const sanitized = sanitizeMapping(mapping);
  await mappingDoc(uid).set(
    {
      mapping: sanitized,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return sanitized;
}

async function setMappingEntry(uid, emailId, folderId) {
  const emailKey = String(emailId || '').trim();
  const folderKey = String(folderId || '').trim();
  if (!emailKey) return await readMapping(uid);
  return await db.runTransaction(async (tx) => {
    const ref = mappingDoc(uid);
    const snap = await tx.get(ref);
    const current = sanitizeMapping(snap.exists ? snap.data()?.mapping || {} : {});
    if (!folderKey) {
      delete current[emailKey];
    } else {
      current[emailKey] = folderKey;
    }
    tx.set(
      ref,
      {
        mapping: current,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return current;
  });
}

async function deleteMappingEntry(uid, emailId) {
  return await db.runTransaction(async (tx) => {
    const ref = mappingDoc(uid);
    const snap = await tx.get(ref);
    if (!snap.exists) return {};
    const current = sanitizeMapping(snap.data()?.mapping || {});
    const emailKey = String(emailId || '').trim();
    if (!emailKey) return current;
    if (!(emailKey in current)) return current;
    delete current[emailKey];
    tx.set(
      ref,
      {
        mapping: current,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return current;
  });
}

async function cleanupMappingForFolder(uid, folderId) {
  if (!folderId) return;
  await db.runTransaction(async (tx) => {
    const ref = mappingDoc(uid);
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const current = sanitizeMapping(snap.data()?.mapping || {});
    let changed = false;
    for (const [emailId, targetFolder] of Object.entries(current)) {
      if (targetFolder === folderId) {
        delete current[emailId];
        changed = true;
      }
    }
    if (!changed) return;
    tx.set(
      ref,
      {
        mapping: current,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}

router.get('/', async (req, res) => {
  try {
    const uid = ensureUid(req, res);
    if (!uid) return;
    const folders = await readFolders(uid);
    const mapping = await readMapping(uid);
    res.json({ folders, mapping });
  } catch (error) {
    console.error('[email-folders] GET / failed', error);
    res.status(500).json({ error: 'internal-error' });
  }
});

router.put('/', async (req, res) => {
  try {
    const uid = ensureUid(req, res);
    if (!uid) return;
    const { folders } = req.body || {};
    if (!Array.isArray(folders)) {
      return res.status(400).json({ error: 'folders-array-required' });
    }
    const saved = await writeFolders(uid, folders);
    res.json({ folders: saved });
  } catch (error) {
    console.error('[email-folders] PUT / failed', error);
    res.status(500).json({ error: 'internal-error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const uid = ensureUid(req, res);
    if (!uid) return;
    const incoming = sanitizeFolderEntry(req.body);
    if (!incoming) {
      return res.status(400).json({ error: 'invalid-folder' });
    }
    const created = await db.runTransaction(async (tx) => {
      const ref = foldersDoc(uid);
      const snap = await tx.get(ref);
      const current = sanitizeFoldersList(snap.exists ? snap.data()?.folders || [] : []);
      if (current.some((folder) => folder.id === incoming.id)) {
        throw new Error('folder-conflict');
      }
      const next = [...current, { ...incoming, updatedAt: new Date().toISOString() }];
      tx.set(
        ref,
        {
          folders: next,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return next.find((folder) => folder.id === incoming.id);
    });
    res.status(201).json({ folder: created });
  } catch (error) {
    if (error?.message === 'folder-conflict') {
      return res.status(409).json({ error: 'folder-already-exists' });
    }
    console.error('[email-folders] POST / failed', error);
    res.status(500).json({ error: 'internal-error' });
  }
});

router.put('/:folderId', async (req, res) => {
  try {
    const uid = ensureUid(req, res);
    if (!uid) return;
    const { folderId } = req.params;
    const name = sanitizeFolderName(req.body?.name);
    const hasUnread = Object.prototype.hasOwnProperty.call(req.body || {}, 'unread');
    const unreadNumber = Number(req.body?.unread);
    const unread =
      hasUnread && Number.isFinite(unreadNumber) && unreadNumber >= 0 ? Math.floor(unreadNumber) : undefined;
    if (!name && unread === undefined) {
      return res.status(400).json({ error: 'nothing-to-update' });
    }
    const updated = await db.runTransaction(async (tx) => {
      const ref = foldersDoc(uid);
      const snap = await tx.get(ref);
      const current = sanitizeFoldersList(snap.exists ? snap.data()?.folders || [] : []);
      const idx = current.findIndex((folder) => folder.id === folderId);
      if (idx === -1) throw new Error('not-found');
      if (name) current[idx].name = name;
      if (unread !== undefined) current[idx].unread = unread;
      current[idx].updatedAt = new Date().toISOString();
      tx.set(
        ref,
        {
          folders: current,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return current[idx];
    });
    res.json({ folder: updated });
  } catch (error) {
    if (error?.message === 'not-found') {
      return res.status(404).json({ error: 'folder-not-found' });
    }
    console.error('[email-folders] PUT /:id failed', error);
    res.status(500).json({ error: 'internal-error' });
  }
});

router.delete('/:folderId', async (req, res) => {
  try {
    const uid = ensureUid(req, res);
    if (!uid) return;
    const { folderId } = req.params;
    await db.runTransaction(async (tx) => {
      const ref = foldersDoc(uid);
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error('not-found');
      const current = sanitizeFoldersList(snap.data()?.folders || []);
      const filtered = current.filter((folder) => folder.id !== folderId);
      if (filtered.length === current.length) throw new Error('not-found');
      tx.set(
        ref,
        {
          folders: filtered,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
    await cleanupMappingForFolder(uid, folderId);
    res.json({ ok: true });
  } catch (error) {
    if (error?.message === 'not-found') {
      return res.status(404).json({ error: 'folder-not-found' });
    }
    console.error('[email-folders] DELETE /:id failed', error);
    res.status(500).json({ error: 'internal-error' });
  }
});

router.get('/mapping', async (req, res) => {
  try {
    const uid = ensureUid(req, res);
    if (!uid) return;
    const mapping = await readMapping(uid);
    res.json({ mapping });
  } catch (error) {
    console.error('[email-folders] GET /mapping failed', error);
    res.status(500).json({ error: 'internal-error' });
  }
});

router.put('/mapping', async (req, res) => {
  try {
    const uid = ensureUid(req, res);
    if (!uid) return;
    const { mapping } = req.body || {};
    if (!mapping || typeof mapping !== 'object') {
      return res.status(400).json({ error: 'mapping-object-required' });
    }
    const saved = await writeMapping(uid, mapping);
    res.json({ mapping: saved });
  } catch (error) {
    console.error('[email-folders] PUT /mapping failed', error);
    res.status(500).json({ error: 'internal-error' });
  }
});

router.put('/mapping/:emailId', async (req, res) => {
  try {
    const uid = ensureUid(req, res);
    if (!uid) return;
    const { emailId } = req.params;
    const folderId = req.body?.folderId;
    const updated = await setMappingEntry(uid, emailId, folderId);
    res.json({ mapping: updated });
  } catch (error) {
    console.error('[email-folders] PUT /mapping/:emailId failed', error);
    res.status(500).json({ error: 'internal-error' });
  }
});

router.delete('/mapping/:emailId', async (req, res) => {
  try {
    const uid = ensureUid(req, res);
    if (!uid) return;
    const { emailId } = req.params;
    const updated = await deleteMappingEntry(uid, emailId);
    res.json({ mapping: updated });
  } catch (error) {
    console.error('[email-folders] DELETE /mapping/:emailId failed', error);
    res.status(500).json({ error: 'internal-error' });
  }
});

export default router;
