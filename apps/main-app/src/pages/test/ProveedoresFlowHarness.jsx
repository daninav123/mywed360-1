import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Modal from '../../components/Modal';
import ProviderSearchDrawer from '../../components/proveedores/ProviderSearchDrawer';
import ProveedorDetalle from '../../components/proveedores/ProveedorDetalle';
import ProveedorFormModal from '../../components/proveedores/ProveedorFormModal';
import ServicesBoard from '../../components/proveedores/ServicesBoard';
import SupplierKanban from '../../components/proveedores/SupplierKanban';

const SECTION_TABS = [
  { id: 'vistos', label: 'Vistos' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'contratos', label: 'Contratos' },
];

const INITIAL_PROVIDERS = [
  {
    id: 'prov-1',
    nombre: 'Catering Deluxe',
    name: 'Catering Deluxe',
    servicio: 'Catering',
    service: 'Catering',
    estado: 'Por definir',
    status: 'Pendiente',
    presupuesto: 4500,
    presupuestoAsignado: 3500,
    gastado: 0,
    proximaAccion: 'Solicitar propuesta inicial',
    favorito: false,
    ubicacion: 'Madrid',
    email: 'contacto@cateringdeluxe.es',
    telefono: '+34 600 100 200',
  },
  {
    id: 'prov-2',
    nombre: 'DJ Night',
    name: 'DJ Night',
    servicio: 'Música',
    service: 'Música',
    estado: 'Contactado',
    status: 'Contactado',
    presupuesto: 1200,
    presupuestoAsignado: 1200,
    gastado: 0,
    proximaAccion: 'Esperar confirmación de agenda',
    favorito: false,
    ubicacion: 'Valencia',
    email: 'hola@djnight.es',
    telefono: '+34 600 200 300',
  },
  {
    id: 'prov-3',
    nombre: 'Foto Natural',
    name: 'Foto Natural',
    servicio: 'Fotografía',
    service: 'Fotografía',
    estado: 'Presupuesto',
    status: 'Seleccionado',
    presupuesto: 1800,
    presupuestoAsignado: 1800,
    gastado: 0,
    proximaAccion: 'Revisar contrato enviado',
    favorito: true,
    ubicacion: 'Barcelona',
    email: 'info@fotonatural.es',
    telefono: '+34 600 400 500',
  },
];

const INITIAL_COMMUNICATIONS = {
  'prov-2': [
    {
      id: 'comm-201',
      tipo: 'Email',
      fecha: '2025-09-07',
      mensaje: 'Se envió briefing inicial con playlist preferida.',
    },
    {
      id: 'comm-202',
      tipo: 'Llamada',
      fecha: '2025-09-09',
      mensaje: 'Confirmó disponibilidad para la fecha solicitada.',
    },
  ],
  'prov-3': [
    {
      id: 'comm-301',
      tipo: 'Email',
      fecha: '2025-09-11',
      mensaje: 'Recibimos presupuesto detallado y ejemplos de álbum.',
    },
  ],
};

const STATUS_MAP = {
  vacio: { estado: 'Por definir', status: 'Pendiente' },
  proceso: { estado: 'Contactado', status: 'Contactado' },
  presupuestos: { estado: 'Presupuesto', status: 'Seleccionado' },
  contratado: { estado: 'Contratado', status: 'Confirmado' },
  rechazado: { estado: 'Rechazado', status: 'Rechazado' },
};

function mapEstadoToStatus(estado = '') {
  const value = estado.toLowerCase();
  if (value.includes('contrat')) return 'Confirmado';
  if (value.includes('presup')) return 'Seleccionado';
  if (value.includes('contact')) return 'Contactado';
  if (value.includes('rechaz')) return 'Rechazado';
  return 'Pendiente';
}

