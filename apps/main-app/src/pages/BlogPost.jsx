import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

import PageWrapper from '../components/PageWrapper';
import Spinner from '../components/Spinner';
import { formatDate } from '../utils/formatUtils';
import { fetchBlogPostBySlug, fetchBlogPosts } from '../services/blogContentService';
import useTranslations from '../hooks/useTranslations';
import { listBlogAuthors } from '../utils/blogAuthors';
function parseInlineMarkdown(text) {
  const parts = [];
  let current = '';
  let i = 0;

  while (i < text.length) {
    // Enlaces [texto](url)
    if (text[i] === '[') {
      const linkMatch = text.slice(i).match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        if (current) {
          parts.push({ type: 'text', content: current });
          current = '';
        }
        parts.push({ type: 'link', text: linkMatch[1], url: linkMatch[2] });
        i += linkMatch[0].length;
        continue;
      }
    }

    // Negrita **texto**
    if (text[i] === '*' && text[i + 1] === '*') {
      const boldMatch = text.slice(i).match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        if (current) {
          parts.push({ type: 'text', content: current });
          current = '';
        }
        parts.push({ type: 'bold', content: boldMatch[1] });
        i += boldMatch[0].length;
        continue;
      }
    }

    // Cursiva *texto*
    if (text[i] === '*' && text[i + 1] !== '*') {
      const italicMatch = text.slice(i).match(/^\*([^*]+)\*/);
      if (italicMatch) {
        if (current) {
          parts.push({ type: 'text', content: current });
          current = '';
        }
        parts.push({ type: 'italic', content: italicMatch[1] });
        i += italicMatch[0].length;
        continue;
      }
    }

    current += text[i];
    i++;
  }

  if (current) {
    parts.push({ type: 'text', content: current });
  }

  return parts;
}

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

