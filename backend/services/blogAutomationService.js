import admin from 'firebase-admin';
import { addDays, formatISO, parseISO, startOfDay } from 'date-fns';

import logger from '../utils/logger.js';
import { db } from '../db.js';
import {
  computeDefaultTags,
  ensureExcerpt,
  generateBlogArticle,
  generateCoverImageFromPrompt,
  getSupportedBlogLanguages,
  translateBlogArticleToLanguages,
} from './blogAiService.js';
import { assignAuthorProfile } from '../../shared/blogAuthors.js';
import { generateDailyTopicPlan } from './blogTopicPlanner.js';
import { researchTopic } from './blogResearchService.js';

const BLOG_COLLECTION = 'blogPosts';
const BLOG_PLAN_COLLECTION = 'blogEditorialPlan';

const DEFAULT_PLAN_WINDOW_DAYS = Number(process.env.BLOG_AUTOMATION_PLAN_DAYS || 120);
const DEFAULT_LOOKAHEAD_DAYS = Number(process.env.BLOG_AUTOMATION_LOOKAHEAD_DAYS || 2);
const DEFAULT_PUBLISH_HOUR = Number(process.env.BLOG_AUTOMATION_PUBLISH_HOUR || 9);

export async function generateBlogAssets(input) {
  const researchData = await researchTopic({
    topic: input.topic,
    language: input.language || 'es',
  }).catch((error) => {
    logger.error('[blogAutomation] research failed:', error?.message || error);
    return { provider: 'none', summary: '', references: [], raw: { error: error?.message } };
  });

  const researchSummary =
    typeof researchData.summary === 'string' ? researchData.summary.slice(0, 2000) : '';
  const researchReferences = Array.isArray(researchData.references)
    ? researchData.references.slice(0, 8)
    : [];

  const normalizedSummary =
    researchSummary && researchSummary.trim().length >= 10
      ? researchSummary.trim()
      : 'Resumen provisional: analiza tendencias, recomendaciones y buenas prácticas de planificación de bodas en España.';

  const { author, promptSnippet } = assignAuthorProfile({
    topic: input.topic,
    keywords: input.keywords,
  });

  const generationInput = {
    ...input,
    tone: input.tone || 'cálido cercano',
    authorPrompt: promptSnippet,
    author,
    research: {
      summary: normalizedSummary,
      references: researchReferences,
    },
  };

  const aiArticle = await generateBlogArticle(generationInput);

  let coverGeneration = null;
  if (aiArticle.coverPrompt) {
    try {
      coverGeneration = await generateCoverImageFromPrompt(aiArticle.coverPrompt, {
        size: process.env.BLOG_COVER_IMAGE_SIZE || '1792x1024',
        quality: process.env.BLOG_COVER_IMAGE_QUALITY || 'high',
      });
    } catch (coverError) {
      logger.error(
        '[blogAutomation] cover image generation failed:',
        coverError?.message || coverError
      );
      coverGeneration = {
        status: 'failed',
        provider: 'openai',
        error: coverError?.message || 'unknown-error',
      };
    }
  }

  return {
    researchData,
    researchSummary: normalizedSummary,
    researchReferences,
    aiArticle,
    coverGeneration,
    authorProfile: author,
    authorPrompt: promptSnippet,
  };
}

function applyCoverImage(aiArticle, coverGeneration, timestamp) {
  if (!aiArticle.coverPrompt) return null;

  const coverImage = {
    prompt: aiArticle.coverPrompt,
    status: 'pending',
    url: null,
    provider: aiArticle.source || 'openai',
    source: aiArticle.source || 'openai',
  };

  if (!coverGeneration) return coverImage;

  coverImage.status = coverGeneration.status || coverImage.status;
  coverImage.url = coverGeneration.url || null;
  coverImage.provider = coverGeneration.provider || coverImage.provider;
  coverImage.source = coverImage.provider;

  if (coverGeneration.storagePath) coverImage.storagePath = coverGeneration.storagePath;
  if (coverGeneration.bucket) coverImage.bucket = coverGeneration.bucket;
  if (coverGeneration.originalUrl) coverImage.originalUrl = coverGeneration.originalUrl;
  if (coverGeneration.signedUrlExpiresAt) {
    coverImage.signedUrlExpiresAt = coverGeneration.signedUrlExpiresAt;
  }
  if (coverGeneration.upload) coverImage.upload = coverGeneration.upload;

  if (coverGeneration.model) coverImage.model = coverGeneration.model;
  if (coverGeneration.status === 'ready') {
    coverImage.generatedAt = timestamp;
  }
  if (coverGeneration.error || coverGeneration.reason) {
    coverImage.error = coverGeneration.error || coverGeneration.reason;
  }
  return coverImage;
}

