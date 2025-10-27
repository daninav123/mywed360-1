import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import { getBackendBase } from '@/utils/backendBase.js';

import ExternalImage from './ExternalImage';
import Input from './Input';
import Nav from './Nav';
import PlannerDashboard from './PlannerDashboard';
import ProviderSearchModal from './ProviderSearchModal';
import { Card } from './ui/Card';
import { Progress } from './ui/Progress';

import {
  User,
  DollarSign,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Phone,
} from 'lucide-react';

import { db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth'; // Nuevo sistema
import useTranslations from '../hooks/useTranslations';
import useFinance from '../hooks/useFinance';
import { useWedding } from '../context/WeddingContext';
import { fetchWeddingNews } from '../services/blogService';
import { fetchWall } from '../services/wallService';
import { getSummary as getGamificationSummary } from '../services/GamificationService';
import { isConfirmedStatus } from '../utils/supplierStatus';

const normalizeLang = (l) =>
  String(l || 'es')
    .toLowerCase()
    .match(/^[a-z]{2}/)?.[0] || 'es';

const dedupeServiceList = (entries) => {
  if (!Array.isArray(entries)) return [];
  const unique = [];
  const seen = new Set();
  for (const entry of entries) {
    let value = '';
    if (typeof entry === 'string') {
      value = entry.trim();
    } else if (entry && typeof entry === 'object') {
      if (typeof entry.name === 'string') value = entry.name.trim();
      else if (typeof entry.label === 'string') value = entry.label.trim();
      else if (typeof entry.value === 'string') value = entry.value.trim();
    }
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(value);
  }
  return unique;
};

// Las categorías se traducirán usando el hook useTranslations
const getInspirationCategories = (t) => [
  { slug: 'decoracion', label: t('common.categories.decoration') },
  { slug: 'coctel', label: t('common.categories.cocktail') },
  { slug: 'banquete', label: t('common.categories.banquet') },
  { slug: 'ceremonia', label: t('common.categories.ceremony') },
  { slug: 'flores', label: t('common.categories.flowers') },
  { slug: 'vestido', label: t('common.categories.dress') },
  { slug: 'pastel', label: t('common.categories.cake') },
  { slug: 'fotografia', label: t('common.categories.photography') },
];

const PROGRESS_STORAGE_KEY = 'maloveapp_progress';
// 2500 coincide con el límite superior del nivel 6 (Experto Wedding) en backend/services/gamificationService.js.
const PROGRESS_COMPLETION_TARGET = 2500;
// Diferencia mínima (en puntos porcentuales) para considerar que se va adelantado o retrasado.
const PROGRESS_DIFF_TOLERANCE = 5;
const YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000;

const clampPercent = (value) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

const readStoredProgress = () => {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = Number.parseFloat(raw);
    return clampPercent(parsed);
  } catch {
    return 0;
  }
};

const writeStoredProgress = (value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, String(clampPercent(value)));
  } catch {
    // Ignorar errores de almacenamiento (modo incógnito, etc.)
  }
};

