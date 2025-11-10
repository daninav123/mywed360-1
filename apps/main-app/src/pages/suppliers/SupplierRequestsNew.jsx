import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  Circle,
  Eye,
  LogOut,
  ArrowLeft,
  LayoutGrid,
  List,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import CreateQuotationModal from '../../components/suppliers/CreateQuotationModal';

const STATUS_CONFIG = {
  pending: {
    label: 'Pendientes',
    icon: Circle,
    color: 'var(--color-info)',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    textClass: 'text-[var(--color-info)]',
  },
  contacted: {
    label: 'Contactadas',
    icon: Phone,
    color: 'var(--color-warning)',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    textClass: 'text-[var(--color-warning)]',
  },
  quoted: {
    label: 'Cotizadas',
    icon: Eye,
    color: 'var(--color-accent)',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    textClass: 'text-[var(--color-accent)]',
  },
  accepted: {
    label: 'Aceptadas',
    icon: CheckCircle,
    color: 'var(--color-success)',
    bg: 'bg-green-50 dark:bg-green-900/20',
    textClass: 'text-[var(--color-success)]',
  },
  rejected: {
    label: 'Rechazadas',
    icon: AlertCircle,
    color: 'var(--color-danger)',
    bg: 'bg-red-50 dark:bg-red-900/20',
    textClass: 'text-[var(--color-danger)]',
  },
};