export async function saveGeneratedBlogPost({
  input,
  aiArticle,
  researchData,
  researchSummary,
  researchReferences,
  coverGeneration,
  authorProfile,
  authorPrompt,
  status = 'draft',
  scheduledAt = null,
  createdBy = 'automation',
  automationMeta = {},
}) {
  if (!aiArticle || !aiArticle.title) {
    throw new Error('blog-automation-missing-article');
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  const coverImage = applyCoverImage(aiArticle, coverGeneration, now);

  const baseLanguage = (input.language || 'es').toLowerCase();
  const supportedLanguages = getSupportedBlogLanguages();
  const targetLanguages = supportedLanguages.filter((lang) => lang && lang !== baseLanguage);
  const byline = authorProfile
    ? {
        id: authorProfile.id,
        slug: authorProfile.slug,
        name: authorProfile.name,
        title: authorProfile.title || '',
        signature: authorProfile.signature || '',
      }
    : null;

  let translationMap = {};
  if (targetLanguages.length) {
    const translations = await translateBlogArticleToLanguages({
      article: aiArticle,
      fromLanguage: baseLanguage,
      targetLanguages,
      tone: input.tone || (baseLanguage === 'en' ? 'warm and human' : 'cálido cercano'),
      references: researchReferences,
      author: byline,
    }).catch((error) => {
      logger.error(
        '[blogAutomation] translations failed %s -> %s: %s',
        baseLanguage,
        targetLanguages.join(','),
        error?.message || error
      );
      return {};
    });
    translationMap = translations || {};
  }

  const doc = {
    title: aiArticle.title,
    slug: await ensureUniqueSlug(aiArticle.title),
    language: baseLanguage,
    status,
    generatedAt: now,
    updatedAt: now,
    scheduledAt: scheduledAt ? admin.firestore.Timestamp.fromDate(new Date(scheduledAt)) : null,
    publishedAt: null,
    excerpt: ensureExcerpt(aiArticle.markdown, aiArticle.excerpt),
    content: {
      markdown: aiArticle.markdown,
      outline: aiArticle.sections || [],
      tips: aiArticle.tips || [],
      conclusion: aiArticle.conclusion || '',
      cta: aiArticle.cta || '',
      references: researchReferences,
    },
    byline,
    tags:
      aiArticle.tags && aiArticle.tags.length
        ? aiArticle.tags
        : computeDefaultTags(input.keywords, aiArticle.sections),
    coverImage,
    prompt: {
      input,
      source: aiArticle.source || 'openai',
      raw: aiArticle.raw,
      authorPrompt: authorPrompt || null,
      research: {
        provider: researchData.provider,
        summary: researchSummary,
        references: researchReferences.map((ref) => ({
          title: ref.title,
          url: ref.url,
        })),
      },
    },
    research: {
      provider: researchData.provider,
      summary: researchSummary,
      references: researchReferences,
    },
    rawSource: {
      article: aiArticle.raw,
      research: researchData.raw,
    },
    automation: {
      generatedBy: createdBy,
      runAt: now,
      researchProvider: researchData.provider || null,
      articleSource: aiArticle.source || null,
      coverStatus: coverImage ? coverImage.status : 'none',
      authorId: byline?.id || null,
      ...automationMeta,
    },
    metrics: {
      views: 0,
      shares: 0,
    },
    translations: translationMap,
  };

  const availableLanguages = new Set([baseLanguage]);
  Object.entries(translationMap).forEach(([lang, value]) => {
    if (value && value.status === 'ready') {
      availableLanguages.add(lang);
    }
  });
  doc.availableLanguages = Array.from(availableLanguages);

  const ref = await db.collection(BLOG_COLLECTION).add(doc);
  return ref.get();
}

function getDateKey(date) {
  return formatISO(date, { representation: 'date' });
}

function computeScheduledIso(dateKey, publishHour = DEFAULT_PUBLISH_HOUR) {
  if (!dateKey) return null;
  const parts = dateKey.split('-').map((part) => Number(part));
  if (parts.length !== 3 || parts.some((value) => !Number.isFinite(value))) {
    return null;
  }
  const [year, month, day] = parts;
  const hour = Math.min(Math.max(publishHour, 0), 23);
  const scheduled = new Date(Date.UTC(year, month - 1, day, hour, 0, 0));
  return scheduled.toISOString();
}

function normalizePlanStart(startDate) {
  if (startDate instanceof Date && !Number.isNaN(startDate.getTime())) {
    return startOfDay(startDate);
  }
  if (typeof startDate === 'string') {
    const parsed = parseISO(startDate);
    if (!Number.isNaN(parsed.getTime())) return startOfDay(parsed);
  }
  return startOfDay(new Date());
}

export async function ensurePlanWindow({
  startDate,
  days = DEFAULT_PLAN_WINDOW_DAYS,
  language = 'es',
  focus = 'bodas',
  createdBy = 'automation',
} = {}) {
  const baseDate = normalizePlanStart(startDate);
  const windowDays = Math.max(7, Math.min(days, 366));
  const dateKeys = [];
  for (let i = 0; i < windowDays; i += 1) {
    dateKeys.push(getDateKey(addDays(baseDate, i)));
  }

  const snapshots = await Promise.all(
    dateKeys.map((key) => db.collection(BLOG_PLAN_COLLECTION).doc(key).get())
  );

  const missingKeys = dateKeys.filter((key, index) => !snapshots[index].exists);
  if (!missingKeys.length) {
    return { created: 0, source: null };
  }

  const plan = await generateDailyTopicPlan({
    startDate: baseDate,
    days: windowDays,
    language,
    focus,
  });
  const entriesMap = new Map(plan.entries.map((entry) => [entry.date, entry]));

  const batch = db.batch();
  let created = 0;
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  for (const key of missingKeys) {
    const entry = entriesMap.get(key);
    const docRef = db.collection(BLOG_PLAN_COLLECTION).doc(key);
    const languageCode = entry?.language || language;
    batch.set(
      docRef,
      {
        date: admin.firestore.Timestamp.fromDate(new Date(`${key}T00:00:00Z`)),
        dateKey: key,
        topic: entry?.topic || `Inspiración Lovenda ${key}`,
        angle: entry?.angle || '',
        keywords: entry?.keywords || [],
        tone:
          entry?.tone || (languageCode === 'en' ? 'warm human expert' : 'experto cercano y humano'),
        audience:
          entry?.audience || (languageCode === 'en' ? 'engaged couples' : 'parejas comprometidas'),
        language: languageCode,
        status: 'planned',
        planFocus: focus,
        source: plan.source || 'openai',
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy,
      },
      { merge: true }
    );
    created += 1;
  }

  if (created > 0) {
    await batch.commit();
  }

  return { created, source: plan.source || 'openai' };
}

async function claimPlanEntry({ startDate, lookaheadDays }) {
  const baseDate = normalizePlanStart(startDate);
  for (let offset = 0; offset <= lookaheadDays; offset += 1) {
    const dateKey = getDateKey(addDays(baseDate, offset));
    const docRef = db.collection(BLOG_PLAN_COLLECTION).doc(dateKey);
    try {
      const claimed = await db.runTransaction(async (tx) => {
        const snap = await tx.get(docRef);
        if (!snap.exists) return null;
        const data = snap.data();
        if (!['planned', 'failed'].includes(data.status || 'planned')) return null;
        tx.set(
          docRef,
          {
            status: 'generating',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastRunAt: admin.firestore.FieldValue.serverTimestamp(),
            error: admin.firestore.FieldValue.delete(),
          },
          { merge: true }
        );
        return { data };
      });
      if (claimed) {
        return { docRef, data: claimed.data };
      }
    } catch (error) {
      logger.warn('[blogAutomation] Failed to claim plan %s: %s', dateKey, error?.message || error);
    }
  }
  return null;
}

async function finalizePlanSuccess(docRef, { postId, scheduledAtIso, assets }) {
  const updates = {
    status: 'scheduled',
    postId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    automation: {
      articleSource: assets.aiArticle?.source || null,
      researchProvider: assets.researchData?.provider || null,
      coverStatus: assets.coverGeneration?.status || 'none',
      authorId: assets.authorProfile?.id || null,
    },
  };
  if (scheduledAtIso) {
    updates.scheduledAt = admin.firestore.Timestamp.fromDate(new Date(scheduledAtIso));
  }
  await docRef.set(updates, { merge: true });
}

async function finalizePlanFailure(docRef, error) {
  await docRef.set(
    {
      status: 'failed',
      error: error?.message || 'unknown-error',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function runBlogAutomationCycle({
  now = new Date(),
  planDays = DEFAULT_PLAN_WINDOW_DAYS,
  lookaheadDays = DEFAULT_LOOKAHEAD_DAYS,
  language = 'es',
  focus = 'bodas',
  publishHour = DEFAULT_PUBLISH_HOUR,
  postStatus = 'scheduled',
} = {}) {
  const ensureResult = await ensurePlanWindow({
    startDate: now,
    days: planDays,
    language,
    focus,
  }).catch((error) => {
    logger.error('[blogAutomation] ensurePlanWindow failed:', error?.message || error);
    return { created: 0, source: null, error: error?.message };
  });

  const claimed = await claimPlanEntry({ startDate: now, lookaheadDays });
  if (!claimed) {
    return {
      ensured: ensureResult?.created || 0,
      processed: 0,
      reason: 'no-plan-entry',
    };
  }

  const { docRef, data } = claimed;
  try {
    const generationInput = {
      topic: data.topic,
      tone: data.tone || 'inspirador',
      language: data.language || language,
      length: 'medio',
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
      audience: data.audience || undefined,
      includeTips: true,
      includeCTA: true,
    };

    const assets = await generateBlogAssets(generationInput);
    const scheduledIso =
      postStatus === 'scheduled' ? computeScheduledIso(docRef.id, publishHour) : null;

    const saved = await saveGeneratedBlogPost({
      input: { ...generationInput, authorId: assets.authorProfile?.id },
      aiArticle: assets.aiArticle,
      researchData: assets.researchData,
      researchSummary: assets.researchSummary,
      researchReferences: assets.researchReferences,
      coverGeneration: assets.coverGeneration,
      authorProfile: assets.authorProfile,
      authorPrompt: assets.authorPrompt,
      status: postStatus,
      scheduledAt: scheduledIso,
      createdBy: 'automation:worker',
      automationMeta: {
        planDate: docRef.id,
        planSource: data.source || 'auto',
        authorId: assets.authorProfile?.id || null,
      },
    });

    await finalizePlanSuccess(docRef, {
      postId: saved.id,
      scheduledAtIso: scheduledIso,
      assets,
    });

    return {
      ensured: ensureResult?.created || 0,
      processed: 1,
      planDate: docRef.id,
      postId: saved.id,
    };
  } catch (error) {
    logger.error(
      '[blogAutomation] Failed to generate article for %s: %s',
      docRef.id,
      error?.message || error
    );
    await finalizePlanFailure(docRef, error);
    return {
      ensured: ensureResult?.created || 0,
      processed: 0,
      planDate: docRef.id,
      error: error?.message || 'unknown-error',
    };
  }
}

export async function listPlanEntries({ startDate, limit = 30, status } = {}) {
  const baseDate = startDate ? normalizePlanStart(startDate) : startOfDay(new Date());
  let query = db
    .collection(BLOG_PLAN_COLLECTION)
    .where('date', '>=', admin.firestore.Timestamp.fromDate(baseDate))
    .orderBy('date', 'asc')
    .limit(Math.max(1, Math.min(limit, 120)));

  const snapshot = await query.get();
  let entries = snapshot.docs.map((doc) => {
    const data = doc.data() || {};
    return {
      id: doc.id,
      planDate: doc.id,
      status: data.status || 'planned',
      topic: data.topic || '',
      angle: data.angle || '',
      keywords: data.keywords || [],
      tone: data.tone || '',
      language: data.language || 'es',
      audience: data.audience || '',
      planFocus: data.planFocus || null,
      postId: data.postId || null,
      automation: data.automation || null,
      error: data.error || null,
      scheduledAt:
        data.scheduledAt instanceof admin.firestore.Timestamp
          ? data.scheduledAt.toDate().toISOString()
          : null,
      date:
        data.date instanceof admin.firestore.Timestamp ? data.date.toDate().toISOString() : null,
      createdAt:
        data.createdAt instanceof admin.firestore.Timestamp
          ? data.createdAt.toDate().toISOString()
          : null,
      updatedAt:
        data.updatedAt instanceof admin.firestore.Timestamp
          ? data.updatedAt.toDate().toISOString()
          : null,
    };
  });

  if (status && status !== 'all') {
    entries = entries.filter((entry) => entry.status === status);
  }

  return entries;
}

export async function ensureUniqueSlug(baseTitle, currentId = null) {
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
    if (snapshot.empty || snapshot.docs.every((doc) => !currentId || doc.id === currentId)) {
      return candidate;
    }
    attempts += 1;
    candidate = `${base}-${attempts + 1}`;
  }
  return `${base}-${Date.now()}`;
}

export function slugify(value = '') {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 80);
}
