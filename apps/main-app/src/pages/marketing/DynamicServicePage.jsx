import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check, Users, DollarSign, Search, CheckCircle, Mail, PieChart, Bell, Grid3x3, MousePointer2, Calendar, TrendingUp, Sparkles, Send, Heart } from 'lucide-react';
import LanguageSelector from '../../components/ui/LanguageSelector';
import { 
  PageWrapper, 
  HeroSection, 
  PrimaryButton, 
  SecondaryButton, 
  FeatureCard, 
  SectionTitle, 
  Container,
  theme 
} from '../../components/theme/WeddingTheme';
import {
  getCityData,
  getServiceData,
  isValidCityService,
  getCityServiceStats,
  generateLocalBusinessSchema,
  generateSEOTitle,
  generateSEODescription,
  generateSEOKeywords,
  getNearbyCities,
  getRelatedServices,
  generateFAQSchema,
  generateHowToSchema,
  generateBreadcrumbSchema,
  generateEventSchema,
  generateOfferSchema,
  generateAggregateRatingSchema,
  generateOrganizationSchema
} from '../../data/dataLoader';

// Mapeo de strings de iconos a componentes de Lucide
const iconMap = {
  Users,
  DollarSign,
  Search,
  CheckCircle,
  Mail,
  PieChart,
  Bell,
  Grid3x3,
  MousePointer2,
  Calendar,
  TrendingUp,
  Sparkles,
  Send,
  Heart,
};

// Helper para obtener el componente de icono
const getIconComponent = (iconName) => iconMap[iconName] || Heart;

