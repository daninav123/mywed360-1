import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useWedding } from '../context/WeddingContext';
import useTranslations from '../hooks/useTranslations';
import useFinance from '../hooks/useFinance';
import useWeddingTasksHierarchy from '../hooks/useWeddingTasksHierarchy';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { fetchWall } from '../services/wallService';

import Nav from './Nav';
import PlannerDashboard from './PlannerDashboard';
import CountdownCard from './dashboard/CountdownCard';
import BudgetCard from './dashboard/BudgetCard';
import GuestListCard from './dashboard/GuestListCard';
import BudgetDonutChart from './dashboard/BudgetDonutChart';
import UpcomingTasksList from './dashboard/UpcomingTasksList';
import InspirationBoardCompact from './dashboard/InspirationBoardCompact';
import LatestBlogPosts from './dashboard/LatestBlogPosts';
import CoupleIllustration from './dashboard/CoupleIllustration';
import NotificationCenter from './NotificationCenter';
import DarkModeToggle from './DarkModeToggle';
import LanguageSelector from './ui/LanguageSelector';
import { prefetchModule } from '../utils/prefetch';

const normalizeLang = (l) =>
  String(l || 'es')
    .toLowerCase()
    .match(/^[a-z]{2}/)?.[0] || 'es';

const getInspirationCategories = (t) => [
  { slug: 'decoracion', label: t('categories.decoration') },
  { slug: 'flores', label: t('categories.flowers') },
  { slug: 'pastel', label: t('categories.cake') },
];

const isGuestConfirmed = (guest) => {
  if (!guest) return false;
  if (typeof guest.confirmed === 'boolean') return guest.confirmed;
  if (typeof guest.isConfirmed === 'boolean') return guest.isConfirmed;
  if (guest.status === true) return true;
  
  const confirmedTokens = ['confirmado', 'confirmada', 'confirmed', 'attending', 'asiste', 'sí', 'si', 'yes'];
  const statusValue = String(guest.response || guest.status || guest.rsvpStatus || '').trim().toLowerCase();
  
  return confirmedTokens.includes(statusValue);
};

const heroImages = [
  '/hero-2.png',
  '/hero-3.png',
  '/hero-4.png',
  '/hero-5.png',
];

