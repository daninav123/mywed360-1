import { User, Mail, Moon, LogOut } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

import ConfigEventBridge from '@/components/config/ConfigEventBridge.jsx';
import FinanceEventBridge from '@/components/finance/FinanceEventBridge.jsx';
import GuestEventBridge from '@/components/guests/GuestEventBridge.jsx';
import SupplierEventBridge from '@/components/proveedores/SupplierEventBridge.jsx';
import TaskEventBridge from '@/components/tasks/TaskEventBridge.jsx';
import TaskNotificationWatcher from '@/components/tasks/TaskNotificationWatcher.jsx';

import ChatWidget from './ChatWidget';
import DarkModeToggle from './DarkModeToggle';
import Nav from './Nav';
import NotificationCenter from './NotificationCenter';
import WeddingSelector from './WeddingSelector';
import { useAuth } from '../hooks/useAuth';
import { useWedding } from '../context/WeddingContext';
import { prefetchModule } from '../utils/prefetch';
import NotificationWatcher from './notifications/NotificationWatcher';
import LanguageSelector from './ui/LanguageSelector';
import OnboardingModeSelector from './Onboarding/OnboardingModeSelector.jsx';
import OnboardingTutorial from './Onboarding/OnboardingTutorial';
import RoleBadge from './RoleBadge';
import { useOnboarding } from '../hooks/useOnboarding';

