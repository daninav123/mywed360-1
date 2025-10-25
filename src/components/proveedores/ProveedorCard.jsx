import { Eye, Edit2, Trash2, Calendar, Star, MapPin, Users, Globe } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import AssignSupplierToGroupModal from './AssignSupplierToGroupModal';
import ProveedorDetail from './ProveedorDetail';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import useProviderEmail from '../../hooks/useProviderEmail.jsx';
import useSupplierBudgets from '../../hooks/useSupplierBudgets';
import { useAuth } from '../../hooks/useAuth';
import { useWedding } from '../../context/WeddingContext';
import { formatDate } from '../../utils/formatUtils';
import * as EmailService from '../../services/emailService';
import EmailTemplateService from '../../services/EmailTemplateService';
import { loadTrackingRecords } from '../../services/EmailTrackingService';
import { useTranslations } from '../../hooks/useTranslations';

/**
 * @typedef {import('../../hooks/useProveedores').Provider} Provider
 */

/**
 * Componente que muestra la información de un proveedor en formato de tarjeta.
 * Incluye opciones para ver detalles, editar, eliminar y agendar una cita.
 *
 * @param {Object} props - Propiedades del componente
 * @param {Provider} props.provider - Daños del proveedor a mástrar
 * @param {boolean} props.isSelected - Indica si el proveedor está selecciónado
 * @param {Function} props.onToggleSelect - Función para alternar la selección del proveedor
 * @param {Function} props.onViewDetail - Función para ver detalles del proveedor
 * @param {Function} props.onEdit - Función para editar el proveedor
 * @param {Function} props.onDelete - Función para eliminar el proveedor
 * @param {Function} props.onReserve - Función para reservar una cita con el proveedor
 * @returns {React.ReactElement} Componente de tarjeta de proveedor
 */
