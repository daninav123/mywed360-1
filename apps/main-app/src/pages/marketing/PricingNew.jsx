import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, Heart, Crown } from 'lucide-react';
import { 
  PageWrapper, 
  HeroSection, 
  PrimaryButton, 
  SecondaryButton, 
  SectionTitle, 
  Container,
  theme 
} from '../../components/theme/WeddingTheme';

export default function PricingNew() {
  const { t } = useTranslation('marketing');
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Free',
      icon: Heart,
      description: 'Perfecto para bodas íntimas',
      price: 0,
      color: theme.colors.yellow,
      accentColor: theme.colors.yellowAccent,
      features: [
        'Hasta 80 invitados',
        'Seating plan básico',
        'Gestión de finanzas',
        'Directorio de proveedores',
        '1 boda activa',
      ],
    },
    {
      name: 'Wedding Pass',
      icon: Sparkles,
      description: 'El más popular para bodas completas',
      price: 50,
      color: theme.colors.pink,
      accentColor: theme.colors.pinkAccent,
      popular: true,
      badge: t('pricing.plans.professional.badge'),
      features: [
        'Invitados ilimitados',
        'Contacto directo proveedores',
        'Protocolo completo',
        '50 diseños web',
        'Soporte prioritario',
        'Plantillas premium',
      ],
    },
    {
      name: 'Wedding Pass Plus',
      icon: Crown,
      description: 'Para bodas premium y eventos especiales',
      price: 85,
      color: theme.colors.green,
      accentColor: theme.colors.greenAccent,
      features: [
        'Todo lo de Wedding Pass',
        'Sin marca en invitaciones/PDF',
        'Biblioteca completa de diseños',
        'Editor web premium',
        'Galería de recuerdos',
        '1 ayudante incluido',
      ],
    },
  ];

  return (
    <>
      <Helmet>
        <title>Precios de Planivia - Planes desde 0€ | Software para Bodas</title>
        <meta name="description" content="Descubre los planes de Planivia para planificar tu boda. Plan Free gratis para siempre, Wedding Pass desde 50€. Sin permanencia, cancela cuando quieras." />
        <meta name="keywords" content="precios planivia, planes boda, software boda gratis, wedding pass, planificación bodas precio" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Precios de Planivia - Planes desde 0€" />
        <meta property="og:description" content="Elige el plan perfecto para tu boda. Desde el plan Free gratuito hasta Wedding Pass Plus con todas las funcionalidades." />
        <meta property="og:url" content="https://planivia.net/precios" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Precios de Planivia - Planes desde 0€" />
        <meta name="twitter:description" content="Elige el plan perfecto para tu boda" />
        
        {/* Canonical */}
        <link rel="canonical" href="https://planivia.net/precios" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Planivia Wedding Planning Software",
            "description": "Software completo para planificación de bodas",
            "offers": [
              {
                "@type": "Offer",
                "name": "Plan Free",
                "price": "0",
                "priceCurrency": "EUR",
                "availability": "https://schema.org/InStock",
                "eligibleQuantity": {
                  "@type": "QuantitativeValue",
                  "value": "80",
                  "unitText": "invitados"
                }
              },
              {
                "@type": "Offer",
                "name": "Wedding Pass",
                "price": "50",
                "priceCurrency": "EUR",
                "availability": "https://schema.org/InStock",
                "description": "Plan más popular con invitados ilimitados"
              },
              {
                "@type": "Offer",
                "name": "Wedding Pass Plus",
                "price": "85",
                "priceCurrency": "EUR",
                "availability": "https://schema.org/InStock",
                "description": "Plan premium para bodas especiales"
              }
            ]
          })}
        </script>
      </Helmet>
      
      <PageWrapper>
        <HeroSection
        title={t('pricing.title')}
        subtitle={t('pricing.subtitle')}
        compact
      />

      <Container>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              style={{
                backgroundColor: plan.color,
                borderRadius: theme.radius.xl,
                padding: '40px 32px',
                boxShadow: plan.popular ? theme.shadow.lg : theme.shadow.sm,
                border: plan.popular ? `2px solid ${plan.accentColor}` : `1px solid ${theme.colors.borderSoft}`,
                transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 220ms',
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: plan.accentColor,
                    color: theme.colors.onPrimary,
                    padding: '6px 20px',
                    borderRadius: theme.radius.pill,
                    fontFamily: theme.fonts.body,
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {plan.badge}
                </div>
              )}

              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: plan.accentColor }}
              >
                <plan.icon className="w-7 h-7 text-white" strokeWidth={1.5} />
              </div>

              <h3 style={{
                fontFamily: theme.fonts.heading,
                fontSize: '28px',
                fontWeight: 400,
                color: theme.colors.textPrimary,
                marginBottom: '8px',
              }}>
                {plan.name}
              </h3>

              <p style={{
                fontFamily: theme.fonts.body,
                fontSize: '14px',
                color: theme.colors.textSecondary,
                marginBottom: '24px',
              }}>
                {plan.description}
              </p>

              <div className="mb-6">
                <span style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: '48px',
                  fontWeight: 400,
                  color: plan.accentColor,
                }}>
                  {plan.price === 0 ? 'Gratis' : `${plan.price}€`}
                </span>
                {plan.price > 0 && (
                  <span style={{
                    fontFamily: theme.fonts.body,
                    fontSize: '16px',
                    color: theme.colors.textSecondary,
                    marginLeft: '8px',
                  }}>
                    /boda
                  </span>
                )}
              </div>

              <button
                onClick={() => navigate('/signup')}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  borderRadius: theme.radius.md,
                  fontFamily: theme.fonts.body,
                  fontSize: '16px',
                  fontWeight: 600,
                  backgroundColor: plan.accentColor,
                  color: theme.colors.onPrimary,
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: '32px',
                  transition: 'all 220ms',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {t('pricing.startFreeTrial')}
              </button>

              <div className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div 
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: plan.accentColor }}
                    >
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                    <p style={{
                      fontFamily: theme.fonts.body,
                      fontSize: '14px',
                      color: theme.colors.textPrimary,
                    }}>
                      {feature}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>

      <Container>
        <SectionTitle 
          title={t('pricing.faq.title')}
          subtitle={t('pricing.faq.subtitle')}
        />
        
        <div className="max-w-3xl mx-auto space-y-4">
          {[
            {
              q: t('pricing.faq.questions.changePlans.q'),
              a: t('pricing.faq.questions.changePlans.a'),
            },
            {
              q: t('pricing.faq.questions.afterTrial.q'),
              a: t('pricing.faq.questions.afterTrial.a'),
            },
            {
              q: t('pricing.faq.questions.refunds.q'),
              a: t('pricing.faq.questions.refunds.a'),
            },
            {
              q: t('pricing.faq.questions.multipleWeddings.q'),
              a: t('pricing.faq.questions.multipleWeddings.a'),
            },
          ].map((faq, index) => (
            <div
              key={index}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.lg,
                padding: '24px',
                boxShadow: theme.shadow.sm,
                border: `1px solid ${theme.colors.borderSoft}`,
              }}
            >
              <h4 style={{
                fontFamily: theme.fonts.body,
                fontSize: '16px',
                fontWeight: 600,
                color: theme.colors.textPrimary,
                marginBottom: '8px',
              }}>
                {faq.q}
              </h4>
              <p style={{
                fontFamily: theme.fonts.body,
                fontSize: '14px',
                color: theme.colors.textSecondary,
                lineHeight: '1.6',
              }}>
                {faq.a}
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
          <h2 style={{
            fontFamily: theme.fonts.heading,
            fontSize: '36px',
            fontWeight: 400,
            color: theme.colors.textPrimary,
            marginBottom: '16px',
          }}>
            {t('pricing.finalCta.title')}
          </h2>
          <p style={{
            fontFamily: theme.fonts.body,
            fontSize: '18px',
            color: theme.colors.textSecondary,
            marginBottom: '32px',
          }}>
            {t('pricing.finalCta.subtitle')}
          </p>
          <SecondaryButton onClick={() => navigate('/contacto')}>
            {t('pricing.finalCta.button')}
          </SecondaryButton>
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
            {t('pricing.footer')}
          </p>
        </div>
      </footer>
      </PageWrapper>
    </>
  );
}
