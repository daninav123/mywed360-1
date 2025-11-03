import { Briefcase, AlertCircle, CheckSquare, Building2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useTranslations from '../hooks/useTranslations';
import { Link } from 'react-router-dom';

import ExternalImage from './ExternalImage';
import { Card } from './ui/Card';
import { useWedding } from '../context/WeddingContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import usePlannerAlerts from '../hooks/usePlannerAlerts';
import { fetchWall } from '../services/wallService';
import { fetchBlogPosts } from '../services/blogContentService';
import { performanceMonitor } from '../services/PerformanceMonitor';

const INSPIRATION_CATEGORY_SLUGS = ['decoracion', 'ceremonia', 'banquete', 'flores', 'vestidos'];

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
  const { t } = useTranslations();
  const cardId = toTestId(title);
  const ariaValue = loading ? t('planner.dashboard.loadingShort', 'cargando') : String(count ?? 0);
  return (
    <Link
      to={to}
      className="flex-1 min-w-[150px]"
      aria-label={t('planner.dashboard.cardAria', {
        title,
        value: ariaValue,
      })}
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
  const { data: meetings = [], loading: meetingsLoading } = useFirestoreCollection('meetings', []);
  const { data: suppliersList = [], loading: suppliersLoading } = useFirestoreCollection(
    'suppliers',
    []
  );
  const { count: alertCount, loading: alertsLoading, error: alertsError } = usePlannerAlerts();
  const localeLang = useBrowserLang();
  const { t, currentLanguage } = useTranslations();

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
        const categories = INSPIRATION_CATEGORY_SLUGS.slice(0, MAX_INSPIRATION_ITEMS);
        const results = await Promise.all(
          categories.map(async (slug) => {
            try {
              const photos = await fetchWall(1, slug);
              const first = Array.isArray(photos) ? photos.find(Boolean) : null;
              if (!first) return null;
              return {
                slug,
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
        const response = await fetchBlogPosts({ language: localeLang, limit: MAX_BLOG_POSTS });
        const posts = response?.posts || [];
        if (!cancelled) {
          setBlogPosts({
            items: posts,
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

  const handleInspirationClick = useCallback(
    (item) => {
      try {
        const label =
          item?.slug && t
            ? t(`planner.dashboard.inspiration.categories.${item.slug}`, {
                defaultValue: item?.label || item?.slug || '',
              })
            : item?.label || '';
        performanceMonitor.logEvent('planner_inspiration_clicked', {
          slug: item?.slug,
          label,
          activeWeddingId: activeWedding || null,
        });
      } catch {}
    },
    [activeWedding, t]
  );

  const handleBlogClick = useCallback(
    (post) => {
      try {
        performanceMonitor.logEvent('planner_blog_clicked', {
          slug: post?.slug || null,
          language: post?.language || localeLang,
          activeWeddingId: activeWedding || null,
        });
      } catch {}
    },
    [activeWedding, localeLang]
  );

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
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
        {t('planner.dashboard.title')}
      </h1>

      {activeWeddings === 0 ? (
        <Card className="p-6 text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {t('planner.dashboard.empty.title')}
          </h2>
          <p className="text-sm text-gray-600">{t('planner.dashboard.empty.subtitle')}</p>
          <Link
            to="/bodas"
            className="inline-flex items-center justify-center rounded-md bg-rose-500 px-4 py-2 text-white font-semibold hover:bg-rose-600 focus-visible:outline-none focus-visible:ring focus-visible:ring-rose-200 transition-colors"
            onClick={handleEmptyStateCta}
          >
            {t('planner.dashboard.empty.cta')}
          </Link>
        </Card>
      ) : null}

      {/* Tarjetas métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <DashCard
          to="/bodas"
          icon={Briefcase}
          title={t('planner.dashboard.cards.weddings')}
          count={activeWeddings}
          loading={false}
          onClick={() => logCardClick('weddings')}
        />
        <DashCard
          to="/alertas"
          icon={AlertCircle}
          title={t('planner.dashboard.cards.alerts')}
          count={alertsError ? '!' : alertCount}
          loading={alertsLoading}
          onClick={() => logCardClick('alerts')}
        />
        <DashCard
          to="/tasks"
          icon={CheckSquare}
          title={t('planner.dashboard.cards.tasks')}
          count={pendingTasks}
          loading={meetingsLoading}
          onClick={() => logCardClick('tasks')}
        />
        <DashCard
          to="/proveedores"
          icon={Building2}
          title={t('planner.dashboard.cards.suppliers')}
          count={suppliers}
          loading={suppliersLoading}
          onClick={() => logCardClick('suppliers')}
        />
      </div>

      {/* Galería de inspiración */}
      <section aria-labelledby="planner-inspiration-heading">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 id="planner-inspiration-heading" className="text-xl font-semibold text-gray-800">
            {t('planner.dashboard.inspiration.heading')}
          </h2>
          <Link
            to="/inspiracion"
            className="text-sm text-rose-500 hover:text-rose-600 font-medium"
            onClick={() => logCardClick('inspiration')}
          >
            {t('planner.dashboard.inspiration.viewAll')}
          </Link>
        </div>
        {inspiration.error ? (
          <p className="text-sm text-gray-500">{t('planner.dashboard.inspiration.error')}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {inspiration.loading
              ? Array.from({ length: MAX_INSPIRATION_ITEMS }).map((_, idx) => (
                  <div
                    key={`inspiration-skeleton-${idx}`}
                    className="w-full h-32 bg-gray-200 rounded-lg animate-pulse"
                    role="status"
                    aria-label={t('planner.dashboard.inspiration.loadingAria')}
                  />
                ))
              : inspiration.items.map((item) => {
                  const itemLabel = t(`planner.dashboard.inspiration.categories.${item.slug}`, {
                    defaultValue: item.label || item.slug,
                  });
                  return (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => handleInspirationClick(item)}
                      className="relative h-32 rounded-lg overflow-hidden focus-visible:outline-none focus-visible:ring focus-visible:ring-rose-200"
                      aria-label={t('planner.dashboard.inspiration.openAria', {
                        label: itemLabel,
                      })}
                    >
                      {item.image ? (
                        <ExternalImage
                          src={item.image}
                          alt={itemLabel}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-100 flex items-center justify-center text-sm text-gray-500">
                          {t('planner.dashboard.inspiration.noImage')}
                        </div>
                      )}
                      <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <span className="absolute bottom-2 left-2 text-sm font-semibold text-white drop-shadow">
                        {itemLabel}
                      </span>
                    </button>
                  );
                })}
          </div>
        )}
      </section>

      {/* Blogs destacados */}
      <section aria-labelledby="planner-blog-heading">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 id="planner-blog-heading" className="text-xl font-semibold text-gray-800">
            {t('planner.dashboard.blog.heading')}
          </h2>
          <Link
            to="/blog"
            className="text-sm text-rose-500 hover:text-rose-600 font-medium"
            onClick={() => logCardClick('blog')}
          >
            {t('planner.dashboard.blog.viewAll')}
          </Link>
        </div>
        {blogPosts.error ? (
          <p className="text-sm text-gray-500">{t('planner.dashboard.blog.error')}</p>
        ) : (
          <ul className="space-y-2">
            {blogPosts.loading
              ? Array.from({ length: MAX_BLOG_POSTS }).map((_, idx) => (
                  <li
                    key={`blog-skeleton-${idx}`}
                    className="bg-white rounded shadow p-3 animate-pulse"
                    role="status"
                    aria-label={t('planner.dashboard.blog.loadingAria')}
                  />
                ))
              : blogPosts.items.map((post) => {
                  const published = post.publishedAt ? new Date(post.publishedAt) : null;
                  const subtitle = published
                    ? (() => {
                        try {
                          return new Intl.DateTimeFormat(currentLanguage || 'es', {
                            day: 'numeric',
                            month: 'short',
                          }).format(published);
                        } catch {
                          return published.toDateString();
                        }
                      })()
                    : post.language?.toUpperCase();
                  return (
                    <li
                      key={post.id || post.slug}
                      className="bg-white rounded shadow p-3 hover:bg-gray-50"
                    >
                      <Link
                        to={post.slug ? `/blog/${post.slug}` : '/blog'}
                        onClick={() => handleBlogClick(post)}
                        className="block space-y-1"
                      >
                        <p className="text-base font-semibold text-gray-800">{post.title}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
                        <span className="text-xs text-gray-500">{subtitle || 'Lovenda'}</span>
                      </Link>
                    </li>
                  );
                })}
          </ul>
        )}
      </section>
    </div>
  );
}