const InlineText = ({ text }) => {
  const parts = useMemo(() => parseInlineMarkdown(text), [text]);
  
  return (
    <>
      {parts.map((part, idx) => {
        const key = `inline-${idx}`;
        switch (part.type) {
          case 'link':
            return (
              <a
                key={key}
                href={part.url}
                className="text-[color:var(--color-primary)] underline hover:text-[color:var(--color-primary-dark)] font-medium"
                target={part.url.startsWith('http') ? '_blank' : undefined}
                rel={part.url.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {part.text}
              </a>
            );
          case 'bold':
            return <strong key={key} className="font-semibold">{part.content}</strong>;
          case 'italic':
            return <em key={key} className="italic">{part.content}</em>;
          default:
            return <span key={key}>{part.content}</span>;
        }
      })}
    </>
  );
};

const MarkdownRenderer = ({ markdown }) => {
  const blocks = useMemo(() => parseMarkdown(markdown), [markdown]);
  if (!blocks.length) return null;
  return (
    <div className="space-y-5 leading-relaxed " className="text-body">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case 'h2':
            return (
              <h2 key={key} className="text-2xl font-semibold " className="text-body">
                <InlineText text={block.text} />
              </h2>
            );
          case 'h3':
            return (
              <h3 key={key} className="text-xl font-semibold " className="text-body">
                <InlineText text={block.text} />
              </h3>
            );
          case 'ul':
            return (
              <ul key={key} className="list-disc space-y-2 pl-5">
                {block.items.map((item, idx) => (
                  <li key={`${key}-item-${idx}`} className="" className="text-body">
                    <InlineText text={item} />
                  </li>
                ))}
              </ul>
            );
          case 'quote':
            return (
              <blockquote
                key={key}
                className="border-l-4 border-indigo-200 bg-indigo-50/60 px-4 py-2 italic " className="text-body"
              >
                <InlineText text={block.text} />
              </blockquote>
            );
          default:
            return (
              <p key={key} className="" className="text-body">
                <InlineText text={block.text} />
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
    let timeoutId = null;
    
    async function load() {
      setLoading(true);
      setError(null);
      
      timeoutId = setTimeout(() => {
        if (!cancelled) {
          setLoading(false);
          setError(
            t('blog.post.errors.timeout', {
              defaultValue: 'La carga está tardando demasiado. Por favor, recarga la página.',
            })
          );
        }
      }, 10000);
      
      try {
        const response = await fetchBlogPostBySlug(slug, { language: normalizedLanguage });
        if (cancelled) return;
        
        if (timeoutId) clearTimeout(timeoutId);
        
        setPost(response?.post || null);
        if (!response?.post) {
          setError(
            t('blog.post.errors.notFound', {
              defaultValue:
                'No hemos encontrado este artículo. Comprueba que el enlace es correcto.',
            })
          );
        }
      } catch (err) {
        if (cancelled) return;
        if (timeoutId) clearTimeout(timeoutId);
        
        setError(
          t('blog.post.errors.loadFailed', {
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
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [slug, normalizedLanguage]);

  const publishedAt = useMemo(() => {
    if (!post?.publishedAt) return null;
    const date = new Date(post.publishedAt);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [post]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId = null;
    
    async function loadRelated() {
      if (!post) {
        setRelatedPosts([]);
        setLoadingRelated(false);
        return;
      }
      
      setLoadingRelated(true);
      
      timeoutId = setTimeout(() => {
        if (!cancelled) {
          setLoadingRelated(false);
          setRelatedPosts([]);
        }
      }, 8000);
      
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

        if (timeoutId) clearTimeout(timeoutId);

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
          if (timeoutId) clearTimeout(timeoutId);
          setRelatedPosts([]);
        }
      } finally {
        if (!cancelled) setLoadingRelated(false);
      }
    }
    
    loadRelated();
    
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
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
    : t('blog.title', { defaultValue: 'Blog' });
  const metaDescription =
    post?.excerpt ||
    t('blog.lead', {
      defaultValue:
        'Descubre tendencias, guías y consejos para organizar tu boda con la ayuda del equipo Lovenda.',
    });
  const canonicalUrl = `/blog/${slug}`;
  const ctaCopy = {
    title: t('blog.post.cta.title', { defaultValue: 'Organiza tu boda con Lovenda' }),
    description: t('blog.post.cta.description', {
      defaultValue:
        'Centraliza tareas, proveedores y comunicación con la plataforma que usamos para crear estas historias.',
    }),
    primary: t('blog.post.cta.primary', { defaultValue: 'Solicitar demo gratis' }),
    secondary: t('blog.post.cta.secondary', { defaultValue: 'Descubrir la app' }),
  };
  const referencesTitle = t('blog.post.references.title', {
    defaultValue: 'Fuentes consultadas',
  });
  const relatedTitle = t('blog.post.related.title', {
    defaultValue: 'También te puede interesar',
  });
  const canonicalHref =
    typeof window !== 'undefined'
      ? `${window.location.origin}${canonicalUrl}`
      : `https://malove.app${canonicalUrl}`;
  const coverImage = post?.coverImage?.url || null;
  const articleLd = useMemo(() => {
    if (!post) return null;
    const publishedIso = post.publishedAt || null;
    const authorData =
      post.byline?.name || post.byline?.title
        ? {
            '@type': 'Person',
            name: post.byline?.name || 'Lovenda',
            ...(post.byline?.title ? { jobTitle: post.byline.title } : {}),
          }
        : undefined;
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: metaDescription,
      image: coverImage ? [coverImage] : undefined,
      datePublished: publishedIso,
      dateModified: post.updatedAt || publishedIso,
      author: authorData,
      publisher: {
        '@type': 'Organization',
        name: 'Planivia',
        logo: {
          '@type': 'ImageObject',
          url: 'https://planivia.net/logo.png',
        },
      },
      mainEntityOfPage: canonicalHref,
    };
  }, [post, metaDescription, coverImage, canonicalHref]);
  const breadcrumbLd = useMemo(() => {
    if (!post) return null;
    const blogUrl =
      typeof window !== 'undefined' ? `${window.location.origin}/blog` : 'https://malove.app/blog';
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: t('blog.title', { defaultValue: 'Blog' }),
          item: blogUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: post.title,
          item: canonicalHref,
        },
      ],
    };
  }, [post, canonicalHref, t]);

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
        {articleLd ? <script type="application/ld+json">{JSON.stringify(articleLd)}</script> : null}
        {breadcrumbLd ? (
          <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
        ) : null}
      </Helmet>
      <PageWrapper
        title={
          post?.title || t('blog.post.fallbackTitle', { defaultValue: 'Artículo del blog' })
        }
        className="max-w-3xl mx-auto"
      >
        <div className="mb-6">
          <Link
            to="/blog"
            className="text-sm text-[color:var(--color-primary)] hover:text-[color:var(--color-primary-dark)]"
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
              <h1 className="text-3xl font-semibold " className="text-body">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm " className="text-secondary">
                {post?.byline?.name ? (
                  <Link
                    to={`/blog/autor/${post.byline.slug || post.byline.id}`}
                    className="text-[color:var(--color-primary)] hover:text-[color:var(--color-primary-dark)]"
                  >
                    Por <span className="font-semibold " className="text-body">{post.byline.name}</span>
                    {post.byline.title ? ` · ${post.byline.title}` : ''}
                  </Link>
                ) : null}
                {publishedAt ? (
                  <span className="" className="text-muted">
                    Publicado el {formatDate(publishedAt, 'long')}
                  </span>
                ) : null}
                <div className="flex flex-wrap gap-2 " className="text-muted">
                  {(post.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full  px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide " className="text-secondary" className="bg-page"
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
              <p className="text-lg  font-medium" className="text-body">{post.excerpt}</p>
            ) : null}
            {post?.byline?.signature ? (
              <p className="text-sm italic " className="text-muted">{post.byline.signature}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 py-4 border-y " className="border-default">
              <span className="text-sm font-medium " className="text-body">Compartir:</span>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(canonicalHref)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-[#1DA1F2] px-3 py-1.5 text-sm font-medium text-white transition hover:brightness-110"
                aria-label="Compartir en Twitter"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
                Twitter
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalHref)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-[#0A66C2] px-3 py-1.5 text-sm font-medium text-white transition hover:brightness-110"
                aria-label="Compartir en LinkedIn"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + ' ' + canonicalHref)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-3 py-1.5 text-sm font-medium text-white transition hover:brightness-110"
                aria-label="Compartir en WhatsApp"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalHref)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-[#1877F2] px-3 py-1.5 text-sm font-medium text-white transition hover:brightness-110"
                aria-label="Compartir en Facebook"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </a>
            </div>

            <MarkdownRenderer markdown={post.content?.markdown || ''} />

            <section className="my-8 rounded-xl bg-gradient-to-br from-rose-50 via-purple-50 to-blue-50 p-8 shadow-sm">
              <div className="max-w-3xl mx-auto text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full  shadow-md mb-4" className="bg-surface">
                  <span className="text-2xl">💍</span>
                </div>
                <h2 className="text-2xl font-bold  mb-3" className="text-body">
                  ¿Te ha gustado este artículo?
                </h2>
                <p className=" mb-6" className="text-body">
                  Descubre cómo Lovenda te ayuda a planificar cada detalle de tu boda de forma sencilla. Miles de parejas ya confían en nosotros.
                </p>
                <div className="flex flex-wrap justify-center gap-3 mb-6">
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg hover:scale-105"
                  >
                    ✨ Prueba Lovenda Gratis
                  </Link>
                  <Link
                    to="/precios"
                    className="inline-flex items-center justify-center rounded-lg border-2   px-6 py-3 text-sm font-semibold  transition hover:border-rose-300 hover:bg-rose-50" className="border-default" className="text-body" className="bg-surface"
                  >
                    Ver Planes y Precios
                  </Link>
                </div>
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  <Link to="/para-planners" className="text-rose-600 hover:text-rose-700 font-medium hover:underline">
                    Para Wedding Planners
                  </Link>
                  <span className="" className="text-muted">•</span>
                  <Link to="/para-proveedores" className="text-rose-600 hover:text-rose-700 font-medium hover:underline">
                    Para Proveedores
                  </Link>
                  <span className="" className="text-muted">•</span>
                  <Link to="/blog" className="text-rose-600 hover:text-rose-700 font-medium hover:underline">
                    Más Artículos
                  </Link>
                </div>
              </div>
            </section>

            {references.length ? (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold " className="text-body">{referencesTitle}</h2>
                <ul className="space-y-2 text-sm " className="text-secondary">
                  {references.map((ref, index) => (
                    <li key={`${ref.url || ref.title}-${index}`} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                      {ref.url ? (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[color:var(--color-primary)] hover:text-[color:var(--color-primary-dark)]"
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
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-soft bg-[var(--color-primary)] flex items-center justify-center text-white text-xl font-bold">
                  {authorProfile.avatar ? (
                    <img
                      src={authorProfile.avatar}
                      alt={authorProfile.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span style={{ display: authorProfile.avatar ? 'none' : 'flex' }}>
                    {authorProfile.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold " className="text-body">{authorProfile.name}</p>
                  {authorProfile.title ? (
                    <p className="text-xs font-medium uppercase tracking-widest " className="text-muted">
                      {authorProfile.title}
                    </p>
                  ) : null}
                  <p className="text-sm " className="text-secondary">{authorProfile.bio}</p>
                  <Link
                    to={`/blog/autor/${authorProfile.slug}`}
                    className="inline-flex text-sm font-medium text-[color:var(--color-primary)] hover:text-[color:var(--color-primary-dark)]"
                  >
                    {t('blog.author.viewAll', { defaultValue: 'Ver artículos del autor' })}
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
            <h2 className="text-xl font-semibold " className="text-body">{relatedTitle}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedPosts.map((item) => (
                <Link
                  key={item.slug}
                  to={`/blog/${item.slug}`}
                  className="rounded-lg border border-soft  p-4 shadow-sm transition hover:border-[color:var(--color-primary)] hover:shadow" className="bg-surface"
                >
                  <p className="text-sm font-semibold  line-clamp-2" className="text-body">{item.title}</p>
                  {item.publishedAt ? (
                    <p className="mt-2 text-xs " className="text-muted">
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
