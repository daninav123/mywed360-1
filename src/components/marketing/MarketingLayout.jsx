import React from 'react';
import { Link, NavLink } from 'react-router-dom';

import logoApp from '../../assets/logo-app.png';

const navLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/app', label: 'La App' },
  { to: '/precios', label: 'Precios' },
  { to: '/acceso', label: 'Login / Registro' },
];

const linkBaseClasses =
  'px-3 py-2 text-sm font-medium transition-colors duration-150 text-muted hover:text-body border-b-2 border-transparent';
const activeClasses = 'text-body border-[var(--color-primary)]';

const MarketingLayout = ({ children }) => {
  if (typeof window !== 'undefined') {
    window.__LOVENDA_MARKETING_VIEW__ = true;
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
        delete window.__LOVENDA_MARKETING_VIEW__;
      }
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-app text-body">
      <header className="sticky top-0 z-30 border-b border-soft bg-app/95 backdrop-blur">
        <div className="layout-container flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-3 text-lg font-semibold text-body">
            <img
              src="/logo-app.svg"
              alt="Logo MaLove.App"
              className="h-9 w-9 rounded-xl bg-white object-contain shadow-sm ring-1 ring-[var(--color-primary)]/20"
            />
            <span>MaLove.App</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `${linkBaseClasses} ${isActive ? activeClasses : ''}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/login"
              className="rounded-md px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-body"
            >
              Iniciar sesion
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              Crear cuenta
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
                      : 'bg-[var(--color-accent)]/25 text-muted hover:text-body'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="layout-container w-full py-12 md:py-16">{children}</div>
      </main>

      <footer className="border-t border-soft bg-app/90">
        <div className="layout-container flex flex-col gap-4 py-6 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} MaLove.App. Todos los derechos reservados.</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/precios" className="hover:text-body">
              Planes
            </Link>
            <Link to="/acceso" className="hover:text-body">
              Centro de acceso
            </Link>
            <a href="mailto:hola@malove.app" className="hover:text-body" aria-label="Contacto MaLove.App">
              Contacto
            </a>
            <a
              href="https://malove.app/legal"
              target="_blank"
              rel="noreferrer"
              className="hover:text-body"
            >
              Legal
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketingLayout;
