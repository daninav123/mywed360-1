import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, Heart, CheckCircle, Sparkles, Gift, Clock, Palette, Shield, ArrowRight, Store, Briefcase, BookOpen, PenTool } from 'lucide-react';
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

export default function LandingNew() {
  const navigate = useNavigate();
  const { t } = useTranslation(['marketing']);

  const mainFeatures = [
    {
      icon: Calendar,
      title: t('marketing:landing.features.planning.title'),
      description: t('marketing:landing.features.planning.description'),
      color: theme.colors.yellow,
      accentColor: theme.colors.yellowAccent,
    },
    {
      icon: Users,
      title: t('marketing:landing.features.guests.title'),
      description: t('marketing:landing.features.guests.description'),
      color: theme.colors.green,
      accentColor: theme.colors.greenAccent,
    },
    {
      icon: Heart,
      title: t('marketing:landing.features.vendors.title'),
      description: t('marketing:landing.features.vendors.description'),
      color: theme.colors.pink,
      accentColor: theme.colors.pinkAccent,
    },
  ];

  const benefits = [
    { icon: CheckCircle, text: t('marketing:landing.benefits.collaboration') },
    { icon: Clock, text: t('marketing:landing.benefits.time') },
    { icon: Shield, text: t('marketing:landing.benefits.security') },
    { icon: Palette, text: t('marketing:landing.benefits.design') },
    { icon: Gift, text: t('marketing:landing.benefits.registry') },
    { icon: Sparkles, text: t('marketing:landing.benefits.ai') },
  ];

  return (
    <>
      <Helmet>
        <title>Planivia - Planifica Tu Boda Perfecta | Software de Gestión de Bodas</title>
        <meta name="description" content="Organiza cada detalle de tu boda con Planivia. Gestión de invitados, presupuestos, proveedores y más. Prueba gratuita sin tarjeta de crédito." />
        <meta name="keywords" content="planificación bodas, organizar boda, software bodas, gestión invitados boda, presupuesto boda, proveedores boda" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Planivia - Planifica Tu Boda Perfecta" />
        <meta property="og:description" content="Software todo-en-uno para planificar tu boda. Gestión de invitados, presupuestos, proveedores y diseño web." />
        <meta property="og:url" content="https://planivia.net/" />
        <meta property="og:site_name" content="Planivia" />
        <meta property="og:locale" content="es_ES" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Planivia - Planifica Tu Boda Perfecta" />
        <meta name="twitter:description" content="Software todo-en-uno para planificar tu boda perfecta" />
        
        {/* Canonical */}
        <link rel="canonical" href="https://planivia.net/" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Planivia",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "description": "Plataforma completa para planificación de bodas con gestión de invitados, presupuestos, proveedores y diseño web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "2500"
            },
            "author": {
              "@type": "Organization",
              "name": "Planivia",
              "url": "https://planivia.net"
            }
          })}
        </script>
      </Helmet>
      
      <PageWrapper>
        <HeroSection
          title={t('marketing:landing.hero.title')}
          subtitle={t('marketing:landing.hero.subtitle')}
          image="/landing.png"
        >
          <div className="flex gap-4">
            <PrimaryButton onClick={() => navigate('/signup')}>
              {t('marketing:landing.hero.cta.primary')}
            </PrimaryButton>
            <SecondaryButton onClick={() => navigate('/app')}>
              {t('marketing:landing.hero.cta.secondary')}
            </SecondaryButton>
          </div>
        </HeroSection>

      <Container>
        <SectionTitle 
          title={t('marketing:landing.features.title')}
          subtitle={t('marketing:landing.features.subtitle')}
        />
        <div className="grid md:grid-cols-3 gap-6">
          {mainFeatures.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </Container>

      <Container>
        <SectionTitle 
          title={t('marketing:landing.benefits.title')}
          subtitle={t('marketing:landing.benefits.subtitle')}
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-6 rounded-2xl"
              style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.borderSoft}`,
                boxShadow: theme.shadow.sm,
              }}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: theme.colors.lavender }}
              >
                <benefit.icon className="w-5 h-5" style={{ color: theme.colors.primary }} strokeWidth={2} />
              </div>
              <p style={{
                fontFamily: theme.fonts.body,
                fontSize: '16px',
                fontWeight: 500,
                color: theme.colors.textPrimary,
              }}>
                {benefit.text}
              </p>
            </div>
          ))}
        </div>
      </Container>

      <Container>
        <div 
          className="rounded-3xl text-center"
          style={{
            background: theme.colors.heroGradient,
            padding: '64px 48px',
            boxShadow: theme.shadow.md,
          }}
        >
          <div className="max-w-3xl mx-auto">
            <Sparkles className="w-12 h-12 mx-auto mb-6" style={{ color: theme.colors.yellowAccent }} />
            <h2 style={{
              fontFamily: theme.fonts.heading,
              fontSize: '32px',
              fontWeight: 400,
              color: theme.colors.textPrimary,
              marginBottom: '16px',
              letterSpacing: '-0.01em',
            }}>
              {t('marketing:landing.social.title')}
            </h2>
            <p style={{
              fontFamily: theme.fonts.body,
              fontSize: '18px',
              color: theme.colors.textSecondary,
              marginBottom: '32px',
              lineHeight: '1.6',
            }}>
              {t('marketing:landing.social.quote')}
            </p>
            <p style={{
              fontFamily: theme.fonts.body,
              fontSize: '14px',
              fontWeight: 600,
              color: theme.colors.textSecondary,
            }}>
              {t('marketing:landing.social.author')}
            </p>
          </div>
        </div>
      </Container>

      <Container>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { value: '50K+', label: t('marketing:landing.stats.couples') },
            { value: '500+', label: t('marketing:landing.stats.vendors') },
            { value: '15M+', label: t('marketing:landing.stats.tasks') },
            { value: '4.9/5', label: t('marketing:landing.stats.rating') },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <p style={{
                fontFamily: theme.fonts.heading,
                fontSize: '48px',
                fontWeight: 400,
                color: theme.colors.primary,
                marginBottom: '8px',
              }}>
                {stat.value}
              </p>
              <p style={{
                fontFamily: theme.fonts.body,
                fontSize: '14px',
                color: theme.colors.textSecondary,
              }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </Container>

      <Container>
        <SectionTitle 
          title={t('marketing:landing.explore.title')}
          subtitle={t('marketing:landing.explore.subtitle')}
        />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Calendar,
              title: t('marketing:landing.explore.app.title'),
              description: t('marketing:landing.explore.app.description'),
              link: '/app',
              color: theme.colors.yellow,
            },
            {
              icon: Store,
              title: t('marketing:landing.explore.suppliers.title'),
              description: t('marketing:landing.explore.suppliers.description'),
              link: '/para-proveedores',
              color: theme.colors.pink,
            },
            {
              icon: Briefcase,
              title: t('marketing:landing.explore.planners.title'),
              description: t('marketing:landing.explore.planners.description'),
              link: '/para-planners',
              color: theme.colors.green,
            },
          ].map((item, index) => (
            <div
              key={index}
              onClick={() => navigate(item.link)}
              className="group cursor-pointer p-6 rounded-2xl transition-all duration-300"
              style={{
                backgroundColor: item.color,
                border: `1px solid ${theme.colors.borderSoft}`,
                boxShadow: theme.shadow.sm,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = theme.shadow.lg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = theme.shadow.sm;
              }}
            >
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: theme.colors.surface }}
              >
                <item.icon className="w-7 h-7" style={{ color: theme.colors.primary }} strokeWidth={2} />
              </div>
              <h3 style={{
                fontFamily: theme.fonts.body,
                fontSize: '20px',
                fontWeight: 600,
                color: theme.colors.textPrimary,
                marginBottom: '8px',
              }}>
                {item.title}
              </h3>
              <p style={{
                fontFamily: theme.fonts.body,
                fontSize: '14px',
                color: theme.colors.textSecondary,
                marginBottom: '16px',
                lineHeight: '1.6',
              }}>
                {item.description}
              </p>
              <div className="flex items-center gap-2">
                <span style={{
                  fontFamily: theme.fonts.body,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: theme.colors.primary,
                }}>
                  {t('marketing:landing.explore.learnMore')}
                </span>
                <ArrowRight className="w-4 h-4" style={{ color: theme.colors.primary }} strokeWidth={2} />
              </div>
            </div>
          ))}
        </div>
      </Container>

      <Container>
        <div 
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #E6D9FF 0%, #FCE4EC 100%)',
            boxShadow: theme.shadow.md,
          }}
        >
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-12 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.surface }}
                >
                  <BookOpen className="w-6 h-6" style={{ color: theme.colors.primary }} />
                </div>
                <PenTool className="w-8 h-8" style={{ color: theme.colors.pinkAccent }} />
              </div>
              <h2 style={{
                fontFamily: theme.fonts.heading,
                fontSize: '36px',
                fontWeight: 400,
                color: theme.colors.textPrimary,
                marginBottom: '16px',
                letterSpacing: '-0.01em',
              }}>
                {t('marketing:landing.blog.title')}
              </h2>
              <p style={{
                fontFamily: theme.fonts.body,
                fontSize: '18px',
                color: theme.colors.textSecondary,
                marginBottom: '32px',
                lineHeight: '1.6',
              }}>
                {t('marketing:landing.blog.description')}
              </p>
              <div>
                <PrimaryButton onClick={() => navigate('/blog')}>
                  {t('marketing:landing.blog.cta.primary')}
                </PrimaryButton>
              </div>
            </div>
            <div 
              className="h-full min-h-[400px] bg-cover bg-center"
              style={{
                backgroundImage: 'url(/sillas.png)',
              }}
            />
          </div>
        </div>
      </Container>

      <Container>
        <div 
          className="rounded-3xl text-center"
          style={{
            background: theme.colors.heroGradient,
            padding: '64px 48px',
            boxShadow: theme.shadow.md,
          }}
        >
          <Heart className="w-12 h-12 mx-auto mb-6" style={{ color: theme.colors.pinkAccent, fill: theme.colors.pinkAccent }} />
          <h2 style={{
            fontFamily: theme.fonts.heading,
            fontSize: '40px',
            fontWeight: 400,
            color: theme.colors.textPrimary,
            marginBottom: '16px',
            letterSpacing: '-0.01em',
          }}>
            {t('marketing:landing.cta.title')}
          </h2>
          <p style={{
            fontFamily: theme.fonts.body,
            fontSize: '18px',
            color: theme.colors.textSecondary,
            marginBottom: '32px',
          }}>
            {t('marketing:landing.cta.subtitle')}
          </p>
          <div className="flex gap-4 justify-center">
            <PrimaryButton onClick={() => navigate('/signup')}>
              {t('marketing:landing.cta.primary')}
            </PrimaryButton>
            <SecondaryButton onClick={() => navigate('/precios')}>
              {t('marketing:landing.cta.secondary')}
            </SecondaryButton>
          </div>
        </div>
      </Container>

      <footer 
        className="border-t mx-6 py-12 mt-16"
        style={{ borderColor: theme.colors.borderSubtle }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
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
          </div>

          <div className="pt-8 border-t text-center" style={{ borderColor: theme.colors.borderSubtle }}>
            <p style={{
              fontFamily: theme.fonts.body,
              fontSize: '14px',
              color: theme.colors.textSecondary,
            }}>
              {t('marketing:common.copyright', { year: 2025 })}
            </p>
          </div>
        </div>
      </footer>
      </PageWrapper>
    </>
  );
}
