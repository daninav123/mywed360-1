import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import MarketingLayout from '../../components/marketing/MarketingLayout';
import { useTranslations } from '../../hooks/useTranslations';
import {
  CalendarCheck,
  Palette,
  Users,
  Sparkles,
  Shield,
  Send,
  Quote,
  CheckCircle2,
  Layers,
  Briefcase,
  Clock3,
} from 'lucide-react';

const BENEFIT_ICONS = {
  timelines: <CalendarCheck className="h-5 w-5 text-[var(--color-primary)]" />,
  collaboration: <Users className="h-5 w-5 text-[var(--color-primary)]" />,
  branding: <Palette className="h-5 w-5 text-[var(--color-primary)]" />,
  security: <Shield className="h-5 w-5 text-[var(--color-primary)]" />,
};

const PLANNER_ICONS = {
  portfolio: <Layers className="h-5 w-5 text-[var(--color-primary)]" />,
  kits: <Briefcase className="h-5 w-5 text-[var(--color-primary)]" />,
  alerts: <Clock3 className="h-5 w-5 text-[var(--color-primary)]" />,
};

const FALLBACK_LANDING_COPY = {
  hero: {
    brandLabel: 'MaLove.App',
    logoAlt: 'Logotipo de MaLove.App',
    badge: 'Plataforma integral para bodas',
    title: {t('common.coordina_boda_sonada_con_herramientas')},
    description: [
      {t('common.maloveapp_centraliza_planificacion_finanzas_comunicacion')},
    ],
    actions: { primary: 'Empezar gratis', secondary: 'Explorar funcionalidades' },
    highlights: [],
    widget: { tasks: { items: [] }, assistant: {} },
  },
  modules: { items: [] },
  planner: {
    badge: {t('common.disenado_para_planners')},
    title: {t('common.control_total_eventos_sin_hojas')},
    description:
      {t('common.automatiza_tareas_repetitivas_manten_equipo')},
    highlights: [],
    dashboard: { statusItems: [] },
  },
  benefits: {
    items: {
      timelines: { title: 'Tiempos bajo control', description: '' },
      collaboration: { title: {t('common.colaboracion_real')}, description: '' },
      branding: { title: {t('common.diseno_consistente')}, description: '' },
      security: { title: 'Datos seguros', description: '' },
    },
  },
  stories: { testimonials: [], trust: { brands: [] } },
  faq: { items: [], form: { fields: {}, messages: {}, consent: '' } },
  cta: { title: '', subtitle: '', primary: '', secondary: '' },
};

