import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import PageWrapper from '../components/PageWrapper';
import Spinner from '../components/Spinner';
import { formatDate } from '../utils/formatUtils';
import { fetchBlogPostBySlug } from '../services/blogContentService';

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
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchBlogPostBySlug(slug);
        if (cancelled) return;
        setPost(response?.post || null);
        if (!response?.post) {
          setError('No hemos encontrado este artículo. Comprueba que el enlace es correcto.');
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[BlogPost] fetch failed', err);
        setError('No se pudo cargar el contenido. Inténtalo de nuevo más tarde.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const publishedAt = useMemo(() => {
    if (!post?.publishedAt) return null;
    const date = new Date(post.publishedAt);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [post]);

  return (
    <PageWrapper title={post?.title || 'Artículo del blog'} className="max-w-3xl mx-auto">
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
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {publishedAt ? (
                <span>Publicado el {formatDate(publishedAt, 'long')}</span>
              ) : null}
              <div className="flex flex-wrap gap-2">
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

          <MarkdownRenderer markdown={post.content?.markdown || ''} />
        </article>
      ) : null}
    </PageWrapper>
  );
};

export default BlogPost;

