import express from 'express';
import admin from 'firebase-admin';

import { db } from '../db.js';

const router = express.Router();
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
    return new Date(field).toISOString();
  }
  return null;
}

function mapDoc(doc, targetLanguage) {
  const data = doc.data() || {};
  const translations = data.translations || {};
  const translation =
    targetLanguage &&
    translations[targetLanguage] &&
    translations[targetLanguage].status === 'ready'
      ? translations[targetLanguage]
      : null;
  const baseContent = data.content || {};
  const translatedContent = translation?.content || null;
  const content = translatedContent
    ? {
        ...baseContent,
        ...translatedContent,
        references: translatedContent.references || baseContent.references || [],
      }
    : {
        ...baseContent,
        references: baseContent.references || [],
      };
  return {
    id: doc.id,
    title: translation?.title || data.title || '',
    slug: data.slug || '',
    language: translation ? targetLanguage : data.language || 'es',
    originalLanguage: data.language || 'es',
    availableLanguages: data.availableLanguages || [data.language || 'es'],
    excerpt: translation?.excerpt || data.excerpt || '',
    content,
    coverImage: data.coverImage || null,
    tags:
      (translation?.tags && translation.tags.length ? translation.tags : null) || data.tags || [],
    byline: data.byline || null,
    publishedAt: convertTimestamp(data.publishedAt),
  };
}

async function runFallbackQuery({ language, cursorRaw, limit, authorId }) {
  const fallbackSnapshot = await db
    .collection(BLOG_COLLECTION)
    .where('status', '==', 'published')
    .limit(200)
    .get();

  let posts = fallbackSnapshot.docs
    .map((doc) => mapDoc(doc, language))
    .filter((post) => post.publishedAt);

  if (language) {
    posts = posts.filter((post) =>
      (post.availableLanguages || [post.language || ''])
        .map((code) => code.toLowerCase())
        .includes(language)
    );
  }
  if (authorId) {
    posts = posts.filter((post) => (post.byline?.id || '') === authorId);
  }

  if (cursorRaw) {
    const cursorDate = new Date(cursorRaw);
    if (!Number.isNaN(cursorDate.getTime())) {
      posts = posts.filter((post) => {
        const publishedDate = new Date(post.publishedAt);
        return publishedDate < cursorDate;
      });
    }
  }

  posts.sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();
    return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA);
  });

  const pagePosts = posts.slice(0, limit);
  const nextCursor =
    pagePosts.length === limit ? pagePosts[pagePosts.length - 1].publishedAt || null : null;

  return { posts: pagePosts, nextCursor };
}

router.get('/', async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 24);
  const languageRaw = typeof req.query.language === 'string' ? req.query.language.trim() : '';
  const language = languageRaw ? languageRaw.toLowerCase() : '';
  const cursorRaw = req.query.cursor;
  const authorRaw = typeof req.query.author === 'string' ? req.query.author.trim() : '';
  const authorId = authorRaw || '';

  const baseQuery = db
    .collection(BLOG_COLLECTION)
    .where('status', '==', 'published')
    .orderBy('publishedAt', 'desc');

  const buildQuery = (withLanguage) => {
    let query = baseQuery;
    if (withLanguage && language) {
      query = query.where('availableLanguages', 'array-contains', language);
    }
    if (authorId) {
      query = query.where('byline.id', '==', authorId);
    }
    if (cursorRaw) {
      const cursorDate = new Date(cursorRaw);
      if (!Number.isNaN(cursorDate.getTime())) {
        const cursorTimestamp = admin.firestore.Timestamp.fromDate(cursorDate);
        query = query.where('publishedAt', '<', cursorTimestamp);
      }
    }
    return query.limit(limit);
  };

  try {
    const snapshot = await buildQuery(true).get();
    let posts = snapshot.docs
      .map((doc) => mapDoc(doc, language))
      .filter((post) => post.publishedAt);
    if (language && posts.length === 0) {
      const { posts: pagePosts, nextCursor } = await runFallbackQuery({
        language,
        cursorRaw,
        limit,
        authorId,
      });
      res.json({ posts: pagePosts, nextCursor, fallback: true, indexError: false });
      return;
    }
    const nextCursor = posts.length === limit ? posts[posts.length - 1].publishedAt || null : null;
    res.json({ posts, nextCursor });
    return;
  } catch (error) {
    const isIndexError =
      error?.code === 'failed-precondition' || error?.message?.includes('requires an index');
    console.warn('[blog] Query fallback activado. Motivo:', error?.message || error);

    try {
      const { posts: pagePosts, nextCursor } = await runFallbackQuery({
        language,
        cursorRaw,
        limit,
        authorId,
      });
      res.json({ posts: pagePosts, nextCursor, fallback: true, indexError: isIndexError });
      return;
    } catch (fallbackError) {
      console.error('[blog] Fallback query failed:', fallbackError?.message || fallbackError);
      res.status(500).json({ error: 'blog-fetch-failed' });
      return;
    }
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const requestedLanguageRaw =
      typeof req.query.language === 'string' ? req.query.language.trim().toLowerCase() : '';
    if (!slug) {
      return res.status(400).json({ error: 'missing-slug' });
    }
    const snapshot = await db
      .collection(BLOG_COLLECTION)
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();
    if (snapshot.empty) {
      return res.status(404).json({ error: 'not-found' });
    }
    const doc = snapshot.docs[0];
    res.json({ post: mapDoc(doc, requestedLanguageRaw || null) });
  } catch (error) {
    console.error('[blog] slug fetch failed:', error?.message || error);
    res.status(500).json({ error: 'blog-fetch-failed' });
  }
});

export default router;
