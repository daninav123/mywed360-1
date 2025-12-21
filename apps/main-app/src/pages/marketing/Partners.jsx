import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import {
  DollarSign,
  Users,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  BarChart3,
  Star,
  Send,
  Target,
  Award,
  UserPlus,
} from 'lucide-react';

import MarketingLayout from '../../components/marketing/MarketingLayout';
import logoApp from '../../assets/logo-mark.svg';

const BENEFIT_ICONS = {
  commissions: DollarSign,
  analytics: BarChart3,
  materials: Target,
  support: Users,
  training: Award,
  unlimited: TrendingUp,
};

const PROFILE_ICONS = {
  consultants: UserPlus,
  influencers: Star,
  eventPros: Users,
};

const fallbackContent = {
  meta: {
    title: 'Programa de Partners | MaLove.App',
    description:
      'Únete al programa de partners de MaLove.App y gana comisiones recurrentes con recursos de marketing, formación y soporte dedicado.',
    canonical: 'https://malove.app/partners',
    ogTitle: 'Programa de Partners | MaLove.App',
    ogDescription:
      'Gana ingresos recurrentes recomendando MaLove.App a planners y proveedores con materiales de apoyo y seguimiento en tiempo real.',
    image: 'https://malove.app/maloveapp-logo.png',
    twitterTitle: 'Programa de Partners | MaLove.App',
    twitterDescription:
      'Genera comisiones recurrentes recomendando la plataforma todo en uno para planificar bodas.',
  },
  hero: {
    logoAlt: 'MaLove.App',
    brand: 'MaLove.App',
    badge: 'Programa de Partners',
    title: 'Gana comisiones ayudando a parejas a organizar su boda perfecta',
    description: [
      'Únete a nuestro programa de partners y recibe comisiones recurrentes por cada cliente que refieras a MaLove.App.',
      'Sin inversión inicial. Comisiones atractivas. Material de marketing incluido.',
    ],
    cta: 'Solicitar Acceso al Programa',
  },
  benefits: {
    title: 'Por qué ser Partner de MaLove.App',
    subtitle: 'Beneficios diseñados para maximizar tu potencial de ingresos',
    items: [
      {
        icon: 'commissions',
        title: 'Comisiones Atractivas',
        description: 'Gana comisiones recurrentes por cada suscripción que vendas.',
      },
      {
        icon: 'analytics',
        title: 'Dashboard de Seguimiento',
        description: 'Monitorea tus conversiones, comisiones y estadísticas en tiempo real.',
      },
      {
        icon: 'materials',
        title: 'Material de Marketing',
        description: 'Acceso a presentaciones, demos y recursos para facilitar tus ventas.',
      },
      {
        icon: 'support',
        title: 'Soporte Dedicado',
        description: 'Equipo de soporte disponible para ayudarte con tus clientes.',
      },
      {
        icon: 'training',
        title: 'Formación Incluida',
        description: 'Capacitación completa sobre la plataforma y mejores prácticas de venta.',
      },
      {
        icon: 'unlimited',
        title: 'Sin Límites',
        description: 'No hay techo en tus comisiones. Cuanto más vendas, más ganas.',
      },
    ],
  },
  process: {
    badge: 'Proceso Simple',
    title: 'Cómo funciona',
    subtitle: 'En 4 pasos empiezas a generar ingresos',
    steps: [
      {
        step: '1',
        title: 'Únete al Programa',
        description: 'Completa el formulario de solicitud y espera nuestra aprobación.',
      },
      {
        step: '2',
        title: 'Recibe Formación',
        description: 'Accede a materiales y sesiones de capacitación sobre la plataforma.',
      },
      {
        step: '3',
        title: 'Comparte tu Link',
        description: 'Recibe tu enlace único de afiliado para rastrear tus conversiones.',
      },
      {
        step: '4',
        title: 'Gana Comisiones',
        description: 'Recibe comisiones recurrentes por cada cliente que se suscriba.',
      },
    ],
  },
  profiles: {
    badge: 'Perfil Ideal',
    title: '¿Eres un buen candidato?',
    subtitle: 'Buscamos profesionales con conexiones en el sector nupcial',
    items: [
      {
        icon: 'consultants',
        title: 'Consultores de Bodas',
        description:
          'Asesores que trabajan con parejas y pueden recomendar herramientas profesionales.',
      },
      {
        icon: 'influencers',
        title: 'Influencers del Sector',
        description: 'Creadores de contenido con audiencia interesada en organización de bodas.',
      },
      {
        icon: 'eventPros',
        title: 'Profesionales de Eventos',
        description:
          'Organizadores de eventos que pueden introducir MaLove.App en su red de contactos.',
      },
    ],
  },
  form: {
    anchor: 'partners-form',
    badge: 'Solicitud de Acceso',
    title: 'Únete al Programa de Partners',
    description:
      'Completa el formulario y nuestro equipo revisará tu solicitud. Te contactaremos en menos de 48 horas.',
    fields: {
      name: {
        label: 'Nombre completo *',
        placeholder: 'Tu nombre',
      },
      email: {
        label: 'Email *',
        placeholder: 'tu@email.com',
      },
      experience: {
        label: 'Experiencia en el sector',
        placeholder: 'Selecciona una opción',
        options: [
          { value: 'consultant', label: 'Consultor/a de bodas' },
          { value: 'influencer', label: 'Influencer / Creador de contenido' },
          { value: 'event-pro', label: 'Profesional de eventos' },
          { value: 'supplier', label: 'Proveedor de servicios de boda' },
          { value: 'other', label: 'Otro' },
        ],
      },
      about: {
        label: 'Cuéntanos sobre ti',
        placeholder:
          'Describe tu experiencia, tu red de contactos y por qué quieres ser partner...',
      },
    },
    submit: 'Enviar solicitud',
    submitting: 'Enviando...',
    messages: {
      success: '¡Gracias por tu interés! Revisaremos tu solicitud y te contactaremos pronto.',
      error: 'Por favor completa todos los campos obligatorios.',
    },
    consent:
      'Al enviar este formulario aceptas que revisemos tu perfil y nos pongamos en contacto contigo. No compartimos tu información con terceros.',
  },
  finalCta: {
    title: '¿Listo para empezar a generar ingresos recurrentes?',
    description: 'Únete a nuestro programa de partners y empieza a ganar comisiones hoy mismo.',
    primary: 'Solicitar Acceso Ahora',
  },
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'ProgramMembership',
    name: 'Programa de Partners de MaLove.App',
    description:
      'Únete al programa de partners de MaLove.App y genera comisiones recurrentes recomendando nuestra plataforma de planificación de bodas.',
    url: 'https://malove.app/partners',
    hostingOrganization: {
      '@type': 'Organization',
      name: 'MaLove.App',
      url: 'https://malove.app',
      logo: 'https://malove.app/maloveapp-logo.png',
      sameAs: [
        'https://www.linkedin.com/company/maloveapp',
        'https://www.instagram.com/malove.app',
        'https://www.facebook.com/maloveapp',
      ],
    },
  },
};

