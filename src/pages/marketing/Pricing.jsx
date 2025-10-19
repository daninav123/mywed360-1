import React from 'react';
import { Link } from 'react-router-dom';

import MarketingLayout from '../../components/marketing/MarketingLayout';

const plans = [
  {
    name: 'Essentials',
    price: '0',
    periodicity: 'por siempre',
    description: 'Ideal para parejas que buscan organizar su boda con herramientas esenciales.',
    features: [
      'Dashboard de tareas y checklist ilimitado',
      'Hasta 150 invitados con RSVP automatico',
      'Disenos base para invitaciones y web de boda',
      'Soporte por email con respuesta en 48 horas',
    ],
    cta: 'Crear cuenta gratuita',
    link: '/signup',
    highlight: false,
  },
  {
    name: 'Professional',
    price: '29',
    periodicity: 'al mes (facturacion anual)',
    description: 'La opcion preferida por planners y equipos que coordinan multiples eventos.',
    features: [
      'Invitados y proveedores ilimitados',
      'Automatizaciones de email y flujos de trabajo',
      'Gestion financiera avanzada con exportaciones',
      'Soporte prioritario y sesiones de onboarding',
    ],
    cta: 'Probar gratis 14 dias',
    link: '/signup?plan=pro',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Habla con nosotros',
    periodicity: 'planes a medida',
    description: 'Para agencias que requieren seguridad, API extendida y soporte dedicado.',
    features: [
      'Workspaces ilimitados y permisos granulares',
      'SLA dedicado y gestor de cuenta asignado',
      'Integraciones personalizadas y API extendida',
      'Capacitacion y acompanamiento onsite',
    ],
    cta: 'Agendar llamada',
    link: 'mailto:ventas@malove.app?subject=Plan%20Enterprise%20MaLove.App',
    highlight: false,
  },
];

const Pricing = () => {
  return (
    <MarketingLayout>
      <section className="text-center">
        <h1 className="text-4xl font-semibold text-body md:text-5xl">Planes transparentes.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
          Empieza gratis y evoluciona cuando tu operacion lo necesite. Sin contratos forzosos y con soporte
          en espanol.
        </p>
      </section>

      <section className="mt-14 grid gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={[
              'flex h-full flex-col rounded-3xl border bg-surface/95 p-8 shadow-sm shadow-[var(--color-primary)]/10 transition-shadow hover:shadow-lg hover:shadow-[var(--color-primary)]/20',
              plan.highlight ? 'border-[var(--color-primary)]/60 bg-primary-soft' : 'border-soft',
            ].join(' ')}
          >
            <div>
              <span className="text-sm font-semibold uppercase tracking-widest text-muted">
                {plan.name}
              </span>
              <h2 className="mt-4 text-3xl font-semibold text-body">
                {plan.price === '0' ? (
                  <>
                    Gratis
                    <span className="block text-sm font-medium text-muted">{plan.periodicity}</span>
                  </>
                ) : plan.price === 'Habla con nosotros' ? (
                  <>
                    {plan.price}
                    <span className="block text-sm font-medium text-muted">{plan.periodicity}</span>
                  </>
                ) : (
                  <>
                    US$ {plan.price}
                    <span className="block text-sm font-medium text-muted">{plan.periodicity}</span>
                  </>
                )}
              </h2>
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

            {plan.link.startsWith('mailto:') ? (
              <a
                href={plan.link}
                className={[
                  'mt-8 inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2',
                  plan.highlight
                    ? 'bg-[var(--color-primary)] text-white hover:brightness-95'
                    : 'border border-[var(--color-primary)]/45 text-body hover:border-[var(--color-primary)]',
                ].join(' ')}
              >
                {plan.cta}
              </a>
            ) : (
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
            )}
          </article>
        ))}
      </section>

      <section className="mt-16 rounded-3xl border border-soft bg-surface/90 p-10 text-left shadow-lg shadow-[var(--color-primary)]/15">
        <div className="grid gap-8 md:grid-cols-[1.5fr,0.5fr] md:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-body md:text-3xl">
              Tienes dudas sobre que plan elegir?
            </h2>
            <p className="mt-4 text-base text-muted">
              Nuestro equipo puede ayudarte a importar tus datos, configurar flujos y adaptar MaLove.App a tu
              forma de trabajar. Escribenos y agenda una sesion personalizada.
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
    </MarketingLayout>
  );
};

export default Pricing;
