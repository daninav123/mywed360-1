import React from 'react';
import { Helmet } from 'react-helmet-async';
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
  const { t } = useTranslation(['marketing']);

  const coreModules = [
    {
      icon: Calendar,
      title: t('marketing:appOverview.modules.timeline.title'),
      description: t('marketing:appOverview.modules.timeline.description'),
      color: theme.colors.yellow,
      accentColor: theme.colors.yellowAccent,
    },
    {
      icon: Users,
      title: t('marketing:appOverview.modules.guests.title'),
      description: t('marketing:appOverview.modules.guests.description'),
      color: theme.colors.pink,
      accentColor: theme.colors.pinkAccent,
    },
    {
      icon: DollarSign,
      title: t('marketing:appOverview.modules.budget.title'),
      description: t('marketing:appOverview.modules.budget.description'),
      color: theme.colors.green,
      accentColor: theme.colors.greenAccent,
    },
    {
      icon: Mail,
      title: t('marketing:appOverview.modules.communication.title'),
      description: t('marketing:appOverview.modules.communication.description'),
      color: theme.colors.lavender,
      accentColor: theme.colors.primary,
    },
    {
      icon: Palette,
      title: t('marketing:appOverview.modules.design.title'),
      description: t('marketing:appOverview.modules.design.description'),
      color: theme.colors.peach,
      accentColor: theme.colors.yellowAccent,
    },
    {
      icon: BarChart3,
      title: t('marketing:appOverview.modules.analytics.title'),
      description: t('marketing:appOverview.modules.analytics.description'),
      color: theme.colors.sage,
      accentColor: theme.colors.greenAccent,
    },
  ];

  const additionalFeatures = [
    { icon: CheckCircle, text: t('marketing:appOverview.features.vendors') },
    { icon: Bell, text: t('marketing:appOverview.features.notifications') },
    { icon: Lock, text: t('marketing:appOverview.features.storage') },
    { icon: Zap, text: t('marketing:appOverview.features.mobile') },
    { icon: Users, text: t('marketing:appOverview.features.collaboration') },
    { icon: BarChart3, text: t('marketing:appOverview.features.export') },
  ];

  const collaborationBenefits = [
    t('marketing:appOverview.collaboration.sync'),
    t('marketing:appOverview.collaboration.permissions'),
    t('marketing:appOverview.collaboration.activity'),
    t('marketing:appOverview.collaboration.comments'),
  ];

  return (
    <>
      <Helmet>
        <title>Funcionalidades de Planivia | Gestión Completa de Bodas</title>
        <meta name="description" content="Descubre todas las funcionalidades de Planivia: gestión de invitados, presupuestos, proveedores, timeline, diseño web y más. Todo en una plataforma." />
        <meta name="keywords" content="funcionalidades planivia, módulos boda, gestión invitados, timeline boda, presupuesto boda" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Funcionalidades de Planivia" />
        <meta property="og:description" content="Plataforma completa con todos los módulos para planificar tu boda" />
        <meta property="og:url" content="https://planivia.net/app" />
        
        {/* Canonical */}
        <link rel="canonical" href="https://planivia.net/app" />
      </Helmet>
      
      <PageWrapper>
        <HeroSection
        title={t('marketing:appOverview.hero.title')}
        subtitle={t('marketing:appOverview.hero.subtitle')}
        image="/assets/services/default.webp"
      >
        <div className="flex gap-4">
          <PrimaryButton onClick={() => navigate('/signup')}>
            {t('marketing:appOverview.hero.cta.primary')}
          </PrimaryButton>
          <SecondaryButton onClick={() => navigate('/precios')}>
            {t('marketing:appOverview.hero.cta.secondary')}
          </SecondaryButton>
        </div>
      </HeroSection>

      <Container>
        <SectionTitle 
          title={t('marketing:appOverview.modulesTitle')}
          subtitle={t('marketing:appOverview.modulesSubtitle')}
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
            {t('marketing:appOverview.integration.title')}
          </h2>
          <p style={{
            fontFamily: theme.fonts.body,
            fontSize: '18px',
            color: theme.colors.textSecondary,
            marginBottom: '32px',
            maxWidth: '600px',
            margin: '0 auto 32px',
          }}>
            {t('marketing:appOverview.integration.subtitle')}
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
              src="/assets/services/default.webp"
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
              {t('marketing:appOverview.collaboration.title')}
            </h2>
            <p style={{
              fontFamily: theme.fonts.body,
              fontSize: '16px',
              color: theme.colors.textSecondary,
              lineHeight: '1.6',
              marginBottom: '24px',
            }}>
              {t('marketing:appOverview.collaboration.description')}
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
            {t('marketing:appOverview.cta.title')}
          </h2>
          <p style={{
            fontFamily: theme.fonts.body,
            fontSize: '18px',
            color: theme.colors.textSecondary,
            marginBottom: '32px',
          }}>
            {t('marketing:appOverview.cta.subtitle')}
          </p>
          <div className="flex gap-4 justify-center">
            <PrimaryButton onClick={() => navigate('/signup')}>
              {t('marketing:appOverview.cta.primary')}
            </PrimaryButton>
            <SecondaryButton onClick={() => navigate('/precios')}>
              {t('marketing:appOverview.cta.secondary')}
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
            {t('marketing:common.copyright', { year: 2025 })}
          </p>
        </div>
      </footer>
      </PageWrapper>
    </>
  );
}