const parseDateLike = (input) => {
  if (!input) return null;
  try {
    if (input instanceof Date) {
      return Number.isNaN(input.getTime()) ? null : input;
    }
    if (typeof input?.toDate === 'function') {
      const d = input.toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof input === 'object' && typeof input.seconds === 'number') {
      const d = new Date(input.seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof input === 'number') {
      const d = new Date(input);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (!trimmed) return null;
      const date = new Date(trimmed);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  } catch {
    return null;
  }
  return null;
};

const computeExpectedProgress = (weddingData) => {
  if (!weddingData) return null;
  const eventDate =
    parseDateLike(
      weddingData.weddingDate ||
        weddingData.date ||
        weddingData.eventDate ||
        weddingData.ceremonyDate
    ) || null;

  if (!eventDate) return null;

  const planningStartCandidates = [
    weddingData.planningStart,
    weddingData.planningStartDate,
    weddingData.projectStart,
    weddingData.createdAt,
    weddingData.creationDate,
    weddingData.registeredAt,
    weddingData.created_at,
    weddingData.updatedAt, // fallback adicional si la boda fue migrada recientemente
  ];

  let planningStart = null;
  for (const candidate of planningStartCandidates) {
    const parsed = parseDateLike(candidate);
    if (parsed) {
      planningStart = parsed;
      break;
    }
  }

  if (!planningStart || planningStart >= eventDate) {
    const fallback = new Date(eventDate.getTime() - YEAR_IN_MS);
    planningStart = fallback;
  }

  const now = new Date();
  if (now <= planningStart) return 0;
  if (now >= eventDate) return 100;

  const totalSpan = eventDate.getTime() - planningStart.getTime();
  if (totalSpan <= 0) return 100;

  const elapsed = now.getTime() - planningStart.getTime();
  return clampPercent(Math.round((elapsed / totalSpan) * 100));
};

export default function HomePage() {
  const { t } = useTranslations();
  const INSPIRATION_CATEGORIES = useMemo(() => getInspirationCategories(t), [t]);
  
  // Todo se maneja con modales locales
  const [noteText, setNoteText] = useState('');
  const [guest, setGuest] = useState({ name: '', side: 'novia', contact: '' });
  const [newMovement, setNewMovement] = useState({
    concept: '',
    amount: 0,
    date: '',
    type: 'expense',
  });
  const [activeModal, setActiveModal] = useState(null);
  // Hook de autenticacin unificado
  const { hasRole, userProfile, currentUser } = useAuth();
  const { activeWedding, activeWeddingData } = useWedding();

  // Derivados equivalentes al antiguo UserContext
  const role = userProfile?.role || 'particular';
  const displayName =
    userProfile?.name ||
    userProfile?.displayName ||
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    '';
  const [progressPercent, setProgressPercent] = useState(() => readStoredProgress());
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState(null);

  const expectedProgress = useMemo(
    () => computeExpectedProgress(activeWeddingData),
    [activeWeddingData]
  );

  useEffect(() => {
    const uid = currentUser?.uid || userProfile?.uid || null;
    const weddingId = activeWeddingData?.id || activeWedding || null;
    if (!uid || !weddingId) {
      setProgressLoading(false);
      return;
    }

    let cancelled = false;
    setProgressLoading(true);

    (async () => {
      try {
        const summary = await getGamificationSummary({ uid, weddingId });
        const rawPoints = Number(summary?.points ?? summary?.totalPoints ?? 0);
        const percent =
          PROGRESS_COMPLETION_TARGET > 0
            ? clampPercent(Math.round((rawPoints / PROGRESS_COMPLETION_TARGET) * 100))
            : 0;
        if (!cancelled) {
          setProgressPercent(percent);
          writeStoredProgress(percent);
          setProgressError(null);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('[HomePage] No se pudo obtener el resumen de gamificación.', error);
          setProgressError(error);
        }
      } finally {
        if (!cancelled) {
          setProgressLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.uid, userProfile?.uid, activeWedding, activeWeddingData?.id]);

  const progressDiff =
    expectedProgress == null ? null : Math.round(progressPercent - expectedProgress);

  const progressVariant = useMemo(() => {
    if (progressPercent >= 100) return 'success';
    if (expectedProgress == null) {
      return progressPercent >= 80 ? 'primary' : 'destructive';
    }
    if (progressDiff !== null && progressDiff > PROGRESS_DIFF_TOLERANCE) {
      return 'success';
    }
    if (progressDiff !== null && progressDiff < -PROGRESS_DIFF_TOLERANCE) {
      return 'destructive';
    }
    return 'warning';
  }, [expectedProgress, progressDiff, progressPercent]);

  const progressStatusText = useMemo(() => {
    if (progressPercent >= 100) return '¡Progreso completo!';
    if (expectedProgress == null) {
      return '';
    }
    if (progressDiff !== null && progressDiff > PROGRESS_DIFF_TOLERANCE) {
      return 'Vas adelantado al plan previsto';
    }
    if (progressDiff !== null && progressDiff < -PROGRESS_DIFF_TOLERANCE) {
      return 'Vas por detrás del plan. Revisa tus tareas clave.';
    }
    return 'Todo en marcha según el calendario';
  }, [expectedProgress, progressDiff, progressPercent]);

  const resolvedWeddingName = useMemo(() => {
    if (!activeWeddingData) return '';

    const normalizeName = (value) =>
      String(value || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const splitComposite = (value) => {
      if (!value || typeof value !== 'string') return [];
      const cleaned = value.trim();
      if (!cleaned) return [];
      const parts = cleaned
        .split(/\s*(?:&|y|and|\+|\/)\s*/i)
        .map((part) => part.trim())
        .filter(Boolean);
      return parts.length > 1 ? parts : [cleaned];
    };

    const rawNames = [];
    const stringCandidates = [
      activeWeddingData.coupleName,
      activeWeddingData.couple,
      activeWeddingData.brideAndGroom,
      activeWeddingData.name,
    ];

    stringCandidates.forEach((value) => {
      splitComposite(value).forEach((name) => rawNames.push(name));
    });

    const arrayCandidates = [
      Array.isArray(activeWeddingData.coupleNames) ? activeWeddingData.coupleNames : [],
      [activeWeddingData.brideFirstName, activeWeddingData.groomFirstName],
      [activeWeddingData.bride, activeWeddingData.groom],
    ];

    arrayCandidates.forEach((arr) => {
      arr.flat()
        .filter(Boolean)
        .forEach((name) => {
          if (typeof name === 'string') rawNames.push(name.trim());
        });
    });

    const seen = new Set();
    const filtered = [];
    const displayNameNormalized = displayName ? normalizeName(displayName) : null;

    rawNames.forEach((name) => {
      const normalized = normalizeName(name);
      if (!normalized) return;
      if (displayNameNormalized && normalized === displayNameNormalized) return;
      if (seen.has(normalized)) return;
      seen.add(normalized);
      filtered.push(name.trim());
    });

    if (filtered.length > 1) return filtered.join(' y ');
    if (filtered.length === 1) return filtered[0];

    const fallbackString = stringCandidates
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .find((value) => value.length > 0);
    return fallbackString || '';
  }, [activeWeddingData, displayName]);
  const legacyWeddingName =
    typeof window !== 'undefined'
      ? localStorage.getItem('maloveapp_active_wedding_name') || ''
      : '';
  const weddingName = resolvedWeddingName || legacyWeddingName || displayName;
  const logoUrl = userProfile?.logoUrl || '';

  // Datos derivados ya calculados ms arriba
  const email = currentUser?.email || '';
  const isPlanner = role === 'planner';
  const galleryRef = useRef(null);
  const [newsPosts, setNewsPosts] = useState([]);
  const [newsError, setNewsError] = useState(null);
  const [categoryImages, setCategoryImages] = useState([]);
  const { i18n } = useTranslation();
  const lang = normalizeLang(i18n.language);
  const backendBase = getBackendBase();

  useEffect(() => {
    if (!resolvedWeddingName) return;
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('maloveapp_active_wedding_name', resolvedWeddingName);
    } catch {
      /* ignore storage errors */
    }
  }, [resolvedWeddingName]);

  // Visual mode toggle similar a Blog
  const visualMode = useMemo(() => {
    try {
      const usp = new URLSearchParams(window.location.search);
      if (usp.has('visual')) return usp.get('visual') !== '0';
      if (typeof localStorage !== 'undefined' && localStorage.getItem('newsVisual') === '1') return true;
      if (import.meta?.env?.VITE_NEWS_VISUAL === '1') return true;
    } catch {}
    return false;
  }, []);

  // Cargar primera imagen de cada categoría destacada
  useEffect(() => {
    Promise.all(INSPIRATION_CATEGORIES.map(({ slug }) => fetchWall(1, slug)))
      .then((results) => {
        const imgs = results
          .map((arr, index) => {
            const first = arr?.[0];
            if (!first) return null;
            const { slug, label } = INSPIRATION_CATEGORIES[index];
            return {
              src: first.url || first.thumb,
              alt: label,
              slug,
            };
          })
          .filter(Boolean);
        setCategoryImages(imgs);
      })
      .catch((error) => {
        console.error('[HomePage] No se pudo precargar la galería de inspiración:', error);
      });
  }, []);

  // Cargar ltimas noticias (mx 3 por dominio y 4 con imagen)
  useEffect(() => {
    const loadNews = async () => {
      setNewsError(null);
      const desired = 4;
      let page = 1;
      const results = [];
      const domainCounts = {};
      const PER_DOMAIN_LIMIT = 1;
      let consecutiveErrors = 0;

      const hasHttpImage = (p) => typeof p?.image === 'string' && /^https?:\/\//i.test(p.image);
      const isLikelyCover = (url, feedSource) => {
        try {
          const u = new URL(url);
          const host = u.hostname.replace(/^www\./, '').toLowerCase();
          const path = (u.pathname || '').toLowerCase();
          if (/\.svg(\?|$)/i.test(url)) return false;
          const blockHosts = new Set(['gstatic.com', 'ssl.gstatic.com', 'googleusercontent.com']);
          if (host === 'news.google.com' || blockHosts.has(host)) return false;
          const patterns = ['logo', 'favicon', 'sprite', 'placeholder', 'default', 'brand', 'apple-touch-icon', 'android-chrome'];
          if (patterns.some((p) => path.includes(p))) return false;
          return true;
        } catch { return true; }
      };
      while (results.length < desired && page <= 20) {
        try {
          const batch = await fetchWeddingNews(page, 10, lang);
          consecutiveErrors = 0;
          for (const post of batch) {
            if (!post?.url || !hasHttpImage(post)) continue;
            if (visualMode && !isLikelyCover(post.image, post.feedSource)) continue;
            const dom = (() => {
              try {
                return new URL(post.url).hostname.replace(/^www\./, '');
              } catch {
                return 'unk';
              }
            })();
            if ((domainCounts[dom] || 0) >= PER_DOMAIN_LIMIT) continue;
            if (results.some((x) => x.url === post.url)) continue;
            domainCounts[dom] = (domainCounts[dom] || 0) + 1;
            results.push(post);
            if (results.length >= desired) break;
          }
        } catch (err) {
          console.error(err);
          consecutiveErrors++;
          if (consecutiveErrors >= 3 && results.length) break;
        } finally {
          page++;
        }
      }

      // Sin fallback a EN: respetar idioma del usuario

      // Sin placeholders: solo mantener items con imagen real (ya filtrado arriba)
      if (results.length >= desired) {
        setNewsPosts(results.slice(0, desired));
        setNewsError(null);
      } else {
        setNewsPosts([]);
        setNewsError(
          'No se pudieron encontrar cuatro noticias con imagen en tu idioma en este momento. Inténtalo más tarde.'
        );
      }
    };
    loadNews();
  }, [lang]);

  const handleRedoTutorial = useCallback(async () => {
    if (!confirm('Esto eliminar datos locales y crear una nueva boda de prueba. Continuar?'))
      return;
    try {
      // 1. Limpiar almacenamiento y marcar flag para mostrar tutorial
      localStorage.clear();
      localStorage.setItem('forceOnboarding', '1');

      toast.success('Tutorial reiniciado: recargando...');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo reiniciar el tutorial');
    }
  }, []);
  const scrollAmount = 300;

  const scrollPrev = useCallback(() => {
    galleryRef.current?.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }, []);

  const scrollNext = useCallback(() => {
    galleryRef.current?.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }, []);

  // --- Mtricas dinmicas (memoizadas para performance) ---
  const guestsMetrics = useMemo(() => {
    try {
      const guestsArr = JSON.parse(localStorage.getItem('mywed360Guests') || '[]');
      const confirmedCount = guestsArr.filter(
        (g) => (g.response || g.status || '').toLowerCase() === 'confirmado'
      ).length;
      return { guestsArr, confirmedCount, totalGuests: guestsArr.length };
    } catch {
      return { guestsArr: [], confirmedCount: 0, totalGuests: 0 };
    }
  }, []);

  const tasksMetrics = useMemo(() => {
    try {
      const tasksCompletedMap = JSON.parse(localStorage.getItem('tasksCompleted') || '{}');
      const meetingsArr = JSON.parse(localStorage.getItem('mywed360Meetings') || '[]');
      const longTasksArr = JSON.parse(localStorage.getItem('lovendaLongTasks') || '[]');
      const allTasks = [...meetingsArr, ...longTasksArr];
      const tasksTotal = allTasks.length;
      const tasksCompleted = allTasks.filter((t) => tasksCompletedMap[t.id]).length;
      return { tasksTotal, tasksCompleted };
    } catch {
      return { tasksTotal: 0, tasksCompleted: 0 };
    }
  }, []);

  const providersMetrics = useMemo(() => {
    try {
      const providersArr = JSON.parse(localStorage.getItem('lovendaProviders') || '[]');
      const providersTotalNeeded = 8; // puede venir de ajustes
      const providersAssigned = providersArr.length;
      return { providersAssigned, providersTotalNeeded };
    } catch {
      return { providersAssigned: 0, providersTotalNeeded: 8 };
    }
  }, []);

  const { stats: financeStats } = useFinance();
  const financeSpent = Number(financeStats?.totalSpent || 0);
  const budgetTotal = Number(financeStats?.totalBudget || 0);

  const statsNovios = useMemo(
    () => [
      { label: 'Invitados confirmados', value: guestsMetrics.confirmedCount, icon: Users },
      {
        label: 'Presupuesto gastado',
        value:
          `${financeSpent.toLocaleString()}` +
          (budgetTotal ? ` / ${budgetTotal.toLocaleString()}` : ''),
        icon: DollarSign,
      },
      {
        label: 'Proveedores contratados',
        value: `${providersMetrics.providersAssigned} / ${providersMetrics.providersTotalNeeded}`,
        icon: User,
      },
      {
        label: 'Tareas completadas',
        value: `${tasksMetrics.tasksCompleted} / ${tasksMetrics.tasksTotal}`,
        icon: Calendar,
      },
    ],
    [guestsMetrics, financeSpent, providersMetrics, tasksMetrics, budgetTotal]
  );

  const statsPlanner = useMemo(
    () => [
      { label: 'Tareas asignadas', value: `${tasksMetrics.tasksTotal}`, icon: Calendar },
      { label: 'Proveedores asignados', value: providersMetrics.providersAssigned, icon: User },
      { label: 'Invitados confirmados', value: guestsMetrics.confirmedCount, icon: Users },
      {
        label: 'Presupuesto gastado',
        value:
          `${financeSpent.toLocaleString()}` +
          (budgetTotal ? ` / ${budgetTotal.toLocaleString()}` : ''),
        icon: DollarSign,
      },
    ],
    [guestsMetrics, financeSpent, providersMetrics, tasksMetrics, budgetTotal]
  );

  const statsCommon = useMemo(
    () => (role === 'particular' ? statsNovios : statsPlanner),
    [role, statsNovios, statsPlanner]
  );

  const handleQuickAddProvider = useCallback(
    (provider) => {
      try {
        const existing = JSON.parse(localStorage.getItem('lovendaProviders') || '[]');
        const normalized = {
          id: provider.id || Date.now(),
          name: provider.title || provider.name || 'Proveedor sin nombre',
          service: provider.service || '',
          location: provider.location || '',
          priceRange: provider.priceRange || provider.price || '',
          link: provider.link || provider.url || '',
          snippet: provider.snippet || provider.description || '',
          createdAt: Date.now(),
        };
        const updated = [normalized, ...existing].slice(0, 25);
        localStorage.setItem('lovendaProviders', JSON.stringify(updated));
        window.dispatchEvent(new Event('maloveapp-providers'));
        toast.success('Proveedor añadido al panel rápido');
      } catch (error) {
        console.warn('[HomePage] No se pudo guardar el proveedor seleccionado', error);
        toast.error('No se pudo guardar el proveedor seleccionado');
      }
    },
    []
  );

  if (isPlanner) {
    return <PlannerDashboard />;
  }

  return (
    <React.Fragment>
      {/* Botn solo visible en desarrollo */}
      {true && (
        <button
          onClick={handleRedoTutorial}
          className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg z-[100]"
        >
          Rehacer tutorial
        </button>
      )}
      <div className="relative flex flex-col h-full bg-[var(--color-bg)] pb-16">
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-accent)] rounded-full opacity-20 transform translate-x-1/2 -translate-y-1/2" />

        {/* Header */}
        <header className="relative z-10 p-6 flex justify-between items-center flex-wrap gap-4">
          <div className="space-y-1">
            <h1 className="page-title">Bienvenidos, {weddingName}</h1>
            <p className="text-4xl font-bold text-[color:var(--color-text)]">
              Cada detalle hace tu boda inolvidable
            </p>
          </div>
          <div className="flex items-center">
            <img
              src={`${import.meta.env.BASE_URL}logo-app.png`}
              alt="Logo de la boda"
              className="w-32 h-32 object-contain"
            />
          </div>
        </header>

        {/* Progress Section */}
        <section className="z-10 w-full p-6">
          <Card className="bg-[var(--color-surface)]/70 backdrop-blur-md p-4 w-full flex flex-col gap-4">
            <div>
              <p className="text-sm text-[color:var(--color-text)]/70 mb-2">Progreso de tareas</p>
              <Progress
                className="h-4 rounded-full w-full"
                value={progressPercent}
                max={100}
                variant={progressVariant}
                data-testid="home-progress-bar"
              />
              <p
                className="mt-2 text-sm font-medium text-[color:var(--color-text)]"
                data-testid="home-progress-label"
              >
                {progressPercent}% completado
              </p>
              <p className="text-xs text-[color:var(--color-text)]/60" data-testid="home-progress-status">
                {progressStatusText}
                {expectedProgress != null ? ` · Esperado: ${expectedProgress}%` : ''}
              </p>
              {progressLoading && (
                <p className="text-xs text-[color:var(--color-text)]/40">Actualizando progreso...</p>
              )}
              {progressError && !progressLoading && (
                <p className="text-xs text-[color:var(--color-danger)]">
                  No pudimos sincronizar el avance. Se muestra el último valor guardado.
                </p>
              )}
            </div>
          </Card>
        </section>

        {/* Quick Actions */}
        <section className="z-10 p-6 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {[
            { key: 'proveedor', label: 'Buscar proveedor', icon: User },
            { key: 'invitado', label: 'Añadir invitado', icon: Users },
            { key: 'movimiento', label: 'Añadir movimiento', icon: DollarSign },
            { key: 'nota', label: 'Nueva nota', icon: Plus },
          ].map((action, idx) => {
            const Icon = action.icon;
            return (
              <Card
                key={idx}
                role="button"
                onClick={() => setActiveModal(action.key)}
                className="flex items-center justify-between p-4 bg-[var(--color-surface)]/80 backdrop-blur-md hover:shadow-lg transition transform hover:scale-105 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <Icon className="text-[var(--color-primary)]" />
                  <span className="text-[color:var(--color-text)] font-medium">{action.label}</span>
                </div>
                <ChevronRight className="text-[color:var(--color-text)]/50" />
              </Card>
            );
          })}
        </section>

        {/* Stats Cards */}
        <section className="z-10 grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 flex-grow">
          {statsCommon.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card
                key={idx}
                className="p-4 bg-[var(--color-surface)]/80 backdrop-blur-md hover:shadow-lg transition transform hover:scale-105"
              >
                <div className="flex items-center space-x-2">
                  <Icon className="text-[var(--color-primary)]" />
                  <p className="text-sm text-[color:var(--color-text)]">{stat.label}</p>
                </div>
                <p className="text-2xl font-extrabold text-[var(--color-primary)] mt-2">
                  {stat.value}
                </p>
              </Card>
            );
          })}
        </section>

        {/* Inspiration Gallery */}
        <section className="z-10 p-6 pb-12 relative">
          <div className="flex justify-between items-center mb-4">
            <Link to="/inspiracion">
              <button className="text-xl font-bold text-[var(--color-text)] hover:text-[var(--color-primary)]">
                Inspiración para tu boda
              </button>
            </Link>
            <div className="flex space-x-2">
              <button
                onClick={scrollPrev}
                className="p-2 rounded-full bg-[var(--color-surface)]/80 backdrop-blur-md"
              >
                <ChevronLeft className="text-[var(--color-primary)]" />
              </button>
              <button
                onClick={scrollNext}
                className="p-2 rounded-full bg-[var(--color-surface)]/80 backdrop-blur-md"
              >
                <ChevronRight className="text-[var(--color-primary)]" />
              </button>
            </div>
          </div>
          <div
            ref={galleryRef}
            className="flex space-x-4 overflow-x-auto pb-4 snap-x scrollbar-hide"
          >
            {categoryImages.map((img, idx) => (
              <Link
                key={`${img.slug}-${idx}`}
                to={`/inspiracion?tag=${encodeURIComponent(img.slug)}`}
                className="snap-start flex-shrink-0 w-64 h-64 relative rounded-lg overflow-hidden group"
              >
                <ExternalImage
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover transition transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <p className="text-white font-medium">{img.alt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Blog Section */}
        <section className="z-10 p-6 pb-2">
          <div className="flex justify-between items-center mb-4">
            <Link to="/blog">
              <button className="text-xl font-bold text-[var(--color-text)] hover:text-[var(--color-primary)]">
                Blog
              </button>
            </Link>
          </div>
          {newsPosts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {newsPosts.map((post) => (
                <Card
                  key={post.id}
                  onClick={() => window.open(post.url, '_blank')}
                  className="cursor-pointer p-0 overflow-hidden bg-[var(--color-surface)]/80 backdrop-blur-md hover:shadow-lg transition"
                >
                  {post.image && (
                    <ExternalImage
                      src={post.image}
                      alt={post.title}
                      className="w-full h-40 object-cover"
                      requireCover={true}
                      minWidth={visualMode ? 900 : 600}
                      minHeight={visualMode ? 500 : 300}
                      extraBlockHosts={post.feedSource === 'google-news' ? ['news.google.com','gstatic.com','ssl.gstatic.com','googleusercontent.com'] : []}
                    />
                  )}
                  <div className="p-4 space-y-1">
                    <h3 className="font-semibold text-[color:var(--color-text)] line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-[var(--color-text)]/70 line-clamp-2">
                      {post.description}
                    </p>
                    <div className="pt-2 text-xs text-[var(--color-text)]/60 border-t border-[var(--color-text)]/10">
                      Fuente:{' '}
                      {post.source ||
                        (post.url || '').replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {newsError ? (
            <div className="mt-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {newsError}
            </div>
          ) : null}
        </section>

        <Nav active="home" />
      </div>

      {/* Modales */}
      {activeModal === 'proveedor' && (
        <ProviderSearchModal
          onClose={() => setActiveModal(null)}
          onSelectProvider={handleQuickAddProvider}
        />
      )}

      {activeModal === 'invitado' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] p-6 rounded-lg w-96 max-w-full">
            <h2 className="text-xl font-bold mb-4">Añadir Invitado</h2>
            <div className="space-y-4">
              <Input
                label="Nombre"
                value={guest.name}
                onChange={(e) => setGuest({ ...guest, name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Parte de</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded"
                    value={guest.side}
                    onChange={(e) => setGuest({ ...guest, side: e.target.value })}
                  >
                    <option value="novia">Novia</option>
                    <option value="novio">Novio</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>
                <Input
                  label="Contacto"
                  value={guest.contact}
                  onChange={(e) => setGuest({ ...guest, contact: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-[var(--color-text)] border border-[var(--color-text)]/20 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleNavigateFromModal('/invitados')}
                className="px-4 py-2 text-[var(--color-primary)] border border-[var(--color-primary)]/40 rounded bg-[var(--color-primary)]/10"
              >
                Ir a invitados
              </button>
              <button
                onClick={async () => {
                  const trimmedName = guest.name.trim();
                  if (!trimmedName) {
                    toast.error('Añade un nombre para el invitado.');
                    return;
                  }

                  const contact = guest.contact.trim();
                  const payload = {
                    name: trimmedName,
                    tags: guest.side ? [guest.side] : [],
                    status: 'pending',
                  };

                  const notes = [];
                  if (contact) {
                    if (contact.includes('@')) {
                      payload.email = contact;
                    } else if (/^\+?\d[\d\s()-]{3,}$/.test(contact)) {
                      payload.phone = contact;
                    } else {
                      notes.push(`Contacto: ${contact}`);
                    }
                  }
                  notes.push('Añadido desde la pantalla principal');
                  payload.notes = notes.join(' · ');

                  try {
                    const result = await addGuestRecord(payload);
                    if (result?.success) {
                      const newGuest = result.guest || {
                        ...payload,
                        id: Date.now(),
                        email: payload.email || '',
                        phone: payload.phone || '',
                      };

                      try {
                        const legacy = JSON.parse(localStorage.getItem('mywed360Guests') || '[]');
                        legacy.push({
                          id: newGuest.id,
                          name: newGuest.name,
                          side: guest.side,
                          contact: guest.contact,
                          status: newGuest.status || 'pending',
                          email: newGuest.email || '',
                          phone: newGuest.phone || '',
                          notes: newGuest.notes || '',
                        });
                        localStorage.setItem('mywed360Guests', JSON.stringify(legacy));
                      } catch {}

                      try {
                        await reloadGuests();
                      } catch {}

                      setGuest({ name: '', side: 'novia', contact: '' });
                      setActiveModal(null);
                      toast.success('Invitado añadido');
                    } else {
                      toast.error(result?.error || 'No se pudo añadir el invitado');
                    }
                  } catch (err) {
                    console.error('[Home] addGuest quick action failed', err);
                    toast.error('Ocurrió un error al añadir el invitado.');
                  }
                }}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'movimiento' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] p-6 rounded-lg w-96 max-w-full">
            <h2 className="text-xl font-bold mb-4">Nuevo Movimiento</h2>
            <div className="space-y-4">
              <Input
                label="Concepto"
                value={newMovement.concept}
                onChange={(e) => setNewMovement({ ...newMovement, concept: e.target.value })}
              />
              <Input
                label="Cantidad ()"
                type="number"
                value={newMovement.amount}
                onChange={(e) =>
                  setNewMovement({ ...newMovement, amount: parseFloat(e.target.value) || 0 })
                }
              />
              <Input
                label="Fecha"
                type="date"
                value={newMovement.date}
                onChange={(e) => setNewMovement({ ...newMovement, date: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded"
                  value={newMovement.type}
                  onChange={(e) => setNewMovement({ ...newMovement, type: e.target.value })}
                >
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-[var(--color-text)] border border-[var(--color-text)]/20 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleNavigateFromModal('/finance')}
                className="px-4 py-2 text-[var(--color-primary)] border border-[var(--color-primary)]/40 rounded bg-[var(--color-primary)]/10"
              >
                Ir a finanzas
              </button>
              <button
                onClick={() => {
                  const movs = JSON.parse(localStorage.getItem('quickMovements') || '[]');
                  movs.push({ ...newMovement, id: Date.now() });
                  localStorage.setItem('quickMovements', JSON.stringify(movs));
                  setNewMovement({ concept: '', amount: 0, date: '', type: 'expense' });
                  setActiveModal(null);
                  toast.success('Movimiento guardado');
                }}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'nota' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] p-6 rounded-lg w-96 max-w-full">
            <h2 className="text-xl font-bold mb-4">Nueva Nota</h2>
            <div className="space-y-4">
              <textarea
                className="w-full p-3 border border-gray-300 rounded h-32"
                placeholder="Escribe tu nota aqu..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              ></textarea>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-[var(--color-text)] border border-[var(--color-text)]/20 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleNavigateFromModal('/ideas')}
                className="px-4 py-2 text-[var(--color-primary)] border border-[var(--color-primary)]/40 rounded bg-[var(--color-primary)]/10"
              >
                Ir a ideas
              </button>
              <button
                onClick={() => {
                  const notes = JSON.parse(localStorage.getItem('lovendaNotes') || '[]');
                  notes.push({ text: noteText, id: Date.now() });
                  localStorage.setItem('lovendaNotes', JSON.stringify(notes));
                  setNoteText('');
                  setActiveModal(null);
                  toast.success('Nota guardada');
                }}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}
