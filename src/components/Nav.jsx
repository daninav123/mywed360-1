import React from 'react';

import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import LanguageSelector from './ui/LanguageSelector';
import useTranslations from '../hooks/useTranslations';
import { prefetchModule } from '../utils/prefetch';

// Devuelve los Ò�� �"Ò�a�­tems de navegaciÒ�� �"Ò�a�³n segÒ�� �"Ò�a�ºn rol
function getNavItems(role, t) {
  const roleMap = {
    'pareja': 'owner',
    'wedding-planner': 'planner',
    'planner': 'planner',
    'ayudante': 'assistant'
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
/*
  // Normalizar nombres de roles provenientes de Firestore
  const roleMap = {
    'pareja': 'owner',
    'wedding-planner': 'planner',
    'planner': 'planner',
    'ayudante': 'assistant'
  };
  const normalizedRole = roleMap[role] || role;

  if (normalizedRole === 'owner') {
    return [
      { path: '/home', label: 'Inicio' },
      { path: '/tasks', label: 'Tareas' },
      { path: '/finance', label: 'Finanzas' },
        { path: '/more', label: t('navigation.more') },
    ];
  }

  if (normalizedRole === 'planner') {
    return [
      { path: '/home', label: 'Inicio' },
      { path: '/tasks', label: 'Tareas' },
      { path: '/protocolo', label: t('navigation.protocol') },
        { path: '/more', label: t('navigation.more') },
    ];
  }

  if (normalizedRole === 'assistant') {
    return [
      { path: '/tasks', label: 'Tareas' },
      { path: '/protocolo', label: t('navigation.protocol') },
        { path: '/more', label: t('navigation.more') },
    ];
  }

  // Fallback (rol no reconocido)
  return [
    { path: '/home', label: 'Inicio' },
    { path: '/tasks', label: 'Tareas' },
        { path: '/more', label: t('navigation.more') },
  ];
  // Normalizar nombres de roles provenientes de Firestore
  const roleMap = {
    'pareja': 'owner',
    'wedding-planner': 'planner',
    'planner': 'planner',
    'ayudante': 'assistant'
  };
  const normalizedRole = roleMap[role] || role;
  const common = [
    { path: '/home', label: 'Inicio' },
    { path: '/tasks', label: 'Tareas' },
    { path: '/protocolo', label: t('navigation.protocol') },
        { path: '/more', label: t('navigation.more') },
  ];

  if (normalizedRole === 'owner') {
    return [
      { path: '/home', label: 'Inicio' },
      { path: '/tasks', label: 'Tareas' },
      { path: '/finance', label: 'Finanzas' },
        { path: '/more', label: t('navigation.more') },
    ];
  }
  if (normalizedRole === 'planner') {
    // Planner no ve finanzas, pero puede tener otras secciones especÒ�� �"Ò�a�­ficas
    return [
      { path: '/home', label: 'Inicio' },
      { path: '/tasks', label: 'Tareas' },
      { path: '/protocolo', label: t('navigation.protocol') },
        { path: '/more', label: t('navigation.more') },
    ];
  }
  if (normalizedRole === 'assistant') {
    // Asistente: solo tareas y protocolo (mÒ�� �"Ò�a�¡s se mantiene)
    return [
      { path: '/tasks', label: 'Tareas' },
      { path: '/protocolo', label: t('navigation.protocol') },
        { path: '/more', label: t('navigation.more') },
    ];

  }
  // Fallback
  return common;
}

*/
function Nav() {
  // Nuevo sistema unificado
  const { userProfile, hasRole } = useAuth();
  
  // Hook de traducciones
  const { t } = useTranslations();
  
  // Usar el nuevo sistema para el rol, con fallback bÒ�� �"Ò�a�¡sico
  const role = userProfile?.role || 'owner';
  const navItems = React.useMemo(() => getNavItems(role, t), [role, t]);
  

  const navigate = useNavigate();
  const location = useLocation();

  // Prefetch for lazy routes on hover
  const prefetchForPath = React.useCallback((path) => {
    try {
      // Solo prefetch de rutas lazy para evitar warnings de Vite
      if (path.startsWith('/protocolo')) prefetchModule('ProtocoloLayout', () => import('../pages/protocolo/ProtocoloLayout'));
    } catch {}
  }, []);

  return (
    <nav className='fixed bottom-0 w-full bg-[var(--color-primary)] text-[color:var(--color-text)] shadow-md flex justify-between items-center p-3 z-30'>
      {/* NavegaciÒ�� �"Ò�a�³n principal */}
      <div className='flex justify-around flex-1'>
        {navItems.map(({ path, label }, idx) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <button
              key={idx}
              onClick={() => navigate(path)}
              onMouseEnter={() => prefetchForPath(path)}
              onFocus={() => prefetchForPath(path)}
              onTouchStart={() => prefetchForPath(path)}
              className='relative'
            >
              <motion.span
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className={isActive ? 'text-[var(--color-accent)] font-semibold' : 'text-[color:var(--color-text)]'}
              >
                {label}
              </motion.span>
              {isActive && (
                <motion.span
                  className='absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-[var(--color-accent)] rounded'
                  layoutId='activeUnderline'
                />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Selector de idioma */}
      <div className='ml-2'>
        <LanguageSelector 
          variant="minimal" 
          className="text-[color:var(--color-text)]" 
        />
      </div>
    </nav>
  );
}

export default Nav;