const ProveedorCard = ({
  const { t } = useTranslations();

  provider,
  isSelected,
  onToggleSelect,
  onViewDetail,
  onEdit,
  onDelete,
  onReserve,
  onToggleFavorite,
  onCreateContract,
  onShowTracking,
  onOpenGroups,
  budgetsOverride,
  hasPending = false,
  appearance = 'default',
  disableInlineDetail = false,
}) => {
  const { userProfile } = useAuth();
  const {
    sendEmailToProvider,
    generateDefaultSubject,
    generateDefaultEmailBody,
    loading: sendingEmail,
    error: providerEmailError,
  } = useProviderEmail();
  const [showDetail, setShowDetail] = useState(false);
  const [detailTab, setDetailTab] = useState('info');
  const [tracking, setTracking] = useState(null);
  const [showAssign, setShowAssign] = useState(false);
  const [emails, setEmails] = useState([]);
  const [emailsOpen, setEmailsOpen] = useState(false);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [sendingAction, setSendingAction] = useState(null);
  const [autoMessage, setAutoMessage] = useState(null);
  const templateService = useMemo(() => new EmailTemplateService(), []);
  const { budgets = [] } = useSupplierBudgets(provider?.id);
  const budgetsToUse = Array.isArray(budgetsOverride) ? budgetsOverride : budgets;
  const cardAppearanceClasses = useMemo(() => {
    switch (appearance) {
      case 'tracking':
        return 'bg-white/80 border-dashed border-[var(--color-primary)]/40 backdrop-blur-sm';
      case 'confirmed':
        return 'bg-emerald-50 border-emerald-200';
      default:
        return '';
    }
  }, [appearance]);
  const pendingIndicatorClass = appearance === 'confirmed'
    ? 'bg-amber-500 shadow-amber-200'
    : 'bg-red-500 shadow-red-200';
  const budgetInfo = useMemo(() => {
    try {
      const list = Array.isArray(budgetsToUse) ? budgetsToUse : [];
      if (!list.length) return null;
      const pendingCount = list.filter((b) => b.status === 'pending').length;
      const accepted = list.find((b) => b.status === 'accepted');
      const latest = list[0];
      return { pendingCount, accepted, latest };
    } catch {
      return null;
    }
  }, [budgetsToUse]);

  const scoreValue = useMemo(() => {
    try {
      const raw = provider?.intelligentScore?.score;
      if (Number.isFinite(raw)) return Math.round(raw);
      if (Number.isFinite(provider?.aiMatch)) return Math.round(provider.aiMatch);
      if (Number.isFinite(provider?.match)) return Math.round(provider.match);
    } catch {}
    return null;
  }, [provider?.intelligentScore?.score, provider?.aiMatch, provider?.match]);

  const breakdown = provider?.intelligentScore?.breakdown || {};
  const matchValue = useMemo(() => {
    try {
      if (Number.isFinite(breakdown.match)) return Math.round(breakdown.match);
      if (Number.isFinite(provider?.aiMatch)) return Math.round(provider.aiMatch);
      if (Number.isFinite(provider?.match)) return Math.round(provider.match);
    } catch {}
    return null;
  }, [breakdown.match, provider?.aiMatch, provider?.match]);

  const experiencePercent = useMemo(() => {
    try {
      if (!Number.isFinite(breakdown.experienceScore)) return null;
      return Math.min(100, Math.round((breakdown.experienceScore / 20) * 100));
    } catch {
      return null;
    }
  }, [breakdown.experienceScore]);

  const responsePercent = useMemo(() => {
    try {
      if (!Number.isFinite(breakdown.responseScore)) return null;
      return Math.min(100, Math.round((breakdown.responseScore / 20) * 100));
    } catch {
      return null;
    }
  }, [breakdown.responseScore]);

  const portalStatus = useMemo(() => {
    if (provider?.portalLastSubmitAt) return 'responded';
    if (provider?.portalToken) return 'pending';
    return 'none';
  }, [provider?.portalLastSubmitAt, provider?.portalToken]);

  const portalStatusLabel = useMemo(() => {
    if (portalStatus === 'responded') return 'Portal respondido';
    if (portalStatus === 'pending') return 'Portal pendiente';
    return null;
  }, [portalStatus]);

  const refreshTracking = useCallback(() => {
    try {
      const list = loadTrackingRecords();
      const rec = (Array.isArray(list) ? list : []).find(
        (r) =>
          r.providerEmail &&
          provider?.email &&
          r.providerEmail.toLowerCase() === provider.email.toLowerCase()
      );
      setTracking(rec || null);
    } catch {}
  }, [provider?.email]);

  useEffect(() => {
    refreshTracking();
  }, [provider?.email, refreshTracking]);

  useEffect(() => {
    if (!autoMessage) return;
    const timer = setTimeout(() => setAutoMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [autoMessage]);

  // Cargar correos relacionados con este proveedor (por email o nombre)
  const fetchProviderEmails = useCallback(async () => {
    if (!provider) return [];
    const term = provider.email || provider.name || '';
    if (!term) return [];
    try {
      setEmailsLoading(true);
      const results = await EmailService.searchEmails(term);
      return Array.isArray(results) ? results : [];
    } catch {
      return [];
    } finally {
      setEmailsLoading(false);
    }
  }, [provider]);

  const lastAgo = useMemo(() => {
    try {
      const d = tracking?.lastEmailDate ? new Date(tracking.lastEmailDate) : null;
      if (!d || isNaN(d.getTime())) return null;
      const diffMs = Date.now() - d.getTime();
      const sec = Math.floor(diffMs / 1000);
      const min = Math.floor(sec / 60);
      const hrs = Math.floor(min / 60);
      const days = Math.floor(hrs / 24);
      if (days > 0) return `hace ${days} día${days !== 1 ? 's' : ''}`;
      if (hrs > 0) return `hace ${hrs} h`;
      if (min > 0) return `hace ${min} min`;
      return 'justo ahora';
    } catch {
      return null;
    }
  }, [tracking?.lastEmailDate]);

  const formatWeddingDate = useCallback((value) => {
    if (!value) return '';
    try {
      const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      return formatDate(date, 'medium');
    } catch {
      return '';
    }
  }, []);

  const handleCardClick = useCallback(() => {
    onViewDetail?.(provider);
    if (!disableInlineDetail) {
      setShowDetail(true);
    }
  }, [disableInlineDetail, onViewDetail, provider]);

  const formatTemplateToHtml = useCallback((text) => {
    if (!text) return '';
    const lines = String(text)
      .split('\n')
      .map((line) => line.trim());
    const blocks = [];
    let listItems = [];
    lines.forEach((line) => {
      if (!line) {
        if (listItems.length) {
          blocks.push(`<ul>${listItems.join('')}</ul>`);
          listItems = [];
        }
        return;
      }
      if (line.startsWith('-')) {
        listItems.push(`<li>${line.replace(/^-+\s*/, '')}</li>`);
      } else {
        if (listItems.length) {
          blocks.push(`<ul>${listItems.join('')}</ul>`);
          listItems = [];
        }
        blocks.push(`<p>${line}</p>`);
      }
    });
    if (listItems.length) {
      blocks.push(`<ul>${listItems.join('')}</ul>`);
    }
    return blocks.join('');
  }, []);

  const insertBeforeSignature = useCallback((html, extra) => {
    if (!html) return extra;
    const marker = '<p style="color:#888; font-size:12px;">';
    if (html.includes(marker)) {
      return html.replace(marker, `${extra}${marker}`);
    }
    return `${html}${extra}`;
  }, []);

  const buildAutomatedEmail = useCallback(
    (action) => {
      const displayDate = formatWeddingDate(
        userProfile?.weddingDate ||
          userProfile?.eventDate ||
          userProfile?.profileWeddingDate ||
          ''
      );
      const displayGuests =
        String(
          userProfile?.guestsTotal ||
            userProfile?.guestCount ||
            userProfile?.guests ||
            ''
        ) || '100';
      const displayName =
        userProfile?.name ||
        [userProfile?.brideFirstName, userProfile?.brideLastName].filter(Boolean).join(' ') ||
        userProfile?.displayName ||
        (userProfile?.email ? userProfile.email.split('@')[0] : 'Usuario');

      const templateData = {
        providerName: provider?.name || '',
        date: displayDate,
        userName: displayName,
        guests: displayGuests,
        location:
          provider?.location ||
          provider?.city ||
          userProfile?.weddingLocation ||
          userProfile?.city ||
          '',
        price:
          provider?.presupuesto != null
            ? `${provider.presupuesto} €`
            : provider?.budgetRange || provider?.pricing || provider?.price || '',
        aiInsight: provider?.aiSummary || provider?.notes || '',
        searchQuery:
          action === 'quote'
            ? 'Solicitud de presupuesto para boda'
            : 'Agendar reunion con proveedor de boda',
      };

      const category = provider?.service || 'general';
      const aiSubject = templateService.generateSubjectFromTemplate(category, templateData);
      const aiBody = templateService.generateBodyFromTemplate(category, templateData);
      const baseSubject =
        (aiSubject && aiSubject.trim()) || generateDefaultSubject(provider) || '';
      const baseBodyHtml = formatTemplateToHtml(aiBody);
      const appended =
        action === 'quote'
          ? '<p>Nos gustaria recibir un presupuesto detallado con tarifas, condiciones y disponibilidad para nuestra fecha.</p>'
          : '<p>Podemos coordinar una reunion (presencial o videollamada) para revisar el servicio y confirmar disponibilidad? Indicanos los horarios que mejor te encajen.</p>';
      const closing = '<p>Quedamos atentos a tu respuesta.</p>';

      let body = '';
      if (baseBodyHtml) {
        const signature =
          userProfile?.preferences?.emailSignature ||
          'Enviado automaticamente desde MaLoveApp';
        body = `${baseBodyHtml}${appended}${closing}<p style="color:#888; font-size:12px;">${signature}</p>`;
      } else {
        const fallback = generateDefaultEmailBody(provider) || '';
        body = insertBeforeSignature(fallback, `${appended}${closing}`);
      }

      const subject =
        action === 'quote'
          ? `Solicitud de presupuesto - ${provider?.name || provider?.service || baseSubject}`
          : `Solicitud de reunion - ${provider?.name || provider?.service || baseSubject}`;

      return { subject, body };
    },
    [
      formatWeddingDate,
      userProfile,
      provider,
      templateService,
      generateDefaultSubject,
      generateDefaultEmailBody,
      formatTemplateToHtml,
      insertBeforeSignature,
    ]
  );

  const handleAutoEmail = useCallback(
    async (action) => {
      if (!provider?.email) {
        setAutoMessage({
          type: 'error',
          text: 'Agrega un email de contacto al proveedor para enviar solicitudes automaticas.',
        });
        return;
      }
      setSendingAction(action);
      try {
        const { subject, body } = buildAutomatedEmail(action);
        const result = await sendEmailToProvider(provider, subject, body);
        templateService.logTemplateUsage(
          provider?.service || 'general',
          { id: provider?.id, name: provider?.name },
          false
        );
        if (result) {
          setAutoMessage({
            type: 'success',
            text:
              action === 'quote'
                ? 'Solicitud de presupuesto enviada automaticamente.'
                : 'Solicitud de cita enviada automaticamente.',
          });
          refreshTracking();
          if (emailsOpen) {
            const list = await fetchProviderEmails();
            setEmails(list);
          }
        } else {
          setAutoMessage({
            type: 'error',
            text:
              providerEmailError ||
              'No se pudo enviar el correo automatico. Intentalo nuevamente.',
          });
        }
      } catch (err) {
        setAutoMessage({
          type: 'error',
          text: err?.message || 'No se pudo enviar el correo automatico.',
        });
      } finally {
        setSendingAction(null);
      }
    },
    [
      provider,
      buildAutomatedEmail,
      sendEmailToProvider,
      templateService,
      providerEmailError,
      refreshTracking,
      emailsOpen,
      fetchProviderEmails,
    ]
  );
  // Función para mástrar estrellas de calificación
  const renderRating = (rating, count) => {
    const stars = [];
    const actualRating = count > 0 ? rating / count : 0;

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={`${i <= actualRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
        />
      );
    }

    return (
      <div className="flex itemás-center">
        {stars}
        {count > 0 && <span className="ml-1 text-xs text-gray-500">({count})</span>}
      </div>
    );
  };

  // Color según estado del proveedor
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

  return (
    <>
      <Card
        className={`relative transition-all cursor-pointer ${cardAppearanceClasses} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        onClick={handleCardClick}
      >
        {/* Botón favorito */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(provider.id);
          }}
          className="absolute top-2 left-2 text-yellow-400 hover:scale-110 transition-transform"
          title={provider.favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
        >
          <Star
            size={18}
            className={provider.favorite ? 'fill-yellow-400' : 'fill-none stroke-2'}
          />
        </button>

        {hasPending ? (
          <span
            className={`absolute top-3 right-10 h-2.5 w-2.5 rounded-full shadow-inner ${pendingIndicatorClass}`}
            title="Pendiente de revisar"
          ></span>
        ) : null}

        {/* Checkbox para selección */}
        <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        </div>

        {/* Imagen de proveedor si existe */}
        {provider.image && (
          <div className="w-full h-32 overflow-hidden rounded-t-lg mb-2">
            <img src={provider.image} alt={provider.name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Información principal */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold line-clamp-1">{provider.name}</h3>
            {Number.isFinite(scoreValue) && (
              <span
                className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold whitespace-nowrap"
                title={t('common.puntuacion_consolidada')}
              >
                Score {scoreValue}
              </span>
            )}
          </div>

          {(matchValue != null || experiencePercent != null || responsePercent != null) && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
              {matchValue != null && (
                <span>
                  Match IA:{' '}
                  <span className="font-semibold text-gray-800">{matchValue}%</span>
                </span>
              )}
              {experiencePercent != null && (
                <span>
                  Experiencia:{' '}
                  <span className="font-semibold text-gray-800">{experiencePercent}%</span>
                </span>
              )}
              {responsePercent != null && (
                <span>
                  Agilidad:{' '}
                  <span className="font-semibold text-gray-800">{responsePercent}%</span>
                </span>
              )}
            </div>
          )}

          {portalStatus !== 'none' && portalStatusLabel && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <Globe
                size={12}
                className={portalStatus === 'responded' ? 'text-emerald-600' : 'text-indigo-500'}
              />
              <span
                className={
                  portalStatus === 'responded' ? 'text-emerald-700 font-medium' : 'text-indigo-600'
                }
              >
                {portalStatusLabel}
              </span>
            </div>
          )}

          <div className="mt-1 mb-3 flex itemás-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(provider.status)}`}>
              {provider.status}
            </span>
            <span className="text-sm font-medium text-gray-500">{provider.service}</span>
            {provider.groupName && (
              <span
                className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 inline-flex itemás-center gap-1"
                title={`Grupo: ${provider.groupName}`}
              >
                <Users size={12} /> {provider.groupName}
              </span>
            )}
            {budgetInfo && (
              <span
                className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 inline-flex itemás-center gap-1"
                title={budgetInfo.accepted
                  ? `Presupuesto aceptado: ${budgetInfo.accepted?.amount ?? '-'} ${budgetInfo.accepted?.currency || ''}`
                  : budgetInfo.latest
                    ? `Último presupuesto: ${budgetInfo.latest?.amount ?? '-'} ${budgetInfo.latest?.currency || ''}`
                    : 'Presupuesto'}
              >
                {budgetInfo.accepted
                  ? 'Presupuesto aceptado'
                  : budgetInfo.pendingCount > 0
                    ? `Presupuesto pendiente (${budgetInfo.pendingCount})`
                    : 'Presupuesto recibido'}
              </span>
            )}
          </div>

          {provider.contact && (
            <p className="text-sm text-gray-600 mb-1">Contacto: {provider.contact}</p>
          )}

          {provider.phone && <p className="text-sm text-gray-600 mb-1">Tel: {provider.phone}</p>}

          {provider.email && (
            <p className="text-sm text-gray-600 mb-1 truncate">{provider.email}</p>
          )}

          {(provider.website || provider.link) && (
            <a
              href={provider.website || provider.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline block truncate mb-1"
              onClick={(e) => e.stopPropagation()}
            >
              {(provider.website || provider.link).replace(/^https?:\/\//, '').split('/')[0]}
            </a>
          )}

          {provider.priceRange && (
            <p className="text-sm font-medium mt-1">Precio: {provider.priceRange}</p>
          )}

          {provider.depositStatus === 'paid' && (
            <span className="inline-flex itemás-center mt-2 text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded">
              Señal pagada
            </span>
          )}

          {(provider.location || provider.address) && (
            <div className="flex itemás-center mt-1 text-sm text-gray-600">
              <MapPin size={14} className="mr-1 text-gray-400" />
              <span className="truncate">{provider.location || provider.address}</span>
            </div>
          )}

          {/* Fecha */}
          {provider.date && (
            <div className="flex itemás-center mt-2 mb-2">
              <Calendar size={14} className="mr-1 text-gray-400" />
              <span className="text-sm text-gray-600">{provider.date}</span>
            </div>
          )}

          {/* Calificación */}
          <div className="mt-2">{renderRating(provider.rating, provider.ratingCount)}</div>

          {/* Extracto o descripción corta */}
          {provider.snippet && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">{provider.snippet}</p>
          )}
        </div>

        {/* Acciones */}
        <div
          className="border-t border-gray-100 p-3 bg-gray-50 rounded-b-lg flex flex-wrap itemás-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            onClick={() => {
              if (onViewDetail) onViewDetail(provider);
              if (!disableInlineDetail) setShowDetail(true);
            }}
            variant="ghost"
            size="sm"
            className="flex-1"
          >
            <Eye size={16} className="mr-1" /> Ver
          </Button>

          <Button
            onClick={() => handleAutoEmail('quote')}
            variant="outline"
            size="sm"
            className="flex-1 min-w-[180px]"
            disabled={sendingEmail || !!sendingAction}
          >
            {sendingEmail && sendingAction === 'quote' ? 'Enviando...' : 'Solicitar presupuesto'}
          </Button>
          <Button
            onClick={() => handleAutoEmail('meeting')}
            variant="outline"
            size="sm"
            className="flex-1 min-w-[170px]"
            disabled={sendingEmail || !!sendingAction}
          >
            {sendingEmail && sendingAction === 'meeting' ? 'Enviando...' : 'Pedir cita'}
          </Button>

          {/* Contratos se gestionan en la plataforma del proveedor */}

          {onEdit && (
            <Button
              onClick={() => onEdit?.(provider)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Edit2 size={16} className="mr-1" /> Editar
            </Button>
          )}

          {budgetInfo && (
            <Button
              onClick={() => {
                setDetailTab('info');
                setShowDetail(true);
              }}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Ver presupuesto
            </Button>
          )}

          {!provider.groupId && (
            <Button
              onClick={() => setShowAssign(true)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Asignar a grupo
            </Button>
          )}

          {onDelete && (
            <Button
              onClick={() => onDelete?.(provider.id)}
              variant="outline"
              size="sm"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 size={16} className="mr-1" /> Eliminar
            </Button>
          )}

          {onReserve && (
            <Button
              onClick={() => onReserve?.(provider)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Calendar size={16} className="mr-1" /> Reservar
            </Button>
          )}
        </div>

        {autoMessage && (
          <div className="px-3 pb-3 w-full" onClick={(e) => e.stopPropagation()}>
            <Alert type={autoMessage.type} className="text-sm">
              {autoMessage.text}
            </Alert>
          </div>
        )}

        {tracking && (
          <div className="w-full text-xs text-gray-600 mt-1 flex itemás-center gap-2 flex-wrap">
            <span>Seguimiento: {tracking.status || '-'}</span>
            <span>Último: {lastAgo || '-'}</span>
            <span>Hilo: {(tracking.thread || []).length}</span>
            <a
              href="/email/inbox"
              className="ml-auto text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
              title="Abrir bandeja de entrada"
            >
              Ver correo
            </a>
            {typeof onShowTracking === 'function' && (
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  try {
                    onShowTracking({
                      id: tracking.id || provider.id,
                      providerId: provider.id,
                      providerName: provider.name,
                      subject: tracking.subject || `Mensaje para ${provider.name}`,
                      status: tracking.status || 'pendiente',
                      sentAt: tracking.lastEmailDate || new Date().toISOString(),
                      lastUpdated: tracking.lastEmailDate || new Date().toISOString(),
                      openCount: tracking.openCount || 0,
                      recipientEmail: tracking.providerEmail || provider.email || '',
                    });
                  } catch {
                    onShowTracking(null);
                  }
                }}
                title="Ver detalles de seguimiento"
              >
                Detalles
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Correos relacionados con este proveedor */}
      <div className="mt-1">
        <button
          type="button"
          className="text-xs text-blue-600 hover:underline"
          onClick={async (e) => {
            e.stopPropagation();
            setEmailsOpen((v) => !v);
            if (!emailsOpen && emails.length === 0) {
              const list = await fetchProviderEmails();
              setEmails(list);
            }
          }}
          title="Ver correos relacionados"
        >
          {emailsOpen ? 'Ocultar correos' : `Correos relacionados (${emails.length || 0})`}
        </button>
        {emailsOpen && (
          <div className="mt-1 border rounded p-2 bg-white/50 max-h-40 overflow-auto text-xs">
            {emailsLoading ? (
              <div className="text-gray-500">Cargando correos...</div>
            ) : emails.length === 0 ? (
              <div className="text-gray-500">Sin correos relacionados</div>
            ) : (
              <ul className="space-y-1">
                {emails.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2">
                    <span className="truncate" title={m.subject}>{m.subject || '(Sin asunto)'}</span>
                    <span className="text-gray-500 whitespace-nowrap">{formatDate(m.date, 'short')}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 text-right">
              <a
                href={`/email/inbox?search=${encodeURIComponent(provider.email || provider.name || '')}`}
                className="text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Abrir en buzón
              </a>
            </div>
          </div>
        )}
      </div>

      {!disableInlineDetail && showDetail && (
        <ProveedorDetail
          provider={provider}
          onClose={() => setShowDetail(false)}
          onEdit={onEdit}
          activeTab={detailTab}
          setActiveTab={setDetailTab}
          onOpenGroups={onOpenGroups}
        />
      )}
      {showAssign && (
        <AssignSupplierToGroupModal
          open={showAssign}
          onClose={() => setShowAssign(false)}
          provider={provider}
        />
      )}
    </>
  );
};

// Utilizar React.memo para evitar renderizaños innecesarios cuando las props no cambian
export default React.memo(ProveedorCard, (prevProps, nextProps) => {
  // Comparación personalizada para determinar si las props han cambiado
  // Solo re-renderiza si alguna de estas propiedades ha cambiado
  return (
    prevProps.provider.id === nextProps.provider.id &&
    prevProps.provider.name === nextProps.provider.name &&
    prevProps.provider.service === nextProps.provider.service &&
    prevProps.provider.status === nextProps.provider.status &&
    prevProps.provider.date === nextProps.provider.date &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.appearance === nextProps.appearance &&
    prevProps.hasPending === nextProps.hasPending
  );
});
