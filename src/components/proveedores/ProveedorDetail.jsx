import { X, Star, Phone, Mail, Globe, Calendar, Edit2, MapPin } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ProveedorBudgets from './ProveedorBudgets.jsx';
import RFQModal from './RFQModal';
import { useWedding } from '../../context/WeddingContext';
import useSupplierGroups from '../../hooks/useSupplierGroups';
import useSupplierRFQHistory from '../../hooks/useSupplierRFQHistory';
import useProveedores from '../../hooks/useProveedores';
import { post as apiPost, get as apiGet } from '../../services/apiClient';
import EmailTrackingList from './tracking/EmailTrackingList';
import TrackingModal from './tracking/TrackingModal';
import { loadTrackingRecords } from '../../services/EmailTrackingService';
import Modal from '../Modal';
import Toast from '../Toast';
import Button from '../ui/Button';
import Card from '../ui/Card';
import AssignSupplierToGroupModal from './AssignSupplierToGroupModal';

/**
 * @typedef {import('../../hooks/useProveedores').Provider} Provider
 */

const ProveedorDetail = ({ provider, onClose, onEdit, activeTab, setActiveTab, onOpenGroups }) => {
  const [rating, setRating] = useState(provider.ratingCount > 0 ? provider.rating / provider.ratingCount : 0);
  const [ratingDirty, setRatingDirty] = useState(false);
  const [savingRating, setSavingRating] = useState(false);
  const { updateProvider } = useProveedores();

  const { activeWedding } = useWedding();
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const navigate = useNavigate();

  const { removeMember } = useSupplierGroups();
  const [removing, setRemoving] = useState(false);
  const [toast, setToast] = useState(null);
  const [groupCleared, setGroupCleared] = useState(false);
  const [rfqOpen, setRfqOpen] = useState(false);
  const [rfqDefaults, setRfqDefaults] = useState({ subject: '', body: '' });
  const { items: rfqHistory, loading: rfqLoading } = useSupplierRFQHistory(provider?.id);
  const [preview, setPreview] = useState({ open: false, url: '', type: '' });

  const [trackingFilter, setTrackingFilter] = useState('todos');
  const [selectedTracking, setSelectedTracking] = useState(null);
  const [remoteEvents, setRemoteEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const handleGenerateContract = async () => {
    if (!activeWedding) return;
    setGenerating(true);
    setGenError(null);
    try {
      const payload = {
        weddingId: activeWedding,
        payload: {
          type: 'provider_contract',
          subtype: 'basic',
          title: `Contrato Proveedor - ${provider?.name || 'Proveedor'}`,
          data: {
            supplierId: provider?.id,
            supplierName: provider?.name,
            service: provider?.service,
            contact: provider?.contact,
            email: provider?.email,
            phone: provider?.phone,
          },
        },
        saveMeta: true,
      };
      const res = await apiPost('/api/legal-docs/generate', payload, { auth: true });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || 'error');
      const b64 = json?.document?.pdfBase64;
      if (b64) {
        const win = window.open();
        if (win) {
          win.document.write(
            `<iframe src="data:application/pdf;base64,${b64}" frameborder="0" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>`
          );
        }
      }
    } catch (e) {
      setGenError('No se pudo generar el contrato');
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenLegalDocs = () => {
    const title = `Contrato Proveedor - ${provider?.name || 'Proveedor'}`;
    navigate('/protocolo/documentos', {
      state: {
        prefill: {
          type: 'provider_contract',
          title,
          providerName: provider?.name || '',
          service: provider?.service || '',
          eventDate: provider?.date || '',
          amount: provider?.priceRange || '',
          region: 'ES',
        },
      },
    });
  };

  const renderRatingStars = (currentRating, interactive = false) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={interactive ? 24 : 20}
          className={`${star <= currentRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} ${
            interactive ? 'cursor-pointer' : ''
          }`}
          onClick={() => {
            if (!interactive) return;
            setRating(star);
            setRatingDirty(true);
          }}
        />
      ))}
    </div>
  );

  const saveRating = async () => {
    if (!provider?.id || !ratingDirty) return;
    try {
      setSavingRating(true);
      const baseSum = Number(provider.rating || 0);
      const baseCount = Number(provider.ratingCount || 0);
      const newData = {
        ...provider,
        rating: baseSum + Math.max(1, Math.min(5, Math.round(rating))),
        ratingCount: baseCount + 1,
        lastRatedAt: new Date().toISOString(),
      };
      await updateProvider(provider.id, newData);
      setRatingDirty(false);
      setToast({ type: 'success', message: 'Valoracion guardada' });
    } catch (e) {
      setToast({ type: 'error', message: 'No se pudo guardar la valoracion' });
    } finally {
      setSavingRating(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const formatDateTime = (ts) => {
    if (!ts) return '';
    try {
      const d = typeof ts?.toDate === 'function' ? ts.toDate() : new Date(ts);
      return d.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
    } catch (_) {
      return '';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmado':
        return 'bg-green-100 text-green-800';
      case 'Contactado':
        return 'bg-blue-100 text-blue-800';
      case 'Seleccionado':
        return 'bg-purple-100 text-purple-800';
      case 'Rechazado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const trackingItemsLocal = useMemo(() => {
    try {
      const all = loadTrackingRecords();
      const list = Array.isArray(all) ? all : [];
      if (!provider) return [];
      return list.filter((it) => it.providerId === provider.id || it.providerEmail === provider.email);
    } catch {
      return [];
    }
  }, [provider?.id, provider?.email]);

  // Fetch Mailgun events for recipient
  const refreshMailEvents = async () => {
    if (!provider?.email) return;
    try {
      setLoadingEvents(true);
      const res = await apiGet(`/api/mailgun/events?recipient=${encodeURIComponent(provider.email)}&limit=50`, { auth: true, silent: true });
      const json = await res.json();
      const items = Array.isArray(json?.items) ? json.items : [];
      const mapped = items.map((ev, idx) => {
        const tsSec = ev?.timestamp || ev?.event_timestamp || Date.now() / 1000;
        const dateIso = new Date(tsSec * 1000).toISOString();
        const evType = String(ev?.event || '').toLowerCase();
        let status = 'enviado';
        if (evType === 'delivered') status = 'entregado';
        else if (evType === 'opened') status = 'leido';
        else if (evType === 'failed') status = 'error';
        else if (evType === 'clicked') status = 'leido';
        return {
          id: `mg_${idx}_${tsSec}`,
          providerId: provider.id,
          providerName: provider.name,
          subject: `Evento ${evType || 'mailgun'}`,
          status,
          sentAt: dateIso,
          lastUpdated: dateIso,
          openCount: evType === 'opened' ? 1 : 0,
          recipientEmail: provider.email,
        };
      });
      setRemoteEvents(mapped);
    } catch (e) {
      // silencioso
    } finally {
      setLoadingEvents(false);
    }
  };

  // Auto-refresh when switching to tracking tab
  React.useEffect(() => {
    if (activeTab === 'tracking' && provider?.email) {
      refreshMailEvents();
    }
  }, [activeTab, provider?.email]);

  const trackingItems = useMemo(() => {
    const local = Array.isArray(trackingItemsLocal) ? trackingItemsLocal : [];
    const remote = Array.isArray(remoteEvents) ? remoteEvents : [];
    // naive merge
    return [...remote, ...local];
  }, [trackingItemsLocal, remoteEvents]);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold">{provider.name}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Cerrar">
              <X size={24} />
            </button>
          </div>

          <div className="flex border-b">
            <button
              className={`py-2 px-4 ${activeTab === 'info' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('info')}
            >
              Informacion
            </button>
            <button
              className={`py-2 px-4 ${
                activeTab === 'communications' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('communications')}
            >
              Comunicaciones
            </button>
            <button
              className={`py-2 px-4 ${activeTab === 'tracking' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('tracking')}
            >
              Seguimiento
            </button>
          </div>

          <div className="overflow-y-auto p-4 flex-1">
            {activeTab === 'info' && (
              <div className="space-y-6">
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(provider.status)}`}>
                        {provider.status}
                      </span>
                      <span className="ml-2 text-gray-500">{provider.service}</span>
                      {!!provider.groupName && !groupCleared && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenGroups) {
                              onOpenGroups(provider.groupId);
                            } else {
                              setToast({ type: 'info', message: `Grupo: ${provider.groupName}` });
                            }
                          }}
                          className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
                          title={`Ir al grupo: ${provider.groupName}`}
                        >
                          Grupo: {provider.groupName}
                        </button>
                      )}
                      {!provider.groupId && (
                        <Button size="xs" variant="outline" onClick={() => setAssignOpen(true)}>
                          Asignar a grupo
                        </Button>
                      )}
                    </div>
                    {onEdit && (
                      <Button onClick={() => onEdit(provider)} variant="outline" size="sm">
                        <Edit2 size={16} className="mr-1" /> Editar
                      </Button>
                    )}
                    {provider.groupId && (
                      <Button
                        onClick={async () => {
                          if (removing) return;
                          const ok = window.confirm('Quitar este proveedor del grupo?');
                          if (!ok) return;
                          try {
                            setRemoving(true);
                            await removeMember(provider.groupId, provider.id);
                            setGroupCleared(true);
                            setToast({ type: 'success', message: 'Proveedor quitado del grupo' });
                          } finally {
                            setRemoving(false);
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="ml-2 text-red-600 border-red-200 hover:bg-red-50"
                        disabled={removing}
                      >
                        {removing ? 'Quitando...' : 'Quitar del grupo'}
                      </Button>
                    )}
                  </div>

                  {provider.image && (
                    <div className="w-full h-64 overflow-hidden rounded-lg mb-4">
                      <img src={provider.image} alt={provider.name} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {provider.snippet && <p className="text-gray-700 mb-4">{provider.snippet}</p>}

                  <div className="space-y-3 mt-4">
                    {provider.contact && (
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-medium">{provider.contact.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium">Contacto</p>
                          <p className="text-sm text-gray-600">{provider.contact}</p>
                        </div>
                      </div>
                    )}

                    {provider.phone && (
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                          <Phone size={16} className="text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Telefono</p>
                          <p className="text-sm text-gray-600">{provider.phone}</p>
                        </div>
                      </div>
                    )}

                    {provider.email && (
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                          <Mail size={16} className="text-red-600" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-medium">Email</p>
                          <a href={`mailto:${provider.email}`} className="text-sm text-blue-600 hover:underline truncate block">
                            {provider.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {provider.link && (
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                          <Globe size={16} className="text-purple-600" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-medium">Sitio web</p>
                          <a
                            href={provider.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline truncate block"
                          >
                            {provider.link}
                          </a>
                        </div>
                      </div>
                    )}

                    {provider.date && (
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                          <Calendar size={16} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium">Fecha</p>
                          <p className="text-sm text-gray-600">{formatDate(provider.date)}</p>
                        </div>
                      </div>
                    )}

                    {(provider.location || provider.address) && (
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center mr-3">
                          <MapPin size={16} className="text-teal-600" />
                        </div>
                        <div>
                          <p className="font-medium">Ubicacion</p>
                          <p className="text-sm text-gray-600">{provider.location || provider.address}</p>
                        </div>
                      </div>
                    )}

                    {provider.priceRange && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="font-medium">Rango de precios</p>
                        <p className="text-lg font-semibold text-gray-800">{provider.priceRange}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <p className="font-medium mb-1">Calificacion</p>
                    <div className="flex items-center space-x-4">
                      {renderRatingStars(rating, true)}
                      <span className="text-sm text-gray-500">
                        {rating.toFixed(1)} de 5 ({provider.ratingCount || 0} valoraciones)
                      </span>
                      <Button size="sm" variant="outline" disabled={savingRating || !ratingDirty} onClick={saveRating}>
                        {savingRating ? 'Guardando...' : 'Guardar valoracion'}
                      </Button>
                    </div>
                  </div>
                </Card>

                <ProveedorBudgets supplierId={provider.id} />

                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Documentos</h3>
                      {genError && <p className="text-sm text-red-600 mt-1">{genError}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleOpenLegalDocs} variant="outline">
                        Crear contrato en Documentos
                      </Button>
                      <Button onClick={handleGenerateContract} disabled={!activeWedding || generating}>
                        {generating ? 'Generando...' : 'Generar ahora'}
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">RFQ enviados</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          if (!activeWedding || !provider?.id) return;
                          try {
                            const res = await apiPost(
                              `/api/supplier-portal/weddings/${activeWedding}/suppliers/${provider.id}/portal-token`,
                              {},
                              { auth: true }
                            );
                            const json = await res.json();
                            if (json?.url) {
                              try { await navigator.clipboard?.writeText?.(json.url); } catch {}
                              setToast({ type: 'success', message: 'Enlace del portal copiado' });
                            } else {
                              setToast({ type: 'info', message: 'Token generado' });
                            }
                          } catch (e) {
                            setToast({ type: 'error', message: 'No se pudo generar el enlace del portal' });
                          }
                        }}
                      >
                        Portal proveedor
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setRfqDefaults({ subject: `Solicitud de presupuesto - ${provider?.service || ''}`.trim(), body: '' });
                          setRfqOpen(true);
                        }}
                      >
                        Enviar nuevo
                      </Button>
                    </div>
                  </div>
                  {rfqLoading ? (
                    <p className="text-sm text-gray-500">Cargando...</p>
                  ) : rfqHistory.length === 0 ? (
                    <p className="text-sm text-gray-500">Sin RFQs previos.</p>
                  ) : (
                    <ul className="divide-y">
                      {rfqHistory.map((r) => (
                        <li key={r.id} className="py-2 flex items-center justify-between">
                          <div>
                            <p className="font-medium truncate max-w-[28rem]" title={r.subject}>
                              {r.subject || 'Sin asunto'}
                            </p>
                            <p className="text-xs text-gray-600">{r.email || provider?.email} – {formatDateTime(r.sentAt)}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRfqDefaults({ subject: r.subject || '', body: r.body || '' });
                              setRfqOpen(true);
                            }}
                          >
                            Reenviar
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            )}

            {activeTab === 'communications' && (
              <div className="space-y-4">
                <Card>
                  <h3 className="text-lg font-medium mb-3">Comunicaciones</h3>
                  <p className="text-gray-500">Historial de comunicaciones con este proveedor.</p>
                </Card>
              </div>
            )}

            {activeTab === 'tracking' && (
              <div className="space-y-4">
                <Card>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium">Seguimiento</h3>
                    <Button size="sm" variant="outline" onClick={refreshMailEvents} disabled={loadingEvents}>
                      {loadingEvents ? 'Actualizando…' : 'Actualizar eventos'}
                    </Button>
                  </div>
                  <EmailTrackingList
                    trackingItems={trackingItems}
                    currentFilter={trackingFilter}
                    onFilter={setTrackingFilter}
                    onViewDetails={(item) => setSelectedTracking(item)}
                  />
                </Card>
              </div>
            )}
          </div>

          <div className="border-t p-4 bg-gray-50 flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={2500} />
      )}

      {selectedTracking && (
        <TrackingModal isOpen={!!selectedTracking} onClose={() => setSelectedTracking(null)} trackingItem={selectedTracking} />
      )}

      {preview.open && (
        <Modal open={preview.open} onClose={() => setPreview({ open: false, url: '', type: '' })} title="Vista previa">
          <div className="min-h-[60vh]">
            {preview.type === 'image' ? (
              <img src={preview.url} alt="preview" className="max-h-[70vh] mx-auto" />
            ) : preview.type === 'pdf' ? (
              <iframe src={preview.url} className="w-full h-[70vh]" title="PDF" />
            ) : (
              <a href={preview.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                Abrir en nueva pestaña
              </a>
            )}
          </div>
        </Modal>
      )}

      <RFQModal
        open={rfqOpen}
        onClose={() => setRfqOpen(false)}
        providers={[provider]}
        defaultSubject={rfqDefaults.subject}
        defaultBody={rfqDefaults.body}
      />
      {assignOpen && (
        <AssignSupplierToGroupModal
          open={assignOpen}
          onClose={() => setAssignOpen(false)}
          provider={provider}
        />
      )}
    </>
  );
};

export default React.memo(ProveedorDetail, (prevProps, nextProps) => {
  return (
    prevProps.provider?.id === nextProps.provider?.id &&
    prevProps.activeTab === nextProps.activeTab &&
    JSON.stringify(prevProps.provider) === JSON.stringify(nextProps.provider)
  );
});
  const [assignOpen, setAssignOpen] = useState(false);
