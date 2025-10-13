import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import PageWrapper from '../components/PageWrapper';
import Spinner from '../components/Spinner';
import { fetchWeddingNews } from '../services/blogService';

const MAX_LOOKAHEAD = 10;
const MAX_EMPTY_BATCHES = 2;
const MAX_FETCHES_PER_LOAD = 12;
const PER_DOMAIN_LIMIT = 3;

const normalizeLang = (lang) => String(lang || 'es').toLowerCase().match(/^[a-z]{2}/)?.[0] || 'es';

const extractDomain = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (error) {
    return 'unknown';
  }
};

const isValidArticle = (post) => Boolean(post && post.url);

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
          emptyBatches += 1;
          return;
        }
        emptyBatches = 0;

        batch.forEach((post) => {
          if (!isValidArticle(post)) return;
          if (basePosts.some((item) => item.url === post.url || item.id === post.id)) return;
          const domain = extractDomain(post.url);
          if ((domainCounts[domain] || 0) >= PER_DOMAIN_LIMIT) return;
          domainCounts[domain] = (domainCounts[domain] || 0) + 1;
          basePosts.push(post);
        });
      };

      while (
        basePosts.length < targetLength &&
        fetchPage < page + MAX_LOOKAHEAD &&
        fetches < MAX_FETCHES_PER_LOAD &&
        emptyBatches <= MAX_EMPTY_BATCHES
      ) {
        try {
          const batch = await fetchWeddingNews(fetchPage, 50, lang);
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
            tryConsumeBatch(batch);
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