const Partners = () => {
  const { t } = useTranslation('marketing');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactExperience, setContactExperience] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formStatus, setFormStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const content = useMemo(
    () =>
      t('partners', {
        returnObjects: true,
        defaultValue: fallbackContent,
      }),
    [t]
  );

  const meta = content.meta ?? fallbackContent.meta;
  const hero = content.hero ?? fallbackContent.hero;
  const heroDescription = hero.description ?? fallbackContent.hero.description;

  const benefits = useMemo(() => {
    const items = content.benefits?.items ?? fallbackContent.benefits.items;
    return items.map((item) => {
      const Icon = BENEFIT_ICONS[item.icon] ?? BENEFIT_ICONS.commissions;
      return { ...item, Icon };
    });
  }, [content]);

  const benefitsSection = content.benefits ?? fallbackContent.benefits;
  const processSection = content.process ?? fallbackContent.process;
  const processSteps = processSection.steps ?? fallbackContent.process.steps;

  const profiles = useMemo(() => {
    const items = content.profiles?.items ?? fallbackContent.profiles.items;
    return items.map((item) => {
      const Icon = PROFILE_ICONS[item.icon] ?? PROFILE_ICONS.consultants;
      return { ...item, Icon };
    });
  }, [content]);

  const formSection = content.form ?? fallbackContent.form;
  const formFields = formSection.fields ?? fallbackContent.form.fields;
  const experienceField = formFields.experience ?? fallbackContent.form.fields.experience;
  const experienceOptions =
    experienceField.options ?? fallbackContent.form.fields.experience.options;
  const formMessages = formSection.messages ?? fallbackContent.form.messages;
  const formAnchor = formSection.anchor ?? fallbackContent.form.anchor;

  const finalCta = content.finalCta ?? fallbackContent.finalCta;

  const structuredData = useMemo(() => {
    const base = content.structuredData ?? fallbackContent.structuredData;
    return {
      ...base,
      memberBenefits: benefits.map(({ title, description }) => ({
        '@type': 'Offer',
        name: title,
        description,
      })),
    };
  }, [benefits, content]);

  const handleContactSubmit = (event) => {
    event.preventDefault();

    if (!contactName.trim() || !contactEmail.trim()) {
      setFormMessage(formMessages.error ?? fallbackContent.form.messages.error);
      setFormStatus('error');
      return;
    }

    setIsSubmitting(true);
    setFormMessage('');
    setFormStatus(null);

    window.setTimeout(() => {
      setFormMessage(formMessages.success ?? fallbackContent.form.messages.success);
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
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={meta.canonical} />
        <meta property="og:title" content={meta.ogTitle} />
        <meta property="og:description" content={meta.ogDescription} />
        <meta property="og:url" content={meta.canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={meta.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.twitterTitle ?? meta.title} />
        <meta name="twitter:description" content={meta.twitterDescription ?? meta.description} />
        <meta name="twitter:image" content={meta.image} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <MarketingLayout>
        <section className="layout-container rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg">
          <div className="mx-auto max-w-4xl text-center">
            <div className="flex items-center justify-center gap-3">
              <img
                src={logoApp}
                alt={hero.logoAlt ?? fallbackContent.hero.logoAlt}
                className="h-12 w-12 rounded-2xl bg-white object-contain shadow-sm ring-1 ring-[color:var(--color-primary-25)]"
              />
              <span className="text-sm font-semibold uppercase tracking-widest text-muted">
                {hero.brand ?? fallbackContent.hero.brand}
              </span>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-primary-40)] bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--color-primary)]" />
              {hero.badge ?? fallbackContent.hero.badge}
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-body md:text-5xl">
              {hero.title ?? fallbackContent.hero.title}
            </h1>
            {heroDescription.map((paragraph, index) => (
              <p key={index} className={`text-lg text-muted ${index === 0 ? 'mt-6' : 'mt-3'}`}>
                {paragraph}
              </p>
            ))}
            <div className="mt-8 flex justify-center">
              <a
                href={`#${formAnchor}`}
                className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:ring-offset-2"
              >
                {hero.cta ?? fallbackContent.hero.cta}
              </a>
            </div>
          </div>
        </section>

        <section className="layout-container mt-24 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-semibold text-body">
              {benefitsSection.title ?? fallbackContent.benefits.title}
            </h2>
            <p className="mt-4 text-lg text-muted">
              {benefitsSection.subtitle ?? fallbackContent.benefits.subtitle}
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {benefits.map((benefit) => (
              <article
                key={benefit.title}
                className="rounded-2xl border border-soft bg-white/95 p-6 shadow-sm"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-[color:var(--color-primary)]">
                  <benefit.Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-body">{benefit.title}</h3>
                <p className="mt-3 text-sm text-muted">{benefit.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="layout-container mt-24 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[color:var(--color-primary)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {processSection.badge ?? fallbackContent.process.badge}
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-body">
              {processSection.title ?? fallbackContent.process.title}
            </h2>
            <p className="mt-4 text-lg text-muted">
              {processSection.subtitle ?? fallbackContent.process.subtitle}
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {processSteps.map((item, index) => (
              <article key={item.title} className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-2xl font-bold text-white shadow-lg">
                  {item.step ?? String(index + 1)}
                </div>
                <h3 className="mt-4 text-base font-semibold text-body">{item.title}</h3>
                <p className="mt-2 text-sm text-muted">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="layout-container mt-24 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[color:var(--color-primary)]">
              <Users className="h-3.5 w-3.5" />
              {content.profiles?.badge ?? fallbackContent.profiles.badge}
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-body">
              {content.profiles?.title ?? fallbackContent.profiles.title}
            </h2>
            <p className="mt-4 text-lg text-muted">
              {content.profiles?.subtitle ?? fallbackContent.profiles.subtitle}
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {profiles.map((profile) => (
              <article
                key={profile.title}
                className="rounded-2xl border border-soft bg-white/95 p-6 shadow-sm"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-[color:var(--color-primary)]">
                  <profile.Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-body">{profile.title}</h3>
                <p className="mt-2 text-sm text-muted">{profile.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id={formAnchor}
          className="layout-container mt-24 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg"
        >
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[color:var(--color-primary)]">
                <Send className="h-3.5 w-3.5" />
                {formSection.badge ?? fallbackContent.form.badge}
              </span>
              <h2 className="mt-5 text-3xl font-semibold text-body">
                {formSection.title ?? fallbackContent.form.title}
              </h2>
              <p className="mt-4 text-base text-muted">
                {formSection.description ?? fallbackContent.form.description}
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleContactSubmit}>
              <div>
                <label htmlFor="contact-name" className="text-sm font-medium text-body">
                  {formFields.name?.label ?? fallbackContent.form.fields.name.label}
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  placeholder={
                    formFields.name?.placeholder ?? fallbackContent.form.fields.name.placeholder
                  }
                  className="mt-2 w-full rounded-md border border-soft bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                  required
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="text-sm font-medium text-body">
                  {formFields.email?.label ?? fallbackContent.form.fields.email.label}
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder={
                    formFields.email?.placeholder ?? fallbackContent.form.fields.email.placeholder
                  }
                  className="mt-2 w-full rounded-md border border-soft bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                  required
                />
              </div>

              <div>
                <label htmlFor="contact-experience" className="text-sm font-medium text-body">
                  {experienceField.label ?? fallbackContent.form.fields.experience.label}
                </label>
                <select
                  id="contact-experience"
                  value={contactExperience}
                  onChange={(event) => setContactExperience(event.target.value)}
                  className="mt-2 w-full rounded-md border border-soft bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                >
                  <option value="">
                    {experienceField.placeholder ??
                      fallbackContent.form.fields.experience.placeholder}
                  </option>
                  {experienceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="contact-message" className="text-sm font-medium text-body">
                  {formFields.about?.label ?? fallbackContent.form.fields.about.label}
                </label>
                <textarea
                  id="contact-message"
                  value={contactMessage}
                  onChange={(event) => setContactMessage(event.target.value)}
                  placeholder={
                    formFields.about?.placeholder ?? fallbackContent.form.fields.about.placeholder
                  }
                  rows={5}
                  className="mt-2 w-full rounded-md border border-soft bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {isSubmitting
                  ? (formSection.submitting ?? fallbackContent.form.submitting)
                  : (formSection.submit ?? fallbackContent.form.submit)}
              </button>

              {formMessage && (
                <p
                  className={`text-sm ${
                    formStatus === 'success' ? 'text-[color:var(--color-primary)]' : 'text-red-600'
                  }`}
                >
                  {formMessage}
                </p>
              )}
            </form>

            <div className="mt-8 rounded-2xl border border-soft bg-primary-soft p-6 text-center text-sm text-muted">
              <p>{formSection.consent ?? fallbackContent.form.consent}</p>
            </div>
          </div>
        </section>

        <section className="layout-container mt-24 rounded-3xl border border-[color:var(--color-primary-45)] bg-[var(--color-primary)] px-8 py-10 text-white shadow-lg md:px-12">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-semibold">
              {finalCta.title ?? fallbackContent.finalCta.title}
            </h2>
            <p className="mt-4 text-base text-white/85">
              {finalCta.description ?? fallbackContent.finalCta.description}
            </p>
            <div className="mt-8">
              <a
                href={`#${formAnchor}`}
                className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-sm font-semibold text-[color:var(--color-primary)] transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[color:var(--color-primary)]"
              >
                {finalCta.primary ?? fallbackContent.finalCta.primary}
              </a>
            </div>
          </div>
        </section>
      </MarketingLayout>
    </>
  );
};

export default Partners;
