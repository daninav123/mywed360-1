import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { 
  PageWrapper, 
  PrimaryButton, 
  Container,
  theme 
} from '../../components/theme/WeddingTheme';
import blogPosts from '../../data/blog-posts.json';

export default function SEOBlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Buscar el post
  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <>
      <Helmet>
        <title>{post.seo.metaTitle}</title>
        <meta name="description" content={post.seo.metaDescription} />
        <meta name="keywords" content={post.seo.keywords} />
        
        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:url" content={`https://planivia.net/blog/${post.slug}`} />
        {post.seo.ogImage && (
          <>
            <meta property="og:image" content={post.seo.ogImage} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
          </>
        )}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        {post.seo.ogImage && (
          <meta name="twitter:image" content={post.seo.ogImage} />
        )}
        
        {/* Canonical */}
        <link rel="canonical" href={`https://planivia.net/blog/${post.slug}`} />
        
        {/* Article Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.excerpt,
            "author": {
              "@type": "Person",
              "name": post.author
            },
            "datePublished": post.publishedAt,
            "publisher": {
              "@type": "Organization",
              "name": "Planivia",
              "logo": {
                "@type": "ImageObject",
                "url": "https://planivia.net/logo.png"
              }
            }
          })}
        </script>
      </Helmet>
      
      <PageWrapper>
        <Container>
          {/* Back button */}
          <div style={{ padding: '40px 0 20px' }}>
            <button
              onClick={() => navigate('/blog')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: theme.fonts.body,
                fontSize: '14px',
                color: theme.colors.primary,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <ArrowLeft size={16} />
              Volver al Blog
            </button>
          </div>

          {/* Article Header */}
          <article style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 0 80px' }}>
            <header style={{ marginBottom: '40px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '16px',
                flexWrap: 'wrap',
              }}>
                <span style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  backgroundColor: theme.colors.primary,
                  color: 'white',
                  borderRadius: '20px',
                  fontFamily: theme.fonts.body,
                  fontSize: '13px',
                  fontWeight: 500,
                }}>
                  {post.category}
                </span>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: theme.fonts.body,
                  fontSize: '14px',
                  color: theme.colors.textSecondary,
                }}>
                  <Calendar size={14} />
                  {new Date(post.publishedAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              <h1 style={{
                fontFamily: theme.fonts.heading,
                fontSize: '48px',
                fontWeight: 400,
                color: theme.colors.textPrimary,
                marginBottom: '20px',
                lineHeight: '1.2',
              }}>
                {post.title}
              </h1>

              <p style={{
                fontFamily: theme.fonts.body,
                fontSize: '20px',
                color: theme.colors.textSecondary,
                lineHeight: '1.6',
                marginBottom: '24px',
              }}>
                {post.excerpt}
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{
                  fontFamily: theme.fonts.body,
                  fontSize: '14px',
                  color: theme.colors.textSecondary,
                }}>
                  Por {post.author}
                </span>
              </div>
            </header>

            {/* Article Content */}
            <div 
              style={{
                fontFamily: theme.fonts.body,
                fontSize: '18px',
                lineHeight: '1.8',
                color: theme.colors.textPrimary,
              }}
              dangerouslySetInnerHTML={{ 
                __html: post.content
                  .replace(/\n\n/g, '</p><p style="margin-bottom: 24px;">')
                  .replace(/^/, '<p style="margin-bottom: 24px;">')
                  .replace(/$/, '</p>')
                  .replace(/^# (.*)/gm, '<h1 style="font-family: ' + theme.fonts.heading + '; font-size: 42px; font-weight: 400; margin: 48px 0 24px; line-height: 1.2;">$1</h1>')
                  .replace(/^## (.*)/gm, '<h2 style="font-family: ' + theme.fonts.heading + '; font-size: 32px; font-weight: 500; margin: 40px 0 20px; line-height: 1.3;">$1</h2>')
                  .replace(/^### (.*)/gm, '<h3 style="font-family: ' + theme.fonts.body + '; font-size: 24px; font-weight: 600; margin: 32px 0 16px; line-height: 1.4;">$1</h3>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: ' + theme.colors.primary + '; text-decoration: underline;">$1</a>')
              }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div style={{
                marginTop: '48px',
                paddingTop: '32px',
                borderTop: `1px solid ${theme.colors.borderSoft}`,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}>
                  <Tag size={16} style={{ color: theme.colors.textSecondary }} />
                  {post.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        backgroundColor: '#F5EFE7',
                        color: theme.colors.textSecondary,
                        borderRadius: '12px',
                        fontFamily: theme.fonts.body,
                        fontSize: '13px',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div style={{
              marginTop: '64px',
              padding: '40px',
              backgroundColor: '#FFF5EB',
              borderRadius: '24px',
              textAlign: 'center',
            }}>
              <h3 style={{
                fontFamily: theme.fonts.heading,
                fontSize: '28px',
                fontWeight: 500,
                color: theme.colors.textPrimary,
                marginBottom: '16px',
              }}>
                ¿Listo para planificar tu boda?
              </h3>
              <p style={{
                fontFamily: theme.fonts.body,
                fontSize: '16px',
                color: theme.colors.textSecondary,
                marginBottom: '24px',
              }}>
                Usa Planivia gratis para organizar todos los detalles
              </p>
              <PrimaryButton onClick={() => navigate('/signup')}>
                Empezar Gratis
              </PrimaryButton>
            </div>
          </article>
        </Container>
      </PageWrapper>
    </>
  );
}
