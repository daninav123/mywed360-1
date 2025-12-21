import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Camera,
  Users,
  TrendingUp,
  MessageSquare,
  BarChart3,
  Sparkles,
  CheckCircle2,
  Eye,
  Wallet,
  Shield,
  Star,
  Send,
  Crown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import MarketingLayout from '../../components/marketing/MarketingLayout';
import logoApp from '../../assets/logo-mark.svg';

const ICON_COMPONENTS = {
  users: Users,
  camera: Camera,
  messageSquare: MessageSquare,
  barChart: BarChart3,
  trendingUp: TrendingUp,
  shield: Shield,
  sparkles: Sparkles,
  check: CheckCircle2,
  eye: Eye,
  wallet: Wallet,
  star: Star,
  crown: Crown,
};

const fallbackContent = {
  meta: {
    title: 'MaLove.App para proveedores | Consigue parejas cualificadas',
    description:
      'Crea tu portafolio en MaLove.App, llega a parejas en tu zona y recibe solicitudes cualificadas con métricas y mensajería centralizadas.',
    ogTitle: 'MaLove.App para proveedores | Consigue parejas cualificadas',
    ogDescription:
      'Gestiona tu presencia, paga solo por visualizaciones y convierte parejas en clientes con herramientas profesionales.',
    twitterTitle: 'MaLove.App para proveedores | Consigue parejas cualificadas',
    twitterDescription:
      'Destaca tu negocio de bodas, recibe leads cualificados y obtén estadísticas en tiempo real.',
    canonical: 'https://malove.app/para-proveedores',
    image: 'https://malove.app/maloveapp-logo.png',
  },
  hero: {
    brand: 'MaLove.App',
    logoAlt: 'Logo MaLove.App',
    badge: 'Para Proveedores de Bodas',
    title: 'Conecta con parejas que buscan tus servicios',
    description: [
      'MaLove.App te ayuda a llegar a miles de parejas organizando su boda. Sistema de pago por visualización sin suscripciones mensuales ni comisiones por contrato.',
      'Crea tu portafolio profesional, recibe solicitudes cualificadas y gestiona todo desde tu dashboard.',
    ],
    primaryCta: 'Registra tu negocio gratis',
    secondaryCta: 'Ver cómo funciona',
    stats: {
      label: 'Tu Dashboard',
      title: 'Panel de Proveedor',
      growthBadge: '+24% este mes',
      metrics: [
        {
          icon: 'eye',
          label: 'Visualizaciones',
          value: '1,248',
          hint: '156 tokens disponibles',
        },
        {
          icon: 'messageSquare',
          label: 'Solicitudes',
          value: '47',
          hint: '12 pendientes de respuesta',
        },
        {
          icon: 'star',
          label: 'Valoración',
          value: '4.9',
          hint: 'Basado en 28 reseñas',
        },
      ],
    },
  },
  benefits: {
    title: 'Por qué proveedores eligen MaLove.App',
    subtitle: 'Herramientas profesionales para hacer crecer tu negocio de bodas',
    items: [
      {
        icon: 'users',
        title: 'Llega a miles de parejas',
        description:
          'Aparece en las búsquedas cuando parejas buscan servicios como el tuyo en tu zona.',
      },
      {
        icon: 'camera',
        title: 'Portafolio profesional',
        description: 'Crea tu página pública con galería de fotos, servicios, precios y reseñas.',
      },
      {
        icon: 'messageSquare',
        title: 'Recibe solicitudes directas',
        description:
          'Las parejas te contactan directamente desde la plataforma con su información y necesidades.',
      },
      {
        icon: 'barChart',
        title: 'Dashboard de gestión',
        description: 'Gestiona todas tus solicitudes, conversaciones y proyectos desde un panel.',
      },
      {
        icon: 'trendingUp',
        title: 'Sin comisiones',
        description: 'Solo pagas por visualización. No cobramos comisión por contrato cerrado.',
      },
      {
        icon: 'shield',
        title: 'Verificación profesional',
        description:
          'Badge de proveedor verificado que aumenta la confianza de potenciales clientes.',
      },
    ],
  },
  howItWorks: {
    badge: 'Proceso Simple',
    title: 'Cómo funciona',
    description: 'En 5 pasos estás listo para recibir solicitudes de parejas',
    steps: [
      {
        title: 'Regístrate gratis',
        description: 'Crea tu cuenta de proveedor sin coste ni compromiso.',
      },
      {
        title: 'Completa tu perfil',
        description: 'Añade fotos de tu trabajo, servicios, precios y zona de cobertura.',
      },
      {
        title: 'Compra créditos',
        description:
          'Adquiere tokens de visualización según tus necesidades. Sin suscripciones mensuales.',
      },
      {
        title: 'Aparece en búsquedas',
        description:
          'Cuando una pareja busca tu categoría, apareces en los resultados y se consume 1 token.',
      },
      {
        title: 'Recibe solicitudes',
        description:
          'Las parejas interesadas te envían solicitudes de presupuesto con toda su información.',
      },
    ],
  },
  tokens: {
    badge: 'Sistema de Tokens',
    title: 'Pago por visualización, sin sorpresas',
    description: 'Solo pagas cuando tu perfil aparece en los resultados de búsqueda de una pareja',
    howTitle: '¿Cómo funcionan los tokens?',
    howList: [
      'Compras un pack de tokens según tus necesidades (ej: 100, 500, 1000 tokens)',
      'Cuando una pareja busca servicios en tu categoría, tu perfil puede aparecer',
      'Si apareces en sus resultados, se consume 1 token',
      'Los tokens no caducan: los usas a tu ritmo',
      'Puedes pausar tu perfil cuando quieras sin perder tokens',
    ],
    includedTitle: 'Lo que está incluido',
    included: [
      'Sistema de pago por visualización (tokens)',
      'Sin suscripción mensual fija',
      'Compra solo los tokens que necesites',
      'Los tokens no caducan',
      'Sin comisiones por contrato cerrado',
      'Dashboard y mensajería incluidos',
      'Página pública personalizable',
      'Actualización de portafolio ilimitada',
    ],
    notice: '💡 Los precios de los packs de tokens se anunciarán próximamente',
  },
  testimonials: {
    badge: 'Testimonios',
    title: 'Proveedores que ya confían en nosotros',
    items: [
      {
        quote:
          'Desde que estoy en MaLove.App recibo solicitudes cualificadas cada semana. Las parejas llegan con información clara y presupuesto definido.',
        name: 'Carlos Mendoza',
        role: 'Fotógrafo de bodas',
        rating: 5,
      },
      {
        quote:
          'Me gusta el sistema de tokens. Solo pago cuando me ven. No como otras plataformas donde pagas suscripción mensual aunque no consigas clientes.',
        name: 'Laura Vega',
        role: 'Wedding Planner',
        rating: 5,
      },
      {
        quote:
          'El dashboard es muy completo. Gestiono todas mis solicitudes, conversaciones y contratos desde un solo sitio.',
        name: 'Roberto Jiménez',
        role: 'Catering & Eventos',
        rating: 5,
      },
    ],
  },
  categoriesSection: {
    badge: 'Categorías Disponibles',
    title: '¿Tu negocio encaja en MaLove.App?',
    description: 'Trabajamos con todo tipo de proveedores del sector nupcial',
    list: [
      'Fotografía y Video',
      'Catering y Banquetes',
      'Locales y Venues',
      'Música y DJ',
      'Decoración y Flores',
      'Vestidos y Trajes',
      'Belleza y Estilismo',
      'Invitaciones y Papelería',
      'Pastelería',
      'Transporte',
      'Animación',
      'Wedding Planner',
      'Otro',
    ],
    formTitle: 'Solicita más información',
    formDescription:
      'Completa este formulario y nuestro equipo se pondrá en contacto contigo para explicarte todo el proceso.',
  },
  form: {
    fields: {
      name: {
        label: 'Nombre completo *',
        placeholder: 'Tu nombre',
      },
      email: {
        label: 'Email *',
        placeholder: 'tu@email.com',
      },
      business: {
        label: 'Nombre del negocio *',
        placeholder: 'Nombre de tu empresa',
      },
      category: {
        label: 'Categoría',
        placeholder: 'Selecciona una categoría',
      },
    },
    submit: 'Solicitar información',
    submitting: 'Enviando...',
    consent:
      'Al enviar este formulario aceptas que nos pongamos en contacto contigo para informarte sobre MaLove.App para proveedores.',
    messages: {
      success: '¡Gracias! Nos pondremos en contacto contigo en menos de 24 horas.',
      error: 'Por favor completa todos los campos obligatorios.',
    },
  },
  finalCta: {
    title: 'Empieza a recibir solicitudes de parejas hoy',
    description:
      'Regístrate gratis, completa tu perfil y empieza a aparecer en las búsquedas de miles de parejas.',
    primary: 'Registrarme ahora',
    secondary: 'Ver más detalles',
  },
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'MaLove.App para proveedores',
    serviceType: 'Generación de leads cualificados para proveedores de bodas',
    provider: {
      '@type': 'Organization',
      name: 'MaLove.App',
      url: 'https://malove.app',
      logo: 'https://malove.app/maloveapp-logo.png',
    },
    areaServed: {
      '@type': 'Country',
      name: 'España',
    },
    serviceAudience: {
      '@type': 'Audience',
      audienceType: 'Proveedores y profesionales de bodas',
    },
    offers: {
      '@type': 'Offer',
      url: 'https://malove.app/para-proveedores',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      description:
        'Sistema de pago por visualización con herramientas de portafolio, analítica y mensajería integrada.',
    },
  },
};

