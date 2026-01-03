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
  Send,
  Zap,
  User,
  Mail,
  Moon,
  LogOut,
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { formatDate } from '../utils/formatUtils';
import useTranslations from '../hooks/useTranslations';

import DarkModeToggle from '../components/DarkModeToggle';
import LanguageSelector from '../components/ui/LanguageSelector';
import Nav from '../components/Nav';
import NotificationCenter from '../components/NotificationCenter';
import ProveedorForm from '../components/proveedores/ProveedorForm';
import ServicesBoard from '../components/proveedores/ServicesBoard';
import WantedServicesModal from '../components/proveedores/WantedServicesModal';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageWrapper from '../components/PageWrapper';

import { useWedding } from '../context/WeddingContext';
import useWeddingData from '../hooks/useWeddingData';
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
import BudgetDistribution from '../components/proveedores/BudgetDistribution';
import useFinance from '../hooks/useFinance';
import { normalizeBudgetCategoryKey } from '../utils/budgetCategories';
import { syncPaymentScheduleWithTransactions } from '../services/paymentScheduleService';
import { useFavorites } from '../contexts/FavoritesContext';
import { createQuoteRequest } from '../services/quoteRequestsService';
import { buildSupplierQuery } from '../utils/buildSupplierQuery';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004/api';

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
  '/assets/services/default.webp';

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
      <Card className="border border-dashed border-soft bg-[var(--color-surface-80)]">
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
              {item.notes && <p className="text-sm text-[color:var(--color-text-75)]">{item.notes}</p>}
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
                {prov.notes && <p className="mt-2 text-sm text-[color:var(--color-text-75)]">{prov.notes}</p>}
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
                {prov.notes && <p className="mt-2 text-sm text-[color:var(--color-text-75)]">{prov.notes}</p>}
              </Card>
            ))
          ) : (
            <Card className="border border-dashed border-soft bg-[var(--color-surface-80)]">
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
                {item.notes && <p className="mt-2 text-sm text-[color:var(--color-text-75)]">{item.notes}</p>}
              </Card>
            ))
          ) : (
            <Card className="border border-dashed border-soft bg-[var(--color-surface-80)]">
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
  const location = useLocation();
  const { activeWedding } = useWedding();
  const { currentUser, logout: logoutUnified } = useAuth();
  const [openUserMenu, setOpenUserMenu] = useState(false);
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
  const { info: weddingProfile } = useActiveWeddingInfo();
  const { 
    budget, 
    addBudgetCategory,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction
  } = useFinance();
  const { favorites, addFavorite, refreshFavorites, isFavorite } = useFavorites();
  const [isAutoFindingAll, setIsAutoFindingAll] = useState(false);
  const [isRequestingAllQuotes, setIsRequestingAllQuotes] = useState(false);
  
  // Estados para requisitos y diseño de boda (Info Boda)
  const [supplierRequirements, setSupplierRequirements] = useState({});
  const [weddingDesign, setWeddingDesign] = useState(null);
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
  const [showBudgetModal, setShowBudgetModal] = useState(false);
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
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'services' | 'budget'

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

  // Cargar supplierRequirements y weddingDesign desde Firestore
  useEffect(() => {
    if (!activeWedding) return;
    
    let cancelled = false;
    
    (async () => {
      try {
        const response = await fetch(`${API_URL}/wedding-info/${activeWedding}`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Error al cargar información de boda');
        }
        
        const data = await response.json();
        
        if (!cancelled && data) {
          // Cargar supplier requirements
          if (data.supplierRequirements) {
            setSupplierRequirements(data.supplierRequirements);
            console.log('✅ [AutoFind] Requisitos de proveedores cargados:', Object.keys(data.supplierRequirements).length, 'categorías');
          }
          
          // Cargar wedding design
          if (data.weddingDesign) {
            setWeddingDesign(data.weddingDesign);
            console.log('✅ [AutoFind] Diseño de boda cargado');
          }
        }
      } catch (error) {
        console.error('❌ [AutoFind] Error cargando datos de Info Boda:', error);
      }
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
    // Usar budget.categories como fuente de verdad para los servicios
    // Esto garantiza que solo se muestren servicios que tienen presupuesto asignado
    if (budget?.categories && Array.isArray(budget.categories) && budget.categories.length > 0) {
      return budget.categories
        .map((cat) => ({
          id: normalizeBudgetCategoryKey(cat.name),
          name: cat.name,
          amount: cat.amount,
        }))
        .filter((s) => s && s.name);
    }
    
    // Fallback: usar wantedServices solo si no hay categorías de presupuesto
    return (wantedServices || [])
      .map((s) => (typeof s === 'string' ? { id: s, name: s } : s))
      .filter((s) => s && (s.name || s.id));
  }, [budget?.categories, wantedServices]);

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

    // Solo añadir proveedores a servicios que existen en el presupuesto
    providersSource.forEach((prov) => {
      const label = prov.service || '';
      if (!label) return; // Ignorar proveedores sin servicio definido
      
      const key = normalizeServiceKey(label);
      // Solo procesar si la tarjeta ya existe (está en budget.categories)
      if (map.has(key)) {
        const card = map.get(key);
        card.providers.push(prov);
        if (!card.confirmed && isConfirmedStatus(prov.status)) {
          card.confirmed = prov;
        }
      }
    });

    // Solo añadir shortlist a servicios que existen en el presupuesto
    (shortlist || []).forEach((item) => {
      const label = item.service || '';
      if (!label) return; // Ignorar items sin servicio definido
      
      const key = normalizeServiceKey(label);
      // Solo procesar si la tarjeta ya existe (está en budget.categories)
      if (map.has(key)) {
        const card = map.get(key);
        card.shortlist.push(item);
      }
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
        const newProvider = await addProvider(providerData);
        
        // Sincronizar plan de pagos con transacciones si existe
        if (newProvider && providerData.paymentSchedule && Array.isArray(providerData.paymentSchedule) && providerData.paymentSchedule.length > 0) {
          console.log('[handleSubmitProvider] Sincronizando plan de pagos...');
          try {
            const syncResult = await syncPaymentScheduleWithTransactions(
              newProvider,
              transactions || [],
              { addTransaction, updateTransaction, deleteTransaction }
            );
            console.log('[handleSubmitProvider] Sincronización completada:', syncResult);
            toast.success(`✅ ${t('suppliers.overview.toasts.providerSaved')} - ${syncResult.created} pagos programados`);
          } catch (syncError) {
            console.error('[handleSubmitProvider] Error sincronizando:', syncError);
            toast.warning('⚠️ Proveedor guardado pero error al sincronizar pagos');
          }
        } else {
          toast.success(t('suppliers.overview.toasts.providerSaved'));
        }
        
        setShowNewProviderForm(false);
        setNewProviderInitial(null);
        loadProviders();
      } catch (err) {
        toast.error(t('suppliers.overview.toasts.providerError'));
      }
    },
    [addProvider, loadProviders, t, transactions, addTransaction, updateTransaction, deleteTransaction]
  );

  // Handler: Buscar automáticamente 3 proveedores por cada servicio activo
  const handleAutoFindAllServices = async () => {
    const activeServices = normalizedWanted || [];
    
    if (activeServices.length === 0) {
      toast.warning('No hay servicios activos en tu presupuesto');
      return;
    }

    // Obtener ubicación del perfil de boda
    const profile = (weddingProfile && (weddingProfile.weddingInfo || weddingProfile)) || {};
    const location =
      profile.celebrationPlace ||
      profile.location ||
      profile.city ||
      profile.ceremonyLocation ||
      profile.receptionVenue ||
      profile.destinationCity ||
      profile.country ||
      '';

    if (!location) {
      toast.warning('Configura la ubicación de tu boda en el perfil para usar esta función');
      return;
    }

    if (!confirm(`¿Buscar automáticamente hasta 10 proveedores nuevos para cada uno de los ${activeServices.length} servicios activos?\n\nEsto añadirá proveedores que aún no estén en favoritos.`)) {
      return;
    }

    setIsAutoFindingAll(true);
    let totalAdded = 0;
    let alreadyExists = 0;

    // Mapeo de categorías relacionadas para búsqueda
    const categoryAliases = {
      // Nuevas categorías granulares de música
      'musica-ceremonia': ['musica-ceremonia', 'musica'],
      'musica-cocktail': ['musica-cocktail', 'musica'],
      'musica-fiesta': ['musica-fiesta', 'musica'],
      'sonido-iluminacion': ['sonido-iluminacion', 'musica', 'dj', 'iluminacion'], // Empresas técnicas pueden estar en musica/dj/iluminacion antiguos
      'dj': ['dj', 'musica'],
      // Categorías antiguas (retrocompatibilidad)
      'musica': ['musica', 'dj', 'musica-ceremonia', 'musica-cocktail', 'musica-fiesta'],
      'iluminacion': ['iluminacion', 'sonido-iluminacion'],
    };

    try {
      for (const service of activeServices) {
        const categoryName = service.name || service.id;
        const categoryId = service.id;
        
        try {
          // 🎯 NUEVO: Construir query inteligente basado en requisitos del usuario
          const requirements = supplierRequirements[categoryId] || {};
          const smartQuery = buildSupplierQuery(categoryId, requirements, weddingDesign);
          
          console.log(`🔍 [AutoFind] Buscando proveedores de ${categoryName} (ID: ${categoryId})...`);
          console.log(`  📝 Query inteligente: "${smartQuery}"`);
          
          // Llamar con parámetros posicionales: service, location, query
          const searchResponse = await searchSuppliersHybrid(
            categoryName,  // service
            location,      // location
            smartQuery,    // ✨ query enriquecido con requisitos del usuario
            { limit: 50 }  // filters - aumentado para obtener más resultados
          );

          // searchSuppliersHybrid retorna objeto { success, suppliers: [...], count }
          let searchResults = searchResponse?.suppliers || [];
          console.log(`📦 [AutoFind] ${categoryName}: ${searchResults.length} resultados sin filtrar`);
          
          // Importar utilidad de normalización
          const { normalizeBudgetCategoryKey } = await import('../utils/budgetCategories');
          const normalizedServiceId = normalizeBudgetCategoryKey(service.id);
          
          // Obtener categorías aceptadas (incluye aliases)
          const acceptedCategories = categoryAliases[normalizedServiceId] || [normalizedServiceId];
          
          // Filtrar por categoría coincidente (incluyendo aliases y categorías alternativas)
          searchResults = searchResults.filter(supplier => {
            const supplierCategory = normalizeBudgetCategoryKey(supplier.category || supplier.categoryName || '');
            
            // 1. Verificar categoría principal
            let matches = acceptedCategories.includes(supplierCategory);
            
            // 2. Si no coincide, verificar categorías alternativas
            if (!matches && supplier.alternativeCategories && Array.isArray(supplier.alternativeCategories)) {
              matches = supplier.alternativeCategories.some(alt => {
                const altCat = normalizeBudgetCategoryKey(alt.category || alt.categoryName || '');
                return acceptedCategories.includes(altCat);
              });
              if (matches) {
                console.log(`  ✨ ${supplier.name}: Coincidencia por categoría alternativa!`);
              }
            }

            console.log(`  🔍 ${supplier.name}: ${supplier.category} → normalizado: ${supplierCategory} vs [${acceptedCategories.join(', ')}] = ${matches ? '✅' : '❌'}`);
            return matches;
          });
          
          console.log(`✅ [AutoFind] ${categoryName}: ${searchResults.length} resultados filtrados por categoría`);

          if (searchResults.length > 0) {
            // Filtrar proveedores que NO están ya en favoritos
            let newSuppliers = searchResults.filter(supplier => {
              const isAlreadyFavorite = isFavorite(supplier.id || supplier.slug);
              if (isAlreadyFavorite) {
                console.log(`  ⏭️ ${supplier.name}: Ya está en favoritos, omitiendo`);
                alreadyExists++;
              }
              return !isAlreadyFavorite;
            });
            
            // Aleatorizar para obtener variedad en cada búsqueda
            if (newSuppliers.length > 10) {
              newSuppliers = newSuppliers
                .sort(() => Math.random() - 0.5)
                .slice(0, 10);
              console.log(`  🎲 Aleatorizados ${newSuppliers.length} de ${searchResults.length} resultados`);
            } else {
              newSuppliers = newSuppliers.slice(0, 10);
            }
            
            if (newSuppliers.length > 0) {
              console.log(`📝 [AutoFind] Añadiendo ${newSuppliers.length} proveedores nuevos a favoritos...`);
              
              for (const supplier of newSuppliers) {
                try {
                  console.log(`➕ [AutoFind] Intentando añadir: ${supplier.name}`);
                  await addFavorite(supplier, `Auto-búsqueda: ${categoryName}`);
                  console.log(`✅ [AutoFind] ${supplier.name} añadido a favoritos`);
                  totalAdded++;
                } catch (error) {
                  // Silenciar errores de duplicados
                  if (error.message?.includes('Already Exists') || error.message?.includes('existe')) {
                    console.log(`  ⏭️ ${supplier.name}: Ya existe (detectado en catch)`);
                    alreadyExists++;
                  } else {
                    console.error(`❌ [AutoFind] Error añadiendo ${supplier.name}:`, error);
                  }
                }
              }
            } else {
              console.log(`  ℹ️ Todos los proveedores de ${categoryName} ya están en favoritos`);
            }
          } else {
            console.log(`⚠️ [AutoFind] No se encontraron proveedores de ${categoryName} después de filtrar`);
          }
        } catch (error) {
          console.error(`❌ [AutoFind] Error buscando proveedores de ${categoryName}:`, error);
        }
      }

      console.log(`📊 [AutoFind] Resumen:`);
      console.log(`  ✅ Añadidos: ${totalAdded}`);
      console.log(`  ⏭️ Ya existían: ${alreadyExists}`);

      if (totalAdded > 0) {
        toast.success(`✅ ${totalAdded} proveedores añadidos a favoritos`);
        await refreshFavorites(true);
      } else if (alreadyExists > 0) {
        toast.info(`ℹ️ ${alreadyExists} proveedores ya estaban en favoritos`);
      } else {
        toast.info('No se encontraron nuevos proveedores');
      }
    } catch (error) {
      console.error('[AutoFindAll] Error:', error);
      toast.error(`Error en búsqueda automática: ${error.message}`);
    } finally {
      setIsAutoFindingAll(false);
    }
  };

  // Handler: Solicitar presupuestos a TODOS los favoritos
  const handleRequestQuotesToAllFavorites = async () => {
    if (!favorites || favorites.length === 0) {
      toast.warning('No tienes proveedores en favoritos');
      return;
    }

    if (!confirm(`¿Enviar solicitud de presupuesto a TODOS los ${favorites.length} proveedores favoritos?\n\nSe creará una solicitud individual para cada proveedor.`)) {
      return;
    }

    setIsRequestingAllQuotes(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const fav of favorites) {
        const supplier = fav.supplier || {};
        
        try {
          await createQuoteRequest({
            supplierId: supplier.id || supplier.slug,
            supplierName: supplier.name,
            supplierEmail: supplier.contact?.email,
            category: supplier.category || supplier.service,
            service: supplier.category || supplier.service,
            message: `Solicitud de presupuesto`,
            urgent: false,
          });
          successCount++;
        } catch (error) {
          console.error(`Error enviando a ${supplier.name}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`✅ ${successCount} solicitudes enviadas correctamente`);
      }
      
      if (errorCount > 0) {
        toast.warning(`⚠️ ${errorCount} solicitudes fallaron`);
      }
    } catch (error) {
      console.error('[RequestAllQuotes] Error:', error);
      toast.error(`Error al enviar solicitudes: ${error.message}`);
    } finally {
      setIsRequestingAllQuotes(false);
    }
  };

  const headerActions = (
    <div className="flex gap-2">
      <Button
        onClick={handleAutoFindAllServices}
        variant="outline"
        disabled={isAutoFindingAll}
        leftIcon={isAutoFindingAll ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent" /> : <Sparkles className="h-4 w-4" />}
      >
        {isAutoFindingAll ? 'Buscando...' : '✨ Auto-buscar'}
      </Button>
      <Button
        onClick={handleRequestQuotesToAllFavorites}
        variant="outline"
        disabled={isRequestingAllQuotes || !favorites || favorites.length === 0}
        leftIcon={isRequestingAllQuotes ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent" /> : <Send className="h-4 w-4" />}
      >
        {isRequestingAllQuotes ? `Enviando...` : `📨 Solicitar a ${favorites?.length || 0}`}
      </Button>
      <Button
        onClick={() => setShowBudgetModal(true)}
        variant="outline"
        leftIcon={<DollarSign className="h-4 w-4" />}
      >
        {t('suppliers.overview.budget.viewSummary', { defaultValue: 'Presupuesto' })}
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
      <div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" style={{ backgroundColor: '#EDE8E0' }}>
        <div className="absolute top-4 right-4 flex items-center space-x-3" style={{ zIndex: 100 }}>
          <LanguageSelector variant="minimal" />
          <div className="relative" data-user-menu>
            <button onClick={() => setOpenUserMenu(!openUserMenu)} className="w-11 h-11 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center" title={t('navigation.userMenu', { defaultValue: 'Menú de usuario' })} style={{ backgroundColor: openUserMenu ? 'var(--color-lavender)' : 'rgba(255, 255, 255, 0.95)', border: `2px solid ${openUserMenu ? 'var(--color-primary)' : 'rgba(255,255,255,0.8)'}`, boxShadow: openUserMenu ? '0 4px 12px rgba(94, 187, 255, 0.3)' : '0 2px 8px rgba(0,0,0,0.15)' }}>
              <User className="w-5 h-5" style={{ color: openUserMenu ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
            </button>
            {openUserMenu && (
              <div className="absolute right-0 mt-3 bg-[var(--color-surface)] p-2 space-y-1" style={{ minWidth: '220px', border: '1px solid var(--color-border-soft)', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 9999 }}>
                <div className="px-2 py-1"><NotificationCenter /></div>
                <Link to="/perfil" onClick={() => setOpenUserMenu(false)} className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200 text-body" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <User className="w-4 h-4 mr-3" />{t('navigation.profile', { defaultValue: 'Perfil' })}
                </Link>
                <Link to="/email" onClick={() => setOpenUserMenu(false)} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200 text-body">
                  <Mail className="w-4 h-4 mr-3" />{t('navigation.emailInbox', { defaultValue: 'Buzón de Emails' })}
                </Link>
                <div className="px-3 py-2.5 rounded-xl transition-all duration-200" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <div className="flex items-center justify-between"><span className="text-sm flex items-center text-body"><Moon className="w-4 h-4 mr-3" />{t('navigation.darkMode', { defaultValue: 'Modo oscuro' })}</span><DarkModeToggle className="ml-2" /></div>
                </div>
                <div style={{ height: '1px', backgroundColor: 'var(--color-border-soft)', margin: '8px 0' }}></div>
                <button onClick={() => { logoutUnified(); setOpenUserMenu(false); }} className="w-full text-left px-3 py-2.5 text-sm rounded-xl transition-all duration-200 flex items-center" className="text-danger" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-danger-10)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <LogOut className="w-4 h-4 mr-3" />{t('navigation.logout', { defaultValue: 'Cerrar sesión' })}
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
          
          {/* Hero con degradado beige-dorado */}
          <header className="relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, #FFF4E6 0%, #F8EFE3 50%, #E8D5C4 100%)',
            padding: '48px 32px 32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div className="max-w-4xl mx-auto" style={{ textAlign: 'center' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '16px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '60px',
                  height: '1px',
                  background: 'linear-gradient(to right, transparent, #D4A574)',
                }} />
                <h1 style={{
                  fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
                  fontSize: '40px',
                  fontWeight: 400,
                  color: '#1F2937',
                  letterSpacing: '-0.01em',
                  margin: 0,
                }}>{t('suppliers.overview.title')}</h1>
                <div style={{
                  width: '60px',
                  height: '1px',
                  background: 'linear-gradient(to left, transparent, #D4A574)',
                }} />
              </div>
              
              {/* Subtítulo como tag uppercase */}
              <p style={{
                fontFamily: "'DM Sans', 'Inter', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 0,
              }}>Servicios de Boda</p>
            </div>
          </header>
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
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors rounded-md ${
                activeTab === 'services'
                  ? 'bg-[color:var(--color-primary)] text-white'
                  : 'text-body hover:bg-[var(--color-text-5)]'
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
            wedding={weddingProfile}
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
              try {
                // Verificar si la categoría existe en el presupuesto
                if (data.service && budget?.categories) {
                  const serviceKey = normalizeBudgetCategoryKey(data.service);
                  const categoryExists = budget.categories.some(
                    (cat) => normalizeBudgetCategoryKey(cat.name) === serviceKey
                  );
                  
                  // Si no existe, crear la categoría automáticamente
                  if (!categoryExists) {
                    const result = addBudgetCategory(data.service, 0);
                    if (result?.success) {
                      toast.info(`✨ Categoría "${data.service}" añadida automáticamente al presupuesto`);
                    }
                  }
                }
                
                const newProvider = await addProvider(data);
                
                // Sincronizar plan de pagos con transacciones si existe
                if (newProvider && data.paymentSchedule && Array.isArray(data.paymentSchedule) && data.paymentSchedule.length > 0) {
                  console.log('[Proveedores] Sincronizando plan de pagos con transacciones...');
                  try {
                    const syncResult = await syncPaymentScheduleWithTransactions(
                      newProvider,
                      transactions || [],
                      { addTransaction, updateTransaction, deleteTransaction }
                    );
                    console.log('[Proveedores] Sincronización completada:', syncResult);
                    toast.success(`✅ Plan de pagos sincronizado: ${syncResult.created} transacciones creadas`);
                  } catch (syncError) {
                    console.error('[Proveedores] Error sincronizando plan de pagos:', syncError);
                    toast.warning('⚠️ Proveedor creado pero hubo un problema al sincronizar el plan de pagos');
                  }
                }
                
                toast.success(`✅ Proveedor "${data.name}" añadido correctamente`);
                setShowNewProviderForm(false);
                setNewProviderInitial(null);
              } catch (error) {
                toast.error('Error al añadir proveedor');
              }
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

      {/* Modal de Resumen de Presupuesto */}
      {showBudgetModal && (
        <Modal
          open={showBudgetModal}
          onClose={() => setShowBudgetModal(false)}
          size="xl"
        >
          <div className="p-6">
            <h2 className="text-xl font-bold text-body mb-4">
              {t('suppliers.overview.budget.modalTitle', { defaultValue: 'Resumen de Presupuesto' })}
            </h2>
            <BudgetDistribution
              providers={providers}
              totalBudget={budget?.total || 0}
              budgetCategories={budget?.categories || []}
              onCategoryClick={(category) => {
                setShowBudgetModal(false);
                setSearchInput(category);
                setActiveTab('search');
              }}
            />
          </div>
        </Modal>
      )}

      {/* Barra flotante de comparación */}
      <CompareBar />
      </div>
      </div>
      {/* Bottom Navigation */}
      <Nav />
    </>
  );
}

export default Proveedores;
