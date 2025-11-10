import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import MarketingLayout from '../../components/marketing/MarketingLayout';
import logoApp from '../../assets/logo-mark.svg';
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
import useTranslations from '../../hooks/useTranslations';

const ensureObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const ensureArray = (value) => (Array.isArray(value) ? value : []);

const mergeObjects = (base, override) => {
  const target = { ...ensureObject(base) };
  const source = ensureObject(override);
  Object.keys(source).forEach((key) => {
    if (source[key] !== undefined) {
      target[key] = source[key];
    }
  });
  return target;
};

const pickArray = (primary, fallback) => {
  const candidate = ensureArray(primary);
  if (candidate.length) {
    return candidate;
  }
  return ensureArray(fallback);
};

const normalizeFallbacks = (fallbackLng) => {
  if (!fallbackLng) {
    return [];
  }
  if (typeof fallbackLng === 'string') {
    return [fallbackLng];
  }
  if (Array.isArray(fallbackLng)) {
    return fallbackLng;
  }
  if (typeof fallbackLng === 'object') {
    return Object.values(fallbackLng)
      .flat()
      .filter(Boolean);
  }
  return [];
};

const uniqueLanguages = (list) => {
  const seen = new Set();
  const ordered = [];
  list.forEach((lng) => {
    if (lng && !seen.has(lng)) {
      seen.add(lng);
      ordered.push(lng);
    }
  });
  return ordered;
};

