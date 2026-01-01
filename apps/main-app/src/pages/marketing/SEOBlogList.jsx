import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import { 
  PageWrapper, 
  Container,
  theme 
} from '../../components/theme/WeddingTheme';
import blogPosts from '../../data/blog-posts.json';

export default function SEOBlogList() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  // Obtener categorías únicas
  const categories = ['Todas', ...new Set(blogPosts.map(post => post.category))];

  // Filtrar posts
  const filteredPosts = selectedCategory === 'Todas' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  return (
    <>
      <Helmet>
        <title>Blog de Bodas | Guías, Consejos y Comparativas | Planivia</title>
        <meta name="description" content="Descubre nuestras guías completas de bodas por ciudad, comparativas de destinos y consejos de presupuesto. +600 artículos para planificar tu boda perfecta." />
        <meta name="keywords" content="blog bodas, guías bodas, consejos bodas, presupuesto boda, comparativas ciudades boda" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Blog de Bodas | Planivia" />
        <meta property="og:description" content="Guías completas, comparativas y consejos para organizar tu boda perfecta" />
        <meta property="og:url" content="https://planivia.net/blog" />
        
        {/* Canonical */}
        <link rel="canonical" href="https://planivia.net/blog" />
      </Helmet>
      
      <PageWrapper>
        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #FFF4E6 0%, #F8EFE3 50%, #E8D5C4 100%)',
          padding: '80px 0',
        }}>
          <Container>
            <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
              <h1 style={{
                fontFamily: theme.fonts.heading,
                fontSize: '56px',
                fontWeight: 400,
                color: theme.colors.textPrimary,
                marginBottom: '24px',
                lineHeight: '1.2',
              }}>
                Blog de Bodas
              </h1>
              <p style={{
                fontFamily: theme.fonts.body,
                fontSize: '20px',
                color: theme.colors.textSecondary,
                lineHeight: '1.6',
              }}>
                Guías completas, comparativas de ciudades y consejos de expertos para organizar tu boda perfecta
              </p>
            </div>
          </Container>
        </div>

        <Container>
          {/* Filters */}
          <div style={{
            padding: '40px 0',
            borderBottom: `1px solid ${theme.colors.borderSoft}`,
          }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: selectedCategory === category ? theme.colors.primary : 'transparent',
                    color: selectedCategory === category ? 'white' : theme.colors.textPrimary,
                    border: `2px solid ${selectedCategory === category ? theme.colors.primary : '#E8D5C4'}`,
                    borderRadius: '24px',
                    fontFamily: theme.fonts.body,
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== category) {
                      e.currentTarget.style.borderColor = theme.colors.primary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== category) {
                      e.currentTarget.style.borderColor = '#E8D5C4';
                    }
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Posts Grid */}
          <div style={{ padding: '60px 0' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '32px',
            }}>
              {filteredPosts.map(post => (
                <article
                  key={post.id}
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  style={{
                    backgroundColor: '#FFFBF7',
                    borderRadius: '24px',
                    border: '2px solid #F5EFE7',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)';
                    e.currentTarget.style.borderColor = theme.colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#F5EFE7';
                  }}
                >
                  <div style={{ padding: '32px' }}>
                    {/* Category badge */}
                    <div style={{
                      display: 'inline-block',
                      padding: '6px 16px',
                      backgroundColor: '#FFF5EB',
                      color: theme.colors.primary,
                      borderRadius: '16px',
                      fontFamily: theme.fonts.body,
                      fontSize: '12px',
                      fontWeight: 600,
                      marginBottom: '16px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      {post.category}
                    </div>

                    {/* Title */}
                    <h2 style={{
                      fontFamily: theme.fonts.heading,
                      fontSize: '24px',
                      fontWeight: 500,
                      color: theme.colors.textPrimary,
                      marginBottom: '12px',
                      lineHeight: '1.3',
                    }}>
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p style={{
                      fontFamily: theme.fonts.body,
                      fontSize: '15px',
                      color: theme.colors.textSecondary,
                      lineHeight: '1.6',
                      marginBottom: '20px',
                    }}>
                      {post.excerpt.length > 140 ? post.excerpt.substring(0, 140) + '...' : post.excerpt}
                    </p>

                    {/* Meta */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '20px',
                      borderTop: `1px solid #F5EFE7`,
                    }}>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: theme.fonts.body,
                        fontSize: '13px',
                        color: theme.colors.textSecondary,
                      }}>
                        <Calendar size={14} />
                        {new Date(post.publishedAt).toLocaleDateString('es-ES', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontFamily: theme.fonts.body,
                        fontSize: '14px',
                        fontWeight: 600,
                        color: theme.colors.primary,
                      }}>
                        Leer más
                        <ArrowRight size={16} />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Results count */}
            <div style={{
              marginTop: '40px',
              textAlign: 'center',
              fontFamily: theme.fonts.body,
              fontSize: '14px',
              color: theme.colors.textSecondary,
            }}>
              Mostrando {filteredPosts.length} de {blogPosts.length} artículos
            </div>
          </div>
        </Container>
      </PageWrapper>
    </>
  );
}
