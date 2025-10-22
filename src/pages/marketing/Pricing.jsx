import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, HeartHandshake, Users, CheckCircle2, Crown } from 'lucide-react';

import MarketingLayout from '../../components/marketing/MarketingLayout';

const couplePlans = [
  {
    name: 'Free',
    price: 0,
    priceSuffix: 'por boda',
    description: 'Organiza una boda íntima o prueba la plataforma sin coste.',
    features: [
      '1 boda activa con hasta 80 invitados',
      'Seating plan básico y control de presupuesto',
      'Directorio de proveedores y anuncios visibles',
      'Plantillas esenciales y soporte estándar',
    ],
    cta: 'Crear cuenta gratuita',
    link: '/signup',
    highlight: false,
  },
  {
    name: 'Wedding Pass',
    price: 50,
    priceSuffix: 'pago único por boda',
    description:
      'Desbloquea todas las herramientas premium para tu evento sin suscripciones anuales.',
    features: [
      'Invitados y proveedores ilimitados',
      'Contacto directo con proveedores y protocolo completo',
      'Hasta 50 diseños web y soporte prioritario',
      'Plantillas premium para planificación avanzada',
    ],
    cta: 'Comprar Wedding Pass',
    link: '/signup?wedding-pass',
    highlight: true,
  },
  {
    name: 'Wedding Pass Plus',
    price: 85,
    priceSuffix: 'pago único por boda',
    description:
      'La opción más completa para bodas premium y trabajo colaborativo con ayudantes.',
    features: [
      'Todo lo incluido en Wedding Pass',
      'Elimina la marca en invitaciones, PDFs y pantallas',
      'Biblioteca completa de diseños y galería de recuerdos',
      '1 ayudante con acceso completo a la boda',
    ],
    cta: 'Elegir Wedding Pass Plus',
    link: '/signup?wedding-pass-plus',
    highlight: false,
  },
];

const plannerPlans = [
  {
    name: 'Planner Pack 5',
    monthlyPrice: 41.67,
    annualPrice: 425,
    description: 'Hasta 5 bodas activas simultáneas con herramientas profesionales.',
    features: [
      '1 mes de prueba gratuita',
      'Prioridad en el directorio y soporte prioritario',
      'Gestiona y reasigna licencias según tus clientes',
    ],
  },
  {
    name: 'Planner Pack 15',
    monthlyPrice: 112.5,
    annualPrice: 1147.5,
    description: 'Pensado para planners en crecimiento con múltiples proyectos en paralelo.',
    features: [
      '1 mes de prueba gratuita',
      'Analytics por cliente y visibilidad extendida',
      'Prioridad en directorio y soporte prioritario',
    ],
  },
  {
    name: 'Teams 40',
    monthlyPrice: 266.67,
    annualPrice: 2720,
    description: 'Equipos que coordinan muchas bodas y requieren colaboración avanzada.',
    features: [
      '1 mes de prueba gratuita',
      '40 bodas activas al año natural',
      'Incluye 3 perfiles adicionales con acceso limitado',
      'Dashboard consolidado y colaboración avanzada',
    ],
  },
  {
    name: 'Teams Ilimitado',
    monthlyPrice: 416.67,
    annualPrice: 4250,
    description: 'La solución definitiva con bodas y perfiles ilimitados para agencias grandes.',
    features: [
      '1 mes de prueba gratuita',
      'White-label completo y dominio personalizado',
      'Soporte dedicado 24/7 y formación personalizada',
      'Acceso API y acompañamiento experto',
    ],
  },
];

const featureHighlights = [
  {
    icon: <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />,
    title: 'Pagos por evento',
    description: 'Activa solo lo que necesitas para cada boda. Sin renovaciones automáticas.',
  },
  {
    icon: <Users className="h-5 w-5 text-[var(--color-primary)]" />,
    title: 'Colaboración controlada',
    description: 'Invita ayudantes y proveedores con permisos claros y seguimiento de acciones.',
  },
  {
    icon: <CheckCircle2 className="h-5 w-5 text-[var(--color-primary)]" />,
    title: 'Estado sincronizado',
    description: 'Los webhooks de Stripe mantienen licencias y packs al día con alertas internas.',
  },
];

const formatEuro = (value, minimumFractionDigits = 0) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  }).format(value);

