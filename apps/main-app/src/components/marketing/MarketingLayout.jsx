import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import logoApp from '../../assets/logo-mark.svg';
import LanguageSelector from '../ui/LanguageSelector';

const linkBaseClasses =
  'px-3 py-2 text-sm font-medium transition-colors duration-150 text-muted hover:text-body border-b-2 border-transparent';
const activeClasses = 'text-body border-[color:var(--color-primary)]';

const MarketingLayout = ({ children }) => {
  const { t, i18n } = useTranslation('marketing');

  const safeT = React.useCallback(
    (key, fallback, options = {}) =>
      i18n.exists(key, { ns: 'marketing' }) ? t(key, options) : fallback,
    [i18n, t]
  );

  const navLinks = React.useMemo(
    () => [
      { to: '/', label: safeT('nav.home', 'Inicio') },
      { to: '/app', label: safeT('nav.app', 'La App') },
      { to: '/para-planners', label: safeT('nav.forPlanners', 'Para planners') },
      { to: '/para-proveedores', label: safeT('nav.forSuppliers', 'Para proveedores') },
      { to: '/partners', label: safeT('nav.partners', 'Programa de partners') },
      { to: '/precios', label: safeT('nav.pricing', 'Precios') },
    ],
    [safeT]
  );

  const footerLinks = React.useMemo(
    () => [
      { to: '/precios', label: safeT('nav.plans', 'Planes') },
      { to: '/para-planners', label: safeT('nav.forPlanners', 'Para planners') },
      { to: '/para-proveedores', label: safeT('nav.forSuppliers', 'Para proveedores') },
      { to: '/partners', label: safeT('nav.partners', 'Programa de partners') },
      { to: '/acceso', label: safeT('nav.accessCenter', 'Centro de acceso') },
    ],
    [safeT]
  );

  const currentYear = new Date().getFullYear();

  if (typeof window !== 'undefined') {
    window.__MALOVEAPP_MARKETING_VIEW__ = true;
  }

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const ls = window.localStorage;
      if (ls?.getItem('forceOnboarding')) {
        ls.removeItem('forceOnboarding');
      }
    } catch {
      /* noop */
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.__MALOVEAPP_MARKETING_VIEW__;
      }
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-app text-body">
      <header className="sticky top-0 z-30 border-b border-soft bg-app shadow-sm">
        <div className="layout-container flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-3 text-lg font-semibold text-body">
            <img
              src={logoApp}
              alt={safeT('common.logoAlt', 'Logo MaLove.App')}
              className="h-9 w-9 rounded-xl bg-white object-contain shadow-sm ring-1 ring-[color:var(--color-primary-20)]"
            />
            <span>MaLove.App</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `${linkBaseClasses} ${isActive ? activeClasses : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {/* Selector de idioma */}
            <LanguageSelector variant="minimal" persist={false} />

            {/* Acceso Proveedores */}
            <Link
              to="/supplier/login"
              className="rounded-md px-4 py-2 text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors flex items-center gap-2"
              title="Portal de proveedores"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              💼 Panel Proveedores
            </Link>

            {/* Login Parejas */}
            <Link
              to="/login"
              className="rounded-md px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-body"
            >
              {safeT('nav.loginShort', 'Iniciar sesión')}
            </Link>

            {/* Signup */}
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:ring-offset-2"
            >
              {safeT('nav.signupShort', 'Crear cuenta')}
            </Link>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="border-t border-soft bg-app md:hidden">
          <nav className="layout-container flex flex-wrap justify-center gap-2 py-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-accent-25)] text-muted hover:text-body'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="layout-container flex flex-col gap-2 px-4 pb-4">
            {/* Selector de idioma - Mobile */}
            <div className="flex justify-center">
              <LanguageSelector variant="minimal" persist={false} />
            </div>

            {/* Acceso Proveedores - Mobile */}
            <Link
              to="/supplier/login"
              className="w-full rounded-md bg-purple-50 border border-purple-200 text-purple-700 px-4 py-2 text-center text-sm font-medium transition-colors hover:bg-purple-100 flex items-center justify-center gap-2"
            >
              💼 Panel Proveedores
            </Link>

            {/* Login Parejas - Mobile */}
            <Link
              to="/login"
              className="w-full rounded-md border border-[color:var(--color-text-20)] px-4 py-2 text-center text-sm font-medium text-[color:var(--color-text)] transition-colors hover:bg-[var(--color-accent-20)]"
            >
              {safeT('nav.loginShort', 'Iniciar sesión')}
            </Link>

            {/* Signup - Mobile */}
            <Link
              to="/signup"
              className="w-full rounded-md bg-[var(--color-primary)] px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:ring-offset-2"
            >
              {safeT('nav.signupShort', 'Crear cuenta')}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="layout-container w-full py-12 md:py-16">{children}</div>
      </main>

      <footer className="border-t border-soft bg-[var(--color-bg-90)]">
        <div className="layout-container flex flex-col gap-4 py-6 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p>
            {safeT(
              'common.copyright',
              `Copyright ${currentYear} MaLove.App. Todos los derechos reservados.`,
              { year: currentYear }
            )}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {footerLinks.map((link) => (
              <Link key={link.to} to={link.to} className="hover:text-body">
                {link.label}
              </Link>
            ))}
            <a
              href="mailto:hola@malove.app"
              className="hover:text-body"
              aria-label={safeT('common.contactLabel', 'Contacto MaLove.App')}
            >
              {safeT('nav.contact', 'Contacto')}
            </a>
            <a
              href="https://malove.app/legal"
              target="_blank"
              rel="noreferrer"
              className="hover:text-body"
            >
              {safeT('nav.legal', 'Legal')}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketingLayout;
