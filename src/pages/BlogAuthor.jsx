import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';

import PageWrapper from '../components/PageWrapper';
import Spinner from '../components/Spinner';
import { formatDate } from '../utils/formatUtils';
import { fetchBlogPosts } from '../services/blogContentService';
import { getBlogAuthorBySlug, listBlogAuthors } from '../utils/blogAuthors';
import useTranslations from '../hooks/useTranslations';

const AuthorPostCard = ({ post, onOpen }) => {
  const published = post?.publishedAt ? new Date(post.publishedAt) : null;
  return (
    <article
      className="border rounded-lg bg-white shadow-sm hover:shadow-md transition cursor-pointer flex flex-col overflow-hidden"
      onClick={() => onOpen?.(post)}
    >
      {post?.coverImage?.url ? (
        <img
          src={post.coverImage.url}
          alt={post.coverImage.alt || post.title}
          className="h-44 w-full object-cover"
          loading="lazy"
        />
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">{post?.title}</h3>
          {post?.excerpt ? (
            <p className="text-sm text-gray-700 line-clamp-3">{post.excerpt}</p>
          ) : null}
        </div>
        <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
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
      </div>
    </article>
  );
};

const BlogAuthor = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { i18n, t } = useTranslations();

  const normalizedLang = useMemo(() => {
    const lang = i18n.language || 'es';
    const match = String(lang)
      .toLowerCase()
      .match(/^[a-z]{2}/);
    return match ? match[0] : 'es';
  }, [i18n.language]);

  const author = useMemo(() => getBlogAuthorBySlug(slug), [slug]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancel = false;
    async function load() {
      if (!author) {
        setLoading(false);
        setError('common.blog.author.errors.notFound');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetchBlogPosts({
          language: normalizedLang,
          limit: 24,
          authorId: author.id,
        });
        if (cancel) return;
        setPosts(response?.posts || []);
        if (!response?.posts?.length) {
          setError('common.blog.author.errors.noArticles');
        }
      } catch (err) {
        if (cancel) return;
        // console.error('[BlogAuthor] load failed', err);
        setError('common.blog.author.errors.loadFailed');
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [author, normalizedLang]);

  const handleOpenPost = (post) => {
    if (!post?.slug) return;
    navigate(`/blog/${post.slug}`);
  };

  const otherAuthors = useMemo(() => {
    const profiles = listBlogAuthors();
    if (!author) return profiles;
    return profiles.filter((profile) => profile.id !== author.id).slice(0, 3);
  }, [author]);

  const pageTitle = author
    ? `${author.name} | Equipo editorial Lovenda`
    : t('blog.author.pageTitle', { defaultValue: 'Autor del blog' });
  const metaDescription =
    author?.bio ||
    author?.signature ||
    t('blog.lead', {
      defaultValue:
        'Descubre tendencias, guías y consejos para organizar tu boda con la ayuda del equipo Lovenda.',
    });
  const canonicalHref =
    typeof window !== 'undefined'
      ? `${window.location.origin}/blog/autor/${slug}`
      : `https://malove.app/blog/autor/${slug}`;
  const authorAvatar = author?.avatar || null;
  const authorLd = useMemo(() => {
    if (!author) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: author.name,
      description: author.bio || author.signature || undefined,
      jobTitle: author.title || undefined,
      url: canonicalHref,
      image: authorAvatar || undefined,
    };
  }, [author, canonicalHref, authorAvatar]);

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalHref} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalHref} />
        <meta property="og:type" content="profile" />
        {authorAvatar ? <meta property="og:image" content={authorAvatar} /> : null}
        {authorLd ? <script type="application/ld+json">{JSON.stringify(authorLd)}</script> : null}
      </Helmet>
      <PageWrapper
        title={
          author
            ? author.name
            : t('blog.author.pageTitle', { defaultValue: 'Autor del blog' })
        }
        className="max-w-5xl mx-auto"
      >
        <div className="mb-6">
          <Link
            to="/blog"
            className="text-sm text-[var(--color-primary,#6366f1)] hover:text-[var(--color-primary-dark,#4f46e5)]"
          >
            ← {t('blog.author.backToBlog', { defaultValue: 'Volver al blog' })}
          </Link>
        </div>

        {!author ? (
          <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {t(error || 'common.blog.author.errors.notFound', {
              defaultValue: 'No encontramos a esta persona en nuestro equipo editorial.',
            })}
          </div>
        ) : (
          <>
            <header className="flex flex-col gap-4 rounded-2xl border border-soft bg-white p-6 shadow-sm md:flex-row md:items-center">
              <div className="flex-shrink-0">
                <div className="h-24 w-24 overflow-hidden rounded-full border border-soft bg-gradient-to-br from-indigo-200 to-pink-200">
                  {authorAvatar ? (
                    <img
                      src={authorAvatar}
                      alt={author.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-sm uppercase tracking-widest text-[var(--color-primary,#6366f1)]">
                    {t('blog.author.badge', { defaultValue: 'Equipo editorial Lovenda' })}
                  </p>
                  <h1 className="text-2xl font-semibold text-gray-900">{author.name}</h1>
                  {author.title ? (
                    <p className="text-sm font-medium text-gray-600">{author.title}</p>
                  ) : null}
                </div>
                {author.signature ? (
                  <p className="text-sm italic text-gray-600">{author.signature}</p>
                ) : null}
                {author.bio ? <p className="text-base text-gray-700">{author.bio}</p> : null}
                {author.social && Object.keys(author.social).length ? (
                  <div className="flex flex-wrap gap-3 text-sm text-[var(--color-primary,#6366f1)]">
                    {Object.entries(author.social).map(([network, url]) => (
                      <a
                        key={network}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-[var(--color-primary-dark,#4f46e5)]"
                      >
                        {t(`common.blog.author.social.${network}`, { defaultValue: network })}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </header>

            <section className="mt-10 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('blog.author.latestArticles', { defaultValue: 'Artículos recientes' })}
                </h2>
                <span className="text-sm text-gray-500">
                  {posts.length}{' '}
                  {posts.length === 1
                    ? t('blog.author.article', { defaultValue: 'artículo' })
                    : t('blog.author.articles', { defaultValue: 'artículos' })}
                </span>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Spinner />
                </div>
              ) : error ? (
                <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  {t(error, {
                    defaultValue:
                      'No se pudieron cargar los artículos de esta firma. Intenta de nuevo.',
                  })}
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {posts.map((post) => (
                    <AuthorPostCard key={post.id} post={post} onOpen={handleOpenPost} />
                  ))}
                </div>
              )}
            </section>

            {otherAuthors.length ? (
              <section className="mt-12 rounded-2xl border border-soft bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900">
                  {t('blog.author.discoverOthers', {
                    defaultValue: 'Descubre otros autores',
                  })}
                </h3>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {otherAuthors.map((profile) => (
                    <Link
                      key={profile.id}
                      to={`/blog/autor/${profile.slug}`}
                      className="rounded-lg border border-soft bg-surface px-4 py-3 text-sm hover:border-[var(--color-primary,#6366f1)] hover:text-[var(--color-primary,#6366f1)] transition"
                    >
                      <p className="font-semibold text-body">{profile.name}</p>
                      {profile.title ? <p className="text-xs text-muted">{profile.title}</p> : null}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </PageWrapper>
    </>
  );
};

export default BlogAuthor;
