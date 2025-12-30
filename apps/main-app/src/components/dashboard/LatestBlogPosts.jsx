import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBlogPosts } from '../../services/blogContentService';
import { formatDate } from '../../utils/formatUtils';
import useTranslations from '../../hooks/useTranslations';

export default function LatestBlogPosts() {
  const { t } = useTranslations();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const result = await fetchBlogPosts({ limit: 4 });
        setPosts(result.posts || []);
      } catch (error) {
        console.error('[LatestBlogPosts] Error loading posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const handlePostClick = (post) => {
    if (post?.slug) {
      navigate(`/blog/${post.slug}`);
    }
  };

  const handleViewAll = () => {
    navigate('/blog');
  };

  if (loading) {
    return (
      <div 
        className="rounded-xl p-8"
        style={{
          backgroundColor: 'transparent',
          border: '1px solid var(--color-border-soft)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary)' }} />
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div 
      className="rounded-xl p-6"
      style={{
        backgroundColor: 'transparent',
        border: '1px solid var(--color-border-soft)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 
          className="text-2xl font-semibold"
          style={{ 
            color: 'var(--color-text)', 
            fontFamily: "'Playfair Display', serif" 
          }}
        >
          {t('home2.blog.sectionTitle', { defaultValue: 'Últimas del Blog' })}
        </h2>
        <button
          onClick={handleViewAll}
          className="text-sm font-medium transition-colors"
          style={{ color: 'var(--color-primary)' }}
          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
        >
          {t('home2.blog.viewAll', { defaultValue: 'Ver todo →' })}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {posts.map((post) => {
          const published = post?.publishedAt ? new Date(post.publishedAt) : null;
          const coverUrl = post?.coverImage?.url || post?.coverImage?.placeholder || null;

          return (
            <article
              key={post.id || post.slug}
              className="rounded-lg overflow-hidden cursor-pointer transition-all duration-200 flex flex-col"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border-soft)',
                boxShadow: 'var(--shadow-card)',
              }}
              onClick={() => handlePostClick(post)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {coverUrl && (
                <div className="relative w-full h-40 overflow-hidden">
                  <img
                    src={coverUrl}
                    alt={post?.coverImage?.alt || post?.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-4 flex flex-col gap-2 flex-1">
                <h3 
                  className="text-base font-semibold line-clamp-2"
                  style={{ color: 'var(--color-text)' }}
                >
                  {post?.title}
                </h3>
                {post?.excerpt && (
                  <p 
                    className="text-sm line-clamp-2"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {post.excerpt}
                  </p>
                )}
                <div className="mt-auto pt-2">
                  {published && (
                    <span 
                      className="text-xs"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {formatDate(published, 'short')}
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
