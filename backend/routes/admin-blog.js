import express from 'express';
import admin from 'firebase-admin';
import { z } from 'zod';

import { db } from '../db.js';
import logger from '../logger.js';
import {
  ensureUniqueSlug,
  generateBlogAssets,
  saveGeneratedBlogPost,
  listPlanEntries,
  runBlogAutomationCycle,
} from '../services/blogAutomationService.js';

const router = express.Router();

const STATUSES = ['draft', 'scheduled', 'published', 'archived', 'failed'];
const BLOG_COLLECTION = 'blogPosts';

function convertTimestamp(field) {
  if (!field) return null;
  if (field instanceof admin.firestore.Timestamp) {
    return field.toDate().toISOString();
  }
  if (field instanceof Date) {
    return field.toISOString();
  }
  if (typeof field === 'string') {
    const parsed = new Date(field);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
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
    availableLanguages: data.availableLanguages || [data.language || 'es'],
    status: data.status || 'draft',
    excerpt: data.excerpt || '',
    content: data.content || {},
    tags: data.tags || [],
    translations: data.translations || {},
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
    research: data.research || null,
    automation: data.automation || null,
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

const planListSchema = z.object({
  limit: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => Number.isFinite(val) && val > 0 && val <= 180)
    .optional()
    .or(z.number().min(1).max(180))
    .default(60),
  status: z.enum(['all', 'planned', 'generating', 'scheduled', 'failed']).default('all'),
  startDate: z.string().datetime().optional(),
});

const planGenerateSchema = z.object({
  publishHour: z.number().min(0).max(23).optional(),
  postStatus: z.enum(['draft', 'scheduled', 'published']).optional(),
  lookaheadDays: z.number().min(0).max(10).optional(),
});

router.get('/', async (req, res) => {
  let filters;
  try {
    filters = listSchema.parse(req.query || {});
  } catch (error) {
    logger.error('[admin-blog] list validation failed:', error?.message || error);
    res.status(400).json({ error: 'invalid-parameters' });
    return;
  }

  const { status, language, limit } = filters;
  const limitNumber = Number(limit) || 50;
  const normalizedLanguage = language ? String(language).toLowerCase() : '';

  const buildQuery = () => {
    let query = db.collection(BLOG_COLLECTION).orderBy('generatedAt', 'desc');
    if (status !== 'all') {
      query = query.where('status', '==', status);
    }
    if (normalizedLanguage) {
      query = query.where('language', '==', normalizedLanguage);
    }
    return query.limit(limitNumber);
  };

  try {
    const snapshot = await buildQuery().get();
    const posts = snapshot.docs.map(mapDoc);
    res.json({ posts });
  } catch (error) {
    const isIndexError =
      error?.code === 'failed-precondition' || error?.message?.includes('requires an index');

    if (!isIndexError) {
      logger.error('[admin-blog] list failed:', error?.message || error);
      res.status(500).json({ error: 'list-failed' });
      return;
    }

    logger.warn('[admin-blog] list query fallback activado:', error?.message || error);

    try {
      const fallbackSnapshot = await db.collection(BLOG_COLLECTION).limit(400).get();
      let posts = fallbackSnapshot.docs.map(mapDoc);

      if (status !== 'all') {
        posts = posts.filter((post) => post.status === status);
      }
      if (normalizedLanguage) {
        posts = posts.filter((post) => (post.language || '').toLowerCase() === normalizedLanguage);
      }

      posts.sort((a, b) => {
        const dateA = a.generatedAt ? new Date(a.generatedAt).getTime() : 0;
        const dateB = b.generatedAt ? new Date(b.generatedAt).getTime() : 0;
        return dateB - dateA;
      });

      res.json({
        posts: posts.slice(0, limitNumber),
        fallback: true,
        indexError: true,
      });
    } catch (fallbackError) {
      logger.error('[admin-blog] list fallback failed:', fallbackError?.message || fallbackError);
      res.status(500).json({ error: 'list-failed' });
    }
  }
});

router.get('/plan', async (req, res) => {
  try {
    const params = planListSchema.parse(req.query || {});
    const entries = await listPlanEntries(params);
    res.json({ entries });
  } catch (error) {
    logger.error('[admin-blog] plan list failed:', error?.message || error);
    res.status(400).json({ error: 'plan-list-failed', details: error?.message });
  }
});

router.post('/plan/generate', async (req, res) => {
  try {
    const params = planGenerateSchema.parse(req.body || {});
    const result = await runBlogAutomationCycle({
      publishHour: typeof params.publishHour === 'number' ? params.publishHour : undefined,
      postStatus: params.postStatus || 'scheduled',
      lookaheadDays: typeof params.lookaheadDays === 'number' ? params.lookaheadDays : undefined,
    });
    res.json({ result });
  } catch (error) {
    logger.error('[admin-blog] plan generate failed:', error);
    res.status(500).json({
      error: 'plan-generate-failed',
      details: error?.message || 'unknown-error',
    });
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
    const assets = await generateBlogAssets(input);
    const saved = await saveGeneratedBlogPost({
      input: { ...input, authorId: assets.authorProfile?.id },
      aiArticle: assets.aiArticle,
      researchData: assets.researchData,
      researchSummary: assets.researchSummary,
      researchReferences: assets.researchReferences,
      coverGeneration: assets.coverGeneration,
      authorProfile: assets.authorProfile,
      authorPrompt: assets.authorPrompt,
      status: 'draft',
      scheduledAt: null,
      createdBy: 'admin:manual',
    });
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
      provider: z.string().optional(),
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
    if (payload.excerpt !== undefined) updates.excerpt = payload.excerpt;
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
        { merge: true }
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
    await db.collection(BLOG_COLLECTION).doc(id).set(
      {
        status: 'scheduled',
        scheduledAt: timestamp,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
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
    await db.collection(BLOG_COLLECTION).doc(id).set(
      {
        status: 'archived',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    const saved = await db.collection(BLOG_COLLECTION).doc(id).get();
    res.json({ post: mapDoc(saved) });
  } catch (error) {
    logger.error('[admin-blog] archive failed:', error?.message || error);
    res.status(400).json({ error: 'archive-failed', details: error?.message });
  }
});

export default router;
