import { Briefcase, AlertCircle, CheckSquare, Building2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import ExternalImage from './ExternalImage';
import { Card } from './ui/Card';
import { useWedding } from '../context/WeddingContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import usePlannerAlerts from '../hooks/usePlannerAlerts';
import { fetchWall } from '../services/wallService';
import { fetchWeddingNews } from '../services/blogService';
import { performanceMonitor } from '../services/PerformanceMonitor';
import { useTranslations } from '../../hooks/useTranslations';

const INSPIRATION_CATEGORIES = [
  {
  const { t } = useTranslations();
 slug: 'decoracion', label: t('common.decoracion') },
  { slug: 'ceremonia', label: 'Ceremonia' },
  { slug: 'banquete', label: 'Banquete' },
  { slug: 'flores', label: 'Flores' },
  { slug: 'vestidos', label: 'Vestidos' },
];

const MAX_INSPIRATION_ITEMS = 4;
const MAX_BLOG_POSTS = 3;

const toTestId = (text) =>
  String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';

const DashCard = ({ to, icon: Icon, title, count, loading, onClick }) => {
  const cardId = toTestId(title);
  return (
  <Link
    to={to}
    className="flex-1 min-w-[150px]"
    aria-label={`${title}: ${loading ? 'cargando' : count}`}
    onClick={() => onClick?.()}
    data-testid={`planner-card-${cardId}`}
  >
    <Card className="flex flex-col items-center hover:bg-gray-50 focus-visible:ring focus-visible:ring-rose-200 transition-colors">
      <Icon className="w-8 h-8 text-rose-500 mb-2" aria-hidden="true" />
      <span className="text-lg font-semibold mb-1 text-gray-800">{title}</span>
      <span
        className="text-2xl font-bold text-gray-700"
        aria-live="polite"
        data-testid={`planner-card-${cardId}-value`}
      >
        {loading ? '—' : count}
      </span>
    </Card>
  </Link>
  );
};

const useBrowserLang = () => {
  return useMemo(() => {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const match = navigator.language.toLowerCase().match(/^[a-z]{2}/);
      if (match && match[0]) return match[0];
    }
    return 'es';
  }, []);
};

