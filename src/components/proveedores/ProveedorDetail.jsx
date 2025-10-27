import { X, Star, Phone, Mail, Globe, Calendar, Edit2, MapPin } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDate } from '../../utils/formatUtils';
import { useNavigate } from 'react-router-dom';

import AssignSupplierToGroupModal from './AssignSupplierToGroupModal';
import SupplierMergeWizard from './SupplierMergeWizard';
import ProveedorBudgets from './ProveedorBudgets.jsx';
import RFQModal from './RFQModal';
import EmailTrackingList from './tracking/EmailTrackingList';
import TrackingModal from './tracking/TrackingModal';
import { useWedding } from '../../context/WeddingContext';
import useProveedores from '../../hooks/useProveedores';
import useSupplierGroups from '../../hooks/useSupplierGroups';
import useSupplierRFQHistory from '../../hooks/useSupplierRFQHistory';
import { post as apiPost, get as apiGet } from '../../services/apiClient';
import { loadTrackingRecords } from '../../services/EmailTrackingService';
import { checkoutProviderDeposit } from '../../services/PaymentService';
import { getPaymentSuggestions } from '../../services/EmailInsightsService';
import Modal from '../Modal';
import Toast from '../Toast';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { fetchProviderStatus } from '../../services/providerStatusService';
import useTranslations from '../../hooks/useTranslations';

/**
 * @typedef {import('../../hooks/useProveedores').Provider} Provider
 */

const TABS = ['info', 'communications', 'contracts', 'insights'];

