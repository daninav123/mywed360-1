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

function tagsDoc(uid) {
  return db.collection('users').doc(uid).collection('settings').doc('emailTags');
}

function mappingDoc(uid) {
  return db.collection('users').doc(uid).collection('settings').doc('emailTagsMapping');
}

function sanitizeTagName(name) {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 60);
}

function sanitizeTagColor(color) {
  if (typeof color !== 'string') return '#64748b';
  const value = color.trim().toLowerCase();
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return value;
  return '#64748b';
}

function sanitizeTagEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const idRaw = entry.id != null ? String(entry.id).trim() : '';
  const id = idRaw || randomUUID();
  const name = sanitizeTagName(entry.name);
  if (!name) return null;
  const color = sanitizeTagColor(entry.color);
  const createdAtValue = entry.createdAt && typeof entry.createdAt === 'string' ? entry.createdAt : null;
  const updatedAtValue = entry.updatedAt && typeof entry.updatedAt === 'string' ? entry.updatedAt : null;
  const nowIso = new Date().toISOString();
  return {
    id,
    name,
    color,
    createdAt: createdAtValue && !Number.isNaN(Date.parse(createdAtValue)) ? createdAtValue : nowIso,
    updatedAt: updatedAtValue && !Number.isNaN(Date.parse(updatedAtValue)) ? updatedAtValue : nowIso,
  };
}

function sanitizeTagsList(list) {
  if (!Array.isArray(list)) return [];
  const sanitized = list
    .map(sanitizeTagEntry)
    .filter((tag, idx, arr) => tag && arr.findIndex((t) => t.id === tag.id) === idx);
  sanitized.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
  return sanitized;
}

function sanitizeTagsMapping(mapping) {
  if (!mapping || typeof mapping !== 'object') return {};
  const result = {};
  for (const [emailIdRaw, tagList] of Object.entries(mapping)) {
    const emailId = typeof emailIdRaw === 'string' ? emailIdRaw.trim() : String(emailIdRaw || '').trim();
    if (!emailId) continue;
    const tags = Array.isArray(tagList)
      ? tagList
          .map((tagId) => (typeof tagId === 'string' ? tagId.trim() : String(tagId || '').trim()))
          .filter(Boolean)
      : [];
    if (!tags.length) continue;
    result[emailId] = Array.from(new Set(tags));
  }
  return result;
}

async function readTags(uid) {
  const snap = await tagsDoc(uid).get();
  if (!snap.exists) return [];
  const data = snap.data() || {};
  return sanitizeTagsList(Array.isArray(data.tags) ? data.tags : []);
}

