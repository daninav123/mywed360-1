import express from 'express';
import admin from 'firebase-admin';
import { z } from 'zod';

import { db } from '../db.js';
import logger from '../logger.js';
import {
  computeDefaultTags,
  ensureExcerpt,
  generateBlogArticle,
} from '../services/blogAiService.js';

const router = express.Router();

const STATUSES = ['draft', 'scheduled', 'published', 'archived', 'failed'];
const BLOG_COLLECTION = 'blogPosts';

function slugify(value = '') {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 80);
}

async function ensureUniqueSlug(baseTitle, currentId = null) {
  let base = slugify(baseTitle);
  if (!base) base = `articulo-${Date.now()}`;
  let candidate = base;
  let attempts = 0;
  while (attempts < 10) {
    const snapshot = await db
      .collection(BLOG_COLLECTION)
      .where('slug', '==', candidate)
      .limit(1)
      .get();
    if (
      snapshot.empty ||
      snapshot.docs.every((doc) => !currentId || doc.id === currentId)
    ) {
      return candidate;
    }
    attempts += 1;
    candidate = `${base}-${attempts + 1}`;
  }
  return `${base}-${Date.now()}`;
}

function convertTimestamp(field) {
  if (!field) return null;
  if (field instanceof admin.firestore.Timestamp) {
    return field.toDate().toISOString();
  }
  if (field instanceof Date) {
    return field.toISOString();
  }
  if (typeof field === 'string') {
    return new Date(field).toISOString();
  }
  return null;
}

function mapDoc(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    title: data.title || '',
    slug: data.slug || '',
    language: data.language || 'es',
    status: data.status || 'draft',
    excerpt: data.excerpt || '',
    content: data.content || {},
    tags: data.tags || [],
    coverImage: data.coverImage || null,
    prompt: data.prompt || {},
    metrics: data.metrics || {},
    generatedAt: convertTimestamp(data.generatedAt),
    updatedAt: convertTimestamp(data.updatedAt),
    scheduledAt: convertTimestamp(data.scheduledAt),
    publishedAt: convertTimestamp(data.publishedAt),
    rawSource: data.rawSource || null,
    createdBy: data.createdBy || null,
    approvedBy: data.approvedBy || null,
  };
}

const listSchema = z.object({
  status: z.enum(['all', ...STATUSES]).default('all'),
  language: z.string().optional(),
  limit: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => Number.isFinite(val) && val > 0 && val <= 100)
    .optional()
    .or(z.number().min(1).max(100))
    .default(50),
});

router.get('/', async (req, res) => {
  try {
    const { status, language, limit } = listSchema.parse(req.query || {});
    let query = db.collection(BLOG_COLLECTION).orderBy('generatedAt', 'desc');
    if (status !== 'all') {
      query = query.where('status', '==', status);
    }
    if (language) {
      query = query.where('language', '==', language);
    }
    const snapshot = await query.limit(Number(limit) || 50).get();
    const posts = snapshot.docs.map(mapDoc);
    res.json({ posts });
  } catch (error) {
    logger.error('[admin-blog] list failed:', error?.message || error);
    res.status(400).json({ error: 'invalid-parameters' });
  }
});

const createSchema = z.object({
  topic: z.string().min(6),
  language: z.string().default('es'),
  tone: z.string().default('inspirador'),
  length: z.enum(['corto', 'medio', 'largo', 'short', 'medium', 'long']).default('medio'),
  keywords: z.array(z.string().min(2)).max(12).optional(),
  audience: z.string().optional(),
  includeTips: z.boolean().optional(),
  includeCTA: z.boolean().optional(),
});

router.post('/', async (req, res) => {
  try {
    const input = createSchema.parse(req.body || {});
    const aiArticle = await generateBlogArticle(input);
    const slug = await ensureUniqueSlug(aiArticle.title);

    const now = admin.firestore.FieldValue.serverTimestamp();
    const doc = {
      title: aiArticle.title,
      slug,
      language: input.language || 'es',
      status: 'draft',
      generatedAt: now,
      updatedAt: now,
      scheduledAt: null,
      publishedAt: null,
      excerpt: ensureExcerpt(aiArticle.markdown, aiArticle.excerpt),
      content: {
        markdown: aiArticle.markdown,
        outline: aiArticle.sections || [],
        tips: aiArticle.tips || [],
        conclusion: aiArticle.conclusion || '',
        cta: aiArticle.cta || '',
      },
      tags: aiArticle.tags && aiArticle.tags.length
        ? aiArticle.tags
        : computeDefaultTags(input.keywords, aiArticle.sections),
      coverImage: aiArticle.coverPrompt
        ? {
            prompt: aiArticle.coverPrompt,
            status: 'pending',
            url: null,
            source: aiArticle.source || 'openai',
          }
        : null,
      prompt: {
        input,
        source: aiArticle.source || 'openai',
        raw: aiArticle.raw,
      },
      metrics: {
        views: 0,
        shares: 0,
      },
    };

    const ref = await db.collection(BLOG_COLLECTION).add(doc);
    const saved = await ref.get();
    res.status(201).json({ post: mapDoc(saved) });
  } catch (error) {
    logger.error('[admin-blog] create failed:', error?.message || error);
    res.status(400).json({ error: 'generation-failed', details: error?.message });
  }
});

