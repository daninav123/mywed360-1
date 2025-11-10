import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('marketing');
  const [selectedBilling, setSelectedBilling] = useState('annual');
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoCompany, setDemoCompany] = useState('');
  const [demoMessage, setDemoMessage] = useState('');
  const [demoStatus, setDemoStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const demoChecklist = useMemo(
    () =>
      t('planners.demo.checklist', {
        returnObjects: true,
        defaultValue: [
          'Revisión de tu flujo actual de trabajo',
          'Recomendaciones personalizadas',
          'Estimación de ROI para tu agencia',
          'Respuestas a todas tus preguntas',
        ],
      }),
    [t]
  );

  const handleDemoSubmit = (event) => {
    event.preventDefault();

    if (!demoName.trim() || !demoEmail.trim()) {
      setDemoMessage(
        t('planners.demo.form.messages.error', 'Por favor completa todos los campos obligatorios.')
      );
      setDemoStatus('error');
      return;
    }

    setIsSubmitting(true);
    setDemoMessage('');
    setDemoStatus(null);

    window.setTimeout(() => {
      setDemoMessage(
        t(
          'planners.demo.form.messages.success',
          '¡Gracias! Te contactaremos pronto para agendar tu demo personalizada.'
        )
      );
      setDemoStatus('success');
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
        title: t('planners.benefits.multiWedding.title', 'Gestión Multi-Boda'),
        description: t(
          'planners.benefits.multiWedding.description',
          'Dashboard unificado para gestionar todas tus bodas activas. Cambia entre eventos con un clic.'
        ),
      },
      {
        icon: <Users className="h-5 w-5" />,
        title: t('planners.benefits.team.title', 'Equipo Colaborativo'),
        description: t(
          'planners.benefits.team.description',
          'Invita a colaboradores, asigna tareas y mantén a todo tu equipo sincronizado en tiempo real.'
        ),
      },
      {
        icon: <Briefcase className="h-5 w-5" />,
        title: t('planners.benefits.templates.title', 'Plantillas Reutilizables'),
        description: t(
          'planners.benefits.templates.description',
          'Duplica checklists, presupuestos y workflows exitosos para estandarizar tu operación.'
        ),
      },
      {
        icon: <BarChart3 className="h-5 w-5" />,
        title: t('planners.benefits.analytics.title', 'Analytics Avanzados'),
        description: t(
          'planners.benefits.analytics.description',
          'Reportes de rendimiento, KPIs por boda y dashboard consolidado para toda tu agencia.'
        ),
      },
      {
        icon: <Crown className="h-5 w-5" />,
        title: t('planners.benefits.premiumClients.title', 'Tus Clientes en Premium'),
        description: t(
          'planners.benefits.premiumClients.description',
          'Las parejas que gestionas acceden automáticamente a funciones premium sin coste adicional.'
        ),
      },
      {
        icon: <Shield className="h-5 w-5" />,
        title: t('planners.benefits.marketplace.title', 'Visibilidad en Marketplace'),
        description: t(
          'planners.benefits.marketplace.description',
          'Aparece destacado en nuestro marketplace de planners para captar nuevos clientes.'
        ),
      },
    ],
    [t]
  );

  const plannerPlans = useMemo(
    () => [
      {
        key: 'exploratory',
        name: t('planners.plans.exploratory.name', 'Exploratorio'),
        badge: t('planners.plans.exploratory.badge', 'Prueba Gratis'),
        price: 0,
        suffix: t('planners.plans.exploratory.suffix', 'para siempre'),
        description: t(
          'planners.plans.exploratory.description',
          'Perfecto para conocer la plataforma'
        ),
        weddings: t('planners.plans.exploratory.weddings', '0 bodas reales'),
        features: t('planners.plans.exploratory.features', {
          returnObjects: true,
          defaultValue: [
            'Acceso demo completo',
            'Explorar todas las funcionalidades',
            'Datos de prueba precargados',
            'Ideal para onboarding',
            'Sin tarjeta de crédito',
          ],
        }),
        cta: t('planners.plans.exploratory.cta', 'Empezar gratis'),
        highlight: false,
      },
      {
        key: 'studio',
        name: t('planners.plans.studio.name', 'Studio'),
        badge: t('planners.plans.studio.badge', 'Planners Independientes'),
        price: 120,
        suffix: t('planners.plans.studio.suffix', '/año'),
        description: t(
          'planners.plans.studio.description',
          'Para planners que gestionan pocas bodas al año'
        ),
        weddings: t('planners.plans.studio.weddings', 'Hasta 5 bodas activas'),
        features: t('planners.plans.studio.features', {
          returnObjects: true,
          defaultValue: [
            '5 bodas activas simultáneas',
            'Plantillas duplicables',
            'Prioridad en marketplace',
            'Tus clientes en modo premium',
            'Exportación ilimitada',
            'Soporte prioritario',
          ],
        }),
        cta: t('planners.plans.studio.cta', 'Comenzar con Studio'),
        highlight: false,
      },
      {
        key: 'studio_plus',
        name: t('planners.plans.studioPlus.name', 'Studio Plus'),
        badge: t('planners.plans.studioPlus.badge', 'Más Colaboradores'),
        price: 200,
        suffix: t('planners.plans.studioPlus.suffix', '/año'),
        description: t(
          'planners.plans.studioPlus.description',
          'Studio con equipo y soporte especializado'
        ),
        weddings: t('planners.plans.studioPlus.weddings', 'Hasta 5 bodas + 7 colaboradores'),
        features: t('planners.plans.studioPlus.features', {
          returnObjects: true,
          defaultValue: [
            'Todo lo de Studio',
            '+ 7 colaboradores incluidos',
            'Concierge de proveedores',
            'Negociaciones preferentes',
            'Sesiones con especialistas',
            'Analytics avanzados',
          ],
        }),
        cta: t('planners.plans.studioPlus.cta', 'Elegir Studio Plus'),
        highlight: false,
      },
      {
        key: 'agency',
        name: t('planners.plans.agency.name', 'Agency'),
        badge: t('planners.plans.agency.badge', 'Agencias Boutique'),
        price: 200,
        suffix: t('planners.plans.agency.suffix', '/año'),
        description: t(
          'planners.plans.agency.description',
          'Para agencias pequeñas con múltiples bodas'
        ),
        weddings: t('planners.plans.agency.weddings', 'Hasta 10 bodas activas'),
        features: t('planners.plans.agency.features', {
          returnObjects: true,
          defaultValue: [
            '10 bodas activas simultáneas',
            '10 colaboradores',
            'Marketplace PRO',
            'Automatizaciones multi-cliente',
            'Reportes personalizados',
            'Analytics consolidados',
          ],
        }),
        cta: t('planners.plans.agency.cta', 'Comenzar con Agency'),
        highlight: true,
      },
      {
        key: 'agency_plus',
        name: t('planners.plans.agencyPlus.name', 'Agency Plus'),
        badge: t('planners.plans.agencyPlus.badge', 'White Label'),
        price: 400,
        suffix: t('planners.plans.agencyPlus.suffix', '/año'),
        description: t(
          'planners.plans.agencyPlus.description',
          'Agency con tu marca y soporte dedicado'
        ),
        weddings: t('planners.plans.agencyPlus.weddings', 'Hasta 10 bodas + White Label'),
        features: t('planners.plans.agencyPlus.features', {
          returnObjects: true,
          defaultValue: [
            'Todo lo de Agency',
            'White label completo',
            'Sin marca MaLove.App',
            'Integraciones API',
            'Soporte dedicado 24/7',
            'Onboarding personalizado',
          ],
        }),
        cta: t('planners.plans.agencyPlus.cta', 'Elegir Agency Plus'),
        highlight: false,
      },
      {
        key: 'teams',
        name: t('planners.plans.teams.name', 'Teams'),
        badge: t('planners.plans.teams.badge', 'Equipos Grandes'),
        price: 800,
        suffix: t('planners.plans.teams.suffix', '/año'),
        description: t('planners.plans.teams.description', 'Para agencias con alto volumen'),
        weddings: t('planners.plans.teams.weddings', 'Hasta 40 bodas activas'),
        features: t('planners.plans.teams.features', {
          returnObjects: true,
          defaultValue: [
            '40 bodas activas simultáneas',
            '1 planner principal + 3 extra',
            'Gestión de equipos',
            'Dashboard consolidado',
            'Asignación de tareas',
            'Reportes de productividad',
          ],
        }),
        cta: t('planners.plans.teams.cta', 'Comenzar con Teams'),
        highlight: false,
      },
      {
        key: 'teams_unlimited',
        name: t('planners.plans.teamsUnlimited.name', 'Teams Unlimited'),
        badge: t('planners.plans.teamsUnlimited.badge', 'Enterprise'),
        price: 1500,
        suffix: t('planners.plans.teamsUnlimited.suffix', '/año'),
        description: t(
          'planners.plans.teamsUnlimited.description',
          'Sin límites, máxima personalización'
        ),
        weddings: t('planners.plans.teamsUnlimited.weddings', 'Bodas ilimitadas'),
        features: t('planners.plans.teamsUnlimited.features', {
          returnObjects: true,
          defaultValue: [
            'Bodas ilimitadas',
            'Colaboradores ilimitados',
            'White label + dominio custom',
            'API custom',
            'Soporte 24/7 dedicado',
            'Formación personalizada',
          ],
        }),
        cta: t('planners.plans.teamsUnlimited.cta', 'Contactar para Enterprise'),
        highlight: false,
      },
    ],
    [t]
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

  const useCases = useMemo(
    () => [
      {
        title: t('planners.useCases.independent.title', 'Planners Independientes'),
        description: t(
          'planners.useCases.independent.description',
          'Gestiona 1-5 bodas al año con organización profesional'
        ),
        recommendedPlan: t('planners.useCases.independent.recommended', 'Studio o Studio Plus'),
        icon: <Award className="h-6 w-6" />,
      },
      {
        title: t('planners.useCases.boutique.title', 'Agencias Boutique'),
        description: t(
          'planners.useCases.boutique.description',
          'Equipo pequeño gestionando 5-15 bodas anuales'
        ),
        recommendedPlan: t('planners.useCases.boutique.recommended', 'Agency o Agency Plus'),
        icon: <Briefcase className="h-6 w-6" />,
      },
      {
        title: t('planners.useCases.established.title', 'Agencias Establecidas'),
        description: t(
          'planners.useCases.established.description',
          'Equipos grandes con +30 bodas al año'
        ),
        recommendedPlan: t('planners.useCases.established.recommended', 'Teams o Teams Unlimited'),
        icon: <TrendingUp className="h-6 w-6" />,
      },
    ],
    [t]
  );

  const testimonials = useMemo(
    () => [
      {
        quote: t(
          'planners.testimonials.0.quote',
          'MaLove.App transformó nuestra operación. Antes usábamos Excel y perdíamos horas en tareas manuales. Ahora todo está centralizado y automatizado.'
        ),
        name: t('planners.testimonials.0.name', 'María González'),
        role: t('planners.testimonials.0.role', 'Directora en Momentos Perfectos'),
        rating: 5,
      },
      {
        quote: t(
          'planners.testimonials.1.quote',
          'El mejor ROI que hemos tenido. Recuperamos la inversión en el primer mes solo por el tiempo ahorrado en coordinación con clientes.'
        ),
        name: t('planners.testimonials.1.name', 'Carlos Ruiz'),
        role: t('planners.testimonials.1.role', 'Wedding Planner Independiente'),
        rating: 5,
      },
      {
        quote: t(
          'planners.testimonials.2.quote',
          'Las plantillas reutilizables son un game changer. Duplicamos una boda exitosa y tenemos todo el setup listo en minutos.'
        ),
        name: t('planners.testimonials.2.name', 'Ana Martínez'),
        role: t('planners.testimonials.2.role', 'Fundadora de Eventos Especiales'),
        rating: 5,
      },
    ],
    [t]
  );

  return (
    <>
      <Helmet>
        <title>
          {t(
            'planners.meta.title',
            'MaLove.App para planners | Opera múltiples bodas con un solo workspace'
          )}
        </title>
        <meta
          name="description"
          content={t(
            'planners.meta.description',
            'Coordina bodas con tu equipo, centraliza proveedores y automatiza workflows con la plataforma profesional MaLove.App.'
          )}
        />
        <link
          rel="canonical"
          href={t('planners.meta.canonical', 'https://malove.app/para-planners')}
        />
        <meta
          property="og:title"
          content={t(
            'planners.meta.ogTitle',
            'MaLove.App para planners | Opera múltiples bodas con un solo workspace'
          )}
        />
        <meta
          property="og:description"
          content={t(
            'planners.meta.ogDescription',
            'Gestiona proyectos, finanzas y comunicación con herramientas diseñadas para wedding planners.'
          )}
        />
        <meta
          property="og:url"
          content={t('planners.meta.canonical', 'https://malove.app/para-planners')}
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content={t('planners.meta.image', 'https://malove.app/maloveapp-logo.png')}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={t(
            'planners.meta.twitterTitle',
            'MaLove.App para planners | Opera múltiples bodas con un solo workspace'
          )}
        />
        <meta
          name="twitter:description"
          content={t(
            'planners.meta.twitterDescription',
            'Simplifica la operación de tu agencia de bodas con dashboards, automatizaciones y herramientas colaborativas.'
          )}
        />
        <meta
          name="twitter:image"
          content={t('planners.meta.image', 'https://malove.app/maloveapp-logo.png')}
        />
        <script type="application/ld+json">{JSON.stringify(plannerStructuredData)}</script>
      </Helmet>

      <MarketingLayout>
        <section className="layout-container grid gap-12 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <img
                src={logoApp}
                alt={t('planners.hero.logoAlt', 'MaLove.App')}
                className="h-12 w-12 rounded-2xl bg-white object-contain shadow-sm ring-1 ring-[var(--color-primary)]/25"
              />
              <span className="text-sm font-semibold uppercase tracking-widest text-muted">
                {t('planners.hero.brand', 'MaLove.App')}
              </span>
            </div>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
              <Crown className="h-3.5 w-3.5 text-[var(--color-primary)]" />
              {t('planners.hero.badge', 'Para Wedding Planners')}
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-body md:text-5xl">
              {t(
                'planners.hero.title',
                'Gestiona todas tus bodas desde una sola plataforma profesional'
              )}
            </h1>
            <p className="mt-6 text-lg text-muted">
              {t(
                'planners.hero.description.0',
                'MaLove.App es el software definitivo para wedding planners. Dashboard multi-boda, plantillas reutilizables, equipo colaborativo y analytics en tiempo real.'
              )}
            </p>
            <p className="mt-3 text-lg text-muted">
              {t(
                'planners.hero.description.1',
                'Tus clientes acceden a funciones premium automáticamente. Sin costes ocultos.'
              )}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
              >
                {t('planners.hero.primaryCta', 'Prueba gratis 14 días')}
              </Link>
              <a
                href="#planes"
                className="inline-flex items-center justify-center rounded-md border border-[var(--color-primary)]/45 px-5 py-3 text-sm font-semibold text-body transition-colors hover:border-[var(--color-primary)] hover:text-body focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
              >
                {t('planners.hero.secondaryCta', 'Ver planes')}
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-soft bg-white/95 p-6 shadow-lg shadow-[var(--color-primary)]/12">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                    {t('planners.hero.stats.label', 'Tu Dashboard')}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-body">
                    {t('planners.hero.stats.title', 'Vista de Planners')}
                  </h3>
                </div>
                <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                  {t('planners.hero.stats.badge', '8 bodas activas')}
                </span>
              </div>
              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-soft bg-white/95 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-body">
                        {t('planners.hero.stats.cards.0.title', 'Ana & Diego')}
                      </p>
                      <p className="text-xs text-muted">
                        {t('planners.hero.stats.cards.0.subtitle', 'Progreso: 92%')}
                      </p>
                    </div>
                    <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      {t('planners.hero.stats.cards.0.badge', 'En curso')}
                    </div>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-primary-soft">
                    <div className="h-full w-11/12 rounded-full bg-[var(--color-primary)]" />
                  </div>
                </div>
                <div className="rounded-2xl border border-soft bg-white/95 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-body">
                        {t('planners.hero.stats.cards.1.title', 'Laura & Marco')}
                      </p>
                      <p className="text-xs text-muted">
                        {t('planners.hero.stats.cards.1.subtitle', '3 pagos pendientes')}
                      </p>
                    </div>
                    <div className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                      {t('planners.hero.stats.cards.1.badge', 'Atención')}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-soft bg-white/95 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-body">
                        {t('planners.hero.stats.cards.2.title', 'Carolina & Javier')}
                      </p>
                      <p className="text-xs text-muted">
                        {t('planners.hero.stats.cards.2.subtitle', '156 confirmados')}
                      </p>
                    </div>
                    <div className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                      {t('planners.hero.stats.cards.2.badge', 'Invitados')}
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
              {t(
                'planners.benefits.sectionTitle',
                'Todo lo que necesitas para gestionar bodas profesionalmente'
              )}
            </h2>
            <p className="mt-4 text-lg text-muted">
              {t(
                'planners.benefits.sectionDescription',
                'Herramientas diseñadas específicamente para wedding planners'
              )}
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
              {t('planners.useCases.badge', 'Casos de Uso')}
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-body">
              {t('planners.useCases.sectionTitle', 'Encuentra tu plan ideal según tu operación')}
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
                    {t('planners.useCases.recommendedLabel', 'Recomendado')}:{' '}
                    <span className="font-semibold">{useCase.recommendedPlan}</span>
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
              {t('planners.plans.badge', 'Planes para Planners')}
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-body">
              {t('planners.plans.sectionTitle', 'Elige el plan que se adapta a tu agencia')}
            </h2>
            <p className="mt-4 text-lg text-muted">
              {t(
                'planners.plans.sectionDescription',
                'Todos los planes incluyen actualizaciones gratuitas y soporte'
              )}
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
                        {plan.price === 0
                          ? t('planners.plans.freeLabel', 'Gratis')
                          : `${plan.price}€`}
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
              {t('planners.testimonials.badge', 'Testimonios')}
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-body">
              {t(
                'planners.testimonials.sectionTitle',
                'Wedding planners que ya confían en nosotros'
              )}
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
              {t('planners.demo.badge', 'Demo Personalizada')}
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-body">
              {t('planners.demo.title', 'Agenda una demo con nuestro equipo')}
            </h2>
            <p className="mt-4 text-base text-muted">
              {t(
                'planners.demo.description',
                'Te mostraremos cómo MaLove.App puede transformar la gestión de tu agencia. Sin compromiso.'
              )}
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted">
              {demoChecklist.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--color-primary)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-soft bg-white/95 p-8 shadow-lg shadow-[var(--color-primary)]/15">
            <h3 className="text-2xl font-semibold text-body">
              {t('planners.demo.form.title', 'Solicita tu demo')}
            </h3>
            <p className="mt-3 text-sm text-muted">
              {t(
                'planners.demo.form.description',
                'Completa el formulario y te contactaremos en menos de 24 horas.'
              )}
            </p>
            <form className="mt-6 space-y-4" onSubmit={handleDemoSubmit}>
              <div>
                <label htmlFor="demo-name" className="text-sm font-medium text-body">
                  {t('planners.demo.form.fields.name.label', 'Nombre completo *')}
                </label>
                <input
                  id="demo-name"
                  type="text"
                  value={demoName}
                  onChange={(event) => setDemoName(event.target.value)}
                  placeholder={t('planners.demo.form.fields.name.placeholder', 'Tu nombre')}
                  className="mt-1 w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  required
                />
              </div>
              <div>
                <label htmlFor="demo-email" className="text-sm font-medium text-body">
                  {t('planners.demo.form.fields.email.label', 'Email *')}
                </label>
                <input
                  id="demo-email"
                  type="email"
                  value={demoEmail}
                  onChange={(event) => setDemoEmail(event.target.value)}
                  placeholder={t('planners.demo.form.fields.email.placeholder', 'tu@email.com')}
                  className="mt-1 w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  required
                />
              </div>
              <div>
                <label htmlFor="demo-company" className="text-sm font-medium text-body">
                  {t('planners.demo.form.fields.company.label', 'Agencia/Negocio')}
                </label>
                <input
                  id="demo-company"
                  type="text"
                  value={demoCompany}
                  onChange={(event) => setDemoCompany(event.target.value)}
                  placeholder={t(
                    'planners.demo.form.fields.company.placeholder',
                    'Nombre de tu agencia'
                  )}
                  className="mt-1 w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {isSubmitting
                  ? t('planners.demo.form.submitting', 'Enviando...')
                  : t('planners.demo.form.submit', 'Solicitar demo')}
              </button>
              {demoMessage && (
                <p
                  className={`text-sm ${
                    demoStatus === 'success' ? 'text-[var(--color-primary)]' : 'text-red-600'
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
                {t('planners.finalCta.title', 'Empieza a gestionar tus bodas profesionalmente hoy')}
              </h2>
              <p className="mt-4 text-base text-white/85">
                {t(
                  'planners.finalCta.description',
                  'Prueba gratis durante 14 días. Sin tarjeta de crédito. Cancela cuando quieras.'
                )}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--color-primary)]"
              >
                {t('planners.finalCta.primary', 'Comenzar prueba gratis')}
              </Link>
              <a
                href="#planes"
                className="inline-flex items-center justify-center rounded-md border border-white/70 px-4 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--color-primary)]"
              >
                {t('planners.finalCta.secondary', 'Ver todos los planes')}
              </a>
            </div>
          </div>
        </section>
      </MarketingLayout>
    </>
  );
};

export default ForPlanners;
