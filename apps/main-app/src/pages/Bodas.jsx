import {
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import useTranslations from '../hooks/useTranslations';
import { formatDate } from '../utils/formatUtils';

import MultiWeddingSummary from '../components/weddings/MultiWeddingSummary.jsx';
import WeddingPortfolioTable from '../components/weddings/WeddingPortfolioTable.jsx';
import PageWrapper from '../components/PageWrapper';
import Button from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import PageTabs from '../components/ui/PageTabs';
import { Progress } from '../components/ui/Progress';
import WeddingFormModal from '../components/WeddingFormModal';
import { useWedding } from '../context/WeddingContext';
import { db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { performanceMonitor } from '../services/PerformanceMonitor';
import { createWedding } from '../services/WeddingService';
import { bulkSyncWeddings, syncWeddingWithCRM } from '../services/crmSyncService';
const getStatusTabOptions = (t) => [
  { value: 'active', label: t('weddings.tabs.active') },
  { value: 'archived', label: t('weddings.tabs.archived') },
  { value: 'multi', label: t('weddings.tabs.multiSummary') },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const parseDate = (value) => {
  if (!value) return null;
  try {
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value?.toDate === 'function') {
      const d = value.toDate();
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof value === 'object' && typeof value.seconds === 'number') {
      const d = new Date(value.seconds * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof value === 'string' && value.includes('-') && value.length === 10) {
      const [y, m, d] = value.split('-').map((piece) => parseInt(piece, 10));
      const out = new Date(y, (m || 1) - 1, d || 1);
      return isNaN(out.getTime()) ? null : out;
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
};

const normalizeCrmStatus = (wedding) =>
  String(
    wedding?.crm?.lastSyncStatus ||
      wedding?.crmStatus ||
      wedding?.crm?.status ||
      ''
  ).toLowerCase() || 'never';

const profileLabel = (profile) => {
  if (!profile) return '';
  const candidates = [
    profile.displayName,
    profile.name,
    profile.fullName,
    profile.firstName && profile.lastName ? `${profile.firstName} ${profile.lastName}` : null,
    profile.email,
  ].filter(Boolean);
  return candidates.length ? candidates[0] : profile.id;
};

const defaultFilters = {
  search: '',
  status: 'all',
  ownerId: 'all',
  plannerId: 'all',
  startDate: '',
  endDate: '',
  crmStatus: 'all',
};

export default function Bodas() {
  const { currentUser } = useAuth();
  const { t } = useTranslations();
  const { userProfile } = useAuth();
  const {
    weddings,
    weddingsReady,
    activeWedding,
    setActiveWedding,
  } = useWedding();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('active');
  const [enrichedWeddings, setEnrichedWeddings] = useState([]);
  const [portfolioFilters, setPortfolioFilters] = useState(defaultFilters);
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [syncingIds, setSyncingIds] = useState(() => new Set());
  const userCacheRef = useRef(new Map());

  const loadUserProfile = useCallback(async (userId) => {
    if (!userId) return null;
    if (userCacheRef.current.has(userId)) {
      return userCacheRef.current.get(userId);
    }
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (!snap.exists()) {
        userCacheRef.current.set(userId, null);
        return null;
      }
      const data = snap.data() || {};
      const profile = {
        id: userId,
        displayName: data.displayName || data.fullName || data.name || '',
        email: data.email || '',
        role: data.role || '',
        firstName: data.firstName,
        lastName: data.lastName,
      };
      userCacheRef.current.set(userId, profile);
      return profile;
    } catch (error) {
      // console.warn('[Bodas] No se pudo cargar el perfil', userId, error);
      userCacheRef.current.set(userId, null);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const list = await Promise.all(
        weddings.map(async (wedding) => {
          const ownerIds = Array.isArray(wedding.ownerIds) ? wedding.ownerIds : [];
          const plannerIds = Array.isArray(wedding.plannerIds) ? wedding.plannerIds : [];
          const ownerProfiles = (
            await Promise.all(ownerIds.map((id) => loadUserProfile(id)))
          ).filter(Boolean);
          const plannerProfiles = (
            await Promise.all(plannerIds.map((id) => loadUserProfile(id)))
          ).filter(Boolean);
          const weddingDateValue =
            wedding.weddingDateValue ||
            parseDate(wedding.weddingDate || wedding.date || wedding.eventDate);

          return {
            ...wedding,
            ownerProfiles,
            plannerProfiles,
            ownerNames: ownerProfiles.map(profileLabel).filter(Boolean),
            plannerNames: plannerProfiles.map(profileLabel).filter(Boolean),
            weddingDateValue,
            crmStatusNormalized: normalizeCrmStatus(wedding),
          };
        })
      );
      if (!cancelled) setEnrichedWeddings(list);
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, [weddings, loadUserProfile]);

  const markSyncing = useCallback((weddingId, value) => {
    setSyncingIds((prev) => {
      const next = new Set(prev);
      if (value) next.add(weddingId);
      else next.delete(weddingId);
      return next;
    });
  }, []);

  const handleSyncWedding = useCallback(
    async (wedding) => {
      const weddingId = wedding?.id;
      if (!weddingId) return;
      markSyncing(weddingId, true);
      try {
        await syncWeddingWithCRM(weddingId, {
          name: wedding.name || '',
          location: wedding.location || '',
          weddingDate: wedding.weddingDate || wedding.date || null,
        });
      } catch (error) {
        // console.error('[Bodas] sync CRM error', error);
        toast.error(t('weddings.syncCrmError'));
      } finally {
        markSyncing(weddingId, false);
      }
    },
    [markSyncing]
  );

  const ownerOptions = useMemo(() => {
    const map = new Map();
    enrichedWeddings.forEach((w) => {
      (w.ownerProfiles || []).forEach((profile) => {
        if (!profile) return;
        if (!map.has(profile.id)) map.set(profile.id, profileLabel(profile));
      });
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [enrichedWeddings]);

  const plannerOptions = useMemo(() => {
    const map = new Map();
    enrichedWeddings.forEach((w) => {
      (w.plannerProfiles || []).forEach((profile) => {
        if (!profile) return;
        if (!map.has(profile.id)) map.set(profile.id, profileLabel(profile));
      });
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [enrichedWeddings]);

  const activeList = useMemo(
    () => enrichedWeddings.filter((w) => w.active !== false),
    [enrichedWeddings]
  );
  const archivedList = useMemo(
    () => enrichedWeddings.filter((w) => w.active === false),
    [enrichedWeddings]
  );

  const filteredPortfolio = useMemo(() => {
    const term = portfolioFilters.search.trim().toLowerCase();
    const startDate = portfolioFilters.startDate
      ? new Date(`${portfolioFilters.startDate}T00:00:00`)
      : null;
    const endDate = portfolioFilters.endDate
      ? new Date(`${portfolioFilters.endDate}T23:59:59`)
      : null;

    return enrichedWeddings.filter((w) => {
      const crmStatus = w.crmStatusNormalized || 'never';
      const eventDate = w.weddingDateValue;
      const diffDays =
        eventDate && !isNaN(eventDate.getTime())
          ? Math.round((eventDate.getTime() - Date.now()) / MS_PER_DAY)
          : null;

      if (term) {
        const haystack = [
          w.name || '',
          w.location || '',
          ...(w.ownerNames || []),
          ...(w.plannerNames || []),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      if (portfolioFilters.status === 'active' && w.active === false) return false;
      if (portfolioFilters.status === 'archived' && w.active !== false) return false;
      if (portfolioFilters.status === 'upcoming30') {
        if (diffDays === null || diffDays < 0 || diffDays > 30) return false;
      }
      if (portfolioFilters.status === 'upcoming90') {
        if (diffDays === null || diffDays < 0 || diffDays > 90) return false;
      }
      if (portfolioFilters.status === 'unsynced') {
        const unsynced = ['never', 'failed', 'error'];
        if (!unsynced.includes(crmStatus)) return false;
      }

      if (portfolioFilters.ownerId !== 'all') {
        if (!Array.isArray(w.ownerIds) || !w.ownerIds.includes(portfolioFilters.ownerId))
          return false;
      }
      if (portfolioFilters.plannerId !== 'all') {
        if (!Array.isArray(w.plannerIds) || !w.plannerIds.includes(portfolioFilters.plannerId))
          return false;
      }

      if (portfolioFilters.crmStatus !== 'all') {
        if (portfolioFilters.crmStatus === 'synced') {
          if (!['synced', 'success', 'ok'].includes(crmStatus)) return false;
        } else if (portfolioFilters.crmStatus === 'queued') {
          if (!['queued', 'pending'].includes(crmStatus)) return false;
        } else if (portfolioFilters.crmStatus === 'failed') {
          if (!['failed', 'error'].includes(crmStatus)) return false;
        } else if (portfolioFilters.crmStatus === 'never') {
          if (crmStatus !== 'never') return false;
        }
      }

      if (startDate && eventDate) {
        if (eventDate.getTime() < startDate.getTime()) return false;
      }
      if (endDate && eventDate) {
        if (eventDate.getTime() > endDate.getTime()) return false;
      }

      return true;
    });
  }, [enrichedWeddings, portfolioFilters]);

  const handleBulkSync = useCallback(async () => {
    const ids = filteredPortfolio.map((item) => item.id).filter(Boolean);
    if (!ids.length) return;
    setBulkSyncing(true);
    try {
      await bulkSyncWeddings(ids, { source: 'multi-wedding-dashboard' });
    } catch (error) {
      // console.error('[Bodas] bulk CRM sync error', error);
      toast.error(t('weddings.bulkSyncError'));
    } finally {
      setBulkSyncing(false);
    }
  }, [filteredPortfolio]);

  const weddingsToShow =
    viewMode === 'active' ? activeList : viewMode === 'archived' ? archivedList : filteredPortfolio;

  const crearBoda = async (values) => {
    try {
      const weddingId = await createWedding(currentUser.uid, {
        name: values.name,
        weddingDate: values.date || '',
        location: values.location || '',
        banquetPlace: values.banquetPlace || '',
        ownerIds: [],
        plannerIds: [currentUser.uid],
        progress: 0,
        active: true,
        createdFrom: 'planner_dashboard',
      });
      performanceMonitor.logEvent('wedding_created', {
        weddingId,
        role: userProfile?.role || 'planner',
        source: 'planner_dashboard',
      });
      setActiveWedding(weddingId);
      navigate(`/bodas/${weddingId}`);
    } catch (err) {
      // console.error('Error creando nueva boda:', err);
      toast.error(t('weddings.createError'));
    }
  };

  const handleToggleActive = async (wedding) => {
    const nextActive = wedding.active === false;
    const confirmMessage = nextActive
      ? '¿Restaurar esta boda y volver a marcarla como activa?'
      : '¿Archivar esta boda? Podrás restaurarla más adelante.';
    if (!window.confirm(confirmMessage)) return;
    try {
      const wedRef = doc(db, 'weddings', wedding.id);
      await updateDoc(wedRef, {
        active: nextActive,
        archivedAt: nextActive ? deleteField() : serverTimestamp(),
      });
      if (currentUser?.uid) {
        const subRef = doc(db, 'users', currentUser.uid, 'weddings', wedding.id);
        await setDoc(
          subRef,
          {
            active: nextActive,
            lastUpdatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      performanceMonitor.logEvent(nextActive ? 'wedding_restored' : 'wedding_archived', {
        weddingId: wedding.id,
        role: userProfile?.role || 'planner',
        source: 'planner_dashboard',
      });
      if (!nextActive && activeWedding === wedding.id) {
        setActiveWedding('');
      }
    } catch (err) {
      // console.error('No se pudo actualizar el estado de la boda', err);
      toast.error(t('weddings.updateStatusError'));
    }
  };

  const handleSelectWedding = useCallback(
    (wedding) => {
      if (!wedding?.id) return;
      setActiveWedding(wedding.id);
      navigate(`/bodas/${wedding.id}`);
    },
    [navigate, setActiveWedding]
  );

  const handleResetFilters = useCallback(() => {
    setPortfolioFilters(defaultFilters);
  }, []);

  if (!weddingsReady) {
    return <p className="px-6 py-10 text-sm text-muted">Cargando bodas...</p>;
  }

  return (
    <PageWrapper>
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              + Crear nueva boda
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'portfolio' ? 'primary' : 'outline'}
              onClick={() => setViewMode('portfolio')}
            >
              Vista Portfolio
            </Button>
          </div>
        </div>
      <PageTabs value={viewMode} onChange={setViewMode} options={STATUS_TAB_OPTIONS} className="mb-4" />

      {viewMode === 'portfolio' ? (
        <div className="space-y-6">
          <MultiWeddingSummary
            totalWeddings={enrichedWeddings}
            filteredWeddings={filteredPortfolio}
            onSyncAll={handleBulkSync}
            syncing={bulkSyncing}
            onResetFilters={handleResetFilters}
          />
          <WeddingPortfolioTable
            weddings={filteredPortfolio}
            filters={portfolioFilters}
            onFiltersChange={setPortfolioFilters}
            onSyncWedding={handleSyncWedding}
            syncingIds={syncingIds}
            onSelectWedding={handleSelectWedding}
            ownerOptions={ownerOptions}
            plannerOptions={plannerOptions}
          />
        </div>
      ) : weddingsToShow.length === 0 ? (
        <p className="text-sm text-muted">
          {viewMode === 'archived'
            ? 'No hay bodas archivadas en este momento.'
            : 'Todavía no tienes bodas activas.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {weddingsToShow.map((wedding) => (
            <Card
              data-testid="planner-wedding-card"
              key={wedding.id}
              className="cursor-pointer hover:shadow-md transition-shadow flex flex-col justify-between"
              onClick={() => handleSelectWedding(wedding)}
            >
              <div className="space-y-2 relative">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-[color:var(--color-text)]">
                      {wedding.name || 'Boda sin nombre'}
                    </h2>
                    <p className="text-sm text-muted">
                      {(wedding.weddingDateValue && formatDate(wedding.weddingDateValue, 'short')) ||
                        wedding.weddingDate ||
                        'Fecha pendiente'}{' '}
                      · {wedding.location || 'Ubicación pendiente'}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      wedding.active !== false
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {wedding.active !== false ? 'Activa' : 'Archivada'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  className="absolute top-0 right-0 translate-y-10"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleToggleActive(wedding);
                  }}
                >
                  {wedding.active !== false ? 'Archivar' : 'Restaurar'}
                </Button>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progreso</span>
                  <span className="font-medium">{Number(wedding.progress) || 0}%</span>
                </div>
                <Progress value={Number(wedding.progress) || 0} className="h-2" />
              </div>
            </Card>
          ))}
        </div>
      )}

      <WeddingFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={crearBoda}
      />
    </PageWrapper>
  );
}
