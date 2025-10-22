import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, HeartHandshake, Users, CheckCircle2, Crown } from 'lucide-react';

import MarketingLayout from '../../components/marketing/MarketingLayout';
import useTranslations from '../../hooks/useTranslations';

const formatEuro = (value, minimumFractionDigits = 0) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits,
  }).format(value);

const Pricing = () => {
  const { t } = useTranslations();

  const featureHighlights = useMemo(
    () => [
      {
        icon: <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />,
        title: t('pricing.hero.highlights.payPerEvent.title'),
        description: t('pricing.hero.highlights.payPerEvent.description'),
      },
      {
        icon: <Users className="h-5 w-5 text-[var(--color-primary)]" />,
        title: t('pricing.hero.highlights.collaboration.title'),
        description: t('pricing.hero.highlights.collaboration.description'),
      },
      {
        icon: <CheckCircle2 className="h-5 w-5 text-[var(--color-primary)]" />,
        title: t('pricing.hero.highlights.syncStatus.title'),
        description: t('pricing.hero.highlights.syncStatus.description'),
      },
    ],
    [t]
  );

  const heroBenefits = useMemo(
    () => t('pricing.hero.benefits', { returnObjects: true }),
    [t]
  );

  const couplePlans = useMemo(
    () => [
      {
        key: 'free',
        name: t('pricing.couplePlans.free.name'),
        price: 0,
        priceLabel: t('pricing.couplePlans.free.priceLabel'),
        priceSuffix: t('pricing.couplePlans.free.priceSuffix'),
        description: t('pricing.couplePlans.free.description'),
        features: t('pricing.couplePlans.free.features', { returnObjects: true }),
        cta: t('pricing.couplePlans.free.cta'),
        link: '/signup',
        highlight: false,
      },
      {
        key: 'weddingPass',
        name: t('pricing.couplePlans.weddingPass.name'),
        price: 50,
        priceSuffix: t('pricing.couplePlans.weddingPass.priceSuffix'),
        description: t('pricing.couplePlans.weddingPass.description'),
        features: t('pricing.couplePlans.weddingPass.features', { returnObjects: true }),
        cta: t('pricing.couplePlans.weddingPass.cta'),
        link: '/signup?wedding-pass',
        highlight: true,
      },
      {
        key: 'weddingPassPlus',
        name: t('pricing.couplePlans.weddingPassPlus.name'),
        price: 85,
        priceSuffix: t('pricing.couplePlans.weddingPassPlus.priceSuffix'),
        description: t('pricing.couplePlans.weddingPassPlus.description'),
        features: t('pricing.couplePlans.weddingPassPlus.features', { returnObjects: true }),
        cta: t('pricing.couplePlans.weddingPassPlus.cta'),
        link: '/signup?wedding-pass-plus',
        highlight: false,
      },
    ],
    [t]
  );

  const plannerPlans = useMemo(
    () => [
      {
        key: 'pack5',
        name: t('pricing.plannerPlans.pack5.name'),
        monthlyPrice: 41.67,
        monthlySuffix: t('pricing.plannerPlans.pack5.monthlySuffix'),
        description: t('pricing.plannerPlans.pack5.description'),
        annualDescription: t('pricing.plannerPlans.pack5.annualDescription', {
          amount: formatEuro(425),
        }),
        features: t('pricing.plannerPlans.pack5.features', { returnObjects: true }),
      },
      {
        key: 'pack15',
        name: t('pricing.plannerPlans.pack15.name'),
        monthlyPrice: 112.5,
        monthlySuffix: t('pricing.plannerPlans.pack15.monthlySuffix'),
        description: t('pricing.plannerPlans.pack15.description'),
        annualDescription: t('pricing.plannerPlans.pack15.annualDescription', {
          amount: formatEuro(1147.5),
        }),
        features: t('pricing.plannerPlans.pack15.features', { returnObjects: true }),
      },
      {
        key: 'teams40',
        name: t('pricing.plannerPlans.teams40.name'),
        monthlyPrice: 266.67,
        monthlySuffix: t('pricing.plannerPlans.teams40.monthlySuffix'),
        description: t('pricing.plannerPlans.teams40.description'),
        annualDescription: t('pricing.plannerPlans.teams40.annualDescription', {
          amount: formatEuro(2720),
        }),
        features: t('pricing.plannerPlans.teams40.features', { returnObjects: true }),
      },
      {
        key: 'teamsUnlimited',
        name: t('pricing.plannerPlans.teamsUnlimited.name'),
        monthlyPrice: 416.67,
        monthlySuffix: t('pricing.plannerPlans.teamsUnlimited.monthlySuffix'),
        description: t('pricing.plannerPlans.teamsUnlimited.description'),
        annualDescription: t('pricing.plannerPlans.teamsUnlimited.annualDescription', {
          amount: formatEuro(4250),
        }),
        features: t('pricing.plannerPlans.teamsUnlimited.features', { returnObjects: true }),
      },
    ],
    [t]
  );

  const plannerCta = t('pricing.plannerPlans.cta');
  const heroBadge = t('pricing.hero.badge');
  const heroTitle = t('pricing.hero.title');
  const heroDescription = t('pricing.hero.description');
  const heroBenefitsTitle = t('pricing.hero.benefitsTitle');
  const heroCta = t('pricing.hero.cta');

  const couplesLabel = t('pricing.sections.couples.label');
  const couplesTitle = t('pricing.sections.couples.title');
  const couplesDescription = t('pricing.sections.couples.description');

  const plannersLabel = t('pricing.sections.planners.label');
  const plannersTitle = t('pricing.sections.planners.title');
  const plannersDescription = t('pricing.sections.planners.description');

  const needHelpSection = {
    title: t('pricing.sections.needHelp.title'),
    description: t('pricing.sections.needHelp.description'),
    cta: t('pricing.sections.needHelp.cta'),
  };

  const quickStartSection = {
    title: t('pricing.sections.quickStart.title'),
    description: t('pricing.sections.quickStart.description'),
    primaryCta: t('pricing.sections.quickStart.primaryCta'),
    secondaryCta: t('pricing.sections.quickStart.secondaryCta'),
  };

  return (
    <MarketingLayout>
      <div className="layout-container space-y-16">
        <section className="rounded-3xl border border-soft bg-surface px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15 md:px-12 md:py-14">
          <div className="grid gap-10 md:grid-cols-[1.35fr,0.65fr] md:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)]/12 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                <Sparkles className="h-4 w-4" />
                {heroBadge}
              </span>
              <h1 className="mt-6 text-4xl font-semibold text-body md:text-5xl">{heroTitle}</h1>
              <p className="mt-4 max-w-2xl text-base text-muted md:text-lg">{heroDescription}</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {featureHighlights.map((item) => (
                  <div
                    key={item.title}
                    className="flex flex-col gap-2 rounded-2xl border border-soft bg-white p-4 shadow-sm shadow-[var(--color-primary)]/10"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/12">
                      {item.icon}
                    </div>
                    <p className="text-sm font-semibold text-body">{item.title}</p>
                    <p className="text-xs text-muted">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--color-primary)]/35 bg-surface p-6 shadow-lg shadow-[var(--color-primary)]/15">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                <HeartHandshake className="h-4 w-4" />
                {heroBenefitsTitle}
              </div>
              <ul className="mt-4 space-y-3 text-sm text-muted">
                {heroBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--color-primary)]" />
                    {benefit}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
              >
                {heroCta}
              </Link>
            </div>
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              {couplesLabel}
            </span>
            <h2 className="text-xl font-semibold text-body md:text-2xl">{couplesTitle}</h2>
          </div>
          <p className="mt-2 text-sm text-muted">{couplesDescription}</p>

          <div className="mt-6 grid gap-8 md:grid-cols-3">
            {couplePlans.map((plan) => {
              const cardClasses = [
                'flex h-full flex-col rounded-3xl border bg-surface p-8 shadow-sm shadow-[var(--color-primary)]/12 transition-transform hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--color-primary)]/20',
                plan.highlight ? 'border-[var(--color-primary)]/55' : 'border-soft',
              ].join(' ');
              const buttonClasses = [
                'mt-8 inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2',
                plan.highlight
                  ? 'bg-[var(--color-primary)] text-white hover:brightness-95'
                  : 'border border-[var(--color-primary)]/45 text-body hover:border-[var(--color-primary)]',
              ].join(' ');

              return (
                <article key={plan.key} className={cardClasses}>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                      {plan.name}
                    </span>
                    <h3 className="mt-4 text-3xl font-semibold text-body">
                      {plan.price === 0 && plan.priceLabel ? (
                        <>
                          {plan.priceLabel}
                          <span className="block text-sm font-medium text-muted">{plan.priceSuffix}</span>
                        </>
                      ) : (
                        <>
                          {formatEuro(plan.price)}{' '}
                          <span className="block text-sm font-medium text-muted">{plan.priceSuffix}</span>
                        </>
                      )}
                    </h3>
                    <p className="mt-2 text-sm text-muted">{plan.description}</p>
                  </div>

                  <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-muted">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link to={plan.link} className={buttonClasses}>
                    {plan.cta}
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/12 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              <Crown className="h-3.5 w-3.5" />
              {plannersLabel}
            </span>
            <h2 className="text-xl font-semibold text-body md:text-2xl">{plannersTitle}</h2>
          </div>
          <p className="mt-2 text-sm text-muted">{plannersDescription}</p>

          <div className="mt-6 grid gap-8 md:grid-cols-2">
            {plannerPlans.map((plan) => (
              <article
                key={plan.key}
                className="flex h-full flex-col rounded-3xl border border-soft bg-surface p-8 shadow-sm shadow-[var(--color-primary)]/12 transition-transform hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--color-primary)]/20"
              >
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                    {plan.name}
                  </span>
                  <h3 className="mt-4 text-2xl font-semibold text-body">
                    {formatEuro(plan.monthlyPrice, 2)}{' '}
                    <span className="text-sm font-medium text-muted">{plan.monthlySuffix}</span>
                  </h3>
                  <p className="mt-1 text-sm text-muted">{plan.annualDescription}</p>
                  <p className="mt-4 text-sm text-muted">{plan.description}</p>
                </div>

                <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-muted">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/signup?role=planner"
                  className="mt-8 inline-flex items-center justify-center rounded-md border border-[var(--color-primary)]/45 px-5 py-3 text-sm font-semibold text-body transition-colors hover:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
                >
                  {plannerCta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-soft bg-surface p-10 shadow-lg shadow-[var(--color-primary)]/12">
          <div className="grid gap-8 md:grid-cols-[1.5fr,0.5fr] md:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-body md:text-3xl">{needHelpSection.title}</h2>
              <p className="mt-4 text-base text-muted">{needHelpSection.description}</p>
            </div>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              {needHelpSection.cta}
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--color-primary)]/45 bg-[var(--color-primary)] px-8 py-10 text-white shadow-lg shadow-[var(--color-primary)]/30 md:px-12">
          <div className="grid gap-10 md:grid-cols-[2fr,1fr] md:items-center">
            <div>
              <h2 className="text-3xl font-semibold">{quickStartSection.title}</h2>
              <p className="mt-4 text-base text-white/85">{quickStartSection.description}</p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--color-primary)]"
              >
                {quickStartSection.primaryCta}
              </Link>
              <Link
                to="/acceso"
                className="inline-flex items-center justify-center rounded-md border border-white/70 px-4 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--color-primary)]"
              >
                {quickStartSection.secondaryCta}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
};

export default Pricing;