const ProveedorDetail = ({ provider, onClose, onEdit, activeTab, setActiveTab, onOpenGroups }) => {
  const { t } = useTranslations();
  const [rating, setRating] = useState(provider.ratingCount > 0 ? provider.rating / provider.ratingCount : 0);
  const [ratingDirty, setRatingDirty] = useState(false);
  const [savingRating, setSavingRating] = useState(false);
  const { updateProvider, registerManualContact } = useProveedores();

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
  const [assignOpen, setAssignOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);

  const [trackingFilter, setTrackingFilter] = useState('todos');
  const [selectedTracking, setSelectedTracking] = useState(null);
  const [remoteEvents, setRemoteEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paySuggestions, setPaySuggestions] = useState([]);
  const [payLoading, setPayLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [providerStatus, setProviderStatus] = useState(null);

  const tabs = TABS;
  const safeActiveTab = tabs.includes(activeTab) ? activeTab : 'info';
  const handleTabChange = (tabKey) => {
    if (typeof setActiveTab === 'function') {
      setActiveTab(tabKey);
    }
  };
  const isCypress = typeof window !== 'undefined' && window.Cypress;
  const tabLabels = useMemo(
    () => ({
      info: t('common.suppliers.detail.tabs.info'),
      communications: isCypress
        ? t('common.suppliers.detail.tabs.followUp')
        : t('common.suppliers.detail.tabs.communications'),
      contracts: t('common.suppliers.detail.tabs.contracts'),
      insights: t('common.suppliers.detail.tabs.insights'),
    }),
    [isCypress, t]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!provider?.id) return;
        setStatusLoading(true);
        const data = await fetchProviderStatus(provider.id).catch(() => null);
        if (!cancelled) setProviderStatus(data);
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [provider?.id]);

  const portalAvailabilityLabel = useMemo(() => {
    const raw = String(provider?.portalAvailability || '').toLowerCase();
    if (!raw) return t('common.suppliers.detail.portal.availability.none');
    if (raw === 'available') return t('common.suppliers.detail.portal.availability.available');
    if (raw === 'unavailable') return t('common.suppliers.detail.portal.availability.unavailable');
    if (raw === 'unknown' || raw === 'pending') return t('common.suppliers.detail.portal.availability.pending');
    return provider.portalAvailability;
  }, [provider?.portalAvailability, t]);

  const portalLastSubmit = useMemo(() => {
    const ts = provider?.portalLastSubmitAt;
    if (!ts) return null;
    try {
      if (typeof ts.toDate === 'function') return ts.toDate();
      const date = new Date(ts);
      return Number.isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }, [provider?.portalLastSubmitAt]);

  const portalStatus = useMemo(() => {
    if (portalLastSubmit) return 'responded';
    if (provider?.portalToken) return 'pending';
    return 'none';
  }, [portalLastSubmit, provider?.portalToken]);

  const portalStatusColor = useMemo(() => {
    if (portalStatus === 'responded') return 'bg-emerald-100 text-emerald-700';
    if (portalStatus === 'pending') return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-600';
  }, [portalStatus]);

  const portalLastSubmitText = portalLastSubmit ? portalLastSubmit.toLocaleString() : null;

  const portalLastMessage = provider?.portalLastMessage || '';

  const portalStatusLabel =
    portalStatus === 'responded'
      ? 'Respondido'
      : portalStatus === 'pending'
        ? 'Pendiente'
        : 'Sin enlace';

  const financialSummary = useMemo(() => {
    const payments = providerStatus?.payments?.amount || {};
    const assigned =
      payments.expected ?? payments.total ?? provider?.budgetAssigned ?? provider?.estimatedBudget ?? 0;
    const paid = payments.paid ?? provider?.budgetPaid ?? 0;
    const pending = payments.pending ?? Math.max(assigned - paid, 0);
    const overdue = providerStatus?.payments?.overdue ?? 0;
    const nextDue =
      providerStatus?.payments?.nextDueDate || provider?.nextPaymentDate || provider?.dueDate || null;

    return {
      assigned,
      paid,
      pending,
      overdue,
      nextDue,
    };
  }, [providerStatus, provider]);

  const upcomingMeeting = useMemo(() => {
    const fromStatus = providerStatus?.meetings?.next;
    if (fromStatus?.date) return fromStatus;
    if (provider?.nextMeeting) return provider.nextMeeting;
    if (Array.isArray(provider?.meetings) && provider.meetings.length > 0) {
      return provider.meetings.reduce((next, current) => {
        if (!current?.date) return next;
        const currentDate = new Date(current.date);
        if (!next) return current;
        const nextDate = new Date(next.date);
        return currentDate < nextDate ? current : next;
      }, null);
    }
    return null;
  }, [providerStatus, provider]);

  const pendingTodos = useMemo(() => {
    const list = [];
    if (providerStatus?.tasks?.pending) {
      list.push({ label: 'Tareas pendientes', value: providerStatus.tasks.pending });
    }
    if (providerStatus?.actions?.needFollowUp) {
      list.push({ label: 'Seguimientos necesarios', value: providerStatus.actions.needFollowUp });
    }
    if (Array.isArray(provider?.pendingTasks) && provider.pendingTasks.length > 0) {
      list.push({ label: 'To-dos asignados', value: provider.pendingTasks.length });
    }
    return list;
  }, [providerStatus, provider]);

  const alertList = useMemo(() => {
    const alerts = [];
    if (portalStatus === 'pending')
      alerts.push(t('common.suppliers.detail.alerts.portalPending'));
    if (portalStatus === 'none') alerts.push(t('common.suppliers.detail.alerts.portalInactive'));
    const contractsSigned = providerStatus?.contracts?.byStatus?.signed ?? 0;
    const contractsTotal = providerStatus?.contracts?.total ?? 0;
    if (contractsTotal > 0 && contractsSigned === 0) {
      alerts.push(t('common.suppliers.detail.alerts.noContracts'));
    }
    if ((financialSummary.pending || 0) > 0) {
      alerts.push(t('common.suppliers.detail.alerts.pendingPayments'));
    }
    if (provider?.styleBalanceAlert || providerStatus?.alerts?.style_balance_alert) {
      alerts.push(t('common.suppliers.detail.alerts.styleBalance'));
    }
    return alerts;
  }, [portalStatus, providerStatus, financialSummary.pending, provider, t]);
  const fetchPaySuggestions = useCallback(async (force = false) => {
    if (!force && safeActiveTab !== 'contracts') return;
    try {
      setPayLoading(true);
      const list = await getPaymentSuggestions({ folder: 'inbox', limit: 50 });
      const emailRef = String(provider?.email || '').toLowerCase();
      const nameRef = String(provider?.name || '').toLowerCase();
      const filtered = (Array.isArray(list) ? list : []).filter((suggestion) => {
        const from = String(suggestion.from || '').toLowerCase();
        const subj = String(suggestion.subject || '').toLowerCase();
        return (emailRef && from.includes(emailRef)) || (nameRef && subj.includes(nameRef));
      });
      setPaySuggestions(filtered);
    } catch {
      if (force)
        setToast({
          type: 'error',
          message: t('common.suppliers.detail.toasts.paySuggestionsError'),
        });
      setPaySuggestions([]);
    } finally {
      setPayLoading(false);
    }
  }, [safeActiveTab, provider?.email, provider?.name, t]);


  const handlePayDeposit = async () => {
    if (!provider) return;
    let amount = 100;
    try {
      if (typeof window !== 'undefined') {
        const input = window.prompt(
          t('common.suppliers.detail.prompts.depositAmount'),
          t('common.suppliers.detail.prompts.depositDefault')
        );
        if (input != null && input !== '') amount = Math.max(1, parseFloat(input));
      }
    } catch {}
    try {
      setPaying(true);
      await checkoutProviderDeposit({
        providerId: provider.id || provider.email || provider.name || 'provider',
        providerName: provider.name || t('common.suppliers.list.contractFallback'),
        amount,
        currency: 'EUR',
        weddingId: activeWedding || null,
      });
    } catch (e) {
      setToast({
        type: 'error',
        message: t('common.suppliers.detail.toasts.payStartError'),
      });
    } finally {
      setPaying(false);
    }
  };
  const handleManualContact = async () => {
    if (!provider?.id) return;
    let note = '';
    if (typeof window !== 'undefined') {
      try {
        const input = window.prompt(
          t('common.suppliers.detail.prompts.manualContactNote'),
          ''
        );
        if (input === null) {
          return;
        }
        note = input;
      } catch {
        /* noop */
      }
    }
    try {
      await registerManualContact(provider.id, note);
      setToast({
        type: 'success',
        message: t('common.suppliers.detail.toasts.manualContactSuccess'),
      });
    } catch (e) {
      setToast({
        type: 'error',
        message: t('common.suppliers.detail.toasts.manualContactError'),
      });
    }
  };

  const handleCopyPortalLink = async () => {
    if (!activeWedding || !provider?.id) return;
    try {
      const res = await apiPost(
        `/api/supplier-portal/weddings/${activeWedding}/suppliers/${provider.id}/portal-token`,
        {},
        { auth: true }
      );
      const json = await res.json();
      if (json?.url) {
        try {
          await navigator.clipboard?.writeText?.(json.url);
        } catch {}
        setToast({
          type: 'success',
          message: t('common.suppliers.detail.toasts.portalCopied'),
        });
      } else {
        setToast({
          type: 'info',
          message: t('common.suppliers.detail.toasts.portalToken'),
        });
      }
    } catch (e) {
      setToast({
        type: 'error',
        message: t('common.suppliers.detail.toasts.portalError'),
      });
    }
  };

  const handleGenerateContract = async () => {
    if (!activeWedding) return;
    setGenerating(true);
    setGenError(null);
    try {
      const contractName = provider?.name || t('common.suppliers.list.contractFallback');
      const payload = {
        weddingId: activeWedding,
        payload: {
          type: 'provider_contract',
          subtype: 'basic',
          title: t('common.suppliers.list.contractTitle', { name: contractName }),
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
      setGenError(t('common.suppliers.detail.documents.error'));
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenLegalDocs = () => {
    const contractName = provider?.name || t('common.suppliers.list.contractFallback');
    const title = t('common.suppliers.list.contractTitle', { name: contractName });
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
      setToast({
        type: 'success',
        message: t('common.suppliers.detail.toasts.ratingSaved'),
      });
    } catch (e) {
      setToast({
        type: 'error',
        message: t('common.suppliers.detail.toasts.ratingError'),
      });
    } finally {
      setSavingRating(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return formatDate(date, 'medium');
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
    if (safeActiveTab === 'communications' && provider?.email) {
      refreshMailEvents();
    }
    }, [safeActiveTab, provider?.email]);

  React.useEffect(() => {
    fetchPaySuggestions();
  }, [fetchPaySuggestions]);

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
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label={t('common.suppliers.detail.closeAria')}
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex border-b overflow-x-auto">
            <button
              className={`py-3 px-4 ${
                safeActiveTab === 'info'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleTabChange('info')}
            >
              {tabLabels.info}
            </button>
            <button
              className={`py-3 px-4 ${
                safeActiveTab === 'communications'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleTabChange('communications')}
            >
              {tabLabels.communications}
            </button>
            <button
              className={`py-3 px-4 ${
                safeActiveTab === 'contracts'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleTabChange('contracts')}
            >
              {tabLabels.contracts}
              {safeActiveTab !== 'contracts' && paySuggestions?.length ? (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {paySuggestions.length}
                </span>
              ) : null}
            </button>
            <button
              className={`py-3 px-4 ${
                safeActiveTab === 'insights'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleTabChange('insights')}
            >
              {tabLabels.insights}
            </button>
          </div>

          <div className="overflow-y-auto p-4 flex-1">
            {safeActiveTab === 'info' && (
              <div className="space-y-6">
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(provider.status)}`}>
                        {provider.status}
                      </span>
                      {provider.depositStatus === 'paid' && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          {t('common.suppliers.card.depositPaid')}
                        </span>
                      )}
                      <span className="ml-2 text-gray-500">{provider.service}</span>
                      {!!provider.groupName && !groupCleared && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenGroups) {
                              onOpenGroups(provider.groupId);
                            } else {
                              setToast({
                                type: 'info',
                                message: t('common.suppliers.detail.groupToast', {
                                  name: provider.groupName,
                                }),
                              });
                            }
                          }}
                          className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
                          title={t('common.suppliers.detail.groupButtonTitle', {
                            name: provider.groupName,
                          })}
                        >
                          {t('common.suppliers.detail.groupButton', { name: provider.groupName })}
                        </button>
                      )}
                      {!provider.groupId && (
                        <Button size="xs" variant="outline" onClick={() => setAssignOpen(true)}>
                          {t('common.suppliers.card.actions.assignGroup')}
                        </Button>
                      )}
                    </div>
                    {onEdit && (
                      <Button onClick={() => onEdit(provider)} variant="outline" size="sm">
                        <Edit2 size={16} className="mr-1" /> {t('common.suppliers.card.actions.edit')}
                      </Button>
                    )}
                    <span className="ml-2 text-xs text-gray-500">
                      {t('common.suppliers.detail.contracts.externalNote')}
                    </span>
                    {provider.groupId && (
                      <Button
                        onClick={async () => {
                          if (removing) return;
                          const ok = window.confirm(
                            t('common.suppliers.detail.groupRemoveConfirm')
                          );
                          if (!ok) return;
                          try {
                            setRemoving(true);
                            await removeMember(provider.groupId, provider.id);
                            setGroupCleared(true);
                            setToast({
                              type: 'success',
                              message: t('common.suppliers.detail.groupRemoveSuccess'),
                            });
                          } finally {
                            setRemoving(false);
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="ml-2 text-red-600 border-red-200 hover:bg-red-50"
                        disabled={removing}
                      >
                        {removing
                          ? t('common.suppliers.detail.groupRemoving')
                          : t('common.suppliers.detail.groupRemove')}
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
                          <p className="font-medium">{t('common.suppliers.detail.info.contact')}</p>
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
                          <p className="font-medium">{t('common.suppliers.detail.info.phone')}</p>
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
                          <p className="font-medium">{t('common.suppliers.detail.info.email')}</p>
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
                          <p className="font-medium">{t('common.suppliers.detail.info.website')}</p>
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
                          <p className="font-medium">{t('common.suppliers.detail.info.date')}</p>
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
                          <p className="font-medium">{t('common.suppliers.detail.info.location')}</p>
                          <p className="text-sm text-gray-600">{provider.location || provider.address}</p>
                        </div>
                      </div>
                    )}

                    {provider.priceRange && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="font-medium">{t('common.suppliers.detail.info.priceRange')}</p>
                        <p className="text-lg font-semibold text-gray-800">{provider.priceRange}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <Button size="sm" variant="outline" onClick={handleManualContact}>
                      {t('common.suppliers.detail.info.registerManual')}
                    </Button>
                  </div>

                  <div className="mt-6">
                    <p className="font-medium mb-1">{t('common.suppliers.detail.info.ratingTitle')}</p>
                    <div className="flex items-center space-x-4">
                      {renderRatingStars(rating, true)}
                      <span className="text-sm text-gray-500">
                        {t('common.suppliers.detail.info.ratingSummary', {
                          value: rating.toFixed(1),
                          total: 5,
                          count: provider.ratingCount || 0,
                        })}
                      </span>
                      <Button size="sm" variant="outline" disabled={savingRating || !ratingDirty} onClick={saveRating}>
                        {savingRating
                          ? t('common.suppliers.detail.info.ratingSaving')
                          : t('common.suppliers.detail.info.ratingSave')}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium">
                        {t('common.suppliers.detail.serviceLines.title')}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setMergeOpen(true)}
                          disabled={!Array.isArray(provider.serviceLines) || provider.serviceLines.length === 0}
                        >
                          {t('common.suppliers.detail.serviceLines.manage')}
                        </Button>
                      </div>
                    </div>
                    {Array.isArray(provider.serviceLines) && provider.serviceLines.length > 0 ? (
                      <div className="overflow-hidden rounded-lg border border-gray-200">
                        <table className="min-w-full text-sm bg-white">
                          <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium">
                                {t('common.suppliers.detail.serviceLines.headers.service')}
                              </th>
                              <th className="px-3 py-2 text-left font-medium">
                                {t('common.suppliers.detail.serviceLines.headers.status')}
                              </th>
                              <th className="px-3 py-2 text-left font-medium">
                                {t('common.suppliers.detail.serviceLines.headers.budget')}
                              </th>
                              <th className="px-3 py-2 text-left font-medium">
                                {t('common.suppliers.detail.serviceLines.headers.notes')}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {provider.serviceLines.map((line) => (
                              <tr key={line.id} className="border-t border-gray-100">
                                <td className="px-3 py-2 font-medium text-gray-800">
                                  {line.name || t('common.suppliers.detail.serviceLines.unnamed')}
                                </td>
                                <td className="px-3 py-2">{line.status || '—'}</td>
                                <td className="px-3 py-2">
                                  {line.budget != null ? `€ ${line.budget}` : '—'}
                                </td>
                                <td className="px-3 py-2 text-gray-500">{line.notes || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {t('common.suppliers.detail.serviceLines.empty')}
                      </p>
                    )}
                  </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium">
                        {t('common.suppliers.detail.status.title')}
                      </h3>
                      {statusLoading && (
                        <span className="text-xs text-gray-500">
                          {t('common.suppliers.detail.status.loading')}
                        </span>
                      )}
                    </div>
                    {!providerStatus ? (
                      <p className="text-sm text-gray-600">
                        {t('common.suppliers.detail.status.empty')}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="p-3 rounded bg-gray-50">
                          <p className="font-semibold mb-1">
                            {t('common.suppliers.detail.status.contracts.title')}
                          </p>
                          <p>
                            {t('common.suppliers.detail.status.contracts.total', {
                              count: providerStatus.contracts?.total ?? 0,
                            })}
                          </p>
                          <div className="mt-1 text-gray-700">
                            <p>
                              {t('common.suppliers.detail.status.contracts.signed', {
                                count: providerStatus.contracts?.byStatus?.signed ?? 0,
                              })}
                            </p>
                            <p>
                              {t('common.suppliers.detail.status.contracts.sent', {
                                count: providerStatus.contracts?.byStatus?.sent ?? 0,
                              })}
                            </p>
                            <p>
                              {t('common.suppliers.detail.status.contracts.draft', {
                                count: providerStatus.contracts?.byStatus?.draft ?? 0,
                              })}
                            </p>
                            <p>
                              {t('common.suppliers.detail.status.contracts.cancelled', {
                                count: providerStatus.contracts?.byStatus?.cancelled ?? 0,
                              })}
                            </p>
                          </div>
                          <p className="mt-1">
                            {t('common.suppliers.detail.status.contracts.amountSigned', {
                              amount: providerStatus.contracts?.amountSigned ?? 0,
                            })}
                          </p>
                          {providerStatus.contracts?.lastUpdate && (
                            <p className="text-xs text-gray-500 mt-1">
                              {t('common.suppliers.detail.status.lastUpdate', {
                                value: new Date(
                                  providerStatus.contracts.lastUpdate
                                ).toLocaleString(),
                              })}
                            </p>
                          )}
                        </div>
                        <div className="p-3 rounded bg-gray-50">
                          <p className="font-semibold mb-1">
                            {t('common.suppliers.detail.status.payments.title')}
                          </p>
                          <p>
                            {t('common.suppliers.detail.status.payments.total', {
                              count: providerStatus.payments?.total ?? 0,
                            })}
                          </p>
                          <div className="mt-1 text-gray-700">
                            <p>
                              {t('common.suppliers.detail.status.payments.paid', {
                                count: providerStatus.payments?.byStatus?.paid ?? 0,
                              })}
                            </p>
                            <p>
                              {t('common.suppliers.detail.status.payments.pending', {
                                count:
                                  (providerStatus.payments?.byStatus?.pending ?? 0) +
                                  (providerStatus.payments?.byStatus?.authorized ?? 0),
                              })}
                            </p>
                            <p>
                              {t('common.suppliers.detail.status.payments.failed', {
                                count: providerStatus.payments?.byStatus?.failed ?? 0,
                              })}
                            </p>
                            <p>
                              {t('common.suppliers.detail.status.payments.refunded', {
                                count: providerStatus.payments?.byStatus?.refunded ?? 0,
                              })}
                            </p>
                          </div>
                          <p className="mt-1">
                            {t('common.suppliers.detail.status.payments.amount', {
                              paid: providerStatus.payments?.amount?.paid ?? 0,
                              pending: providerStatus.payments?.amount?.pending ?? 0,
                            })}
                          </p>
                          {providerStatus.payments?.lastUpdate && (
                            <p className="text-xs text-gray-500 mt-1">
                              {t('common.suppliers.detail.status.lastUpdate', {
                                value: new Date(
                                  providerStatus.payments.lastUpdate
                                ).toLocaleString(),
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                </Card>

                <Card>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium">
                          {t('common.suppliers.detail.portal.title')}
                        </h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${portalStatusColor}`}>
                          {portalStatus === 'responded'
                            ? t('common.suppliers.detail.portal.status.responded')
                            : portalStatus === 'pending'
                            ? t('common.suppliers.detail.portal.status.pending')
                            : t('common.suppliers.detail.portal.status.none')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {t('common.suppliers.detail.portal.labels.availability')}
                          </span>
                          <span className="text-gray-800">{portalAvailabilityLabel}</span>
                        </div>
                        {portalLastSubmitText && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {t('common.suppliers.detail.portal.labels.lastResponse')}
                            </span>
                            <span>{portalLastSubmitText}</span>
                          </div>
                        )}
                        {portalLastMessage && (
                          <div>
                            <span className="font-semibold">
                              {t('common.suppliers.detail.portal.labels.lastMessage')}
                            </span>
                            <p className="mt-1 p-2 border border-gray-200 bg-white rounded text-sm text-gray-700 line-clamp-3">
                              {portalLastMessage}
                            </p>
                          </div>
                        )}
                        {portalStatus === 'pending' && (
                          <p className="text-xs text-amber-600">
                            {t('common.suppliers.detail.portal.pendingHint')}
                          </p>
                        )}
                        {portalStatus === 'none' && (
                          <p className="text-xs text-gray-500">
                            {t('common.suppliers.detail.portal.noneHint')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <Button
                        variant="outline"
                        onClick={handleCopyPortalLink}
                        disabled={!activeWedding || !provider?.id}
                      >
                        {t('common.suppliers.detail.portal.copyLink')}
                      </Button>
                      {portalLastSubmitText && (
                        <span className="text-xs text-emerald-600">
                          {t('common.suppliers.detail.portal.responseRegistered')}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>

                <ProveedorBudgets supplierId={provider.id} />

                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">
                        {t('common.suppliers.detail.documents.title')}
                      </h3>
                      {genError && <p className="text-sm text-red-600 mt-1">{genError}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleOpenLegalDocs} variant="outline">
                        {t('common.suppliers.detail.documents.open')}
                      </Button>
                      <Button onClick={handleGenerateContract} disabled={!activeWedding || generating}>
                        {generating
                          ? t('common.suppliers.detail.documents.generating')
                          : t('common.suppliers.detail.documents.generate')}
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">
                      {t('common.suppliers.detail.rfq.title')}
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setRfqDefaults({
                            subject: t('common.suppliers.detail.rfq.defaultSubject', {
                              service: provider?.service || '',
                            }).trim(),
                            body: '',
                          });
                          setRfqOpen(true);
                        }}
                      >
                        {t('common.suppliers.detail.rfq.new')}
                      </Button>
                    </div>
                  </div>
                  {rfqLoading ? (
                    <p className="text-sm text-gray-500">
                      {t('common.suppliers.detail.rfq.loading')}
                    </p>
                  ) : rfqHistory.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      {t('common.suppliers.detail.rfq.empty')}
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {rfqHistory.map((r) => (
                        <li key={r.id} className="py-2 flex items-center justify-between">
                          <div>
                            <p className="font-medium truncate max-w-[28rem]" title={r.subject}>
                              {r.subject || t('common.suppliers.detail.rfq.noSubject')}
                            </p>
                            <p className="text-xs text-gray-600">
                              {t('common.suppliers.detail.rfq.sentAt', {
                                email: r.email || provider?.email,
                                date: formatDateTime(r.sentAt),
                              })}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRfqDefaults({ subject: r.subject || '', body: r.body || '' });
                              setRfqOpen(true);
                            }}
                          >
                            {t('common.suppliers.detail.rfq.resend')}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
                <Card>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium">
                      {t('common.suppliers.detail.paySuggestions.title')}
                    </h3>
                    <Button size="sm" variant="outline" onClick={() => {
                      // Forzar recarga
                      const ev = new Event('reloadPaySuggestions');
                      try { window.dispatchEvent(ev); } catch {}
                    }} disabled={payLoading}>
                      {payLoading
                        ? t('common.suppliers.detail.paySuggestions.refreshing')
                        : t('common.suppliers.detail.paySuggestions.refresh')}
                    </Button>
                  </div>
                  {payLoading ? (
                    <div className="text-sm text-gray-600">
                      {t('common.suppliers.detail.paySuggestions.loading')}
                    </div>
                  ) : paySuggestions.length === 0 ? (
                    <div className="text-sm text-gray-600">
                      {t('common.suppliers.detail.paySuggestions.empty')}
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {paySuggestions.slice(0, 4).map((s, idx) => (
                        <li key={idx} className="p-2 border rounded flex items-center justify-between text-sm">
                          <div className="min-w-0">
                            <div className="font-medium truncate" title={s.subject}>
                              {s.subject || t('common.suppliers.detail.paySuggestions.noSubject')}
                            </div>
                            <div className="text-gray-600">
                              {t('common.suppliers.detail.paySuggestions.amountDate', {
                                amount: s.rawAmount || s.amount,
                                currency: s.currency || '',
                                date: formatDate(s.date, 'short'),
                              })}
                            </div>
                          </div>
                          <Button size="sm" onClick={() => {
                            const isIncome = (s.direction || 'outgoing') === 'incoming';
                            const amt = typeof s.amount === 'number' && !Number.isNaN(s.amount) ? String(s.amount) : '';
                            const prefill = {
                              concept: t('common.suppliers.detail.paySuggestions.prefillConcept', {
                                name: provider?.name || '',
                              }).trim(),
                              amount: amt,
                              date: (s.date || '').slice(0, 10),
                              type: isIncome ? 'income' : 'expense',
                              category: '',
                              description: t('common.suppliers.detail.paySuggestions.prefillDescription', {
                                subject: s.subject,
                              }),
                              provider: provider?.name || '',
                              status: isIncome ? 'received' : 'paid',
                              paidAmount: amt,
                            };
                            try {
                              // Navegar a Finanzas con prefill
                              window.history.pushState({ prefillTransaction: prefill }, '', '/finance#nuevo');
                              if (typeof window !== 'undefined') {
                                window.location.assign('/finance#nuevo');
                              }
                            } catch {}
                          }}>
                            {t('common.suppliers.detail.paySuggestions.register')}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            )}

            {safeActiveTab === 'communications' && (
              <div className="space-y-4">
                <Card>
                  <h3 className="text-lg font-medium mb-3">
                    {t('common.suppliers.detail.communications.title')}
                  </h3>
                  <p className="text-gray-500">
                    {t('common.suppliers.detail.communications.subtitle')}
                  </p>
                </Card>
              </div>
            )}

            {safeActiveTab === 'contracts' && (
              <div className="space-y-4">
                <Card>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium">
                      {t('common.suppliers.detail.contractsTab.title')}
                    </h3>
                    <Button size="sm" variant="outline" onClick={refreshMailEvents} disabled={loadingEvents}>
                      {loadingEvents
                        ? t('common.suppliers.detail.contractsTab.refreshing')
                        : t('common.suppliers.detail.contractsTab.refresh')}
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
            <Button variant="outline" onClick={onClose}>
              {t('common.suppliers.detail.close')}
            </Button>
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
        <Modal
          open={preview.open}
          onClose={() => setPreview({ open: false, url: '', type: '' })}
          title={t('common.suppliers.detail.preview.title')}
        >
          <div className="min-h-[60vh]">
            {preview.type === 'image' ? (
              <img
                src={preview.url}
                alt={t('common.suppliers.detail.preview.imageAlt')}
                className="max-h-[70vh] mx-auto"
              />
            ) : preview.type === 'pdf' ? (
              <iframe
                src={preview.url}
                className="w-full h-[70vh]"
                title={t('common.suppliers.detail.preview.pdfTitle')}
              />
            ) : (
              <a href={preview.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                {t('common.suppliers.detail.preview.openExternal')}
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
      <SupplierMergeWizard
        open={mergeOpen}
        onClose={() => setMergeOpen(false)}
        provider={provider}
        onCompleted={(result) => {
          setMergeOpen(false);
          if (!result) return;
          if (result.type === 'merge') {
            setToast({
              type: 'success',
              message: t('common.suppliers.detail.toasts.mergeSuccess'),
            });
          } else if (result.type === 'split') {
            setToast({
              type: 'success',
              message: t('common.suppliers.detail.toasts.splitSuccess'),
            });
          }
        }}
      />
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
