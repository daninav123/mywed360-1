import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Mail, Moon, LogOut } from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import Nav from './Nav';
import ChatWidget from './ChatWidget';
import DefaultAvatar from './DefaultAvatar';
import GlobalSearch from './GlobalSearch';
import { prefetchModule } from '../utils/prefetch';
import DarkModeToggle from './DarkModeToggle';
import NotificationCenter from './NotificationCenter';
import NotificationWatcher from './notifications/NotificationWatcher';
import OnboardingTutorial from './Onboarding/OnboardingTutorial';
import { useOnboarding } from '../hooks/useOnboarding';
import RoleBadge from './RoleBadge';
import WeddingSelector from './WeddingSelector';

export default function MainLayout() {
  const { t } = useTranslation();
  const prefetchNotificaciones = React.useCallback(() => {
    try { import('../pages/Notificaciones'); } catch {}
  }, []);

  // Autenticación y rol
  const { hasRole, userProfile, isLoading, logout: logoutUnified } = useAuth();
  const role = userProfile?.role || 'particular';

  const [openMenu, setOpenMenu] = useState(false);
  const location = useLocation();
  const hideSelectorRoutes = ['/home', '/tasks'];
  const hideSelector = hideSelectorRoutes.some(r => location.pathname.startsWith(r)) || location.pathname === '/bodas';
  const isPlanner = userProfile && hasRole ? hasRole('planner') : false;
  const showWeddingSelector = isPlanner && !hideSelector;
  const { showOnboarding, completeOnboarding } = useOnboarding();

  // Prefetch helpers for lazy routes (email)
  const prefetchEmail = React.useCallback(() => {
    prefetchModule('UnifiedEmail', () => import('../pages/UnifiedEmail'));
  }, []);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenu && !event.target.closest('[data-user-menu]')) setOpenMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenu]);

  const isCypress = typeof window !== 'undefined' && !!window.Cypress;
  // Mostrar loading mientras se inicializa la autenticación (excepto en Cypress)
  if (isLoading && !isCypress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
          <p className="text-[color:var(--color-text)]/70">{t('app.loading', { defaultValue: 'Cargando...' })}</p>
        </div>
      </div>
    );
  }

  // Onboarding (ocultar en E2E)
  if (showOnboarding && !isCypress) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
        <OnboardingTutorial onComplete={completeOnboarding} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[var(--color-bg)] text-[color:var(--color-text)] font-sans">
      <div className="absolute top-4 right-4 z-50 flex items-center space-x-4">
        {/* Centro de notificaciones y watcher */}
        <NotificationWatcher intervalMs={3000} />
        <NotificationCenter />
        {(import.meta.env.PROD || import.meta.env.VITE_SHOW_ROLE_BADGE === 'true') && <RoleBadge />}
        <div className="hidden md:block">
          <GlobalSearch />
        </div>

        {/* Avatar y menú de usuario */}
        <div className="relative" data-user-menu>
          <div
            onClick={() => setOpenMenu(!openMenu)}
            className={`w-10 h-10 rounded-full cursor-pointer transition-all duration-200 hover:ring-2 ${
              openMenu ? 'ring-2 bg-[var(--color-accent)]/20' : 'bg-[var(--color-surface)] hover:bg-[var(--color-accent)]/20'
            } flex items-center justify-center`}
            title={t('navigation.userMenu', { defaultValue: 'Menú de usuario' })}
            style={{ '--tw-ring-color': 'var(--color-primary)' }}
          >
            <DefaultAvatar className="w-6 h-6 text-[color:var(--color-text)]/70" />
          </div>
          {openMenu && (
            <div className="absolute right-0 mt-2 bg-[var(--color-surface)] border border-[color:var(--color-text)]/15 rounded-lg shadow-lg p-1 space-y-1 min-w-[200px] z-50">
              <Link
                to="/perfil"
                onClick={() => setOpenMenu(false)}
                className="flex items-center px-3 py-2 text-sm hover:bg-[var(--color-accent)]/20 rounded-md transition-colors"
              >
                <User className="w-4 h-4 mr-2" /> {t('navigation.profile', { defaultValue: 'Perfil' })}
              </Link>

              {false && (
                <Link
                  to="/notificaciones"
                  onClick={() => setOpenMenu(false)}
                  onMouseEnter={prefetchNotificaciones}
                  onFocus={prefetchNotificaciones}
                  onTouchStart={prefetchNotificaciones}
                  className="flex items-center px-3 py-2 text-sm hover:bg-[var(--color-accent)]/20 rounded-md transition-colors"
                >
                  Notificaciones
                </Link>
              )}

              <Link
                to="/email"
                onClick={() => setOpenMenu(false)}
                onMouseEnter={prefetchEmail}
                onFocus={prefetchEmail}
                onTouchStart={prefetchEmail}
                className="flex items-center px-3 py-2 text-sm hover:bg-[var(--color-accent)]/20 rounded-md transition-colors"
              >
                <Mail className="w-4 h-4 mr-2" /> {t('navigation.emailInbox', { defaultValue: 'Buzón de Emails' })}
              </Link>

              <div className="px-3 py-2 hover:bg-[var(--color-accent)]/20 rounded-md transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center"><Moon className="w-4 h-4 mr-2" /> {t('navigation.darkMode', { defaultValue: 'Modo oscuro' })}</span>
                  <DarkModeToggle className="ml-2" />
                </div>
              </div>

              <div className="border-t border-[color:var(--color-text)]/15 my-1"></div>
              <button
                onClick={() => { logoutUnified(); setOpenMenu(false); }}
                className="w-full text-left px-3 py-2 text-sm text-[color:var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-md transition-colors flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" /> {t('navigation.logout', { defaultValue: 'Cerrar sesión' })}
              </button>
            </div>
          )}
        </div>
      </div>

      <main className="container flex-grow mx-auto px-4 pt-8 pb-36">
        {showWeddingSelector && <WeddingSelector />}
        <Outlet />
      </main>
      <Nav />
      <ChatWidget />
    </div>
  );
}
