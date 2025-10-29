import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Crown,
  Users,
  BarChart3,
  Sparkles,
  CheckCircle2,
  Layers,
  Briefcase,
  Star,
  Send,
  Zap,
  TrendingUp,
  Shield,
  Award,
  MessageSquare,
} from 'lucide-react';

import MarketingLayout from '../../components/marketing/MarketingLayout';
import logoApp from '../../assets/logo-mark.svg';

const ForPlanners = () => {
  const [selectedBilling, setSelectedBilling] = useState('annual');
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoCompany, setDemoCompany] = useState('');
  const [demoMessage, setDemoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDemoSubmit = (event) => {
    event.preventDefault();

    if (!demoName.trim() || !demoEmail.trim()) {
      setDemoMessage('Por favor completa todos los campos obligatorios.');
      return;
    }

    setIsSubmitting(true);
    setDemoMessage('');

    window.setTimeout(() => {
      setDemoMessage('¡Gracias! Te contactaremos pronto para agendar tu demo personalizada.');
      setDemoName('');
      setDemoEmail('');
      setDemoCompany('');
      setIsSubmitting(false);
    }, 1200);
  };

  const benefits = useMemo(
    () => [
      {
        icon: <Layers className="h-5 w-5" />,
        title: 'Gestión Multi-Boda',
        description:
          'Dashboard unificado para gestionar todas tus bodas activas. Cambia entre eventos con un clic.',
      },
      {
        icon: <Users className="h-5 w-5" />,
        title: 'Equipo Colaborativo',
        description:
          'Invita a colaboradores, asigna tareas y mantén a todo tu equipo sincronizado en tiempo real.',
      },
      {
        icon: <Briefcase className="h-5 w-5" />,
        title: 'Plantillas Reutilizables',
        description:
          'Duplica checklists, presupuestos y workflows exitosos para estandarizar tu operación.',
      },
      {
        icon: <BarChart3 className="h-5 w-5" />,
        title: 'Analytics Avanzados',
        description:
          'Reportes de rendimiento, KPIs por boda y dashboard consolidado para toda tu agencia.',
      },
      {
        icon: <Crown className="h-5 w-5" />,
        title: 'Tus Clientes en Premium',
        description:
          'Las parejas que gestionas acceden automáticamente a funciones premium sin coste adicional.',
      },
      {
        icon: <Shield className="h-5 w-5" />,
        title: 'Visibilidad en Marketplace',
        description:
          'Aparece destacado en nuestro marketplace de planners para captar nuevos clientes.',
      },
    ],
    []
  );

  const plannerPlans = useMemo(
    () => [
      {
        key: 'exploratory',
        name: 'Exploratorio',
        badge: 'Prueba Gratis',
        price: 0,
        suffix: 'para siempre',
        description: 'Perfecto para conocer la plataforma',
        weddings: '0 bodas reales',
        features: [
          'Acceso demo completo',
          'Explorar todas las funcionalidades',
          'Datos de prueba precargados',
          'Ideal para onboarding',
          'Sin tarjeta de crédito',
        ],
        cta: 'Empezar gratis',
        highlight: false,
      },
      {
        key: 'studio',
        name: 'Studio',
        badge: 'Planners Independientes',
        price: 120,
        suffix: '/año',
        description: 'Para planners que gestionan pocas bodas al año',
        weddings: 'Hasta 5 bodas activas',
        features: [
          '5 bodas activas simultáneas',
          'Plantillas duplicables',
          'Prioridad en marketplace',
          'Tus clientes en modo premium',
          'Exportación ilimitada',
          'Soporte prioritario',
        ],
        cta: 'Comenzar con Studio',
        highlight: false,
      },
      {
        key: 'studio_plus',
        name: 'Studio Plus',
        badge: 'Más Colaboradores',
        price: 200,
        suffix: '/año',
        description: 'Studio con equipo y soporte especializado',
        weddings: 'Hasta 5 bodas + 7 colaboradores',
        features: [
          'Todo lo de Studio',
          '+ 7 colaboradores incluidos',
          'Concierge de proveedores',
          'Negociaciones preferentes',
          'Sesiones con especialistas',
          'Analytics avanzados',
        ],
        cta: 'Elegir Studio Plus',
        highlight: false,
      },
      {
        key: 'agency',
        name: 'Agency',
        badge: 'Agencias Boutique',
        price: 200,
        suffix: '/año',
        description: 'Para agencias pequeñas con múltiples bodas',
        weddings: 'Hasta 10 bodas activas',
        features: [
          '10 bodas activas simultáneas',
          '10 colaboradores',
          'Marketplace PRO',
          'Automatizaciones multi-cliente',
          'Reportes personalizados',
          'Analytics consolidados',
        ],
        cta: 'Comenzar con Agency',
        highlight: true,
      },
      {
        key: 'agency_plus',
        name: 'Agency Plus',
        badge: 'White Label',
        price: 400,
        suffix: '/año',
        description: 'Agency con tu marca y soporte dedicado',
        weddings: 'Hasta 10 bodas + White Label',
        features: [
          'Todo lo de Agency',
          'White label completo',
          'Sin marca MaLove.App',
          'Integraciones API',
          'Soporte dedicado 24/7',
          'Onboarding personalizado',
        ],
        cta: 'Elegir Agency Plus',
        highlight: false,
      },
      {
        key: 'teams',
        name: 'Teams',
        badge: 'Equipos Grandes',
        price: 800,
        suffix: '/año',
        description: 'Para agencias con alto volumen',
        weddings: 'Hasta 40 bodas activas',
        features: [
          '40 bodas activas simultáneas',
          '1 planner principal + 3 extra',
          'Gestión de equipos',
          'Dashboard consolidado',
          'Asignación de tareas',
          'Reportes de productividad',
        ],
        cta: 'Comenzar con Teams',
        highlight: false,
      },
      {
        key: 'teams_unlimited',
        name: 'Teams Unlimited',
        badge: 'Enterprise',
        price: 1500,
        suffix: '/año',
        description: 'Sin límites, máxima personalización',
        weddings: 'Bodas ilimitadas',
        features: [
          'Bodas ilimitadas',
          'Colaboradores ilimitados',
          'White label + dominio custom',
          'API custom',
          'Soporte 24/7 dedicado',
          'Formación personalizada',
        ],
        cta: 'Contactar para Enterprise',
        highlight: false,
      },
    ],
    []
  );

  const plannerStructuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'MaLove.App para wedding planners',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: 'https://malove.app/para-planners',
      offers: plannerPlans
        .filter((plan) => plan.price > 0)
        .map((plan) => ({
          '@type': 'Offer',
          name: plan.name,
          price: plan.price,
          priceCurrency: 'EUR',
          description: plan.description,
          url: `https://malove.app/para-planners#plan-${plan.key}`,
          availability: 'https://schema.org/InStock',
        })),
      audience: {
        '@type': 'Audience',
        audienceType: 'Wedding planners y agencias de eventos',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '215',
      },
      featureList: [
        'Colaboración multi-equipo',
        'Automatizaciones personalizadas',
        'CRM integrado de proveedores',
      ],
    }),
    [plannerPlans]
  );

  const useCases = [
    {
      title: 'Planners Independientes',
      description: 'Gestiona 1-5 bodas al año con organización profesional',
      recommendedPlan: 'Studio o Studio Plus',
      icon: <Award className="h-6 w-6" />,
    },
    {
      title: 'Agencias Boutique',
      description: 'Equipo pequeño gestionando 5-15 bodas anuales',
      recommendedPlan: 'Agency o Agency Plus',
      icon: <Briefcase className="h-6 w-6" />,
    },
    {
      title: 'Agencias Establecidas',
      description: 'Equipos grandes con +30 bodas al año',
      recommendedPlan: 'Teams o Teams Unlimited',
      icon: <TrendingUp className="h-6 w-6" />,
    },
  ];

  const testimonials = [
    {
      quote:
        'MaLove.App transformó nuestra operación. Antes usábamos Excel y perdíamos horas en tareas manuales. Ahora todo está centralizado y automatizado.',
      name: 'María González',
      role: 'Directora en Momentos Perfectos',
      rating: 5,
    },
    {
      quote:
        'El mejor ROI que hemos tenido. Recuperamos la inversión en el primer mes solo por el tiempo ahorrado en coordinación con clientes.',
      name: 'Carlos Ruiz',
      role: 'Wedding Planner Independiente',
      rating: 5,
    },
    {
      quote:
        'Las plantillas reutilizables son un game changer. Duplicamos una boda exitosa y tenemos todo el setup listo en minutos.',
      name: 'Ana Martínez',
      role: 'Fundadora de Eventos Especiales',
      rating: 5,
    },
  ];

  return (
    <>
      <Helmet>
        <title>MaLove.App para planners | Opera múltiples bodas con un solo workspace</title>
        <meta
          name="description"
          content="Coordina bodas con tu equipo, centraliza proveedores y automatiza workflows con la plataforma profesional MaLove.App."
        />
        <link rel="canonical" href="https://malove.app/para-planners" />
        <meta
          property="og:title"
          content="MaLove.App para planners | Opera múltiples bodas con un solo workspace"
        />
        <meta
          property="og:description"
          content="Gestiona proyectos, finanzas y comunicación con herramientas diseñadas para wedding planners."
        />
        <meta property="og:url" content="https://malove.app/para-planners" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://malove.app/maloveapp-logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="MaLove.App para planners | Opera múltiples bodas con un solo workspace"
        />
        <meta
          name="twitter:description"
          content="Simplifica la operación de tu agencia de bodas con dashboards, automatizaciones y herramientas colaborativas."
        />
        <meta name="twitter:image" content="https://malove.app/maloveapp-logo.png" />
        <script type="application/ld+json">{JSON.stringify(plannerStructuredData)}</script>
      </Helmet>

      <MarketingLayout>
        <section className="layout-container grid gap-12 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <img
                src={logoApp}
                alt="MaLove.App"
                className="h-12 w-12 rounded-2xl bg-white object-contain shadow-sm ring-1 ring-[var(--color-primary)]/25"
              />
              <span className="text-sm font-semibold uppercase tracking-widest text-muted">
                MaLove.App
              </span>
            </div>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
              <Crown className="h-3.5 w-3.5 text-[var(--color-primary)]" />
              Para Wedding Planners
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-body md:text-5xl">
              Gestiona todas tus bodas desde una sola plataforma profesional
            </h1>
            <p className="mt-6 text-lg text-muted">
              MaLove.App es el software definitivo para wedding planners. Dashboard multi-boda,
              plantillas reutilizables, equipo colaborativo y analytics en tiempo real.
            </p>
            <p className="mt-3 text-lg text-muted">
              Tus clientes acceden a funciones premium automáticamente. Sin costes ocultos.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
              >
                Prueba gratis 14 días
              </Link>
              <a
                href="#planes"
                className="inline-flex items-center justify-center rounded-md border border-[var(--color-primary)]/45 px-5 py-3 text-sm font-semibold text-body transition-colors hover:border-[var(--color-primary)] hover:text-body focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
              >
                Ver planes
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-soft bg-white/95 p-6 shadow-lg shadow-[var(--color-primary)]/12">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                    Tu Dashboard
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-body">Vista de Planners</h3>
                </div>
                <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                  8 bodas activas
                </span>
              </div>
              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-soft bg-white/95 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-body">Ana & Diego</p>
                      <p className="text-xs text-muted">Progreso: 92%</p>
                    </div>
                    <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      En curso
                    </div>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-primary-soft">
                    <div className="h-full w-11/12 rounded-full bg-[var(--color-primary)]" />
                  </div>
                </div>
                <div className="rounded-2xl border border-soft bg-white/95 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-body">Laura & Marco</p>
                      <p className="text-xs text-muted">3 pagos pendientes</p>
                    </div>
                    <div className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                      Atención
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-soft bg-white/95 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-body">Carolina & Javier</p>
                      <p className="text-xs text-muted">156 confirmados</p>
                    </div>
                    <div className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                      Invitados
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="layout-container mt-24 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-semibold text-body">
              Todo lo que necesitas para gestionar bodas profesionalmente
            </h2>
            <p className="mt-4 text-lg text-muted">
              Herramientas diseñadas específicamente para wedding planners
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {benefits.map((benefit) => (
              <article
                key={benefit.title}
                className="rounded-2xl border border-soft bg-white/95 p-6 shadow-sm shadow-[var(--color-primary)]/10"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-[var(--color-primary)]">
                  {benefit.icon}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-body">{benefit.title}</h3>
                <p className="mt-3 text-sm text-muted">{benefit.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="layout-container mt-24 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              <Briefcase className="h-3.5 w-3.5" />
              Casos de Uso
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-body">
              Encuentra tu plan ideal según tu operación
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {useCases.map((useCase) => (
              <article
                key={useCase.title}
                className="rounded-2xl border border-soft bg-white/95 p-6 shadow-sm shadow-[var(--color-primary)]/10"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-[var(--color-primary)]">
                  {useCase.icon}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-body">{useCase.title}</h3>
                <p className="mt-2 text-sm text-muted">{useCase.description}</p>
                <div className="mt-4 rounded-lg bg-primary-soft/40 px-3 py-2">
                  <p className="text-xs font-medium text-body">
                    Recomendado: <span className="font-semibold">{useCase.recommendedPlan}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="planes"
          className="layout-container mt-24 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15"
        >
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              <Crown className="h-3.5 w-3.5" />
              Planes para Planners
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-body">
              Elige el plan que se adapta a tu agencia
            </h2>
            <p className="mt-4 text-lg text-muted">
              Todos los planes incluyen actualizaciones gratuitas y soporte
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plannerPlans.map((plan) => {
              const cardClasses = [
                'flex h-full flex-col rounded-3xl border bg-surface p-6 shadow-sm shadow-[var(--color-primary)]/12 transition-transform hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--color-primary)]/20',
                plan.highlight
                  ? 'border-[var(--color-primary)]/55 ring-2 ring-[var(--color-primary)]/20'
                  : 'border-soft',
              ].join(' ');

              return (
                <article key={plan.key} className={cardClasses}>
                  {plan.badge && (
                    <span className="inline-flex self-start rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                      {plan.badge}
                    </span>
                  )}
                  <div className="mt-4">
                    <h3 className="text-2xl font-semibold text-body">{plan.name}</h3>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-body">
                        {plan.price === 0 ? 'Gratis' : `${plan.price}€`}
                      </span>
                      <span className="text-sm text-muted">{plan.suffix}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted">{plan.description}</p>
                    <div className="mt-3 rounded-lg bg-primary-soft/40 px-3 py-2">
                      <p className="text-xs font-semibold text-body">{plan.weddings}</p>
                    </div>
                  </div>

                  <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-muted">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-primary)]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/signup"
                    className={`mt-8 inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 ${
                      plan.highlight
                        ? 'bg-[var(--color-primary)] text-white hover:brightness-95'
                        : 'border border-[var(--color-primary)]/45 text-body hover:border-[var(--color-primary)]'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className="layout-container mt-24 space-y-10 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              <Star className="h-3.5 w-3.5" />
              Testimonios
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-body">
              Wedding planners que ya confían en nosotros
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article
                key={testimonial.name}
                className="flex h-full flex-col gap-4 rounded-2xl border border-soft bg-white/95 p-6 shadow-sm shadow-[var(--color-primary)]/10"
              >
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-[var(--color-primary)] text-[var(--color-primary)]"
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

        <section className="layout-container mt-24 grid gap-10 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              <MessageSquare className="h-3.5 w-3.5" />
              Demo Personalizada
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-body">
              Agenda una demo con nuestro equipo
            </h2>
            <p className="mt-4 text-base text-muted">
              Te mostraremos cómo MaLove.App puede transformar la gestión de tu agencia. Sin
              compromiso.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--color-primary)]" />
                <span>Revisión de tu flujo actual de trabajo</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--color-primary)]" />
                <span>Recomendaciones personalizadas</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--color-primary)]" />
                <span>Estimación de ROI para tu agencia</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--color-primary)]" />
                <span>Respuestas a todas tus preguntas</span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-soft bg-white/95 p-8 shadow-lg shadow-[var(--color-primary)]/15">
            <h3 className="text-2xl font-semibold text-body">Solicita tu demo</h3>
            <p className="mt-3 text-sm text-muted">
              Completa el formulario y te contactaremos en menos de 24 horas.
            </p>
            <form className="mt-6 space-y-4" onSubmit={handleDemoSubmit}>
              <div>
                <label htmlFor="demo-name" className="text-sm font-medium text-body">
                  Nombre completo *
                </label>
                <input
                  id="demo-name"
                  type="text"
                  value={demoName}
                  onChange={(event) => setDemoName(event.target.value)}
                  placeholder="Tu nombre"
                  className="mt-1 w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  required
                />
              </div>
              <div>
                <label htmlFor="demo-email" className="text-sm font-medium text-body">
                  Email *
                </label>
                <input
                  id="demo-email"
                  type="email"
                  value={demoEmail}
                  onChange={(event) => setDemoEmail(event.target.value)}
                  placeholder="tu@email.com"
                  className="mt-1 w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  required
                />
              </div>
              <div>
                <label htmlFor="demo-company" className="text-sm font-medium text-body">
                  Agencia/Negocio
                </label>
                <input
                  id="demo-company"
                  type="text"
                  value={demoCompany}
                  onChange={(event) => setDemoCompany(event.target.value)}
                  placeholder="Nombre de tu agencia"
                  className="mt-1 w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Enviando...' : 'Solicitar demo'}
              </button>
              {demoMessage && (
                <p
                  className={`text-sm ${
                    demoMessage.includes('Gracias') ? 'text-[var(--color-primary)]' : 'text-red-600'
                  }`}
                >
                  {demoMessage}
                </p>
              )}
            </form>
          </div>
        </section>

        <section className="layout-container mt-24 rounded-3xl border border-[var(--color-primary)]/45 bg-[var(--color-primary)] px-8 py-10 text-white shadow-lg shadow-[var(--color-primary)]/30 md:px-12">
          <div className="grid gap-10 md:grid-cols-[2fr,1fr] md:items-center">
            <div>
              <h2 className="text-3xl font-semibold">
                Empieza a gestionar tus bodas profesionalmente hoy
              </h2>
              <p className="mt-4 text-base text-white/85">
                Prueba gratis durante 14 días. Sin tarjeta de crédito. Cancela cuando quieras.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--color-primary)]"
              >
                Comenzar prueba gratis
              </Link>
              <a
                href="#planes"
                className="inline-flex items-center justify-center rounded-md border border-white/70 px-4 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--color-primary)]"
              >
                Ver todos los planes
              </a>
            </div>
          </div>
        </section>
      </MarketingLayout>
    </>
  );
};

export default ForPlanners;
