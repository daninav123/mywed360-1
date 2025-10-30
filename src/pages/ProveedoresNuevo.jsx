import {
  Plus,
  ChevronUp,
  Search,
  Users,
  CheckCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Building2,
  Heart,
  Camera,
  ArrowUpDown,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { formatDate } from '../utils/formatUtils';
import useTranslations from '../hooks/useTranslations';

import ProveedorForm from '../components/proveedores/ProveedorForm';
import ServicesBoard from '../components/proveedores/ServicesBoard';
import WantedServicesModal from '../components/proveedores/WantedServicesModal';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageWrapper from '../components/PageWrapper';

import { useWedding } from '../context/WeddingContext';
import useActiveWeddingInfo from '../hooks/useActiveWeddingInfo';
import useAISearch from '../hooks/useAISearch';
import useProveedores from '../hooks/useProveedores';
import useSupplierShortlist from '../hooks/useSupplierShortlist';
import { loadData, saveData } from '../services/SyncService';
import { searchSuppliersHybrid, trackSupplierAction } from '../services/suppliersService';
import SupplierCard from '../components/suppliers/SupplierCard';
import SmartFiltersBar from '../components/suppliers/SmartFiltersBar';
import FavoritesSection from '../components/suppliers/FavoritesSection';
import CompareBar from '../components/suppliers/CompareBar';
import RecommendedSuppliers from '../components/suppliers/RecommendedSuppliers';
import WeddingServicesOverview from '../components/wedding/WeddingServicesOverview';

const CONFIRMED_KEYWORDS = ['confirm', 'contrat', 'reserva', 'firm'];

const normalizeServiceKey = (value) => {
  if (!value) return 'otros';
  return String(value).trim().toLowerCase();
};

const formatShortDate = (value) => {
  if (!value) return '—';
  try {
    const date =
      typeof value?.toDate === 'function'
        ? value.toDate()
        : value instanceof Date
          ? value
          : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return formatDate(date, 'custom');
  } catch (err) {
    return '—';
  }
};

const isConfirmedStatus = (status) => {
  if (!status) return false;
  const normalized = String(status).trim().toLowerCase();
  if (!normalized) return false;
  return CONFIRMED_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

const SEARCH_PAGE_SIZE = 6;
const DEFAULT_PROVIDER_IMAGE =
  'https://images.unsplash.com/photo-1530023367847-a683933f4177?auto=format&fit=crop&w=800&q=60';

const ShortlistList = ({ items, loading, error, t }) => {
  if (loading) {
    return (
      <Card className="border border-soft bg-surface">
        <p className="text-sm text-muted">{t('common.suppliers.overview.shortlist.loading')}</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-danger bg-danger-soft">
        <p className="text-sm text-danger">{t('common.suppliers.overview.shortlist.error')}</p>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card className="border border-dashed border-soft bg-surface/80">
        <p className="text-sm text-muted">{t('common.suppliers.overview.shortlist.empty')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="border border-soft bg-surface">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-body">
                {item.name || t('common.suppliers.labels.provider')}
              </p>
              <p className="text-xs text-muted">
                {item.service || t('common.suppliers.labels.service')} ·{' '}
                {t('common.suppliers.overview.shortlist.savedAt', {
                  value: formatShortDate(item.createdAt),
                })}
              </p>
              {item.notes && <p className="text-sm text-body/75">{item.notes}</p>}
            </div>
            {item.match != null && (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                {t('common.suppliers.overview.shortlist.match', {
                  value: Math.round(item.match),
                })}
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

const ServiceOptionsModal = ({ open, card, onClose, t }) => {
  if (!open || !card) return null;

  const pendingCandidates = (card.providers || []).filter(
    (prov) => !isConfirmedStatus(prov.status)
  );
  const confirmed = card.confirmed ? [card.confirmed] : [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('common.suppliers.overview.modals.options.title', { label: card.label })}
      size="lg"
    >
      <div className="space-y-6">
        {confirmed.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-body">
              {t('common.suppliers.overview.modals.options.confirmedTitle')}
            </h3>
            {confirmed.map((prov) => (
              <Card key={prov.id} className="border border-soft bg-surface">
                <p className="text-sm font-medium text-body">{prov.name}</p>
                <p className="text-xs text-muted">
                  {prov.status && prov.status !== ''
                    ? prov.status
                    : t('common.suppliers.overview.status.pending')}{' '}
                  · {prov.service || card.label}
                </p>
                {prov.notes && <p className="mt-2 text-sm text-body/75">{prov.notes}</p>}
              </Card>
            ))}
          </section>
        )}

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-body">
            {t('common.suppliers.overview.modals.options.contactTitle')}
          </h3>
          {pendingCandidates.length ? (
            pendingCandidates.map((prov) => (
              <Card key={prov.id} className="border border-soft bg-surface">
                <p className="text-sm font-medium text-body">{prov.name}</p>
                <p className="text-xs text-muted">
                  {prov.status && prov.status !== ''
                    ? prov.status
                    : t('common.suppliers.overview.status.pending')}{' '}
                  · {prov.service || card.label}
                </p>
                {prov.notes && <p className="mt-2 text-sm text-body/75">{prov.notes}</p>}
              </Card>
            ))
          ) : (
            <Card className="border border-dashed border-soft bg-surface/80">
              <p className="text-sm text-muted">
                {t('common.suppliers.overview.modals.options.contactEmpty')}
              </p>
            </Card>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-body">
            {t('common.suppliers.overview.modals.options.shortlistTitle')}
          </h3>
          {card.shortlist && card.shortlist.length ? (
            card.shortlist.map((item) => (
              <Card key={item.id} className="border border-soft bg-surface">
                <p className="text-sm font-medium text-body">
                  {item.name || t('common.suppliers.labels.provider')}
                </p>
                <p className="text-xs text-muted">
                  {t('common.suppliers.overview.shortlist.savedAt', {
                    value: formatShortDate(item.createdAt),
                  })}
                </p>
                {item.notes && <p className="mt-2 text-sm text-body/75">{item.notes}</p>}
              </Card>
            ))
          ) : (
            <Card className="border border-dashed border-soft bg-surface/80">
              <p className="text-sm text-muted">
                {t('common.suppliers.overview.modals.options.shortlistEmpty')}
              </p>
            </Card>
          )}
        </section>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            {t('app.close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const Proveedores = () => {
  const { t, currentLanguage } = useTranslations();
  const {
    providers,
    filteredProviders,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    loadProviders,
    addProvider,
    updateProvider,
  } = useProveedores();
  const {
    shortlist,
    loading: shortlistLoading,
    error: shortlistError,
    addEntry: addToShortlist,
  } = useSupplierShortlist();
  const { activeWedding } = useWedding();
  const { info: weddingProfile } = useActiveWeddingInfo();
  // Sistema de búsqueda híbrido (prioriza BD propia)
  const [aiResults, setAiResults] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [searchBreakdown, setSearchBreakdown] = useState(null);
  const [searchMode, setSearchMode] = useState('auto'); // 'auto', 'database', 'internet'

  const clearAISearch = () => {
    setAiResults([]);
    setAiError(null);
    setSearchBreakdown(null);
  };

  const [showNewProviderForm, setShowNewProviderForm] = useState(false);
  const [newProviderInitial, setNewProviderInitial] = useState(null);
  const [servicePanelView, setServicePanelView] = useState(null);
  const [wantedServices, setWantedServices] = useState([]);
  const [searchPanelCollapsed, setSearchPanelCollapsed] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [serviceModal, setServiceModal] = useState({ open: false, card: null });
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [searchDrawerResult, setSearchDrawerResult] = useState(null);
  const [searchResultsQuery, setSearchResultsQuery] = useState('');
  const [searchResultsPage, setSearchResultsPage] = useState(1);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'favorites'

  // Estado para filtros inteligentes
  const [smartFilters, setSmartFilters] = useState(null);
  const [hasPortfolioFilter, setHasPortfolioFilter] = useState(false);
  const [sortBy, setSortBy] = useState('relevance'); // 'relevance', 'rating', 'price', 'reviews'

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadData('wantedServices', {
          docPath: activeWedding ? `weddings/${activeWedding}` : undefined,
          fallbackToLocal: true,
        });
        if (!cancelled && Array.isArray(data)) setWantedServices(data);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [activeWedding]);
  useEffect(() => {
    setSearchInput(searchTerm || '');
  }, [searchTerm]);

  const searchHistoryKey = useMemo(() => {
    if (activeWedding) return `suppliers_search_history_${activeWedding}`;
    return 'suppliers_search_history';
  }, [activeWedding]);

  useEffect(() => {
    try {
      const raw = searchHistoryKey ? localStorage.getItem(searchHistoryKey) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSearchHistory(parsed);
      }
    } catch {}
  }, [searchHistoryKey]);

  const profileSearchTokens = useMemo(() => {
    const profile = (weddingProfile && (weddingProfile.weddingInfo || weddingProfile)) || {};
    const tokens = [];
    const location =
      profile.celebrationPlace ||
      profile.location ||
      profile.city ||
      profile.ceremonyLocation ||
      profile.receptionVenue ||
      profile.destinationCity ||
      profile.country ||
      '';
    const style = profile.weddingStyle || profile.style || profile.preferences?.style || '';
    const guestCount =
      profile.guestCount || profile.guestEstimate || profile.expectedGuests || profile.guests || '';
    const budget =
      profile.budget || profile.estimatedBudget || profile.totalBudget || profile.presupuesto || '';
    if (location) tokens.push(location);
    if (style) tokens.push(`${style} style`);
    if (guestCount) tokens.push(`${guestCount} invitados`);
    if (budget) tokens.push(`presupuesto ${budget}`);
    return tokens.filter(Boolean);
  }, [weddingProfile]);

  const registerSearchQuery = useCallback(
    (query) => {
      if (!query) return;
      const trimmed = query.trim();
      if (!trimmed) return;
      setSearchHistory((prev) => {
        const next = [
          trimmed,
          ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
        ].slice(0, 6);
        try {
          if (searchHistoryKey) localStorage.setItem(searchHistoryKey, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [searchHistoryKey]
  );

  const normalizedWanted = useMemo(() => {
    return (wantedServices || [])
      .map((s) => (typeof s === 'string' ? { id: s, name: s } : s))
      .filter((s) => s && (s.name || s.id));
  }, [wantedServices]);

  const providersSource = useMemo(() => {
    if (searchTerm && filteredProviders) return filteredProviders;
    return providers || [];
  }, [providers, filteredProviders, searchTerm]);

  const serviceCards = useMemo(() => {
    const map = new Map();

    const ensureCard = (label) => {
      const key = normalizeServiceKey(label);
      if (!map.has(key)) {
        map.set(key, { key, label, providers: [], shortlist: [], confirmed: null });
      }
      return map.get(key);
    };

    if (normalizedWanted.length === 0) {
      ensureCard(t('common.suppliers.overview.defaults.serviceGroup'));
    } else {
      normalizedWanted.forEach((entry) => {
        ensureCard(entry.name || entry.id || t('common.suppliers.overview.defaults.serviceGroup'));
      });
    }

    providersSource.forEach((prov) => {
      const label = prov.service || t('common.suppliers.overview.defaults.otherService');
      const card = ensureCard(label);
      card.providers.push(prov);
      if (!card.confirmed && isConfirmedStatus(prov.status)) {
        card.confirmed = prov;
      }
    });

    (shortlist || []).forEach((item) => {
      const label = item.service || t('common.suppliers.overview.defaults.otherService');
      const card = ensureCard(label);
      card.shortlist.push(item);
    });

    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label, currentLanguage || 'es')
    );
  }, [currentLanguage, normalizedWanted, providersSource, shortlist, t]);

  const resolvedLocation = useMemo(() => {
    const profile = (weddingProfile && (weddingProfile.weddingInfo || weddingProfile)) || {};
    const candidates = [
      profile.location,
      profile.city,
      profile.celebrationPlace,
      profile.ceremonyLocation,
      profile.receptionVenue,
      profile.destinationCity,
      profile.country,
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;
      if (typeof candidate === 'string') {
        const trimmedValue = candidate.trim();
        if (trimmedValue) return trimmedValue;
      }
      if (typeof candidate === 'object') {
        const city = typeof candidate.city === 'string' ? candidate.city.trim() : '';
        if (city) return city;

        const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
        if (name) return name;
      }
    }

    return t('common.suppliers.overview.defaults.country');
  }, [t, weddingProfile]);

  const performSearch = useCallback(
    async (rawQuery, { saveHistory = false, silent = false } = {}) => {
      const trimmed = (rawQuery || '').trim();
      const baseTokens = trimmed ? [trimmed] : [];
      const enrichedQuery = [...baseTokens, ...profileSearchTokens].join(' ').trim();

      if (!trimmed && !enrichedQuery) {
        if (!silent) {
          toast.warn(t('common.suppliers.overview.toasts.missingQuery'));
        }
        return;
      }

      setSearchTerm(trimmed);
      if (trimmed && saveHistory) registerSearchQuery(trimmed);

      setSearchResultsQuery(trimmed || enrichedQuery);
      setSearchResultsPage(1);
      setSearchCompleted(true);
      setSearchDrawerOpen(false);
      setSearchDrawerResult(null);

      try {
        setAiLoading(true);
        setAiError(null);

        // Usar nuevo sistema híbrido (BD propia → bodas.net → internet)
        // Usar smartFilters si están disponibles, sino usar perfil
        const filters = {
          searchMode,
          budget: smartFilters?.budget ?? weddingProfile?.budget,
          guests: smartFilters?.guests ?? weddingProfile?.guestCount,
          style: smartFilters?.style ?? weddingProfile?.style,
        };

        const result = await searchSuppliersHybrid(
          trimmed, // service/category
          smartFilters?.location || resolvedLocation, // location (puede ser override)
          enrichedQuery || '', // query adicional
          filters.budget, // budget (puede ser override)
          filters // filters completos
        );

        console.log('🔍 [Hybrid Search] Resultados:', result);
        console.log('📊 Breakdown:', result.breakdown);

        setAiResults(result.suppliers || []);
        setSearchBreakdown(result.breakdown);

        if (result.count === 0 && !silent) {
          toast.info(t('common.suppliers.overview.toasts.noResults'));
        } else if (result.count > 0) {
          toast.success(
            t('common.suppliers.overview.toasts.success', {
              count: result.count,
              registered: result.breakdown?.registered || 0,
              cached: result.breakdown?.cached || 0,
              internet: result.breakdown?.internet || 0,
            })
          );
        }
      } catch (err) {
        console.error('[Proveedores] Hybrid search failed', err);
        setAiError(err);
        if (!silent) {
          toast.error(t('common.suppliers.overview.toasts.error'));
        }
      } finally {
        setAiLoading(false);
      }
    },
    [
      profileSearchTokens,
      registerSearchQuery,
      resolvedLocation,
      setSearchTerm,
      weddingProfile,
      searchMode,
      smartFilters,
      t,
    ]
  );

  const filteredResults = useMemo(() => {
    if (!aiResults.length) return [];

    // 1. Aplicar filtro de portfolio si está activado
    let results = hasPortfolioFilter
      ? aiResults.filter((supplier) => supplier.hasPortfolio && supplier.slug)
      : [...aiResults];

    // 2. Aplicar ordenamiento
    if (sortBy !== 'relevance') {
      results.sort((a, b) => {
        switch (sortBy) {
          case 'rating':
            // Mayor rating primero
            const ratingA = a.metrics?.rating || a.rating || 0;
            const ratingB = b.metrics?.rating || b.rating || 0;
            return ratingB - ratingA;

          case 'price':
            // Menor precio primero (contar € symbols)
            const priceA = (a.business?.priceRange || a.pricing?.priceRange || '').length;
            const priceB = (b.business?.priceRange || b.pricing?.priceRange || '').length;
            return priceA - priceB;

          case 'reviews':
            // Más reseñas primero
            const reviewsA = a.metrics?.reviewCount || 0;
            const reviewsB = b.metrics?.reviewCount || 0;
            return reviewsB - reviewsA;

          default:
            return 0;
        }
      });
    }

    return results;
  }, [aiResults, hasPortfolioFilter, sortBy]);

  const totalSearchPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredResults.length / SEARCH_PAGE_SIZE));
  }, [filteredResults]);

  const paginatedResults = useMemo(() => {
    if (!filteredResults.length) return [];
    const start = (searchResultsPage - 1) * SEARCH_PAGE_SIZE;
    return filteredResults.slice(start, start + SEARCH_PAGE_SIZE);
  }, [filteredResults, searchResultsPage]);

  useEffect(() => {
    if (!aiResults.length) {
      setSearchResultsPage(1);
      return;
    }
    if (searchResultsPage > totalSearchPages) {
      setSearchResultsPage(totalSearchPages);
    }
  }, [aiResults, searchResultsPage, totalSearchPages]);

  const handleSearchSubmit = useCallback(
    async (event) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      await performSearch(searchInput, { saveHistory: true });
    },
    [performSearch, searchInput]
  );

  const handlePrevSearchPage = useCallback(() => {
    setSearchResultsPage((prev) => Math.max(1, prev - 1));
  }, []);

  const handleNextSearchPage = useCallback(() => {
    setSearchResultsPage((prev) => Math.min(totalSearchPages || 1, prev + 1));
  }, [totalSearchPages]);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setSearchTerm('');
    clearAISearch();
    setSearchResultsQuery('');
    setSearchResultsPage(1);
    setSearchCompleted(false);
    setSearchDrawerOpen(false);
    setSearchDrawerResult(null);
  }, [clearAISearch, setSearchTerm]);

  const handleOpenServiceModal = useCallback((card) => {
    setServiceModal({ open: true, card });
  }, []);

  const handleCloseServiceModal = useCallback(() => {
    setServiceModal({ open: false, card: null });
  }, []);

  const handleSelectSearchResult = useCallback((result) => {
    if (!result) return;
    setSearchDrawerResult(result);
    setSearchDrawerOpen(true);
  }, []);

  // 🆕 Marcar proveedor como contratado
  const handleMarkAsConfirmed = useCallback(
    async (supplier) => {
      if (!supplier) return;

      try {
        // Verificar si el proveedor ya existe en nuestra base de datos
        const existingProvider = providers.find(
          (p) => p.email === supplier.contact?.email || p.name === supplier.name
        );

        if (existingProvider) {
          // Actualizar proveedor existente
          await updateProvider(existingProvider.id, {
            status: 'Confirmado',
            confirmedAt: new Date(),
          });

          toast.success(`✅ ${supplier.name} marcado como contratado`);
        } else {
          // Crear nuevo proveedor en la base de datos
          const newProviderData = {
            name: supplier.name,
            service: supplier.category || supplier.service || 'otros',
            contact: supplier.contact?.name || supplier.name,
            email: supplier.contact?.email || '',
            phone: supplier.contact?.phone || '',
            status: 'Confirmado',
            date: new Date().toISOString(),
            rating: supplier.metrics?.rating || 0,
            ratingCount: supplier.metrics?.reviewCount || 0,
            snippet: supplier.business?.description || '',
            link: supplier.contact?.website || '',
            image: supplier.media?.logo || '',
            isFavorite: false,
            confirmedAt: new Date(),
            source: 'search', // Indica que viene de búsqueda
            originalData: {
              supplierId: supplier.id || supplier.slug,
              registered: supplier.registered || false,
              priority: supplier.priority,
            },
          };

          await addProvider(newProviderData);
          toast.success(`✅ ${supplier.name} agregado y marcado como contratado`);
        }

        // Trackear la acción
        await trackSupplierAction(supplier.id || supplier.slug, 'confirm');

        // Agregar al shortlist si no está
        try {
          await addToShortlist({
            supplierId: supplier.id || supplier.slug,
            supplierName: supplier.name,
            service: supplier.category || supplier.service || 'otros',
            notes: `Contratado el ${new Date().toLocaleDateString()}`,
          });
        } catch (err) {
          console.log('[Shortlist] Ya existe o error:', err);
        }

        // Recargar proveedores
        loadProviders();
      } catch (error) {
        console.error('[MarkAsConfirmed] Error:', error);
        toast.error(`Error al marcar ${supplier.name} como contratado`);
      }
    },
    [providers, updateProvider, addProvider, addToShortlist, loadProviders]
  );

  const handleSaveWantedServices = useCallback(
    async (list) => {
      setWantedServices(list);
      try {
        await saveData('wantedServices', list, {
          docPath: activeWedding ? `weddings/${activeWedding}` : undefined,
          showNotification: false,
        });
        toast.success(t('common.suppliers.overview.toasts.wantedServicesSaved'));
        setServicePanelView(null);
      } catch (err) {
        toast.error(t('common.suppliers.overview.toasts.wantedServicesError'));
      }
    },
    [activeWedding, t]
  );

  const handleSubmitProvider = useCallback(
    async (providerData) => {
      try {
        await addProvider(providerData);
        toast.success(t('common.suppliers.overview.toasts.providerSaved'));
        setShowNewProviderForm(false);
        setNewProviderInitial(null);
        loadProviders();
      } catch (err) {
        toast.error(t('common.suppliers.overview.toasts.providerError'));
      }
    },
    [addProvider, loadProviders, t]
  );

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => setServicePanelView('configure')}>
        {t('common.suppliers.overview.actions.manageServices')}
      </Button>
      <Button
        onClick={() => {
          setNewProviderInitial(null);
          setShowNewProviderForm(true);
        }}
        className="flex items-center gap-1"
      >
        <Plus size={16} /> {t('common.suppliers.overview.actions.newSupplier')}
      </Button>
    </div>
  );

  // Stats calculations
  const confirmedCount = useMemo(() => {
    return serviceCards.filter((card) => card.confirmed).length;
  }, [serviceCards]);

  const pendingCount = useMemo(() => {
    return serviceCards.filter((card) => !card.confirmed).length;
  }, [serviceCards]);

  const totalProviders = useMemo(() => {
    return (providers || []).length;
  }, [providers]);

  const shortlistTotal = useMemo(() => {
    return (shortlist || []).length;
  }, [shortlist]);

  const servicesSummary = useMemo(
    () => ({
      services: t('common.suppliers.overview.services.count', { count: serviceCards.length }),
      confirmed: t('common.suppliers.overview.services.confirmedCount', { count: confirmedCount }),
      pending: t('common.suppliers.overview.services.pendingCount', { count: pendingCount }),
    }),
    [confirmedCount, pendingCount, serviceCards.length, t]
  );

  return (
    <>
      <PageWrapper
        title={t('common.suppliers.overview.title')}
        actions={headerActions}
        className="layout-container space-y-6"
      >
        {error && <Card className="border border-danger bg-danger-soft text-danger">{error}</Card>}

        {/* Tabs */}
        <Card className="p-1">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-muted hover:bg-surface'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Search className="h-5 w-5" />
                <span>Buscar Proveedores</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                activeTab === 'favorites'
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-muted hover:bg-surface'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Heart className="h-5 w-5" />
                <span>Mis Favoritos</span>
              </div>
            </button>
          </div>
        </Card>

        {/* Contenido según tab activo */}
        {activeTab === 'favorites' ? (
          <FavoritesSection />
        ) : (
          <>
            {!searchPanelCollapsed ? (
              <Card
                data-search-panel
                className="p-6 bg-[var(--color-surface)]/80 backdrop-blur-md border-soft shadow-lg"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-[var(--color-primary)]/15">
                      <Search className="w-6 h-6 text-[color:var(--color-primary)]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-body">
                        {t('common.suppliers.overview.exploration.title')}
                      </h2>
                      <p className="text-sm text-muted">
                        {t('common.suppliers.overview.exploration.subtitle')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t('common.suppliers.overview.exploration.collapseAria')}
                    onClick={() => setSearchPanelCollapsed(true)}
                    className="h-8 w-8 justify-center hover:bg-[var(--color-primary)]/10"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-6">
                  <form onSubmit={handleSearchSubmit} className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
                        <Input
                          type="search"
                          value={searchInput}
                          onChange={(event) => setSearchInput(event.target.value)}
                          placeholder={t('common.suppliers.overview.exploration.searchPlaceholder')}
                          className="pl-10"
                        />
                      </div>

                      {/* Selector de modo de búsqueda (DEBUG) */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-muted whitespace-nowrap">
                          {t('common.suppliers.overview.searchMode.label')}
                        </label>
                        <select
                          value={searchMode}
                          onChange={(e) => setSearchMode(e.target.value)}
                          className="px-3 py-1.5 text-sm border border-border rounded-md bg-surface text-body focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="auto">
                            {t('common.suppliers.overview.searchMode.auto')}
                          </option>
                          <option value="database">
                            {t('common.suppliers.overview.searchMode.database')}
                          </option>
                          <option value="internet">
                            {t('common.suppliers.overview.searchMode.internet')}
                          </option>
                        </select>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="submit" size="sm" leftIcon={<Search size={16} />}>
                          {t('app.search')}
                        </Button>
                        {searchInput && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleClearSearch}
                          >
                            {t('common.suppliers.overview.actions.clear')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </form>

                  {/* Smart Filters Bar */}
                  <SmartFiltersBar
                    weddingProfile={weddingProfile}
                    onFiltersChange={setSmartFilters}
                  />

                  {/* Filtros y Ordenamiento */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Filtro Con Portfolio */}
                    <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg flex-1">
                      <input
                        type="checkbox"
                        id="hasPortfolioFilter"
                        checked={hasPortfolioFilter}
                        onChange={(e) => setHasPortfolioFilter(e.target.checked)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label
                        htmlFor="hasPortfolioFilter"
                        className="flex items-center gap-2 text-sm font-medium text-purple-900 cursor-pointer"
                      >
                        <Camera size={16} />
                        Solo con portfolio
                      </label>
                      {hasPortfolioFilter && filteredResults.length > 0 && (
                        <span className="ml-auto text-xs text-purple-700">
                          {filteredResults.length}
                        </span>
                      )}
                    </div>

                    {/* Ordenar por */}
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <ArrowUpDown size={16} className="text-blue-900" />
                      <label
                        htmlFor="sortBy"
                        className="text-sm font-medium text-blue-900 whitespace-nowrap"
                      >
                        Ordenar:
                      </label>
                      <select
                        id="sortBy"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-blue-300 rounded-md bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="relevance">Relevancia</option>
                        <option value="rating">Rating ⭐</option>
                        <option value="price">Precio €</option>
                        <option value="reviews">Más reseñas</option>
                      </select>
                    </div>
                  </div>

                  {searchHistory.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className="font-medium text-body">
                        {t('common.suppliers.overview.exploration.recentSearches')}
                      </span>
                      {searchHistory.map((query) => (
                        <button
                          key={query}
                          type="button"
                          onClick={() => {
                            setSearchInput(query);
                            setSearchTerm(query);
                          }}
                          className="px-3 py-1.5 rounded-full border border-soft bg-surface hover:border-primary hover:text-primary hover:bg-[var(--color-primary)]/5 transition-all duration-200"
                        >
                          {query}
                        </button>
                      ))}
                    </div>
                  )}

                  <ShortlistList
                    items={shortlist}
                    loading={shortlistLoading}
                    error={shortlistError}
                    t={t}
                  />

                  {/* Recomendaciones IA - Solo mostrar si no hay búsqueda activa */}
                  {!aiLoading && !searchCompleted && <RecommendedSuppliers />}

                  {(aiLoading || searchCompleted) && (
                    <section className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold text-body">
                            {t('common.suppliers.overview.results.title')}
                          </h3>
                          {searchResultsQuery && (
                            <p className="text-xs text-muted">
                              {t('common.suppliers.overview.results.query', {
                                value: searchResultsQuery,
                              })}
                            </p>
                          )}
                        </div>

                        {/* Badges de estadísticas mejoradas */}
                        {!aiLoading && filteredResults.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Total de resultados */}
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              📊 {filteredResults.length}{' '}
                              {filteredResults.length === 1 ? 'resultado' : 'resultados'}
                            </span>

                            {/* Ordenamiento activo */}
                            {sortBy !== 'relevance' && (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                                {sortBy === 'rating' && '⭐ Por rating'}
                                {sortBy === 'price' && '€ Por precio'}
                                {sortBy === 'reviews' && '💬 Por reseñas'}
                              </span>
                            )}

                            {/* Filtro portfolio activo */}
                            {hasPortfolioFilter && (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                                📷 Con portfolio
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Mensaje de fallback eliminado - ya no se usa */}

                      {aiLoading ? (
                        <Card className="border border-soft bg-surface text-sm text-muted">
                          {t('common.suppliers.overview.results.loading')}
                        </Card>
                      ) : aiError ? (
                        <Card className="border border-danger bg-danger-soft text-sm text-danger">
                          {aiError?.message || t('common.suppliers.overview.toasts.error')}
                        </Card>
                      ) : aiResults.length === 0 ? (
                        <Card className="border border-dashed border-soft bg-surface/80 text-sm text-muted">
                          {t('common.suppliers.overview.results.empty')}
                        </Card>
                      ) : (
                        <>
                          {/* Mostrar breakdown de resultados + modo de búsqueda */}
                          {searchBreakdown &&
                            searchBreakdown.registered +
                              searchBreakdown.cached +
                              searchBreakdown.internet >
                              0 && (
                              <div className="mb-4 space-y-2">
                                {/* Indicador de modo de búsqueda activo */}
                                <div
                                  className={`p-2 border rounded-lg text-xs font-medium ${
                                    searchMode === 'database'
                                      ? 'bg-purple-50 border-purple-200 text-purple-900'
                                      : searchMode === 'internet'
                                        ? 'bg-orange-50 border-orange-200 text-orange-900'
                                        : 'bg-green-50 border-green-200 text-green-900'
                                  }`}
                                >
                                  {t('common.suppliers.overview.searchMode.indicator', {
                                    mode:
                                      searchMode === 'database'
                                        ? t('common.suppliers.overview.searchMode.database')
                                        : searchMode === 'internet'
                                          ? t('common.suppliers.overview.searchMode.internet')
                                          : t('common.suppliers.overview.searchMode.auto'),
                                  })}
                                </div>

                                {/* Breakdown de resultados */}
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <p className="text-sm text-blue-900 font-medium">
                                    {t('common.suppliers.overview.breakdown.title', {
                                      total:
                                        searchBreakdown.registered +
                                        searchBreakdown.cached +
                                        searchBreakdown.internet,
                                      registered: searchBreakdown.registered,
                                      cached: searchBreakdown.cached,
                                      internet: searchBreakdown.internet,
                                    })}
                                  </p>
                                </div>
                              </div>
                            )}

                          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {paginatedResults.map((supplier) => (
                              <SupplierCard
                                key={supplier.id || supplier.slug || Math.random()}
                                supplier={supplier}
                                onContact={(contactInfo) => {
                                  // contactInfo puede ser { method, supplier } o simplemente supplier
                                  const sup = contactInfo.supplier || contactInfo;
                                  trackSupplierAction(sup.id || sup.slug, 'contact', {
                                    method: contactInfo.method || 'unknown',
                                  });
                                }}
                                onViewDetails={(s) => {
                                  trackSupplierAction(s.id || s.slug, 'click');
                                  handleSelectSearchResult(s);
                                }}
                                onMarkAsConfirmed={handleMarkAsConfirmed}
                              />
                            ))}
                          </div>

                          {totalSearchPages > 1 && (
                            <div className="flex items-center justify-between gap-3 pt-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handlePrevSearchPage}
                                disabled={searchResultsPage === 1}
                              >
                                {t('app.previous')}
                              </Button>
                              <span className="text-xs text-muted">
                                {t('common.suppliers.overview.pagination.label', {
                                  current: searchResultsPage,
                                  total: totalSearchPages,
                                })}
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleNextSearchPage}
                                disabled={searchResultsPage === totalSearchPages}
                              >
                                {t('app.next')}
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </section>
                  )}
                </div>
              </Card>
            ) : (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setSearchPanelCollapsed(false)}
                >
                  {t('common.suppliers.overview.buttons.explore')}
                </Button>
              </div>
            )}

            {/* Servicios de tu boda - Vista general con progreso */}
            <div className="mt-6">
              <WeddingServicesOverview
                onSearch={(service) => {
                  // Cuando se hace click en "Buscar proveedores" de un servicio
                  setSearchInput(service);
                  setSearchPanelCollapsed(false);
                  // Scroll al panel de búsqueda
                  setTimeout(() => {
                    document.querySelector('[data-search-panel]')?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  }, 100);
                }}
              />
            </div>

            <Modal
              open={searchDrawerOpen}
              onClose={() => {
                setSearchDrawerOpen(false);
                setSearchDrawerResult(null);
              }}
              title={
                searchDrawerResult?.name
                  ? t('common.suppliers.overview.drawer.titleWithName', {
                      name: searchDrawerResult.name,
                    })
                  : t('common.suppliers.overview.drawer.title')
              }
              size="lg"
            >
              {searchDrawerResult ? (
                <div className="space-y-4">
                  <div className="h-48 w-full overflow-hidden rounded-lg">
                    <img
                      src={searchDrawerResult.image || DEFAULT_PROVIDER_IMAGE}
                      alt={t('common.suppliers.overview.drawer.imageAlt', {
                        name:
                          searchDrawerResult.name ||
                          t('common.suppliers.overview.drawer.fallbackName'),
                      })}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = DEFAULT_PROVIDER_IMAGE;
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted">
                      {searchDrawerResult.service ||
                        t('common.suppliers.overview.drawer.serviceUnknown')}
                    </p>
                    {searchDrawerResult.location && (
                      <p className="text-sm text-muted">
                        {t('common.suppliers.overview.drawer.location', {
                          value: searchDrawerResult.location,
                        })}
                      </p>
                    )}
                    {searchDrawerResult.priceRange && (
                      <p className="text-sm text-muted">
                        {t('common.suppliers.overview.drawer.priceRange', {
                          value: searchDrawerResult.priceRange,
                        })}
                      </p>
                    )}
                    {searchDrawerResult.aiSummary && (
                      <p className="text-sm text-body/75">{searchDrawerResult.aiSummary}</p>
                    )}
                    {searchDrawerResult.snippet && (
                      <p className="text-sm text-body/75">{searchDrawerResult.snippet}</p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {Array.isArray(searchDrawerResult.tags) &&
                        searchDrawerResult.tags.slice(0, 8).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-soft bg-surface px-2 py-0.5 text-xs text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-muted">
                    {searchDrawerResult.email && (
                      <p>
                        {t('common.suppliers.overview.drawer.email', {
                          value: searchDrawerResult.email,
                        })}
                      </p>
                    )}
                    {searchDrawerResult.phone && (
                      <p>
                        {t('common.suppliers.overview.drawer.phone', {
                          value: searchDrawerResult.phone,
                        })}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    {searchDrawerResult.link && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          window.open(searchDrawerResult.link, '_blank', 'noopener,noreferrer')
                        }
                      >
                        {t('common.suppliers.overview.drawer.openLink')}
                      </Button>
                    )}
                    <Button type="button" onClick={() => setSearchDrawerOpen(false)}>
                      {t('app.close')}
                    </Button>
                  </div>
                </div>
              ) : (
                <Card className="border border-soft bg-surface text-sm text-muted">
                  {t('common.suppliers.overview.drawer.empty')}
                </Card>
              )}
            </Modal>
          </>
        )}
      </PageWrapper>

      <ServiceOptionsModal
        open={serviceModal.open}
        card={serviceModal.card}
        onClose={handleCloseServiceModal}
        t={t}
      />

      {showNewProviderForm && (
        <Modal
          open={showNewProviderForm}
          onClose={() => {
            setShowNewProviderForm(false);
            setNewProviderInitial(null);
          }}
          size="xl"
        >
          <ProveedorForm
            initialData={newProviderInitial}
            onSubmit={async (data) => {
              await addProvider(data);
              setShowNewProviderForm(false);
              setNewProviderInitial(null);
            }}
            onCancel={() => {
              setShowNewProviderForm(false);
              setNewProviderInitial(null);
            }}
          />
        </Modal>
      )}

      <WantedServicesModal
        open={!!servicePanelView}
        onClose={() => setServicePanelView(null)}
        value={wantedServices}
        onSave={handleSaveWantedServices}
      />

      {/* Barra flotante de comparación */}
      <CompareBar />
    </>
  );
};

export default Proveedores;