export default function SupplierRequestsNew() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived'
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [quotationModal, setQuotationModal] = useState({ isOpen: false, request: null });

  // Cargar solicitudes
  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('supplier_token');
      const supplierId = localStorage.getItem('supplier_id');

      if (!token || !supplierId) {
        navigate('/supplier/login');
        return;
      }

      const response = await fetch(`/api/suppliers/${supplierId}/quote-requests?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-supplier-id': supplierId,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('supplier_token');
          localStorage.removeItem('supplier_id');
          navigate('/supplier/login');
          return;
        }
        throw new Error('Error cargando solicitudes');
      }

      const data = await response.json();

      // Transformar datos
      const transformedRequests = (data.requests || []).map((req) => ({
        id: req.id,
        coupleName: req.contacto?.nombre || 'Sin nombre',
        contactEmail: req.contacto?.email || '',
        contactPhone: req.contacto?.telefono || '',
        message: req.customMessage || '',
        weddingDate: req.weddingInfo?.fecha || null,
        guestCount: req.weddingInfo?.numeroInvitados || null,
        budget: req.weddingInfo?.presupuestoTotal || null,
        location: req.weddingInfo?.ciudad || null,
        services: [req.supplierCategoryName || req.supplierCategory || 'Servicio'],
        status: req.status || 'pending',
        receivedAt: req.createdAt,
        viewed: req.viewed || false,
        serviceDetails: req.serviceDetails || {},
      }));

      setRequests(transformedRequests);
    } catch (error) {
      console.error('[SupplierRequests] Error loading:', error);
      toast.error('Error cargando solicitudes');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Actualizar estado
  const updateRequestStatus = useCallback(
    async (requestId, newStatus) => {
      try {
        const token = localStorage.getItem('supplier_token');
        const supplierId = localStorage.getItem('supplier_id');

        const response = await fetch(
          `/api/suppliers/${supplierId}/quote-requests/${requestId}/status`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'x-supplier-id': supplierId,
            },
            body: JSON.stringify({ status: newStatus }),
          }
        );

        if (!response.ok) throw new Error('Error actualizando estado');

        toast.success('Estado actualizado correctamente');
        loadRequests();
      } catch (error) {
        console.error('[SupplierRequests] Error updating:', error);
        toast.error('Error actualizando estado');
      }
    },
    [loadRequests]
  );

  // Formatear fecha
  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return 'Sin fecha';

    try {
      let date;
      if (timestamp._seconds) {
        date = new Date(timestamp._seconds * 1000);
      } else {
        date = new Date(timestamp);
      }

      if (isNaN(date.getTime())) return 'Fecha inválida';

      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      return 'Fecha inválida';
    }
  }, []);

  // Filtrar solicitudes
  const filteredRequests = useMemo(() => {
    let filtered = requests;

    // Filtrar por tab activo
    if (activeTab === 'active') {
      // Activas: pending, contacted, quoted
      filtered = filtered.filter((req) => ['pending', 'contacted', 'quoted'].includes(req.status));
    } else {
      // Archivadas: accepted, rejected
      filtered = filtered.filter((req) => ['accepted', 'rejected'].includes(req.status));
    }

    // Filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.coupleName?.toLowerCase().includes(term) ||
          req.contactEmail?.toLowerCase().includes(term) ||
          req.message?.toLowerCase().includes(term)
      );
    }

    // Filtro de estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    return filtered;
  }, [requests, searchTerm, statusFilter, activeTab]);

  // Toggle expand/collapse
  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Expandir/contraer todos
  const expandAll = () => {
    setExpandedIds(new Set(filteredRequests.map((r) => r.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Estadísticas
  const stats = useMemo(() => {
    const active = requests.filter((r) =>
      ['pending', 'contacted', 'quoted'].includes(r.status)
    ).length;
    const pending = requests.filter((r) => r.status === 'pending').length;
    const accepted = requests.filter((r) => r.status === 'accepted').length;
    const archived = requests.filter((r) => ['accepted', 'rejected'].includes(r.status)).length;
    const conversionRate =
      pending + accepted > 0 ? ((accepted / (pending + accepted)) * 100).toFixed(1) : '0';

    return { active, pending, accepted, archived, conversionRate };
  }, [requests]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('supplier_token');
    localStorage.removeItem('supplier_id');
    localStorage.removeItem('supplier_data');
    navigate('/supplier/login');
  };

  // Renderizar card de solicitud (compacta y expandible)
  const renderRequestCard = (request) => {
    const isExpanded = expandedIds.has(request.id);

    return (
      <Card key={request.id} className="mb-3 hover:shadow-lg transition-all duration-200">
        {/* Header - Siempre visible */}
        <div
          className="flex items-start justify-between cursor-pointer"
          onClick={() => toggleExpand(request.id)}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-primary)] text-white font-bold shadow-sm">
              {request.coupleName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-base font-semibold text-body truncate">{request.coupleName}</h3>
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_CONFIG[request.status]?.bg} ${STATUS_CONFIG[request.status]?.textClass}`}
                >
                  {STATUS_CONFIG[request.status]?.label}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatDate(request.receivedAt)}
                </span>
                {request.guestCount && (
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {request.guestCount} inv.
                  </span>
                )}
                {request.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {request.location}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            className="p-1 hover:bg-app rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(request.id);
            }}
          >
            <svg
              className={`w-5 h-5 text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Detalles expandibles */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-soft space-y-4">
            {/* Detalles de la boda */}
            <div className="grid grid-cols-2 gap-3">
              {request.weddingDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
                  <span className="text-muted">
                    {new Date(request.weddingDate).toLocaleDateString('es-ES')}
                  </span>
                </div>
              )}
              {request.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={16} style={{ color: 'var(--color-success)' }} />
                  <span className="text-muted">{request.location}</span>
                </div>
              )}
              {request.guestCount && (
                <div className="flex items-center gap-2 text-sm">
                  <Users size={16} style={{ color: 'var(--color-info)' }} />
                  <span className="text-muted">{request.guestCount} invitados</span>
                </div>
              )}
              {request.budget && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign size={16} style={{ color: 'var(--color-warning)' }} />
                  <span className="text-muted">{request.budget}€</span>
                </div>
              )}
            </div>

            {/* Mensaje */}
            {request.message && (
              <div className="p-3 rounded-md bg-app border-l-4 border-[var(--color-primary)]">
                <p className="text-xs text-muted font-semibold mb-1">💬 Mensaje</p>
                <p className="text-sm text-body">{request.message}</p>
              </div>
            )}

            {/* Contacto */}
            <div className="flex flex-wrap gap-2">
              <a
                href={`mailto:${request.contactEmail}`}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-app rounded-md hover:shadow-sm transition-shadow text-primary font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                <Mail size={14} />
                {request.contactEmail}
              </a>
              {request.contactPhone && (
                <a
                  href={`tel:${request.contactPhone}`}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs bg-app rounded-md hover:shadow-sm transition-shadow text-success font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone size={14} />
                  {request.contactPhone}
                </a>
              )}
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
              {request.status === 'pending' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => updateRequestStatus(request.id, 'contacted')}
                    className="flex-1"
                  >
                    <CheckCircle size={16} className="mr-1" />
                    Contactar
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      console.log('[Button] Opening quotation modal for request:', request.id);
                      setQuotationModal({ isOpen: true, request });
                    }}
                    className="flex-1"
                  >
                    <Eye size={16} className="mr-1" />
                    Enviar Cotización
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateRequestStatus(request.id, 'rejected')}
                    className="flex-1"
                  >
                    Rechazar
                  </Button>
                </>
              )}
              {request.status === 'contacted' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      console.log('[Button] Opening quotation modal for request:', request.id);
                      setQuotationModal({ isOpen: true, request });
                    }}
                    className="flex-1"
                  >
                    <Eye size={16} className="mr-1" />
                    Enviar Cotización
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateRequestStatus(request.id, 'rejected')}
                  >
                    Rechazar
                  </Button>
                </>
              )}
              {request.status === 'quoted' && (
                <>
                  {request.quotation ? (
                    <div className="w-full p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                            ✅ Cotización Enviada
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                            Total: {request.quotation.total?.toFixed(2)}€ | Estado:{' '}
                            {request.quotation.status === 'accepted' ? 'Aceptada' : 'Pendiente'}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Mostrar modal con la cotización enviada
                            toast.info('Ver detalles de cotización');
                          }}
                        >
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => updateRequestStatus(request.id, 'accepted')}
                        className="flex-1"
                      >
                        <CheckCircle size={16} className="mr-1" />
                        Marcar Aceptada
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateRequestStatus(request.id, 'rejected')}
                      >
                        Rechazar
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-app">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4" />
          <p className="text-muted">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="layout-container py-8">
        {/* Header con estadísticas */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  navigate('/supplier/dashboard/' + localStorage.getItem('supplier_id'))
                }
              >
                <ArrowLeft size={18} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-body">Solicitudes de Presupuesto</h1>
                <p className="text-sm text-muted">Gestiona las solicitudes de tus clientes</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut size={18} className="mr-2" />
              Cerrar sesión
            </Button>
          </div>

          {/* Tabs de navegación */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'active'
                  ? 'bg-[var(--color-primary)] text-white shadow-md'
                  : 'bg-app text-muted hover:bg-[var(--color-primary)]/10'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Circle size={16} />
                <span>Activas</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-white/20">{stats.active}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'archived'
                  ? 'bg-[var(--color-primary)] text-white shadow-md'
                  : 'bg-app text-muted hover:bg-[var(--color-primary)]/10'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <CheckCircle size={16} />
                <span>Archivadas</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-white/20">
                  {stats.archived}
                </span>
              </div>
            </button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-app">
              <p className="text-xs text-muted mb-1">Pendientes</p>
              <p className="text-2xl font-bold text-info">{stats.pending}</p>
            </div>
            <div className="p-4 rounded-lg bg-app">
              <p className="text-xs text-muted mb-1">Aceptadas</p>
              <p className="text-2xl font-bold text-success">{stats.accepted}</p>
            </div>
            <div className="p-4 rounded-lg bg-app">
              <p className="text-xs text-muted mb-1">Conversión</p>
              <div className="flex items-center gap-2">
                <TrendingUp size={18} style={{ color: 'var(--color-success)' }} />
                <p className="text-2xl font-bold text-success">{stats.conversionRate}%</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Filtros y búsqueda */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar por nombre, email o mensaje..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-soft bg-surface text-body focus:ring-2 ring-primary"
              />
            </div>

            {/* Filtro de estado */}
            {activeTab === 'active' && (
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-muted" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 rounded-md border border-soft bg-surface text-body focus:ring-2 ring-primary"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="contacted">Contactadas</option>
                  <option value="quoted">Cotizadas</option>
                </select>
              </div>
            )}

            {/* Acciones de expansión */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expandir todo
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Contraer todo
              </Button>
            </div>
          </div>
        </Card>

        {/* Vista de solicitudes */}
        <div>
          {filteredRequests.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <AlertCircle size={48} className="mx-auto mb-4 text-muted" />
                <p className="text-lg font-semibold text-body mb-2">
                  {activeTab === 'active'
                    ? 'No hay solicitudes activas'
                    : 'No hay solicitudes archivadas'}
                </p>
                <p className="text-sm text-muted">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Prueba ajustando los filtros'
                    : activeTab === 'active'
                      ? 'Las nuevas solicitudes aparecerán aquí'
                      : 'Las solicitudes aceptadas o rechazadas aparecerán aquí'}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredRequests.map((request) => renderRequestCard(request))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Cotización */}
      {console.log('[SupplierRequests] Modal state:', quotationModal)}
      <CreateQuotationModal
        isOpen={quotationModal.isOpen}
        onClose={() => {
          console.log('[Modal] Closing');
          setQuotationModal({ isOpen: false, request: null });
        }}
        request={quotationModal.request}
        onQuotationCreated={() => {
          loadRequests();
          toast.success('Cotización enviada. El cliente recibirá un email.');
        }}
      />
    </div>
  );
}
