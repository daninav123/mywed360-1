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

function mapDoc(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    title: data.title || '',
    slug: data.slug || '',
    language: data.language || 'es',
    excerpt: data.excerpt || '',
    content: data.content || {},
    coverImage: data.coverImage || null,
    tags: data.tags || [],
    publishedAt: convertTimestamp(data.publishedAt),
  };
}

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 24);
    const language = req.query.language;
    const cursor = req.query.cursor;

    let query = db
      .collection(BLOG_COLLECTION)
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc');

    if (language) {
      query = query.where('language', '==', language);
    }

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!Number.isNaN(cursorDate.getTime())) {
        const cursorTimestamp = admin.firestore.Timestamp.fromDate(cursorDate);
        query = query.where('publishedAt', '<', cursorTimestamp).orderBy('publishedAt', 'desc');
      }
    }

    const snapshot = await query.limit(limit).get();
    const posts = snapshot.docs.map(mapDoc).filter((post) => post.publishedAt);
    const nextCursor =
      posts.length === limit ? posts[posts.length - 1].publishedAt || null : null;

    res.json({ posts, nextCursor });
  } catch (error) {
    console.error('[blog] list failed:', error?.message || error);
    res.status(500).json({ error: 'blog-fetch-failed' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
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
    res.json({ post: mapDoc(doc) });
  } catch (error) {
    console.error('[blog] slug fetch failed:', error?.message || error);
    res.status(500).json({ error: 'blog-fetch-failed' });
  }
});

export default router;

