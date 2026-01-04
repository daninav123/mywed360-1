import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DollarSign,
  Users,
  TrendingUp,
  BarChart3,
  Target,
  Award,
  UserPlus,
  Star,
  CheckCircle,
  Send,
  Heart,
  Sparkles
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

export default function PartnersNew() {
  const navigate = useNavigate();
  const { t } = useTranslation(['marketing']);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactExperience, setContactExperience] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formStatus, setFormStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const benefits = [
    {
      icon: DollarSign,
      title: t('marketing:partners.benefits.items.0.title'),
      description: t('marketing:partners.benefits.items.0.description'),
      color: theme.colors.yellow,
      accentColor: theme.colors.yellowAccent,
    },
    {
      icon: BarChart3,
      title: t('marketing:partners.benefits.items.1.title'),
      description: t('marketing:partners.benefits.items.1.description'),
      color: theme.colors.green,
      accentColor: theme.colors.greenAccent,
    },
    {
      icon: Target,
      title: t('marketing:partners.benefits.items.2.title'),
      description: t('marketing:partners.benefits.items.2.description'),
      color: theme.colors.pink,
      accentColor: theme.colors.pinkAccent,
    },
    {
      icon: Users,
      title: t('marketing:partners.benefits.items.3.title'),
      description: t('marketing:partners.benefits.items.3.description'),
      color: theme.colors.lavender,
      accentColor: theme.colors.primary,
    },
    {
      icon: Award,
      title: t('marketing:partners.benefits.items.4.title'),
      description: t('marketing:partners.benefits.items.4.description'),
      color: theme.colors.peach,
      accentColor: theme.colors.yellowAccent,
    },
    {
      icon: TrendingUp,
      title: t('marketing:partners.benefits.items.5.title'),
      description: t('marketing:partners.benefits.items.5.description'),
      color: theme.colors.sage,
      accentColor: theme.colors.greenAccent,
    },
  ];

  const processSteps = [
    {
      number: '1',
      title: t('marketing:partners.process.steps.0.title'),
      description: t('marketing:partners.process.steps.0.description'),
    },
    {
      number: '2',
      title: t('marketing:partners.process.steps.1.title'),
      description: t('marketing:partners.process.steps.1.description'),
    },
    {
      number: '3',
      title: t('marketing:partners.process.steps.2.title'),
      description: t('marketing:partners.process.steps.2.description'),
    },
    {
      number: '4',
      title: t('marketing:partners.process.steps.3.title'),
      description: t('marketing:partners.process.steps.3.description'),
    },
  ];

  const profiles = [
    {
      icon: UserPlus,
      title: t('marketing:partners.profiles.items.0.title'),
      description: t('marketing:partners.profiles.items.0.description'),
    },
    {
      icon: Star,
      title: t('marketing:partners.profiles.items.1.title'),
      description: t('marketing:partners.profiles.items.1.description'),
    },
    {
      icon: Users,
      title: t('marketing:partners.profiles.items.2.title'),
      description: t('marketing:partners.profiles.items.2.description'),
    },
  ];

  const experienceOptions = [
    { value: 'consultant', label: t('marketing:partners.form.fields.experience.options.0.label') },
    { value: 'influencer', label: t('marketing:partners.form.fields.experience.options.1.label') },
    { value: 'event-pro', label: t('marketing:partners.form.fields.experience.options.2.label') },
    { value: 'supplier', label: t('marketing:partners.form.fields.experience.options.3.label') },
    { value: 'other', label: t('marketing:partners.form.fields.experience.options.4.label') },
  ];

  const handleContactSubmit = (event) => {
    event.preventDefault();

    if (!contactName.trim() || !contactEmail.trim()) {
      setFormMessage(t('marketing:partners.form.messages.error'));
      setFormStatus('error');
      return;
    }

    setIsSubmitting(true);
    setFormMessage('');
    setFormStatus(null);

    window.setTimeout(() => {
      setFormMessage(t('marketing:partners.form.messages.success'));
      setFormStatus('success');
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setContactExperience('');
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <>
      <Helmet>
        <title>Planivia para Proveedores de Bodas | Recibe Contactos Cualificados</title>
        <meta name="description" content="Únete a la red de proveedores de bodas de Planivia. Genera leads cualificados, gestiona solicitudes y haz crecer tu negocio. Sistema de pago por vista." />
        <meta name="keywords" content="proveedores bodas, red proveedores boda, leads bodas, contactos bodas, marketplace bodas" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Planivia para Proveedores de Bodas" />
        <meta property="og:description" content="Genera leads cualificados y haz crecer tu negocio de bodas con Planivia. Sistema justo de pago por vista." />
        <meta property="og:url" content="https://planivia.net/para-proveedores" />
        <meta property="og:image" content="https://images.unsplash.com/photo-1464047736614-af63643285bf?w=1200&h=630&fit=crop&fm=jpg&q=80" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Plataforma para proveedores de bodas" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Planivia para Proveedores de Bodas" />
        <meta name="twitter:description" content="Genera leads y haz crecer tu negocio de bodas" />
        <meta name="twitter:image" content="https://images.unsplash.com/photo-1464047736614-af63643285bf?w=1200&h=630&fit=crop&fm=jpg&q=80" />
        <meta name="twitter:image:alt" content="Plataforma para proveedores de bodas" />
        
        {/* Canonical */}
        <link rel="canonical" href="https://planivia.net/para-proveedores" />
        
        {/* Structured Data - Service */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Wedding Vendor Marketplace",
            "provider": {
              "@type": "Organization",
              "name": "Planivia",
              "url": "https://planivia.net"
            },
            "name": "Planivia para Proveedores de Bodas",
            "description": "Plataforma para proveedores de bodas. Recibe contactos cualificados de parejas buscando servicios para su boda. Sistema justo de pago por vista.",
              "@type": "Audience",
              "audienceType": "Proveedores y profesionales de bodas"
            },
            "offers": {
              "@type": "Offer",
              "url": "https://planivia.net/para-proveedores",
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock",
              "description": "Sistema de pago por visualización con portafolio, analítica y mensajería integrada"
            }
          })}
        </script>
      </Helmet>
      
      <PageWrapper>
        <HeroSection
        title={t('marketing:partners.hero.title')}
        subtitle={t('marketing:partners.hero.description.0') + ' ' + t('marketing:partners.hero.description.1')}
        image="/assets/services/partners.png"
      >
        <div className="flex gap-4">
          <PrimaryButton onClick={() => document.getElementById('partners-form')?.scrollIntoView({ behavior: 'smooth' })}>
            {t('marketing:partners.hero.cta')}
          </PrimaryButton>
          <SecondaryButton onClick={() => navigate('/contacto')}>
            {t('marketing:nav.contact')}
          </SecondaryButton>
        </div>
      </HeroSection>

      <Container>
        <SectionTitle
          title={t('marketing:partners.benefits.title')}
          subtitle={t('marketing:partners.benefits.subtitle')}
        />
        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <FeatureCard key={index} {...benefit} />
          ))}
        </div>
      </Container>

      <Container>
        <SectionTitle
          title={t('marketing:partners.process.title')}
          subtitle={t('marketing:partners.process.subtitle')}
        />
        <div className="grid md:grid-cols-4 gap-8">
          {processSteps.map((step, index) => (
            <div key={index} className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{
                  backgroundColor: theme.colors.primary,
                  boxShadow: theme.shadow.lg,
                }}
              >
                <span style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: '24px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                }}>
                  {step.number}
                </span>
              </div>
              <h3 style={{
                fontFamily: theme.fonts.body,
                fontSize: '18px',
                fontWeight: 600,
                color: theme.colors.textPrimary,
                marginBottom: '8px',
              }}>
                {step.title}
              </h3>
              <p style={{
                fontFamily: theme.fonts.body,
                fontSize: '14px',
                color: theme.colors.textSecondary,
                lineHeight: '1.6',
              }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </Container>

      <Container>
        <SectionTitle
          title={t('marketing:partners.profiles.title')}
          subtitle={t('marketing:partners.profiles.subtitle')}
        />
        <div className="grid md:grid-cols-3 gap-6">
          {profiles.map((profile, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl"
              style={{
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.borderSoft}`,
                boxShadow: theme.shadow.sm,
              }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: theme.colors.lavender }}
              >
                <profile.icon className="w-7 h-7" style={{ color: theme.colors.primary }} strokeWidth={2} />
              </div>
              <h3 style={{
                fontFamily: theme.fonts.body,
                fontSize: '20px',
                fontWeight: 600,
                color: theme.colors.textPrimary,
                marginBottom: '8px',
              }}>
                {profile.title}
              </h3>
              <p style={{
                fontFamily: theme.fonts.body,
                fontSize: '14px',
                color: theme.colors.textSecondary,
                lineHeight: '1.6',
              }}>
                {profile.description}
              </p>
            </div>
          ))}
        </div>
      </Container>

      <Container>
        <div
          id="partners-form"
          className="max-w-2xl mx-auto p-8 rounded-3xl"
          style={{
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.borderSoft}`,
            boxShadow: theme.shadow.lg,
          }}
        >
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
              style={{ backgroundColor: theme.colors.lavender }}
            >
              <Send className="w-4 h-4" style={{ color: theme.colors.primary }} />
              <span style={{
                fontFamily: theme.fonts.body,
                fontSize: '12px',
                fontWeight: 600,
                color: theme.colors.primary,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {t('marketing:partners.form.badge')}
              </span>
            </div>
            <h2 style={{
              fontFamily: theme.fonts.heading,
              fontSize: '32px',
              fontWeight: 400,
              color: theme.colors.textPrimary,
              marginBottom: '12px',
              letterSpacing: '-0.01em',
            }}>
              {t('marketing:partners.form.title')}
            </h2>
            <p style={{
              fontFamily: theme.fonts.body,
              fontSize: '16px',
              color: theme.colors.textSecondary,
              lineHeight: '1.6',
            }}>
              {t('marketing:partners.form.description')}
            </p>
          </div>

          <form onSubmit={handleContactSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="contact-name"
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: theme.colors.textPrimary,
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                {t('marketing:partners.form.fields.name.label')}
              </label>
              <input
                id="contact-name"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={t('marketing:partners.form.fields.name.placeholder')}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontFamily: theme.fonts.body,
                  fontSize: '14px',
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.inputBg,
                  border: `1px solid ${theme.colors.borderSoft}`,
                  borderRadius: '12px',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                onBlur={(e) => e.target.style.borderColor = theme.colors.borderSoft}
              />
            </div>

            <div>
              <label
                htmlFor="contact-email"
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: theme.colors.textPrimary,
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                {t('marketing:partners.form.fields.email.label')}
              </label>
              <input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder={t('marketing:partners.form.fields.email.placeholder')}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontFamily: theme.fonts.body,
                  fontSize: '14px',
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.inputBg,
                  border: `1px solid ${theme.colors.borderSoft}`,
                  borderRadius: '12px',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                onBlur={(e) => e.target.style.borderColor = theme.colors.borderSoft}
              />
            </div>

            <div>
              <label
                htmlFor="contact-experience"
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: theme.colors.textPrimary,
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                {t('marketing:partners.form.fields.experience.label')}
              </label>
              <select
                id="contact-experience"
                value={contactExperience}
                onChange={(e) => setContactExperience(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontFamily: theme.fonts.body,
                  fontSize: '14px',
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.inputBg,
                  border: `1px solid ${theme.colors.borderSoft}`,
                  borderRadius: '12px',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                onBlur={(e) => e.target.style.borderColor = theme.colors.borderSoft}
              >
                <option value="">
                  {t('marketing:partners.form.fields.experience.placeholder')}
                </option>
                {experienceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="contact-message"
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: theme.colors.textPrimary,
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                {t('marketing:partners.form.fields.about.label')}
              </label>
              <textarea
                id="contact-message"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder={t('marketing:partners.form.fields.about.placeholder')}
                rows={5}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontFamily: theme.fonts.body,
                  fontSize: '14px',
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.inputBg,
                  border: `1px solid ${theme.colors.borderSoft}`,
                  borderRadius: '12px',
                  outline: 'none',
                  resize: 'vertical',
                }}
                onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                onBlur={(e) => e.target.style.borderColor = theme.colors.borderSoft}
              />
            </div>

            <PrimaryButton type="submit" disabled={isSubmitting} style={{ width: '100%' }}>
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting
                ? t('marketing:partners.form.submitting')
                : t('marketing:partners.form.submit')}
            </PrimaryButton>

            {formMessage && (
              <div
                className="p-4 rounded-xl text-center"
                style={{
                  backgroundColor: formStatus === 'success' ? theme.colors.sage : '#FEE2E2',
                  border: `1px solid ${formStatus === 'success' ? theme.colors.greenAccent : '#FCA5A5'}`,
                }}
              >
                <p style={{
                  fontFamily: theme.fonts.body,
                  fontSize: '14px',
                  color: formStatus === 'success' ? theme.colors.textPrimary : '#991B1B',
                  fontWeight: 500,
                }}>
                  {formMessage}
                </p>
              </div>
            )}
          </form>

          <div
            className="mt-6 p-4 rounded-xl text-center"
            style={{
              backgroundColor: theme.colors.lavender,
              border: `1px solid ${theme.colors.borderSoft}`,
            }}
          >
            <p style={{
              fontFamily: theme.fonts.body,
              fontSize: '12px',
              color: theme.colors.textSecondary,
              lineHeight: '1.6',
            }}>
              {t('marketing:partners.form.consent')}
            </p>
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
            {t('marketing:partners.finalCta.title')}
          </h2>
          <p style={{
            fontFamily: theme.fonts.body,
            fontSize: '18px',
            color: theme.colors.textSecondary,
            marginBottom: '32px',
          }}>
            {t('marketing:partners.finalCta.description')}
          </p>
          <PrimaryButton onClick={() => document.getElementById('partners-form')?.scrollIntoView({ behavior: 'smooth' })}>
            {t('marketing:partners.finalCta.primary')}
          </PrimaryButton>
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
