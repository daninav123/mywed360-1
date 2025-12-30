import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import PageWrapper from '../components/PageWrapper';
import Spinner from '../components/Spinner';
import { formatDate } from '../utils/formatUtils';
import { fetchBlogPosts } from '../services/blogContentService';
import useTranslations from '../hooks/useTranslations';

const PAGE_SIZE = 12;

const ArticleCard = React.forwardRef(({ post, onOpen, onOpenAuthor, ctaLabel }, ref) => {
  const published = post?.publishedAt ? new Date(post.publishedAt) : null;
  const coverUrl = post?.coverImage?.url || post?.coverImage?.placeholder || null;
  const handleAuthorClick = (event) => {
    event.stopPropagation();
    const authorSlug = post?.byline?.slug || post?.byline?.id;
    if (!authorSlug) return;
    onOpenAuthor?.(authorSlug);
  };

  return (
    <article
      ref={ref}
      className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] cursor-pointer flex flex-col"
      data-testid="blog-card"
      onClick={() => onOpen?.(post)}
      role="link"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen?.(post);
        }
      }}
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={post?.coverImage?.alt || post?.title}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
      ) : null}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">{post?.title}</h2>
          {post?.excerpt ? (
            <p className="text-sm text-gray-700 line-clamp-3">{post.excerpt}</p>
          ) : null}
          {post?.byline?.name ? (
            <button
              type="button"
              onClick={handleAuthorClick}
              className="text-xs font-medium text-[color:var(--color-primary)] hover:text-[color:var(--color-primary-dark)] focus:outline-none"
            >
              Por {post.byline.name}
              {post.byline.title ? ` · ${post.byline.title}` : ''}
            </button>
          ) : null}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <span>{published ? formatDate(published, 'short') : '—'}</span>
          <div className="flex flex-wrap gap-1">
            {(post?.tags || []).slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <span className="inline-flex text-sm text-[color:var(--color-primary)] hover:text-[color:var(--color-primary-dark)]">
          {ctaLabel}
        </span>
      </div>
    </article>
  );
});

ArticleCard.displayName = 'ArticleCard';

