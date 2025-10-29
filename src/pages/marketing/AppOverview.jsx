import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

import MarketingLayout from '../../components/marketing/MarketingLayout';

const modules = [
  {
    title: 'Dashboard colaborativo',
    description:
      'Tareas, hitos y recordatorios en un panel centralizado que se actualiza en tiempo real.',
  },
  {
    title: 'CRM de proveedores',
    description:
      'Compara propuestas, gestiona contratos y lleva seguimiento de pagos y entregables.',
  },
  {
    title: 'Gestión financiera',
    description:
      'Presupuestos inteligentes, control de gastos y reportes detallados por categoría.',
  },
  {
    title: 'Experiencia para invitados',
    description:
      'Sitio web, RSVP automático, mesas interactivas y mensajes personalizados en un solo flujo.',
  },
  {
    title: 'Automatización de emails',
    description: 'Flujos preconfigurados, segmentos dinámicos y métricas para medir engagement.',
  },
  {
    title: 'Asistente inteligente',
    description:
      'Recomendaciones con IA para crear agendas, checklist y resolver preguntas contextuales.',
  },
];

const stats = [
  { value: '12k+', label: 'bodas planificadas con MaLove.App' },
  { value: '4.8/5', label: 'satisfacción promedio de planners' },
  { value: '30%', label: 'tiempo ahorrado en coordinación logística' },
];

const AppOverview = () => {
  return (
    <MarketingLayout>
      <section className="rounded-3xl border border-soft bg-white/95 p-10 shadow-lg shadow-[var(--color-primary)]/15">
        <div className="grid gap-10 lg:grid-cols-[1.6fr,1fr] lg:items-start">
          <div>
            <h1 className="text-3xl font-semibold text-body md:text-4xl">
              La app que reune todo tu flujo de planificacion en un solo lugar.
            </h1>
            <p className="mt-5 text-lg text-muted">
              Desde el primer checklist hasta el informe final, MaLove.App acompana a equipos
              profesionales y parejas que buscan tener control total del evento.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-soft bg-white p-4 text-body shadow-sm shadow-[var(--color-primary)]/10"
                >
                  <p className="text-2xl font-semibold text-[var(--color-primary)]">{item.value}</p>
                  <p className="text-xs font-medium uppercase tracking-widest text-muted">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-[var(--color-primary)]/45 bg-[var(--color-primary)] p-8 text-white shadow-sm shadow-[var(--color-primary)]/20">
            <p className="text-sm uppercase tracking-[0.2em] text-white/70">MaLove.App Workspace</p>
            <h2 className="mt-4 text-2xl font-semibold">Un ecosistema conectado</h2>
            <p className="mt-4 text-sm text-white/80">
              Modulos sincronizados, roles personalizados y permisos granulares para colaborar sin
              perder contexto.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs">
              {[
                'Dashboard',
                'Invitados',
                'Finanzas',
                'Comunicacion',
                'Diseno',
                'Automatizaciones',
              ].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/25 bg-white/10 px-4 py-1 text-white/90"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold text-body md:text-3xl">
          Modulos clave listos para tu equipo
        </h2>
        <p className="mt-3 text-base text-muted">
          Cada modulo esta disenado para integrarse con el resto, evitando informacion dispersa y
          manteniendo a todos en la misma pagina.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {modules.map((module) => (
            <article
              key={module.title}
              className="rounded-2xl border border-soft bg-white/95 p-6 shadow-sm shadow-[var(--color-primary)]/10 transition-transform hover:-translate-y-1 hover:shadow-md hover:shadow-[var(--color-primary)]/20"
            >
              <h3 className="text-lg font-semibold text-body">{module.title}</h3>
              <p className="mt-3 text-sm text-muted">{module.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-3xl border border-soft bg-white/95 p-10 shadow-lg shadow-[var(--color-primary)]/15">
        <div className="grid gap-8 md:grid-cols-[1.4fr,0.6fr] md:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-body md:text-3xl">
              Integraciones y automatizaciones que trabajan por ti.
            </h2>
            <p className="mt-4 text-base text-muted">
              Conecta MaLove.App con servicios de pago, calendarios y herramientas de comunicacion.
              Configura disparadores automaticos para RSVP, confirmaciones de proveedores o
              seguimiento de tareas.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                Integraciones con Google Calendar, Gmail y suites de productividad.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                Automatizaciones visuales con condiciones y plantillas reutilizables.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                API para desarrollos internos y conexion con sistemas externos.
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-soft bg-white p-6 shadow-sm shadow-[var(--color-primary)]/10">
            <h3 className="text-lg font-semibold text-body">Acceso inmediato</h3>
            <p className="mt-3 text-sm text-muted">
              Todas las cuentas incluyen prueba gratuita y demo guiada con nuestro equipo de
              onboarding.
            </p>
            <Link
              to="/signup"
              className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              Solicitar demo
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default AppOverview;
