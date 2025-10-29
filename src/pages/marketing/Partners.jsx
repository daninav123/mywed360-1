import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
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
  Handshake,
} from 'lucide-react';

import MarketingLayout from '../../components/marketing/MarketingLayout';
import logoApp from '../../assets/logo-mark.svg';

const Partners = () => {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactExperience, setContactExperience] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactSubmit = (event) => {
    event.preventDefault();

    if (!contactName.trim() || !contactEmail.trim()) {
      setFormMessage('Por favor completa todos los campos obligatorios.');
      return;
    }

    setIsSubmitting(true);
    setFormMessage('');

    window.setTimeout(() => {
      setFormMessage(
        '¡Gracias por tu interés! Revisaremos tu solicitud y te contactaremos pronto.'
      );
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setContactExperience('');
      setIsSubmitting(false);
    }, 1200);
  };

  const benefits = useMemo(
    () => [
      {
        icon: <DollarSign className="h-5 w-5" />,
        title: 'Comisiones Atractivas',
        description: 'Gana comisiones recurrentes por cada suscripción que vendas.',
      },
      {
        icon: <BarChart3 className="h-5 w-5" />,
        title: 'Dashboard de Seguimiento',
        description: 'Monitorea tus conversiones, comisiones y estadísticas en tiempo real.',
      },
      {
        icon: <Target className="h-5 w-5" />,
        title: 'Material de Marketing',
        description: 'Acceso a presentaciones, demos y recursos para facilitar tus ventas.',
      },
      {
        icon: <Users className="h-5 w-5" />,
        title: 'Soporte Dedicado',
        description: 'Equipo de soporte disponible para ayudarte con tus clientes.',
      },
      {
        icon: <Award className="h-5 w-5" />,
        title: 'Formación Incluida',
        description: 'Capacitación completa sobre la plataforma y mejores prácticas de venta.',
      },
      {
        icon: <TrendingUp className="h-5 w-5" />,
        title: 'Sin Límites',
        description: 'No hay techo en tus comisiones. Cuanto más vendas, más ganas.',
      },
    ],
    []
  );

  const partnerStructuredData = useMemo(
    () => ({
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
      memberBenefits: benefits.map((benefit) => ({
        '@type': 'Offer',
        name: benefit.title,
        description: benefit.description,
      })),
    }),
    [benefits]
  );

  const idealProfiles = [
    {
      title: 'Consultores de Bodas',
      description:
        'Asesores que trabajan con parejas y pueden recomendar herramientas profesionales.',
      icon: <Handshake className="h-6 w-6" />,
    },
    {
      title: 'Influencers del Sector',
      description: 'Creadores de contenido con audiencia interesada en organización de bodas.',
      icon: <Star className="h-6 w-6" />,
    },
    {
      title: 'Profesionales de Eventos',
      description:
        'Organizadores de eventos que pueden introducir MaLove.App en su red de contactos.',
      icon: <Users className="h-6 w-6" />,
    },
  ];

  const howItWorks = [
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
  ];

  return (
    <>
      <Helmet>
        <title>Programa de Partners | MaLove.App</title>
        <meta
          name="description"
          content="Únete al programa de partners de MaLove.App y gana comisiones recurrentes con recursos de marketing, formación y soporte dedicado."
        />
        <link rel="canonical" href="https://malove.app/partners" />
        <meta property="og:title" content="Programa de Partners | MaLove.App" />
        <meta
          property="og:description"
          content="Gana ingresos recurrentes recomendando MaLove.App a planners y proveedores con materiales de apoyo y seguimiento en tiempo real."
        />
        <meta property="og:url" content="https://malove.app/partners" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://malove.app/maloveapp-logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Programa de Partners | MaLove.App" />
        <meta
          name="twitter:description"
          content="Genera comisiones recurrentes recomendando la plataforma todo en uno para planificar bodas."
        />
        <meta name="twitter:image" content="https://malove.app/maloveapp-logo.png" />
        <script type="application/ld+json">{JSON.stringify(partnerStructuredData)}</script>
      </Helmet>

      <MarketingLayout>
        <section className="layout-container rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15">
          <div className="mx-auto max-w-4xl text-center">
            <div className="flex items-center justify-center gap-3">
              <img
                src={logoApp}
                alt="MaLove.App"
                className="h-12 w-12 rounded-2xl bg-white object-contain shadow-sm ring-1 ring-[var(--color-primary)]/25"
              />
              <span className="text-sm font-semibold uppercase tracking-widest text-muted">
                MaLove.App
              </span>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
              <Sparkles className="h-3.5 w-3.5 text-[var(--color-primary)]" />
              Programa de Partners
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-body md:text-5xl">
              Gana comisiones ayudando a parejas a organizar su boda perfecta
            </h1>
            <p className="mt-6 text-lg text-muted">
              Únete a nuestro programa de partners y recibe comisiones recurrentes por cada cliente
              que refieras a MaLove.App.
            </p>
            <p className="mt-3 text-lg text-muted">
              Sin inversión inicial. Comisiones atractivas. Material de marketing incluido.
            </p>
            <div className="mt-8 flex justify-center">
              <a
                href="#formulario"
                className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
              >
                Solicitar Acceso al Programa
              </a>
            </div>
          </div>
        </section>

        <section className="layout-container mt-24 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-semibold text-body">Por qué ser Partner de MaLove.App</h2>
            <p className="mt-4 text-lg text-muted">
              Beneficios diseñados para maximizar tu potencial de ingresos
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
              <CheckCircle2 className="h-3.5 w-3.5" />
              Proceso Simple
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-body">Cómo funciona</h2>
            <p className="mt-4 text-lg text-muted">En 4 pasos empiezas a generar ingresos</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
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
              <Users className="h-3.5 w-3.5" />
              Perfil Ideal
            </span>
            <h2 className="mt-5 text-3xl font-semibold text-body">¿Eres un buen candidato?</h2>
            <p className="mt-4 text-lg text-muted">
              Buscamos profesionales con conexiones en el sector nupcial
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {idealProfiles.map((profile) => (
              <article
                key={profile.title}
                className="rounded-2xl border border-soft bg-white/95 p-6 shadow-sm shadow-[var(--color-primary)]/10"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-[var(--color-primary)]">
                  {profile.icon}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-body">{profile.title}</h3>
                <p className="mt-2 text-sm text-muted">{profile.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="formulario"
          className="layout-container mt-24 rounded-3xl border border-soft bg-white/95 px-6 py-10 shadow-lg shadow-[var(--color-primary)]/15"
        >
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                <Send className="h-3.5 w-3.5" />
                Solicitud de Acceso
              </span>
              <h2 className="mt-5 text-3xl font-semibold text-body">
                Únete al Programa de Partners
              </h2>
              <p className="mt-4 text-base text-muted">
                Completa el formulario y nuestro equipo revisará tu solicitud. Te contactaremos en
                menos de 48 horas.
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleContactSubmit}>
              <div>
                <label htmlFor="contact-name" className="text-sm font-medium text-body">
                  Nombre completo *
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  placeholder="Tu nombre"
                  className="mt-2 w-full rounded-md border border-soft bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  required
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="text-sm font-medium text-body">
                  Email *
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder="tu@email.com"
                  className="mt-2 w-full rounded-md border border-soft bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  required
                />
              </div>

              <div>
                <label htmlFor="contact-experience" className="text-sm font-medium text-body">
                  Experiencia en el sector
                </label>
                <select
                  id="contact-experience"
                  value={contactExperience}
                  onChange={(event) => setContactExperience(event.target.value)}
                  className="mt-2 w-full rounded-md border border-soft bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">Selecciona una opción</option>
                  <option value="consultant">Consultor/a de bodas</option>
                  <option value="influencer">Influencer / Creador de contenido</option>
                  <option value="event-pro">Profesional de eventos</option>
                  <option value="supplier">Proveedor de servicios de boda</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label htmlFor="contact-message" className="text-sm font-medium text-body">
                  Cuéntanos sobre ti
                </label>
                <textarea
                  id="contact-message"
                  value={contactMessage}
                  onChange={(event) => setContactMessage(event.target.value)}
                  placeholder="Describe tu experiencia, tu red de contactos y por qué quieres ser partner..."
                  rows={5}
                  className="mt-2 w-full rounded-md border border-soft bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
              </button>

              {formMessage && (
                <p
                  className={`text-sm ${
                    formMessage.includes('Gracias') ? 'text-[var(--color-primary)]' : 'text-red-600'
                  }`}
                >
                  {formMessage}
                </p>
              )}
            </form>

            <div className="mt-8 rounded-2xl border border-soft bg-primary-soft/40 p-6 text-center text-sm text-muted">
              <p>
                Al enviar este formulario aceptas que revisemos tu perfil y nos pongamos en contacto
                contigo. No compartimos tu información con terceros.
              </p>
            </div>
          </div>
        </section>

        <section className="layout-container mt-24 rounded-3xl border border-[var(--color-primary)]/45 bg-[var(--color-primary)] px-8 py-10 text-white shadow-lg shadow-[var(--color-primary)]/30 md:px-12">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-semibold">
              ¿Listo para empezar a generar ingresos recurrentes?
            </h2>
            <p className="mt-4 text-base text-white/85">
              Únete a nuestro programa de partners y empieza a ganar comisiones hoy mismo.
            </p>
            <div className="mt-8">
              <a
                href="#formulario"
                className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-sm font-semibold text-[var(--color-primary)] transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--color-primary)]"
              >
                Solicitar Acceso Ahora
              </a>
            </div>
          </div>
        </section>
      </MarketingLayout>
    </>
  );
};

export default Partners;