function Blog() {
  const { t, i18n } = useTranslations();
  const navigate = useNavigate();

  const normalizedLang = useMemo(() => {
    const lang = i18n.language || 'es';
    const match = String(lang)
      .toLowerCase()
      .match(/^[a-z]{2}/);
    return match ? match[0] : 'es';
  }, [i18n.language]);

  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [errorKey, setErrorKey] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const observerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setLoading(true);
      setErrorKey(null);
      setHasMore(true);
      setNextCursor(null);
      setPosts([]);

      try {
        const response = await fetchBlogPosts({ language: normalizedLang, limit: PAGE_SIZE });
        if (cancelled) return;

        const newPosts = response?.posts || [];
        setPosts(newPosts);
        setNextCursor(response?.nextCursor || null);
        setHasMore(Boolean(response?.nextCursor));

        if (!newPosts.length) {
          setErrorKey('common.blog.errors.nonePublished');
        }
      } catch (err) {
        if (cancelled) return;
        // console.error('[Blog] load initial failed', err);
        setErrorKey('common.blog.errors.loadFailed');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInitial();

    return () => {
      cancelled = true;
    };
  }, [normalizedLang]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !nextCursor) return;
    setLoading(true);
    try {
      const response = await fetchBlogPosts({
        language: normalizedLang,
        limit: PAGE_SIZE,
        cursor: nextCursor,
      });
      const newPosts = response?.posts || [];
      setPosts((prev) => [...prev, ...newPosts]);
      setNextCursor(response?.nextCursor || null);
      setHasMore(Boolean(response?.nextCursor));
    } catch (err) {
      // console.error('[Blog] load more failed', err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, nextCursor, normalizedLang]);

  const isFiltering = useMemo(() => Boolean(searchTerm.trim()), [searchTerm]);

  const visiblePosts = useMemo(() => {
    if (!isFiltering) return posts;
    const query = searchTerm.trim().toLowerCase();
    return posts.filter((post) => {
      const corpus = [
        post?.title,
        post?.excerpt,
        (post?.tags || []).join(' '),
        post?.content?.markdown,
        post?.research?.summary,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return corpus.includes(query);
    });
  }, [isFiltering, posts, searchTerm]);

  const lastCardRef = useCallback(
    (node) => {
      if (loading || isFiltering) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isFiltering, loadMore, loading]
  );

  const handleOpenPost = useCallback(
    (post) => {
      if (!post?.slug) return;
      navigate(`/blog/${post.slug}`);
    },
    [navigate]
  );

  const handleOpenAuthor = useCallback(
    (slugValue) => {
      if (!slugValue) return;
      navigate(`/blog/autor/${slugValue}`);
    },
    [navigate]
  );

  const searchQuery = searchTerm.trim();

  return (
    <PageWrapper title={t('blog.title')} className="max-w-5xl mx-auto">
      <p className="text-sm text-gray-600 mb-6">{t('blog.lead')}</p>

      <div className="mb-6 rounded-2xl border border-[color:var(--color-primary-20)] bg-[var(--color-primary-5)] p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-[color:var(--color-primary)] mb-2">
              ¿Listo para organizar tu boda perfecta?
            </h2>
            <p className="text-sm text-gray-700">
              Únete a miles de parejas que ya están disfrutando de una planificación sin estrés con Lovenda.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/signup"
              className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
            >
              🎉 Registrarse Gratis
            </a>
            <a
              href="/precios"
              className="inline-flex items-center justify-center rounded-md border border-[color:var(--color-primary)] px-4 py-2 text-sm font-semibold text-[color:var(--color-primary)] transition hover:bg-[var(--color-primary-10)]"
            >
              Ver Planes
            </a>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="blog-search" className="sr-only">
          {t('blog.search.label')}
        </label>
        <input
          id="blog-search"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={t('blog.searchPlaceholder', { placeholder: 'Buscar en el blog...' })}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
        />
        {isFiltering ? (
          <p className="mt-2 text-xs text-gray-500">
            {t('blog.search.matches', { query: searchQuery })}
          </p>
        ) : null}
      </div>

      {errorKey ? (
        <div className="mb-6 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {t(errorKey)}
        </div>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2">
        {visiblePosts.map((post, index) => (
          <ArticleCard
            key={post.id || post.slug || index}
            post={post}
            onOpen={handleOpenPost}
            onOpenAuthor={handleOpenAuthor}
            ctaLabel={t('blog.card.viewDetails')}
            ref={!isFiltering && index === visiblePosts.length - 1 ? lastCardRef : null}
          />
        ))}
      </section>

      {!loading && visiblePosts.length === 0 && !errorKey ? (
        <div className="border border-dashed border-gray-300 rounded-md p-6 text-center text-sm text-gray-500">
          {isFiltering ? t('blog.empty.filtered') : t('blog.empty.all')}
        </div>
      ) : null}

      {loading ? (
        <div
          className="flex justify-center mt-8"
          role="status"
          aria-label={t('blog.loadingAria')}
        >
          <Spinner />
        </div>
      ) : null}

      {!loading && visiblePosts.length > 0 ? (
        <div className="mt-12 rounded-2xl border border-gray-200 bg-gradient-to-br from-rose-50 to-purple-50 p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            ✨ Descubre Lovenda
          </h3>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            La plataforma completa para organizar bodas. Gestiona invitados, proveedores, presupuesto y más en un solo lugar.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="/signup"
              className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-6 py-3 text-base font-semibold text-white shadow-md transition hover:brightness-95"
            >
              🚀 Empezar Gratis
            </a>
            <a
              href="/para-planners"
              className="inline-flex items-center justify-center rounded-md border-2 border-[color:var(--color-primary)] bg-white px-6 py-3 text-base font-semibold text-[color:var(--color-primary)] transition hover:bg-[var(--color-primary-5)]"
            >
              Para Wedding Planners
            </a>
            <a
              href="/para-proveedores"
              className="inline-flex items-center justify-center rounded-md border-2 border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Para Proveedores
            </a>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-300">
            <p className="text-xs text-gray-600 mb-2">Enlaces útiles:</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/" className="text-sm text-[color:var(--color-primary)] hover:underline">Inicio</a>
              <a href="/precios" className="text-sm text-[color:var(--color-primary)] hover:underline">Precios</a>
              <a href="/app" className="text-sm text-[color:var(--color-primary)] hover:underline">Acceder</a>
              <a href="/partners" className="text-sm text-[color:var(--color-primary)] hover:underline">Partners</a>
            </div>
          </div>
        </div>
      ) : null}
    </PageWrapper>
  );
}

export default Blog;