function normalizeProvider(data, previous = null) {
  const id = data.id || `prov-${Date.now()}`;
  const estado = data.estado || previous?.estado || 'Por definir';
  const service = data.servicio || previous?.servicio || 'Servicio para bodas';
  return {
    id,
    nombre: data.nombre || previous?.nombre || 'Proveedor sin nombre',
    name: data.nombre || previous?.nombre || 'Proveedor sin nombre',
    servicio: service,
    service,
    estado,
    status: mapEstadoToStatus(estado),
    presupuesto: data.presupuesto ? Number(data.presupuesto) : previous?.presupuesto || 0,
    presupuestoAsignado: data.presupuesto
      ? Number(data.presupuesto)
      : previous?.presupuestoAsignado || 0,
    gastado: previous?.gastado || 0,
    favorito: data.favorito ?? previous?.favorito ?? false,
    ubicacion: data.ubicacion || previous?.ubicacion || '',
    email: data.email || previous?.email || '',
    telefono: data.telefono || previous?.telefono || '',
    web: data.web || previous?.web || '',
    notas: data.notas || previous?.notas || '',
    proximaAccion: data.notas
      ? 'Revisar notas recientes'
      : previous?.proximaAccion || 'Contactar proveedor',
  };
}

function formatCurrency(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric === 0) {
    return numeric === 0 ? '€ 0' : '--';
  }
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(numeric);
}

