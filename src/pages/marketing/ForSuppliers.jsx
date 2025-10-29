import React, { useState } from 'react';
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

import MarketingLayout from '../../components/marketing/MarketingLayout';
import logoApp from '../../assets/logo-mark.svg';

const ForSuppliers = () => {
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoBusiness, setDemoBusiness] = useState('');
  const [demoCategory, setDemoCategory] = useState('');
  const [demoMessage, setDemoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDemoSubmit = (event) => {
    event.preventDefault();

    if (!demoName.trim() || !demoEmail.trim() || !demoBusiness.trim()) {
      setDemoMessage('Por favor completa todos los campos obligatorios.');
      return;
    }

    setIsSubmitting(true);
    setDemoMessage('');

    window.setTimeout(() => {
      setDemoMessage('¡Gracias! Nos pondremos en contacto contigo en menos de 24 horas.');
      setDemoName('');
      setDemoEmail('');
      setDemoBusiness('');
      setDemoCategory('');
      setIsSubmitting(false);
    }, 1200);
  };

  const categories = [
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
  ];

  const benefits = [
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Llega a miles de parejas',
      description:
        'Aparece en las búsquedas cuando parejas buscan servicios como el tuyo en tu zona.',
    },
    {
      icon: <Camera className="h-5 w-5" />,
      title: 'Portafolio profesional',
      description: 'Crea tu página pública con galería de fotos, servicios, precios y reseñas.',
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: 'Recibe solicitudes directas',
      description:
        'Las parejas te contactan directamente desde la plataforma con su información y necesidades.',
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: 'Dashboard de gestión',
      description: 'Gestiona todas tus solicitudes, conversaciones y proyectos desde un panel.',
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: 'Sin comisiones',
      description: 'Solo pagas por visualización. No cobramos comisión por contrato cerrado.',
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Verificación profesional',
      description:
        'Badge de proveedor verificado que aumenta la confianza de potenciales clientes.',
    },
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Regístrate gratis',
      description: 'Crea tu cuenta de proveedor sin coste ni compromiso.',
    },
    {
      step: '2',
      title: 'Completa tu perfil',
      description: 'Añade fotos de tu trabajo, servicios, precios y zona de cobertura.',
    },
    {
      step: '3',
      title: 'Compra créditos',
      description:
        'Adquiere tokens de visualización según tus necesidades. Sin suscripciones mensuales.',
    },
    {
      step: '4',
      title: 'Aparece en búsquedas',
      description:
        'Cuando una pareja busca tu categoría, apareces en los resultados y se consume 1 token.',
    },
    {
      step: '5',
      title: 'Recibe solicitudes',
      description:
        'Las parejas interesadas te envían solicitudes de presupuesto con toda su información.',
    },
  ];

  const pricingFeatures = [
    'Sistema de pago por visualización (tokens)',
    'Sin suscripción mensual fija',
    'Compra solo los tokens que necesites',
    'Los tokens no caducan',
    'Sin comisiones por contrato cerrado',
    'Dashboard y mensajería incluidos',
    'Página pública personalizable',
    'Actualización de portafolio ilimitada',
  ];

  const testimonials = [
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
  ];

  return (
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
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            Para Proveedores de Bodas
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-body md:text-5xl">
            Conecta con parejas que buscan tus servicios
          </h1>
          <p className="mt-6 text-lg text-muted">
            MaLove.App te ayuda a llegar a miles de parejas organizando su boda. Sistema de pago por
            visualización sin suscripciones mensuales ni comisiones por contrato.
          </p>
          <p className="mt-3 text-lg text-muted">
            Crea tu portafolio profesional, recibe solicitudes cualificadas y gestiona todo desde tu
            dashboard.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/supplier/registro"
              className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              Registra tu negocio gratis
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center rounded-md border border-[var(--color-primary)]/45 px-5 py-3 text-sm font-semibold text-body transition-colors hover:border-[var(--color-primary)] hover:text-body focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              Ver cómo funciona
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
                <h3 className="mt-1 text-xl font-semibold text-body">Panel de Proveedor</h3>
              </div>
              <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                +24% este mes
              </span>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-soft bg-white/95 p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[var(--color-primary)]" />
                  <p className="text-sm text-muted">Visualizaciones</p>
                </div>
                <p className="mt-2 text-2xl font-semibold text-body">1,248</p>
                <p className="mt-1 text-xs text-muted">156 tokens disponibles</p>
              </div>
              <div className="rounded-2xl border border-soft bg-white/95 p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[var(--color-primary)]" />
                  <p className="text-sm text-muted">Solicitudes</p>
                </div>
                <p className="mt-2 text-2xl font-semibold text-body">47</p>
                <p className="mt-1 text-xs text-muted">12 pendientes de respuesta</p>
              </div>
              <div className="rounded-2xl border border-soft bg-white/95 p-4 shadow-sm md:col-span-2">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-[var(--color-primary)]" />
                  <p className="text-sm text-muted">Valoración</p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-2xl font-semibold text-body">4.9</p>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-[var(--color-primary)] text-[var(--color-primary)]"
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted">Basado en 28 reseñas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="layout-container mt-24 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-semibold text-body">
            Por qué proveedores eligen MaLove.App
          </h2>
          <p className="mt-4 text-lg text-muted">
            Herramientas profesionales para hacer crecer tu negocio de bodas
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

      <section
        id="como-funciona"
        className="layout-container mt-24 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15"
      >
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Proceso Simple
          </span>
          <h2 className="mt-5 text-3xl font-semibold text-body">Cómo funciona</h2>
          <p className="mt-4 text-lg text-muted">
            En 5 pasos estás listo para recibir solicitudes de parejas
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-5">
          {howItWorks.map((item) => (
            <article key={item.step} className="relative text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-2xl font-bold text-white shadow-lg shadow-[var(--color-primary)]/30">
                {item.step}
              </div>
              <h3 className="mt-4 text-base font-semibold text-body">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="layout-container mt-24 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
            <Wallet className="h-3.5 w-3.5" />
            Sistema de Tokens
          </span>
          <h2 className="mt-5 text-3xl font-semibold text-body">
            Pago por visualización, sin sorpresas
          </h2>
          <p className="mt-4 text-lg text-muted">
            Solo pagas cuando tu perfil aparece en los resultados de búsqueda de una pareja
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-soft bg-white/95 p-8 shadow-sm shadow-[var(--color-primary)]/10">
            <h3 className="text-xl font-semibold text-body">¿Cómo funcionan los tokens?</h3>
            <ul className="mt-6 space-y-4 text-sm text-muted">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--color-primary)]" />
                <span>
                  Compras un pack de tokens según tus necesidades (ej: 100, 500, 1000 tokens)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--color-primary)]" />
                <span>
                  Cuando una pareja busca servicios en tu categoría, tu perfil puede aparecer
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--color-primary)]" />
                <span>Si apareces en sus resultados, se consume 1 token</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--color-primary)]" />
                <span>Los tokens no caducan - los usas a tu ritmo</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--color-primary)]" />
                <span>Puedes pausar tu perfil cuando quieras sin perder tokens</span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-soft bg-white/95 p-8 shadow-sm shadow-[var(--color-primary)]/10">
            <h3 className="text-xl font-semibold text-body">Lo que está incluido</h3>
            <ul className="mt-6 space-y-3 text-sm text-muted">
              {pricingFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-xl bg-primary-soft/40 p-4">
              <p className="text-sm font-medium text-body">
                💡 Los precios de los packs de tokens se anunciarán próximamente
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="layout-container mt-24 space-y-10 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
            <Star className="h-3.5 w-3.5" />
            Testimonios
          </span>
          <h2 className="mt-5 text-3xl font-semibold text-body">
            Proveedores que ya confían en nosotros
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
            <Crown className="h-3.5 w-3.5" />
            Categorías Disponibles
          </span>
          <h2 className="mt-5 text-3xl font-semibold text-body">
            ¿Tu negocio encaja en MaLove.App?
          </h2>
          <p className="mt-4 text-base text-muted">
            Trabajamos con todo tipo de proveedores del sector nupcial
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <div
                key={category}
                className="flex items-center gap-2 rounded-lg border border-soft bg-white px-3 py-2 text-sm text-muted"
              >
                <CheckCircle2 className="h-4 w-4 text-[var(--color-primary)]" />
                {category}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-soft bg-white/95 p-8 shadow-lg shadow-[var(--color-primary)]/15">
          <h3 className="text-2xl font-semibold text-body">Solicita más información</h3>
          <p className="mt-3 text-sm text-muted">
            Completa este formulario y nuestro equipo se pondrá en contacto contigo para explicarte
            todo el proceso.
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
              <label htmlFor="demo-business" className="text-sm font-medium text-body">
                Nombre del negocio *
              </label>
              <input
                id="demo-business"
                type="text"
                value={demoBusiness}
                onChange={(event) => setDemoBusiness(event.target.value)}
                placeholder="Nombre de tu empresa"
                className="mt-1 w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                required
              />
            </div>
            <div>
              <label htmlFor="demo-category" className="text-sm font-medium text-body">
                Categoría
              </label>
              <select
                id="demo-category"
                value={demoCategory}
                onChange={(event) => setDemoCategory(event.target.value)}
                className="mt-1 w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="">Selecciona una categoría</option>
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
              {isSubmitting ? 'Enviando...' : 'Solicitar información'}
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
          <div className="mt-6 rounded-2xl border border-soft bg-primary-soft/40 p-4 text-xs text-muted">
            Al enviar este formulario aceptas que nos pongamos en contacto contigo para informarte
            sobre MaLove.App para proveedores.
          </div>
        </div>
      </section>

      <section className="layout-container mt-24 rounded-3xl border border-[var(--color-primary)]/45 bg-[var(--color-primary)] px-8 py-10 text-white shadow-lg shadow-[var(--color-primary)]/30 md:px-12">
        <div className="grid gap-10 md:grid-cols-[2fr,1fr] md:items-center">
          <div>
            <h2 className="text-3xl font-semibold">Empieza a recibir solicitudes de parejas hoy</h2>
            <p className="mt-4 text-base text-white/85">
              Regístrate gratis, completa tu perfil y empieza a aparecer en las búsquedas de miles
              de parejas.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              to="/supplier/registro"
              className="inline-flex items-center justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--color-primary)]"
            >
              Registrarme ahora
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center rounded-md border border-white/70 px-4 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--color-primary)]"
            >
              Ver más detalles
            </a>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default ForSuppliers;