const ForSuppliers = () => {
  const { t, i18n } = useTranslation('marketing');

  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoBusiness, setDemoBusiness] = useState('');
  const [demoCategory, setDemoCategory] = useState('');
  const [demoMessage, setDemoMessage] = useState('');
  const [demoStatus, setDemoStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const content = useMemo(
    () =>
      i18n.exists('suppliers', { ns: 'marketing' })
        ? t('suppliers', { returnObjects: true })
        : fallbackContent,
    [i18n, t]
  );

  const categories = content.categoriesSection?.list ?? fallbackContent.categoriesSection.list;

  const benefits = useMemo(() => {
    const items = content.benefits?.items ?? fallbackContent.benefits.items;
    return items.map((item) => {
      const Icon = ICON_COMPONENTS[item.icon] ?? Users;
      return { ...item, Icon };
    });
  }, [content]);

  const heroMetrics = useMemo(() => {
    const metrics = content.hero?.stats?.metrics ?? fallbackContent.hero.stats.metrics;
    return metrics.map((metric) => {
      const Icon = ICON_COMPONENTS[metric.icon] ?? Star;
      return { ...metric, Icon };
    });
  }, [content]);

  const howSteps = content.howItWorks?.steps ?? fallbackContent.howItWorks.steps;
  const tokenHowList = content.tokens?.howList ?? fallbackContent.tokens.howList;
  const tokenIncluded = content.tokens?.included ?? fallbackContent.tokens.included;
  const testimonials = content.testimonials?.items ?? fallbackContent.testimonials.items;

  const structuredData = useMemo(() => {
    const base = content.structuredData ?? fallbackContent.structuredData;
    return {
      ...base,
      keywords: categories,
    };
  }, [content, categories]);

  const handleDemoSubmit = (event) => {
    event.preventDefault();

    if (!demoName.trim() || !demoEmail.trim() || !demoBusiness.trim()) {
      setDemoMessage(content.form?.messages?.error ?? fallbackContent.form.messages.error);
      setDemoStatus('error');
      return;
    }

    setIsSubmitting(true);
    setDemoMessage('');
    setDemoStatus(null);

    window.setTimeout(() => {
      setDemoMessage(content.form?.messages?.success ?? fallbackContent.form.messages.success);
      setDemoStatus('success');
      setDemoName('');
      setDemoEmail('');
      setDemoBusiness('');
      setDemoCategory('');
      setIsSubmitting(false);
    }, 1200);
  };
  return (
    <>
      <Helmet>
        <title>{content.meta?.title ?? fallbackContent.meta.title}</title>
        <meta
          name="description"
          content={content.meta?.description ?? fallbackContent.meta.description}
        />
        <link rel="canonical" href={content.meta?.canonical ?? fallbackContent.meta.canonical} />
        <meta property="og:title" content={content.meta?.ogTitle ?? fallbackContent.meta.ogTitle} />
        <meta
          property="og:description"
          content={content.meta?.ogDescription ?? fallbackContent.meta.ogDescription}
        />
        <meta
          property="og:url"
          content={content.meta?.canonical ?? fallbackContent.meta.canonical}
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={content.meta?.image ?? fallbackContent.meta.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={content.meta?.twitterTitle ?? fallbackContent.meta.twitterTitle}
        />
        <meta
          name="twitter:description"
          content={content.meta?.twitterDescription ?? fallbackContent.meta.twitterDescription}
        />
        <meta name="twitter:image" content={content.meta?.image ?? fallbackContent.meta.image} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <MarketingLayout>
        <section className="layout-container grid gap-12 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <img
                src={logoApp}
                alt={content.hero?.logoAlt ?? fallbackContent.hero.logoAlt}
                className="h-12 w-12 rounded-2xl bg-white object-contain shadow-sm ring-1 ring-[color:var(--color-primary-25)]"
              />
              <span className="text-sm font-semibold uppercase tracking-widest text-muted">
                {content.hero?.brand ?? fallbackContent.hero.brand}
              </span>
            </div>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-primary-40)] bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--color-primary)]" />
              {content.hero?.badge ?? fallbackContent.hero.badge}
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-body md:text-5xl">
              {content.hero?.title ?? fallbackContent.hero.title}
            </h1>
            {(content.hero?.description ?? fallbackContent.hero.description).map(
              (paragraph, index) => (
                <p key={`hero-description-${index}`} className="text-lg text-muted">
                  {paragraph}
                </p>
              )
            )}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/supplier/registro"
                className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:ring-offset-2"
              >
                {content.hero?.primaryCta ?? fallbackContent.hero.primaryCta}
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center rounded-md border border-[color:var(--color-primary-45)] px-5 py-3 text-sm font-semibold text-body transition-colors hover:border-[color:var(--color-primary)] hover:text-body focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:ring-offset-2"
              >
                {content.hero?.secondaryCta ?? fallbackContent.hero.secondaryCta}
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-soft bg-white/95 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                    {content.hero?.stats?.label ?? fallbackContent.hero.stats.label}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-body">
                    {content.hero?.stats?.title ?? fallbackContent.hero.stats.title}
                  </h3>
                </div>
                <span className="rounded-full bg-[var(--color-primary-10)] px-3 py-1 text-xs font-semibold text-[color:var(--color-primary)]">
                  {content.hero?.stats?.growthBadge ?? fallbackContent.hero.stats.growthBadge}
                </span>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {heroMetrics.slice(0, 2).map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-soft bg-white/95 p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <metric.Icon className="h-4 w-4 text-[color:var(--color-primary)]" />
                      <p className="text-sm text-muted">{metric.label}</p>
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-body">{metric.value}</p>
                    <p className="mt-1 text-xs text-muted">{metric.hint}</p>
                  </div>
                ))}
                <div className="rounded-2xl border border-soft bg-white/95 p-4 shadow-sm md:col-span-2">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-[color:var(--color-primary)]" />
                    <p className="text-sm text-muted">
                      {heroMetrics[2]?.label ?? fallbackContent.hero.stats.metrics[2].label}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-2xl font-semibold text-body">
                      {heroMetrics[2]?.value ?? fallbackContent.hero.stats.metrics[2].value}
                    </p>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={`rating-${i}`}
                          className="h-4 w-4 fill-[var(--color-primary)] text-[color:var(--color-primary)]"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {heroMetrics[2]?.hint ?? fallbackContent.hero.stats.metrics[2].hint}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="layout-container mt-24 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-semibold text-body">
              {content.benefits?.title ?? fallbackContent.benefits.title}
            </h2>
            <p className="mt-4 text-lg text-muted">
              {content.benefits?.subtitle ?? fallbackContent.benefits.subtitle}
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

        <section
          id="como-funciona"
          className="layout-container mt-24 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg"
        >
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[color:var(--color-primary)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {content.howItWorks?.badge ?? fallbackContent.howItWorks.badge}
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-body">
              {content.howItWorks?.title ?? fallbackContent.howItWorks.title}
            </h2>
            <p className="mt-4 text-lg text-muted">
              {content.howItWorks?.description ?? fallbackContent.howItWorks.description}
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-5">
            {howSteps.map((item, index) => (
              <article key={`${item.title}-${index}`} className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-2xl font-bold text-white shadow-lg">
                  {index + 1}
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
              <Wallet className="h-3.5 w-3.5" />
              {content.tokens?.badge ?? fallbackContent.tokens.badge}
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-body">
              {content.tokens?.title ?? fallbackContent.tokens.title}
            </h2>
            <p className="mt-4 text-lg text-muted">
              {content.tokens?.description ?? fallbackContent.tokens.description}
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-soft bg-white/95 p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-body">
                {content.tokens?.howTitle ?? fallbackContent.tokens.howTitle}
              </h3>
              <ul className="mt-6 space-y-4 text-sm text-muted">
                {tokenHowList.map((item, index) => (
                  <li key={`token-how-${index}`} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-[color:var(--color-primary)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-soft bg-white/95 p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-body">
                {content.tokens?.includedTitle ?? fallbackContent.tokens.includedTitle}
              </h3>
              <ul className="mt-6 space-y-3 text-sm text-muted">
                {tokenIncluded.map((feature, index) => (
                  <li key={`token-feature-${index}`} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-8 rounded-xl bg-primary-soft p-4">
                <p className="text-sm font-medium text-body">
                  {content.tokens?.notice ?? fallbackContent.tokens.notice}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="layout-container mt-24 space-y-10 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[color:var(--color-primary)]">
              <Star className="h-3.5 w-3.5" />
              {content.testimonials?.badge ?? fallbackContent.testimonials.badge}
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-body">
              {content.testimonials?.title ?? fallbackContent.testimonials.title}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <article
                key={`${testimonial.name}-${index}`}
                className="flex h-full flex-col gap-4 rounded-2xl border border-soft bg-white/95 p-6 shadow-sm"
              >
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, starIndex) => (
                    <Star
                      key={`testimonial-${index}-${starIndex}`}
                      className="h-4 w-4 fill-[var(--color-primary)] text-[color:var(--color-primary)]"
                    />
                  ))}
                </div>
                <p className="flex-1 text-sm text-body">{testimonial.quote}</p>
                <div>
                  <p className="text-sm font-semibold text-body">{testimonial.name}</p>
                  <p className="text-xs text-muted">{testimonial.role}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="layout-container mt-24 grid gap-10 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[color:var(--color-primary)]">
              <Crown className="h-3.5 w-3.5" />
              {content.categoriesSection?.badge ?? fallbackContent.categoriesSection.badge}
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-body">
              {content.categoriesSection?.title ?? fallbackContent.categoriesSection.title}
            </h2>
            <p className="mt-4 text-base text-muted">
              {content.categoriesSection?.description ??
                fallbackContent.categoriesSection.description}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <div
                  key={category}
                  className="flex items-center gap-2 rounded-lg border border-soft bg-white px-3 py-2 text-sm text-muted"
                >
                  <CheckCircle2 className="h-4 w-4 text-[color:var(--color-primary)]" />
                  {category}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-soft bg-white/95 p-8 shadow-lg">
            <h3 className="text-2xl font-semibold text-body">
              {content.categoriesSection?.formTitle ?? fallbackContent.categoriesSection.formTitle}
            </h3>
            <p className="mt-3 text-sm text-muted">
              {content.categoriesSection?.formDescription ??
                fallbackContent.categoriesSection.formDescription}
            </p>
            <form className="mt-6 space-y-4" onSubmit={handleDemoSubmit}>
              <div>
                <label htmlFor="demo-name" className="text-sm font-medium text-body">
                  {content.form?.fields?.name?.label ?? fallbackContent.form.fields.name.label}
                </label>
                <input
                  id="demo-name"
                  type="text"
                  value={demoName}
                  onChange={(event) => setDemoName(event.target.value)}
                  placeholder={
                    content.form?.fields?.name?.placeholder ??
                    fallbackContent.form.fields.name.placeholder
                  }
                  className="mt-1 w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                  required
                />
              </div>
              <div>
                <label htmlFor="demo-email" className="text-sm font-medium text-body">
                  {content.form?.fields?.email?.label ?? fallbackContent.form.fields.email.label}
                </label>
                <input
                  id="demo-email"
                  type="email"
                  value={demoEmail}
                  onChange={(event) => setDemoEmail(event.target.value)}
                  placeholder={
                    content.form?.fields?.email?.placeholder ??
                    fallbackContent.form.fields.email.placeholder
                  }
                  className="mt-1 w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                  required
                />
              </div>
              <div>
                <label htmlFor="demo-business" className="text-sm font-medium text-body">
                  {content.form?.fields?.business?.label ??
                    fallbackContent.form.fields.business.label}
                </label>
                <input
                  id="demo-business"
                  type="text"
                  value={demoBusiness}
                  onChange={(event) => setDemoBusiness(event.target.value)}
                  placeholder={
                    content.form?.fields?.business?.placeholder ??
                    fallbackContent.form.fields.business.placeholder
                  }
                  className="mt-1 w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                  required
                />
              </div>
              <div>
                <label htmlFor="demo-category" className="text-sm font-medium text-body">
                  {content.form?.fields?.category?.label ??
                    fallbackContent.form.fields.category.label}
                </label>
                <select
                  id="demo-category"
                  value={demoCategory}
                  onChange={(event) => setDemoCategory(event.target.value)}
                  className="mt-1 w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                >
                  <option value="">
                    {content.form?.fields?.category?.placeholder ??
                      fallbackContent.form.fields.category.placeholder}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {isSubmitting
                  ? (content.form?.submitting ?? fallbackContent.form.submitting)
                  : (content.form?.submit ?? fallbackContent.form.submit)}
              </button>
              {demoMessage && (
                <p
                  className={`text-sm ${demoStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}
                >
                  {demoMessage}
                </p>
              )}
            </form>
            <div className="mt-6 rounded-2xl border border-soft bg-primary-soft p-4 text-xs text-muted">
              {content.form?.consent ?? fallbackContent.form.consent}
            </div>
          </div>
        </section>

        <section className="layout-container mt-24 rounded-3xl border border-[color:var(--color-primary-45)] bg-[var(--color-primary)] px-8 py-10 text-white shadow-lg md:px-12">
          <div className="grid gap-10 md:grid-cols-[2fr,1fr] md:items-center">
            <div>
              <h2 className="text-3xl font-semibold">
                {content.finalCta?.title ?? fallbackContent.finalCta.title}
              </h2>
              <p className="mt-4 text-base text-white/85">
                {content.finalCta?.description ?? fallbackContent.finalCta.description}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                to="/supplier/registro"
                className="inline-flex items-center justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-[color:var(--color-primary)] transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[color:var(--color-primary)]"
              >
                {content.finalCta?.primary ?? fallbackContent.finalCta.primary}
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center rounded-md border border-white/70 px-4 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[color:var(--color-primary)]"
              >
                {content.finalCta?.secondary ?? fallbackContent.finalCta.secondary}
              </a>
            </div>
          </div>
        </section>
      </MarketingLayout>
    </>
  );
};

export default ForSuppliers;
