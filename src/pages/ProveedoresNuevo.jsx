import { Plus, ChevronUp } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

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
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
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
  const { searchProviders } = useAISearch();

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
  const [searchResults, setSearchResults] = useState([]);
  const [searchResultsQuery, setSearchResultsQuery] = useState('');
  const [searchResultsPage, setSearchResultsPage] = useState(1);
  const [searchResultsLoading, setSearchResultsLoading] = useState(false);
  const [searchResultsError, setSearchResultsError] = useState(null);
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

      setSearchResultsLoading(true);
      setSearchResultsError(null);
      setSearchResults([]);
      setSearchResultsQuery(trimmed || enrichedQuery);
      setSearchResultsPage(1);
      setSearchCompleted(true);
      setSearchDrawerOpen(false);
      setSearchDrawerResult(null);

      try {
        const results = await searchProviders(enrichedQuery || trimmed);
        const safeResults = Array.isArray(results) ? results : [];
        setSearchResults(safeResults);
        if (!safeResults.length && !silent) {
          toast.info('No encontramos coincidencias directas. Ajusta la búsqueda o actualiza tu perfil.');
        }
      } catch (err) {
        console.warn('[Proveedores] searchProviders failed', err);
        setSearchResultsError(err);
        if (!silent) toast.error('No se pudo completar la búsqueda.');
      } finally {
        setSearchResultsLoading(false);
      }
    },
    [profileSearchTokens, registerSearchQuery, searchProviders, setSearchTerm]
  );

  const totalSearchPages = useMemo(() => {
    if (!searchResults.length) return 0;
    return Math.max(1, Math.ceil(searchResults.length / SEARCH_PAGE_SIZE));
  }, [searchResults]);

  const paginatedResults = useMemo(() => {
    if (!searchResults.length) return [];
    const start = (searchResultsPage - 1) * SEARCH_PAGE_SIZE;
    return searchResults.slice(start, start + SEARCH_PAGE_SIZE);
  }, [searchResults, searchResultsPage]);

  useEffect(() => {
    if (!searchResults.length) {
      setSearchResultsPage(1);
      return;
    }
    if (searchResultsPage > totalSearchPages) {
      setSearchResultsPage(totalSearchPages);
    }
  }, [searchResults, searchResultsPage, totalSearchPages]);

  const handleSearchSubmit = useCallback(
    async (event) => {
      event.preventDefault();
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
    setSearchResults([]);
    setSearchResultsQuery('');
    setSearchResultsPage(1);
    setSearchResultsError(null);
    setSearchResultsLoading(false);
    setSearchCompleted(false);
    setSearchDrawerOpen(false);
    setSearchDrawerResult(null);
    setResultsUsedFallback(false);
  }, [setSearchTerm]);

  const handleOpenServiceModal = useCallback((card) => {
    setServiceModal({ open: true, card });
  }, []);

  const handleCloseServiceModal = useCallback(() => {
    setServiceModal({ open: false, card: null });
  }, []);

  const handleSelectSearchResult = useCallback(
    (result) => {
      if (!result) return;
      setSearchDrawerResult(result);      setSearchDrawerOpen(true);
    },
    [searchResultsQuery]
  );

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

  return (
    <>
      <PageWrapper title="Gestión de proveedores" actions={headerActions} className="layout-container space-y-8">
        {error && (
          <Card className="border border-danger bg-danger-soft text-danger">
            {error}
          </Card>
        )}

        {!searchPanelCollapsed ? (
          <Card className="space-y-6 border-dashed border-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-body">Exploración y shortlist</h2>
                <p className="text-sm text-muted">
                  Explora proveedores, guarda ideas y revisa tus candidatos pendientes desde este panel.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Plegar exploración"
                onClick={() => setSearchPanelCollapsed(true)}
                className="h-8 w-8 justify-center"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Input
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Buscar por proveedor, servicio o nota"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="submit" size="sm">
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
                    className="px-2 py-1 rounded-full border border-soft bg-surface hover:border-primary hover:text-primary"
                  >
                    {query}
                  </button>
                ))}
              </div>
            )}

            <ShortlistList items={shortlist} loading={shortlistLoading} error={shortlistError} />

            {(searchResultsLoading || searchCompleted) && (
              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-body">Resultados de búsqueda</h3>
                    {searchResultsQuery && (
                      <p className="text-xs text-muted">Consulta: {searchResultsQuery}</p>
                    )}
                  </div>
                </div>

                {resultsUsedFallback && !searchResultsLoading && !searchResultsError && searchResults.length > 0 && (
                  <Card className="border border-soft bg-primary-soft/20 text-xs text-primary">
                    Mostramos sugerencias de referencia porque la búsqueda en vivo no respondió.
                  </Card>
                )}

                {searchResultsLoading ? (
                  <Card className="border border-soft bg-surface text-sm text-muted">
                    Buscando proveedores…
                  </Card>
                ) : searchResultsError ? (
                  <Card className="border border-danger bg-danger-soft text-sm text-danger">
                    {searchResultsError?.message || 'No se pudo completar la búsqueda.'}
                  </Card>
                ) : searchResults.length === 0 ? (
                  <Card className="border border-dashed border-soft bg-surface/80 text-sm text-muted">
                    No encontramos resultados con los filtros actuales.
                  </Card>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {paginatedResults.map((result) => (
                        <Card
                          key={result.id}
                          className="border border-soft bg-surface overflow-hidden flex flex-col gap-3"
                        >
                          <div className="h-36 w-full overflow-hidden rounded-md">
                            <img
                              src={result.image || DEFAULT_PROVIDER_IMAGE}
                              alt={`Imagen de ${result.name || 'proveedor'}`}
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.src = DEFAULT_PROVIDER_IMAGE;
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-base font-semibold text-body">{result.name || 'Proveedor sugerido'}</h4>
                                <p className="text-xs text-muted">{result.service || 'Servicio'}</p>
                              </div>
                              {result.match != null && (
                                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                                  Match {Math.round(result.match)}
                                </span>
                              )}
                            </div>
                            {result.location && (
                              <p className="text-xs text-muted">Ubicación · {result.location}</p>
                            )}
                            {result.priceRange && (
                              <p className="text-xs text-muted">Precio estimado · {result.priceRange}</p>
                            )}
                            {result.snippet && (
                              <p className="text-sm text-body/75">{result.snippet}</p>
                            )}
                          </div>
                          <div className="mt-auto flex items-center justify-between gap-3">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleSelectSearchResult(result)}
                            >
                              Ver detalles
                            </Button>
                            {result.source && (
                              <span className="text-[10px] uppercase tracking-wide text-muted">
                                {result.source}
                              </span>
                            )}
                          </div>
                        </Card>
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
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-body">Servicios</h2>
            <p className="text-sm text-muted">
              Revisa qué servicios ya tienen proveedor confirmado y cuáles siguen pendientes. Las tarjetas semitransparentes indican que aún debes seleccionar opción.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {serviceCards.map((card) => {
              const isPending = !card.confirmed;
              return (
                <Card
                  key={card.key}
                  className={`border ${isPending ? 'border-dashed border-soft bg-surface/80 cursor-pointer hover:border-primary/60' : 'border-soft bg-surface'} transition`}
                  onClick={() => {
                    if (isPending) handleOpenServiceModal(card);
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold text-body">{card.label}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isPending ? 'bg-warning-soft text-warning border border-warning/40' : 'bg-success-soft text-success border border-success/40'}`}>
                        {isPending ? 'Pendiente' : 'Confirmado'}
                      </span>
                    </div>
                    {card.confirmed ? (
                      <div className="text-sm text-body/85 space-y-1">
                        <p className="font-medium">{card.confirmed.name}</p>
                        <p className="text-xs text-muted">{card.confirmed.status || 'Confirmado'}</p>
                      </div>
                    ) : (
                      <div className="text-sm text-muted space-y-1">
                        <p>{card.shortlist.length ? `${card.shortlist.length} opción${card.shortlist.length === 1 ? '' : 'es'} guardadas` : 'Sin shortlist aún'}</p>
                        <p>Haz clic para revisar las opciones disponibles.</p>
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