const DEFAULT_LANDING_COPY = {
  hero: {
    brandLabel: 'MaLove.App',
    logoAlt: 'MaLove.App logo',
    badge: 'Plataforma todo en uno para planear bodas',
    title:
      'Coordina tu boda sonada en menos tiempo con herramientas profesionales listas para tu equipo.',
    description: [
      'MaLove.App combina planificacion, finanzas, comunicacion y diseno en un espacio centralizado.',
      'Simplifica tareas diarias, involucra a proveedores y ofrece a tus invitados una experiencia memorable.',
    ],
    actions: {
      primary: 'Empezar gratis',
      secondary: 'Ver todo lo que incluye la app',
    },
    highlights: [
      { value: '360 deg', label: 'Vision integral del evento' },
      { value: '+50', label: 'Integraciones activas' },
      { value: '24/7', label: 'Acceso desde cualquier dispositivo' },
    ],
    widget: {
      summaryLabel: 'Resumen general',
      eventName: 'Boda Valeria & Tomas',
      growth: '+18% semana',
      confirmedGuests: {
        label: 'Invitados confirmados',
        value: '132',
      },
      budget: {
        label: 'Presupuesto ejecutado',
        value: '$18.4k',
        pendingInvoices: '4 facturas pendientes',
      },
      tasks: {
        label: 'Tareas criticas esta semana',
        items: [
          {
            day: '21',
            text: 'Confirmar degustacion del menu y enviar feedback al catering.',
          },
          {
            day: '22',
            text: 'Generar plano de mesas para invitados VIP y compartir con protocolo.',
          },
        ],
      },
      assistant: {
        label: 'Asistente MaLove.App',
        message:
          '"Tu cronograma esta en 82%. Recomiendo enviar el recordatorio de alojamiento antes del lunes y confirmar proveedores restantes."',
      },
    },
  },
  modules: {
    title: 'Todo lo que necesitas en un solo lugar',
    description:
      'MaLove.App simplifica la logistica con modulos colaborativos listos para planners, proveedores e invitados.',
    items: [
      {
        title: 'Gestion integral de invitados',
        description:
          'Centraliza confirmaciones, mesas y preferencias en un unico lugar con informacion siempre sincronizada.',
      },
      {
        title: 'Finanzas con control total',
        description:
          'Sigue presupuesto, pagos y contratos con recordatorios automaticos y reportes claros para tu equipo.',
      },
      {
        title: 'Disenos y comunicacion',
        description:
          'Invitaciones, emails y sitio web de boda listos para compartir desde un mismo flujo de trabajo.',
      },
    ],
  },
  planner: {
    badge: 'Disenado para planners',
    title: 'Control total de tu cartera de eventos sin hojas de calculo.',
    description:
      'MaLove.App facilita la gestion de multiples bodas con dashboards, plantillas reutilizables y reportes exportables para tu agencia. Organiza a tu equipo y mantente un paso adelante con una sola plataforma.',
    highlights: [
      {
        key: 'portfolio',
        title: 'Portafolio multi boda',
        description:
          'Gestiona eventos simultaneos con paneles independientes. Cambia de boda en un clic sin perder el contexto.',
      },
      {
        key: 'kits',
        title: 'Kits repetibles',
        description:
          'Duplica checklists, presupuestos y plantillas de comunicacion para replicar tus flujos favoritos en segundos.',
      },
      {
        key: 'alerts',
        title: 'Alertas proactivas',
        description:
          'Recibe avisos de tareas criticas, contratos por vencer y pagos pendientes para cada cliente.',
      },
    ],
    dashboard: {
      title: 'Vista de planners',
      portfolioLabel: 'Portafolio actual',
      portfolioValue: '8 bodas activas',
      portfolioBadge: '2 nuevas este mes',
      statusLabel: 'Estado de clientes',
      statusItems: [
        '⬢ Ana & Diego - cronograma: 92%',
        '⬢ Laura & Marco - pagos: 3 facturas pendientes',
        '⬢ Carolina & Javier - invitados: 156 confirmados',
      ],
      performanceLabel: 'Rendimiento mensual',
      performanceNote: 'Tiempo promedio por boda: 38% menos que el ano pasado.',
    },
  },
  benefits: {
    badge: 'Beneficios clave',
    title: 'Una operacion cuidada de principio a fin',
    description:
      'Disenada para planners que necesitan visibilidad y parejas que buscan tranquilidad. MaLove.App automatiza tareas repetitivas y mantiene a todos alineados.',
    items: {
      timelines: {
        title: 'Tiempos bajo control',
        description:
          'Checklists dinamicos, recordatorios inteligentes y cronologias listas para compartir con tu equipo.',
      },
      collaboration: {
        title: 'Colaboracion real',
        description:
          'Roles para planners, asistentes, proveedores e invitados con vistas personalizadas.',
      },
      branding: {
        title: 'Diseno consistente',
        description:
          'Sitio web de boda, invitaciones y comunicaciones con tu branding en minutos.',
      },
      security: {
        title: 'Datos seguros',
        description:
          'Infraestructura cloud y permisos granulares para resguardar contratos, pagos y contactos.',
      },
    },
  },
  stories: {
    badge: 'Historias reales',
    title: 'MaLove.App impulsa planners y parejas alrededor del mundo',
    description:
      'Mas de 12 mil bodas se gestionan en MaLove.App. Cada equipo aprovecha automatizaciones, insights y plantillas para dedicar mas tiempo a la creatividad.',
    testimonials: [
      {
        quote:
          'Integramos MaLove.App con nuestro proceso y ahora disponemos de dashboards compartidos con proveedores clave. El equipo llega a cada reunion preparado.',
        name: 'Martina R.',
        role: 'Planner boutique en Madrid',
      },
      {
        quote:
          'Como pareja necesitabamos claridad. Los recordatorios y la web de invitados nos permitieron responder rapido y sin correos duplicados.',
        name: 'David y Sofia',
        role: 'Evento 250 invitados, Bogota',
      },
    ],
    trust: {
      title: 'Confian en MaLove.App',
      brands: ['Lumiere Events', 'Novia Atelier', 'Festiva Group', 'Urban Weddings'],
      note: 'Mas de 200 planners activos en Europa y LATAM utilizan MaLove.App para estandarizar procesos y ofrecer experiencias memorables.',
    },
  },
  faq: {
    badge: 'Preguntas frecuentes',
    title: 'Todo lo que necesitas saber antes de empezar',
    items: [
      {
        question: 'Puedo probar MaLove.App gratis?',
        answer:
          'Si. El plan Essentials es gratuito para siempre y desbloquea funciones clave (invitados, tareas, sitio web). El plan Professional tiene 14 dias de prueba con integraciones avanzadas.',
      },
      {
        question: 'MaLove.App funciona para planners con multiples eventos?',
        answer:
          'Claro. El dashboard multi evento permite alternar bodas, compartir permisos con colaboradores y automatizar actualizaciones con proveedores de cada evento.',
      },
      {
        question: 'Que soporte recibo durante la implementacion?',
        answer:
          'Ofrecemos onboarding guiado, biblioteca de plantillas y consultorias opcionales. El plan Enterprise incluye gestor dedicado y sesiones de entrenamiento para equipos.',
      },
    ],
    form: {
      title: 'Solicita una demo personalizada',
      description:
        'Cuentanos sobre tu operacion y agenda una videollamada con nuestro equipo. Recibiras recomendaciones basadas en tu flujo actual y una guia de configuracion rapida.',
      fields: {
        name: {
          label: 'Nombre completo',
          placeholder: 'Tu nombre',
        },
        email: {
          label: 'Email de contacto',
          placeholder: 'hola@tuagencia.com',
        },
      },
      messages: {
        submit: 'Agendar demo',
        submitting: 'Enviando solicitud...',
        success: 'Gracias. Nuestro equipo se pondra en contacto contigo en menos de 24 horas.',
        error: 'Completa nombre y email para solicitar una demo.',
      },
      consent:
        'Al enviar aceptas recibir comunicaciones relacionadas con MaLove.App. Puedes cancelar la suscripcion en cualquier momento.',
    },
  },
  cta: {
    title: 'Lista para usar en minutos.',
    description:
      'Crea tu cuenta, importa tu lista de invitados y activa automatizaciones que te acompanen desde el primer dia.',
    primary: 'Crear cuenta gratuita',
    secondary: 'Comparar planes',
  },
};