async function writeTags(uid, tags) {
  const sanitized = sanitizeTagsList(tags);
  await tagsDoc(uid).set(
    {
      tags: sanitized,
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
  return sanitizeTagsMapping(data.mapping || {});
}

async function writeMapping(uid, mapping) {
  const sanitized = sanitizeTagsMapping(mapping);
  await mappingDoc(uid).set(
    {
      mapping: sanitized,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return sanitized;
}

async function setMappingForEmail(uid, emailId, tags) {
  const emailKey = String(emailId || '').trim();
  if (!emailKey) return await readMapping(uid);
  const cleanedTags = Array.isArray(tags)
    ? Array.from(
        new Set(
          tags
            .map((tagId) => (typeof tagId === 'string' ? tagId.trim() : String(tagId || '').trim()))
            .filter(Boolean)
        )
      )
    : [];
  return await db.runTransaction(async (tx) => {
    const ref = mappingDoc(uid);
    const snap = await tx.get(ref);
    const current = sanitizeTagsMapping(snap.exists ? snap.data()?.mapping || {} : {});
    if (!cleanedTags.length) {
      delete current[emailKey];
    } else {
      current[emailKey] = cleanedTags;
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

async function patchMappingForEmail(uid, emailId, { add = [], remove = [] }) {
  const emailKey = String(emailId || '').trim();
  if (!emailKey) return await readMapping(uid);
  const addList = Array.isArray(add)
    ? add
        .map((tagId) => (typeof tagId === 'string' ? tagId.trim() : String(tagId || '').trim()))
        .filter(Boolean)
    : [];
  const removeSet = new Set(
    Array.isArray(remove)
      ? remove
          .map((tagId) => (typeof tagId === 'string' ? tagId.trim() : String(tagId || '').trim()))
          .filter(Boolean)
      : []
  );
  if (!addList.length && !removeSet.size) {
    return await readMapping(uid);
  }
  return await db.runTransaction(async (tx) => {
    const ref = mappingDoc(uid);
    const snap = await tx.get(ref);
    const current = sanitizeTagsMapping(snap.exists ? snap.data()?.mapping || {} : {});
    const existing = Array.isArray(current[emailKey]) ? [...current[emailKey]] : [];
    let merged = existing;
    if (removeSet.size) {
      merged = merged.filter((tagId) => !removeSet.has(tagId));
    }
    if (addList.length) {
      const mergedSet = new Set(merged);
      addList.forEach((tagId) => mergedSet.add(tagId));
      merged = Array.from(mergedSet);
    }
    if (!merged.length) {
      delete current[emailKey];
    } else {
      current[emailKey] = merged;
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

async function cleanupMappingForTag(uid, tagId) {
  if (!tagId) return;
  await db.runTransaction(async (tx) => {
    const ref = mappingDoc(uid);
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const current = sanitizeTagsMapping(snap.data()?.mapping || {});
    let changed = false;
    for (const [emailId, tags] of Object.entries(current)) {
      const filtered = tags.filter((id) => id !== tagId);
      if (filtered.length !== tags.length) {
        changed = true;
        if (filtered.length) current[emailId] = filtered;
        else delete current[emailId];
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
    const tags = await readTags(uid);
    res.json({ tags });
  } catch (error) {
    console.error('[email-tags] GET / failed', error);
    res.status(500).json({ error: 'internal-error' });
  }
});

router.put('/', async (req, res) => {
  try {
    const uid = ensureUid(req, res);
    if (!uid) return;
    const { tags } = req.body || {};
    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: 'tags-array-required' });
    }
    const saved = await writeTags(uid, tags);
    res.json({ tags: saved });
  } catch (error) {
    console.error('[email-tags] PUT / failed', error);
    res.status(500).json({ error: 'internal-error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const uid = ensureUid(req, res);
    if (!uid) return;
    const incoming = sanitizeTagEntry(req.body);
    if (!incoming) {
      return res.status(400).json({ error: 'invalid-tag' });
    }
    const created = await db.runTransaction(async (tx) => {
      const ref = tagsDoc(uid);
      const snap = await tx.get(ref);
      const current = sanitizeTagsList(snap.exists ? snap.data()?.tags || [] : []);
      if (current.some((tag) => tag.id === incoming.id)) {
        throw new Error('tag-conflict');
      }
      const next = [...current, { ...incoming, updatedAt: new Date().toISOString() }];
      tx.set(
        ref,
        {
          tags: next,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return next.find((tag) => tag.id === incoming.id);
    });
    res.status(201).json({ tag: created });
  } catch (error) {
    if (error?.message === 'tag-conflict') {
      return res.status(409).json({ error: 'tag-already-exists' });
    }
    console.error('[email-tags] POST / failed', error);
    res.status(500).json({ error: 'internal-error' });
  }
});

router.put('/:tagId', async (req, res) => {
  try {
    const uid = ensureUid(req, res);
    if (!uid) return;
    const { tagId } = req.params;
    const newName = sanitizeTagName(req.body?.name);
    const hasColor = Object.prototype.hasOwnProperty.call(req.body || {}, 'color');
    const newColor = hasColor ? sanitizeTagColor(req.body?.color) : undefined;
    if (!newName && newColor === undefined) {
      return res.status(400).json({ error: 'nothing-to-update' });
    }
    const updated = await db.runTransaction(async (tx) => {
      const ref = tagsDoc(uid);
      const snap = await tx.get(ref);
      const current = sanitizeTagsList(snap.exists ? snap.data()?.tags || [] : []);
      const idx = current.findIndex((tag) => tag.id === tagId);
      if (idx === -1) throw new Error('not-found');
      if (newName) current[idx].name = newName;
      if (newColor !== undefined) current[idx].color = newColor;
      current[idx].updatedAt = new Date().toISOString();
      tx.set(
        ref,
        {
          tags: current,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return current[idx];
    });
    res.json({ tag: updated });
  } catch (error) {
    if (error?.message === 'not-found') {
      return res.status(404).json({ error: 'tag-not-found' });
    }
    console.error('[email-tags] PUT /:id failed', error);
    res.status(500).json({ error: 'internal-error' });
  }
});

router.delete('/:tagId', async (req, res) => {
  try {
    const uid = ensureUid(req, res);
    if (!uid) return;
    const { tagId } = req.params;
    await db.runTransaction(async (tx) => {
      const ref = tagsDoc(uid);
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error('not-found');
      const current = sanitizeTagsList(snap.data()?.tags || []);
      const filtered = current.filter((tag) => tag.id !== tagId);
      if (filtered.length === current.length) throw new Error('not-found');
      tx.set(
        ref,
        {
          tags: filtered,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
    await cleanupMappingForTag(uid, tagId);
    res.json({ ok: true });
  } catch (error) {
    if (error?.message === 'not-found') {
      return res.status(404).json({ error: 'tag-not-found' });
    }
    console.error('[email-tags] DELETE /:id failed', error);
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
    console.error('[email-tags] GET /mapping failed', error);
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
    console.error('[email-tags] PUT /mapping failed', error);
    res.status(500).json({ error: 'internal-error' });
  }
});

router.put('/mapping/:emailId', async (req, res) => {
  try {
    const uid = ensureUid(req, res);
    if (!uid) return;
    const { emailId } = req.params;
    const tags = req.body?.tags;
    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: 'tags-array-required' });
    }
    const mapping = await setMappingForEmail(uid, emailId, tags);
    res.json({ mapping });
  } catch (error) {
    console.error('[email-tags] PUT /mapping/:emailId failed', error);
    res.status(500).json({ error: 'internal-error' });
  }
});

router.post('/mapping/:emailId', async (req, res) => {
  try {
    const uid = ensureUid(req, res);
    if (!uid) return;
    const { emailId } = req.params;
    const { add, remove } = req.body || {};
    const mapping = await patchMappingForEmail(uid, emailId, { add, remove });
    res.json({ mapping });
  } catch (error) {
    console.error('[email-tags] POST /mapping/:emailId failed', error);
    res.status(500).json({ error: 'internal-error' });
  }
});

router.delete('/mapping/:emailId', async (req, res) => {
  try {
    const uid = ensureUid(req, res);
    if (!uid) return;
    const { emailId } = req.params;
    const mapping = await setMappingForEmail(uid, emailId, []);
    res.json({ mapping });
  } catch (error) {
    console.error('[email-tags] DELETE /mapping/:emailId failed', error);
    res.status(500).json({ error: 'internal-error' });
  }
});

export default router;
