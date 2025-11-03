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
import useTranslations from '../../hooks/useTranslations';
import * as EmailService from '../../services/emailService';
import EmailTemplateService from '../../services/EmailTemplateService';
import { loadTrackingRecords } from '../../services/EmailTrackingService';

const STATUS_KEY_MAP = {
  confirmado: 'confirmed',
  confirmed: 'confirmed',
  contactado: 'contacted',
  contacted: 'contacted',
  seleccionado: 'selected',
  selected: 'selected',
  rechazado: 'rejected',
  rejected: 'rejected',
  descartado: 'discarded',
  discarded: 'discarded',
  pendiente: 'pending',
  pending: 'pending',
  nuevo: 'new',
  new: 'new',
};

const STATUS_COLOR_CLASSES = {
  confirmed: 'bg-green-100 text-green-800',
  contacted: 'bg-blue-100 text-blue-800',
  selected: 'bg-purple-100 text-purple-800',
  rejected: 'bg-red-100 text-red-800',
  discarded: 'bg-red-100 text-red-800',
  pending: 'bg-amber-100 text-amber-800',
  new: 'bg-gray-100 text-gray-800',
  unknown: 'bg-gray-100 text-gray-800',
};

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
  const { t, format } = useTranslations();
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
  const currency = provider?.currency || 'EUR';
  const notAvailable = t('suppliers.card.shared.notAvailable');
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
  const formatBudgetAmount = useCallback(
    (budget) => {
      if (!budget) return notAvailable;
      const amountNumber = Number(budget.amount);
      if (Number.isFinite(amountNumber)) {
        return format.currency(amountNumber, budget.currency || currency);
      }
      return budget.amount || notAvailable;
    },
    [currency, format, notAvailable]
  );
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
  const statusMeta = useMemo(() => {
    const raw = String(provider?.status || '').trim();
    const normalized =
      STATUS_KEY_MAP[raw.toLowerCase()] ||
      (raw ? 'unknown' : 'unknown');
    const label =
      normalized === 'unknown'
        ? raw || t('suppliers.card.statusLabels.unknown')
        : t(`common.suppliers.card.statusLabels.${normalized}`);
    return {
      label,
      colorClass: STATUS_COLOR_CLASSES[normalized] || STATUS_COLOR_CLASSES.unknown,
    };
  }, [provider?.status, t]);

  const portalStatus = useMemo(() => {
    if (provider?.portalLastSubmitAt) return 'responded';
    if (provider?.portalToken) return 'pending';
    return 'none';
  }, [provider?.portalLastSubmitAt, provider?.portalToken]);

  const portalStatusLabel = useMemo(() => {
    if (portalStatus === 'responded') return t('suppliers.card.portal.responded');
    if (portalStatus === 'pending') return t('suppliers.card.portal.pending');
    return null;
  }, [portalStatus, t]);

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
      if (!d || Number.isNaN(d.getTime())) return null;
      const diffMs = Date.now() - d.getTime();
      const sec = Math.floor(diffMs / 1000);
      const min = Math.floor(sec / 60);
      const hrs = Math.floor(min / 60);
      const days = Math.floor(hrs / 24);
      if (days > 0) {
        return t('suppliers.card.tracking.lastAgo.days', { count: days });
      }
      if (hrs > 0) {
        return t('suppliers.card.tracking.lastAgo.hours', { count: hrs });
      }
      if (min > 0) {
        return t('suppliers.card.tracking.lastAgo.minutes', { count: min });
      }
      return t('suppliers.card.tracking.lastAgo.justNow');
    } catch {
      return null;
    }
  }, [t, tracking?.lastEmailDate]);

  const formatWeddingDate = useCallback(
    (value) => {
      if (!value) return '';
      try {
        const date =
          typeof value?.toDate === 'function'
            ? value.toDate()
            : value instanceof Date
              ? value
              : new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return format.date(date);
      } catch {
        return '';
      }
    },
    [format]
  );
  const formatEmailDate = useCallback(
    (value) => {
      if (!value) return '';
      try {
        const date =
          typeof value?.toDate === 'function'
            ? value.toDate()
            : value instanceof Date
              ? value
              : new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return typeof format.dateShort === 'function'
          ? format.dateShort(date)
          : format.date(date, { month: 'short', day: 'numeric' });
      } catch {
        return '';
      }
    },
    [format]
  );

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
        ) || t('suppliers.card.autoEmail.guestsFallback');
      const displayName =
        userProfile?.name ||
        [userProfile?.brideFirstName, userProfile?.brideLastName].filter(Boolean).join(' ') ||
        userProfile?.displayName ||
        (userProfile?.email
          ? userProfile.email.split('@')[0]
          : t('suppliers.card.autoEmail.userFallback'));
      const numericBudget = Number(provider?.presupuesto);
      const priceValue = Number.isFinite(numericBudget)
        ? format.currency(numericBudget, currency)
        : provider?.budgetRange || provider?.pricing || provider?.price || '';
      const searchQuery =
        action === 'quote'
          ? t('suppliers.card.autoEmail.searchQuery.quote')
          : t('suppliers.card.autoEmail.searchQuery.meeting');

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
        price: priceValue,
        aiInsight: provider?.aiSummary || provider?.notes || '',
        searchQuery,
      };

      const category = provider?.service || 'general';
      const aiSubject = templateService.generateSubjectFromTemplate(category, templateData);
      const aiBody = templateService.generateBodyFromTemplate(category, templateData);
      const baseSubject =
        (aiSubject && aiSubject.trim()) || generateDefaultSubject(provider) || '';
      const baseBodyHtml = formatTemplateToHtml(aiBody);
      const appendedText =
        action === 'quote'
          ? t('suppliers.card.autoEmail.appendedQuote')
          : t('suppliers.card.autoEmail.appendedMeeting');
      const appended = `<p>${appendedText}</p>`;
      const closing = `<p>${t('suppliers.card.autoEmail.closing')}</p>`;

      let body = '';
      if (baseBodyHtml) {
        const signature =
          userProfile?.preferences?.emailSignature ||
          t('suppliers.card.autoEmail.signature');
        body = `${baseBodyHtml}${appended}${closing}<p style="color:#888; font-size:12px;">${signature}</p>`;
      } else {
        const fallback = generateDefaultEmailBody(provider) || '';
        body = insertBeforeSignature(fallback, `${appended}${closing}`);
      }

      const target = provider?.name || provider?.service || baseSubject;
      const subject =
        action === 'quote'
          ? t('suppliers.card.autoEmail.subjectQuote', { target })
          : t('suppliers.card.autoEmail.subjectMeeting', { target });

      return { subject, body };
    },
    [
      formatWeddingDate,
      userProfile,
      provider,
      currency,
      templateService,
      generateDefaultSubject,
      generateDefaultEmailBody,
      formatTemplateToHtml,
      insertBeforeSignature,
      format,
      t,
    ]
  );

  const handleAutoEmail = useCallback(
    async (action) => {
      if (!provider?.email) {
        setAutoMessage({
          type: 'error',
          text: t('suppliers.card.autoEmail.missingEmail'),
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
                ? t('suppliers.card.autoEmail.successQuote')
                : t('suppliers.card.autoEmail.successMeeting'),
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
              t('suppliers.card.autoEmail.sendErrorRetry'),
          });
        }
      } catch (err) {
        setAutoMessage({
          type: 'error',
          text: err?.message || t('suppliers.card.autoEmail.sendError'),
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
      t,
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
      <div className="flex items-center">
        {stars}
        {count > 0 && (
          <span className="ml-1 text-xs text-gray-500">
            {t('suppliers.card.rating.count', { count })}
          </span>
        )}
      </div>
    );
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
          title={
            provider.favorite
              ? t('suppliers.card.favorite.remove')
              : t('suppliers.card.favorite.add')
          }
        >
          <Star
            size={18}
            className={provider.favorite ? 'fill-yellow-400' : 'fill-none stroke-2'}
          />
        </button>

        {hasPending ? (
          <span
            className={`absolute top-3 right-10 h-2.5 w-2.5 rounded-full shadow-inner ${pendingIndicatorClass}`}
            title={t('suppliers.card.pendingTooltip')}
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
            <h3 className="text-lg font-semibold line-clamp-1">
              {provider?.name ||
                provider?.nombre ||
                t('suppliers.card.nameFallback')}
            </h3>
            {Number.isFinite(scoreValue) && (
              <span
                className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold whitespace-nowrap"
                title={t('suppliers.card.scoreTooltip')}
              >
                {t('suppliers.card.scoreLabel', { value: scoreValue })}
              </span>
            )}
          </div>

          {(matchValue != null || experiencePercent != null || responsePercent != null) && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
              {matchValue != null && (
                <span>
                  {t('suppliers.card.metrics.matchLabel')}{' '}
                  <span className="font-semibold text-gray-800">
                    {t('suppliers.card.metrics.percent', { value: matchValue })}
                  </span>
                </span>
              )}
              {experiencePercent != null && (
                <span>
                  {t('suppliers.card.metrics.experienceLabel')}{' '}
                  <span className="font-semibold text-gray-800">
                    {t('suppliers.card.metrics.percent', { value: experiencePercent })}
                  </span>
                </span>
              )}
              {responsePercent != null && (
                <span>
                  {t('suppliers.card.metrics.responseLabel')}{' '}
                  <span className="font-semibold text-gray-800">
                    {t('suppliers.card.metrics.percent', { value: responsePercent })}
                  </span>
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

          <div className="mt-1 mb-3 flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded-full ${statusMeta.colorClass}`}>
              {statusMeta.label}
            </span>
            <span className="text-sm font-medium text-gray-500">
              {provider?.service ||
                provider?.servicio ||
                t('suppliers.card.serviceFallback')}
            </span>
            {provider.groupName && (
              <span
                className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 inline-flex items-center gap-1"
                title={t('suppliers.card.groupTooltip', { name: provider.groupName })}
              >
                <Users size={12} /> {provider.groupName}
              </span>
            )}
            {budgetInfo && (
              <span
                className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 inline-flex items-center gap-1"
                title={
                  budgetInfo.accepted
                    ? t('suppliers.card.budget.acceptedTooltip', {
                        amount: formatBudgetAmount(budgetInfo.accepted),
                      })
                    : budgetInfo.latest
                    ? t('suppliers.card.budget.latestTooltip', {
                        amount: formatBudgetAmount(budgetInfo.latest),
                      })
                    : t('suppliers.card.budget.genericTooltip')
                }
              >
                {budgetInfo.accepted
                  ? t('suppliers.card.budget.accepted')
                  : budgetInfo.pendingCount > 0
                  ? t('suppliers.card.budget.pending', { count: budgetInfo.pendingCount })
                  : t('suppliers.card.budget.received')}
              </span>
            )}
          </div>

          {provider.contact && (
            <p className="text-sm text-gray-600 mb-1">
              {t('suppliers.card.contactLabel', { value: provider.contact })}
            </p>
          )}

          {provider.phone && (
            <p className="text-sm text-gray-600 mb-1">
              {t('suppliers.card.phoneLabel', { value: provider.phone })}
            </p>
          )}

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
            <p className="text-sm font-medium mt-1">
              {t('suppliers.card.priceLabel', { value: provider.priceRange })}
            </p>
          )}

          {provider.depositStatus === 'paid' && (
            <span className="inline-flex items-center mt-2 text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded">
              {t('suppliers.card.depositPaid')}
            </span>
          )}

          {(provider.location || provider.address) && (
            <div className="flex items-center mt-1 text-sm text-gray-600">
              <MapPin size={14} className="mr-1 text-gray-400" />
              <span className="truncate">{provider.location || provider.address}</span>
            </div>
          )}

          {/* Fecha */}
          {provider.date && (
            <div className="flex items-center mt-2 mb-2">
              <Calendar size={14} className="mr-1 text-gray-400" />
              <span className="text-sm text-gray-600">
                {t('suppliers.card.dateLabel', { value: provider.date })}
              </span>
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
          className="border-t border-gray-100 p-3 bg-gray-50 rounded-b-lg flex flex-wrap items-center gap-2"
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
            <Eye size={16} className="mr-1" /> {t('suppliers.card.actions.view')}
          </Button>

          <Button
            onClick={() => handleAutoEmail('quote')}
            variant="outline"
            size="sm"
            className="flex-1 min-w-[180px]"
            disabled={sendingEmail || !!sendingAction}
          >
            {sendingEmail && sendingAction === 'quote'
              ? t('suppliers.card.autoEmail.sending')
              : t('suppliers.card.actions.requestQuote')}
          </Button>
          <Button
            onClick={() => handleAutoEmail('meeting')}
            variant="outline"
            size="sm"
            className="flex-1 min-w-[170px]"
            disabled={sendingEmail || !!sendingAction}
          >
            {sendingEmail && sendingAction === 'meeting'
              ? t('suppliers.card.autoEmail.sending')
              : t('suppliers.card.actions.requestMeeting')}
          </Button>

          {/* Contratos se gestionan en la plataforma del proveedor */}

          {onEdit && (
            <Button
              onClick={() => onEdit?.(provider)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Edit2 size={16} className="mr-1" /> {t('suppliers.card.actions.edit')}
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
              {t('suppliers.card.actions.viewBudget')}
            </Button>
          )}

          {!provider.groupId && (
            <Button
              onClick={() => setShowAssign(true)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {t('suppliers.card.actions.assignGroup')}
            </Button>
          )}

          {onDelete && (
            <Button
              onClick={() => onDelete?.(provider.id)}
              variant="outline"
              size="sm"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 size={16} className="mr-1" /> {t('suppliers.card.actions.delete')}
            </Button>
          )}

          {onReserve && (
            <Button
              onClick={() => onReserve?.(provider)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Calendar size={16} className="mr-1" /> {t('suppliers.card.actions.reserve')}
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
          <div className="w-full text-xs text-gray-600 mt-1 flex items-center gap-2 flex-wrap">
            <span>
              {t('suppliers.card.tracking.status', { status: tracking.status || '-' })}
            </span>
            <span>
              {t('suppliers.card.tracking.last', { value: lastAgo || '-' })}
            </span>
            <span>
              {t('suppliers.card.tracking.thread', {
                count: (tracking.thread || []).length,
              })}
            </span>
            <a
              href="/email/inbox"
              className="ml-auto text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
              title={t('suppliers.card.tracking.openInboxTitle')}
            >
              {t('suppliers.card.tracking.openInbox')}
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
                      subject:
                        tracking.subject ||
                        t('suppliers.card.tracking.defaultSubject', {
                          name: provider.name,
                        }),
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
                title={t('suppliers.card.tracking.detailsTitle')}
              >
                {t('suppliers.card.tracking.details')}
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
          title={t('suppliers.card.emails.toggleTitle')}
        >
          {emailsOpen
            ? t('suppliers.card.emails.hide')
            : t('suppliers.card.emails.show', { count: emails.length || 0 })}
        </button>
        {emailsOpen && (
          <div className="mt-1 border rounded p-2 bg-white/50 max-h-40 overflow-auto text-xs">
            {emailsLoading ? (
              <div className="text-gray-500">
                {t('suppliers.card.emails.loading')}
              </div>
            ) : emails.length === 0 ? (
              <div className="text-gray-500">
                {t('suppliers.card.emails.empty')}
              </div>
            ) : (
              <ul className="space-y-1">
                {emails.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2">
                    <span className="truncate" title={m.subject}>
                      {m.subject || t('suppliers.card.emails.noSubject')}
                    </span>
                    <span className="text-gray-500 whitespace-nowrap">
                      {formatEmailDate(m.date) || notAvailable}
                    </span>
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
                {t('suppliers.card.emails.openInbox')}
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
