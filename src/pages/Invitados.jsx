import React, { useState } from 'react';

import ContactsImporter from '../components/guests/ContactsImporter';
import GuestBulkGrid from '../components/guests/GuestBulkGrid';
import GuestFilters from '../components/guests/GuestFilters';
import GuestForm from '../components/guests/GuestForm';
import PageWrapper from '../components/PageWrapper';
import PageTabs from '../components/ui/PageTabs';
import { formatDate } from '../utils/formatUtils';
import { Button, Input } from '../components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import SaveTheDateModal from '../components/whatsapp/SaveTheDateModal';
import WhatsAppModal from '../components/whatsapp/WhatsAppModal';
import FormalInvitationModal from '../components/whatsapp/FormalInvitationModal';
import WhatsAppSender from '../components/whatsapp/WhatsAppSender';
import { useWedding } from '../context/WeddingContext';
import useActiveWeddingInfo from '../hooks/useActiveWeddingInfo';
import { useAuth } from '../hooks/useAuth';
import useGuests from '../hooks/useGuests';
import useTranslations from '../hooks/useTranslations';
import { post as apiPost } from '../services/apiClient';
import { renderInviteMessage } from '../services/MessageTemplateService';
import { createInvitationPrintBatch } from '../services/printService';
import { toE164, schedule as scheduleWhats } from '../services/whatsappService';

/**
 * Página de gestión de invitados completamente refactorizada
 * Arquitectura modular, optimizada y mantenible
 *
 * OPTIMIZACIONES IMPLEMENTADAS:
 * - Eliminada complejidad anterior (597 líneas �  140 líneas)
 * - Arquitectura modular con componentes especializados
 * - Hook personalizado useGuests para lógica centralizada
 * - Memoización y optimización de re-renders
 * - Integración con sistema i18n
 * - UX mejorada con atajos y paneles dedicados
 */