const updateSchema = z.object({
  title: z.string().min(6).optional(),
  slug: z.string().min(3).optional(),
  excerpt: z.string().min(10).optional(),
  content: z
    .object({
      markdown: z.string().min(20).optional(),
      outline: z.array(z.any()).optional(),
      tips: z.array(z.string()).optional(),
      conclusion: z.string().optional(),
      cta: z.string().optional(),
    })
    .optional(),
  tags: z.array(z.string().min(2)).max(12).optional(),
  status: z.enum(STATUSES).optional(),
  coverImage: z
    .object({
      url: z.string().url().nullable().optional(),
      prompt: z.string().optional(),
      source: z.string().optional(),
      alt: z.string().optional(),
      status: z.string().optional(),
    })
    .nullable()
    .optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  approvedBy: z.string().optional(),
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const payload = updateSchema.parse(req.body || {});
    const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };

    if (payload.title) updates.title = payload.title;
    if (payload.slug) {
      updates.slug = await ensureUniqueSlug(payload.slug, id);
    }
    if (payload.excerpt) updates.excerpt = payload.excerpt;
    if (payload.content) updates.content = { ...payload.content };
    if (payload.tags) updates.tags = payload.tags;
    if (payload.status) updates.status = payload.status;
    if (payload.coverImage !== undefined) updates.coverImage = payload.coverImage || null;
    if (payload.approvedBy) updates.approvedBy = payload.approvedBy;

    if (payload.scheduledAt !== undefined) {
      updates.scheduledAt = payload.scheduledAt
        ? admin.firestore.Timestamp.fromDate(new Date(payload.scheduledAt))
        : null;
    }
    if (payload.publishedAt !== undefined) {
      updates.publishedAt = payload.publishedAt
        ? admin.firestore.Timestamp.fromDate(new Date(payload.publishedAt))
        : null;
    }

    await db.collection(BLOG_COLLECTION).doc(id).set(updates, { merge: true });
    const saved = await db.collection(BLOG_COLLECTION).doc(id).get();
    res.json({ post: mapDoc(saved) });
  } catch (error) {
    logger.error('[admin-blog] update failed:', error?.message || error);
    res.status(400).json({ error: 'update-failed', details: error?.message });
  }
});

const publishSchema = z.object({
  publishedAt: z.string().datetime().optional(),
  approvedBy: z.string().optional(),
});

router.post('/:id/publish', async (req, res) => {
  const { id } = req.params;
  try {
    const { publishedAt, approvedBy } = publishSchema.parse(req.body || {});
    const timestamp = publishedAt
      ? admin.firestore.Timestamp.fromDate(new Date(publishedAt))
      : admin.firestore.FieldValue.serverTimestamp();

    await db
      .collection(BLOG_COLLECTION)
      .doc(id)
      .set(
        {
          status: 'published',
          publishedAt: timestamp,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          scheduledAt: null,
          approvedBy: approvedBy || admin.firestore.FieldValue.delete(),
        },
        { merge: true },
      );
    const saved = await db.collection(BLOG_COLLECTION).doc(id).get();
    res.json({ post: mapDoc(saved) });
  } catch (error) {
    logger.error('[admin-blog] publish failed:', error?.message || error);
    res.status(400).json({ error: 'publish-failed', details: error?.message });
  }
});

const scheduleSchema = z.object({
  scheduledAt: z.string().datetime(),
});

router.post('/:id/schedule', async (req, res) => {
  const { id } = req.params;
  try {
    const { scheduledAt } = scheduleSchema.parse(req.body || {});
    const timestamp = admin.firestore.Timestamp.fromDate(new Date(scheduledAt));
    await db
      .collection(BLOG_COLLECTION)
      .doc(id)
      .set(
        {
          status: 'scheduled',
          scheduledAt: timestamp,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    const saved = await db.collection(BLOG_COLLECTION).doc(id).get();
    res.json({ post: mapDoc(saved) });
  } catch (error) {
    logger.error('[admin-blog] schedule failed:', error?.message || error);
    res.status(400).json({ error: 'schedule-failed', details: error?.message });
  }
});

router.post('/:id/archive', async (req, res) => {
  const { id } = req.params;
  try {
    await db
      .collection(BLOG_COLLECTION)
      .doc(id)
      .set(
        {
          status: 'archived',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    const saved = await db.collection(BLOG_COLLECTION).doc(id).get();
    res.json({ post: mapDoc(saved) });
  } catch (error) {
    logger.error('[admin-blog] archive failed:', error?.message || error);
    res.status(400).json({ error: 'archive-failed', details: error?.message });
  }
});

export default router;

