import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import MarketingLayout from '../../components/marketing/MarketingLayout';
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

const heroHighlights = [
  { value: '360 deg', label: 'vision integral del evento' },
  { value: '+50', label: 'integraciones activas' },
  { value: '24/7', label: 'acceso desde cualquier dispositivo' },
];

const features = [
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
];

const benefitItems = [
  {
    icon: <CalendarCheck className="h-5 w-5 text-[var(--color-primary)]" />,
    title: 'Tiempos bajo control',
    description:
      'Checklists dinamicos, recordatorios inteligentes y cronologias listas para compartir con tu equipo.',
  },
  {
    icon: <Users className="h-5 w-5 text-[var(--color-primary)]" />,
    title: 'Colaboracion real',
    description:
      'Roles para planners, asistentes, proveedores e invitados con vistas personalizadas.',
  },
  {
    icon: <Palette className="h-5 w-5 text-[var(--color-primary)]" />,
    title: 'Diseno consistente',
    description:
      'Sitio web de boda, invitaciones y comunicaciones con tu branding en minutos.',
  },
  {
    icon: <Shield className="h-5 w-5 text-[var(--color-primary)]" />,
    title: 'Datos seguros',
    description:
      'Infraestructura cloud y permisos granulares para resguardar contratos, pagos y contactos.',
  },
];

const plannerHighlights = [
  {
    icon: <Layers className="h-5 w-5 text-[var(--color-primary)]" />,
    title: 'Portafolio multi boda',
    description:
      'Gestiona eventos simultaneos con paneles independientes. Cambia de boda en un clic sin perder el contexto.',
  },
  {
    icon: <Briefcase className="h-5 w-5 text-[var(--color-primary)]" />,
    title: 'Kits repetibles',
    description:
      'Duplica checklists, presupuestos y plantillas de comunicacion para replicar tus flujos favoritos en segundos.',
  },
  {
    icon: <Clock3 className="h-5 w-5 text-[var(--color-primary)]" />,
    title: 'Alertas proactivas',
    description:
      'Recibe avisos de tareas criticas, contratos por vencer y pagos pendientes para cada cliente.',
  },
];

const testimonials = [
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
];

const faqItems = [
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
];

const trustLogos = ['Lumiere Events', 'Novia Atelier', 'Festiva Group', 'Urban Weddings'];