export default function HomePage2() {
  const { t, i18n, format } = useTranslations();
  const navigate = useNavigate();
  const { hasRole, userProfile, currentUser, logout: logoutUnified } = useAuth();
  const { activeWedding, activeWeddingData } = useWedding();
  const { parents: taskParents, childrenByParent: taskChildrenByParent } = useWeddingTasksHierarchy(activeWedding);
  const { stats: financeStats, transactions = [], budget, budgetUsage = [] } = useFinance();
  const { data: guestsCollection = [] } = useFirestoreCollection('guests', []);

  const role = userProfile?.role || 'particular';
  const isPlanner = role === 'planner';

  const [categoryImages, setCategoryImages] = useState([]);
  const [currentHeroImage, setCurrentHeroImage] = useState(() => Math.floor(Math.random() * heroImages.length));
  const [openMenu, setOpenMenu] = useState(false);
  
  const prefetchEmail = React.useCallback(() => {
    prefetchModule('UnifiedEmail', () => import('../pages/UnifiedEmail'));
  }, []);
  const INSPIRATION_CATEGORIES = useMemo(() => getInspirationCategories(t), [t]);
  const lang = normalizeLang(i18n.language);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenu && !event.target.closest('[data-user-menu]')) {
        setOpenMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenu]);

  useEffect(() => {
    Promise.all(INSPIRATION_CATEGORIES.map(({ slug }) => fetchWall(1, slug)))
      .then((results) => {
        const imgs = results
          .map((arr, index) => {
            const first = arr?.[0];
            if (!first) return null;
            const { slug, label } = INSPIRATION_CATEGORIES[index];
            return {
              url: first.url || first.thumb,
              name: label,
              slug,
            };
          })
          .filter(Boolean);
        setCategoryImages(imgs);
      })
      .catch((error) => {
        console.error('[HomePage2] Error loading inspiration gallery:', error);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => {
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * heroImages.length);
        } while (newIndex === prev && heroImages.length > 1);
        return newIndex;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [heroImages.length]);

  const coupleNames = useMemo(() => {
    if (activeWeddingData?.weddingInfo) {
      const coupleName = activeWeddingData.weddingInfo.coupleName || '';
      if (coupleName) {
        const names = coupleName.split(/\s+y\s+|\s*&\s*|\s*\/\s*|\s*-\s*|,\s*/i).map(n => n.trim()).filter(Boolean);
        if (names.length >= 2) {
          return { name1: names[0], name2: names[1] };
        }
        if (names.length === 1) {
          return { name1: names[0], name2: null };
        }
      }
    }
    
    if (activeWeddingData) {
      const coupleName = activeWeddingData.coupleName || activeWeddingData.couple || '';
      if (coupleName) {
        const names = coupleName.split(/\s+y\s+|\s*&\s*|\s*\/\s*|\s*-\s*|,\s*/i).map(n => n.trim()).filter(Boolean);
        if (names.length >= 2) {
          return { name1: names[0], name2: names[1] };
        }
        if (names.length === 1) {
          return { name1: names[0], name2: null };
        }
      }
    }
    
    // Intentar obtener nombre del perfil del usuario
    const userName = userProfile?.account?.name || userProfile?.name || userProfile?.displayName || currentUser?.displayName || '';
    if (userName) {
      return { name1: userName, name2: null };
    }
    
    // Si no hay nombre, retornar vacío (se mostrará solo "Hola!")
    return { name1: '', name2: null };
  }, [userProfile, currentUser, activeWeddingData, t]);

  const displayName = coupleNames.name1;
  const partnerName = coupleNames.name2;

  const guestsMetrics = useMemo(() => {
    const guests = Array.isArray(guestsCollection) ? guestsCollection : [];
    const confirmed = guests.filter(isGuestConfirmed).length;
    const pending = guests.length - confirmed;
    
    return { confirmed, pending, total: guests.length };
  }, [guestsCollection]);

  const budgetMetrics = useMemo(() => {
    const spent = Number(financeStats?.totalSpent || 0);
    const total = Number(financeStats?.totalBudget || 0);
    
    return { spent, total };
  }, [financeStats]);

  const budgetByCategory = useMemo(() => {
    // 1️⃣ Primero intentar usar budgetUsage si existe y tiene gastos reales
    if (Array.isArray(budgetUsage) && budgetUsage.length > 0) {
      const withSpent = budgetUsage.filter(cat => cat.spent > 0);
      if (withSpent.length > 0) {
        return withSpent
          .map(cat => ({
            name: cat.name,
            value: cat.spent,
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);
      }
    }
    
    // 2️⃣ Si no hay gastos reales, mostrar el presupuesto planeado
    if (Array.isArray(budget?.categories) && budget.categories.length > 0) {
      return budget.categories
        .filter(cat => cat.amount > 0 && !cat.muted)
        .map(cat => ({
          name: cat.name,
          value: cat.amount,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
    }
    
    // 3️⃣ Último recurso: calcular desde transactions
    if (!Array.isArray(transactions) || transactions.length === 0) return [];
    
    const categoryMap = new Map();
    
    transactions.forEach((transaction) => {
      if (transaction.type === 'expense' || transaction.type === 'gasto') {
        const category = transaction.category || transaction.service || 'Otros';
        const amount = Number(transaction.amount) || 0;
        const paid = Number(transaction.paid || transaction.paidAmount || 0);
        const amountToAdd = paid > 0 ? paid : amount;
        
        if (categoryMap.has(category)) {
          categoryMap.set(category, categoryMap.get(category) + amountToAdd);
        } else {
          categoryMap.set(category, amountToAdd);
        }
      }
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [budgetUsage, budget, transactions]);

  const upcomingTasks = useMemo(() => {
    const parents = Array.isArray(taskParents) ? taskParents : [];
    const allTasks = [];
    
    const taskColors = ['#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f97316'];
    
    parents.forEach((parent, index) => {
      allTasks.push({
        ...parent,
        color: taskColors[index % taskColors.length],
      });
      
      const children = taskChildrenByParent?.[parent.id] || [];
      children.forEach((child) => {
        allTasks.push({
          ...child,
          color: taskColors[index % taskColors.length],
        });
      });
    });
    
    return allTasks.filter(task => !task.completed && !task.done);
  }, [taskParents, taskChildrenByParent]);

  const handleTaskClick = (task) => {
    navigate('/checklist');
  };

  if (isPlanner) {
    return <PlannerDashboard />;
  }

  const greetingText = partnerName 
    ? t('home2.header.greeting', { name: displayName, partner: partnerName })
    : t('home2.header.greetingSingle', { name: displayName });

  return (
    <>
      <div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" style={{ backgroundColor: '#EDE8E0' }}>
        {/* Botones superiores derechos */}
        <div className="absolute top-4 right-4 flex items-center space-x-3" style={{ zIndex: 100 }}>
          <LanguageSelector variant="minimal" />
          
          <div className="relative" data-user-menu>
            <button
              onClick={() => setOpenMenu(!openMenu)}
              className="w-11 h-11 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center"
              title={t('navigation.userMenu', { defaultValue: 'Menú de usuario' })}
              style={{
                backgroundColor: openMenu ? 'var(--color-lavender)' : 'rgba(255, 255, 255, 0.95)',
                border: `2px solid ${openMenu ? 'var(--color-primary)' : 'rgba(255,255,255,0.8)'}`,
                boxShadow: openMenu ? '0 4px 12px rgba(94, 187, 255, 0.3)' : '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <User className="w-5 h-5" style={{ color: openMenu ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
            </button>
            
            {openMenu && (
              <div 
                className="absolute right-0 mt-3 bg-[var(--color-surface)] p-2 space-y-1"
                style={{
                  minWidth: '220px',
                  border: '1px solid var(--color-border-soft)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  zIndex: 9999,
                }}
              >
                <div className="px-2 py-1">
                  <NotificationCenter />
                </div>

                <Link
                  to="/perfil"
                  onClick={() => setOpenMenu(false)}
                  className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200"
                  style={{ color: 'var(--color-text)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <User className="w-4 h-4 mr-3" />
                  {t('navigation.profile', { defaultValue: 'Perfil' })}
                </Link>

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

        <div className="mx-auto my-8" style={{
          maxWidth: '1024px',
          width: '100%',
          backgroundColor: '#FFFBF7',
          borderRadius: '32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden'
        }}>
          <header className="relative" style={{
            height: '240px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}>
          {/* Imagen de fondo completa */}
          <div className="absolute inset-0">
            <img 
              src={heroImages[currentHeroImage]}
              alt="Wedding couple" 
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 30%', transition: 'opacity 1s ease-in-out' }}
              onError={(e) => {
                e.target.src = "/assets/services/default.webp";
              }}
            />
            {/* Overlay sutil para legibilidad del texto */}
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to right, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.2) 100%)',
              zIndex: 2,
            }} />
          </div>
          
          {/* Texto superpuesto */}
          <div className="relative z-10 h-full flex items-center px-8">
            <div className="max-w-lg">
              <h1 style={{
                fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
                fontSize: '36px',
                fontWeight: 400,
                color: '#FFFFFF',
                marginBottom: '8px',
                letterSpacing: '-0.01em',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}>{greetingText}</h1>
              <p style={{
                fontFamily: "'DM Sans', 'Inter', sans-serif",
                fontSize: '17px',
                color: '#FFFFFF',
                opacity: 0.95,
                textShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}>
                {t('home2.header.subtitle')}
              </p>
            </div>
          </div>
        </header>

        <section className="px-6 py-6">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <CountdownCard
              weddingDate={activeWeddingData?.weddingInfo?.weddingDate}
              venueName={activeWeddingData?.weddingInfo?.venueName}
              t={t}
              format={format}
            />
            <BudgetCard spent={budgetMetrics.spent} total={budgetMetrics.total} />
            <GuestListCard confirmed={guestsMetrics.confirmed} pending={guestsMetrics.pending} />
          </div>
        </section>

        <section className="px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UpcomingTasksList tasks={upcomingTasks} onTaskClick={handleTaskClick} />
            <BudgetDonutChart budgetByCategory={budgetByCategory} />
          </div>
        </section>

        <section className="px-6 py-6">
          <InspirationBoardCompact categories={categoryImages} />
        </section>

        <section className="px-6 py-6">
          <LatestBlogPosts />
        </section>
        </div>
      </div>
      <Nav active="home" />
    </>
  );
}