const Landing = () => {
  const { t } = useTranslation('marketing');
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoMessage, setDemoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const heroResult = t('landing.hero', {
    returnObjects: true,
    defaultValue: FALLBACK_LANDING_COPY.hero,
  });
  const heroData = { ...FALLBACK_LANDING_COPY.hero, ...(heroResult || {}) };
  const heroDescriptionRaw = heroData.description;
  const heroDescription = Array.isArray(heroDescriptionRaw)
    ? heroDescriptionRaw
    : heroDescriptionRaw
      ? [heroDescriptionRaw]
      : [];
  const heroHighlights = Array.isArray(heroData.highlights) ? heroData.highlights : [];
  const heroActions = heroData.actions ?? {};
  const heroWidget = heroData.widget ?? {};
  const heroTasks = heroWidget.tasks ?? {};
  const heroTaskItems = Array.isArray(heroTasks.items) ? heroTasks.items : [];
  const heroAssistant = heroWidget.assistant ?? {};

  const modulesResult = t('landing.modules', {
    returnObjects: true,
    defaultValue: FALLBACK_LANDING_COPY.modules,
  });
  const modulesData = { ...FALLBACK_LANDING_COPY.modules, ...(modulesResult || {}) };
  const moduleItems = Array.isArray(modulesData.items) ? modulesData.items : [];

  const plannerResult = t('landing.planner', {
    returnObjects: true,
    defaultValue: FALLBACK_LANDING_COPY.planner,
  });
  const plannerData = { ...FALLBACK_LANDING_COPY.planner, ...(plannerResult || {}) };
  const plannerHighlightsData = Array.isArray(plannerData.highlights) ? plannerData.highlights : [];
  const plannerHighlights = plannerHighlightsData.map((item) => ({
    ...item,
    icon: PLANNER_ICONS[item.key] ?? null,
  }));
  const plannerDashboard = plannerData.dashboard ?? {};
  const plannerStatusItems = Array.isArray(plannerDashboard.statusItems) ? plannerDashboard.statusItems : [];

  const benefitsResult = t('landing.benefits', {
    returnObjects: true,
    defaultValue: FALLBACK_LANDING_COPY.benefits,
  });
  const benefitsData = { ...FALLBACK_LANDING_COPY.benefits, ...(benefitsResult || {}) };
  const benefitsMap = benefitsData.items ?? FALLBACK_LANDING_COPY.benefits.items;
  const benefitOrder = ['timelines', 'collaboration', 'branding', 'security'];
  const benefitItems = benefitOrder
    .map((key) => {
      const entry = benefitsMap[key] ?? {};
      return {
        key,
        icon: BENEFIT_ICONS[key],
        title: entry.title ?? '',
        description: entry.description ?? '',
      };
    })
    .filter((item) => item.title);

  const storiesResult = t('landing.stories', {
    returnObjects: true,
    defaultValue: FALLBACK_LANDING_COPY.stories,
  });
  const storiesData = { ...FALLBACK_LANDING_COPY.stories, ...(storiesResult || {}) };
  const testimonials = Array.isArray(storiesData.testimonials) ? storiesData.testimonials : [];
  const trustData = storiesData.trust ?? {};
  const trustLogos = Array.isArray(trustData.brands) ? trustData.brands : [];

  const faqResult = t('landing.faq', {
    returnObjects: true,
    defaultValue: FALLBACK_LANDING_COPY.faq,
  });
  const faqData = { ...FALLBACK_LANDING_COPY.faq, ...(faqResult || {}) };
  const faqItems = Array.isArray(faqData.items) ? faqData.items : [];
  const formData = faqData.form ?? FALLBACK_LANDING_COPY.faq.form;
  const formFields = formData.fields ?? FALLBACK_LANDING_COPY.faq.form.fields;
  const formMessages = formData.messages ?? FALLBACK_LANDING_COPY.faq.form.messages;

  const ctaResult = t('landing.cta', {
    returnObjects: true,
    defaultValue: FALLBACK_LANDING_COPY.cta,
  });
  const ctaData = { ...FALLBACK_LANDING_COPY.cta, ...(ctaResult || {}) };

  const handleDemoSubmit = (event) => {
    event.preventDefault();

    if (!demoName.trim() || !demoEmail.trim()) {
      setDemoMessage(formMessages.error ?? 'Please fill in your name and email to request a demo.');
      return;
    }

    setIsSubmitting(true);
    setDemoMessage('');

    window.setTimeout(() => {
      setDemoMessage(formMessages.success ?? 'Thank you! Our team will reach out in less than 24 hours.');
      setDemoName('');
      setDemoEmail('');
      setIsSubmitting(false);
    }, 1200);
  };

  const submitLabel = isSubmitting
    ? formMessages.submitting ?? 'Sending request...'
    : formMessages.submit ?? 'Schedule demo';
  const consentText =
    formData.consent ??
    'By submitting you agree to receive MaLove.App related communications. You can unsubscribe at any time.';

  return (
    <MarketingLayout>
      <section className="layout-container grid gap-12 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
        <div>
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}maloveapp-logo.png`}
              alt={heroData.logoAlt ?? 'MaLove.App logo'}
              className="h-12 w-12 rounded-2xl bg-white object-contain shadow-sm ring-1 ring-[var(--color-primary)]/25"
            />
            <span className="text-sm font-semibold uppercase tracking-widest text-muted">
              {heroData.brandLabel ?? 'MaLove.App'}
            </span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            {heroData.badge ?? 'All-in-one wedding planning platform'}
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-body md:text-5xl">
            {heroData.title ?? 'Coordinate your dream wedding faster with professional tools built for your team.'}
          </h1>
          {heroDescription.length > 0 && (
            <p className="mt-6 text-lg text-muted">
              {heroDescription.map((sentence, index) => (
                <React.Fragment key={`${sentence}-${index}`}>
                  {sentence}
                  {index < heroDescription.length - 1 ? ' ' : ''}
                </React.Fragment>
              ))}
            </p>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              {heroActions.primary ?? 'Start for free'}
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center justify-center rounded-md border border-[var(--color-primary)]/45 px-5 py-3 text-sm font-semibold text-body transition-colors hover:border-[var(--color-primary)] hover:text-body focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              {heroActions.secondary ?? 'See everything the app includes'}
            </Link>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {heroHighlights.map((item) => (
              <div
                key={`${item.value}-${item.label}`}
                className="rounded-2xl border border-soft bg-white p-4 shadow-sm shadow-[var(--color-primary)]/10"
              >
                <p className="text-2xl font-semibold text-[var(--color-primary)]">{item.value}</p>
                <p className="text-sm text-muted">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute -left-10 -right-6 -top-10 bottom-8 rounded-[2.75rem] bg-primary-soft blur-3xl" />
          <div className="relative space-y-4">
            <div className="rounded-[1.75rem] border border-soft bg-white/95 p-6 shadow-xl shadow-[var(--color-primary)]/15">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {heroWidget.summaryLabel ?? 'Overview'}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-body">
                    {heroWidget.eventName ?? {t('common.valeria_tomas_wedding')}}
                  </h3>
                </div>
                <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                  {heroWidget.growth ?? '+18% this week'}
                </span>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-soft bg-white/95 p-4 shadow-sm">
                  <p className="text-sm text-muted">
                    {heroWidget.confirmedGuests?.label ?? 'Confirmed guests'}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-body">
                    {heroWidget.confirmedGuests?.value ?? '132'}
                  </p>
                  <div className="mt-3 h-2.5 w-full rounded-full bg-primary-soft">
                    <div className="h-full w-3/4 rounded-full bg-[var(--color-primary)]" />
                  </div>
                </div>
                <div className="rounded-2xl border border-soft bg-white/95 p-4 shadow-sm">
                  <p className="text-sm text-muted">{heroWidget.budget?.label ?? 'Budget executed'}</p>
                  <p className="mt-2 text-2xl font-semibold text-body">
                    {heroWidget.budget?.value ?? '$18.4k'}
                  </p>
                  {heroWidget.budget?.pendingInvoices ? (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                      {heroWidget.budget.pendingInvoices}
                    </div>
                  ) : null}
                </div>
                <div className="rounded-2xl border border-soft bg-white/95 p-4 shadow-sm md:col-span-2">
                  <p className="text-sm text-muted">{heroTasks.label ?? 'Critical tasks this week'}</p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {heroTaskItems.map((task, index) => {
                      const background =
                        index === 0 ? 'bg-primary-soft/35' : 'bg-primary-soft/20';
                      return (
                        <li
                          key={`${task.day}-${task.text}`}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-body ${background}`}
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-[var(--color-primary)]">
                            {task.day}
                          </span>
                          {task.text}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
            <div className="ml-auto w-5/6 rounded-[1.5rem] border border-soft bg-white/90 p-5 shadow-lg shadow-[var(--color-primary)]/10 backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                {heroAssistant.label ?? 'MaLove.App assistant'}
              </p>
              <p className="mt-3 text-sm text-body">
                {heroAssistant.message ??
                  '"Your timeline is 82% complete. Send the lodging reminder before Monday and confirm the remaining vendors."'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="layout-container mt-24 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-semibold text-body">
            {modulesData.title ?? 'Everything you need in one place'}
          </h2>
          <p className="mt-4 text-lg text-muted">
            {modulesData.description ??
              'MaLove.App streamlines logistics with collaborative modules for planners, vendors, and guests.'}
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {moduleItems.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-soft bg-white/95 p-6 shadow-sm shadow-[var(--color-primary)]/10"
            >
              <h3 className="text-lg font-semibold text-body">{feature.title}</h3>
              <p className="mt-3 text-sm text-muted">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="layout-container mt-24 rounded-3xl border border-soft bg-white/95 p-8 shadow-lg shadow-[var(--color-primary)]/15">
        <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
          <div>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              {plannerData.badge ?? 'Built for planners'}
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-body">
              {plannerData.title ?? 'Total control of your event portfolio without spreadsheets.'}
            </h2>
            <p className="mt-3 text-base text-muted">
              {plannerData.description ??
                'MaLove.App makes it easy to run multiple weddings with dashboards, reusable templates, and exportable reports. Coordinate your team and stay ahead with a single platform.'}
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {plannerHighlights.map((item) => (
                <article
                  key={item.title}
                  className="flex h-full flex-col gap-3 rounded-2xl border border-soft bg-white p-4 shadow-sm shadow-[var(--color-primary)]/10"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-[var(--color-primary)]">
                    {item.icon}
                  </span>
                  <h3 className="text-sm font-semibold text-body">{item.title}</h3>
                  <p className="text-xs text-muted">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-soft bg-primary-soft/40 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              {plannerDashboard.title ?? 'Planner view'}
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-soft bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-medium text-muted">
                  {plannerDashboard.portfolioLabel ?? 'Current portfolio'}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-lg font-semibold text-body">
                    {plannerDashboard.portfolioValue ?? '8 active weddings'}
                  </p>
                  <span className="rounded-full bg-[var(--color-primary)]/10 px-2 py-1 text-xs text-[var(--color-primary)]">
                    {plannerDashboard.portfolioBadge ?? '2 new this month'}
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-soft bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-medium text-muted">
                  {plannerDashboard.statusLabel ?? 'Client status'}
                </p>
                <ul className="mt-2 space-y-1 text-xs text-muted">
                  {plannerStatusItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-soft bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-medium text-muted">
                  {plannerDashboard.performanceLabel ?? 'Monthly performance'}
                </p>
                <div className="mt-3 h-2 w-full rounded-full bg-primary-soft">
                  <div className="h-full w-2/3 rounded-full bg-[var(--color-primary)]" />
                </div>
                <p className="mt-2 text-xs text-muted">
                  {plannerDashboard.performanceNote ?? 'Average time per wedding: 38% less than last year.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="layout-container mt-24 space-y-10 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15">
        <div className="text-center">
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
            {benefitsData.badge ?? 'Key benefits'}
          </span>
          <h2 className="mt-5 text-3xl font-semibold text-body">
            {benefitsData.title ?? 'A carefully managed operation from start to finish'}
          </h2>
          <p className="mt-3 text-base text-muted">
            {benefitsData.description ??
              'Designed for planners who need visibility and couples who want peace of mind. MaLove.App automates repetitive tasks and keeps everyone aligned.'}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {benefitItems.map((benefit) => (
            <article
              key={benefit.key}
              className="flex h-full flex-col gap-3 rounded-2xl border border-soft bg-white/95 p-5 shadow-sm shadow-[var(--color-primary)]/10"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-[var(--color-primary)]">
                {benefit.icon}
              </span>
              <h3 className="text-lg font-semibold text-body">{benefit.title}</h3>
              <p className="text-sm text-muted">{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="layout-container mt-24 space-y-10 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15">
        <div className="grid gap-10 lg:grid-cols-[1.3fr,0.7fr] lg:items-center">
          <div>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              {storiesData.badge ?? 'Real stories'}
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-body">
              {storiesData.title ?? 'MaLove.App empowers planners and couples worldwide'}
            </h2>
            <p className="mt-3 text-base text-muted">
              {storiesData.description ??
                'More than 12k weddings are managed in MaLove.App. Every team leverages automations, insights, and templates to spend more time on creativity.'}
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {testimonials.map((testimonial) => (
                <article
                  key={`${testimonial.name}-${testimonial.role}`}
                  className="flex h-full flex-col gap-3 rounded-2xl border border-soft bg-white/95 p-6 shadow-sm shadow-[var(--color-primary)]/10"
                >
                  <Quote className="h-5 w-5 text-[var(--color-primary)]" />
                  <p className="text-sm text-body">{testimonial.quote}</p>
                  <div>
                    <p className="text-sm font-semibold text-body">{testimonial.name}</p>
                    <p className="text-xs text-muted">{testimonial.role}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-soft bg-white/95 p-6 shadow-lg shadow-[var(--color-primary)]/15">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              {trustData.title ?? 'Trusted by MaLove.App'}
            </p>
            <div className="mt-6 grid gap-6 text-center text-sm font-medium text-muted sm:grid-cols-2">
              {trustLogos.map((brand) => (
                <div key={brand} className="rounded-xl border border-soft bg-primary-soft/40 py-4 text-muted">
                  {brand}
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-muted">
              {trustData.note ??
                '200+ active planners across Europe and LATAM rely on MaLove.App to standardize processes and deliver memorable experiences.'}
            </p>
          </div>
        </div>
      </section>

      <section className="layout-container mt-24 grid gap-10 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15 lg:grid-cols-[1fr,1fr]">
        <div>
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
            {faqData.badge ?? 'Frequently asked questions'}
          </span>
          <h2 className="mt-5 text-3xl font-semibold text-body">
            {faqData.title ?? 'Everything you need to know before getting started'}
          </h2>
          <div className="mt-6 space-y-4">
            {faqItems.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-soft bg-white/95 p-5 shadow-sm shadow-[var(--color-primary)]/10 open:ring-1 open:ring-[var(--color-primary)]/20"
              >
                <summary className="flex cursor-pointer items-center justify-between text-base font-semibold text-body">
                  {faq.question}
                  <span className="text-sm font-normal text-[var(--color-primary)] transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-soft bg-white/95 p-8 shadow-lg shadow-[var(--color-primary)]/15">
          <h3 className="text-2xl font-semibold text-body">
            {formData.title ?? 'Request a personalized demo'}
          </h3>
          <p className="mt-3 text-sm text-muted">
            {formData.description ??
              'Tell us about your operation and schedule a video call with our team. You will receive recommendations tailored to your current workflow and a quick-start guide.'}
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleDemoSubmit}>
            <div>
              <label htmlFor="demo-name" className="text-sm font-medium text-body">
                {formFields.name?.label ?? 'Full name'}
              </label>
              <input
                id="demo-name"
                type="text"
                value={demoName}
                onChange={(event) => setDemoName(event.target.value)}
                placeholder={formFields.name?.placeholder ?? 'Your name'}
                className="mt-1 w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div>
              <label htmlFor="demo-email" className="text-sm font-medium text-body">
                {formFields.email?.label ?? 'Contact email'}
              </label>
              <input
                id="demo-email"
                type="email"
                value={demoEmail}
                onChange={(event) => setDemoEmail(event.target.value)}
                placeholder={formFields.email?.placeholder ?? 'you@youragency.com'}
                className="mt-1 w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {submitLabel}
            </button>
            {demoMessage ? <p className="text-sm text-[var(--color-primary)]">{demoMessage}</p> : null}
          </form>
          <div className="mt-6 rounded-2xl border border-soft bg-primary-soft/40 p-4 text-xs text-muted">{consentText}</div>
        </div>
      </section>

      <section className="layout-container mt-24 rounded-3xl border border-[var(--color-primary)]/45 bg-[var(--color-primary)] px-8 py-10 text-white shadow-lg shadow-[var(--color-primary)]/30 md:px-12">
        <div className="grid gap-10 md:grid-cols-[2fr,1fr] md:items-center">
          <div>
            <h2 className="text-3xl font-semibold">
              {ctaData.title ?? 'Ready to use in minutes.'}
            </h2>
            <p className="mt-4 text-base text-white/85">
              {ctaData.description ??
                'Create your account, import your guest list, and enable automations that support you from day one.'}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--color-primary)]"
            >
              {ctaData.primary ?? 'Create free account'}
            </Link>
            <Link
              to="/precios"
              className="inline-flex items-center justify-center rounded-md border border-white/70 px-4 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--color-primary)]"
            >
              {ctaData.secondary ?? 'Compare plans'}
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default Landing;
