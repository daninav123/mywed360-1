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
      className="fixed bottom-0 left-0 right-0 z-30"
      style={{
        backgroundColor: '#FFFBF7',
        borderTop: '1px solid #E8DED0',
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div className="flex justify-center items-center py-2">
        <div className="flex gap-2 px-4">
          {navItems.map(({ path, label }, idx) => {
            const isActive = location.pathname.startsWith(path);
            return (
              <motion.button
                key={idx}
                onClick={() => navigate(path)}
                onMouseEnter={() => prefetchForPath(path)}
                onFocus={() => prefetchForPath(path)}
                onTouchStart={() => prefetchForPath(path)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2.5 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: isActive ? '#C9B6E4' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#6B7280',
                  fontFamily: "'DM Sans', 'Inter', sans-serif",
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  boxShadow: isActive ? '0 2px 8px rgba(201, 182, 228, 0.3)' : 'none',
                }}
              >
                {label}
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default Nav;