const Landing = () => {
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoMessage, setDemoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDemoSubmit = (event) => {
    event.preventDefault();
    if (!demoName.trim() || !demoEmail.trim()) {
      setDemoMessage('Completa nombre y email para solicitar una demo.');
      return;
    }

    setIsSubmitting(true);
    setDemoMessage('');

    window.setTimeout(() => {
      setDemoMessage('Gracias. Nuestro equipo se pondra en contacto contigo en menos de 24 horas.');
      setDemoName('');
      setDemoEmail('');
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <MarketingLayout>
      <section className="layout-container grid gap-12 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo-app.svg"
              alt="MaLove.App logo"
              className="h-12 w-12 rounded-2xl bg-white object-contain shadow-sm ring-1 ring-[var(--color-primary)]/25"
            />
            <span className="text-sm font-semibold uppercase tracking-widest text-muted">
              MaLove.App
            </span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            Plataforma todo en uno para planear bodas
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-body md:text-5xl">
            Coordina tu boda soñada en menos tiempo con herramientas profesionales listas para tu equipo.
          </h1>
          <p className="mt-6 text-lg text-muted">
            MaLove.App combina planificacion, finanzas, comunicacion y diseno en un espacio centralizado.
            Simplifica tareas diarias, involucra a proveedores y ofrece a tus invitados una experiencia memorable.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              Empezar gratis
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center justify-center rounded-md border border-[var(--color-primary)]/45 px-5 py-3 text-sm font-semibold text-body transition-colors hover:border-[var(--color-primary)] hover:text-body focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              Ver todo lo que incluye la app
            </Link>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {heroHighlights.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-soft bg-surface/80 p-4 shadow-sm backdrop-blur"
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
            <div className="rounded-[1.75rem] border border-soft bg-surface/95 p-6 shadow-xl shadow-[var(--color-primary)]/15">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Resumen general</p>
                  <h3 className="mt-1 text-xl font-semibold text-body">Boda Valeria & Tomas</h3>
                </div>
                <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                  +18% semana
                </span>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-soft bg-surface p-4 shadow-sm">
                  <p className="text-sm text-muted">Invitados confirmados</p>
                  <p className="mt-2 text-2xl font-semibold text-body">132</p>
                  <div className="mt-3 h-2.5 w-full rounded-full bg-primary-soft">
                    <div className="h-full w-3/4 rounded-full bg-[var(--color-primary)]" />
                  </div>
                </div>
                <div className="rounded-2xl border border-soft bg-surface p-4 shadow-sm">
                  <p className="text-sm text-muted">Presupuesto ejecutado</p>
                  <p className="mt-2 text-2xl font-semibold text-body">$18.4k</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                    4 facturas pendientes
                  </div>
                </div>
                <div className="rounded-2xl border border-soft bg-surface p-4 shadow-sm md:col-span-2">
                  <p className="text-sm text-muted">Tareas criticas esta semana</p>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li className="flex items-center gap-3 rounded-lg bg-primary-soft/35 px-3 py-2 text-body">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-[var(--color-primary)]">
                        21
                      </span>
                      Confirmar degustacion del menu y enviar feedback al catering.
                    </li>
                    <li className="flex items-center gap-3 rounded-lg bg-primary-soft/20 px-3 py-2 text-body">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-[var(--color-primary)]">
                        22
                      </span>
                      Generar plano de mesas para invitados VIP y compartir con protocolo.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="ml-auto w-5/6 rounded-[1.5rem] border border-soft bg-white/90 p-5 shadow-lg shadow-[var(--color-primary)]/10 backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Asistente MaLove.App</p>
              <p className="mt-3 text-sm text-body">
                "Tu cronograma esta en 82%. Recomiendo enviar el recordatorio de alojamiento antes del lunes y confirmar proveedores restantes."
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="layout-container mt-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-semibold text-body">Todo lo que necesitas en un solo lugar</h2>
          <p className="mt-4 text-lg text-muted">
            MaLove.App simplifica la logistica con modulos colaborativos listos para planners, proveedores e invitados.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-soft bg-surface/90 p-6 shadow-sm shadow-[var(--color-primary)]/10 backdrop-blur"
            >
              <h3 className="text-lg font-semibold text-body">{feature.title}</h3>
              <p className="mt-3 text-sm text-muted">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="layout-container mt-24 rounded-3xl border border-soft bg-surface/95 p-8 shadow-lg shadow-[var(--color-primary)]/15">
        <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
          <div>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              DiseÃ±ado para planners
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-body">
              Control total de tu cartera de eventos sin hojas de calculo.
            </h2>
            <p className="mt-3 text-base text-muted">
              MaLove.App facilita la gestion de multiples bodas con dashboards, plantillas reutilizables y
              reportes exportables para tu agencia. Organiza a tu equipo y mantente un paso adelante con
              una sola plataforma.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {plannerHighlights.map((item) => (
                <article
                  key={item.title}
                  className="flex h-full flex-col gap-3 rounded-2xl border border-soft bg-surface p-4 shadow-sm shadow-[var(--color-primary)]/10"
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
              Vista de planners
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-soft bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-medium text-muted">Portfolio actual</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-lg font-semibold text-body">8 bodas activas</p>
                  <span className="rounded-full bg-[var(--color-primary)]/10 px-2 py-1 text-xs text-[var(--color-primary)]">
                    2 nuevas este mes
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-soft bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-medium text-muted">Estado de clientes</p>
                <ul className="mt-2 space-y-1 text-xs text-muted">
                  <li>â€¢ Ana & Diego - cronograma: 92%</li>
                  <li>â€¢ Laura & Marco - pagos: 3 facturas pendientes</li>
                  <li>â€¢ Carolina & Javier - invitados: 156 confirmados</li>
                </ul>
              </div>
              <div className="rounded-xl border border-soft bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-medium text-muted">Rendimiento mensual</p>
                <div className="mt-3 h-2 w-full rounded-full bg-primary-soft">
                  <div className="h-full w-2/3 rounded-full bg-[var(--color-primary)]" />
                </div>
                <p className="mt-2 text-xs text-muted">Tiempo promedio por boda: 38% menos que el aÃ±o pasado.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="layout-container mt-24 space-y-10">
        <div className="text-center">
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
            Beneficios clave
          </span>
          <h2 className="mt-5 text-3xl font-semibold text-body">Una operacion cuidada de principio a fin</h2>
          <p className="mt-3 text-base text-muted">
            Disenada para planners que necesitan visibilidad y parejas que buscan tranquilidad. MaLove.App automatiza tareas repetitivas y mantiene a todos alineados.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {benefitItems.map((benefit) => (
            <article
              key={benefit.title}
              className="flex h-full flex-col gap-3 rounded-2xl border border-soft bg-surface/90 p-5 shadow-sm shadow-[var(--color-primary)]/10"
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

      <section className="layout-container mt-24 space-y-10">
        <div className="grid gap-10 lg:grid-cols-[1.3fr,0.7fr] lg:items-center">
          <div>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              Historias reales
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-body">MaLove.App impulsa planners y parejas alrededor del mundo</h2>
            <p className="mt-3 text-base text-muted">
              Mas de 12 mil bodas se gestionan en MaLove.App. Cada equipo aprovecha automatizaciones, insights y plantillas para dedicar mas tiempo a la creatividad.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {testimonials.map((testimonial) => (
                <article
                  key={testimonial.name}
                  className="flex h-full flex-col gap-3 rounded-2xl border border-soft bg-surface/90 p-6 shadow-sm shadow-[var(--color-primary)]/10"
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
          <div className="rounded-3xl border border-soft bg-surface p-6 shadow-lg shadow-[var(--color-primary)]/15">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Confian en MaLove.App</p>
            <div className="mt-6 grid gap-6 text-center text-sm font-medium text-muted sm:grid-cols-2">
              {trustLogos.map((brand) => (
                <div key={brand} className="rounded-xl border border-soft bg-primary-soft/40 py-4 text-muted">
                  {brand}
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-muted">
              Mas de 200 planners activos en Europa y LATAM utilizan MaLove.App para estandarizar procesos y ofrecer experiencias memorables.
            </p>
          </div>
        </div>
      </section>

      <section className="layout-container mt-24 grid gap-10 lg:grid-cols-[1fr,1fr]">
        <div>
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
            Preguntas frecuentes
          </span>
          <h2 className="mt-5 text-3xl font-semibold text-body">Todo lo que necesitas saber antes de empezar</h2>
          <div className="mt-6 space-y-4">
            {faqItems.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-soft bg-surface/90 p-5 shadow-sm shadow-[var(--color-primary)]/10 open:ring-1 open:ring-[var(--color-primary)]/20"
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
        <div className="rounded-3xl border border-soft bg-surface/90 p-8 shadow-lg shadow-[var(--color-primary)]/15">
          <h3 className="text-2xl font-semibold text-body">Solicita una demo personalizada</h3>
          <p className="mt-3 text-sm text-muted">
            Cuentanos sobre tu operacion y agenda una videollamada con nuestro equipo. Recibiras recomendaciones basadas en tu flujo actual y una guia de configuracion rapida.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleDemoSubmit}>
            <div>
              <label htmlFor="demo-name" className="text-sm font-medium text-body">
                Nombre completo
              </label>
              <input
                id="demo-name"
                type="text"
                value={demoName}
                onChange={(event) => setDemoName(event.target.value)}
                placeholder="Tu nombre"
                className="mt-1 w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div>
              <label htmlFor="demo-email" className="text-sm font-medium text-body">
                Email de contacto
              </label>
              <input
                id="demo-email"
                type="email"
                value={demoEmail}
                onChange={(event) => setDemoEmail(event.target.value)}
                placeholder="hola@tuagencia.com"
                className="mt-1 w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Enviando solicitud...' : 'Agendar demo'}
            </button>
            {demoMessage ? (
              <p className="text-sm text-[var(--color-primary)]">{demoMessage}</p>
            ) : null}
          </form>
          <div className="mt-6 rounded-2xl border border-soft bg-primary-soft/40 p-4 text-xs text-muted">
            Al enviar aceptas recibir comunicaciones relacionadas con MaLove.App. Puedes cancelar la suscripcion en cualquier momento.
          </div>
        </div>
      </section>

      <section className="layout-container mt-24 rounded-3xl border border-[var(--color-primary)]/45 bg-[var(--color-primary)] px-8 py-10 text-white shadow-lg shadow-[var(--color-primary)]/30 md:px-12">
        <div className="grid gap-10 md:grid-cols-[2fr,1fr] md:items-center">
          <div>
            <h2 className="text-3xl font-semibold">Lista para usar en minutos.</h2>
            <p className="mt-4 text-base text-white/85">
              Crea tu cuenta, importa tu lista de invitados y activa automatizaciones que te acompanen desde el primer dia.
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
              to="/precios"
              className="inline-flex items-center justify-center rounded-md border border-white/70 px-4 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--color-primary)]"
            >
              Comparar planes
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default Landing;