const BENEFIT_ICON_MAP = {
  timelines: CalendarCheck,
  collaboration: Users,
  branding: Palette,
  security: Shield,
};

const PLANNER_HIGHLIGHT_ICON_MAP = {
  portfolio: Layers,
  kits: Briefcase,
  alerts: Clock3,
};

const Landing = () => {
  const { i18n } = useTranslations();
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoMessage, setDemoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const landingRaw = useMemo(
    () =>
      ensureObject(
        (() => {
          const activeLanguages = Array.isArray(i18n.languages)
            ? i18n.languages
            : [i18n.language, i18n.resolvedLanguage].filter(Boolean);
          const fallbackLanguages = normalizeFallbacks(i18n.options?.fallbackLng);
          const searchOrder = uniqueLanguages([
            ...activeLanguages,
            ...fallbackLanguages,
            'es',
            'en',
          ]);

          for (const language of searchOrder) {
            const resource = i18n.getResource(language, 'marketing', 'landing');
            if (resource) {
              return resource;
            }
          }

          return {};
        })()
      ),
    [i18n.language, i18n.options?.fallbackLng, i18n.resolvedLanguage]
  );

  const hero = mergeObjects(DEFAULT_LANDING_COPY.hero, landingRaw.hero);
  const heroDescriptions = pickArray(hero.description, DEFAULT_LANDING_COPY.hero.description);
  const heroHighlights = pickArray(hero.highlights, DEFAULT_LANDING_COPY.hero.highlights);
  const heroActions = mergeObjects(DEFAULT_LANDING_COPY.hero.actions, hero.actions);
  const heroPrimaryActionLabel = heroActions.primary;
  const heroSecondaryActionLabel = heroActions.secondary;
  const heroWidget = mergeObjects(DEFAULT_LANDING_COPY.hero.widget, hero.widget);
  const heroWidgetConfirmedGuests = mergeObjects(
    DEFAULT_LANDING_COPY.hero.widget.confirmedGuests,
    heroWidget.confirmedGuests
  );
  const heroWidgetBudget = mergeObjects(
    DEFAULT_LANDING_COPY.hero.widget.budget,
    heroWidget.budget
  );
  const heroWidgetTasks = mergeObjects(
    DEFAULT_LANDING_COPY.hero.widget.tasks,
    heroWidget.tasks
  );
  const heroWidgetTasksItems = pickArray(
    heroWidgetTasks.items,
    DEFAULT_LANDING_COPY.hero.widget.tasks.items
  );
  const heroWidgetAssistant = mergeObjects(
    DEFAULT_LANDING_COPY.hero.widget.assistant,
    heroWidget.assistant
  );

  const modules = mergeObjects(DEFAULT_LANDING_COPY.modules, landingRaw.modules);
  const modulesItems = pickArray(modules.items, DEFAULT_LANDING_COPY.modules.items);

  const planner = mergeObjects(DEFAULT_LANDING_COPY.planner, landingRaw.planner);
  const plannerHighlightsSource = pickArray(
    planner.highlights,
    DEFAULT_LANDING_COPY.planner.highlights
  );
  const plannerHighlights = plannerHighlightsSource.map((item) => {
    const base =
      DEFAULT_LANDING_COPY.planner.highlights.find((highlight) => highlight.key === item.key) ||
      {};
    const merged = mergeObjects(base, item);
    const Icon = PLANNER_HIGHLIGHT_ICON_MAP[merged.key] ?? Sparkles;
    return { ...merged, Icon };
  });
  const plannerDashboard = mergeObjects(
    DEFAULT_LANDING_COPY.planner.dashboard,
    planner.dashboard
  );
  const plannerStatusItems = pickArray(
    plannerDashboard.statusItems,
    DEFAULT_LANDING_COPY.planner.dashboard.statusItems
  );

  const benefits = mergeObjects(DEFAULT_LANDING_COPY.benefits, landingRaw.benefits);
  const benefitKeys = Array.from(
    new Set([
      ...Object.keys(DEFAULT_LANDING_COPY.benefits.items),
      ...Object.keys(ensureObject(benefits.items)),
    ])
  );
  const benefitItems = benefitKeys
    .map((key) => {
      const base = DEFAULT_LANDING_COPY.benefits.items[key] || {};
      const merged = mergeObjects(base, ensureObject(benefits.items?.[key]));
      const Icon = BENEFIT_ICON_MAP[key] ?? Sparkles;
      return merged.title ? { key, Icon, ...merged } : null;
    })
    .filter(Boolean);

  const stories = mergeObjects(DEFAULT_LANDING_COPY.stories, landingRaw.stories);
  const testimonials = pickArray(
    stories.testimonials,
    DEFAULT_LANDING_COPY.stories.testimonials
  );
  const trust = mergeObjects(DEFAULT_LANDING_COPY.stories.trust, stories.trust);
  const trustBrands = pickArray(trust.brands, DEFAULT_LANDING_COPY.stories.trust.brands);

  const faq = mergeObjects(DEFAULT_LANDING_COPY.faq, landingRaw.faq);
  const faqItems = pickArray(faq.items, DEFAULT_LANDING_COPY.faq.items);
  const faqForm = mergeObjects(DEFAULT_LANDING_COPY.faq.form, faq.form);
  const faqFormFields = {
    name: mergeObjects(DEFAULT_LANDING_COPY.faq.form.fields.name, faqForm.fields?.name),
    email: mergeObjects(DEFAULT_LANDING_COPY.faq.form.fields.email, faqForm.fields?.email),
  };
  const faqFormMessages = mergeObjects(
    DEFAULT_LANDING_COPY.faq.form.messages,
    faqForm.messages
  );
  const faqSubmitLabel = faqFormMessages.submit;
  const faqSubmittingLabel = faqFormMessages.submitting;

  const cta = mergeObjects(DEFAULT_LANDING_COPY.cta, landingRaw.cta);

  const handleDemoSubmit = (event) => {
    event.preventDefault();

    if (!demoName.trim() || !demoEmail.trim()) {
      setDemoMessage(faqFormMessages.error || '');
      return;
    }

    setIsSubmitting(true);
    setDemoMessage('');

    window.setTimeout(() => {
      setDemoMessage(faqFormMessages.success || '');
      setDemoName('');
      setDemoEmail('');
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <MarketingLayout>
      <section className="layout-container grid gap-12 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
        <div>
          <div className="flex items-center gap-3">
            <img
              src={logoApp}
              alt={hero.logoAlt || hero.brandLabel || 'MaLove.App'}
              className="h-12 w-12 rounded-2xl bg-white object-contain shadow-sm ring-1 ring-[var(--color-primary)]/25"
            />
            <span className="text-sm font-semibold uppercase tracking-widest text-muted">
              {hero.brandLabel || 'MaLove.App'}
            </span>
          </div>
          {hero.badge ? (
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
              <Sparkles className="h-3.5 w-3.5 text-[var(--color-primary)]" />
              {hero.badge}
            </span>
          ) : null}
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-body md:text-5xl">
            {hero.title ||
              'Coordina tu boda en menos tiempo con herramientas profesionales listas para tu equipo.'}
          </h1>
          {heroDescriptions.map((text, index) => (
            <p
              key={text || index}
              className={`text-lg text-muted ${index === 0 ? 'mt-6' : 'mt-3'}`}
            >
              {text}
            </p>
          ))}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              {heroPrimaryActionLabel}
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center justify-center rounded-md border border-[var(--color-primary)]/45 px-5 py-3 text-sm font-semibold text-body transition-colors hover:border-[var(--color-primary)] hover:text-body focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              {heroSecondaryActionLabel}
            </Link>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {heroHighlights.map((highlight) => (
              <li
                key={`${highlight.value}-${highlight.label}`}
                className="rounded-2xl border border-soft bg-white/95 p-4 shadow-sm shadow-[var(--color-primary)]/10"
              >
                <span className="text-xl font-semibold text-body">{highlight.value}</span>
                <p className="mt-1 text-sm text-muted">{highlight.label}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          {heroWidget.summaryLabel ? (
            <div className="rounded-3xl border border-soft bg-white/95 p-6 shadow-lg shadow-[var(--color-primary)]/12">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                    {heroWidget.summaryLabel}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-body">
                    {heroWidget.eventName || 'Boda Valeria & Tomas'}
                  </h3>
                </div>
                {heroWidget.growth ? (
                  <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                    {heroWidget.growth}
                  </span>
                ) : null}
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {heroWidgetConfirmedGuests.label ? (
                  <div className="rounded-2xl border border-soft bg-white/95 p-4 shadow-sm">
                    <p className="text-sm text-muted">{heroWidgetConfirmedGuests.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-body">
                      {heroWidgetConfirmedGuests.value}
                    </p>
                    <div className="mt-3 h-2.5 w-full rounded-full bg-primary-soft">
                      <div className="h-full w-3/4 rounded-full bg-[var(--color-primary)]" />
                    </div>
                  </div>
                ) : null}
                {heroWidgetBudget.label ? (
                  <div className="rounded-2xl border border-soft bg-white/95 p-4 shadow-sm">
                    <p className="text-sm text-muted">{heroWidgetBudget.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-body">{heroWidgetBudget.value}</p>
                    {heroWidgetBudget.pendingInvoices ? (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                        {heroWidgetBudget.pendingInvoices}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {heroWidgetTasks.label ? (
                  <div className="rounded-2xl border border-soft bg-white/95 p-4 shadow-sm md:col-span-2">
                    <p className="text-sm text-muted">{heroWidgetTasks.label}</p>
                    <ul className="mt-3 space-y-2 text-sm">
                      {heroWidgetTasksItems.map((task) => (
                        <li
                          key={`${task.day}-${task.text}`}
                          className="flex items-center gap-3 rounded-lg bg-primary-soft/30 px-3 py-2 text-body"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-[var(--color-primary)]">
                            {task.day}
                          </span>
                          {task.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
          {heroWidgetAssistant.label ? (
            <div className="ml-auto mt-6 w-5/6 rounded-[1.5rem] border border-soft bg-white/90 p-5 shadow-lg shadow-[var(--color-primary)]/10 backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                {heroWidgetAssistant.label}
              </p>
              <p className="mt-3 text-sm text-body">{heroWidgetAssistant.message}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="layout-container mt-24 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-semibold text-body">
            {modules.title || 'Todo lo que necesitas en un solo lugar'}
          </h2>
          {modules.description ? (
            <p className="mt-4 text-lg text-muted">{modules.description}</p>
          ) : null}
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {modulesItems.map((feature) => (
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
            {planner.badge ? (
              <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                {planner.badge}
              </span>
            ) : null}
            <h2 className="mt-5 text-3xl font-semibold text-body">
              {planner.title || 'Control total de tu cartera de eventos sin hojas de calculo.'}
            </h2>
            {planner.description ? (
              <p className="mt-3 text-base text-muted">{planner.description}</p>
            ) : null}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {plannerHighlights.map(({ key, title, description, Icon }) => (
                <article
                  key={key || title}
                  className="flex h-full flex-col gap-3 rounded-2xl border border-soft bg-white p-4 shadow-sm shadow-[var(--color-primary)]/10"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-[var(--color-primary)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-sm font-semibold text-body">{title}</h3>
                  <p className="text-xs text-muted">{description}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-soft bg-primary-soft/40 p-6">
            {plannerDashboard.title ? (
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                {plannerDashboard.title}
              </p>
            ) : null}
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-soft bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-medium text-muted">
                  {plannerDashboard.portfolioLabel}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-lg font-semibold text-body">
                    {plannerDashboard.portfolioValue}
                  </p>
                  {plannerDashboard.portfolioBadge ? (
                    <span className="rounded-full bg-[var(--color-primary)]/10 px-2 py-1 text-xs text-[var(--color-primary)]">
                      {plannerDashboard.portfolioBadge}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="rounded-xl border border-soft bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-medium text-muted">{plannerDashboard.statusLabel}</p>
                <ul className="mt-2 space-y-1 text-xs text-muted">
                  {plannerStatusItems.map((status) => (
                    <li key={status}>{status}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-soft bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-medium text-muted">
                  {plannerDashboard.performanceLabel}
                </p>
                <div className="mt-3 h-2 w-full rounded-full bg-primary-soft">
                  <div className="h-full w-2/3 rounded-full bg-[var(--color-primary)]" />
                </div>
                {plannerDashboard.performanceNote ? (
                  <p className="mt-2 text-xs text-muted">{plannerDashboard.performanceNote}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="layout-container mt-24 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15">
        <div className="mx-auto max-w-4xl text-center">
          {benefits.badge ? (
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              {benefits.badge}
            </span>
          ) : null}
          <h2 className="mt-5 text-3xl font-semibold text-body">
            {benefits.title || 'Beneficios clave'}
          </h2>
        </div>
        {benefits.description ? (
          <p className="mx-auto mt-4 max-w-3xl text-center text-base text-muted">
            {benefits.description}
          </p>
        ) : null}
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {benefitItems.map(({ key, title, description, Icon }) => (
            <article
              key={key}
              className="flex h-full flex-col gap-3 rounded-2xl border border-soft bg-white/95 p-6 text-center shadow-sm shadow-[var(--color-primary)]/10"
            >
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-[var(--color-primary)]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-semibold text-body">{title}</h3>
              <p className="text-sm text-muted">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="layout-container mt-24 space-y-10 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15">
        <div className="grid gap-10 lg:grid-cols-[1.3fr,0.7fr] lg:items-center">
          <div>
            {stories.badge ? (
              <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                {stories.badge}
              </span>
            ) : null}
            <h2 className="mt-5 text-3xl font-semibold text-body">
              {stories.title || 'Historias reales'}
            </h2>
            {stories.description ? (
              <p className="mt-3 text-base text-muted">{stories.description}</p>
            ) : null}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {testimonials.map((testimonial) => (
                <article
                  key={testimonial.name}
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
            {trust.title ? (
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                {trust.title}
              </p>
            ) : null}
            <div className="mt-6 grid gap-6 text-center text-sm font-medium text-muted sm:grid-cols-2">
              {trustBrands.map((brand) => (
                <div
                  key={brand}
                  className="rounded-xl border border-soft bg-primary-soft/40 py-4 text-muted"
                >
                  {brand}
                </div>
              ))}
            </div>
            {trust.note ? (
              <p className="mt-6 text-xs text-muted">{trust.note}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="layout-container mt-24 grid gap-10 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15 lg:grid-cols-[1fr,1fr]">
        <div>
          {faq.badge ? (
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              {faq.badge}
            </span>
          ) : null}
          <h2 className="mt-5 text-3xl font-semibold text-body">
            {faq.title || 'Preguntas frecuentes'}
          </h2>
          <div className="mt-6 space-y-4">
            {faqItems.map((faqItem) => (
              <details
                key={faqItem.question}
                className="group rounded-2xl border border-soft bg-white/95 p-5 shadow-sm shadow-[var(--color-primary)]/10 open:ring-1 open:ring-[var(--color-primary)]/20"
              >
                <summary className="flex cursor-pointer items-center justify-between text-base font-semibold text-body">
                  {faqItem.question}
                  <span className="text-sm font-normal text-[var(--color-primary)] transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted">{faqItem.answer}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-soft bg-white/95 p-8 shadow-lg shadow-[var(--color-primary)]/15">
          <h3 className="text-2xl font-semibold text-body">
            {faqForm.title || 'Solicita una demo personalizada'}
          </h3>
          {faqForm.description ? (
            <p className="mt-3 text-sm text-muted">{faqForm.description}</p>
          ) : null}
          <form className="mt-6 space-y-4" onSubmit={handleDemoSubmit}>
            <div>
              <label htmlFor="demo-name" className="text-sm font-medium text-body">
                {faqFormFields.name.label || 'Nombre completo'}
              </label>
              <input
                id="demo-name"
                type="text"
                value={demoName}
                onChange={(event) => setDemoName(event.target.value)}
                placeholder={faqFormFields.name.placeholder || 'Tu nombre'}
                className="mt-1 w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div>
              <label htmlFor="demo-email" className="text-sm font-medium text-body">
                {faqFormFields.email.label || 'Email de contacto'}
              </label>
              <input
                id="demo-email"
                type="email"
                value={demoEmail}
                onChange={(event) => setDemoEmail(event.target.value)}
                placeholder={faqFormFields.email.placeholder || 'hola@tuagencia.com'}
                className="mt-1 w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? faqSubmittingLabel : faqSubmitLabel}
            </button>
            {demoMessage ? <p className="text-sm text-[var(--color-primary)]">{demoMessage}</p> : null}
          </form>
          {faqForm.consent ? (
            <div className="mt-6 rounded-2xl border border-soft bg-primary-soft/40 p-4 text-xs text-muted">
              {faqForm.consent}
            </div>
          ) : null}
        </div>
      </section>

      <section className="layout-container mt-24 rounded-3xl border border-[var(--color-primary)]/45 bg-[var(--color-primary)] px-8 py-10 text-white shadow-lg shadow-[var(--color-primary)]/30 md:px-12">
        <div className="grid gap-10 md:grid-cols-[2fr,1fr] md:items-center">
          <div>
            <h2 className="text-3xl font-semibold">{cta.title || 'Lista para usar en minutos.'}</h2>
            {cta.description ? (
              <p className="mt-4 text-base text-white/85">{cta.description}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--color-primary)]"
            >
              {cta.primary || 'Crear cuenta gratuita'}
            </Link>
            <Link
              to="/precios"
              className="inline-flex items-center justify-center rounded-md border border-white/70 px-4 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--color-primary)]"
            >
              {cta.secondary || 'Comparar planes'}
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default Landing;
