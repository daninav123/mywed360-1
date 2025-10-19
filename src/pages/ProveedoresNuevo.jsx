import { Plus } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import ProveedorForm from '../components/proveedores/ProveedorForm';
import ServicesBoard from '../components/proveedores/ServicesBoard';
import WantedServicesModal from '../components/proveedores/WantedServicesModal';
import Modal from '../components/Modal';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageWrapper from '../components/PageWrapper';

import { useWedding } from '../context/WeddingContext';
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
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-body">Proveedor confirmado</h3>
          {confirmed.length ? (
            confirmed.map((prov) => (
              <Card key={prov.id} className="border border-soft bg-surface">
                <p className="text-sm font-medium text-body">{prov.name}</p>
                <p className="text-xs text-muted">{prov.status || 'Pendiente'} · {prov.service || card.label}</p>
                {prov.notes && <p className="mt-2 text-sm text-body/75">{prov.notes}</p>}
              </Card>
            ))
          ) : (
            <Card className="border border-dashed border-soft bg-surface/80">
              <p className="text-sm text-muted">Aún no hay proveedor confirmado para este servicio.</p>
            </Card>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-body">Candidatos registrados</h3>
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
  const { loading: aiLoading, error: aiSearchError, searchProviders } = useAISearch();

  const [showNewProviderForm, setShowNewProviderForm] = useState(false);
  const [newProviderInitial, setNewProviderInitial] = useState(null);
  const [showNeedsModal, setShowNeedsModal] = useState(false);
  const [showWantedModal, setShowWantedModal] = useState(false);
  const [wantedServices, setWantedServices] = useState([]);
  const [searchPanelCollapsed, setSearchPanelCollapsed] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [serviceModal, setServiceModal] = useState({ open: false, card: null });
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [searchDrawerQuery, setSearchDrawerQuery] = useState('');
  const [searchDrawerLoading, setSearchDrawerLoading] = useState(false);
  const [searchDrawerResult, setSearchDrawerResult] = useState(null);

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

  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const trimmed = searchInput.trim();
      setSearchTerm(trimmed);
      registerSearchQuery(trimmed);
    },
    [registerSearchQuery, searchInput, setSearchTerm]
  );

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setSearchTerm('');
  }, [setSearchTerm]);

  const handleOpenServiceModal = useCallback((card) => {
    setServiceModal({ open: true, card });
  }, []);

  const handleCloseServiceModal = useCallback(() => {
    setServiceModal({ open: false, card: null });
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
      } catch (err) {
        toast.error('No se pudieron guardar los servicios deseados.');
      }
      setShowWantedModal(false);
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
      <Button variant="outline" onClick={() => setShowNeedsModal(true)}>
        Panel de servicios
      </Button>
      <Button variant="outline" onClick={() => setShowWantedModal(true)}>
        Configurar servicios
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
      <PageWrapper title="Gestión de proveedores" actions={headerActions} className="mx-auto max-w-6xl space-y-8">
        {error && (
          <Card className="border border-danger bg-danger-soft text-danger">
            {error}
          </Card>
        )}

        {!searchPanelCollapsed ? (
          <section className="rounded-2xl border border-dashed border-soft bg-surface/95 p-6 space-y-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-body">Exploración y shortlist</h2>
                <p className="text-sm text-muted">
                  Explora proveedores, guarda ideas y revisa tus candidatos pendientes desde este panel.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSearchPanelCollapsed(true)}>
                Plegar exploración
              </Button>
            </div>

            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Buscar por proveedor, servicio o nota"
                    className="w-full rounded-md border border-soft bg-surface px-4 py-2 text-sm text-body shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
          </section>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setSearchPanelCollapsed(false)}
              className="px-4 py-2 text-sm font-medium rounded-full border border-soft bg-primary-soft text-primary transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Explorar proveedores
            </button>
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

      <Modal open={showNeedsModal} onClose={() => setShowNeedsModal(false)} title="Panel de servicios" size="full" className="max-w-6xl">
        <ServicesBoard
          proveedores={providers || []}
          onOpenSearch={(service) => {
            setSearchPanelCollapsed(false);
            if (service) {
              setSearchInput(service);
              setSearchTerm(service);
              registerSearchQuery(service);
            }
          }}
          onOpenNew={(service) => {
            setNewProviderInitial({ service: service || '' });
            setShowNewProviderForm(true);
          }}
          onOpenAI={(service) => {
            setSearchDrawerQuery(service || '');
            setSearchDrawerResult(null);
            setSearchDrawerOpen(true);
          }}
        />
      </Modal>

      <WantedServicesModal
        open={showWantedModal}
        onClose={() => setShowWantedModal(false)}
        value={wantedServices}
        onSave={handleSaveWantedServices}
      />

      <Modal
        open={searchDrawerOpen}
        onClose={() => {
          setSearchDrawerOpen(false);
          setSearchDrawerQuery('');
          setSearchDrawerResult(null);
        }}
        title="Buscar proveedor"
        size="lg"
      >
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const query = searchDrawerQuery.trim();
            if (!query) return;
            setSearchDrawerLoading(true);
            try {
              const results = await searchProviders(query);
              if (Array.isArray(results) && results.length) {
                setSearchDrawerResult(results[0]);
              } else {
                setSearchDrawerResult(null);
              }
            } catch (err) {
              toast.error('No se pudo completar la búsqueda.');
            } finally {
              setSearchDrawerLoading(false);
            }
          }}
          className="space-y-4"
        >
          <input
            type="search"
            value={searchDrawerQuery}
            onChange={(event) => setSearchDrawerQuery(event.target.value)}
            placeholder="Ej: Florista Barcelona 2500"
            className="w-full rounded-md border border-soft bg-surface px-4 py-2 text-sm text-body shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setSearchDrawerOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={aiLoading || searchDrawerLoading}>
              Buscar
            </Button>
          </div>
        </form>

        {aiSearchError && (
          <Card className="mt-4 border border-danger bg-danger-soft text-danger text-sm">
            {aiSearchError}
          </Card>
        )}

        {searchDrawerResult && (
          <Card className="mt-4 border border-soft bg-surface space-y-2">
            <h3 className="text-sm font-semibold text-body">{searchDrawerResult.name}</h3>
            <p className="text-xs text-muted">{searchDrawerResult.service || 'Servicio'}</p>
            {searchDrawerResult.snippet && (
              <p className="text-sm text-body/75">{searchDrawerResult.snippet}</p>
            )}
          </Card>
        )}
      </Modal>
    </>
  );
};

export default Proveedores;