export default function ProveedoresFlowHarness() {
  const [providers, setProviders] = useState(INITIAL_PROVIDERS);
  const [activeTab, setActiveTab] = useState('vistos');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formProvider, setFormProvider] = useState(null);
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [communications, setCommunications] = useState(INITIAL_COMMUNICATIONS);
  const [unreadMap, setUnreadMap] = useState({ 'prov-2': true, 'prov-3': true });
  const [searches, setSearches] = useState([]);
  const [needsOpen, setNeedsOpen] = useState(false);

  const selectedProvider = useMemo(
    () => providers.find((prov) => prov.id === selectedProviderId) || null,
    [providers, selectedProviderId]
  );

  useEffect(() => {
    if (!selectedProviderId) return;
    setUnreadMap((prev) => {
      if (!prev[selectedProviderId]) return prev;
      const next = { ...prev };
      delete next[selectedProviderId];
      return next;
    });
  }, [selectedProviderId]);

  const shortlistProviders = useMemo(
    () =>
      providers.filter(
        (prov) =>
          !prov.estado.toLowerCase().includes('contrat') &&
          !prov.estado.toLowerCase().includes('rechaz')
      ),
    [providers]
  );

  const contractedProviders = useMemo(
    () => providers.filter((prov) => prov.estado.toLowerCase().includes('contrat')),
    [providers]
  );
  const budgetStageProviders = useMemo(
    () => providers.filter((prov) => prov.estado.toLowerCase().includes('presup')),
    [providers]
  );

  const pipelineSummary = useMemo(() => {
    const asignado = providers.reduce(
      (total, prov) => total + (parseFloat(prov.presupuestoAsignado || prov.presupuesto) || 0),
      0
    );
    const gastado = providers.reduce(
      (total, prov) => total + (parseFloat(prov.gastado) || 0),
      0
    );
    const presupPend = providers.filter((prov) =>
      prov.estado.toLowerCase().includes('presup')
    ).length;
    const recordatorios = providers.filter((prov) => !!prov.proximaAccion).length;
    const deadlines = providers
      .map((prov) => (prov.fechaLimite ? new Date(prov.fechaLimite) : null))
      .filter((date) => date instanceof Date && !Number.isNaN(date.getTime()))
      .sort((a, b) => a - b);
    return {
      asignado,
      gastado,
      presupPend,
      recordatorios,
      proximoDeadline: deadlines.length ? deadlines[0] : null,
    };
  }, [providers]);

  const handleMoveProvider = (prov, targetKey) => {
    const target = STATUS_MAP[targetKey] || STATUS_MAP.vacio;
    setProviders((prev) =>
      prev.map((item) =>
        item.id === prov.id
          ? { ...item, estado: target.estado, status: target.status }
          : item
      )
    );
  };

  const handleOpenSearch = () => {
    setNeedsOpen(false);
    setAiResult(null);
    setDrawerOpen(true);
  };

  const handleSearchWithAI = (query) => {
    if (!query) return;
    setAiLoading(true);
    setSearches((prev) => [...prev, query]);
    setTimeout(() => {
      setAiResult({
        nombre: 'Floristería Prisma',
        servicio: 'Flores',
        descripcion: `Proveedor sugerido para "${query}"`,
        ubicacion: 'Barcelona',
        email: 'contacto@floristeriaprisma.es',
        telefono: '+34 600 300 400',
        web: 'https://floristeriaprisma.es',
      });
      setAiLoading(false);
    }, 120);
  };

  const handleGuardarDesdeAI = (resultado) => {
    if (!resultado) return;
    setFormProvider({
      nombre: resultado.nombre || '',
      servicio: resultado.servicio || '',
      ubicacion: resultado.ubicacion || '',
      email: resultado.email || '',
      telefono: resultado.telefono || '',
      web: resultado.web || '',
      notas: resultado.descripcion || '',
      estado: 'Por definir',
      favorito: false,
      idHint: 'prov-ai',
    });
    setDrawerOpen(false);
    setFormOpen(true);
  };

  const handleOpenFormWithService = (service) => {
    setNeedsOpen(false);
    setFormProvider({
      nombre: '',
      servicio: service || '',
      presupuesto: '',
      estado: 'Por definir',
      favorito: false,
    });
    setFormOpen(true);
  };

  const handleSaveProvider = async (data) => {
    // Usar idHint si no hay id para mantener un identificador estable en tests
    if (!data.id && data.idHint) {
      data.id = data.idHint;
    }
    const previous = providers.find((prov) => prov.id === data.id) || null;
    const next = normalizeProvider(data, previous);
    setProviders((prev) => {
      const exists = prev.some((prov) => prov.id === next.id);
      if (exists) {
        return prev.map((prov) => (prov.id === next.id ? next : prov));
      }
      return [...prev, next];
    });
    setUnreadMap((prev) => ({ ...prev, [next.id]: true }));
    setCommunications((prev) => ({
      ...prev,
      [next.id]: [
        {
          id: `comm-${Date.now()}`,
          tipo: 'Nota',
          fecha: new Date().toISOString(),
          mensaje: 'Proveedor añadido desde bísqueda IA.',
        },
        ...(prev[next.id] || []),
      ],
    }));
    setFormOpen(false);
    setFormProvider(null);
    setAiResult(null);
    return true;
  };

  const toggleFavorite = (id) => {
    setProviders((prev) =>
      prev.map((prov) =>
        prov.id === id ? { ...prov, favorito: !prov.favorito } : prov
      )
    );
  };

  const handleOpenDetail = (id) => {
    setSelectedProviderId(id);
  };

  const handleCloseDetail = () => {
    setSelectedProviderId(null);
  };

  const handleEditFromDetail = (prov) => {
    const found = providers.find((item) => item.id === prov.id) || prov;
    setFormProvider({
      id: found.id,
      nombre: found.nombre,
      servicio: found.servicio,
      presupuesto: String(found.presupuesto || ''),
      estado: found.estado,
      favorito: found.favorito,
      ubicacion: found.ubicacion,
      email: found.email,
      telefono: found.telefono,
      web: found.web,
      notas: found.notas,
    });
    setFormOpen(true);
  };

  const handleNuevaComunicacion = () => {
    if (!selectedProviderId) return;
    setCommunications((prev) => {
      const current = prev[selectedProviderId] || [];
      const entry = {
        id: `comm-${Date.now()}`,
        tipo: 'Nota',
        fecha: new Date().toISOString(),
        mensaje: 'Comunicación registrada durante la prueba',
      };
      return { ...prev, [selectedProviderId]: [entry, ...current] };
    });
  };

  return (
    <div className="p-6 space-y-6" data-cy="proveedores-flow-harness">
      <header
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        data-cy="proveedores-header"
      >
        <div>
          <h1 className="text-2xl font-semibold " className="text-body" data-cy="header-title">
            Gestión de Proveedores · Harness
          </h1>
          <p className="text-sm " className="text-secondary">
            Replica la vista con pestañas (Vistos, Pipeline, Contratos), matriz de necesidades y búsqueda IA.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" data-cy="header-actions">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border  rounded-md text-sm font-medium   hover:" className="border-default" className="text-body" className="bg-page" className="bg-surface"
            data-cy="action-matriz"
            onClick={() => setNeedsOpen(true)}
          >
            Matriz de necesidades
          </button>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
            data-cy="action-buscar-ia"
            onClick={() => {
              setNeedsOpen(false);
              handleOpenSearch();
            }}
          >
            Buscar con IA
          </button>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white  hover:bg-blue-700" style={{ backgroundColor: 'var(--color-primary)' }}
            data-cy="action-anadir"
            onClick={() => {
              setNeedsOpen(false);
              handleOpenFormWithService();
            }}
          >
            Añadir proveedor
          </button>
        </div>
      </header>

      <nav
        className="border-b  -mb-px flex space-x-6" className="border-default"
        aria-label="Secciones del flujo"
      >
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-cy={`tab-${tab.id}`}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'vistos' && (
        <section className="space-y-3" data-cy="vistos-section">
          {shortlistProviders.length ? (
            shortlistProviders.map((prov) => (
              <div
                key={prov.id}
                data-cy={`vistos-item-${prov.id}`}
                className="flex items-center gap-3 border  rounded-md px-3 py-2 " className="border-default" className="bg-surface"
              >
                <button
                  type="button"
                  data-cy="vistos-favorite"
                  className="text-lg leading-none"
                  onClick={() => toggleFavorite(prov.id)}
                >
                  {prov.favorito ? '★' : '☆'}
                </button>
                <div className="flex-1">
                  <div className="font-medium text-sm">{prov.nombre}</div>
                  <div className="text-xs " className="text-muted">{prov.servicio}</div>
                </div>
                {unreadMap[prov.id] ? (
                  <span
                    data-cy="vistos-unread"
                    className="inline-block w-2 h-2 rounded-full bg-red-500"
                    title="Pendiente de revisar"
                  />
                ) : null}
                <button
                  type="button"
                  data-cy="vistos-open"
                  className="text-sm  hover:underline" className="text-primary"
                  onClick={() => handleOpenDetail(prov.id)}
                >
                  Ver detalle
                </button>
              </div>
            ))
          ) : (
            <div className="text-sm " className="text-muted" data-cy="vistos-empty">
              No hay proveedores en shortlist.
            </div>
          )}
        </section>
      )}

      {activeTab === 'pipeline' && (
        <section
          className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-6"
          data-cy="pipeline-section"
        >
          <div className="space-y-6">
            <div className="rounded-lg border border-dashed  /70 p-4 flex flex-wrap items-center gap-3" className="border-default" className="bg-surface">
              <div>
                <div className="text-sm font-semibold " className="text-body">
                  Organiza necesidades y servicios
                </div>
                <p className="text-xs  max-w-md" className="text-secondary">
                  Usa la matriz para mapear qué servicios están cubiertos y lanza búsquedas IA o altas manuales.
                </p>
              </div>
              <div className="ml-auto">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border   text-xs font-medium rounded-md hover:bg-blue-50" style={{ borderColor: 'var(--color-primary)' }} className="text-primary"
                  data-cy="pipeline-open-matrix"
                  onClick={() => setNeedsOpen(true)}
                >
                  Abrir matriz de necesidades
                </button>
              </div>
            </div>

            <SupplierKanban
              proveedores={providers}
              onMove={handleMoveProvider}
              onClick={(prov) => handleOpenDetail(prov.id)}
              showNextAction={true}
              data-cy="pipeline-kanban"
            />
          </div>

          <aside className=" border rounded-lg p-4 h-min sticky top-4 space-y-4" className="bg-surface" data-cy="pipeline-aside">
            <div>
              <div className="text-sm font-semibold mb-2">Resumen financiero</div>
              <div className="text-xs  space-y-1" className="text-secondary">
                <div className="flex justify-between">
                  <span>Asignado</span>
                  <span>{formatCurrency(pipelineSummary.asignado)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gastado</span>
                  <span>{formatCurrency(pipelineSummary.gastado)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Presupuestos pendientes</span>
                  <span>{pipelineSummary.presupPend}</span>
                </div>
                <div className="flex justify-between">
                  <span>Recordatorios</span>
                  <span>{pipelineSummary.recordatorios}</span>
                </div>
                <div className="flex justify-between">
                  <span>Próximo deadline</span>
                  <span>
                    {pipelineSummary.proximoDeadline
                      ? pipelineSummary.proximoDeadline.toLocaleDateString('es-ES')
                      : '--'}
                  </span>
                </div>
              </div>
            </div>

            {searches.length ? (
              <div className="border-t pt-3 text-xs " className="text-muted" data-cy="search-history">
                Últimas búsquedas IA: {searches.slice(-3).join(', ')}
              </div>
            ) : null}
          </aside>
        </section>
      )}

      {activeTab === 'contratos' && (
        <section
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          data-cy="contratos-section"
        >
          <div className="border  rounded-md p-4 " className="border-default" className="bg-surface">
            <div className="text-sm " className="text-muted">Proveedores contratados</div>
            <div className="text-2xl font-semibold" data-cy="contratos-total">
              {contractedProviders.length}
            </div>
          </div>
          <div className="border  rounded-md p-4 " className="border-default" className="bg-surface">
            <div className="text-sm " className="text-muted">Presupuestos en negociación</div>
            <div className="text-2xl font-semibold" data-cy="contratos-presupuestos">
              {budgetStageProviders.length}
            </div>
          </div>
          <div className="border  rounded-md p-4 " className="border-default" className="bg-surface">
            <div className="text-sm " className="text-muted">Servicios cubiertos</div>
            <div className="text-2xl font-semibold" data-cy="contratos-servicios">
              {new Set(providers.map((prov) => prov.servicio)).size}
            </div>
          </div>
        </section>
      )}

      <Modal
        open={needsOpen}
        onClose={() => setNeedsOpen(false)}
        title="Matriz de necesidades"
        size="full"
        className="max-w-4xl"
      >
        <div className="space-y-4" data-cy="needs-modal">
          <p className="text-sm " className="text-secondary">
            Ajusta los servicios prioritarios y lanza búsquedas inteligentes sin salir del módulo.
          </p>
          <ServicesBoard
            proveedores={providers}
            onOpenSearch={() => handleOpenSearch()}
            onOpenAI={() => handleOpenSearch()}
            onOpenNew={(service) => handleOpenFormWithService(service)}
          />
        </div>
      </Modal>

      <ProviderSearchDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onBuscar={handleSearchWithAI}
        onGuardar={handleGuardarDesdeAI}
        resultado={aiResult}
        cargando={aiLoading}
      />

      <ProveedorFormModal
        visible={formOpen}
        onClose={() => {
          setFormOpen(false);
          setFormProvider(null);
        }}
        onGuardar={handleSaveProvider}
        proveedorEditar={formProvider}
        forceGuardar={true}
      />

      {selectedProvider ? (
        <section
          className="border border-blue-100 bg-blue-50 rounded-lg p-4 space-y-3"
          data-cy="detalle-proveedor"
        >
          <div className="flex justify-between items-center">
            <div className="font-semibold text-sm text-blue-900">
              Detalle de {selectedProvider.nombre}
            </div>
            <button
              type="button"
              data-cy="detalle-cerrar"
              className="text-sm  hover:underline" className="text-primary"
              onClick={handleCloseDetail}
            >
              Cerrar
            </button>
          </div>
          <ProveedorDetalle
            proveedor={selectedProvider}
            comunicaciones={communications[selectedProvider.id] || []}
            onCerrar={handleCloseDetail}
            onEditar={handleEditFromDetail}
            onNuevaComunicacion={handleNuevaComunicacion}
          />
        </section>
      ) : null}
    </div>
  );
}