export default function MainLayout() {
  const { t } = useTranslation();
  const brandLabel = t('app.brandName', { defaultValue: 'Lovenda' });
  const prefetchNotificaciones = React.useCallback(() => {
    try {
      import('../pages/Notificaciones');
    } catch {}
  }, []);

  // Autenticación y rol
  const { hasRole, userProfile, isLoading, logout: logoutUnified } = useAuth();
  const _role = userProfile?.role || 'particular';

  const [openMenu, setOpenMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const hideSelectorRoutes = ['/home', '/tasks'];
  const hideSelector =
    hideSelectorRoutes.some((r) => location.pathname.startsWith(r)) ||
    location.pathname === '/bodas';
  const isPlanner = userProfile && hasRole ? hasRole('planner') : false;
  const ownerLike = hasRole ? hasRole('owner', 'pareja', 'admin') : false;
  const showWeddingSelector = !hideSelector && (isPlanner || ownerLike);
  const { showOnboarding, completeOnboarding } = useOnboarding();
  const [onboardingMode, setOnboardingMode] = useState(null);
  const { weddingsReady, activeWedding, weddings } = useWedding();
  const isCreateEventRoute =
    location.pathname.startsWith('/crear-evento') ||
    location.pathname.startsWith('/create-wedding-ai') ||
    location.pathname.startsWith('/crear-evento-asistente');
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

  useEffect(() => {
    if (!showOnboarding) setOnboardingMode(null);
  }, [showOnboarding]);

  const isCypress = typeof window !== 'undefined' && !!window.Cypress;
  const enableOnboardingTests =
    typeof window !== 'undefined' && window.__ENABLE_ONBOARDING_TEST__ === true;
  const onboardingBypassRoutes = ['/crear-evento', '/crear-evento-asistente'];
  const isOnboardingRoute = onboardingBypassRoutes.some((route) =>
    location.pathname.startsWith(route)
  );
  const shouldShowOnboardingModal =
    showOnboarding && (!isCypress || enableOnboardingTests) && !isOnboardingRoute;

  // Redirección automática para owners/parejas/admin sin eventos activos al asistente IA
  useEffect(() => {
    try {
      if (!ownerLike || isCreateEventRoute) return;
      if (!weddingsReady) return;
      const noEvents = !Array.isArray(weddings) || weddings.length === 0;
      const noActive = !activeWedding;
      if (noEvents && noActive) {
        navigate('/crear-evento', { replace: true });
      }
    } catch {}
  }, [ownerLike, isCreateEventRoute, weddingsReady, weddings, activeWedding, navigate]);

  // Mostrar loading mientras se inicializa la autenticación (excepto en Cypress)
  if (isLoading && !isCypress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--color-primary)] mx-auto mb-4"></div>
          <p className="text-[color:var(--color-text-70)]">
            {t('app.loading', { defaultValue: 'Cargando...' })}
          </p>
        </div>
      </div>
    );
  }

  // Onboarding (ocultar en E2E)
  if (shouldShowOnboardingModal) {
    if (onboardingMode === 'classic') {
      return (
        <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
          <OnboardingTutorial onComplete={completeOnboarding} />
        </div>
      );
    }
    return (
      <OnboardingModeSelector
        onChooseClassic={() => setOnboardingMode('classic')}
        onChooseAI={() => navigate('/crear-evento')}
      />
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[var(--color-bg)] text-[color:var(--color-text)] font-sans">
      <div className="absolute top-6 right-6 z-50 flex items-center space-x-3">
        {/* Watchers de notificaciones (sin icono visible aquí) */}
        <NotificationWatcher intervalMs={3000} />
        <TaskNotificationWatcher intervalMs={5 * 60 * 1000} />
        {(import.meta.env.PROD || import.meta.env.VITE_SHOW_ROLE_BADGE === 'true') && <RoleBadge />}

        {/* Selector de idioma global */}
        <LanguageSelector variant="minimal" />

        {/* Avatar y menú de usuario */}
        <div className="relative" data-user-menu>
          <button
            onClick={() => setOpenMenu(!openMenu)}
            className="w-11 h-11 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center"
            title={t('navigation.userMenu', { defaultValue: 'Menú de usuario' })}
            style={{
              backgroundColor: openMenu ? 'var(--color-lavender)' : 'var(--color-surface)',
              border: `2px solid ${openMenu ? 'var(--color-primary)' : 'var(--color-border-soft)'}`,
              boxShadow: openMenu ? '0 4px 12px rgba(94, 187, 255, 0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <User className="w-5 h-5" style={{ color: openMenu ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
          </button>
          {openMenu && (
            <div 
              className="absolute right-0 mt-3 bg-[var(--color-surface)] p-2 space-y-1 min-w-[240px] z-50"
              style={{
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              }}
            >
              <div className="px-2 py-1">
                <NotificationCenter />
              </div>

              <Link
                to="/perfil"
                onClick={() => setOpenMenu(false)}
                className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200"
                style={{
                  color: 'var(--color-text)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <User className="w-4 h-4 mr-3" />
                {t('navigation.profile', { defaultValue: 'Perfil' })}
              </Link>
              {false && (
                <Link
                  to="/notificaciones"
                  onClick={() => setOpenMenu(false)}
                  onMouseEnter={prefetchNotificaciones}
                  onFocus={prefetchNotificaciones}
                  onTouchStart={prefetchNotificaciones}
                  className="flex items-center px-3 py-2 text-sm hover:bg-[var(--color-accent-20)] rounded-md transition-colors"
                >
                  Notificaciones
                </Link>
              )}

              <Link
                to="/email"
                onClick={() => setOpenMenu(false)}
                onMouseEnter={(e) => { prefetchEmail(); e.currentTarget.style.backgroundColor = 'var(--color-lavender)'; }}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onFocus={prefetchEmail}
                onTouchStart={prefetchEmail}
                className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200"
                style={{ color: 'var(--color-text)' }}
              >
                <Mail className="w-4 h-4 mr-3" />
                {t('navigation.emailInbox', { defaultValue: 'Buzón de Emails' })}
              </Link>

              <div 
                className="px-3 py-2.5 rounded-xl transition-all duration-200"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center" style={{ color: 'var(--color-text)' }}>
                    <Moon className="w-4 h-4 mr-3" />
                    {t('navigation.darkMode', { defaultValue: 'Modo oscuro' })}
                  </span>
                  <DarkModeToggle className="ml-2" />
                </div>
              </div>

              <div style={{ height: '1px', backgroundColor: 'var(--color-border-soft)', margin: '8px 0' }}></div>
              <button
                onClick={() => {
                  logoutUnified();
                  setOpenMenu(false);
                }}
                className="w-full text-left px-3 py-2.5 text-sm rounded-xl transition-all duration-200 flex items-center"
                style={{ color: 'var(--color-danger)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-danger-10)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogOut className="w-4 h-4 mr-3" />
                {t('navigation.logout', { defaultValue: 'Cerrar sesión' })}
              </button>
            </div>
          )}
        </div>
      </div>

      <main className="container flex-grow mx-auto px-4 pt-8 pb-36">
        {showWeddingSelector && <WeddingSelector />}
        <TaskEventBridge />
        <FinanceEventBridge />
        <SupplierEventBridge />
        <ConfigEventBridge />
        <GuestEventBridge />
        <Outlet />
      </main>
      <Nav />
      <ChatWidget />
    </div>
  );
}
