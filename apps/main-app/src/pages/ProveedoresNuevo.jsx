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
  DollarSign,
  Filter,
  Grid,
  List,
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
import FavoritesSection from '../components/suppliers/FavoritesSection';
import CompareBar from '../components/suppliers/CompareBar';
import MyServicesSection from '../components/suppliers/MyServicesSection';
import AdvancedFiltersModal from '../components/suppliers/AdvancedFiltersModal';
import SearchTabContent from '../components/suppliers/SearchTabContent';
import ServicesProgressBar from '../components/suppliers/ServicesProgressBar';

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
        <p className="text-sm text-muted">{t('suppliers.overview.shortlist.loading')}</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-danger bg-danger-soft">
        <p className="text-sm text-danger">{t('suppliers.overview.shortlist.error')}</p>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card className="border border-dashed border-soft bg-surface/80">
        <p className="text-sm text-muted">{t('suppliers.overview.shortlist.empty')}</p>
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
                {item.name || t('suppliers.labels.provider')}
              </p>
              <p className="text-xs text-muted">
                {item.service || t('suppliers.labels.service')} ·{' '}
                {t('suppliers.overview.shortlist.savedAt', {
                  value: formatShortDate(item.createdAt),
                })}
              </p>
              {item.notes && <p className="text-sm text-body/75">{item.notes}</p>}
            </div>
            {item.match != null && (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                {t('suppliers.overview.shortlist.match', {
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
      title={t('suppliers.overview.modals.options.title', { label: card.label })}
      size="lg"
    >
      <div className="space-y-6">
        {confirmed.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-body">
              {t('suppliers.overview.modals.options.confirmedTitle')}
            </h3>
            {confirmed.map((prov) => (
              <Card key={prov.id} className="border border-soft bg-surface">
                <p className="text-sm font-medium text-body">{prov.name}</p>
                <p className="text-xs text-muted">
                  {prov.status && prov.status !== ''
                    ? prov.status
                    : t('suppliers.overview.status.pending')}{' '}
                  · {prov.service || card.label}
                </p>
                {prov.notes && <p className="mt-2 text-sm text-body/75">{prov.notes}</p>}
              </Card>
            ))}
          </section>
        )}

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-body">
            {t('suppliers.overview.modals.options.contactTitle')}
          </h3>
          {pendingCandidates.length ? (
            pendingCandidates.map((prov) => (
              <Card key={prov.id} className="border border-soft bg-surface">
                <p className="text-sm font-medium text-body">{prov.name}</p>
                <p className="text-xs text-muted">
                  {prov.status && prov.status !== ''
                    ? prov.status
                    : t('suppliers.overview.status.pending')}{' '}
                  · {prov.service || card.label}
                </p>
                {prov.notes && <p className="mt-2 text-sm text-body/75">{prov.notes}</p>}
              </Card>
            ))
          ) : (
            <Card className="border border-dashed border-soft bg-surface/80">
              <p className="text-sm text-muted">
                {t('suppliers.overview.modals.options.contactEmpty')}
              </p>
            </Card>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-body">
            {t('suppliers.overview.modals.options.shortlistTitle')}
          </h3>
          {card.shortlist && card.shortlist.length ? (
            card.shortlist.map((item) => (
              <Card key={item.id} className="border border-soft bg-surface">
                <p className="text-sm font-medium text-body">
                  {item.name || t('suppliers.labels.provider')}
                </p>
                <p className="text-xs text-muted">
                  {t('suppliers.overview.shortlist.savedAt', {
                    value: formatShortDate(item.createdAt),
                  })}
                </p>
                {item.notes && <p className="mt-2 text-sm text-body/75">{item.notes}</p>}
              </Card>
            ))
          ) : (
            <Card className="border border-dashed border-soft bg-surface/80">
              <p className="text-sm text-muted">
                {t('suppliers.overview.modals.options.shortlistEmpty')}
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
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'services'

  // Estado para filtros avanzados
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [hasPortfolioFilter, setHasPortfolioFilter] = useState(false);
  const [sortBy, setSortBy] = useState('relevance'); // 'relevance', 'rating', 'price', 'reviews'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

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
      ensureCard(t('suppliers.overview.defaults.serviceGroup'));
    } else {
      normalizedWanted.forEach((entry) => {
        ensureCard(entry.name || entry.id || t('suppliers.overview.defaults.serviceGroup'));
      });
    }

    providersSource.forEach((prov) => {
      const label = prov.service || t('suppliers.overview.defaults.otherService');
      const card = ensureCard(label);
      card.providers.push(prov);
      if (!card.confirmed && isConfirmedStatus(prov.status)) {
        card.confirmed = prov;
      }
    });

    (shortlist || []).forEach((item) => {
      const label = item.service || t('suppliers.overview.defaults.otherService');
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

    return t('suppliers.overview.defaults.country');
  }, [t, weddingProfile]);

  const performSearch = useCallback(
    async (rawQuery, { saveHistory = false, silent = false } = {}) => {
      const trimmed = (rawQuery || '').trim();
      const baseTokens = trimmed ? [trimmed] : [];
      const enrichedQuery = [...baseTokens, ...profileSearchTokens].join(' ').trim();

      if (!trimmed && !enrichedQuery) {
        if (!silent) {
          toast.warn(t('suppliers.overview.toasts.missingQuery'));
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

        // Usar nuevo sistema híbrido con filtros avanzados
        const filters = {
          searchMode,
          budget: advancedFilters?.budget ?? weddingProfile?.budget,
          guests: advancedFilters?.guests ?? weddingProfile?.guestCount,
          style: advancedFilters?.style ?? weddingProfile?.style,
          rating: advancedFilters?.rating ?? 0,
          priceRange: advancedFilters?.priceRange ?? '',
        };

        const result = await searchSuppliersHybrid(
          trimmed, // service/category
          advancedFilters?.location || resolvedLocation, // location
          enrichedQuery || '', // query adicional
          filters.budget, // budget
          filters // filters completos
        );

        // console.log('🔍 [Hybrid Search] Resultados:', result);
        // console.log('📊 Breakdown:', result.breakdown);

        setAiResults(result.suppliers || []);
        setSearchBreakdown(result.breakdown);

        if (result.count === 0 && !silent) {
          toast.info(t('suppliers.overview.toasts.noResults'));
        } else if (result.count > 0) {
          toast.success(
            t('suppliers.overview.toasts.success', {
              count: result.count,
              registered: result.breakdown?.registered || 0,
              cached: result.breakdown?.cached || 0,
              internet: result.breakdown?.internet || 0,
            })
          );
        }
      } catch (err) {
        // console.error('[Proveedores] Hybrid search failed', err);
        setAiError(err);
        if (!silent) {
          toast.error(t('suppliers.overview.toasts.error'));
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
      advancedFilters,
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
          // console.log('[Shortlist] Ya existe o error:', err);
        }

        // Recargar proveedores
        loadProviders();
      } catch (error) {
        // console.error('[MarkAsConfirmed] Error:', error);
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
        toast.success(t('suppliers.overview.toasts.wantedServicesSaved'));
        setServicePanelView(null);
      } catch (err) {
        toast.error(t('suppliers.overview.toasts.wantedServicesError'));
      }
    },
    [activeWedding, t]
  );

  const handleSubmitProvider = useCallback(
    async (providerData) => {
      try {
        await addProvider(providerData);
        toast.success(t('suppliers.overview.toasts.providerSaved'));
        setShowNewProviderForm(false);
        setNewProviderInitial(null);
        loadProviders();
      } catch (err) {
        toast.error(t('suppliers.overview.toasts.providerError'));
      }
    },
    [addProvider, loadProviders, t]
  );

  const headerActions = null; // Botón movido a cada servicio individual

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
      services: t('suppliers.overview.services.count', { count: serviceCards.length }),
      confirmed: t('suppliers.overview.services.confirmedCount', { count: confirmedCount }),
      pending: t('suppliers.overview.services.pendingCount', { count: pendingCount }),
    }),
    [confirmedCount, pendingCount, serviceCards.length, t]
  );

  // Contador de filtros activos
  const activeFiltersCount = useMemo(() => {
    return Object.values(advancedFilters).filter((v) => {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'number') return v > 0;
      if (typeof v === 'string') return v.trim() !== '';
      return false;
    }).length;
  }, [advancedFilters]);

  // Handler para aplicar filtros
  const handleApplyFilters = useCallback(
    (filters) => {
      setAdvancedFilters(filters);
      setHasPortfolioFilter(filters.hasPortfolio || false);
      // Si hay una búsqueda activa, re-ejecutarla con los nuevos filtros
      if (searchInput) {
        performSearch(searchInput, { saveHistory: false, silent: true });
      }
    },
    [searchInput, performSearch]
  );

  // Handler para buscar un servicio específico desde "Mis Servicios"
  const handleSearchService = useCallback(
    (serviceName) => {
      setSearchInput(serviceName);
      setActiveTab('search');
      setTimeout(() => {
        performSearch(serviceName, { saveHistory: true });
      }, 100);
    },
    [performSearch]
  );

  // Handler para añadir proveedor manual con servicio pre-seleccionado
  const handleAddManualProvider = useCallback((serviceName) => {
    setNewProviderInitial({ service: serviceName });
    setShowNewProviderForm(true);
  }, []);

  return (
    <>
      <PageWrapper
        title={t('suppliers.overview.title')}
        actions={headerActions}
        className="layout-container space-y-6"
      >
        {error && <Card className="border border-danger bg-danger-soft text-danger">{error}</Card>}

        {/* Barra de Progreso - Siempre visible */}
        <ServicesProgressBar serviceCards={serviceCards} />

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
              onClick={() => setActiveTab('services')}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                activeTab === 'services'
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-muted hover:bg-surface'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Building2 className="h-5 w-5" />
                <span>Mis Servicios</span>
              </div>
            </button>
          </div>
        </Card>

        {/* Contenido según tab activo */}
        {activeTab === 'services' ? (
          <MyServicesSection
            serviceCards={serviceCards}
            onSearchService={handleSearchService}
            onAddManualProvider={handleAddManualProvider}
            onViewFavorites={() => setActiveTab('search')}
            loading={loading}
          />
        ) : (
          <SearchTabContent
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            handleSearchSubmit={handleSearchSubmit}
            handleClearSearch={handleClearSearch}
            onOpenFilters={() => setShowFiltersModal(true)}
            activeFiltersCount={activeFiltersCount}
            aiLoading={aiLoading}
            aiError={aiError}
            searchCompleted={searchCompleted}
            filteredResults={filteredResults}
            paginatedResults={paginatedResults}
            searchResultsPage={searchResultsPage}
            totalSearchPages={totalSearchPages}
            handlePrevSearchPage={handlePrevSearchPage}
            handleNextSearchPage={handleNextSearchPage}
            sortBy={sortBy}
            setSortBy={setSortBy}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onViewDetails={handleSelectSearchResult}
            onContact={(contactInfo) => {
              const sup = contactInfo.supplier || contactInfo;
              trackSupplierAction(sup.id || sup.slug, 'contact', {
                method: contactInfo.method || 'unknown',
              });
            }}
            onMarkAsConfirmed={handleMarkAsConfirmed}
            t={t}
          />
        )}

        {/* Modal de Filtros Avanzados */}
        <AdvancedFiltersModal
          open={showFiltersModal}
          onClose={() => setShowFiltersModal(false)}
          onApply={handleApplyFilters}
          initialFilters={advancedFilters}
        />
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
