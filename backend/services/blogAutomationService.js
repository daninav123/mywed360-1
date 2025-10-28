import admin from 'firebase-admin';

import logger from '../logger.js';
import { db } from '../db.js';
import {
  computeDefaultTags,
  ensureExcerpt,
  generateBlogArticle,
  generateCoverImageFromPrompt,
} from './blogAiService.js';
import { researchTopic } from './blogResearchService.js';

const BLOG_COLLECTION = 'blogPosts';

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

  const aiArticle = await generateBlogArticle({
    ...input,
    research: {
      summary: researchSummary,
      references: researchReferences,
    },
  });

  let coverGeneration = null;
  if (aiArticle.coverPrompt) {
    try {
      coverGeneration = await generateCoverImageFromPrompt(aiArticle.coverPrompt, {
        size: process.env.BLOG_COVER_IMAGE_SIZE || '1792x1024',
        quality: process.env.BLOG_COVER_IMAGE_QUALITY || 'hd',
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
    researchSummary,
    researchReferences,
    aiArticle,
    coverGeneration,
  };
}

function applyCoverImage(aiArticle, coverGeneration, timestamp) {
  if (!aiArticle.coverPrompt) return null;

  const coverImage = {
    prompt: aiArticle.coverPrompt,
    status: 'pending',
    url: null,
    provider: aiArticle.source || 'openai',
  };

  if (!coverGeneration) return coverImage;

  coverImage.status = coverGeneration.status || coverImage.status;
  coverImage.url = coverGeneration.url || null;
  coverImage.provider = coverGeneration.provider || coverImage.provider;

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

  const doc = {
    title: aiArticle.title,
    slug: await ensureUniqueSlug(aiArticle.title),
    language: input.language || 'es',
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
    tags:
      aiArticle.tags && aiArticle.tags.length
        ? aiArticle.tags
        : computeDefaultTags(input.keywords, aiArticle.sections),
    coverImage,
    prompt: {
      input,
      source: aiArticle.source || 'openai',
      raw: aiArticle.raw,
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
      ...automationMeta,
    },
    metrics: {
      views: 0,
      shares: 0,
    },
  };

  const ref = await db.collection(BLOG_COLLECTION).add(doc);
  return ref.get();
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
