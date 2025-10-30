import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
    if (!post?.byline?.slug) return;
    onOpenAuthor?.(post);
  };

  return (
    <article
      ref={ref}
      className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#6366f1)] cursor-pointer flex flex-col"
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
              className="text-xs font-medium text-[var(--color-primary,#6366f1)] hover:text-[var(--color-primary-dark,#4f46e5)] focus:outline-none"
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
        <span className="inline-flex text-sm text-[var(--color-primary,#6366f1)] hover:text-[var(--color-primary-dark,#4f46e5)]">
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
        console.error('[Blog] load initial failed', err);
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
      console.error('[Blog] load more failed', err);
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
    (post) => {
      if (!post?.byline?.slug) return;
      navigate(`/blog/autor/${post.byline.slug}`);
    },
    [navigate]
  );

  const searchQuery = searchTerm.trim();

  return (
    <PageWrapper title={t('common.blog.title')} className="max-w-5xl mx-auto">
      <p className="text-sm text-gray-600 mb-6">{t('common.blog.lead')}</p>

      <div className="mb-6">
        <label htmlFor="blog-search" className="sr-only">
          {t('common.blog.search.label')}
        </label>
        <input
          id="blog-search"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={t('common.blog.search.placeholder')}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#6366f1)]"
        />
        {isFiltering ? (
          <p className="mt-2 text-xs text-gray-500">
            {t('common.blog.search.matches', { query: searchQuery })}
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
            ctaLabel={t('common.blog.card.viewDetails')}
            ref={!isFiltering && index === visiblePosts.length - 1 ? lastCardRef : null}
          />
        ))}
      </section>

      {!loading && visiblePosts.length === 0 && !errorKey ? (
        <div className="border border-dashed border-gray-300 rounded-md p-6 text-center text-sm text-gray-500">
          {isFiltering ? t('common.blog.empty.filtered') : t('common.blog.empty.all')}
        </div>
      ) : null}

      {loading ? (
        <div
          className="flex justify-center mt-8"
          role="status"
          aria-label={t('common.blog.loadingAria')}
        >
          <Spinner />
        </div>
      ) : null}
    </PageWrapper>
  );
}

export default Blog;
