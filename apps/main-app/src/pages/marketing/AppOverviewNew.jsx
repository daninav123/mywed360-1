import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Mail, 
  Palette, 
  BarChart3,
  CheckCircle,
  Bell,
  Lock,
  Zap
} from 'lucide-react';
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

export default function AppOverviewNew() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const coreModules = [
    {
      icon: Calendar,
      title: t('appOverview.modules.timeline.title', { defaultValue: 'Smart Timeline' }),
      description: t('appOverview.modules.timeline.description', { defaultValue: 'Organize every detail with intelligent task management and automated reminders' }),
      color: theme.colors.yellow,
      accentColor: theme.colors.yellowAccent,
    },
    {
      icon: Users,
      title: t('appOverview.modules.guests.title', { defaultValue: 'Guest Management' }),
      description: t('appOverview.modules.guests.description', { defaultValue: 'Complete RSVP system with seating charts and dietary tracking' }),
      color: theme.colors.pink,
      accentColor: theme.colors.pinkAccent,
    },
    {
      icon: DollarSign,
      title: t('appOverview.modules.budget.title', { defaultValue: 'Budget & Finance' }),
      description: t('appOverview.modules.budget.description', { defaultValue: 'Track expenses, payments, and vendor contracts in real-time' }),
      color: theme.colors.green,
      accentColor: theme.colors.greenAccent,
    },
    {
      icon: Mail,
      title: t('appOverview.modules.communication.title', { defaultValue: 'Communication Hub' }),
      description: t('appOverview.modules.communication.description', { defaultValue: 'Send invitations, updates, and reminders to all guests' }),
      color: theme.colors.lavender,
      accentColor: theme.colors.primary,
    },
    {
      icon: Palette,
      title: t('appOverview.modules.design.title', { defaultValue: 'Design Studio' }),
      description: t('appOverview.modules.design.description', { defaultValue: 'Create beautiful invitations and wedding websites' }),
      color: theme.colors.peach,
      accentColor: theme.colors.yellowAccent,
    },
    {
      icon: BarChart3,
      title: t('appOverview.modules.analytics.title', { defaultValue: 'Analytics Dashboard' }),
      description: t('appOverview.modules.analytics.description', { defaultValue: 'Real-time insights and progress tracking for your wedding' }),
      color: theme.colors.sage,
      accentColor: theme.colors.greenAccent,
    },
  ];

  const additionalFeatures = [
    { icon: CheckCircle, text: t('appOverview.features.vendors', { defaultValue: 'Vendor management & contracts' }) },
    { icon: Bell, text: t('appOverview.features.notifications', { defaultValue: 'Smart notifications & reminders' }) },
    { icon: Lock, text: t('appOverview.features.storage', { defaultValue: 'Secure document storage' }) },
    { icon: Zap, text: t('appOverview.features.mobile', { defaultValue: 'Mobile app for iOS & Android' }) },
    { icon: Users, text: t('appOverview.features.collaboration', { defaultValue: 'Collaborative planning tools' }) },
    { icon: BarChart3, text: t('appOverview.features.export', { defaultValue: 'Export & reporting tools' }) },
  ];

  const collaborationBenefits = [
    t('appOverview.collaboration.sync', { defaultValue: 'Real-time sync across all devices' }),
    t('appOverview.collaboration.permissions', { defaultValue: 'Role-based permissions for team members' }),
    t('appOverview.collaboration.activity', { defaultValue: 'Activity feed with full history' }),
    t('appOverview.collaboration.comments', { defaultValue: 'Comments and notes on every item' }),
  ];

  return (
    <PageWrapper>
      <HeroSection
        title={t('appOverview.hero.title', { defaultValue: 'All-in-One Wedding Planning Platform' })}
        subtitle={t('appOverview.hero.subtitle', { defaultValue: 'Everything you need to plan, organize, and celebrate your perfect wedding day - all in one beautiful platform' })}
        image="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=80"
      >
        <div className="flex gap-4">
          <PrimaryButton onClick={() => navigate('/signup')}>
            {t('appOverview.hero.cta.primary', { defaultValue: 'Start Free Trial' })}
          </PrimaryButton>
          <SecondaryButton onClick={() => navigate('/precios')}>
            {t('appOverview.hero.cta.secondary', { defaultValue: 'See Pricing' })}
          </SecondaryButton>
        </div>
      </HeroSection>

      <Container>
        <SectionTitle 
          title={t('appOverview.modulesTitle', { defaultValue: 'Core Modules' })}
          subtitle={t('appOverview.modulesSubtitle', { defaultValue: 'Powerful tools designed to simplify every aspect of wedding planning' })}
        />
        <div className="grid md:grid-cols-3 gap-6">
          {coreModules.map((module, index) => (
            <FeatureCard key={index} {...module} />
          ))}
        </div>
      </Container>

      <Container>
        <div 
          className="rounded-3xl p-12 text-center"
          style={{
            background: theme.colors.heroGradient,
            boxShadow: theme.shadow.lg,
          }}
        >
          <h2 style={{
            fontFamily: theme.fonts.heading,
            fontSize: '36px',
            fontWeight: 400,
            color: theme.colors.textPrimary,
            marginBottom: '16px',
          }}>
            {t('appOverview.integration.title', { defaultValue: 'Everything Works Together Seamlessly' })}
          </h2>
          <p style={{
            fontFamily: theme.fonts.body,
            fontSize: '18px',
            color: theme.colors.textSecondary,
            marginBottom: '32px',
            maxWidth: '600px',
            margin: '0 auto 32px',
          }}>
            {t('appOverview.integration.subtitle', { defaultValue: 'All modules are deeply integrated to provide a unified experience. Changes sync automatically across every feature.' })}
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {additionalFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl text-left"
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.borderSoft}`,
                }}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  <feature.icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <p style={{
                  fontFamily: theme.fonts.body,
                  fontSize: '15px',
                  fontWeight: 500,
                  color: theme.colors.textPrimary,
                }}>
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>

      <Container>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div 
            className="rounded-2xl overflow-hidden"
            style={{ boxShadow: theme.shadow.lg }}
          >
            <img 
              src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&auto=format&fit=crop&q=80"
              alt="Planning collaboration"
              className="w-full h-auto"
            />
          </div>
          <div>
            <h2 style={{
              fontFamily: theme.fonts.heading,
              fontSize: '36px',
              fontWeight: 400,
              color: theme.colors.textPrimary,
              marginBottom: '16px',
            }}>
              {t('appOverview.collaboration.title', { defaultValue: 'Built for Collaboration' })}
            </h2>
            <p style={{
              fontFamily: theme.fonts.body,
              fontSize: '16px',
              color: theme.colors.textSecondary,
              lineHeight: '1.6',
              marginBottom: '24px',
            }}>
              {t('appOverview.collaboration.description', { defaultValue: 'Invite your partner, family, and wedding planner to collaborate in real-time. Everyone stays updated with automatic notifications and shared access to plans, budgets, and guest lists.' })}
            </p>
            <div className="space-y-3">
              {collaborationBenefits.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle 
                    className="w-5 h-5 flex-shrink-0 mt-0.5" 
                    style={{ color: theme.colors.greenAccent }}
                    strokeWidth={2}
                  />
                  <p style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '15px',
                    color: theme.colors.textPrimary,
                  }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
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
            {t('appOverview.cta.title', { defaultValue: 'Ready to Get Started?' })}
          </h2>
          <p style={{
            fontFamily: theme.fonts.body,
            fontSize: '18px',
            color: theme.colors.textSecondary,
            marginBottom: '32px',
          }}>
            {t('appOverview.cta.subtitle', { defaultValue: 'Join thousands of couples planning their dream wedding' })}
          </p>
          <div className="flex gap-4 justify-center">
            <PrimaryButton onClick={() => navigate('/signup')}>
              {t('appOverview.cta.primary', { defaultValue: 'Start Planning Free' })}
            </PrimaryButton>
            <SecondaryButton onClick={() => navigate('/precios')}>
              {t('appOverview.cta.secondary', { defaultValue: 'View Pricing Plans' })}
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