export default function PlannerDashboard() {
  const { weddings, activeWedding } = useWedding();
  const {
    data: meetings = [],
    loading: meetingsLoading,
  } = useFirestoreCollection('meetings', []);
  const {
    data: suppliersList = [],
    loading: suppliersLoading,
  } = useFirestoreCollection('suppliers', []);
  const {
    count: alertCount,
    loading: alertsLoading,
    error: alertsError,
  } = usePlannerAlerts();
  const localeLang = useBrowserLang();

  const [inspiration, setInspiration] = useState({
    items: [],
    loading: true,
    error: null,
  });
  const [blogPosts, setBlogPosts] = useState({
    items: [],
    loading: true,
    error: null,
  });

  const activeWeddings = Array.isArray(weddings) ? weddings.length : 0;
  const pendingTasks = useMemo(
    () => (Array.isArray(meetings) ? meetings.filter((m) => !m?.completed).length : 0),
    [meetings]
  );
  const suppliers = Array.isArray(suppliersList) ? suppliersList.length : 0;

  const logCardClick = useCallback(
    (target) => {
      try {
        performanceMonitor.logEvent('planner_card_clicked', {
          target,
          activeWeddingId: activeWedding || null,
        });
      } catch {}
    },
    [activeWedding]
  );

  useEffect(() => {
    let cancelled = false;
    setInspiration((prev) => ({ ...prev, loading: true, error: null }));
    (async () => {
      try {
        const categories = INSPIRATION_CATEGORIES.slice(0, MAX_INSPIRATION_ITEMS);
        const results = await Promise.all(
          categories.map(async ({ slug, label }) => {
            try {
              const photos = await fetchWall(1, slug);
              const first = Array.isArray(photos) ? photos.find(Boolean) : null;
              if (!first) return null;
              return {
                slug,
                label,
                image: first.url || first.thumb || first.image || '',
              };
            } catch {
              return null;
            }
          })
        );
        if (!cancelled) {
          const items = results.filter(Boolean);
          setInspiration({ items, loading: false, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setInspiration({
            items: [],
            loading: false,
            error: error instanceof Error ? error : new Error('inspiration_fetch_failed'),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setBlogPosts((prev) => ({ ...prev, loading: true, error: null }));
    (async () => {
      try {
        const posts = await fetchWeddingNews(1, 10, localeLang);
        if (!cancelled) {
          setBlogPosts({
            items: Array.isArray(posts) ? posts.slice(0, MAX_BLOG_POSTS) : [],
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setBlogPosts({
            items: [],
            loading: false,
            error: error instanceof Error ? error : new Error('blog_fetch_failed'),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [localeLang]);

  const handleInspirationClick = useCallback((item) => {
    try {
      performanceMonitor.logEvent('planner_inspiration_clicked', {
        slug: item?.slug,
        label: item?.label,
        activeWeddingId: activeWedding || null,
      });
    } catch {}
  }, [activeWedding]);

  const handleBlogClick = useCallback((post) => {
    try {
      performanceMonitor.logEvent('planner_blog_clicked', {
        url: post?.url,
        source: post?.source || null,
        activeWeddingId: activeWedding || null,
      });
    } catch {}
  }, [activeWedding]);

  const handleEmptyStateCta = useCallback(() => {
    try {
      performanceMonitor.logEvent('planner_empty_state_cta', {
        action: 'go_to_bodas',
        activeWeddingId: activeWedding || null,
      });
    } catch {}
  }, [activeWedding]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Panel de Wedding Planner</h1>

      {activeWeddings === 0 ? (
        <Card className="p-6 text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Aún no tienes bodas vinculadas</h2>
          <p className="text-sm text-gray-600">
            Crea una nueva boda o solicita acceso para empezar a gestionarla desde este panel.
          </p>
          <Link
            to="/bodas"
            className="inline-flex items-center justify-center rounded-md bg-rose-500 px-4 py-2 text-white font-semibold hover:bg-rose-600 focus-visible:outline-none focus-visible:ring focus-visible:ring-rose-200 transition-colors"
            onClick={handleEmptyStateCta}
          >
            Ir a gestión de bodas
          </Link>
        </Card>
      ) : null}

      {/* Tarjetas métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <DashCard
          to="/bodas"
          icon={Briefcase}
          title="Bodas activas"
          count={activeWeddings}
          loading={false}
          onClick={() => logCardClick('weddings')}
        />
        <DashCard
          to="/alertas"
          icon={AlertCircle}
          title="Alertas"
          count={alertsError ? '!' : alertCount}
          loading={alertsLoading}
          onClick={() => logCardClick('alerts')}
        />
        <DashCard
          to="/tasks"
          icon={CheckSquare}
          title="Tareas"
          count={pendingTasks}
          loading={meetingsLoading}
          onClick={() => logCardClick('tasks')}
        />
        <DashCard
          to="/proveedores"
          icon={Building2}
          title="Proveedores"
          count={suppliers}
          loading={suppliersLoading}
          onClick={() => logCardClick('suppliers')}
        />
      </div>

      {/* Galería de inspiración */}
      <section aria-labelledby="planner-inspiration-heading">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 id="planner-inspiration-heading" className="text-xl font-semibold text-gray-800">
            Inspiración reciente
          </h2>
          <Link
            to="/inspiracion"
            className="text-sm text-rose-500 hover:text-rose-600 font-medium"
            onClick={() => logCardClick('inspiration')}
          >
            Ver todo
          </Link>
        </div>
        {inspiration.error ? (
          <p className="text-sm text-gray-500">No se pudieron cargar las imágenes de inspiración.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {inspiration.loading
              ? Array.from({ length: MAX_INSPIRATION_ITEMS }).map((_, idx) => (
                  <div
                    key={`inspiration-skeleton-${idx}`}
                    className="w-full h-32 bg-gray-200 rounded-lg animate-pulse"
                    role="status"
                    aria-label={t('common.aria_cargando_inspiracion')}
                  />
                ))
              : inspiration.items.map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => handleInspirationClick(item)}
                    className="relative h-32 rounded-lg overflow-hidden focus-visible:outline-none focus-visible:ring focus-visible:ring-rose-200"
                    aria-label={`Abrir ${item.label}`}
                  >
                    {item.image ? (
                      <ExternalImage
                        src={item.image}
                        alt={item.label}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-100 flex items-center justify-center text-sm text-gray-500">
                        Sin imagen
                      </div>
                    )}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-2 left-2 text-sm font-semibold text-white drop-shadow">
                      {item.label}
                    </span>
                  </button>
                ))}
          </div>
        )}
      </section>

      {/* Blogs destacados */}
      <section aria-labelledby="planner-blog-heading">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 id="planner-blog-heading" className="text-xl font-semibold text-gray-800">
            Blogs destacados
          </h2>
          <Link
            to="/blog"
            className="text-sm text-rose-500 hover:text-rose-600 font-medium"
            onClick={() => logCardClick('blog')}
          >
            Abrir blog
          </Link>
        </div>
        {blogPosts.error ? (
          <p className="text-sm text-gray-500">No se pudieron cargar las noticias del blog.</p>
        ) : (
          <ul className="space-y-2">
            {blogPosts.loading
              ? Array.from({ length: MAX_BLOG_POSTS }).map((_, idx) => (
                  <li
                    key={`blog-skeleton-${idx}`}
                    className="bg-white rounded shadow p-3 animate-pulse"
                    role="status"
                    aria-label={t('common.aria_cargando_publicacion')}
                  />
                ))
              : blogPosts.items.map((post) => (
                  <li key={post.id || post.url} className="bg-white rounded shadow p-3 hover:bg-gray-50">
                    <a
                      href={post.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleBlogClick(post)}
                      className="block"
                    >
                      <p className="text-base font-semibold text-gray-800">{post.title}</p>
                      {post.source ? (
                        <span className="text-xs text-gray-500">Fuente: {post.source}</span>
                      ) : null}
                    </a>
                  </li>
                ))}
          </ul>
        )}
      </section>
    </div>
  );
}
