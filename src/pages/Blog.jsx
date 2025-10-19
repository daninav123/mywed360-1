import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import PageWrapper from '../components/PageWrapper';
import Spinner from '../components/Spinner';
import { BLOG_FALLBACK_POSTS } from '../data/blogFallback';
import { fetchWeddingNews } from '../services/blogService';
import { translateText } from '../services/translationService';

const MAX_LOOKAHEAD = 10;
const MAX_EMPTY_BATCHES = 2;
const MAX_FETCHES_PER_LOAD = 12;
const PER_DOMAIN_LIMIT = 3;

const normalizeLang = (lang) => String(lang || 'es').toLowerCase().match(/^[a-z]{2}/)?.[0] || 'es';

const parseBooleanFlag = (value, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return defaultValue;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return defaultValue;
};

const ENABLE_STATIC_FALLBACK = parseBooleanFlag(import.meta?.env?.VITE_BLOG_ENABLE_STATIC_FALLBACK, false);

const extractDomain = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (error) {
    return 'unknown';
  }
};

const hasHttpImage = (post) => {
  if (!post?.image) return false;
  try {
    const imageUrl = new URL(post.image);
    return imageUrl.protocol === 'http:' || imageUrl.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

const isValidArticle = (post) => Boolean(post && post.url && hasHttpImage(post));

const canUseEnglishFallback = () =>
  Boolean(import.meta?.env?.VITE_TRANSLATE_KEY || import.meta?.env?.VITE_ENABLE_EN_FALLBACK);

const ArticleCard = React.forwardRef(({ post }, ref) => {
  const published = post?.published ? new Date(post.published) : null;
  const handleOpen = useCallback(() => {
    if (!post?.url) return;
    window.open(post.url, '_blank', 'noopener,noreferrer');
  }, [post?.url]);

  const handleKeyDown = useCallback(
    (event) => {
      if (!post?.url) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        window.open(post.url, '_blank', 'noopener,noreferrer');
      }
    },
    [post?.url]
  );

  return (
    <article
      ref={ref}
      className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer"
      data-testid="blog-card"
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      role="link"
      tabIndex={0}
    >
      {post?.image ? (
        <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
      ) : null}
      <div className="p-4 space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">{post?.title}</h2>
        {post?.description ? (
          <p className="text-sm text-gray-700 line-clamp-3">{post.description}</p>
        ) : null}
        <div className="flex justify-between text-xs text-gray-500">
          <span>{post?.source}</span>
          {published ? <span>{published.toLocaleDateString()}</span> : null}
        </div>
        {post?.url ? (
          <span className="inline-flex text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]">
            Abrir artículo
          </span>
        ) : null}
      </div>
    </article>
  );
});

ArticleCard.displayName = 'ArticleCard';

function Blog() {
  const { i18n } = useTranslation();
  const lang = normalizeLang(i18n.language);

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const observerRef = useRef(null);
  const postsRef = useRef(posts);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  const disconnectObserver = () => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  };

  useEffect(
    () => () => {
      disconnectObserver();
    },
    []
  );

  const lastCardRef = useCallback(
    (node) => {
      if (loading || !hasMore) return;
      disconnectObserver();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore]
  );

  useEffect(() => {
    setPosts([]);
    postsRef.current = [];
    setPage(1);
    setHasMore(true);
    setError(null);
  }, [lang]);

  useEffect(() => {
    if (!hasMore && page > 1) return;

    let cancelled = false;

    const translateBatchIfNeeded = async (batch) => {
      if (!Array.isArray(batch) || lang === 'en') return batch;
      const translated = [];
      for (const rawPost of batch) {
        if (!rawPost) continue;
        const copy = { ...rawPost };
        if (copy.title) {
          copy.title = await translateText(copy.title, lang, '');
        }
        if (copy.description) {
          copy.description = await translateText(copy.description, lang, '');
        }
        translated.push(copy);
      }
      return translated;
    };

    const loadArticles = async () => {
      setLoading(true);
      setError(null);

      const basePosts = page === 1 ? [] : [...postsRef.current];
      const baselineLength = basePosts.length;
      const domainCounts = {};

      const windowStart = Math.floor(baselineLength / 10) * 10;
      for (let i = windowStart; i < basePosts.length; i += 1) {
        const domain = extractDomain(basePosts[i].url);
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      }

      const targetLength = Math.max(Math.ceil((baselineLength + 1) / 10) * 10, baselineLength + 4);

      let fetchPage = page;
      let consecutiveErrors = 0;
      let emptyBatches = 0;
      let fetches = 0;

      const tryConsumeBatch = (batch) => {
        if (!Array.isArray(batch) || batch.length === 0) {
          console.info('[Blog] Batch vacío o no válido');
          emptyBatches += 1;
          return;
        }
        emptyBatches = 0;

        batch.forEach((post) => {
          if (!isValidArticle(post)) {
            console.info('[Blog] Descartado artículo inválido', {
              hasUrl: Boolean(post?.url),
              hasImage: Boolean(post?.image),
            });
            return;
          }
          const isFallback = Boolean(post?.__fallback);
          if (
            !isFallback &&
            basePosts.some((item) => item.url === post.url || item.id === post.id)
          ) {
            console.info('[Blog] Descartado artículo duplicado', { url: post.url });
            return;
          }
          const domain = extractDomain(post.url);
          if (!isFallback && (domainCounts[domain] || 0) >= PER_DOMAIN_LIMIT) {
            console.info('[Blog] Descartado por límite de dominio', { domain });
            return;
          }
          if (!isFallback) {
            domainCounts[domain] = (domainCounts[domain] || 0) + 1;
          }
          basePosts.push(post);
        });

        console.info('[Blog] Total de artículos tras procesar batch', basePosts.length);
      };

      while (
        basePosts.length < targetLength &&
        fetchPage < page + MAX_LOOKAHEAD &&
        fetches < MAX_FETCHES_PER_LOAD &&
        emptyBatches <= MAX_EMPTY_BATCHES
      ) {
        try {
          const batch = await fetchWeddingNews(fetchPage, 50, lang);
          console.info('[Blog] fetchWeddingNews batch', {
            page: fetchPage,
            lang,
            size: Array.isArray(batch) ? batch.length : -1,
          });
          consecutiveErrors = 0;
          tryConsumeBatch(batch);
        } catch (err) {
          console.warn('[Blog] Error fetching news', err);
          consecutiveErrors += 1;
          if (consecutiveErrors >= 3) break;
        }
        fetchPage += 1;
        fetches += 1;
      }

      if (basePosts.length === baselineLength && lang !== 'en' && canUseEnglishFallback()) {
        let fallbackPage = 1;
        let fallbackFetches = 0;
        let fallbackEmpty = 0;
        while (
          basePosts.length < targetLength &&
          fallbackPage <= MAX_LOOKAHEAD &&
          fallbackFetches < MAX_FETCHES_PER_LOAD &&
          fallbackEmpty <= MAX_EMPTY_BATCHES
        ) {
          try {
            const batch = await fetchWeddingNews(fallbackPage, 50, 'en');
            const translatedBatch = await translateBatchIfNeeded(batch);
            console.info('[Blog] fetchWeddingNews fallback EN batch', {
              page: fallbackPage,
              size: Array.isArray(translatedBatch) ? translatedBatch.length : -1,
            });
            tryConsumeBatch(translatedBatch);
          } catch (err) {
            console.warn('[Blog] Error fetching EN fallback', err);
          }
          fallbackPage += 1;
          fallbackFetches += 1;
          if (basePosts.length === baselineLength) {
            fallbackEmpty += 1;
          } else {
            fallbackEmpty = 0;
          }
        }
      }

      if (basePosts.length === baselineLength && ENABLE_STATIC_FALLBACK) {
        console.info('[Blog] Injecting local fallback posts');
        const fallbackBatch = BLOG_FALLBACK_POSTS.map((entry, index) => ({
          ...entry,
          __fallback: true,
          id: entry.id || `local-fallback-${index}`,
        }));
        tryConsumeBatch(fallbackBatch);
      }

      if (cancelled) return;

      const added = basePosts.length - baselineLength;
      postsRef.current = basePosts;
      setPosts(basePosts);
      setHasMore(added > 0);
      setLoading(false);

      if (added === 0 && baselineLength === 0) {
        setError(
          'No encontramos artículos relevantes en este momento. Intenta cambiar de idioma o vuelve a intentarlo más tarde.'
        );
      }
    };

    loadArticles();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, lang, hasMore]);

  return (
    <PageWrapper title="Blog" className="max-w-5xl mx-auto">
      <p className="text-sm text-gray-600 mb-6">
        Descubre tendencias y artículos seleccionados de la industria de bodas. Haz clic en cualquier
        tarjeta para abrir la publicación original en una nueva pestaña.
      </p>

      <section className="grid gap-5 md:grid-cols-2">
        {posts.map((post, index) => (
          <ArticleCard
            key={post.url || post.id || index}
            post={post}
            ref={index === posts.length - 1 ? lastCardRef : null}
          />
        ))}
      </section>

      {!loading && posts.length === 0 && !error ? (
        <div className="border border-dashed border-gray-300 rounded-md p-6 text-center text-sm text-gray-500">
          No hay artículos disponibles todavía. Ajusta el idioma o vuelve más tarde.
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center mt-8" role="status" aria-label="Cargando artículos">
          <Spinner />
        </div>
      ) : null}
    </PageWrapper>
  );
}

export default Blog;
