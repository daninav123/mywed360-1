import { Plus, ChevronUp, Search, Users, CheckCircle, Clock, Sparkles, TrendingUp, Building2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { formatDate } from '../utils/formatUtils';

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

const ShortlistList = ({ items, loading, error }) => {
  if (loading) {
    return (
      <Card className="border border-soft bg-surface">
        <p className="text-sm text-muted">Cargando shortlist…</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-danger bg-danger-soft">
        <p className="text-sm text-danger">No se pudo cargar la shortlist.</p>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card className="border border-dashed border-soft bg-surface/80">
        <p className="text-sm text-muted">
          Guarda candidatos desde tus búsquedas o registros manuales para construir la shortlist inicial.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="border border-soft bg-surface">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-body">{item.name || 'Proveedor'}</p>
              <p className="text-xs text-muted">
                {item.service || 'Servicio'} · Guardado {formatShortDate(item.createdAt)}
              </p>
              {item.notes && <p className="text-sm text-body/75">{item.notes}</p>}
            </div>
            {item.match != null && (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                Match {Math.round(item.match)}
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

const ServiceOptionsModal = ({ open, card, onClose }) => {
  if (!open || !card) return null;

  const pendingCandidates = (card.providers || []).filter((prov) => !isConfirmedStatus(prov.status));
  const confirmed = card.confirmed ? [card.confirmed] : [];

  return (
    <Modal open={open} onClose={onClose} title={`Opciones guardadas · ${card.label}`} size="lg">
      <div className="space-y-6">
        {confirmed.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-body">Proveedor confirmado</h3>
            {confirmed.map((prov) => (
              <Card key={prov.id} className="border border-soft bg-surface">
                <p className="text-sm font-medium text-body">{prov.name}</p>
                <p className="text-xs text-muted">{prov.status || 'Pendiente'} · {prov.service || card.label}</p>
                {prov.notes && <p className="mt-2 text-sm text-body/75">{prov.notes}</p>}
              </Card>
            ))}
          </section>
        )}

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-body">Proveedores contactados</h3>
          {pendingCandidates.length ? (
            pendingCandidates.map((prov) => (
              <Card key={prov.id} className="border border-soft bg-surface">
                <p className="text-sm font-medium text-body">{prov.name}</p>
                <p className="text-xs text-muted">{prov.status || 'Pendiente'} · {prov.service || card.label}</p>
                {prov.notes && <p className="mt-2 text-sm text-body/75">{prov.notes}</p>}
              </Card>
            ))
          ) : (
            <Card className="border border-dashed border-soft bg-surface/80">
              <p className="text-sm text-muted">Sin candidatos registrados dentro de los proveedores actuales.</p>
            </Card>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-body">Shortlist</h3>
          {card.shortlist && card.shortlist.length ? (
            card.shortlist.map((item) => (
              <Card key={item.id} className="border border-soft bg-surface">
                <p className="text-sm font-medium text-body">{item.name || 'Proveedor'}</p>
                <p className="text-xs text-muted">Guardado {formatShortDate(item.createdAt)}</p>
                {item.notes && <p className="mt-2 text-sm text-body/75">{item.notes}</p>}
              </Card>
            ))
          ) : (
            <Card className="border border-dashed border-soft bg-surface/80">
              <p className="text-sm text-muted">Todavía no has guardado propuestas para este servicio.</p>
            </Card>
          )}
        </section>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const Proveedores = () => {
  const { providers, filteredProviders, loading, error, searchTerm, setSearchTerm, loadProviders, addProvider } =
    useProveedores();
  const { shortlist, loading: shortlistLoading, error: shortlistError } = useSupplierShortlist();
  const { activeWedding } = useWedding();
  const { info: weddingProfile } = useActiveWeddingInfo();
  // Sistema de búsqueda híbrido (prioriza BD propia)
  const [aiResults, setAiResults] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [searchBreakdown, setSearchBreakdown] = useState(null);
  
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
        const next = [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
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
      ensureCard('Servicios');
    } else {
      normalizedWanted.forEach((entry) => {
        ensureCard(entry.name || entry.id || 'Servicios');
      });
    }

    providersSource.forEach((prov) => {
      const label = prov.service || 'Otros';
      const card = ensureCard(label);
      card.providers.push(prov);
      if (!card.confirmed && isConfirmedStatus(prov.status)) {
        card.confirmed = prov;
      }
    });

    (shortlist || []).forEach((item) => {
      const label = item.service || 'Otros';
      const card = ensureCard(label);
      card.shortlist.push(item);
    });

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'es'));
  }, [normalizedWanted, providersSource, shortlist]);

  const performSearch = useCallback(
    async (rawQuery, { saveHistory = false, silent = false } = {}) => {
      const trimmed = (rawQuery || '').trim();
      const baseTokens = trimmed ? [trimmed] : [];
      const enrichedQuery = [...baseTokens, ...profileSearchTokens].join(' ').trim();

      if (!trimmed && !enrichedQuery) {
        if (!silent) toast.warn('Añade un término o completa tu perfil para mejorar las búsquedas.');
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
        const result = await searchSuppliersHybrid(
          trimmed, // service/category
          weddingProfile?.location || weddingProfile?.city || 'España', // location
          enrichedQuery || '', // query adicional
          weddingProfile?.budget, // budget
          {} // filters
        );
        
        console.log('🔍 [Hybrid Search] Resultados:', result);
        console.log('📊 Breakdown:', result.breakdown);
        
        setAiResults(result.suppliers || []);
        setSearchBreakdown(result.breakdown);
        
        if (result.count === 0 && !silent) {
          toast.info('No encontramos coincidencias. Intenta con otros términos de búsqueda.');
        } else if (result.count > 0) {
          toast.success(`✅ ${result.count} proveedores encontrados (${result.breakdown?.registered || 0} verificados, ${result.breakdown?.cached || 0} en caché, ${result.breakdown?.internet || 0} de internet)`);
        }
      } catch (err) {
        console.error('[Proveedores] Hybrid search failed', err);
        setAiError(err);
        if (!silent) toast.error('No se pudo completar la búsqueda.');
      } finally {
        setAiLoading(false);
      }
    },
    [profileSearchTokens, registerSearchQuery, setSearchTerm, weddingProfile]
  );

  const totalSearchPages = useMemo(() => {
    if (!aiResults.length) return 0;
    return Math.max(1, Math.ceil(aiResults.length / SEARCH_PAGE_SIZE));
  }, [aiResults]);

  const paginatedResults = useMemo(() => {
    if (!aiResults.length) return [];
    const start = (searchResultsPage - 1) * SEARCH_PAGE_SIZE;
    return aiResults.slice(start, start + SEARCH_PAGE_SIZE);
  }, [aiResults, searchResultsPage]);

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

  const handleSaveWantedServices = useCallback(
    async (list) => {
      setWantedServices(list);
      try {
        await saveData('wantedServices', list, {
          docPath: activeWedding ? `weddings/${activeWedding}` : undefined,
          showNotification: false,
        });
        toast.success('Servicios deseados actualizados.');
        setServicePanelView(null);
      } catch (err) {
        toast.error('No se pudieron guardar los servicios deseados.');
      }
    },
    [activeWedding]
  );

  const handleSubmitProvider = useCallback(
    async (providerData) => {
      try {
        await addProvider(providerData);
        toast.success('Proveedor guardado.');
        setShowNewProviderForm(false);
        setNewProviderInitial(null);
        loadProviders();
      } catch (err) {
        toast.error('No se pudo guardar el proveedor.');
      }
    },
    [addProvider, loadProviders]
  );

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => setServicePanelView('configure')}>
        Gestionar servicios
      </Button>
      <Button
        onClick={() => {
          setNewProviderInitial(null);
          setShowNewProviderForm(true);
        }}
        className="flex items-center gap-1"
      >
        <Plus size={16} /> Nuevo proveedor
      </Button>
    </div>
  );

  // Stats calculations
  const confirmedCount = useMemo(() => {
    return serviceCards.filter(card => card.confirmed).length;
  }, [serviceCards]);

  const pendingCount = useMemo(() => {
    return serviceCards.filter(card => !card.confirmed).length;
  }, [serviceCards]);

  const totalProviders = useMemo(() => {
    return (providers || []).length;
  }, [providers]);

  const shortlistTotal = useMemo(() => {
    return (shortlist || []).length;
  }, [shortlist]);

  return (
    <>
      <PageWrapper title="Gestión de proveedores" actions={headerActions} className="layout-container space-y-6">
        {error && (
          <Card className="border border-danger bg-danger-soft text-danger">
            {error}
          </Card>
        )}

        {/* Stats Cards Premium */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent border-[var(--color-primary)]/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-primary)] mb-1">
                  Total Proveedores
                </p>
                <p className="text-2xl font-black text-body">{totalProviders}</p>
              </div>
              <Building2 className="w-8 h-8 text-[color:var(--color-primary)]/40" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-[var(--color-success)]/10 to-transparent border-[var(--color-success)]/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-success)] mb-1">
                  Confirmados
                </p>
                <p className="text-2xl font-black text-[color:var(--color-success)]">{confirmedCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-[color:var(--color-success)]/40" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-[var(--color-warning)]/10 to-transparent border-[var(--color-warning)]/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-warning)] mb-1">
                  Pendientes
                </p>
                <p className="text-2xl font-black text-[color:var(--color-warning)]">{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-[color:var(--color-warning)]/40" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-[var(--color-accent)]/10 to-transparent border-[var(--color-accent)]/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-accent)] mb-1">
                  Shortlist
                </p>
                <p className="text-2xl font-black text-[color:var(--color-accent)]">{shortlistTotal}</p>
              </div>
              <Sparkles className="w-8 h-8 text-[color:var(--color-accent)]/40" />
            </div>
          </Card>
        </div>

        {!searchPanelCollapsed ? (
          <Card className="p-6 bg-[var(--color-surface)]/80 backdrop-blur-md border-soft shadow-lg">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[var(--color-primary)]/15">
                  <Search className="w-6 h-6 text-[color:var(--color-primary)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-body">Exploración y shortlist</h2>
                  <p className="text-sm text-muted">
                    Explora proveedores, guarda ideas y revisa tus candidatos pendientes
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Plegar exploración"
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
                      placeholder="Buscar por proveedor, servicio o nota"
                      className="pl-10"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="submit" size="sm" leftIcon={<Search size={16} />}>
                      Buscar
                    </Button>
                    {searchInput && (
                      <Button type="button" variant="outline" size="sm" onClick={handleClearSearch}>
                        Limpiar
                      </Button>
                    )}
                  </div>
                </div>
              </form>

              {searchHistory.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="font-medium text-body">Búsquedas recientes:</span>
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

              <ShortlistList items={shortlist} loading={shortlistLoading} error={shortlistError} />

              {(aiLoading || searchCompleted) && (
              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-body">Resultados de búsqueda</h3>
                    {searchResultsQuery && (
                      <p className="text-xs text-muted">Consulta: {searchResultsQuery}</p>
                    )}
                  </div>
                </div>

                {/* Mensaje de fallback eliminado - ya no se usa */}

                {aiLoading ? (
                  <Card className="border border-soft bg-surface text-sm text-muted">
                    Buscando proveedores…
                  </Card>
                ) : aiError ? (
                  <Card className="border border-danger bg-danger-soft text-sm text-danger">
                    {aiError?.message || 'No se pudo completar la búsqueda.'}
                  </Card>
                ) : aiResults.length === 0 ? (
                  <Card className="border border-dashed border-soft bg-surface/80 text-sm text-muted">
                    No encontramos resultados con los filtros actuales.
                  </Card>
                ) : (
                  <>
                    {/* Mostrar breakdown de resultados */}
                    {searchBreakdown && searchBreakdown.registered + searchBreakdown.cached + searchBreakdown.internet > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900 font-medium">
                          📊 Encontrados: {searchBreakdown.registered} verificados · {searchBreakdown.cached} en caché · {searchBreakdown.internet} de internet
                        </p>
                      </div>
                    )}
                    
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {paginatedResults.map((supplier) => (
                        <SupplierCard
                          key={supplier.id || supplier.slug || Math.random()}
                          supplier={supplier}
                          onContact={(s) => {
                            trackSupplierAction(s.id || s.slug, 'contact');
                            handleSelectSearchResult(s);
                          }}
                          onViewDetails={(s) => {
                            trackSupplierAction(s.id || s.slug, 'click');
                            handleSelectSearchResult(s);
                          }}
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
                          Anterior
                        </Button>
                        <span className="text-xs text-muted">
                          Página {searchResultsPage} de {totalSearchPages}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleNextSearchPage}
                          disabled={searchResultsPage === totalSearchPages}
                        >
                          Siguiente
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
              Explorar proveedores
            </Button>
          </div>
        )}

        <section className="space-y-5">
          <Card className="p-4 bg-[var(--color-surface)]/80 backdrop-blur-md border-soft">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--color-primary)]/10">
                <Users className="w-5 h-5 text-[color:var(--color-primary)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-body">Servicios por Categoría</h2>
                <p className="text-sm text-muted">
                  {serviceCards.length} servicio{serviceCards.length === 1 ? '' : 's'} · {confirmedCount} confirmado{confirmedCount === 1 ? '' : 's'} · {pendingCount} pendiente{pendingCount === 1 ? '' : 's'}
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {serviceCards.map((card) => {
              const isPending = !card.confirmed;
              const borderColor = isPending ? 'border-[var(--color-warning)]/40' : 'border-[var(--color-success)]/40';
              const gradientFrom = isPending ? 'from-[var(--color-warning)]/10' : 'from-[var(--color-success)]/10';
              
              return (
                <Card
                  key={card.key}
                  className={`relative overflow-hidden border-2 ${borderColor} bg-gradient-to-br ${gradientFrom} to-transparent backdrop-blur-sm transition-all duration-300 ${isPending ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-[var(--color-warning)]/60' : 'shadow-md'}`}
                  onClick={() => {
                    if (isPending) handleOpenServiceModal(card);
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-body mb-1">{card.label}</h3>
                        {isPending && card.shortlist.length > 0 && (
                          <p className="text-xs text-muted flex items-center gap-1">
                            <Sparkles size={12} />
                            {card.shortlist.length} opción{card.shortlist.length === 1 ? '' : 'es'} guardada{card.shortlist.length === 1 ? '' : 's'}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${isPending ? 'bg-[var(--color-warning)]/15 text-[color:var(--color-warning)]' : 'bg-[var(--color-success)]/15 text-[color:var(--color-success)]'}`}>
                        {isPending ? <Clock size={12} /> : <CheckCircle size={12} />}
                        {isPending ? 'Pendiente' : 'Confirmado'}
                      </span>
                    </div>
                    
                    {card.confirmed ? (
                      <div className="p-3 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/20">
                        <p className="font-semibold text-body mb-1">{card.confirmed.name}</p>
                        <p className="text-xs text-muted">{card.confirmed.status || 'Confirmado'}</p>
                      </div>
                    ) : (
                      <div className="text-sm text-muted">
                        <p className="mb-2">
                          {card.shortlist.length ? 'Revisa las opciones guardadas' : 'Sin opciones guardadas aún'}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-[color:var(--color-primary)]">
                          <TrendingUp size={12} />
                          <span>Clic para explorar</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </PageWrapper>

      <ServiceOptionsModal open={serviceModal.open} card={serviceModal.card} onClose={handleCloseServiceModal} />

      {showNewProviderForm && (
        <Modal open={showNewProviderForm} onClose={() => setShowNewProviderForm(false)} title="Nuevo proveedor" size="lg">
          <ProveedorForm
            initialData={newProviderInitial || undefined}
            onSubmit={handleSubmitProvider}
            onCancel={() => {
              setShowNewProviderForm(false);
              setNewProviderInitial(null);
            }}
          />
        </Modal>
      )}

      <Modal
        open={servicePanelView === 'board'}
        onClose={() => setServicePanelView(null)}
        title="Panel de servicios"
        size="full"
        className="max-w-6xl"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Revisa el estado de cada servicio y añade opciones directamente desde este panel.
          </p>
          <Button variant="outline" size="sm" onClick={() => setServicePanelView('configure')}>
            Configurar servicios deseados
          </Button>
        </div>
        <ServicesBoard
          proveedores={providers || []}
          onOpenSearch={(service) => {
            setSearchPanelCollapsed(false);
            if (service) {
              setSearchInput(service);
              setSearchTerm(service);
              registerSearchQuery(service);
              performSearch(service, { saveHistory: true });
            }
          }}
          onOpenNew={(service) => {
            setNewProviderInitial({ service: service || '' });
            setShowNewProviderForm(true);
          }}
          onOpenAI={(service) => {
            const base = service || '';
            setSearchInput(base);
            performSearch(base, { saveHistory: true });
          }}
        />
      </Modal>

      <WantedServicesModal
        open={servicePanelView === 'configure'}
        onClose={() => setServicePanelView(null)}
        value={wantedServices}
        onSave={handleSaveWantedServices}
      />

      <Modal
        open={searchDrawerOpen}
        onClose={() => {
          setSearchDrawerOpen(false);
          setSearchDrawerResult(null);
        }}
        title={
          searchDrawerResult?.name
            ? `Detalle del proveedor · ${searchDrawerResult.name}`
            : 'Detalle del proveedor'
        }
        size="lg"
      >
        {searchDrawerResult ? (
          <div className="space-y-4">
            <div className="h-48 w-full overflow-hidden rounded-lg">
              <img
                src={searchDrawerResult.image || DEFAULT_PROVIDER_IMAGE}
                alt={`Imagen de ${searchDrawerResult.name || 'proveedor'}`}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = DEFAULT_PROVIDER_IMAGE;
                }}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted">
                {searchDrawerResult.service || 'Servicio desconocido'}
              </p>
              {searchDrawerResult.location && (
                <p className="text-sm text-muted">Ubicación: {searchDrawerResult.location}</p>
              )}
              {searchDrawerResult.priceRange && (
                <p className="text-sm text-muted">Precio estimado: {searchDrawerResult.priceRange}</p>
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
              {searchDrawerResult.email && <p>Correo: {searchDrawerResult.email}</p>}
              {searchDrawerResult.phone && <p>Teléfono: {searchDrawerResult.phone}</p>}
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
                  Abrir enlace
                </Button>
              )}
              <Button type="button" onClick={() => setSearchDrawerOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <Card className="border border-soft bg-surface text-sm text-muted">
            Selecciona un proveedor de la lista para ver más detalles.
          </Card>
        )}
      </Modal>
    </>
  );
};

export default Proveedores;