function Invitados() {
  // Detectar si estamos en modo test
  const isTestMode = typeof window !== 'undefined' && (window.Cypress || window.__MALOVEAPP_TEST_MODE__);
  
  // Estados para modales
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [showWhatsModal, setShowWhatsModal] = useState(false);
  const [showSaveTheDate, setShowSaveTheDate] = useState(false);
  const [showWhatsBatch, setShowWhatsBatch] = useState(false);
  const [showFormalInvitation, setShowFormalInvitation] = useState(false);
  const [whatsGuest, setWhatsGuest] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInInput, setCheckInInput] = useState('');
  const [checkInGuest, setCheckInGuest] = useState(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const videoRef = React.useRef(null);
  const scanIntervalRef = React.useRef(null);

  // Hooks reales
  const { t } = useTranslations();
  const { currentUser } = useAuth();
  const { weddings, activeWedding } = useWedding();
  const { info: activeWeddingInfo } = useActiveWeddingInfo();

  // Datos provenientes de Firebase mediante hooks
  const {
    guests,
    stats,
    filters,
    isLoading,
    addGuest,
    updateGuest,
    removeGuest,
    inviteViaWhatsApp,
    inviteViaWhatsAppApi,
    inviteViaWhatsAppDeeplinkCustom,
    inviteSelectedWhatsAppApi,
    inviteSelectedWhatsAppDeeplink,
    inviteSelectedWhatsAppViaExtension,
    inviteSelectedWhatsAppBroadcastViaExtension,
    inviteViaEmail,
    bulkInviteWhatsAppApi,
    importFromContacts,
    updateFilters,
    markGuestCheckIn,
    markGuestCheckOut,
    loadSampleGuests,
    utils,
    findGuestByCheckInCode,
  } = useGuests();

  const notify = React.useCallback((message, type = 'info') => {
    if (!message || typeof window === 'undefined') return;
    try {
      const toast = window.toast;
      if (toast && typeof toast[type] === 'function') {
        toast[type](message);
        return;
      }
      if (typeof toast === 'function') {
        toast(message, type);
        return;
      }
      if (typeof window.alert === 'function') {
        window.alert(message);
      }
    } catch {
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(message);
      }
    }
  }, []);

  // Mensaje por defecto para SAVE THE DATE
  const { saveTheDateMessage, coupleLabel } = React.useMemo(() => {
    try {
      const wi = activeWeddingInfo?.weddingInfo || {};
      const wList = (weddings || []).find((x) => x.id === activeWedding) || {};

      let p1 = '',
        p2 = '';
      const coupleRaw =
        wi.coupleName ||
        wList.coupleName ||
        wList.name ||
        wi.brideAndGroom ||
        wList.brideAndGroom ||
        wi.nombrePareja ||
        '';
      if (coupleRaw) {
        const parts = String(coupleRaw)
          .trim()
          .split(/\s*&\s*|\s+y\s+/i);
        p1 = (parts[0] || '').trim();
        p2 = (parts[1] || '').trim();
      } else if (wi.bride || wi.groom || wList.bride || wList.groom) {
        p1 = String(wi.bride || wList.bride || '').trim();
        p2 = String(wi.groom || wList.groom || '').trim();
      }
      if (!p1 && !p2) {
        p1 = 'pareja1';
        p2 = 'pareja2';
      }

      const connectorRaw = t('guests.saveTheDate.connector', { defaultValue: 'and' }) || 'and';
      const connector = connectorRaw.trim() || 'and';

      const defaultPrimary = t('guests.saveTheDate.primaryFallback', { defaultValue: 'us' }) || 'us';
      const defaultCoupleLabel =
        t('guests.saveTheDate.coupleFallback', { defaultValue: 'our wedding' }) || 'our wedding';

      const primaryName = p1 || p2 || defaultPrimary;
      const secondaryName = p1 && p2 ? p2 : '';
      const p2Suffix = secondaryName ? ` ${connector} ${secondaryName}` : '';

      const coupleName = secondaryName ? `${primaryName}${p2Suffix}` : primaryName || defaultCoupleLabel;

      const dateRaw =
        wi.weddingDate || wi.date || wList.weddingDate || wList.date || wi.ceremonyDate || '';
      let fechaFmt = '';
      if (dateRaw) {
        try {
          const d =
            typeof dateRaw === 'string'
              ? new Date(dateRaw)
              : dateRaw?.seconds
                ? new Date(dateRaw.seconds * 1000)
                : new Date(dateRaw);
          fechaFmt = formatDate(d, 'medium');
        } catch {
          fechaFmt = String(dateRaw);
        }
      } else {
        fechaFmt = 'la fecha de la boda';
      }

      const message = t('guests.saveTheDate.message', {
        defaultValue:
          'Hola somos {{p1}}{{p2Suffix}}, tenemos un notici�n s�per importante que compartir contigo. �Nos casamos! Res�rvate el {{date}} porque queremos contar contigo.',
        p1: primaryName,
        p2Suffix,
        date: fechaFmt,
      });

      return { saveTheDateMessage: message, coupleLabel: coupleName };
    } catch {
      return {
        saveTheDateMessage: t('guests.saveTheDate.messageFallback', {
          defaultValue:
            '�Hola! Tenemos un notici�n s�per importante que compartir contigo. �Nos casamos! �Res�rvate la fecha porque queremos contar contigo!',
        }),
        coupleLabel:
          t('guests.saveTheDate.coupleFallback', { defaultValue: 'our wedding' }) || 'our wedding',
      };
    }
  }, [weddings, activeWedding, activeWeddingInfo, t]);

  const saveTheDateDefault = saveTheDateMessage;

  const defaultInvitationMessage = React.useMemo(
    () =>
      '�Hola {guestName}! Somos {coupleName} y te enviamos la invitaci�n oficial de nuestra boda. Adjuntamos la tarjeta con todos los detalles y esperamos tu respuesta.',
    [coupleLabel]
  );

  const defaultInvitationAsset = React.useMemo(() => {
    const wi = activeWeddingInfo?.weddingInfo || {};
    return (
      wi.invitationAssetUrl ||
      wi.invitationAsset ||
      activeWeddingInfo?.invitation?.assetUrl ||
      ''
    );
  }, [activeWeddingInfo]);

  const checkInStats = React.useMemo(() => {
    const list = Array.isArray(guests) ? guests : [];
    const checkedIn = list.filter((g) => g.checkedIn).length;
    return {
      total: list.length,
      checkedIn,
      pending: Math.max(list.length - checkedIn, 0),
    };
  }, [guests]);
  const totalGuestsCount = React.useMemo(() => {
    if (stats && typeof stats.total === 'number') {
      return stats.total;
    }
    return Array.isArray(guests) ? guests.length : 0;
  }, [guests, stats]);
  const viewLoading = isLoading || isLoadingSamples;
  const listLoading = viewLoading || isSaving;

  const ownerAddress = React.useMemo(() => {
    const info = activeWeddingInfo?.weddingInfo || {};
    const contact = info.printingContact || {};
    const addressBlock =
      info.printingAddress ||
      info.ownerAddress ||
      info.postalAddress ||
      info.addressObject ||
      {};
    const line1 =
      addressBlock.line1 ||
      addressBlock.addressLine1 ||
      info.ownerAddressLine1 ||
      info.addressStreet ||
      info.address ||
      '';
    const line2 =
      addressBlock.line2 ||
      addressBlock.addressLine2 ||
      info.ownerAddressLine2 ||
      info.addressStreet2 ||
      '';
    const city = addressBlock.city || info.addressCity || '';
    const state = addressBlock.state || info.addressState || '';
    const postalCode =
      addressBlock.postalCode || addressBlock.zip || info.addressZip || '';
    const country = addressBlock.country || info.addressCountry || '';
    return {
      name: contact.name || info.printingContactName || info.ownerName || coupleLabel,
      line1,
      line2,
      city,
      state,
      postalCode,
      country,
    };
  }, [activeWeddingInfo, coupleLabel]);

  React.useEffect(() => {
    if (!checkInInput) {
      setCheckInGuest(null);
      return;
    }
    const match = findGuestByCheckInCode(checkInInput);
    setCheckInGuest(match || null);
  }, [checkInInput, findGuestByCheckInCode, guests]);

  // Manejar apertura de modal para nuevo invitado
  const handleAddGuest = () => {
    setEditingGuest(null);
    setShowGuestModal(true);
  };

  // Manejar apertura de modal para editar invitado
  const handleEditGuest = (guest) => {
    setEditingGuest(guest);
    setShowGuestModal(true);
  };

  // Manejar guardado de invitado (nuevo o editado)
  const handleSaveGuest = async (guestData) => {
    setIsSaving(true);

    try {
      let result;
      if (editingGuest) {
        result = await updateGuest(editingGuest.id, guestData);
      } else {
        result = await addGuest(guestData);
      }

      if (result.success) {
        setShowGuestModal(false);
        setEditingGuest(null);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error guardando invitado:', error);
      alert('Error inesperado al guardar el invitado');
    } finally {
      setIsSaving(false);
    }
  };

  // Difusión (lista de difusión vía extensión)
  const handleSendSelectedBroadcast = async () => {
    try {
      if (import.meta.env.DEV)
        console.log('[Invitados] handleSendSelectedBroadcast click', {
          selectedCount: selectedIds.length,
        });
      if (!selectedIds.length) {
        alert(t('guests.noneSelected', { defaultValue: 'No hay invitados seleccionados' }));
        return;
      }
      const custom = window.prompt(
        'Mensaje de difusión (se enviará una sola vez a una lista de difusión). Ten en cuenta que solo lo recibirán quienes tengan tu número guardado en contactos.',
        ''
      );
      const r = await inviteSelectedWhatsAppBroadcastViaExtension(selectedIds, custom || undefined);
      if (r?.notAvailable) {
        const doFallback = window.confirm(
          'No se detectó la extensión para difusión. ¿Quieres intentar el envío individual (una sola acción) en su lugar?'
        );
        if (doFallback) {
          const rb = await inviteSelectedWhatsAppViaExtension(selectedIds, custom || undefined);
          if (rb?.success && !rb?.notAvailable) {
            alert(`Envío iniciado para ${rb?.count || selectedIds.length} invitado(s).`);
          } else {
            alert('No se pudo iniciar el envío (extensión no disponible).');
          }
        }
        return;
      }
      if (r?.success) {
        if (r?.mode === 'broadcast') alert(`Difusión enviada a ${r?.count || 0} destinatarios.`);
        else if (r?.mode === 'fallback_individual')
          alert(`Envío individual fallback. �0xitos: ${r?.sent || 0}, Fallos: ${r?.failed || 0}`);
        return;
      }
      alert('No se pudo completar la difusión: ' + (r?.error || 'desconocido'));
    } catch (e) {
      console.warn('Error en difusión (Móvil):', e);
      alert('Error en la difusión');
    }
  };

  // Manejar eliminación de invitado
  const handleDeleteGuest = async (guest) => {
    const result = await removeGuest(guest.id);
    if (!result.success) {
      alert(`Error eliminando invitado: ${result.error}`);
    }
  };

  // Actualizar estado desde la lista (mapea al esquema del backend RSVP)
  const handleUpdateStatus = async (guest, nextStatus) => {
    try {
      const map = { confirmed: 'accepted', declined: 'rejected', pending: 'pending' };
      const status = map[nextStatus] || String(nextStatus || '').toLowerCase();
      const res = await updateGuest(guest.id, { status });
      if (!res?.success) {
        alert('No se pudo actualizar el estado');
      }
    } catch (e) {
      console.warn('Error actualizando estado:', e);
      alert('Error actualizando estado del invitado');
    }
  };

  // Envío masivo API para todos los invitados (usado por GuestFilters)
  // Abrir modal de envío masivo WhatsApp
  const openSaveTheDate = () => setShowSaveTheDate(true);
  const closeSaveTheDate = () => setShowSaveTheDate(false);
  const openWhatsBatch = () => setShowWhatsBatch(true);
  const closeWhatsBatch = () => setShowWhatsBatch(false);

  // Selección múltiple
  const handleToggleSelect = (id, checked) => {
    setSelectedIds((prev) => {
      const set = new Set(prev);
      if (checked) set.add(id);
      else set.delete(id);
      return Array.from(set);
    });
  };
  const handleToggleSelectAll = (ids, checked) => {
    setSelectedIds((prev) => {
      const set = new Set(prev);
      if (checked) ids.forEach((id) => set.add(id));
      else ids.forEach((id) => set.delete(id));
      return Array.from(set);
    });
  };
  const handleBulkTableReassign = async () => {
    if (!selectedIds.length) {
      alert(t('guests.noneSelected', { defaultValue: 'No hay invitados seleccionados' }));
      return;
    }
    const currentTables = Array.from(
      new Set(
        (guests || [])
          .filter((g) => selectedIds.includes(g.id))
          .map((g) => g.table || '')
      )
    );
    const promptLabel =
      currentTables.length === 1 && currentTables[0]
        ? `Asignar nueva mesa (actual: ${currentTables[0] || 'sin mesa'})`
        : 'Asignar nueva mesa';
    const value = window.prompt(promptLabel, currentTables[0] || '');
    if (value === null) return;
    const trimmed = (value || '').trim();
    if (!trimmed) {
      alert('Debes indicar una mesa v�lida.');
      return;
    }
    try {
      setIsSaving(true);
      const idSet = new Set(selectedIds);
      const targets = (guests || []).filter((g) => idSet.has(g.id));
      await Promise.all(targets.map((guest) => updateGuest(guest.id, { table: trimmed })));
      alert(`Mesa asignada a ${targets.length} invitado(s).`);
    } catch (error) {
      console.error('Error reasignando mesa en bloque', error);
      alert('No se ha podido reasignar la mesa.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSamples = React.useCallback(async () => {
    if (isLoadingSamples) return;
    setIsLoadingSamples(true);
    try {
      const result = await loadSampleGuests({ fixture: 'guests-demo.json', replace: true });
        if (!result?.success) {
          const reason = result?.error ? ` (${result.error})` : '';
          notify(`No se pudieron cargar los invitados de ejemplo${reason}`, 'warning');
        } else {
          notify(`Se cargaron ${result.count || 0} invitado(s) de ejemplo.`, 'success');
        }
      } catch (error) {
        console.error('[Invitados] loadSampleGuests error', error);
        notify('Error cargando los invitados de ejemplo', 'error');
      } finally {
        setIsLoadingSamples(false);
      }
  }, [isLoadingSamples, loadSampleGuests, notify]);

  const stopScanning = React.useCallback(() => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    const videoElement = videoRef.current;
    const stream = videoElement && videoElement.srcObject;
    if (stream && typeof stream.getTracks === 'function') {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
    }
    if (videoElement) {
      videoElement.srcObject = null;
    }
  }, []);

  const handleStartScan = React.useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError('La c�mara no est� disponible en este dispositivo.');
      return;
    }
    if (!('BarcodeDetector' in window)) {
      setScanError('Este navegador no soporta lectura de c�digos QR.');
      return;
    }
    try {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      const videoElement = videoRef.current;
      if (!videoElement) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      videoElement.srcObject = stream;
      await videoElement.play().catch(() => {});
      setIsScanning(true);
      setScanError('');
      if (scanIntervalRef.current) {
        window.clearInterval(scanIntervalRef.current);
      }
      scanIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (Array.isArray(codes) && codes.length > 0) {
            const raw = codes[0].rawValue || codes[0].rawData;
            if (raw) {
              stopScanning();
              const normalized = String(raw).trim();
              setCheckInInput((prev) => (prev === normalized ? prev : normalized));
            }
          }
        } catch (error) {
          setScanError('No se pudo leer el c�digo QR.');
        }
      }, 600);
    } catch (error) {
      console.error('[Invitados] handleStartScan error', error);
      setScanError('No se pudo acceder a la c�mara.');
      stopScanning();
    }
  }, [stopScanning]);

  const handleOpenCheckInModal = React.useCallback(() => {
    setShowCheckInModal(true);
    setCheckInInput('');
    setScanError('');
    setCheckInGuest(null);
  }, []);

  const handleCloseCheckInModal = React.useCallback(() => {
    setShowCheckInModal(false);
    stopScanning();
  }, [stopScanning]);

  const handleCheckInInputChange = React.useCallback((value) => {
    setCheckInInput(value.toUpperCase());
  }, []);

  const handleConfirmCheckIn = React.useCallback(async () => {
    if (!checkInGuest) {
      notify('No se encontr� invitado para registrar el check-in.', 'warning');
      return;
    }
    const code = checkInInput || checkInGuest.checkInCode || checkInGuest.id;
    setCheckInLoading(true);
    try {
      const res = await markGuestCheckIn(checkInGuest.id, {
        method: isScanning ? 'qr' : 'manual',
        code,
        by: currentUser?.email || currentUser?.uid || 'staff',
      });
      if (!res?.success) {
        notify('No se pudo registrar el check-in de este invitado.', 'error');
        return;
      }
      notify(`${checkInGuest.name || 'Invitado'} marcado como presente.`, 'success');
      setTimeout(() => {
        const updated = findGuestByCheckInCode(code);
        setCheckInGuest(updated || null);
      }, 150);
    } catch (error) {
      console.error('[Invitados] handleConfirmCheckIn error', error);
      notify('Error registrando el check-in.', 'error');
    } finally {
      setCheckInLoading(false);
    }
  }, [
    checkInGuest,
    checkInInput,
    currentUser,
    findGuestByCheckInCode,
    isScanning,
    markGuestCheckIn,
    notify,
  ]);

  const handleConfirmCheckOut = React.useCallback(async () => {
    if (!checkInGuest) {
      notify('Selecciona un invitado para revertir el check-in.', 'warning');
      return;
    }
    setCheckInLoading(true);
    try {
      const res = await markGuestCheckOut(checkInGuest.id, {
        by: currentUser?.email || currentUser?.uid || 'staff',
      });
      if (!res?.success) {
        notify('No se pudo revertir el check-in.', 'error');
        return;
      }
      notify(`${checkInGuest.name || 'Invitado'} marcado como pendiente.`, 'info');
      setTimeout(() => {
        const updated = checkInGuest.checkInCode
          ? findGuestByCheckInCode(checkInGuest.checkInCode)
          : null;
        setCheckInGuest(updated || null);
      }, 150);
    } catch (error) {
      console.error('[Invitados] handleConfirmCheckOut error', error);
      notify('Error revirtiendo el check-in.', 'error');
    } finally {
      setCheckInLoading(false);
    }
  }, [checkInGuest, currentUser, findGuestByCheckInCode, markGuestCheckOut, notify]);

  React.useEffect(() => () => stopScanning(), [stopScanning]);

  React.useEffect(() => {
    if (!showCheckInModal) {
      stopScanning();
      setCheckInInput('');
      setScanError('');
    }
  }, [showCheckInModal, stopScanning]);

  const handleSaveTheDateDelivered = async ({ ok = [] }) => {
    if (!ok || !ok.length) return;
    try {
      await Promise.all(
        ok.map((id) =>
          updateGuest(id, {
            deliveryChannel: 'whatsapp',
            deliveryStatus: 'save_the_date_sent',
          })
        )
      );
    } catch (error) {
      console.warn('[Invitados] error actualizando estado Save The Date', error);
    }
  };

  const handleSendFormalInvites = async ({ guestIds = [], message, assetUrl, instagramPollId }) => {
    if (!guestIds.length) {
      alert('Selecciona al menos un invitado');
      return { success: false };
    }
    try {
      const normalizedMessage = (message || '').trim() || defaultInvitationMessage;
      const normalizedAsset = (assetUrl || '').trim() || defaultInvitationAsset;
      const pollId = instagramPollId?.trim() || '';
      const res = await bulkInviteWhatsAppApi({
        targetIds: guestIds,
        baseMessage: normalizedMessage,
        assetUrl: normalizedAsset,
        coupleName: coupleLabel,
        metadata: pollId ? { instagramPollId: pollId } : {},
        type: 'formal_invitation',
        deliveryChannel: 'whatsapp',
      });
      if (res?.error === 'missing-couple-signature') {
        alert('El mensaje debe incluir el nombre de la pareja.');
        return { success: false };
      }
      if (res?.success) {
        await Promise.all(
          guestIds.map((id) =>
            updateGuest(id, {
              deliveryChannel: 'whatsapp',
              deliveryStatus: 'invitation_sent',
              whatsappAssetUrl: normalizedAsset,
              instagramPollId: pollId,
            })
          )
        );
        alert(`Invitaci�n enviada a ${res.ok ?? guestIds.length} invitado(s).`);
        return { success: true };
      }
      alert(res?.error || 'No se pudo enviar la invitaci�n');
      return { success: false };
    } catch (error) {
      console.error('Error enviando invitaciones formales', error);
      alert('Error enviando las invitaciones');
      return { success: false };
    }
  };

  const handleMarkFormalDelivery = async ({ guestIds = [], channel, assetUrl }) => {
    if (!guestIds.length) {
      alert('Selecciona al menos un invitado');
      return { success: false };
    }
    try {
      const normalizedAsset = (assetUrl || '').trim() || defaultInvitationAsset;
      if (!normalizedAsset) {
        alert('A�ade la URL de la invitaci�n dise�ada antes de continuar.');
        return { success: false };
      }
      const guestsToPrint = guestIds
        .map((id) => (guests || []).find((g) => g.id === id))
        .filter(Boolean);
      if (!guestsToPrint.length) {
        alert('No se pudo encontrar informaci�n de los invitados seleccionados.');
        return { success: false };
      }
      const finalChannel = channel || 'print_owner';
      const batchId = `${finalChannel}-${Date.now()}`;
      const guestsPayload = guestsToPrint.map((guest) => ({
        guestId: guest.id,
        name: guest.name || '',
        assetUrl: guest.whatsappAssetUrl || normalizedAsset,
        envelope: {
          name: guest.name || '',
          address: {
            line1: guest.addressStreet || guest.address || '',
            line2: guest.addressStreet2 || '',
            city: guest.addressCity || '',
            state: guest.addressState || '',
            postalCode: guest.addressZip || '',
            country: guest.addressCountry || '',
          },
        },
        metadata: {
          companions: guest.companion || 0,
          notes: guest.notes || '',
        },
        message: renderInviteMessage(guest.name || '', {
          coupleName: coupleLabel,
        }),
      }));
      const providerResponse = await createInvitationPrintBatch({
        weddingId: activeWedding,
        batchId,
        assetUrl: normalizedAsset,
        guests: guestsPayload,
        ownerAddress,
      });
      if (!providerResponse?.success) {
        throw new Error(providerResponse?.error || 'print-batch-failed');
      }
      await Promise.all(
        guestsToPrint.map((guest) =>
          updateGuest(guest.id, {
            deliveryChannel: finalChannel,
            deliveryStatus: 'printing',
            whatsappAssetUrl: normalizedAsset,
            printBatchId: batchId,
          })
        )
      );
      alert('Pedido de impresi�n generado correctamente.');
      return { success: true };
    } catch (error) {
      console.error('Error registrando entrega f�sica', error);
      alert('No se pudo registrar la entrega.');
      return { success: false };
    }
  };

  // Enviar API a seleccionados
  const handleSendSelectedApi = async () => {
    try {
      if (import.meta.env.DEV)
        console.log('[Invitados] handleSendSelectedApi click', {
          selectedCount: selectedIds.length,
        });
      if (!selectedIds.length) {
        alert(t('guests.noneSelected', { defaultValue: 'No hay invitados seleccionados' }));
        return;
      }
      const res = await inviteSelectedWhatsAppApi(selectedIds, undefined, {
        coupleName: coupleLabel,
      });
      if (import.meta.env.DEV) console.log('[Invitados] handleSendSelectedApi result', res);
      if (res?.cancelled) {
        alert('Acción cancelada');
        return;
      }
      if (res?.error === 'missing-couple-signature') {
        alert(
          'El mensaje debe incluir el nombre de la pareja. Revisa la plantilla en Editar mensaje (API).'
        );
        return;
      }
      if (res?.error && !res?.success) {
        alert(
          t('guests.whatsapp.selectedApiError', {
            defaultValue: 'Error enviando a seleccionados: {{error}}',
            error: res.error,
          })
        );
        return;
      }
      if (res?.success) {
        alert(
          t('guests.whatsapp.bulkApiDone', {
            defaultValue: 'Envío completado. �0xitos: {{ok}}, Fallos: {{fail}}',
            ok: res?.ok || 0,
            fail: res?.fail || 0,
          })
        );
        return;
      }
      alert(
        t('guests.whatsapp.apiStartFailed', {
          defaultValue: 'No se pudo iniciar el envío por API',
        })
      );
    } catch (e) {
      console.warn('Error envío seleccionados (API):', e);
      alert(t('guests.whatsapp.selectedUnexpected', { defaultValue: 'Error enviando a seleccionados' }));
    }
  };

  // Enviar por móvil personal (preferir "una sola acción" vía extensión)
  const handleSendSelectedMobile = async () => {
    try {
      if (import.meta.env.DEV)
        console.log('[Invitados] handleSendSelectedMobile click', {
          selectedCount: selectedIds.length,
        });
      if (!selectedIds.length) {
        alert('No hay invitados seleccionados');
        return;
      }
      const custom = window.prompt(
        t('guests.whatsapp.customPrompt', {
          defaultValue:
            'Mensaje personalizado (opcional). Si lo dejas en blanco, se usará un mensaje por defecto con enlace RSVP cuando sea posible:',
        }),
        ''
      );
      // 1) Intentar envío en una sola acción usando extensión (WhatsApp Web automation)
      try {
        const r = await inviteSelectedWhatsAppViaExtension(selectedIds, custom || undefined);
        if (r?.success && !r?.notAvailable) {
          alert(
            t('guests.whatsapp.webStarted', {
              defaultValue: 'Envío iniciado en WhatsApp Web para {{count}} invitado(s).',
              count: r?.count || selectedIds.length,
            })
          );
          return;
        }
        if (r?.notAvailable) {
          // 2) Fallback opcional: abrir chats en pestañas (no recomendado para >50)
          const doFallback = window.confirm(
            t('guests.whatsapp.extensionMissingConfirm', {
              defaultValue:
                'No se detectó la extensión para enviar en una sola acción. ¿Quieres abrir los chats en pestañas como alternativa?',
            })
          );
          if (doFallback) {
            const fr = await inviteSelectedWhatsAppDeeplink(selectedIds, custom || undefined);
            if (fr?.success)
              alert(
                t('guests.whatsapp.chatsOpened', {
                  defaultValue: 'Se abrieron {{opened}} chats en WhatsApp',
                  opened: fr?.opened || 0,
                })
              );
          }
          return;
        }
        // Si no es success y tampoco es notAvailable, informar del error
        alert(
          t('guests.whatsapp.oneClickFailed', {
            defaultValue: 'No se pudo iniciar el envío en una sola acción: {{error}}',
            error: r?.error || 'desconocido',
          })
        );
        return;
      } catch (e) {
        console.warn('Extensión WhatsApp Web no disponible o falló, usando fallback:', e);
        const fr = await inviteSelectedWhatsAppDeeplink(selectedIds, custom || undefined);
        if (fr?.success)
          alert(
            t('guests.whatsapp.chatsOpened', {
              defaultValue: 'Se abrieron {{opened}} chats en WhatsApp',
              opened: fr?.opened || 0,
            })
          );
        return;
      }
    } catch (e) {
      console.warn('Error envío seleccionados (Móvil):', e);
      alert(
        t('guests.whatsapp.mobileUnexpected', {
          defaultValue: 'Error enviando a seleccionados (Móvil)',
        })
      );
    }
  };

  // Programar API para seleccionados (simple prompt)
  const handleScheduleSelected = async () => {
    try {
      if (!selectedIds.length) {
        alert('No hay invitados seleccionados');
        return;
      }
      const whenStr = window.prompt(
        'Fecha y hora (local) para programar (YYYY-MM-DD HH:mm):',
        '2025-09-10 10:00'
      );
      if (!whenStr) return;
      const whenIso = new Date(whenStr.replace(' ', 'T')).toISOString();
      // Construir items: to (E.164), message (con RSVP si es posible)
      const idSet = new Set(selectedIds);
      const targets = (guests || []).filter((g) => idSet.has(g.id) && g.phone);
      const items = [];
      for (const g of targets) {
        // Generar enlace RSVP si es posible
        let link = '';
        try {
          const resp = await apiPost(
            `/api/guests/${activeWedding}/id/${g.id}/rsvp-link`,
            {},
            { auth: true }
          );
          if (resp.ok) {
            const json = await resp.json();
            link = json.link;
          }
        } catch {}
        const msg = link
          ? `¡Hola ${g.name || ''}! Somos ${coupleLabel} y nos encantaría contar contigo en nuestra boda. Confirma tu asistencia aquí: ${link}`
          : `¡Hola ${g.name || ''}! Somos ${coupleLabel} y nos encantaría contar contigo en nuestra boda. ¿Puedes confirmar tu asistencia?`;
        const to = toE164(g.phone);
        if (to)
          items.push({
            to,
            message: msg,
            weddingId: activeWedding,
            guestId: g.id,
            metadata: { guestName: g.name || '', rsvpFlow: true },
          });
      }
      if (!items.length) {
        alert('Los seleccionados no tienen teléfonos válidos');
        return;
      }
      const result = await scheduleWhats(items, whenIso);
      if (result?.success) {
        alert(`Programados ${items.length} envíos para ${whenIso}`);
      } else {
        alert('Error programando envíos: ' + (result?.error || 'desconocido'));
      }
    } catch (e) {
      console.warn('Error programando envíos:', e);
      alert('Error programando envíos');
    }
  };

  // Abrir modal de WhatsApp para un invitado concreto
  const openWhatsModalForGuest = (guest) => {
    try {
      setWhatsGuest(guest || null);
      setShowWhatsModal(true);
    } catch (e) {
      console.warn('No se pudo abrir el modal de WhatsApp:', e);
    }
  };

  const handleCloseWhatsModal = () => {
    setShowWhatsModal(false);
    setWhatsGuest(null);
  };


  // Importar contactos seleccionados
  const handleImportedGuests = async (importedGuests) => {
    try {
      if (!importedGuests || importedGuests.length === 0) return;
      // Deduplicación por email/teléfono
      const existingEmails = new Set((guests || []).map((g) => utils.normalize(g?.email || '')));
      const existingPhones = new Set((guests || []).map((g) => utils.phoneClean(g?.phone || '')));

      let added = 0;
      let skipped = 0;
      for (const guest of importedGuests) {
        const emailKey = utils.normalize(guest?.email || '');
        const phoneKey = utils.phoneClean(guest?.phone || '');
        if (
          (emailKey && existingEmails.has(emailKey)) ||
          (phoneKey && existingPhones.has(phoneKey))
        ) {
          skipped++;
          continue;
        }
        await addGuest({
          companionGroupId: guest?.companionGroupId || '',
          ...guest,
        });
        if (emailKey) existingEmails.add(emailKey);
        if (phoneKey) existingPhones.add(phoneKey);
        added++;
      }
      alert(
        `${added} invitados importados correctamente${skipped ? `, ${skipped} duplicados omitidos` : ''}`
      );
      setShowGuestModal(false);
    } catch (error) {
      console.error('Error importando invitados:', error);
      alert('Ocurrió un error al importar los invitados');
    }
  };

  // Abrir alta masiva
  const handleOpenBulkAdd = () => setShowBulkModal(true);

  // Guardar alta masiva desde grid
  const handleBulkSave = async (rows) => {
    try {
      if (!rows || rows.length === 0) {
        setShowBulkModal(false);
        return;
      }
      const existingEmails = new Set((guests || []).map((g) => utils.normalize(g?.email || '')));
      const existingPhones = new Set((guests || []).map((g) => utils.phoneClean(g?.phone || '')));

      let added = 0;
      let skipped = 0;
      for (const r of rows) {
        const emailKey = utils.normalize(r?.email || '');
        const phoneKey = utils.phoneClean(r?.phone || '');
        if (
          (emailKey && existingEmails.has(emailKey)) ||
          (phoneKey && existingPhones.has(phoneKey))
        ) {
          skipped++;
          continue;
        }
        const payload = {
          name: r?.name || '',
          email: r?.email || '',
          phone: r?.phone || '',
          address: r?.address || '',
          companion: parseInt(r?.companion, 10) || parseInt(r?.companions, 10) || 0,
          companionType:
            (parseInt(r?.companions, 10) || parseInt(r?.companion, 10) || 0) > 0
              ? 'plus_one'
              : 'none',
          companionGroupId: '',
          table: r?.table || '',
          response: 'Pendiente',
          status: 'pending',
          dietaryRestrictions: r?.dietaryRestrictions || '',
          notes: r?.notes || 'Alta masiva',
        };
        await addGuest(payload);
        if (emailKey) existingEmails.add(emailKey);
        if (phoneKey) existingPhones.add(phoneKey);
        added++;
      }
      notify(
        `${added} invitado${added === 1 ? '' : 's'} a�adid${added === 1 ? 'o' : 'os'}${
          skipped ? `, ${skipped} duplicados omitidos` : ''
        }`,
        'success'
      );
      setShowBulkModal(false);
    } catch (err) {
      console.error('Error en alta masiva:', err);
      notify('Ocurri� un error al procesar la alta masiva', 'error');
    }
  };

  const handleCancelBulkModal = () => setShowBulkModal(false);

  // Abrir/cerrar resumen RSVP
  const handleOpenRsvpSummary = () => setShowRsvpModal(true);
  const handleCloseRsvpSummary = () => setShowRsvpModal(false);

  // Imprimir PDF simple (nombre completo y mesa) para confirmados
  const handlePrintRsvpPdf = () => {
    try {
      const confirmedGuests = (guests || [])
        .filter((g) => {
          const s = String(g.status || '').toLowerCase();
          return s === 'confirmed' || s === 'accepted' || g.response === 'S�';
        })
        .map((g) => ({ name: g.name || '', table: g.table || '', companion: g.companion || 0 }));

      // Ordenar por mesa y nombre
      confirmedGuests.sort((a, b) => {
        const ta = String(a.table || '').toLowerCase();
        const tb = String(b.table || '').toLowerCase();
        if (ta === tb) return (a.name || '').localeCompare(b.name || '');
        return ta.localeCompare(tb);
      });

      const win = window.open('', '_blank');
      if (!win) return;
      const title = 'Listado confirmados - Nombre y Mesa';
      const date = new Date().toLocaleString();

      const rowsHtml = confirmedGuests
        .map(
          (g, idx) => `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${idx + 1}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${g.name}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align:center;">${
            g.table || '-'
          }</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align:center;">${
            g.companion || 0
          }</td>
        </tr>
      `
        )
        .join('');

      const html = `<!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${title}</title>
            <style>
              body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: #111827; }
              h1 { font-size: 18px; margin: 0; }
              .sub { font-size: 12px; color: #6B7280; margin-top: 2px; }
              table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
              thead th { text-align: left; border-bottom: 2px solid #111827; padding: 6px 8px; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div style="display:flex; justify-content: space-between; align-items: baseline;">
              <div>
                <h1>${title}</h1>
                <div class="sub">Generado: ${date}</div>
              </div>
              <div class="no-print">
                <button onclick="window.print()" style="padding:6px 10px; border:1px solid #e5e7eb; background:#fff; cursor:pointer;">Imprimir / Guardar PDF</button>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre completo</th>
                  <th style="text-align:center;">Mesa</th>
                  <th style="text-align:center;">Acompa�antes</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </body>
        </html>`;

      win.document.open();
      win.document.write(html);
      win.document.close();
      win.onload = () => {
        try {
          win.print();
        } catch (_) {}
      };
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('No se pudo generar el documento de impresi�n');
    }
  };

  // Manejar cancelación de modal
  const handleCancelModal = () => {
    setShowGuestModal(false);
    setEditingGuest(null);
  };

  return (
    <div className="min-h-screen bg-app p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="page-header">
          <div>
            <h1 className="page-title">{t('guests.guestList')}</h1>
            <p className="text-muted mt-1">Gestiona tu lista de invitados de forma eficiente</p>
          </div>
        </div>

        {/* Filtros y acciones */}
        <GuestFilters
          searchTerm={filters?.search || ''}
          statusFilter={filters?.status || ''}
          tableFilter={filters?.table || ''}
          onSearchChange={(value) => updateFilters({ search: value })}
          onStatusFilterChange={(value) => updateFilters({ status: value })}
          onTableFilterChange={(value) => updateFilters({ table: value })}
          onAddGuest={handleAddGuest}
          onOpenSaveTheDate={openSaveTheDate}
          onOpenBulkAdd={handleOpenBulkAdd}
          onBulkInvite={() => setShowFormalInvitation(true)}
          onOpenManualBatch={openWhatsBatch}
          onOpenRsvpSummary={handleOpenRsvpSummary}
          onBulkTableReassign={handleBulkTableReassign}
          guestCount={guests?.length || 0}
          isLoading={viewLoading}
          selectedCount={selectedIds.length}
          onSendSelectedApi={handleSendSelectedApi}
          onScheduleSelected={handleScheduleSelected}
          onSendSelectedBroadcast={handleSendSelectedBroadcast}
          showApiButtons
          coupleName={coupleLabel}
          onLoadSamples={handleLoadSamples}
          onOpenCheckIn={handleOpenCheckInModal}
        />

        {/* Fallback temporal: sin bodas visibles para el usuario */}
        {!isLoading && Array.isArray(weddings) && weddings.length === 0 && (
          <div className="text-sm text-muted">
            {activeWedding
              ? 'No se encontraron bodas asociadas a tu cuenta o no tienes permisos sobre la boda activa. Si el problema persiste, recarga la página o contacta con soporte.'
              : 'No se encontraron bodas asociadas a tu cuenta. Crea o selecciona una boda para gestionar invitados.'}
          </div>
        )}

        {/* Lista de invitados */}
        <GuestList
          guests={guests || []}
          searchTerm={filters?.search || ''}
          statusFilter={filters?.status || ''}
          tableFilter={filters?.table || ''}
          onUpdateStatus={handleUpdateStatus}
          onEdit={handleEditGuest}
          onDelete={handleDeleteGuest}
          onInviteWhatsApp={openWhatsModalForGuest}
          onInviteEmail={inviteViaEmail}
          isLoading={listLoading}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
        />

        {/* Modal de formulario de invitado */}
        <Modal
          open={showGuestModal}
          onClose={handleCancelModal}
          title={editingGuest ? 'Editar Invitado' : 'Añadir Invitado'}
          size="lg"
        >
          {editingGuest ? (
            <GuestForm
              guest={editingGuest}
              onSave={handleSaveGuest}
              onCancel={handleCancelModal}
              isLoading={isSaving}
            />
          ) : (
            <Tabs defaultValue="manual">
              <TabsList className="flex space-x-6 border-b mb-4">
                <TabsTrigger value="manual" className="pb-2">
                  Manual
                </TabsTrigger>
                <TabsTrigger value="import" className="pb-2">
                  Desde contactos
                </TabsTrigger>
              </TabsList>
              <TabsContent value="manual">
                <GuestForm
                  guest={null}
                  onSave={handleSaveGuest}
                  onCancel={handleCancelModal}
                  isLoading={isSaving}
                />
              </TabsContent>
              <TabsContent value="import" className="pt-2">
                <ContactsImporter onImported={handleImportedGuests} />
                <p className="text-xs text-muted mt-3">
                  Selecciona los contactos de tu agenda y se añadirán como invitados.
                </p>
              </TabsContent>
            </Tabs>
          )}
        </Modal>

        {/* Modal de alta masiva */}
        <Modal
          open={showBulkModal}
          onClose={handleCancelBulkModal}
          title="Alta masiva de invitados"
          size="lg"
        >
          <GuestBulkGrid
            onCancel={handleCancelBulkModal}
            onSave={handleBulkSave}
            isLoading={isSaving}
          />
        </Modal>

        {/* Modal Resumen RSVP */}
        <Modal open={showRsvpModal} onClose={handleCloseRsvpSummary} title="Resumen RSVP" size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-primary">{totalGuestsCount}</div>
                <div className="text-sm text-muted">Total invitados</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-green-600">
                  {
                    (guests || []).filter((g) => {
                      const s = String(g.status || '').toLowerCase();
                      return s === 'confirmed' || s === 'accepted';
                    }).length
                  }
                </div>
                <div className="text-sm text-muted">Confirmados</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-yellow-600">
                  {
                    (guests || []).filter((g) => {
                      const s = String(g.status || '').toLowerCase();
                      return s === '' || s === 'pending';
                    }).length
                  }
                </div>
                <div className="text-sm text-muted">Pendientes</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-red-600">
                  {
                    (guests || []).filter((g) => {
                      const s = String(g.status || '').toLowerCase();
                      return s === 'declined' || s === 'rejected';
                    }).length
                  }
                </div>
                <div className="text-sm text-muted">Rechazados</div>
              </div>
            </div>

            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="px-4 py-3 border-b font-medium">Confirmados (Nombre y Mesa)</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Nombre</th>
                      <th className="px-3 py-2 text-center">Mesa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(guests || [])
                      .filter((g) => {
                        const s = String(g.status || '').toLowerCase();
                        return s === 'confirmed' || s === 'accepted' || g.response === 'S�';
                      })
                      .sort(
                        (a, b) =>
                          String(a.table || '').localeCompare(String(b.table || '')) ||
                          String(a.name || '').localeCompare(String(b.name || ''))
                      )
                      .map((g) => (
                        <tr key={g.id} className="border-t">
                          <td className="px-3 py-2">{g.name}</td>
                          <td className="px-3 py-2 text-center">{g.table || '-'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCloseRsvpSummary}>
                {t('app.close', { defaultValue: 'Cerrar' })}
              </Button>
              <Button onClick={handlePrintRsvpPdf}>
                {t('guests.rsvp.printPdf', { defaultValue: 'Imprimir / PDF' })}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          open={showCheckInModal}
          onClose={handleCloseCheckInModal}
          title="Check-in de invitados"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-xs uppercase text-muted">Registrados</div>
                <div className="text-2xl font-semibold text-green-600">
                  {checkInStats.checkedIn}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-xs uppercase text-muted">Pendientes</div>
                <div className="text-2xl font-semibold text-yellow-600">
                  {checkInStats.pending}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-xs uppercase text-muted">Total</div>
                <div className="text-2xl font-semibold">{checkInStats.total}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Input
                value={checkInInput}
                onChange={(e) => handleCheckInInputChange(e.target.value)}
                placeholder="Escanea o escribe el c�digo de check-in"
                disabled={checkInLoading}
                data-testid="guest-checkin-input"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={handleStartScan} disabled={isScanning}>
                  {isScanning ? 'Escaneando&' : 'Escanear QR'}
                </Button>
                {isScanning && (
                  <Button variant="ghost" onClick={stopScanning}>
                    Detener
                  </Button>
                )}
              </div>
              {scanError && <p className="text-sm text-red-600">{scanError}</p>}
            </div>

            {isScanning && (
              <div className="border rounded-lg overflow-hidden">
                <video ref={videoRef} className="w-full aspect-video" />
              </div>
            )}

            {!checkInGuest ? (
              <div className="text-sm text-muted">
                Introduce o escanea un c�digo v�lido para mostrar la informaci�n del invitado.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-white border rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{checkInGuest.name || 'Invitado sin nombre'}</h3>
                    <p className="text-sm text-muted">
                      {checkInGuest.email || 'Sin email'} � {checkInGuest.phone || 'Sin tel�fono'}
                    </p>
                    <p className="text-sm">
                      Mesa:{' '}
                      <span className="font-medium">{checkInGuest.table || 'Pendiente'}</span>
                    </p>
                    <p className="text-sm">
                      Estado:{' '}
                      <span className={checkInGuest.checkedIn ? 'text-green-600 font-medium' : 'text-muted'}>
                        {checkInGuest.checkedIn ? 'Presente' : 'Pendiente'}
                      </span>
                    </p>
                    <p className="text-xs text-muted">
                      C�digo: {checkInGuest.checkInCode || 'No asignado'}
                    </p>
                    {checkInGuest.checkedInAt && (
                      <p className="text-xs text-muted">
                        Registrado el{' '}
                        {new Date(checkInGuest.checkedInAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={handleConfirmCheckIn}
                      disabled={checkInLoading || checkInGuest.checkedIn}
                      variant="secondary"
                    >
                      {checkInGuest.checkedIn ? 'Ya registrado' : 'Marcar presente'}
                    </Button>
                    <Button
                      onClick={handleConfirmCheckOut}
                      disabled={checkInLoading || !checkInGuest.checkedIn}
                      variant="outline"
                    >
                      Revertir check-in
                    </Button>
                  </div>
                </div>

                {Array.isArray(checkInGuest.checkInHistory) && checkInGuest.checkInHistory.length > 0 && (
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2">Historial reciente</h4>
                    <ul className="space-y-1 max-h-40 overflow-auto text-sm">
                      {checkInGuest.checkInHistory
                        .slice()
                        .reverse()
                        .slice(0, 8)
                        .map((entry, idx) => {
                          let formatted = entry.at || '';
                          if (entry?.at) {
                            try {
                              formatted = new Date(entry.at).toLocaleString();
                            } catch {
                              formatted = entry.at;
                            }
                          }
                          return (
                            <li key={`${entry.at || idx}`} className="flex justify-between gap-2">
                              <span>
                                {formatted || 'Sin registro'} � {entry.method || 'manual'}
                              </span>
                              <span className="text-muted text-xs">{entry.by || 'sistema'}</span>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>

        {/* Modal envio masivo WhatsApp */}
        {/* Modal SAVE THE DATE */}
        <SaveTheDateModal
          open={showSaveTheDate}
          onClose={closeSaveTheDate}
          guests={guests || []}
          weddingId={activeWedding}
          defaultMessage={saveTheDateDefault}
          selectedDefaultIds={selectedIds}
          coupleName={coupleLabel}
          onSent={handleSaveTheDateDelivered}
        />

        <FormalInvitationModal
          open={showFormalInvitation}
          onClose={() => setShowFormalInvitation(false)}
          guests={guests || []}
          coupleName={coupleLabel}
          defaultMessage={defaultInvitationMessage}
          defaultAssetUrl={defaultInvitationAsset}
          selectedDefaultIds={selectedIds}
          onSendWhatsApp={handleSendFormalInvites}
          onMarkDelivery={handleMarkFormalDelivery}
        />


        <WhatsAppSender
          open={showWhatsBatch}
          onClose={closeWhatsBatch}
          guests={guests || []}
          weddingId={activeWedding}
          defaultMessage={defaultInvitationMessage}
          coupleName={coupleLabel}
          onBatchCreated={(res) => {
            alert(
              t('guests.whatsapp.batchCreated', {
                defaultValue: 'Lote creado con {{count}} mensajes',
                count: res.items?.length || 0,
              })
            );
          }}
        />

        {/* Modal WhatsApp con dos pestañas (móvil personal / API) */}
        <WhatsAppModal
          open={showWhatsModal}
          onClose={handleCloseWhatsModal}
          guest={whatsGuest}
          defaultMessage={
            whatsGuest
              ? t('guests.whatsapp.dm', {
                  defaultValue:
                    '¡Hola {{name}}! Nos encantaría contar contigo en nuestra boda. ¿Puedes confirmar tu asistencia?',
                  name: whatsGuest?.name || '',
                })
              : ''
          }
          onSendDeeplink={async (g, msg) => {
            try {
              await inviteViaWhatsAppDeeplinkCustom(g, msg);
            } catch {}
          }}
          onSendApi={async (g, msg) => {
            try {
              const r = await inviteViaWhatsAppApi(g, msg, { coupleName: coupleLabel });
              if (r?.error === 'missing-couple-signature') {
                alert(
                  'El mensaje debe incluir el nombre de la pareja. A�ade la firma antes de enviarlo.'
                );
                return;
              }
              if (r?.success) setShowWhatsModal(false);
            } catch {}
          }}
          onSendApiBulk={async () => {
            try {
              const res = await bulkInviteWhatsAppApi({ coupleName: coupleLabel });
              if (res?.error === 'missing-couple-signature') {
                alert(
                  'El mensaje debe incluir el nombre de la pareja. Revisa la plantilla antes de enviar.'
                );
                return;
              }
              if (res?.success) {
                alert(`Invitaci�n enviada a ${res.ok ?? res.count ?? 0} invitado(s).`);
              }
            } catch {}
          }}
        />
      </div>
    </div>
  );
}

export default Invitados;