export default function DynamicServicePage() {
  const { country, city, service } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(['marketing']);

  // Cargar datos
  const cityData = getCityData(city);
  const serviceData = getServiceData(service);

  // Validar que la combinación existe
  if (!cityData || !serviceData || !isValidCityService(city, service)) {
    return <Navigate to="/404" replace />;
  }

  const serviceStats = getCityServiceStats(city, service);
  const nearbyCities = getNearbyCities(city);
  const relatedServices = getRelatedServices(service);

  // Generar SEO dinámico
  const seoTitle = generateSEOTitle(cityData, serviceData);
  const seoDescription = generateSEODescription(cityData, serviceData);
  const seoKeywords = generateSEOKeywords(cityData, serviceData);
  
  // Generar todos los schemas
  const localBusinessSchema = generateLocalBusinessSchema(cityData, serviceData);
  const faqSchema = generateFAQSchema(cityData, serviceData);
  const howToSchema = generateHowToSchema(cityData, serviceData);
  const breadcrumbSchema = generateBreadcrumbSchema(cityData, serviceData);
  const eventSchema = generateEventSchema(cityData, serviceData);
  const offerSchema = generateOfferSchema(cityData, serviceData);
  const ratingSchema = generateAggregateRatingSchema(cityData, serviceData);
  const orgSchema = generateOrganizationSchema();

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={`https://planivia.net/${country}/${city}/${service}`} />
        <meta property="og:image" content={`${serviceData.heroImage}?w=1200&h=630&fit=crop&fm=jpg`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`${serviceData.name} en ${cityData.name}`} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={`${serviceData.heroImage}?w=1200&h=630&fit=crop&fm=jpg`} />
        <meta name="twitter:image:alt" content={`${serviceData.name} en ${cityData.name}`} />
        
        {/* Canonical */}
        <link rel="canonical" href={`https://planivia.net/${country}/${city}/${service}`} />
        
        {/* Hreflang para multi-país/idioma */}
        <link rel="alternate" hreflang="es-ES" href={`https://planivia.net/es/${city}/${service}`} />
        <link rel="alternate" hreflang="es-MX" href={`https://planivia.net/mx/${city}/${service}`} />
        <link rel="alternate" hreflang="es-AR" href={`https://planivia.net/ar/${city}/${service}`} />
        <link rel="alternate" hreflang="es-CO" href={`https://planivia.net/co/${city}/${service}`} />
        <link rel="alternate" hreflang="es-CL" href={`https://planivia.net/cl/${service}`} />
        <link rel="alternate" hreflang="es-PE" href={`https://planivia.net/pe/${city}/${service}`} />
        <link rel="alternate" hreflang="x-default" href={`https://planivia.net/${country}/${city}/${service}`} />
        
        {/* Hreflang */}
        <link rel="alternate" hreflang={cityData.locale} href={`https://planivia.net/${country}/${city}/${service}`} />
        
        {/* Schema.org - LocalBusiness */}
        <script type="application/ld+json">
          {JSON.stringify(localBusinessSchema)}
        </script>
        
        {/* Schema.org - FAQPage */}
        {faqSchema && (
          <script type="application/ld+json">
            {JSON.stringify(faqSchema)}
          </script>
        )}
        
        {/* Schema.org - HowTo */}
        {howToSchema && (
          <script type="application/ld+json">
            {JSON.stringify(howToSchema)}
          </script>
        )}
        
        {/* Schema.org - Breadcrumb */}
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
        
        {/* Schema.org - Event */}
        <script type="application/ld+json">
          {JSON.stringify(eventSchema)}
        </script>
        
        {/* Schema.org - Offer */}
        <script type="application/ld+json">
          {JSON.stringify(offerSchema)}
        </script>
        
        {/* Schema.org - AggregateRating */}
        <script type="application/ld+json">
          {JSON.stringify(ratingSchema)}
        </script>
        
        {/* Schema.org - Organization */}
        <script type="application/ld+json">
          {JSON.stringify(orgSchema)}
        </script>
      </Helmet>
      
      <PageWrapper>
        {/* Selector de idioma discreto */}
        <div className="fixed top-4 right-4 z-50">
          <LanguageSelector variant="minimal" persist={false} />
        </div>

        {/* Hero Section */}
        <HeroSection
          title={`${serviceData.name} en ${cityData.name}`}
          subtitle={`${serviceStats.vendorCount} proveedores verificados en ${cityData.name}. ${serviceStats.description || serviceData.shortDesc}`}
          image={serviceData.heroImage}
        >
          <div className="flex gap-4">
            <PrimaryButton onClick={() => navigate('/signup')}>
              {serviceData.ctaText || 'Empezar Gratis'}
            </PrimaryButton>
            <SecondaryButton onClick={() => navigate('/precios')}>
              Ver Planes
            </SecondaryButton>
          </div>
        </HeroSection>

        <Container>
          {/* City Stats */}
          <div style={{ 
            padding: '80px 0',
            borderBottom: `1px solid ${theme.colors.borderSoft}`,
          }}>
            <div className="max-w-3xl mx-auto text-center">
              <h2 style={{
                fontFamily: theme.fonts.heading,
                fontSize: '36px',
                fontWeight: 400,
                color: theme.colors.textPrimary,
                marginBottom: '24px',
              }}>
                {serviceData.name} en {cityData.name}
              </h2>
              <p style={{
                fontFamily: theme.fonts.body,
                fontSize: '18px',
                color: theme.colors.textSecondary,
                lineHeight: '1.8',
                marginBottom: '32px',
              }}>
                {cityData.description}
              </p>
              
              {/* Stats Grid */}
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div style={{
                  backgroundColor: theme.colors.backgroundSoft,
                  borderRadius: theme.radius.lg,
                  padding: '24px',
                }}>
                  <p style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '32px',
                    fontWeight: 600,
                    color: theme.colors.primary,
                    margin: 0,
                  }}>
                    {cityData.weddingStats.avgGuests}
                  </p>
                  <p style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '14px',
                    color: theme.colors.textSecondary,
                    margin: '4px 0 0 0',
                  }}>
                    Invitados promedio
                  </p>
                </div>
                
                <div style={{
                  backgroundColor: theme.colors.backgroundSoft,
                  borderRadius: theme.radius.lg,
                  padding: '24px',
                }}>
                  <p style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '32px',
                    fontWeight: 600,
                    color: theme.colors.primary,
                    margin: 0,
                  }}>
                    {serviceStats.avgPrice || serviceStats.avgBudget}{cityData.currencySymbol}
                  </p>
                  <p style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '14px',
                    color: theme.colors.textSecondary,
                    margin: '4px 0 0 0',
                  }}>
                    Precio medio
                  </p>
                </div>
                
                <div style={{
                  backgroundColor: theme.colors.backgroundSoft,
                  borderRadius: theme.radius.lg,
                  padding: '24px',
                }}>
                  <p style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '32px',
                    fontWeight: 600,
                    color: theme.colors.primary,
                    margin: 0,
                  }}>
                    {serviceStats.vendorCount}
                  </p>
                  <p style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '14px',
                    color: theme.colors.textSecondary,
                    margin: '4px 0 0 0',
                  }}>
                    Proveedores verificados
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Service Features */}
          {serviceData.features && (
            <div style={{ padding: '80px 0' }}>
              <SectionTitle 
                title={`Por Qué Usar ${serviceData.name} en ${cityData.name}`}
                subtitle={serviceData.longDesc}
              />
              <div className="grid md:grid-cols-3 gap-6">
                {serviceData.features.map((feature, index) => (
                  <FeatureCard
                    key={index}
                    icon={getIconComponent(feature.icon)}
                    title={feature.title}
                    description={feature.description}
                    color={theme.colors.pink}
                    accentColor={theme.colors.pinkAccent}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Benefits */}
          <div style={{ 
            padding: '80px 0',
            backgroundColor: theme.colors.backgroundSoft,
            borderRadius: theme.radius.xl,
            marginBottom: '80px',
          }}>
            <div className="max-w-4xl mx-auto px-8">
              <h2 style={{
                fontFamily: theme.fonts.heading,
                fontSize: '36px',
                fontWeight: 400,
                color: theme.colors.textPrimary,
                marginBottom: '48px',
                textAlign: 'center',
              }}>
                Beneficios de Planivia para tu Boda en {cityData.name}
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {serviceData.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check 
                      size={24} 
                      style={{ 
                        color: theme.colors.green,
                        flexShrink: 0,
                        marginTop: '2px',
                      }} 
                    />
                    <p style={{
                      fontFamily: theme.fonts.body,
                      fontSize: '16px',
                      color: theme.colors.textPrimary,
                      margin: 0,
                    }}>
                      {benefit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Related Services in This City */}
          {relatedServices.length > 0 && (
            <div style={{ padding: '80px 0' }}>
              <SectionTitle 
                title={`Otros Servicios en ${cityData.name}`}
                subtitle="Planifica cada detalle de tu boda"
              />
              <div className="grid md:grid-cols-3 gap-6">
                {relatedServices.map((relatedService) => (
                  <div
                    key={relatedService.slug}
                    onClick={() => navigate(`/${country}/${city}/${relatedService.slug}`)}
                    style={{
                      backgroundColor: theme.colors.backgroundSoft,
                      borderRadius: theme.radius.lg,
                      padding: '32px',
                      cursor: 'pointer',
                      border: `1px solid ${theme.colors.borderSoft}`,
                      transition: 'all 200ms',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = theme.shadow.md;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <h3 style={{
                      fontFamily: theme.fonts.body,
                      fontSize: '20px',
                      fontWeight: 600,
                      color: theme.colors.textPrimary,
                      marginBottom: '12px',
                    }}>
                      {relatedService.name}
                    </h3>
                    <p style={{
                      fontFamily: theme.fonts.body,
                      fontSize: '15px',
                      color: theme.colors.textSecondary,
                      marginBottom: '16px',
                    }}>
                      {relatedService.shortDesc}
                    </p>
                    <span style={{
                      fontFamily: theme.fonts.body,
                      fontSize: '14px',
                      fontWeight: 600,
                      color: theme.colors.primary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      Ver más <ArrowRight size={16} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* City Guide - Contenido extenso */}
          {cityData.contentSections && cityData.contentSections.guide && (
            <div style={{ 
              padding: '80px 0',
              background: 'linear-gradient(135deg, #FFFBF7 0%, #FFF5EB 100%)',
            }}>
              <div className="max-w-4xl mx-auto px-6">
                <div style={{
                  textAlign: 'center',
                  marginBottom: '48px',
                }}>
                  <span style={{
                    fontSize: '48px',
                    display: 'block',
                    marginBottom: '16px',
                  }}>📍</span>
                  <h2 style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: '42px',
                    fontWeight: 500,
                    color: theme.colors.textPrimary,
                    marginBottom: '16px',
                    lineHeight: '1.2',
                  }}>
                    {cityData.contentSections.guide.title}
                  </h2>
                </div>
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '32px',
                  padding: '48px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                }}>
                  {cityData.contentSections.guide.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} style={{
                      fontFamily: theme.fonts.body,
                      fontSize: '17px',
                      color: theme.colors.textSecondary,
                      lineHeight: '1.9',
                      marginBottom: idx === cityData.contentSections.guide.content.split('\n\n').length - 1 ? 0 : '24px',
                    }}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FAQs */}
          {cityData.contentSections && cityData.contentSections.faqs && (
            <div style={{ 
              padding: '80px 0',
              backgroundColor: '#ffffff',
            }}>
              <div className="max-w-4xl mx-auto px-6">
                <div style={{
                  textAlign: 'center',
                  marginBottom: '56px',
                }}>
                  <span style={{
                    fontSize: '48px',
                    display: 'block',
                    marginBottom: '16px',
                  }}>💬</span>
                  <h2 style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: '42px',
                    fontWeight: 500,
                    color: theme.colors.textPrimary,
                    marginBottom: '12px',
                  }}>
                    Preguntas Frecuentes
                  </h2>
                  <p style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '18px',
                    color: theme.colors.textSecondary,
                  }}>
                    Todo lo que necesitas saber sobre bodas en {cityData.name}
                  </p>
                </div>
                <div className="space-y-4">
                  {cityData.contentSections.faqs.map((faq, idx) => (
                    <div key={idx} style={{
                      backgroundColor: '#FFFBF7',
                      borderRadius: '24px',
                      padding: '32px',
                      border: '2px solid #F5EFE7',
                      transition: 'all 0.3s ease',
                      cursor: 'default',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.primary;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#F5EFE7';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'start',
                        gap: '16px',
                      }}>
                        <span style={{
                          fontSize: '24px',
                          flexShrink: 0,
                          backgroundColor: theme.colors.primary,
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontWeight: 600,
                          fontFamily: theme.fonts.body,
                        }}>
                          {idx + 1}
                        </span>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            fontFamily: theme.fonts.body,
                            fontSize: '19px',
                            fontWeight: 600,
                            color: theme.colors.textPrimary,
                            marginBottom: '12px',
                            lineHeight: '1.4',
                          }}>
                            {faq.question}
                          </h3>
                          <p style={{
                            fontFamily: theme.fonts.body,
                            fontSize: '16px',
                            color: theme.colors.textSecondary,
                            lineHeight: '1.8',
                            margin: 0,
                          }}>
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tips Locales */}
          {cityData.contentSections && cityData.contentSections.tips && (
            <div style={{ 
              padding: '80px 0',
              background: 'linear-gradient(135deg, #FFF9F5 0%, #FFFBF7 100%)',
            }}>
              <div className="max-w-5xl mx-auto px-6">
                <div style={{
                  textAlign: 'center',
                  marginBottom: '56px',
                }}>
                  <span style={{
                    fontSize: '48px',
                    display: 'block',
                    marginBottom: '16px',
                  }}>✨</span>
                  <h2 style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: '42px',
                    fontWeight: 500,
                    color: theme.colors.textPrimary,
                    marginBottom: '12px',
                  }}>
                    Consejos de Expertos
                  </h2>
                  <p style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '18px',
                    color: theme.colors.textSecondary,
                  }}>
                    Tips imprescindibles para tu boda en {cityData.name}
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  {cityData.contentSections.tips.map((tip, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'start',
                      padding: '24px',
                      backgroundColor: '#ffffff',
                      borderRadius: '24px',
                      border: '2px solid #F5EFE7',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
                    }}>
                      <span style={{
                        fontSize: '28px',
                        flexShrink: 0,
                        backgroundColor: '#FFF5EB',
                        width: '48px',
                        height: '48px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>💡</span>
                      <p style={{
                        fontFamily: theme.fonts.body,
                        fontSize: '15.5px',
                        color: theme.colors.textPrimary,
                        margin: 0,
                        lineHeight: '1.7',
                        fontWeight: 500,
                      }}>
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Venues Populares */}
          {cityData.contentSections && cityData.contentSections.venues && (
            <div style={{ 
              padding: '80px 0',
              backgroundColor: '#ffffff',
            }}>
              <div className="max-w-6xl mx-auto px-6">
                <div style={{
                  textAlign: 'center',
                  marginBottom: '56px',
                }}>
                  <span style={{
                    fontSize: '48px',
                    display: 'block',
                    marginBottom: '16px',
                  }}>🏛️</span>
                  <h2 style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: '42px',
                    fontWeight: 500,
                    color: theme.colors.textPrimary,
                    marginBottom: '12px',
                  }}>
                    Venues Populares
                  </h2>
                  <p style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '18px',
                    color: theme.colors.textSecondary,
                  }}>
                    Los espacios más demandados para bodas en {cityData.name}
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {cityData.contentSections.venues.map((venue, idx) => (
                    <div key={idx} style={{
                      backgroundColor: '#FFFBF7',
                      borderRadius: '28px',
                      padding: '32px',
                      border: '2px solid #F5EFE7',
                      transition: 'all 0.3s ease',
                      cursor: 'default',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)';
                      e.currentTarget.style.borderColor = theme.colors.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = '#F5EFE7';
                    }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '20px',
                        backgroundColor: theme.colors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                        fontSize: '28px',
                      }}>
                        🏰
                      </div>
                      <h3 style={{
                        fontFamily: theme.fonts.body,
                        fontSize: '22px',
                        fontWeight: 600,
                        color: theme.colors.textPrimary,
                        marginBottom: '16px',
                        lineHeight: '1.3',
                      }}>
                        {venue.name}
                      </h3>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        marginBottom: '16px',
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          <span style={{ fontSize: '16px' }}>🏷️</span>
                          <span style={{
                            fontFamily: theme.fonts.body,
                            fontSize: '14px',
                            color: theme.colors.textSecondary,
                            fontWeight: 500,
                          }}>
                            {venue.type}
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          <span style={{ fontSize: '16px' }}>👥</span>
                          <span style={{
                            fontFamily: theme.fonts.body,
                            fontSize: '14px',
                            color: theme.colors.textSecondary,
                            fontWeight: 500,
                          }}>
                            Hasta {venue.capacity} personas
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          <span style={{ fontSize: '16px' }}>💰</span>
                          <span style={{
                            fontFamily: theme.fonts.body,
                            fontSize: '14px',
                            color: theme.colors.textSecondary,
                            fontWeight: 500,
                          }}>
                            {venue.priceRange}
                          </span>
                        </div>
                      </div>
                      <div style={{
                        borderTop: '1px solid #F5EFE7',
                        paddingTop: '16px',
                      }}>
                        <p style={{
                          fontFamily: theme.fonts.body,
                          fontSize: '15px',
                          color: theme.colors.textPrimary,
                          margin: 0,
                          lineHeight: '1.6',
                          fontWeight: 500,
                        }}>
                          ✨ {venue.highlight}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Timeline de Planificación */}
          {cityData.contentSections && cityData.contentSections.timeline && (
            <div style={{ 
              padding: '80px 0',
              background: 'linear-gradient(135deg, #FFFBF7 0%, #FFF5EB 100%)',
            }}>
              <div className="max-w-4xl mx-auto px-6">
                <div style={{
                  textAlign: 'center',
                  marginBottom: '56px',
                }}>
                  <span style={{
                    fontSize: '48px',
                    display: 'block',
                    marginBottom: '16px',
                  }}>📅</span>
                  <h2 style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: '42px',
                    fontWeight: 500,
                    color: theme.colors.textPrimary,
                    marginBottom: '12px',
                  }}>
                    Timeline de Planificación
                  </h2>
                  <p style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '18px',
                    color: theme.colors.textSecondary,
                  }}>
                    Organiza tu boda en {cityData.name} paso a paso
                  </p>
                </div>
                <div style={{
                  position: 'relative',
                  paddingLeft: '40px',
                }}>
                  {/* Línea vertical del timeline */}
                  <div style={{
                    position: 'absolute',
                    left: '19px',
                    top: '30px',
                    bottom: '30px',
                    width: '3px',
                    backgroundColor: theme.colors.primary,
                    opacity: 0.3,
                  }} />
                  
                  <div className="space-y-6">
                    {Object.entries(cityData.contentSections.timeline).map(([period, task], idx) => (
                      <div key={idx} style={{
                        position: 'relative',
                        display: 'flex',
                        gap: '24px',
                        alignItems: 'start',
                      }}>
                        {/* Punto del timeline */}
                        <div style={{
                          position: 'absolute',
                          left: '-40px',
                          top: '12px',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: theme.colors.primary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: 600,
                          color: '#ffffff',
                          fontFamily: theme.fonts.body,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }}>
                          {idx + 1}
                        </div>
                        
                        {/* Contenido */}
                        <div style={{
                          flex: 1,
                          backgroundColor: '#ffffff',
                          borderRadius: '24px',
                          padding: '24px 28px',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                          border: '2px solid #F5EFE7',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateX(8px)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                          e.currentTarget.style.borderColor = theme.colors.primary;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
                          e.currentTarget.style.borderColor = '#F5EFE7';
                        }}>
                          <div style={{
                            display: 'inline-block',
                            fontFamily: theme.fonts.body,
                            fontSize: '13px',
                            fontWeight: 700,
                            color: theme.colors.primary,
                            backgroundColor: '#FFF5EB',
                            padding: '6px 14px',
                            borderRadius: '12px',
                            marginBottom: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}>
                            {period.replace('months', ' meses').replace('month', ' mes').replace('week', ' semana')}
                          </div>
                          <p style={{
                            fontFamily: theme.fonts.body,
                            fontSize: '16px',
                            color: theme.colors.textPrimary,
                            margin: 0,
                            lineHeight: '1.7',
                            fontWeight: 500,
                          }}>
                            {task}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Same Service in Nearby Cities */}
          {nearbyCities.length > 0 && (
            <div style={{ 
              padding: '80px 0',
              backgroundColor: theme.colors.backgroundSoft,
              borderRadius: theme.radius.xl,
              marginBottom: '80px',
            }}>
              <div className="px-8">
                <SectionTitle 
                  title={`${serviceData.name} en Ciudades Cercanas`}
                  subtitle="Explora otras opciones"
                />
                <div className="grid md:grid-cols-4 gap-6">
                  {nearbyCities.map((nearbyCity) => (
                    <div
                      key={nearbyCity.slug}
                      onClick={() => navigate(`/${country}/${nearbyCity.slug}/${service}`)}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: theme.radius.lg,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: `1px solid ${theme.colors.borderSoft}`,
                        transition: 'all 200ms',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = theme.shadow.md;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div
                        style={{
                          height: '120px',
                          backgroundImage: `url(${nearbyCity.heroImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                      <div style={{ padding: '16px' }}>
                        <h3 style={{
                          fontFamily: theme.fonts.body,
                          fontSize: '18px',
                          fontWeight: 600,
                          color: theme.colors.textPrimary,
                          marginBottom: '8px',
                        }}>
                          {nearbyCity.name}
                        </h3>
                        <p style={{
                          fontFamily: theme.fonts.body,
                          fontSize: '13px',
                          color: theme.colors.textSecondary,
                          margin: 0,
                        }}>
                          {nearbyCity.services[service]?.vendorCount || 0} proveedores
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Related Content - Interlinking SEO */}
          <div style={{ padding: '80px 0', borderTop: `1px solid ${theme.colors.borderSoft}` }}>
            <div className="max-w-4xl mx-auto">
              <h2 style={{ 
                fontFamily: theme.fonts.heading, 
                fontSize: '36px',
                fontWeight: 400,
                color: theme.colors.textPrimary,
                marginBottom: '48px',
                textAlign: 'center',
              }}>
                Lee También
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                <a href={`/blog/guia-completa-bodas-${cityData.slug}`} style={{ display: 'block', padding: '24px', backgroundColor: '#FFFBF7', borderRadius: '16px', border: '1px solid #F5EFE7', textDecoration: 'none', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ fontSize: '24px', marginBottom: '12px' }}>📖</div>
                  <h3 style={{ fontFamily: theme.fonts.body, fontSize: '16px', fontWeight: 600, color: theme.colors.textPrimary, marginBottom: '8px' }}>Guía Completa Bodas {cityData.name}</h3>
                  <p style={{ fontFamily: theme.fonts.body, fontSize: '14px', color: theme.colors.textSecondary, margin: 0 }}>Todo lo que necesitas saber</p>
                </a>

                <a href={`/blog/presupuesto-boda-${cityData.slug}-2026`} style={{ display: 'block', padding: '24px', backgroundColor: '#FFFBF7', borderRadius: '16px', border: '1px solid #F5EFE7', textDecoration: 'none', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ fontSize: '24px', marginBottom: '12px' }}>💰</div>
                  <h3 style={{ fontFamily: theme.fonts.body, fontSize: '16px', fontWeight: 600, color: theme.colors.textPrimary, marginBottom: '8px' }}>Presupuesto Detallado 2026</h3>
                  <p style={{ fontFamily: theme.fonts.body, fontSize: '14px', color: theme.colors.textSecondary, margin: 0 }}>Desglose completo de costos en {cityData.name}</p>
                </a>

                {relatedServices[0] && (
                  <a href={`/${country}/${city}/${relatedServices[0].slug}`} style={{ display: 'block', padding: '24px', backgroundColor: '#FFFBF7', borderRadius: '16px', border: '1px solid #F5EFE7', textDecoration: 'none', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{ fontSize: '24px', marginBottom: '12px' }}>🔗</div>
                    <h3 style={{ fontFamily: theme.fonts.body, fontSize: '16px', fontWeight: 600, color: theme.colors.textPrimary, marginBottom: '8px' }}>{relatedServices[0].name}</h3>
                    <p style={{ fontFamily: theme.fonts.body, fontSize: '14px', color: theme.colors.textSecondary, margin: 0 }}>También en {cityData.name}</p>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Ciudades Cercanas - Interlinking Geográfico */}
          {nearbyCities.length > 0 && (
            <div style={{ padding: '80px 0', backgroundColor: '#FAFAF8' }}>
              <div className="max-w-4xl mx-auto">
                <h2 style={{ fontFamily: theme.fonts.heading, fontSize: '32px', fontWeight: 400, color: theme.colors.textPrimary, marginBottom: '16px', textAlign: 'center' }}>
                  {serviceData.name} en Ciudades Cercanas
                </h2>
                <p style={{ fontFamily: theme.fonts.body, fontSize: '16px', color: theme.colors.textSecondary, marginBottom: '48px', textAlign: 'center' }}>
                  Explora opciones en otras ciudades de {cityData.countryName}
                </p>
                <div className="grid md:grid-cols-4 gap-4">
                  {nearbyCities.slice(0, 4).map((nearbyCity) => (
                    <a key={nearbyCity.slug} href={`/${nearbyCity.country}/${nearbyCity.slug}/${service}`} style={{ display: 'block', padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #F5EFE7', textDecoration: 'none', textAlign: 'center', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>📍</div>
                      <h3 style={{ fontFamily: theme.fonts.body, fontSize: '16px', fontWeight: 600, color: theme.colors.textPrimary, margin: 0 }}>{nearbyCity.name}</h3>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Final CTA */}
          <div style={{ 
            padding: '80px 0',
            textAlign: 'center',
          }}>
            <h2 style={{
              fontFamily: theme.fonts.heading,
              fontSize: '42px',
              fontWeight: 400,
              color: theme.colors.textPrimary,
              marginBottom: '24px',
            }}>
              Empieza a Planificar tu Boda en {cityData.name}
            </h2>
            <p style={{
              fontFamily: theme.fonts.body,
              fontSize: '18px',
              color: theme.colors.textSecondary,
              marginBottom: '32px',
            }}>
              Gratis hasta 80 invitados. Sin tarjeta de crédito.
            </p>
            <PrimaryButton onClick={() => navigate('/signup')}>
              Crear Cuenta Gratis
              <ArrowRight size={20} style={{ marginLeft: '8px' }} />
            </PrimaryButton>
          </div>

          {/* Footer con enlaces SEO */}
          <footer 
            className="border-t mx-6 py-12 mt-16"
            style={{ borderColor: theme.colors.borderSubtle }}
          >
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-6 gap-8 mb-8">
                <div>
                  <h4 style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '16px',
                    fontWeight: 600,
                    color: theme.colors.textPrimary,
                    marginBottom: '16px',
                  }}>
                    {t('marketing:footer.product')}
                  </h4>
                  <div className="space-y-3">
                    {[
                      { label: t('marketing:footer.features'), link: '/app' },
                      { label: t('marketing:footer.pricing'), link: '/precios' },
                      { label: t('marketing:footer.demo'), link: '/signup' },
                    ].map((item, index) => (
                      <div key={index}>
                        <button
                          onClick={() => navigate(item.link)}
                          style={{
                            fontFamily: theme.fonts.body,
                            fontSize: '14px',
                            color: theme.colors.textSecondary,
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            transition: 'color 200ms',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
                          onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
                        >
                          {item.label}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '16px',
                    fontWeight: 600,
                    color: theme.colors.textPrimary,
                    marginBottom: '16px',
                  }}>
                    {t('marketing:footer.forProfessionals')}
                  </h4>
                  <div className="space-y-3">
                    {[
                      { label: t('marketing:footer.suppliers'), link: '/para-proveedores' },
                      { label: t('marketing:footer.planners'), link: '/para-planners' },
                      { label: t('marketing:footer.partners'), link: '/partners' },
                    ].map((item, index) => (
                      <div key={index}>
                        <button
                          onClick={() => navigate(item.link)}
                          style={{
                            fontFamily: theme.fonts.body,
                            fontSize: '14px',
                            color: theme.colors.textSecondary,
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            transition: 'color 200ms',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
                          onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
                        >
                          {item.label}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '16px',
                    fontWeight: 600,
                    color: theme.colors.textPrimary,
                    marginBottom: '16px',
                  }}>
                    {t('marketing:footer.company')}
                  </h4>
                  <div className="space-y-3">
                    {[
                      { label: t('marketing:footer.about'), link: '/about' },
                      { label: t('marketing:footer.contact'), link: '/contacto' },
                      { label: t('marketing:footer.blog'), link: '/blog' },
                    ].map((item, index) => (
                      <div key={index}>
                        <button
                          onClick={() => navigate(item.link)}
                          style={{
                            fontFamily: theme.fonts.body,
                            fontSize: '14px',
                            color: theme.colors.textSecondary,
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            transition: 'color 200ms',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
                          onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
                        >
                          {item.label}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '16px',
                    fontWeight: 600,
                    color: theme.colors.textPrimary,
                    marginBottom: '16px',
                  }}>
                    {t('marketing:footer.support')}
                  </h4>
                  <div className="space-y-3">
                    {[
                      { label: t('marketing:footer.help'), link: '/help' },
                      { label: t('marketing:footer.privacy'), link: '/privacy' },
                      { label: t('marketing:footer.terms'), link: '/terms' },
                    ].map((item, index) => (
                      <div key={index}>
                        <button
                          onClick={() => navigate(item.link)}
                          style={{
                            fontFamily: theme.fonts.body,
                            fontSize: '14px',
                            color: theme.colors.textSecondary,
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            transition: 'color 200ms',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
                          onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
                        >
                          {item.label}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enlaces SEO de servicios - Dinámicos según ciudad actual */}
                <div>
                  <h4 style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '16px',
                    fontWeight: 600,
                    color: theme.colors.textPrimary,
                    marginBottom: '16px',
                  }}>
                    {t('marketing:footer.servicesIn', { city: cityData.name })}
                  </h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Bodas', slug: 'bodas' },
                      { label: 'Gestión de Invitados', slug: 'gestion-invitados-boda' },
                      { label: 'Presupuesto', slug: 'presupuesto-boda-online' },
                      { label: 'Seating Plan', slug: 'seating-plan-boda' },
                      { label: 'Catering', slug: 'catering-boda' },
                      { label: 'Fotografía', slug: 'fotografia-boda' },
                    ].filter(item => cityData.services && cityData.services[item.slug]).slice(0, 6).map((item, index) => (
                      <div key={index}>
                        <a
                          href={`/${country}/${city}/${item.slug}`}
                          style={{
                            fontFamily: theme.fonts.body,
                            fontSize: '14px',
                            color: theme.colors.textSecondary,
                            textDecoration: 'none',
                            transition: 'color 200ms',
                            display: 'block',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
                          onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
                        >
                          {item.label}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enlaces SEO de ciudades - Dinámicos según ciudades cercanas */}
                <div>
                  <h4 style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '16px',
                    fontWeight: 600,
                    color: theme.colors.textPrimary,
                    marginBottom: '16px',
                  }}>
                    {t('marketing:footer.nearbyCities')}
                  </h4>
                  <div className="space-y-3">
                    {nearbyCities.slice(0, 6).map((nearbyCity, index) => (
                      <div key={index}>
                        <a
                          href={`/${nearbyCity.country}/${nearbyCity.slug}/bodas`}
                          style={{
                            fontFamily: theme.fonts.body,
                            fontSize: '14px',
                            color: theme.colors.textSecondary,
                            textDecoration: 'none',
                            transition: 'color 200ms',
                            display: 'block',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.primary}
                          onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
                        >
                          {nearbyCity.name}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t text-center" style={{ borderColor: theme.colors.borderSubtle }}>
                <p style={{
                  fontFamily: theme.fonts.body,
                  fontSize: '14px',
                  color: theme.colors.textSecondary,
                }}>
                  © 2025 Planivia. Making dream weddings come true.
                </p>
              </div>
            </div>
          </footer>
        </Container>
      </PageWrapper>
    </>
  );
}