const Pricing = () => {
  return (
    <MarketingLayout>
      <section className="rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-md shadow-[var(--color-primary)]/10 md:px-12 md:py-14">
        <div className="grid gap-10 md:grid-cols-[1.35fr,0.65fr] md:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)]/12 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              <Sparkles className="h-4 w-4" />
              Modelo por boda
            </span>
            <h1 className="mt-6 text-4xl font-semibold text-body md:text-5xl">
              Planes claros para cada evento.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-muted md:text-lg">
              Pagos únicos en euros para parejas y paquetes flexibles para planners. Cada licencia permanece activa hasta 30 días posteriores a la fecha del evento y puedes extenderla cuando lo necesites.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {featureHighlights.map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col gap-2 rounded-2xl border border-soft bg-white/92 p-4 shadow-sm shadow-[var(--color-primary)]/10"
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

          <div className="rounded-3xl border border-[var(--color-primary)]/35 bg-white/95 p-6 shadow-lg shadow-[var(--color-primary)]/15">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              <HeartHandshake className="h-4 w-4" />
              Beneficios clave
            </div>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--color-primary)]" />
                Licencias en modo lectura automático tras la fecha límite del evento.
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--color-primary)]" />
                Packs de planners con 1 mes de prueba y control de cuota disponible.
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--color-primary)]" />
                Alertas 30 / 7 / 1 días antes de expirar para mantener todo bajo control.
              </li>
            </ul>
            <Link
              to="/signup"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              Crear cuenta gratuita
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
            Parejas
          </span>
          <h2 className="text-xl font-semibold text-body md:text-2xl">Planes para parejas</h2>
        </div>
        <p className="mt-2 text-sm text-muted">
          Cada compra habilita una boda completa hasta 30 días después del evento. Añade una extensión para seguir trabajando si necesitas más tiempo.
        </p>

        <div className="mt-6 grid gap-8 md:grid-cols-3">
          {couplePlans.map((plan) => (
            <article
              key={plan.name}
              className={[
                'flex h-full flex-col rounded-3xl border bg-white/95 p-8 shadow-sm shadow-[var(--color-primary)]/12 transition-transform hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--color-primary)]/20',
                plan.highlight ? 'border-[var(--color-primary)]/55' : 'border-soft',
              ].join(' ')}
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                  {plan.name}
                </span>
                <h3 className="mt-4 text-3xl font-semibold text-body">
                  {plan.price === 0 ? (
                    <>
                      Gratis
                      <span className="block text-sm font-medium text-muted">{plan.priceSuffix}</span>
                    </>
                  ) : (
                    <>
                      {formatEuro(plan.price)}
                      <span className="block text-sm font-medium text-muted">{plan.priceSuffix}</span>
                    </>
                  )}
                </h3>
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
                to={plan.link}
                className={[
                  'mt-8 inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2',
                  plan.highlight
                    ? 'bg-[var(--color-primary)] text-white hover:brightness-95'
                    : 'border border-[var(--color-primary)]/45 text-body hover:border-[var(--color-primary)]',
                ].join(' ')}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/12 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
            <Crown className="h-3.5 w-3.5" />
            Planners
          </span>
          <h2 className="text-xl font-semibold text-body md:text-2xl">Paquetes para planners</h2>
        </div>
        <p className="mt-2 text-sm text-muted">
          Todos los packs incluyen 1 mes de prueba gratuita. Elige 12 cuotas mensuales o pago único anual con 15&nbsp;% de descuento. Las cuotas disponibles se actualizan automáticamente con Stripe.
        </p>

        <div className="mt-6 grid gap-8 md:grid-cols-2">
          {plannerPlans.map((plan) => (
            <article
              key={plan.name}
              className="flex h-full flex-col rounded-3xl border border-soft bg-white/95 p-8 shadow-sm shadow-[var(--color-primary)]/12 transition-transform hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--color-primary)]/20"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                  {plan.name}
                </span>
                <h3 className="mt-4 text-2xl font-semibold text-body">
                  {formatEuro(plan.monthlyPrice, 2)}{' '}
                  <span className="text-sm font-medium text-muted">/ mes (12 pagos)</span>
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {formatEuro(plan.annualPrice)} pago único anual (15&nbsp;% descuento)
                </p>
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
                Empezar prueba gratuita
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-3xl border border-soft bg-white/95 p-10 shadow-lg shadow-[var(--color-primary)]/12">
        <div className="grid gap-8 md:grid-cols-[1.5fr,0.5fr] md:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-body md:text-3xl">
              ¿Necesitas ayuda para elegir el plan adecuado?
            </h2>
            <p className="mt-4 text-base text-muted">
              Te ayudamos a configurar licencias, automatizaciones y reportes según tu operación. Agenda una sesión y diseña un rollout acorde a tu ritmo.
            </p>
          </div>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
          >
            Hablar con un especialista
          </Link>
        </div>
      </section>

      <section className="mt-16 rounded-3xl border border-[var(--color-primary)]/45 bg-[var(--color-primary)] px-8 py-10 text-white shadow-lg shadow-[var(--color-primary)]/30 md:px-12">
        <div className="grid gap-10 md:grid-cols-[2fr,1fr] md:items-center">
          <div>
            <h2 className="text-3xl font-semibold">Lista para usar en minutos.</h2>
            <p className="mt-4 text-base text-white/85">
              Crea tu cuenta, conecta Stripe y activa tus licencias de inmediato. El sistema notificará las renovaciones y podrás mantener bodas cerradas en modo lectura cuando terminen.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--color-primary)]"
            >
              Crear cuenta gratuita
            </Link>
            <Link
              to="/acceso"
              className="inline-flex items-center justify-center rounded-md border border-white/70 px-4 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--color-primary)]"
            >
              Centro de acceso
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default Pricing;

