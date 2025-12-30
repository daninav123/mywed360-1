import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import useTranslations from '../hooks/useTranslations';
import { prefetchModule } from '../utils/prefetch';

/**
 * Devuelve los items de navegación según el rol del usuario
 * @param {string} role - Rol del usuario (pareja, planner, ayudante)
 * @param {function} t - Función de traducción
 * @returns {Array} Array de items de navegación con path y label
 */
function getNavItems(role, t) {
  const roleMap = {
    pareja: 'owner',
    'wedding-planner': 'planner',
    planner: 'planner',
    ayudante: 'assistant',
  };
  const rawRole = (role || '').toString().trim().toLowerCase();
  const normalizedRole = roleMap[rawRole] || 'owner';

  switch (normalizedRole) {
    case 'owner':
      return [
        { path: '/home', label: t('navigation.home') },
        { path: '/tasks', label: t('navigation.tasks') },
        { path: '/finance', label: t('navigation.finance') },
        { path: '/more', label: t('navigation.more') },
      ];
    case 'planner':
      return [
        { path: '/home', label: t('navigation.home') },
        { path: '/tasks', label: t('navigation.tasks') },
        { path: '/bodas', label: t('navigation.weddings') },
        { path: '/more', label: t('navigation.more') },
      ];
    case 'assistant':
      return [
        { path: '/tasks', label: t('navigation.tasks') },
        { path: '/protocolo', label: t('navigation.protocol') },
        { path: '/more', label: t('navigation.more') },
      ];
    default:
      return [
        { path: '/home', label: t('navigation.home') },
        { path: '/tasks', label: t('navigation.tasks') },
        { path: '/more', label: t('navigation.more') },
      ];
  }
}

function Nav() {
  const { userProfile } = useAuth();
  const { t } = useTranslations();

  const role = userProfile?.role || 'owner';
  const navItems = React.useMemo(() => getNavItems(role, t), [role, t]);

  const navigate = useNavigate();
  const location = useLocation();

  // Prefetch for lazy routes on hover
  const prefetchForPath = React.useCallback((path) => {
    try {
      if (path.startsWith('/protocolo'))
        prefetchModule('ProtocoloLayout', () => import('../pages/protocolo/ProtocoloLayout'));
    } catch {}
  }, []);

  return (
    <nav 
      className="fixed bottom-0 w-full shadow-lg flex justify-between items-center px-4 py-3 z-30"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--color-border-soft)',
      }}
    >
      {/* Navegación principal */}
      <div className="flex justify-around flex-1 max-w-lg mx-auto gap-2">
        {navItems.map(({ path, label }, idx) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <button
              key={idx}
              onClick={() => navigate(path)}
              onMouseEnter={() => prefetchForPath(path)}
              onFocus={() => prefetchForPath(path)}
              onTouchStart={() => prefetchForPath(path)}
              className="relative flex-1 py-2 px-3 rounded-xl transition-all duration-200"
              style={{
                backgroundColor: isActive ? 'var(--color-lavender)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}
            >
              <motion.span
                animate={{ scale: isActive ? 1.05 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="font-medium text-sm"
                style={{
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {label}
              </motion.span>
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 rounded-full"
                  style={{
                    width: '40%',
                    backgroundColor: 'var(--color-primary)',
                  }}
                  layoutId="activeUnderline"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default Nav;
