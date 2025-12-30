import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, Heart, CheckCircle, Sparkles, Gift, Clock, Palette, Shield, ArrowRight, Store, Briefcase } from 'lucide-react';
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
  const { t } = useTranslation();

  const mainFeatures = [
    {
      icon: Calendar,
      title: t('landing.features.planning.title', { defaultValue: 'Smart Planning' }),
      description: t('landing.features.planning.description', { defaultValue: 'Organize every detail with intelligent timelines and automated reminders' }),
      color: theme.colors.yellow,
      accentColor: theme.colors.yellowAccent,
    },
    {
      icon: Users,
      title: t('landing.features.guests.title', { defaultValue: 'Guest Management' }),
      description: t('landing.features.guests.description', { defaultValue: 'Track RSVPs, dietary preferences, and seating arrangements effortlessly' }),
      color: theme.colors.green,
      accentColor: theme.colors.greenAccent,
    },
    {
      icon: Heart,
      title: t('landing.features.vendors.title', { defaultValue: 'Vendor Network' }),
      description: t('landing.features.vendors.description', { defaultValue: 'Connect with trusted wedding professionals and manage all communications' }),
      color: theme.colors.pink,
      accentColor: theme.colors.pinkAccent,
    },
  ];

  const benefits = [
    { icon: CheckCircle, text: t('landing.benefits.collaboration', { defaultValue: 'Real-time collaboration with your partner' }) },
    { icon: Clock, text: t('landing.benefits.time', { defaultValue: 'Save hours with automated workflows' }) },
    { icon: Shield, text: t('landing.benefits.security', { defaultValue: 'Secure document storage and contracts' }) },
    { icon: Palette, text: t('landing.benefits.design', { defaultValue: 'Beautiful customizable designs' }) },
    { icon: Gift, text: t('landing.benefits.registry', { defaultValue: 'Integrated gift registry management' }) },
    { icon: Sparkles, text: t('landing.benefits.ai', { defaultValue: 'AI-powered planning assistant' }) },
  ];

  return (
    <PageWrapper>
      <HeroSection
        title={t('landing.hero.title', { defaultValue: 'Plan Your Perfect Wedding' })}
        subtitle={t('landing.hero.subtitle', { defaultValue: "From 'Yes!' to 'I Do' - organize every magical moment with the platform loved by thousands of couples worldwide" })}
        image="https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80"
      >
        <div className="flex gap-4">
          <PrimaryButton onClick={() => navigate('/signup')}>
            {t('landing.hero.cta.primary', { defaultValue: 'Start Planning Free' })}
          </PrimaryButton>
          <SecondaryButton onClick={() => navigate('/app')}>
            {t('landing.hero.cta.secondary', { defaultValue: 'See How It Works' })}
          </SecondaryButton>
        </div>
      </HeroSection>

      <Container>
        <SectionTitle 
          title={t('landing.features.title', { defaultValue: 'Everything You Need, Beautifully Organized' })}
          subtitle={t('landing.features.subtitle', { defaultValue: 'Powerful tools designed for modern couples' })}
        />
        <div className="grid md:grid-cols-3 gap-6">
          {mainFeatures.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </Container>

      <Container>
        <SectionTitle 
          title={t('landing.benefits.title', { defaultValue: 'Designed for Your Journey' })}
          subtitle={t('landing.benefits.subtitle', { defaultValue: 'From engagement to honeymoon, we\'ve got you covered' })}
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
              {t('landing.social.title', { defaultValue: 'Join 50,000+ Couples Planning Their Dream Wedding' })}
            </h2>
            <p style={{
              fontFamily: theme.fonts.body,
              fontSize: '18px',
              color: theme.colors.textSecondary,
              marginBottom: '32px',
              lineHeight: '1.6',
            }}>
              {t('landing.social.quote', { defaultValue: '"This platform transformed our wedding planning from overwhelming to enjoyable. Every detail organized beautifully in one place."' })}
            </p>
            <p style={{
              fontFamily: theme.fonts.body,
              fontSize: '14px',
              fontWeight: 600,
              color: theme.colors.textSecondary,
            }}>
              {t('landing.social.author', { defaultValue: '— Sarah & Michael, married June 2024' })}
            </p>
          </div>
        </div>
      </Container>

      <Container>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { value: '50K+', label: t('landing.stats.couples', { defaultValue: 'Happy Couples' }) },
            { value: '500+', label: t('landing.stats.vendors', { defaultValue: 'Trusted Vendors' }) },
            { value: '15M+', label: t('landing.stats.tasks', { defaultValue: 'Tasks Completed' }) },
            { value: '4.9/5', label: t('landing.stats.rating', { defaultValue: 'Average Rating' }) },
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
          title={t('landing.explore.title', { defaultValue: 'Explore Our Platform' })}
          subtitle={t('landing.explore.subtitle', { defaultValue: 'Discover all the features and services we offer' })}
        />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Calendar,
              title: t('landing.explore.app.title', { defaultValue: 'Wedding Planning App' }),
              description: t('landing.explore.app.description', { defaultValue: 'Complete suite of tools to organize your perfect day' }),
              link: '/app',
              color: theme.colors.yellow,
            },
            {
              icon: Store,
              title: t('landing.explore.suppliers.title', { defaultValue: 'For Suppliers' }),
              description: t('landing.explore.suppliers.description', { defaultValue: 'Grow your wedding business with our vendor network' }),
              link: '/para-proveedores',
              color: theme.colors.pink,
            },
            {
              icon: Briefcase,
              title: t('landing.explore.planners.title', { defaultValue: 'For Planners' }),
              description: t('landing.explore.planners.description', { defaultValue: 'Professional tools for wedding planning businesses' }),
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
                  {t('landing.explore.learnMore', { defaultValue: 'Learn More' })}
                </span>
                <ArrowRight className="w-4 h-4" style={{ color: theme.colors.primary }} strokeWidth={2} />
              </div>
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
          <Heart className="w-12 h-12 mx-auto mb-6" style={{ color: theme.colors.pinkAccent, fill: theme.colors.pinkAccent }} />
          <h2 style={{
            fontFamily: theme.fonts.heading,
            fontSize: '40px',
            fontWeight: 400,
            color: theme.colors.textPrimary,
            marginBottom: '16px',
            letterSpacing: '-0.01em',
          }}>
            {t('landing.cta.title', { defaultValue: 'Ready to Start Planning?' })}
          </h2>
          <p style={{
            fontFamily: theme.fonts.body,
            fontSize: '18px',
            color: theme.colors.textSecondary,
            marginBottom: '32px',
          }}>
            {t('landing.cta.subtitle', { defaultValue: 'Create your free account and start organizing your dream wedding today' })}
          </p>
          <div className="flex gap-4 justify-center">
            <PrimaryButton onClick={() => navigate('/signup')}>
              {t('landing.cta.primary', { defaultValue: 'Get Started Free' })}
            </PrimaryButton>
            <SecondaryButton onClick={() => navigate('/precios')}>
              {t('landing.cta.secondary', { defaultValue: 'View Pricing' })}
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
                {t('footer.product', { defaultValue: 'Product' })}
              </h4>
              <div className="space-y-3">
                {[
                  { label: t('footer.features', { defaultValue: 'Features' }), link: '/app' },
                  { label: t('footer.pricing', { defaultValue: 'Pricing' }), link: '/precios' },
                  { label: t('footer.demo', { defaultValue: 'Demo' }), link: '/signup' },
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
                {t('footer.forProfessionals', { defaultValue: 'For Professionals' })}
              </h4>
              <div className="space-y-3">
                {[
                  { label: t('footer.suppliers', { defaultValue: 'For Suppliers' }), link: '/para-proveedores' },
                  { label: t('footer.planners', { defaultValue: 'For Planners' }), link: '/para-planners' },
                  { label: t('footer.partners', { defaultValue: 'Partners' }), link: '/partners' },
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
                {t('footer.company', { defaultValue: 'Company' })}
              </h4>
              <div className="space-y-3">
                {[
                  { label: t('footer.about', { defaultValue: 'About Us' }), link: '/about' },
                  { label: t('footer.contact', { defaultValue: 'Contact' }), link: '/contacto' },
                  { label: t('footer.blog', { defaultValue: 'Blog' }), link: '/blog' },
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
                {t('footer.support', { defaultValue: 'Support' })}
              </h4>
              <div className="space-y-3">
                {[
                  { label: t('footer.help', { defaultValue: 'Help Center' }), link: '/help' },
                  { label: t('footer.privacy', { defaultValue: 'Privacy Policy' }), link: '/privacy' },
                  { label: t('footer.terms', { defaultValue: 'Terms of Service' }), link: '/terms' },
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
              {t('footer.copyright', { defaultValue: '© 2025 Wedding Planner. Making dream weddings come true.' })}
            </p>
          </div>
        </div>
      </footer>
    </PageWrapper>
  );
}
