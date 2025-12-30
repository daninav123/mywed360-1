import React, { useState } from 'react';
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
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    {
      name: 'Starter',
      icon: Heart,
      description: 'Perfect for small, intimate weddings',
      price: billingCycle === 'monthly' ? 29 : 290,
      color: theme.colors.yellow,
      accentColor: theme.colors.yellowAccent,
      features: [
        'Up to 50 guests',
        'Basic budget tracking',
        'Task checklist',
        'Email support',
        'Mobile app access',
        '1 wedding event',
      ],
    },
    {
      name: 'Professional',
      icon: Sparkles,
      description: 'Most popular for full-scale weddings',
      price: billingCycle === 'monthly' ? 79 : 790,
      color: theme.colors.pink,
      accentColor: theme.colors.pinkAccent,
      popular: true,
      features: [
        'Up to 250 guests',
        'Advanced budget & finance tools',
        'Seating chart designer',
        'Custom wedding website',
        'Priority support',
        'Unlimited vendors',
        'RSVP management',
        'Gift registry integration',
      ],
    },
    {
      name: 'Premium',
      icon: Crown,
      description: 'For wedding planners & luxury events',
      price: billingCycle === 'monthly' ? 149 : 1490,
      color: theme.colors.green,
      accentColor: theme.colors.greenAccent,
      features: [
        'Unlimited guests',
        'Multi-wedding management',
        'White-label options',
        'Dedicated account manager',
        'Custom integrations',
        'Team collaboration tools',
        'Advanced analytics',
        'API access',
      ],
    },
  ];

  return (
    <PageWrapper>
      <HeroSection
        title="Simple, Transparent Pricing"
        subtitle="Choose the perfect plan for your wedding journey. All plans include a 14-day free trial."
        compact
      >
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '12px 24px',
              borderRadius: theme.radius.md,
              fontFamily: theme.fonts.body,
              fontSize: '14px',
              fontWeight: 600,
              border: `2px solid ${billingCycle === 'monthly' ? theme.colors.primary : theme.colors.borderSubtle}`,
              backgroundColor: billingCycle === 'monthly' ? theme.colors.primary : 'transparent',
              color: billingCycle === 'monthly' ? theme.colors.onPrimary : theme.colors.textPrimary,
              cursor: 'pointer',
              transition: 'all 220ms',
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            style={{
              padding: '12px 24px',
              borderRadius: theme.radius.md,
              fontFamily: theme.fonts.body,
              fontSize: '14px',
              fontWeight: 600,
              border: `2px solid ${billingCycle === 'annual' ? theme.colors.primary : theme.colors.borderSubtle}`,
              backgroundColor: billingCycle === 'annual' ? theme.colors.primary : 'transparent',
              color: billingCycle === 'annual' ? theme.colors.onPrimary : theme.colors.textPrimary,
              cursor: 'pointer',
              transition: 'all 220ms',
            }}
          >
            Annual
            <span style={{
              marginLeft: '8px',
              padding: '2px 8px',
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.sage,
              fontSize: '12px',
              color: theme.colors.textSecondary,
            }}>
              Save 17%
            </span>
          </button>
        </div>
      </HeroSection>

      <Container>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              placeholder={t('pricing.coupleNamePlaceholder')}
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
                  Most Popular
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
                  ${plan.price}
                </span>
                <span style={{
                  fontFamily: theme.fonts.body,
                  fontSize: '16px',
                  color: theme.colors.textSecondary,
                  marginLeft: '8px',
                }}>
                  /{billingCycle === 'monthly' ? 'month' : 'year'}
                </span>
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
                Start Free Trial
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
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about our pricing"
        />
        
        <div className="max-w-3xl mx-auto space-y-4">
          {[
            {
              q: 'Can I change plans later?',
              a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
            },
            {
              q: 'What happens after the free trial?',
              a: 'After your 14-day trial, you\'ll be charged based on your selected plan. Cancel anytime during the trial with no charges.',
            },
            {
              q: 'Do you offer refunds?',
              a: 'Yes, we offer a 30-day money-back guarantee on all annual plans.',
            },
            {
              q: 'Can I use it for multiple weddings?',
              a: 'The Premium plan supports unlimited weddings. Other plans are for single wedding events.',
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
            Still Have Questions?
          </h2>
          <p style={{
            fontFamily: theme.fonts.body,
            fontSize: '18px',
            color: theme.colors.textSecondary,
            marginBottom: '32px',
          }}>
            Our team is here to help you find the perfect plan
          </p>
          <SecondaryButton onClick={() => navigate('/contacto')}>
            Contact Sales
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
            © 2025 Wedding Planner. Making dream weddings come true.
          </p>
        </div>
      </footer>
    </PageWrapper>
  );
}
