import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';

import PageWrapper from '../components/PageWrapper';
import Spinner from '../components/Spinner';
import { formatDate } from '../utils/formatUtils';
import { fetchBlogPostBySlug, fetchBlogPosts } from '../services/blogContentService';
import useTranslations from '../hooks/useTranslations';
import { listBlogAuthors } from '../utils/blogAuthors';

function parseMarkdown(markdown = '') {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let paragraph = [];
  let list = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'p', text: paragraph.join(' ') });
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list && list.length) {
      blocks.push({ type: 'ul', items: list });
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h3', text: line.slice(4).trim() });
      continue;
    }
    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h2', text: line.slice(3).trim() });
      continue;
    }
    if (line.startsWith('- ')) {
      flushParagraph();
      if (!list) list = [];
      list.push(line.slice(2).trim());
      continue;
    }
    if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'quote', text: line.slice(2).trim() });
      continue;
    }
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

const MarkdownRenderer = ({ markdown }) => {
  const blocks = useMemo(() => parseMarkdown(markdown), [markdown]);
  if (!blocks.length) return null;
  return (
    <div className="space-y-5 leading-relaxed text-gray-800">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case 'h2':
            return (
              <h2 key={key} className="text-2xl font-semibold text-gray-900">
                {block.text}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={key} className="text-xl font-semibold text-gray-900">
                {block.text}
              </h3>
            );
          case 'ul':
            return (
              <ul key={key} className="list-disc space-y-2 pl-5">
                {block.items.map((item, idx) => (
                  <li key={`${key}-item-${idx}`} className="text-gray-700">
                    {item}
                  </li>
                ))}
              </ul>
            );
          case 'quote':
            return (
              <blockquote
                key={key}
                className="border-l-4 border-indigo-200 bg-indigo-50/60 px-4 py-2 italic text-gray-700"
              >
                {block.text}
              </blockquote>
            );
          default:
            return (
              <p key={key} className="text-gray-700">
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
};

const BlogPost = () => {
  const { slug } = useParams();
  const { t, i18n } = useTranslations();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const normalizedLanguage = useMemo(() => {
    const lang = i18n.language || 'es';
    const match = String(lang)
      .toLowerCase()
      .match(/^[a-z]{2}/);
    return match ? match[0] : 'es';
  }, [i18n.language]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchBlogPostBySlug(slug, { language: normalizedLanguage });
        if (cancelled) return;
        setPost(response?.post || null);
        if (!response?.post) {
          setError(
            t('common.blog.post.errors.notFound', {
              defaultValue:
                'No hemos encontrado este artículo. Comprueba que el enlace es correcto.',
            })
          );
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[BlogPost] fetch failed', err);
        setError(
          t('common.blog.post.errors.loadFailed', {
            defaultValue: 'No se pudo cargar el contenido. Inténtalo de nuevo más tarde.',
          })
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug, normalizedLanguage, t]);

  const publishedAt = useMemo(() => {
    if (!post?.publishedAt) return null;
    const date = new Date(post.publishedAt);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [post]);

  useEffect(() => {
    let cancelled = false;
    async function loadRelated() {
      if (!post) {
        setRelatedPosts([]);
        setLoadingRelated(false);
        return;
      }
      setLoadingRelated(true);
      const usedSlugs = new Set([post.slug]);
      const pool = [];
      const pushCandidate = (candidate) => {
        if (!candidate?.slug || usedSlugs.has(candidate.slug)) return;
        usedSlugs.add(candidate.slug);
        pool.push(candidate);
      };
      try {
        const baseOptions = { language: normalizedLanguage, limit: 12 };
        const queries = [];
        if (post.byline?.id) {
          queries.push({ ...baseOptions, authorId: post.byline.id });
        }
        queries.push(baseOptions);

        for (const options of queries) {
          const response = await fetchBlogPosts(options);
          if (cancelled) return;
          (response?.posts || []).forEach(pushCandidate);
          if (pool.length >= 8) break;
        }

        const postTags = (post.tags || []).map((tag) => String(tag).toLowerCase());
        const score = (candidate) => {
          const candidateTags = (candidate.tags || []).map((tag) => String(tag).toLowerCase());
          const sharedTags = candidateTags.filter((tag) => postTags.includes(tag)).length;
          const sameAuthor =
            candidate.byline?.id && candidate.byline.id === post.byline?.id ? 1 : 0;
          return sharedTags * 2 + sameAuthor;
        };
        pool.sort((a, b) => {
          const scoreDiff = score(b) - score(a);
          if (scoreDiff !== 0) return scoreDiff;
          const dateA = new Date(a.publishedAt || 0).getTime();
          const dateB = new Date(b.publishedAt || 0).getTime();
          return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA);
        });
        if (!cancelled) {
          setRelatedPosts(pool.filter((item) => item.slug !== post.slug).slice(0, 3));
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[BlogPost] related fetch failed', err);
          setRelatedPosts([]);
        }
      } finally {
        if (!cancelled) setLoadingRelated(false);
      }
    }
    loadRelated();
    return () => {
      cancelled = true;
    };
  }, [post, normalizedLanguage]);

  const references = useMemo(() => {
    if (!post?.content?.references) return [];
    return post.content.references.filter((ref) => ref && (ref.title || ref.url));
  }, [post]);

  const authorProfile = useMemo(() => {
    if (!post?.byline?.id) return null;
    return listBlogAuthors().find((profile) => profile.id === post.byline.id) || null;
  }, [post]);

  const pageTitle = post?.title
    ? `${post.title} | Lovenda Blog`
    : t('common.blog.title', { defaultValue: 'Blog' });
  const metaDescription =
    post?.excerpt ||
    t('common.blog.lead', {
      defaultValue:
        'Descubre tendencias, guías y consejos para organizar tu boda con la ayuda del equipo Lovenda.',
    });
  const canonicalUrl = `/blog/${slug}`;
  const ctaCopy = {
    title: t('common.blog.post.cta.title', { defaultValue: 'Organiza tu boda con Lovenda' }),
    description: t('common.blog.post.cta.description', {
      defaultValue:
        'Centraliza tareas, proveedores y comunicación con la plataforma que usamos para crear estas historias.',
    }),
    primary: t('common.blog.post.cta.primary', { defaultValue: 'Solicitar demo gratis' }),
    secondary: t('common.blog.post.cta.secondary', { defaultValue: 'Descubrir la app' }),
  };
  const referencesTitle = t('common.blog.post.references.title', {
    defaultValue: 'Fuentes consultadas',
  });
  const relatedTitle = t('common.blog.post.related.title', {
    defaultValue: 'También te puede interesar',
  });
  const canonicalHref =
    typeof window !== 'undefined'
      ? `${window.location.origin}${canonicalUrl}`
      : `https://malove.app${canonicalUrl}`;
  const coverImage = post?.coverImage?.url || null;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalHref} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalHref} />
        <meta property="og:type" content="article" />
        {coverImage ? <meta property="og:image" content={coverImage} /> : null}
      </Helmet>
      <PageWrapper
        title={
          post?.title || t('common.blog.post.fallbackTitle', { defaultValue: 'Artículo del blog' })
        }
        className="max-w-3xl mx-auto"
      >
        <div className="mb-6">
          <Link
            to="/blog"
            className="text-sm text-[var(--color-primary,#6366f1)] hover:text-[var(--color-primary-dark,#4f46e5)]"
          >
            ← Volver al blog
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {error}
          </div>
        ) : null}

        {!loading && post ? (
          <article className="space-y-6">
            <header className="space-y-3">
              <h1 className="text-3xl font-semibold text-gray-900">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {post?.byline?.name ? (
                  <Link
                    to={`/blog/autor/${post.byline.slug || post.byline.id}`}
                    className="text-[var(--color-primary,#6366f1)] hover:text-[var(--color-primary-dark,#4f46e5)]"
                  >
                    Por <span className="font-semibold text-gray-900">{post.byline.name}</span>
                    {post.byline.title ? ` · ${post.byline.title}` : ''}
                  </Link>
                ) : null}
                {publishedAt ? (
                  <span className="text-gray-500">
                    Publicado el {formatDate(publishedAt, 'long')}
                  </span>
                ) : null}
                <div className="flex flex-wrap gap-2 text-gray-500">
                  {(post.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </header>

            {post.coverImage?.url ? (
              <img
                src={post.coverImage.url}
                alt={post.coverImage.alt || post.title}
                className="w-full rounded-lg object-cover"
              />
            ) : null}

            {post.excerpt ? (
              <p className="text-lg text-gray-700 font-medium">{post.excerpt}</p>
            ) : null}
            {post?.byline?.signature ? (
              <p className="text-sm italic text-gray-500">{post.byline.signature}</p>
            ) : null}

            <MarkdownRenderer markdown={post.content?.markdown || ''} />

            <section className="rounded-2xl border border-[var(--color-primary,#6366f1)]/20 bg-[var(--color-primary,#6366f1)]/5 p-6 space-y-3">
              <h2 className="text-xl font-semibold text-[var(--color-primary,#6366f1)]">
                {ctaCopy.title}
              </h2>
              <p className="text-sm text-gray-700">{ctaCopy.description}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary,#6366f1)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
                >
                  {ctaCopy.primary}
                </Link>
                <Link
                  to="/app"
                  className="inline-flex items-center justify-center rounded-md border border-[var(--color-primary,#6366f1)] px-5 py-2.5 text-sm font-semibold text-[var(--color-primary,#6366f1)] transition hover:bg-[var(--color-primary,#6366f1)]/10"
                >
                  {ctaCopy.secondary}
                </Link>
              </div>
            </section>

            {references.length ? (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">{referencesTitle}</h2>
                <ul className="space-y-2 text-sm text-gray-600">
                  {references.map((ref, index) => (
                    <li key={`${ref.url || ref.title}-${index}`} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-primary,#6366f1)]" />
                      {ref.url ? (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--color-primary,#6366f1)] hover:text-[var(--color-primary-dark,#4f46e5)]"
                        >
                          {ref.title || ref.url}
                        </a>
                      ) : (
                        <span>{ref.title}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {authorProfile?.bio ? (
              <section className="flex gap-4 rounded-2xl border border-soft bg-surface p-4">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-soft bg-gradient-to-br from-indigo-200 to-pink-200">
                  {authorProfile.avatar ? (
                    <img
                      src={authorProfile.avatar}
                      alt={authorProfile.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900">{authorProfile.name}</p>
                  {authorProfile.title ? (
                    <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
                      {authorProfile.title}
                    </p>
                  ) : null}
                  <p className="text-sm text-gray-600">{authorProfile.bio}</p>
                  <Link
                    to={`/blog/autor/${authorProfile.slug}`}
                    className="inline-flex text-sm font-medium text-[var(--color-primary,#6366f1)] hover:text-[var(--color-primary-dark,#4f46e5)]"
                  >
                    {t('common.blog.author.viewAll', { defaultValue: 'Ver artículos del autor' })}
                  </Link>
                </div>
              </section>
            ) : null}
          </article>
        ) : null}
        {loadingRelated ? (
          <div className="mt-10 flex justify-center">
            <Spinner />
          </div>
        ) : relatedPosts.length ? (
          <section className="mt-12 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">{relatedTitle}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedPosts.map((item) => (
                <Link
                  key={item.slug}
                  to={`/blog/${item.slug}`}
                  className="rounded-lg border border-soft bg-white p-4 shadow-sm transition hover:border-[var(--color-primary,#6366f1)] hover:shadow"
                >
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2">{item.title}</p>
                  {item.publishedAt ? (
                    <p className="mt-2 text-xs text-gray-500">
                      {formatDate(new Date(item.publishedAt), 'short')}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </PageWrapper>
    </>
  );
};

export default BlogPost;
