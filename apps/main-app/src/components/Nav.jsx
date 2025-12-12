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
        { path: '/timeline', label: 'Timeline' },
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
    <nav className="fixed bottom-0 w-full bg-[var(--color-primary)] text-[color:var(--color-text)] shadow-md flex justify-between items-center p-3 z-30">
      {/* Navegación principal */}
      <div className="flex justify-around flex-1">
        {navItems.map(({ path, label }, idx) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <button
              key={idx}
              onClick={() => navigate(path)}
              onMouseEnter={() => prefetchForPath(path)}
              onFocus={() => prefetchForPath(path)}
              onTouchStart={() => prefetchForPath(path)}
              className="relative"
            >
              <motion.span
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className={
                  isActive
                    ? 'text-[color:var(--color-surface)] font-semibold drop-shadow-sm'
                    : 'text-[color:var(--color-text)]'
                }
              >
                {label}
              </motion.span>
              {isActive && (
                <motion.span
                  className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-[color:var(--color-surface)] rounded"
                  layoutId="activeUnderline"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Espaciador derecho */}
      <div className="ml-2" />
    </nav>
  );
}

export default Nav;
