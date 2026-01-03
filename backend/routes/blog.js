import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

function mapPost(post, targetLanguage) {
  const translations = post.translations || {};
  const translation =
    targetLanguage &&
    translations[targetLanguage] &&
    translations[targetLanguage].status === 'ready'
      ? translations[targetLanguage]
      : null;
  const baseContent = post.content || {};
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
    id: post.id,
    title: translation?.title || post.title || '',
    slug: post.slug || '',
    language: translation ? targetLanguage : post.language || 'es',
    originalLanguage: post.language || 'es',
    availableLanguages: post.availableLanguages || [post.language || 'es'],
    excerpt: translation?.excerpt || post.excerpt || '',
    content,
    coverImage: post.coverImage || null,
    tags:
      (translation?.tags && translation.tags.length ? translation.tags : null) || post.tags || [],
    byline: post.byline || null,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
  };
}

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 24);
    const languageRaw = typeof req.query.language === 'string' ? req.query.language.trim() : '';
    const language = languageRaw ? languageRaw.toLowerCase() : '';
    const cursorRaw = req.query.cursor;
    const authorRaw = typeof req.query.author === 'string' ? req.query.author.trim() : '';
    const authorId = authorRaw || '';

    const where = {
      status: 'published',
      publishedAt: { not: null },
    };

    if (cursorRaw) {
      const cursorDate = new Date(cursorRaw);
      if (!isNaN(cursorDate.getTime())) {
        where.publishedAt = { ...where.publishedAt, lt: cursorDate };
      }
    }

    if (language) {
      where.availableLanguages = { has: language };
    }

    let posts = await prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    if (authorId) {
      posts = posts.filter(post => post.byline?.id === authorId);
    }

    const mappedPosts = posts.map(post => mapPost(post, language));
    const nextCursor = mappedPosts.length === limit ? mappedPosts[mappedPosts.length - 1].publishedAt : null;

    res.json({ posts: mappedPosts, nextCursor });
  } catch (error) {
    console.error('[blog] Error fetching posts:', error);
    res.status(500).json({ error: 'blog-fetch-failed' });
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

    const post = await prisma.blogPost.findFirst({
      where: {
        slug,
        status: 'published',
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'not-found' });
    }

    res.json({ post: mapPost(post, requestedLanguageRaw || null) });
  } catch (error) {
    console.error('[blog] slug fetch failed:', error?.message || error);
    res.status(500).json({ error: 'blog-fetch-failed' });
  }
});

export default router;
