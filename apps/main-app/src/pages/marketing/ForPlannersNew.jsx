import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Briefcase, Users, Calendar, BarChart3, Layers, Clock } from 'lucide-react';
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

export default function ForPlannersNew() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const benefits = [
    {
      icon: Layers,
      title: t('forPlanners.benefits.multi.title', { defaultValue: 'Multi-Wedding Management' }),
      description: t('forPlanners.benefits.multi.description', { defaultValue: 'Manage multiple weddings simultaneously with dedicated workspaces for each event' }),
      color: theme.colors.yellow,
      accentColor: theme.colors.yellowAccent,
    },
    {
      icon: Users,
      title: t('forPlanners.benefits.team.title', { defaultValue: 'Team Collaboration' }),
      description: t('forPlanners.benefits.team.description', { defaultValue: 'Work seamlessly with your team, vendors, and clients in one platform' }),
      color: theme.colors.pink,
      accentColor: theme.colors.pinkAccent,
    },
    {
      icon: BarChart3,
      title: t('forPlanners.benefits.analytics.title', { defaultValue: 'Business Analytics' }),
      description: t('forPlanners.benefits.analytics.description', { defaultValue: 'Track performance, revenue, and client satisfaction across all your events' }),
      color: theme.colors.green,
      accentColor: theme.colors.greenAccent,
    },
  ];

  const features = [
    {
      icon: Briefcase,
      title: t('forPlanners.features.templates.title', { defaultValue: 'Reusable Templates' }),
      description: t('forPlanners.features.templates.description', { defaultValue: 'Create and save templates for checklists, budgets, and timelines' }),
    },
    {
      icon: Calendar,
      title: t('forPlanners.features.scheduling.title', { defaultValue: 'Advanced Scheduling' }),
      description: t('forPlanners.features.scheduling.description', { defaultValue: 'Manage multiple event timelines with smart conflict detection' }),
    },
    {
      icon: Clock,
      title: t('forPlanners.features.automation.title', { defaultValue: 'Workflow Automation' }),
      description: t('forPlanners.features.automation.description', { defaultValue: 'Automate repetitive tasks and focus on what matters most' }),
    },
  ];

  return (
    <>
      <Helmet>
        <title>Planivia para Wedding Planners | Gestiona Múltiples Bodas</title>
        <meta name="description" content="Software profesional para wedding planners. Gestiona múltiples bodas, colabora con tu equipo, plantillas reutilizables y analíticas de negocio." />
        <meta name="keywords" content="software wedding planners, gestión múltiples bodas, herramientas wedding planner, CRM bodas" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Planivia para Wedding Planners" />
        <meta property="og:description" content="Gestiona tu negocio de wedding planning con herramientas profesionales" />
        <meta property="og:url" content="https://planivia.net/para-planners" />
        
        {/* Canonical */}
        <link rel="canonical" href="https://planivia.net/para-planners" />
      </Helmet>
      
      <PageWrapper>
        <HeroSection
        title={t('forPlanners.hero.title', { defaultValue: 'Scale Your Planning Business' })}
        subtitle={t('forPlanners.hero.subtitle', { defaultValue: 'Professional tools designed for wedding planners who manage multiple events. Streamline operations and deliver exceptional experiences.' })}
        image="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop&q=80"
      >
        <div className="flex gap-4">
          <PrimaryButton onClick={() => navigate('/signup?planner=true')}>
            {t('forPlanners.hero.cta.primary', { defaultValue: 'Start Free Trial' })}
          </PrimaryButton>
          <SecondaryButton onClick={() => navigate('/precios')}>
            {t('forPlanners.hero.cta.secondary', { defaultValue: 'View Planner Pricing' })}
          </SecondaryButton>
        </div>
      </HeroSection>

      <Container>
        <SectionTitle 
          title={t('forPlanners.benefits.title', { defaultValue: 'Built for Professional Planners' })}
          subtitle={t('forPlanners.benefits.subtitle', { defaultValue: 'Everything you need to manage your wedding planning business' })}
        />
        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <FeatureCard key={index} {...benefit} />
          ))}
        </div>
      </Container>

      <Container>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div 
            placeholder={t('forPlanners.agencyNamePlaceholder')} 
            className="rounded-2xl overflow-hidden"
            style={{ boxShadow: theme.shadow.lg }}
          >
            <img 
              src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&auto=format&fit=crop&q=80"
              alt="Planner working"
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
              {t('forPlanners.features.title', { defaultValue: 'Powerful Features for Your Team' })}
            </h2>
            <p style={{
              fontFamily: theme.fonts.body,
              fontSize: '16px',
              color: theme.colors.textSecondary,
              lineHeight: '1.6',
              marginBottom: '32px',
            }}>
              {t('forPlanners.features.description', { defaultValue: 'Manage your entire planning operation from one central platform. From initial consultation to the wedding day.' })}
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
            {t('forPlanners.cta.title', { defaultValue: 'Ready to Transform Your Business?' })}
          </h2>
          <p style={{
            fontFamily: theme.fonts.body,
            fontSize: '18px',
            color: theme.colors.textSecondary,
            marginBottom: '32px',
          }}>
            {t('forPlanners.cta.subtitle', { defaultValue: 'Join hundreds of professional planners already using our platform' })}
          </p>
          <div className="flex gap-4 justify-center">
            <PrimaryButton onClick={() => navigate('/signup?planner=true')}>
              {t('forPlanners.cta.primary', { defaultValue: 'Start 14-Day Free Trial' })}
            </PrimaryButton>
            <SecondaryButton onClick={() => navigate('/precios')}>
              {t('forPlanners.cta.secondary', { defaultValue: 'Compare Plans' })}
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
    </>
  );
}
