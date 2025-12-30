import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
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

export default function HomePage2() {
  const { t, i18n, format } = useTranslations();
  const navigate = useNavigate();
  const { hasRole, userProfile, currentUser } = useAuth();
  const { activeWedding, activeWeddingData } = useWedding();
  const { parents: taskParents, childrenByParent: taskChildrenByParent } = useWeddingTasksHierarchy(activeWedding);
  const { stats: financeStats, transactions = [], budget, budgetUsage = [] } = useFinance();
  const { data: guestsCollection = [] } = useFirestoreCollection('guests', []);

  const role = userProfile?.role || 'particular';
  const isPlanner = role === 'planner';

  const [categoryImages, setCategoryImages] = useState([]);
  const INSPIRATION_CATEGORIES = useMemo(() => getInspirationCategories(t), [t]);
  const lang = normalizeLang(i18n.language);

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
    
    const userName = userProfile?.name || userProfile?.displayName || currentUser?.displayName || '';
    if (userName) {
      return { name1: userName, name2: null };
    }
    
    return { name1: currentUser?.email?.split('@')[0] || t('home2.header.guest', { defaultValue: 'Guest' }), name2: null };
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

  // Debug: ver qué datos tenemos
  useEffect(() => {
    console.log('\n=== 📊 HomePage2 Budget Debug ===');
    console.log('budgetByCategory:', budgetByCategory);
    console.log('budgetByCategory.length:', budgetByCategory?.length || 0);
    console.log('budget.categories.length:', budget?.categories?.length || 0);
    console.log('budgetUsage.length:', budgetUsage?.length || 0);
    console.log('transactions.length:', transactions?.length || 0);
    console.log('===================================\n');
  }, [budgetByCategory, budget, budgetUsage, transactions]);

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
    ? t('home2.header.greeting', { defaultValue: 'Hi {{name}} & {{partner}}!', name: displayName, partner: partnerName })
    : t('home2.header.greetingSingle', { defaultValue: 'Hi {{name}}!', name: displayName });

  return (
    <div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="mx-auto my-8" style={{ 
        maxWidth: '1024px',
        width: '100%',
        backgroundColor: '#FFFBF7',
        borderRadius: '32px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        overflow: 'hidden'
      }}>
        <header className="relative overflow-hidden" style={{
          height: '240px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          {/* Imagen de fondo completa */}
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1400&auto=format&fit=crop&q=80"
              alt="Wedding couple" 
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 30%' }}
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=1400&auto=format&fit=crop&q=80";
              }}
            />
            {/* Overlay sutil para legibilidad del texto */}
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to right, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.2) 100%)',
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
                {t('home2.header.subtitle', { defaultValue: "Let's Plan Your Dream Wedding" })}
              </p>
            </div>
          </div>
        </header>

        <section className="px-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CountdownCard weddingDate={activeWeddingData?.weddingDate || activeWeddingData?.date} />
            <BudgetCard spent={budgetMetrics.spent} total={budgetMetrics.total} />
            <GuestListCard confirmed={guestsMetrics.confirmed} pending={guestsMetrics.pending} />
          </div>
        </section>

        <section className="px-4 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <UpcomingTasksList tasks={upcomingTasks} onTaskClick={handleTaskClick} />
            <BudgetDonutChart budgetByCategory={budgetByCategory} />
          </div>
        </section>

        <section className="px-4 pb-4">
          <InspirationBoardCompact categories={categoryImages} />
        </section>

        <section className="px-4 pb-6">
          <LatestBlogPosts />
        </section>

      <Nav active="home" />
      </div>
    </div>
  );
}
