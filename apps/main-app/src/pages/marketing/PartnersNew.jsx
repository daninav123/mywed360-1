import React, { useState } from 'react';
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
  const { t } = useTranslation();
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
      title: t('partners.benefits.commissions.title', { defaultValue: 'Attractive Commissions' }),
      description: t('partners.benefits.commissions.description', { defaultValue: 'Earn recurring commissions for every subscription you sell' }),
      color: theme.colors.yellow,
      accentColor: theme.colors.yellowAccent,
    },
    {
      icon: BarChart3,
      title: t('partners.benefits.dashboard.title', { defaultValue: 'Tracking Dashboard' }),
      description: t('partners.benefits.dashboard.description', { defaultValue: 'Monitor your conversions, commissions and statistics in real time' }),
      color: theme.colors.green,
      accentColor: theme.colors.greenAccent,
    },
    {
      icon: Target,
      title: t('partners.benefits.materials.title', { defaultValue: 'Marketing Materials' }),
      description: t('partners.benefits.materials.description', { defaultValue: 'Access presentations, demos and resources to facilitate your sales' }),
      color: theme.colors.pink,
      accentColor: theme.colors.pinkAccent,
    },
    {
      icon: Users,
      title: t('partners.benefits.support.title', { defaultValue: 'Dedicated Support' }),
      description: t('partners.benefits.support.description', { defaultValue: 'Support team available to help you with your clients' }),
      color: theme.colors.lavender,
      accentColor: theme.colors.primary,
    },
    {
      icon: Award,
      title: t('partners.benefits.training.title', { defaultValue: 'Training Included' }),
      description: t('partners.benefits.training.description', { defaultValue: 'Complete training on the platform and best sales practices' }),
      color: theme.colors.peach,
      accentColor: theme.colors.yellowAccent,
    },
    {
      icon: TrendingUp,
      title: t('partners.benefits.unlimited.title', { defaultValue: 'No Limits' }),
      description: t('partners.benefits.unlimited.description', { defaultValue: 'No ceiling on your commissions. The more you sell, the more you earn' }),
      color: theme.colors.sage,
      accentColor: theme.colors.greenAccent,
    },
  ];

  const processSteps = [
    {
      number: '1',
      title: t('partners.process.step1.title', { defaultValue: 'Join the Program' }),
      description: t('partners.process.step1.description', { defaultValue: 'Complete the application form and await our approval' }),
    },
    {
      number: '2',
      title: t('partners.process.step2.title', { defaultValue: 'Receive Training' }),
      description: t('partners.process.step2.description', { defaultValue: 'Access materials and training sessions about the platform' }),
    },
    {
      number: '3',
      title: t('partners.process.step3.title', { defaultValue: 'Share Your Link' }),
      description: t('partners.process.step3.description', { defaultValue: 'Receive your unique affiliate link to track your conversions' }),
    },
    {
      number: '4',
      title: t('partners.process.step4.title', { defaultValue: 'Earn Commissions' }),
      description: t('partners.process.step4.description', { defaultValue: 'Receive recurring commissions for every client who subscribes' }),
    },
  ];

  const profiles = [
    {
      icon: UserPlus,
      title: t('partners.profiles.consultants.title', { defaultValue: 'Wedding Consultants' }),
      description: t('partners.profiles.consultants.description', { defaultValue: 'Advisors who work with couples and can recommend professional tools' }),
    },
    {
      icon: Star,
      title: t('partners.profiles.influencers.title', { defaultValue: 'Industry Influencers' }),
      description: t('partners.profiles.influencers.description', { defaultValue: 'Content creators with audiences interested in wedding organization' }),
    },
    {
      icon: Users,
      title: t('partners.profiles.eventPros.title', { defaultValue: 'Event Professionals' }),
      description: t('partners.profiles.eventPros.description', { defaultValue: 'Event organizers who can introduce our platform to their contact network' }),
    },
  ];

  const experienceOptions = [
    { value: 'consultant', label: t('partners.form.experience.consultant', { defaultValue: 'Wedding Consultant' }) },
    { value: 'influencer', label: t('partners.form.experience.influencer', { defaultValue: 'Influencer / Content Creator' }) },
    { value: 'event-pro', label: t('partners.form.experience.eventPro', { defaultValue: 'Event Professional' }) },
    { value: 'supplier', label: t('partners.form.experience.supplier', { defaultValue: 'Wedding Services Provider' }) },
    { value: 'other', label: t('partners.form.experience.other', { defaultValue: 'Other' }) },
  ];

  const handleContactSubmit = (event) => {
    event.preventDefault();

    if (!contactName.trim() || !contactEmail.trim()) {
      setFormMessage(t('partners.form.error', { defaultValue: 'Please complete all required fields' }));
      setFormStatus('error');
      return;
    }

    setIsSubmitting(true);
    setFormMessage('');
    setFormStatus(null);

    window.setTimeout(() => {
      setFormMessage(t('partners.form.success', { defaultValue: 'Thank you for your interest! We will review your application and contact you soon' }));
      setFormStatus('success');
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setContactExperience('');
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <PageWrapper>
      <HeroSection
        title={t('partners.hero.title', { defaultValue: 'Earn Commissions Helping Couples Organize Their Perfect Wedding' })}
        subtitle={t('partners.hero.subtitle', { defaultValue: 'Join our partner program and receive recurring commissions for every client you refer. No initial investment. Attractive commissions. Marketing materials included.' })}
        image="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&auto=format&fit=crop&q=80"
      >
        <div className="flex gap-4">
          <PrimaryButton onClick={() => document.getElementById('partners-form')?.scrollIntoView({ behavior: 'smooth' })}>
            {t('partners.hero.cta', { defaultValue: 'Apply to Program' })}
          </PrimaryButton>
          <SecondaryButton onClick={() => navigate('/contacto')}>
            {t('partners.hero.secondary', { defaultValue: 'Contact Us' })}
          </SecondaryButton>
        </div>
      </HeroSection>

      <Container>
        <SectionTitle
          title={t('partners.benefits.title', { defaultValue: 'Why Be a Partner' })}
          subtitle={t('partners.benefits.subtitle', { defaultValue: 'Benefits designed to maximize your income potential' })}
        />
        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <FeatureCard key={index} {...benefit} />
          ))}
        </div>
      </Container>

      <Container>
        <SectionTitle
          title={t('partners.process.title', { defaultValue: 'How It Works' })}
          subtitle={t('partners.process.subtitle', { defaultValue: 'Start generating income in 4 simple steps' })}
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
          title={t('partners.profiles.title', { defaultValue: 'Are You a Good Candidate?' })}
          subtitle={t('partners.profiles.subtitle', { defaultValue: 'We seek professionals with connections in the wedding industry' })}
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
                {t('partners.form.badge', { defaultValue: 'Access Request' })}
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
              {t('partners.form.title', { defaultValue: 'Join the Partner Program' })}
            </h2>
            <p style={{
              fontFamily: theme.fonts.body,
              fontSize: '16px',
              color: theme.colors.textSecondary,
              lineHeight: '1.6',
            }}>
              {t('partners.form.description', { defaultValue: 'Complete the form and our team will review your application. We will contact you within 48 hours.' })}
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
                {t('partners.form.name', { defaultValue: 'Full Name *' })}
              </label>
              <input
                id="contact-name"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={t('partners.form.namePlaceholder', { defaultValue: 'Your name' })}
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
                {t('partners.form.email', { defaultValue: 'Email *' })}
              </label>
              <input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder={t('partners.form.emailPlaceholder', { defaultValue: 'your@email.com' })}
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
                {t('partners.form.experienceLabel', { defaultValue: 'Industry Experience' })}
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
                  {t('partners.form.experiencePlaceholder', { defaultValue: 'Select an option' })}
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
                {t('partners.form.about', { defaultValue: 'Tell us about you' })}
              </label>
              <textarea
                id="contact-message"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder={t('partners.form.aboutPlaceholder', { defaultValue: 'Describe your experience, your contact network and why you want to be a partner...' })}
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
                ? t('partners.form.submitting', { defaultValue: 'Sending...' })
                : t('partners.form.submit', { defaultValue: 'Submit Application' })}
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
              {t('partners.form.consent', { defaultValue: 'By submitting this form you agree that we review your profile and contact you. We do not share your information with third parties.' })}
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
            {t('partners.cta.title', { defaultValue: 'Ready to Start Generating Recurring Income?' })}
          </h2>
          <p style={{
            fontFamily: theme.fonts.body,
            fontSize: '18px',
            color: theme.colors.textSecondary,
            marginBottom: '32px',
          }}>
            {t('partners.cta.subtitle', { defaultValue: 'Join our partner program and start earning commissions today' })}
          </p>
          <PrimaryButton onClick={() => document.getElementById('partners-form')?.scrollIntoView({ behavior: 'smooth' })}>
            {t('partners.cta.primary', { defaultValue: 'Apply Now' })}
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
            {t('footer.copyright', { defaultValue: '© 2025 Wedding Planner. Making dream weddings come true.' })}
          </p>
        </div>
      </footer>
    </PageWrapper>
  );
}
