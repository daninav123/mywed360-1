import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import MarketingLayout from '../../components/marketing/MarketingLayout';

const AppOverview = () => {
  const { t } = useTranslation('marketing');
  const appOverview = t('appOverview', { returnObjects: true }) ?? {};
  const hero = appOverview.hero ?? {};
  const heroStats = Array.isArray(hero.stats) ? hero.stats : [];
  const heroWorkspace = hero.workspace ?? {};
  const heroTags = Array.isArray(heroWorkspace.tags) ? heroWorkspace.tags : [];
  const modulesSection = appOverview.modules ?? {};
  const modules = Array.isArray(modulesSection.items) ? modulesSection.items : [];
  const integrationsSection = appOverview.integrations ?? {};
  const integrationsItems = Array.isArray(integrationsSection.items)
    ? integrationsSection.items
    : [];
  const integrationsCta = integrationsSection.cta ?? {};

  return (
    <MarketingLayout>
      <section className="rounded-3xl border border-soft bg-white/95 p-10 shadow-lg shadow-[var(--color-primary)]/15">
        <div className="grid gap-10 lg:grid-cols-[1.6fr,1fr] lg:items-start">
          <div>
            <h1 className="text-3xl font-semibold text-body md:text-4xl">{hero.title}</h1>
            <p className="mt-5 text-lg text-muted">{hero.description}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {heroStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-soft bg-white p-4 text-body shadow-sm shadow-[var(--color-primary)]/10"
                >
                  <p className="text-2xl font-semibold text-[var(--color-primary)]">{item.value}</p>
                  <p className="text-xs font-medium uppercase tracking-widest text-muted">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-[var(--color-primary)]/45 bg-[var(--color-primary)] p-8 text-white shadow-sm shadow-[var(--color-primary)]/20">
            <p className="text-sm uppercase tracking-[0.2em] text-white/70">{heroWorkspace.badge}</p>
            <h2 className="mt-4 text-2xl font-semibold">{heroWorkspace.title}</h2>
            <p className="mt-4 text-sm text-white/80">{heroWorkspace.description}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs">
              {heroTags.map((chip) => (
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
        <h2 className="text-2xl font-semibold text-body md:text-3xl">{modulesSection.title}</h2>
        <p className="mt-3 text-base text-muted">{modulesSection.description}</p>

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
              {integrationsSection.title}
            </h2>
            <p className="mt-4 text-base text-muted">{integrationsSection.description}</p>
            <ul className="mt-6 space-y-3 text-sm text-muted">
              {integrationsItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-soft bg-white p-6 shadow-sm shadow-[var(--color-primary)]/10">
            <h3 className="text-lg font-semibold text-body">{integrationsCta.title}</h3>
            <p className="mt-3 text-sm text-muted">{integrationsCta.description}</p>
            <Link
              to="/signup"
              className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              {integrationsCta.button}
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default AppOverview;
