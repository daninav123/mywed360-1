import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Store, Users, TrendingUp, Award, Calendar, MessageSquare } from 'lucide-react';
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

export default function ForSuppliersNew() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const benefits = [
    {
      icon: Users,
      title: t('forSuppliers.benefits.exposure.title', { defaultValue: 'Reach More Couples' }),
      description: t('forSuppliers.benefits.exposure.description', { defaultValue: 'Get discovered by thousands of engaged couples actively planning their weddings' }),
      color: theme.colors.yellow,
      accentColor: theme.colors.yellowAccent,
    },
    {
      icon: Calendar,
      title: t('forSuppliers.benefits.bookings.title', { defaultValue: 'Manage Bookings' }),
      description: t('forSuppliers.benefits.bookings.description', { defaultValue: 'Streamline your calendar, quotes, and client communications in one place' }),
      color: theme.colors.pink,
      accentColor: theme.colors.pinkAccent,
    },
    {
      icon: TrendingUp,
      title: t('forSuppliers.benefits.grow.title', { defaultValue: 'Grow Your Business' }),
      description: t('forSuppliers.benefits.grow.description', { defaultValue: 'Access analytics, insights, and tools to expand your wedding services' }),
      color: theme.colors.green,
      accentColor: theme.colors.greenAccent,
    },
  ];

  const features = [
    {
      icon: Store,
      title: t('forSuppliers.features.profile.title', { defaultValue: 'Professional Profile' }),
      description: t('forSuppliers.features.profile.description', { defaultValue: 'Showcase your portfolio, services, and reviews with a beautiful vendor profile' }),
    },
    {
      icon: MessageSquare,
      title: t('forSuppliers.features.messaging.title', { defaultValue: 'Direct Messaging' }),
      description: t('forSuppliers.features.messaging.description', { defaultValue: 'Communicate directly with couples and respond to inquiries instantly' }),
    },
    {
      icon: Award,
      title: t('forSuppliers.features.reviews.title', { defaultValue: 'Build Trust' }),
      description: t('forSuppliers.features.reviews.description', { defaultValue: 'Collect verified reviews and ratings from real couples' }),
    },
  ];

  return (
    <PageWrapper>
      <HeroSection
        title={t('forSuppliers.hero.title', { defaultValue: 'Grow Your Wedding Business' })}
        subtitle={t('forSuppliers.hero.subtitle', { defaultValue: 'Connect with couples who are actively looking for talented vendors like you. Join our trusted network of wedding professionals.' })}
        image="/assets/services/suppliers.png"
      >
        <div className="flex gap-4">
          <PrimaryButton onClick={() => navigate('/suppliers/register')}>
            {t('forSuppliers.hero.cta.primary', { defaultValue: 'Join as Vendor' })}
          </PrimaryButton>
          <SecondaryButton onClick={() => navigate('/suppliers/login')}>
            {t('forSuppliers.hero.cta.secondary', { defaultValue: 'Vendor Login' })}
          </SecondaryButton>
        </div>
      </HeroSection>

      <Container>
        <SectionTitle 
          title={t('forSuppliers.benefits.title', { defaultValue: 'Why Join Our Platform?' })}
          subtitle={t('forSuppliers.benefits.subtitle', { defaultValue: 'Everything you need to succeed in the wedding industry' })}
        />
        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <FeatureCard key={index} {...benefit} />
          ))}
        </div>
      </Container>

      <Container>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 style={{
              fontFamily: theme.fonts.heading,
              fontSize: '36px',
              fontWeight: 400,
              color: theme.colors.textPrimary,
              marginBottom: '16px',
            }}>
              {t('forSuppliers.features.title', { defaultValue: 'Built for Wedding Professionals' })}
            </h2>
            <p style={{
              fontFamily: theme.fonts.body,
              fontSize: '16px',
              color: theme.colors.textSecondary,
              lineHeight: '1.6',
              marginBottom: '32px',
            }}>
              {t('forSuppliers.features.description', { defaultValue: 'Our platform provides all the tools you need to manage your wedding business efficiently and professionally.' })}
            </p>
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: theme.colors.lavender }}
                  >
                    <feature.icon className="w-6 h-6" style={{ color: theme.colors.primary }} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 style={{
                      fontFamily: theme.fonts.body,
                      fontSize: '18px',
                      fontWeight: 600,
                      color: theme.colors.textPrimary,
                      marginBottom: '4px',
                    }}>
                      {feature.title}
                    </h3>
                    <p style={{
                      fontFamily: theme.fonts.body,
                      fontSize: '14px',
                      color: theme.colors.textSecondary,
                      lineHeight: '1.6',
                    }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div 
            className="rounded-2xl overflow-hidden"
            style={{ boxShadow: theme.shadow.lg }}
          >
            <img 
              src="/assets/services/suppliers.png"
              alt="Vendor workspace"
              className="w-full h-auto"
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
          <h2 style={{
            fontFamily: theme.fonts.heading,
            fontSize: '40px',
            fontWeight: 400,
            color: theme.colors.textPrimary,
            marginBottom: '16px',
          }}>
            {t('forSuppliers.cta.title', { defaultValue: 'Ready to Grow Your Business?' })}
          </h2>
          <p style={{
            fontFamily: theme.fonts.body,
            fontSize: '18px',
            color: theme.colors.textSecondary,
            marginBottom: '32px',
          }}>
            {t('forSuppliers.cta.subtitle', { defaultValue: 'Join thousands of wedding professionals already growing with us' })}
          </p>
          <div className="flex gap-4 justify-center">
            <PrimaryButton onClick={() => navigate('/suppliers/register')}>
              {t('forSuppliers.cta.primary', { defaultValue: 'Create Vendor Account' })}
            </PrimaryButton>
            <SecondaryButton onClick={() => navigate('/precios')}>
              {t('forSuppliers.cta.secondary', { defaultValue: 'View Pricing' })}
            </SecondaryButton>
          </div>
        </div>
      </Container>

      <footer 
        className="border-t mx-6 py-8 mt-16"
        style={{ borderColor: theme.colors.borderSubtle }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <p style={{
            fontFamily: theme.fonts.body,
            fontSize: '14px',
            color: theme.colors.textSecondary,
          }}>
            {t('footer.copyright', { defaultValue: '© 2025 Wedding Planner. Making dream weddings come true.' })}
          </p>
        </div>
      </footer>
    </PageWrapper>
  );
}
