import {
  Music,
  Play,
  Plus,
  Search as SearchIcon,
  X,
  Sparkles,
  Pause,
  AlertTriangle,
  GripVertical,
  Tag,
  UserPlus,
} from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast } from 'react-toastify';

import PageWrapper from '../../components/PageWrapper';
import { Card } from '../../components/ui';
import { Button } from '../../components/ui';
import Badge from '../../components/ui/Badge';
import { MUSIC_INSPIRATION } from '../../data/musicInspiration';
import useSpecialMoments, {
  RESPONSABLES_LIMIT,
  SUPPLIERS_LIMIT
} from '../../hooks/useSpecialMoments';
import useGuests from '../../hooks/useGuests';
import useTranslations from '../../hooks/useTranslations';
import { post as apiPost } from '../../services/apiClient';
import * as Playback from '../../services/PlaybackService';
import MomentActions from './components/MomentActions';

const MOMENT_TYPE_VALUES = [
  'entrada',
  'lectura',
  'votos',
  'anillos',
  'baile',
  'discurso',
  'corte_pastel',
  'salida',
  'otro',
];

const MOMENT_STATE_VALUES = ['pendiente', 'confirmado', 'ensayo'];

const RECIPIENT_ROLE_VALUES = [
  'novia',
  'novio',
  'planner',
  'oficiante',
  'familia',
  'amigo',
  'proveedor',
];

const STATE_BADGE_TYPE = {
  pendiente: 'warning',
  confirmado: 'success',
  ensayo: 'info',
};

// Tabs pasan a ser dinmicas desde el hook (blocks)

const MomentosEspeciales = () => {
  const { t } = useTranslations();
  const {
    blocks,
    moments,
    addMoment,
    updateMoment,
    removeMoment,
    reorderMoment,
    moveMoment,
    moveMomentBetweenBlocks,
    duplicateMoment,
    addBlock,
    renameBlock,
    removeBlock,
    reorderBlocks,
    maxMomentsPerBlock,
    validateMoment,
    getMomentValidationErrors,
  } = useSpecialMoments();

  const { guests } = useGuests();
  const momentTypeOptions = useMemo(
    () =>
      MOMENT_TYPE_VALUES.map((value) => ({
        value,
        label: t(`common.protocol.specialMoments.momentTypes.${value}`),
      })),
    [t]
  );
  const momentStateOptions = useMemo(
    () =>
      MOMENT_STATE_VALUES.map((value) => ({
        value,
        label: t(`common.protocol.specialMoments.states.${value}`),
      })),
    [t]
  );
  const recipientRoleOptions = useMemo(
    () =>
      RECIPIENT_ROLE_VALUES.map((value) => ({
        value,
        label: t(`common.protocol.specialMoments.recipientRoles.${value}`),
      })),
    [t]
  );
  const [recipientPanelsOpen, setRecipientPanelsOpen] = useState({});
  const { options: recipientOptions, map: guestOptionMap } = useMemo(() => {
    const list = Array.isArray(guests) ? guests : [];
    const options = list
      .map((guest) => {
        const baseId = guest?.id != null ? String(guest.id) : '';
        const fallback = guest?.email || guest?.phone || '';
        const value = baseId || fallback;
        if (!value) return null;
        const label = guest?.name || guest?.email || guest?.phone || value;
        return { value, label, raw: guest };
      })
      .filter(Boolean)
      .sort((a, b) => a.label.localeCompare(b.label));
    const map = new Map(options.map((option) => [option.value, option.raw]));
    return { options, map };
  }, [guests]);
  const recipientRoleMap = useMemo(
    () => new Map(recipientRoleOptions.map((role) => [role.value, role.label])),
    [recipientRoleOptions]
  );
  const [advancedOpen, setAdvancedOpen] = useState({});
  const [actionPanel, setActionPanel] = useState({ momentId: null, mode: null });
  const [actionPanelSelection, setActionPanelSelection] = useState({});
  const [supplierDrafts, setSupplierDrafts] = useState({});
  const [dragOverBlock, setDragOverBlock] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [showValidationAlerts, setShowValidationAlerts] = useState(true);
  const [draggedMoment, setDraggedMoment] = useState(null);
  const [draggedFromBlock, setDraggedFromBlock] = useState(null);

  // Validar momentos al cambiar
  useEffect(() => {
    if (!showValidationAlerts) return;
    
    const allErrors = {};
    blocks.forEach((block) => {
      const blockErrors = getMomentValidationErrors(block.id);
      if (Object.keys(blockErrors).length > 0) {
        allErrors[block.id] = blockErrors;
      }
    });
    
    setValidationErrors(allErrors);
    
    // Mostrar alertas para errores críticos
    const criticalErrors = [];
    Object.entries(allErrors).forEach(([blockId, blockErrors]) => {
      Object.entries(blockErrors).forEach(([momentId, errors]) => {
        errors.forEach((error) => {
          if (error.includes('requerido') || error.includes('requerida')) {
            const block = blocks.find((b) => b.id === blockId);
            const moment = moments[blockId]?.find((m) => m.id === parseInt(momentId));
            if (block && moment) {
              criticalErrors.push(`${block.name} - ${moment.title}: ${error}`);
            }
          }
        });
      });
    });
    
    // Solo mostrar alerta una vez si hay errores críticos
    if (criticalErrors.length > 0 && localStorage.getItem('momentosValidationShown') !== 'true') {
      toast.warning(t('protocol.specialMoments.toasts.validationReminder'));
      localStorage.setItem('momentosValidationShown', 'true');
    }
  }, [blocks, moments, showValidationAlerts, getMomentValidationErrors]);

  // Estado básico
  const [activeTab, setActiveTab] = useState('ceremonia');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [errorSearch, setErrorSearch] = useState(null);

  // IA e Inspiracin
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiSongs, setAiSongs] = useState([]);
  const [openCategory, setOpenCategory] = useState(null);
  const [aiLanguage, setAiLanguage] = useState('es');
  const [aiTempo, setAiTempo] = useState('');
  const [aiEra, setAiEra] = useState('');
  const [aiGenre, setAiGenre] = useState('');

  // Asegura que la pestaa activa exista entre los bloques dinmicos
  useEffect(() => {
    try {
      if (!Array.isArray(blocks) || !blocks.length) return;
      if (!blocks.find((b) => b.id === activeTab)) {
        setActiveTab(blocks[0]?.id || 'ceremonia');
      }
    } catch {}
  }, [blocks]);
  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      try {
        Playback.stop();
      } catch {}
    };
  }, []);
  const [playingId, setPlayingId] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerState, setPlayerState] = useState({ currentId: null, currentTime: 0, duration: 0, volume: 1, paused: true });

  useEffect(() => {
    try {
      const unsub = Playback.subscribe((s) => {
        setPlayerState(s || {});
        if (!s?.currentId) setPlayingId(null);
      });
      return () => { try { unsub && unsub(); } catch {} };
    } catch {}
  }, []);

  const formatTime = (s) => {
    try {
      const sec = Math.max(0, Math.floor(Number(s) || 0));
      const m = Math.floor(sec / 60);
      const r = sec % 60;
      return `${m}:${String(r).padStart(2, '0')}`;
    } catch { return '0:00'; }
  };

  // (Se elimin la seccin de conexin con Spotify)

  // Extrae un embed URL de Spotify si el campo "Cancin" contiene un enlace vlido
  const getSpotifyEmbedUrl = (raw) => {
    if (!raw || typeof raw !== 'string') return null;
    try {
      // Acepta formatos:
      //  - https://open.spotify.com/track/{id}
      //  - https://open.spotify.com/track/{id}?si=...
      //  - spotify:track:{id}
      let id = null;
      const urlMatch = raw.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
      if (urlMatch && urlMatch[1]) id = urlMatch[1];
      if (!id) {
        const uriMatch = raw.match(/spotify:track:([a-zA-Z0-9]+)/);
        if (uriMatch && uriMatch[1]) id = uriMatch[1];
      }
      return id ? `https://open.spotify.com/embed/track/${id}` : null;
    } catch {
      return null;
    }
  };

  const stopAudio = async () => {
    await Playback.stop();
    setPlayingId(null);
  };

  const togglePreview = async (item) => {
    if (!item) return;
    if (playingId === item.id) {
      await Playback.pause();
      setPlayingId(null);
      return;
    }
    await Playback.stop();
    const ok = await Playback.playTrack(item);
    setPlayingId(ok ? item.id : null);
    if (ok) setPlayerOpen(true);
  };

  // Búsqueda por nombre (iTunes Search API con CORS permitido)
  const handleSearch = async () => {
    const term = search.trim();
    if (!term) {
      setResults([]);
      return;
    }
    setLoadingSearch(true);
    setErrorSearch(null);
    try {
      // Importante: usar itunes.apple.com (no music.apple.com) para evitar CORS
      const resp = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&media=music&limit=15`
      );
      const data = await resp.json();
      if (Array.isArray(data.results)) {
        const mapped = data.results.map((r) => ({
          id: String(r.trackId),
          name: `${r.trackName} - ${r.artistName}`,
          title: r.trackName,
          artist: r.artistName,
          previewUrl: r.previewUrl,
          trackUrl: r.trackViewUrl || r.collectionViewUrl,
          artwork: r.artworkUrl60 || r.artworkUrl100,
        }));
        setResults(mapped);
      } else {
        setResults([]);
      }
    } catch (err) {
      // console.error('Error buscando Canciones', err);
      setErrorSearch(t('protocol.specialMoments.search.error'));
      setResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleDuplicateSameBlock = useCallback(
    (moment) => {
      if ((moments[activeTab]?.length || 0) >= maxMomentsPerBlock) {
        toast.warning(
          t('protocol.specialMoments.toasts.maxMomentsInSection', {
            count: maxMomentsPerBlock,
          })
        );
        return;
      }
      duplicateMoment(activeTab, moment.id, activeTab);
    },
    [moments, activeTab, maxMomentsPerBlock, duplicateMoment]
  );

  const toggleAdvancedSection = useCallback((momentId) => {
    setAdvancedOpen((prev) => ({ ...prev, [momentId]: !prev[momentId] }));
  }, []);

  const toggleActionPanelSection = useCallback(
    (momentId, mode, defaultTarget) => {
      setActionPanel((prev) => {
        if (prev.momentId === momentId && prev.mode === mode) {
          return { momentId: null, mode: null };
        }
        return { momentId, mode };
      });
      if (defaultTarget) {
        setActionPanelSelection((prev) => ({ ...prev, [momentId]: defaultTarget }));
      }
    },
    []
  );

  const closeActionPanel = useCallback(() => {
    setActionPanel({ momentId: null, mode: null });
  }, []);

  const handleActionPanelSelection = useCallback((momentId, value) => {
    setActionPanelSelection((prev) => ({ ...prev, [momentId]: value }));
  }, []);

  const handleAddResponsible = useCallback(
    (blockId, moment) => {
      const current =
        Array.isArray(moment.responsables) && moment.responsables.length
          ? moment.responsables.map((resp, index) => ({
              id: resp?.id || `${moment.id}-${index}`,
              role: resp?.role || '',
              name: typeof resp === 'string' ? resp : resp?.name || '',
              contact: resp?.contact || '',
            }))
          : [];
      if (current.length >= RESPONSABLES_LIMIT) {
        toast.warning(
          t('protocol.specialMoments.toasts.responsibleLimit', {
            count: RESPONSABLES_LIMIT,
          })
        );
        return;
      }
      const next = [
        ...current,
        { id: `${moment.id}-${Date.now()}`, role: '', name: '', contact: '' },
      ];
      updateMoment(blockId, moment.id, { ...moment, responsables: next });
    },
    [updateMoment]
  );

  const handleResponsibleChange = useCallback(
    (blockId, moment, index, patch) => {
      const current =
        Array.isArray(moment.responsables) && moment.responsables.length
          ? moment.responsables.map((resp, idx) => ({
              id: resp?.id || `${moment.id}-${idx}`,
              role: resp?.role || '',
              name: typeof resp === 'string' ? resp : resp?.name || '',
              contact: resp?.contact || '',
            }))
          : [];
      if (!current[index]) {
        current[index] = { id: `${moment.id}-${index}`, role: '', name: '', contact: '' };
      }
      current[index] = { ...current[index], ...patch };
      updateMoment(blockId, moment.id, { ...moment, responsables: current });
    },
    [updateMoment]
  );

  const handleRemoveResponsible = useCallback(
    (blockId, moment, index) => {
      const current = Array.isArray(moment.responsables) ? [...moment.responsables] : [];
      const next = current.filter((_, idx) => idx !== index);
      updateMoment(blockId, moment.id, { ...moment, responsables: next });
    },
    [updateMoment]
  );

  const handleSupplierInputChange = useCallback((momentId, value) => {
    setSupplierDrafts((prev) => ({ ...prev, [momentId]: value }));
  }, []);

  const handleAddSupplier = useCallback(
    (blockId, moment) => {
      const draftRaw = supplierDrafts[moment.id] || '';
      const draft = draftRaw.trim();
      if (!draft) {
        toast.info(t('protocol.specialMoments.toasts.supplierDraftRequired'));
        return;
      }
      const current = Array.isArray(moment.suppliers) ? [...moment.suppliers] : [];
      if (current.length >= SUPPLIERS_LIMIT) {
        toast.warning(
          t('protocol.specialMoments.toasts.supplierLimit', {
            count: SUPPLIERS_LIMIT,
          })
        );
        return;
      }
      if (current.some((supplier) => supplier.toLowerCase() === draft.toLowerCase())) {
        toast.info(t('protocol.specialMoments.toasts.supplierAlreadyExists'));
        return;
      }
      current.push(draft);
      updateMoment(blockId, moment.id, { ...moment, suppliers: current });
      setSupplierDrafts((prev) => ({ ...prev, [moment.id]: '' }));
    },
    [supplierDrafts, updateMoment]
  );

  const handleRemoveSupplier = useCallback(
    (blockId, moment, index) => {
      const current = Array.isArray(moment.suppliers) ? [...moment.suppliers] : [];
      const next = current.filter((_, idx) => idx !== index);
      updateMoment(blockId, moment.id, { ...moment, suppliers: next });
    },
    [updateMoment]
  );

  const orderedMoments = useMemo(() => {
    const list = Array.isArray(moments[activeTab]) ? [...moments[activeTab]] : [];
    return list.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [moments, activeTab]);

  const computeMomentWarnings = useCallback((moment) => {
    const warnings = [];
    const timeValue = typeof moment?.time === 'string' ? moment.time.trim() : '';
    if (!timeValue) warnings.push(t('protocol.specialMoments.warnings.missingTime'));
    const responsablesList = Array.isArray(moment?.responsables)
      ? moment.responsables.filter((resp) => {
          if (!resp) return false;
          if (typeof resp === 'string') return resp.trim().length > 0;
          return (
            (resp.name && String(resp.name).trim() !== '') ||
            (resp.role && String(resp.role).trim() !== '')
          );
        })
      : [];
    if (!responsablesList.length) {
      warnings.push(t('protocol.specialMoments.warnings.missingResponsible'));
    }
    const needsRecipient = ['lectura', 'discurso', 'votos'].includes(moment?.type);
    if (needsRecipient && !(moment?.recipientId || moment?.recipientName || moment?.recipientRole)) {
      warnings.push(t('protocol.specialMoments.warnings.missingRecipient'));
    }
    if (['entrada', 'baile'].includes(moment?.type) && !(moment?.song && String(moment.song).trim())) {
      warnings.push(t('protocol.specialMoments.warnings.missingSong'));
    }
    return warnings;
  }, [t]);

  const blockIssuesCount = useMemo(
    () => orderedMoments.filter((moment) => computeMomentWarnings(moment).length > 0).length,
    [orderedMoments, computeMomentWarnings]
  );

  const handleDragEnd = useCallback(
    (result) => {
      if (!result.destination) return;
      if (result.destination.droppableId !== result.source.droppableId) return;
      if (result.destination.index === result.source.index) return;
      const dragged = orderedMoments[result.source.index];
      if (!dragged) return;
      moveMoment(activeTab, dragged.id, result.destination.index);
    },
    [orderedMoments, moveMoment, activeTab]
  );

  const handleConfirmAction = useCallback(
    (moment, mode) => {
      const targetBlockId = actionPanelSelection[moment.id];
      if (!targetBlockId) {
        toast.info(t('protocol.specialMoments.toasts.selectTargetSection'));
        return;
      }
      if (mode === 'duplicate') {
        if ((moments[targetBlockId]?.length || 0) >= maxMomentsPerBlock) {
        toast.warning(
          t('protocol.specialMoments.toasts.maxMomentsInSection', {
            count: maxMomentsPerBlock,
          })
        );
          return;
        }
        duplicateMoment(activeTab, moment.id, targetBlockId);
        toast.success(t('protocol.specialMoments.toasts.momentDuplicated'));
        closeActionPanel();
        return;
      }
      if (mode === 'move') {
        if (targetBlockId === activeTab) {
        toast.info(t('protocol.specialMoments.toasts.selectDifferentSection'));
          return;
        }
        if ((moments[targetBlockId]?.length || 0) >= maxMomentsPerBlock) {
        toast.warning(
          t('protocol.specialMoments.toasts.maxMomentsInSection', {
            count: maxMomentsPerBlock,
          })
        );
          return;
        }
        duplicateMoment(activeTab, moment.id, targetBlockId);
        removeMoment(activeTab, moment.id);
        toast.success(t('protocol.specialMoments.toasts.momentMoved'));
        setActiveTab(targetBlockId);
        closeActionPanel();
      }
    },
    [
      actionPanelSelection,
      activeTab,
      closeActionPanel,
      duplicateMoment,
      maxMomentsPerBlock,
      moments,
      removeMoment,
      setActiveTab,
    ]
  );

  const openActionPanel = useCallback(
    (momentId, mode) => {
      const otherBlocks = (blocks || []).filter(
        (block) => (block.id || block.key) !== activeTab
      );
      if (!otherBlocks.length) {
        toast.info(t('protocol.specialMoments.toasts.createAnotherSection'));
        return;
      }
      const fallback = actionPanelSelection[momentId] || otherBlocks[0].id || otherBlocks[0].key;
      toggleActionPanelSection(momentId, mode, fallback);
    },
    [blocks, activeTab, actionPanelSelection, toggleActionPanelSection]
  );

  const renderMomentCard = (moment, idx, draggableProvided, draggableSnapshot) => {
    const warnings = computeMomentWarnings(moment);
    const responsablesList =
      Array.isArray(moment.responsables) && moment.responsables.length
        ? moment.responsables.map((resp, index) => ({
            id: resp?.id || `${moment.id}-${index}`,
            role: resp?.role || '',
            name: typeof resp === 'string' ? resp : resp?.name || '',
            contact: resp?.contact || '',
          }))
        : [];
    const suppliersList = Array.isArray(moment.suppliers) ? moment.suppliers : [];
    const supplierDraft = supplierDrafts[moment.id] || '';
    const isAdvanced = !!advancedOpen[moment.id];
    const actionMode = actionPanel.momentId === moment.id ? actionPanel.mode : null;
    const otherBlocks = (blocks || []).filter((block) => (block.id || block.key) !== activeTab);
    const stateBadgeType = STATE_BADGE_TYPE[moment.state] || 'default';
    const stateOption = moment.state
      ? momentStateOptions.find((option) => option.value === moment.state)
      : null;
    const stateLabel = stateOption
      ? stateOption.label
      : t('protocol.specialMoments.labels.stateNone');
    const recipientMode = moment.recipientRole
      ? 'role'
      : moment.recipientId
      ? 'guest'
      : moment.recipientName
      ? 'custom'
      : 'none';
    const selectedValue =
      recipientMode === 'guest'
        ? String(moment.recipientId)
        : recipientMode === 'custom'
        ? '__custom'
        : recipientMode === 'role'
        ? `__role__${moment.recipientRole}`
        : '';
    const selectedGuest =
      recipientMode === 'guest' && selectedValue ? guestOptionMap.get(selectedValue) : null;
    const buttonLabel =
      recipientMode === 'role'
        ? recipientRoleMap.get(moment.recipientRole) ||
          t('protocol.specialMoments.labels.recipientRoleFallback')
        : selectedGuest?.name ||
          moment.recipientName ||
          t('protocol.specialMoments.labels.recipientDefault');

    return (
      <div
        ref={draggableProvided.innerRef}
        {...draggableProvided.draggableProps}
        className={`border rounded-lg bg-white p-3 transition-shadow ${
          draggableSnapshot.isDragging ? 'shadow-lg ring-2 ring-blue-200 bg-blue-50/80' : ''
        }`}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div
                  {...draggableProvided.dragHandleProps}
                  className="text-gray-400 cursor-grab active:cursor-grabbing"
                  aria-label={t('protocol.specialMoments.aria.reorderHandle')}
                >
                  <GripVertical size={16} />
                </div>
                <input
                  type="text"
                  className="w-full flex-1 min-w-[180px] font-medium border-0 border-b border-transparent focus:border-blue-300 focus:ring-0 p-0 pb-1"
                  value={moment.title || ''}
                  onChange={(e) =>
                    updateMoment(activeTab, moment.id, {
                      ...moment,
                      title: e.target.value,
                    })
                  }
                  placeholder={t('protocol.specialMoments.placeholders.momentTitle')}
                />
                <Badge type={stateBadgeType} className="uppercase tracking-wide">
                  {stateLabel}
                </Badge>
                {moment.optional && (
                  <Badge type="info">
                    {t('protocol.specialMoments.labels.optionalBadge')}
                  </Badge>
                )}
                <Badge type="primary">#{idx + 1}</Badge>
              </div>

              {warnings.length > 0 && (
                <div className="mt-2 flex items-start gap-2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                  <div className="space-y-0.5">
                    {warnings.map((warning, warningIdx) => (
                      <div key={warningIdx}>{warning}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    {t('protocol.specialMoments.labels.type')}
                  </div>
                  <select
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={moment.type || 'otro'}
                    onChange={(e) =>
                      updateMoment(activeTab, moment.id, {
                        ...moment,
                        type: e.target.value,
                      })
                    }
                  >
                    {momentTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    {t('protocol.specialMoments.labels.location')}
                  </div>
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={moment.location || ''}
                    onChange={(e) =>
                      updateMoment(activeTab, moment.id, {
                        ...moment,
                        location: e.target.value,
                      })
                    }
                    placeholder={t('protocol.specialMoments.placeholders.location')}
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    {t('protocol.specialMoments.labels.state')}
                  </div>
                  <select
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={moment.state || 'pendiente'}
                    onChange={(e) =>
                      updateMoment(activeTab, moment.id, {
                        ...moment,
                        state: e.target.value,
                      })
                    }
                  >
                    {momentStateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    id={`optional-${moment.id}`}
                    type="checkbox"
                    checked={!!moment.optional}
                    onChange={(e) =>
                      updateMoment(activeTab, moment.id, {
                        ...moment,
                        optional: e.target.checked,
                      })
                    }
                  />
                  <label htmlFor={`optional-${moment.id}`}>
                    {t('protocol.specialMoments.labels.optionalToggle')}
                  </label>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,2fr),minmax(0,1fr),minmax(0,1fr)]">
                <div className="min-w-[200px]">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Music size={12} /> {t('protocol.specialMoments.labels.song')}
                  </div>
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={moment.song || ''}
                    onChange={(e) =>
                      updateMoment(activeTab, moment.id, {
                        ...moment,
                        song: e.target.value,
                      })
                    }
                    placeholder={t('protocol.specialMoments.placeholders.song')}
                  />
                  {(() => {
                    const embed = getSpotifyEmbedUrl(moment.song);
                    if (!embed) return null;
                    return (
                      <div className="mt-2">
                        <iframe
                          title="Spotify Player"
                          src={embed}
                          width="100%"
                          height="80"
                          frameBorder="0"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                        />
                        <div className="text-[11px] text-gray-500 mt-1">
                          {t('protocol.specialMoments.helperTexts.spotifyEmbed')}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    {t('protocol.specialMoments.labels.time')}
                  </div>
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={moment.time || ''}
                    onChange={(e) =>
                      updateMoment(activeTab, moment.id, {
                        ...moment,
                        time: e.target.value,
                      })
                    }
                    placeholder={t('protocol.specialMoments.placeholders.time')}
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    {t('protocol.specialMoments.labels.duration')}
                  </div>
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={moment.duration || ''}
                    onChange={(e) =>
                      updateMoment(activeTab, moment.id, {
                        ...moment,
                        duration: e.target.value,
                      })
                    }
                    placeholder={t('protocol.specialMoments.placeholders.duration')}
                  />
                </div>
              </div>
            </div>

            <MomentActions
              canMoveUp={idx > 0}
              canMoveDown={idx < orderedMoments.length - 1}
              onMoveUp={() => reorderMoment(activeTab, moment.id, 'up')}
              onMoveDown={() => reorderMoment(activeTab, moment.id, 'down')}
              onDuplicateHere={() => handleDuplicateSameBlock(moment)}
              onDuplicateElse={() => openActionPanel(moment.id, 'duplicate')}
              onMoveElse={() => openActionPanel(moment.id, 'move')}
              onDelete={() => removeMoment(activeTab, moment.id)}
            />
          </div>

          {(() => {
            const isOpen = !!recipientPanelsOpen[moment.id];
            return (
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setRecipientPanelsOpen((prev) => ({
                      ...prev,
                      [moment.id]: !prev[moment.id],
                    }))
                  }
                  className="text-xs text-blue-600 hover:underline"
                >
                  {isOpen
                    ? t('protocol.specialMoments.toggles.hideRecipient')
                    : t('protocol.specialMoments.labels.recipientSummary', {
                        label: buttonLabel,
                      })}
                </button>
                {isOpen && (
                  <div className="mt-2 space-y-2 rounded border border-gray-200 bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">
                      {t('protocol.specialMoments.labels.recipientHint')}
                    </div>
                    <select
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={selectedValue}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!value) {
                          updateMoment(activeTab, moment.id, {
                            ...moment,
                            recipientId: '',
                            recipientName: '',
                            recipientRole: '',
                          });
                        } else if (value === '__custom') {
                          updateMoment(activeTab, moment.id, {
                            ...moment,
                            recipientId: '',
                            recipientRole: '',
                            recipientName: moment.recipientName || '',
                          });
                        } else if (value.startsWith('__role__')) {
                          const roleValue = value.replace('__role__', '');
                          updateMoment(activeTab, moment.id, {
                            ...moment,
                            recipientRole: roleValue,
                            recipientId: '',
                            recipientName: '',
                          });
                        } else {
                          const guest = guestOptionMap.get(value);
                          updateMoment(activeTab, moment.id, {
                            ...moment,
                            recipientId: value,
                            recipientRole: '',
                            recipientName: guest?.name || guest?.email || '',
                          });
                        }
                      }}
                    >
                      <option value="">
                        {t('protocol.specialMoments.options.recipient.none')}
                      </option>
                      <option value="__custom">
                        {t('protocol.specialMoments.options.recipient.custom')}
                      </option>
                      {recipientRoleOptions.map((role) => (
                        <option key={role.value} value={`__role__${role.value}`}>
                          {t('protocol.specialMoments.options.recipient.rolePrefix', {
                            role: role.label,
                          })}
                        </option>
                      ))}
                      {recipientOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}{' '}
                          {option.raw?.table
                            ? t('protocol.specialMoments.options.recipient.table', {
                                table: option.raw.table,
                              })
                            : ''}
                        </option>
                      ))}
                    </select>
                    {selectedValue === '__custom' && (
                      <input
                        type="text"
                        className="w-full border rounded px-2 py-1 text-sm"
                        placeholder={t(
                          'common.protocol.specialMoments.placeholders.recipientManual'
                        )}
                        value={moment.recipientName || ''}
                        onChange={(e) =>
                          updateMoment(activeTab, moment.id, {
                            ...moment,
                            recipientId: '',
                            recipientRole: '',
                            recipientName: e.target.value,
                          })
                        }
                      />
                    )}
                    {selectedGuest && (
                      <div className="text-xs text-gray-500">
                        {t('protocol.specialMoments.helperTexts.recipientDetails', {
                          table: selectedGuest.table || selectedGuest.tableId || '—',
                          diet: selectedGuest.dietaryRestrictions || '—',
                        })}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-xs text-gray-500 hover:text-red-600"
                        onClick={() =>
                          updateMoment(activeTab, moment.id, {
                            ...moment,
                            recipientId: '',
                            recipientName: '',
                            recipientRole: '',
                          })
                        }
                      >
                        {t('protocol.specialMoments.buttons.clear')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {actionMode && (
            <div className="rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
              <div className="font-semibold mb-2">
                {actionMode === 'duplicate'
                  ? t('protocol.specialMoments.labels.actionDuplicate')
                  : t('protocol.specialMoments.labels.actionMove')}
              </div>
              {otherBlocks.length ? (
                <>
                  <select
                    className="w-full border rounded px-2 py-1 text-sm mb-2"
                    value={actionPanelSelection[moment.id] || ''}
                    onChange={(e) => handleActionPanelSelection(moment.id, e.target.value)}
                  >
                    {otherBlocks.map((block) => (
                      <option key={block.id || block.key} value={block.id || block.key}>
                        {block.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <Button
                      size="xs"
                      onClick={() => handleConfirmAction(moment, actionMode)}
                      className="text-xs"
                    >
                      {t('protocol.specialMoments.buttons.confirm')}
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={closeActionPanel}
                      className="text-xs"
                    >
                      {t('app.cancel')}
                    </Button>
                  </div>
                </>
              ) : (
                <p>{t('protocol.specialMoments.helperTexts.noOtherSections')}</p>
              )}
            </div>
          )}

          <div>
            <button
              type="button"
              className="text-xs text-blue-600 hover:underline"
              onClick={() => toggleAdvancedSection(moment.id)}
            >
              {isAdvanced
                ? t('protocol.specialMoments.toggles.hideAdvanced')
                : t('protocol.specialMoments.toggles.showAdvanced')}
            </button>
            {isAdvanced && (
              <div className="mt-2 space-y-3 rounded border border-gray-200 bg-gray-50 p-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                    {t('protocol.specialMoments.labels.responsibles')}
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleAddResponsible(activeTab, moment)}
                      disabled={responsablesList.length >= RESPONSABLES_LIMIT}
                    >
                      <UserPlus size={14} className="mr-1" />
                      {t('app.add')}
                    </Button>
                  </div>
                  {responsablesList.length ? (
                    <div className="mt-2 space-y-2">
                      {responsablesList.map((responsable, responsableIdx) => (
                        <div
                          key={responsable.id || responsableIdx}
                          className="grid gap-2 md:grid-cols-[1fr,1fr,1fr,auto]"
                        >
                          <input
                            type="text"
                            className="border rounded px-2 py-1 text-sm"
                            placeholder={t('protocol.specialMoments.placeholders.role')}
                            value={responsable.role || ''}
                            onChange={(e) =>
                              handleResponsibleChange(activeTab, moment, responsableIdx, {
                                role: e.target.value,
                              })
                            }
                          />
                          <input
                            type="text"
                            className="border rounded px-2 py-1 text-sm"
                            placeholder={t('protocol.specialMoments.placeholders.name')}
                            value={responsable.name || ''}
                            onChange={(e) =>
                              handleResponsibleChange(activeTab, moment, responsableIdx, {
                                name: e.target.value,
                              })
                            }
                          />
                          <input
                            type="text"
                            className="border rounded px-2 py-1 text-sm"
                            placeholder={t('protocol.specialMoments.placeholders.contact')}
                            value={responsable.contact || ''}
                            onChange={(e) =>
                              handleResponsibleChange(activeTab, moment, responsableIdx, {
                                contact: e.target.value,
                              })
                            }
                          />
                          <button
                            type="button"
                            className="text-xs text-red-500 hover:underline"
                            onClick={() => handleRemoveResponsible(activeTab, moment, responsableIdx)}
                          >
                            {t('protocol.specialMoments.buttons.remove')}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-500">
                      {t('protocol.specialMoments.helperTexts.responsiblesEmpty')}
                    </p>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">
                    {t('protocol.specialMoments.labels.requirements')}
                  </div>
                  <textarea
                    rows={3}
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={moment.requirements || ''}
                    onChange={(e) =>
                      updateMoment(activeTab, moment.id, {
                        ...moment,
                        requirements: e.target.value,
                      })
                    }
                    placeholder={t('protocol.specialMoments.placeholders.requirements')}
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">
                    {t('protocol.specialMoments.labels.relatedSuppliers')}
                  </div>
                  {suppliersList.length ? (
                    <div className="flex flex-wrap gap-2">
                      {suppliersList.map((supplier, supplierIdx) => (
                        <span
                          key={`${moment.id}-supplier-${supplierIdx}`}
                          className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                        >
                          <Tag size={12} className="text-gray-400" />
                          {supplier}
                          <button
                            type="button"
                            className="text-gray-400 hover:text-red-500"
                            onClick={() => handleRemoveSupplier(activeTab, moment, supplierIdx)}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      {t('protocol.specialMoments.helperTexts.suppliersEmpty')}
                    </p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      className="flex-1 border rounded px-2 py-1 text-sm"
                      placeholder={t('protocol.specialMoments.placeholders.supplier')}
                      value={supplierDraft}
                      onChange={(e) => handleSupplierInputChange(moment.id, e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSupplier(activeTab, moment)}
                      disabled={!supplierDraft.trim()}
                    >
                      {t('app.add')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Aadir momento
  const handleAddMoment = () => {
    const currentCount = moments[activeTab]?.length || 0;
    if (currentCount >= maxMomentsPerBlock) {
      toast.warning(
        t('protocol.specialMoments.toasts.maxMomentsInSection', {
          count: maxMomentsPerBlock,
        })
      );
      return;
    }
    const nextOrder = currentCount + 1;
    addMoment(activeTab, {
      order: nextOrder,
      title: t('protocol.specialMoments.defaults.newMoment', { count: nextOrder }),
      song: '',
      time: '',
    });
  };

  // Bsqueda con IA via backend
  const handleAISearch = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) {
      setAiSongs([]);
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const prefs = [];
      if (aiLanguage) {
        prefs.push(
          t(`common.protocol.specialMoments.ai.preferences.language.${aiLanguage}`, {
            defaultValue: aiLanguage,
          })
        );
      }
      if (aiTempo) {
        prefs.push(
          t(`common.protocol.specialMoments.ai.preferences.tempo.${aiTempo}`, {
            defaultValue: aiTempo,
          })
        );
      }
      if (aiEra) {
        prefs.push(
          t(`common.protocol.specialMoments.ai.preferences.era.${aiEra}`, {
            defaultValue: aiEra,
          })
        );
      }
      if (aiGenre) {
        prefs.push(
          t(`common.protocol.specialMoments.ai.preferences.genre.${aiGenre}`, {
            defaultValue: aiGenre,
          })
        );
      }
      const fullPrompt = prefs.length
        ? `${prompt}. ${t('protocol.specialMoments.ai.preferencesPrefix')}: ${prefs.join(', ')}`
        : prompt;
      const res = await apiPost(
        '/api/ai-songs/recommend',
        { prompt: fullPrompt, context: activeTab, language: aiLanguage },
        { auth: true }
      );
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const items = Array.isArray(data?.songs) ? data.songs : [];
      const mapped = items.map((s, i) => ({
        id: `${Date.now()}-${i}`,
        title: s.title || s.name || t('protocol.specialMoments.labels.song'),
        artist: s.artist || s.author || '',
        reason: s.reason || s.why || '',
        mood: s.mood || '',
        tempo: s.tempo || '',
        era: s.era || '',
        tags: Array.isArray(s.tags) ? s.tags : [],
      }));
      // Intentar enriquecer con previews de iTunes (best-effort)
      const enrich = async (song) => {
        try {
          const q = `${song.title} ${song.artist}`.trim();
          if (!q) return song;
          // Usar itunes.apple.com para evitar CORS en navegador
          const resp = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&media=music&limit=1`
          );
          const json = await resp.json();
          const hit = Array.isArray(json?.results) && json.results[0] ? json.results[0] : null;
          if (hit?.previewUrl) {
            return {
              ...song,
              previewUrl: hit.previewUrl,
              artwork: hit.artworkUrl60 || hit.artworkUrl100 || song.artwork,
              trackUrl: hit.trackViewUrl || hit.collectionViewUrl || song.trackUrl,
            };
          }
        } catch {}
        return song;
      };
      const enriched = [];
      for (let i = 0; i < mapped.length; i++) {
        // Secuencial para evitar rfagas innecesarias
        // Se puede mejorar con lmite de concurrencia si hiciera falta
        // eslint-disable-next-line no-await-in-loop
        enriched.push(await enrich(mapped[i]));
      }
      setAiSongs(enriched);
    } catch (e) {
      // console.error('AI songs error', e);
      setAiError(t('protocol.specialMoments.ai.error'));
      setAiSongs([]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <PageWrapper title={t('protocol.specialMoments.title')}>
      <div className="space-y-6">
        <p className="text-gray-600">
          {t('protocol.specialMoments.description')}
        </p>

        {/* Tabs (dinmicas desde blocks) */}
        <div className="border-b flex gap-4">
          {(blocks || []).map((tab) => (
            <button
              key={tab.id}
              className={`pb-2 -mb-px font-medium ${activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
              onClick={() => {
                stopAudio();
                setActiveTab(tab.id);
                setResults([]);
                setSearch('');
                setAiSongs([]);
                setAiError(null);
              }}
              title={tab.name}
            >
              {tab.name}
            </button>
          ))}
          <button
            className="ml-auto text-xs border rounded px-2 py-1 hover:bg-gray-50"
            onClick={() => {
              const name = prompt(t('protocol.specialMoments.prompts.newSection'));
              if (!name) return;
              try { addBlock(name); } catch {}
            }}
            title={t('protocol.specialMoments.tooltips.addSection')}
          >
            {t('protocol.specialMoments.buttons.addSection')}
          </button>
        </div>

        {/* Content */}
        <Card className="space-y-5 p-5">
          {/* Mini reproductor (desplegable) para previews HTML5 */}
          {playerState?.currentId ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 truncate mr-2">
                  {t('protocol.specialMoments.labels.playerNowPlaying')}
                </div>
                <button
                  className="text-xs border rounded px-2 py-1 hover:bg-gray-50"
                  onClick={() => setPlayerOpen((v) => !v)}
                >
                  {playerOpen
                    ? t('protocol.specialMoments.toggles.hidePlayer')
                    : t('protocol.specialMoments.toggles.showPlayer')}
                </button>
              </div>
              {playerOpen && (
                <div className="border rounded-md p-3 bg-white shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={async () => {
                        if (playerState.paused) await Playback.resume(); else await Playback.pause();
                      }}
                      className="p-1 text-gray-700 hover:text-blue-600"
                      title={
                        playerState.paused
                          ? t('protocol.specialMoments.player.play')
                          : t('protocol.specialMoments.player.pause')
                      }
                    >
                      {playerState.paused ? <Play size={16} /> : <Pause size={16} />}
                    </button>
                    <button
                      onClick={async () => { await Playback.stop(); setPlayerOpen(false); }}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title={t('protocol.specialMoments.player.stop')}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {/* Barra de progreso */}
                  <div className="space-y-1 mb-2">
                    <input
                      type="range"
                      min={0}
                      max={playerState?.duration || 0}
                      step={0.1}
                      value={Math.min(playerState?.currentTime || 0, playerState?.duration || 0)}
                      onChange={(e) => {
                        const v = Number(e.target.value || 0);
                        Playback.seek(v);
                      }}
                      className="w-full"
                      disabled={!playerState?.duration}
                    />
                    <div className="text-[11px] text-gray-500 flex justify-between">
                      <span>{formatTime(playerState?.currentTime || 0)}</span>
                      <span>{formatTime(playerState?.duration || 0)}</span>
                    </div>
                  </div>
                  {/* Volumen */}
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600">
                      {t('protocol.specialMoments.player.volume')}
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={typeof playerState?.volume === 'number' ? playerState.volume : 1}
                      onChange={(e) => Playback.setVolume(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : null}
          {/* Inspiración Musical - Todas las sugerencias visibles */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-yellow-500" />
              <h3 className="font-semibold text-lg">
                {t('protocol.specialMoments.labels.musicInspiration')}
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(MUSIC_INSPIRATION[activeTab] || {}).map(([cat, songs]) => (
                <div 
                  key={cat} 
                  className="rounded-xl border border-soft bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface)]/80 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 px-4 py-3 border-b border-soft">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <Music size={16} className="text-yellow-600" />
                      {cat}
                    </h4>
                  </div>
                  <div className="p-3">
                    <div className="grid gap-2">
                      {songs.map((s, idx) => (
                        <div
                          key={`${cat}-${idx}`}
                          className="group flex items-center justify-between gap-3 p-3 rounded-lg bg-white/50 hover:bg-yellow-50/50 border border-transparent hover:border-yellow-200 transition-all duration-200"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {s.title}
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {s.artist}
                            </div>
                            {s.tags?.length ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {s.tags.map((tag, tagIdx) => (
                                  <span
                                    key={tagIdx}
                                    className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-yellow-100 text-yellow-700"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          <Button
                            size="sm"
                            className="flex-shrink-0 bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm"
                            onClick={() => {
                              if (!moments[activeTab]?.length) {
                                addMoment(activeTab, {
                                  order: 1,
                                  title: cat,
                                  song: `${s.title} - ${s.artist}`,
                                  time: '',
                                });
                              } else {
                                const last = [...(moments[activeTab] || [])].pop();
                                if (last)
                                  updateMoment(activeTab, last.id, {
                                    ...last,
                                    song: `${s.title} - ${s.artist}`,
                                  });
                              }
                          toast.success(
                            t('protocol.specialMoments.toasts.songApplied')
                          );
                        }}
                      >
                        {t('protocol.specialMoments.buttons.use')}
                      </Button>
                    </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Búsqueda con IA */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-purple-600" />
              <h3 className="font-semibold text-lg">
                {t('protocol.specialMoments.labels.aiTitle')}
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1">
                  {t('protocol.specialMoments.labels.language')}
                </label>
                <select
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={aiLanguage}
                  onChange={(e) => setAiLanguage(e.target.value)}
                >
                  <option value="es">
                    {t('protocol.specialMoments.options.languages.es')}
                  </option>
                  <option value="en">
                    {t('protocol.specialMoments.options.languages.en')}
                  </option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">
                  {t('protocol.specialMoments.labels.tempo')}
                </label>
                <select
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={aiTempo}
                  onChange={(e) => setAiTempo(e.target.value)}
                >
                  <option value="">
                    {t('protocol.specialMoments.options.tempo.any')}
                  </option>
                  <option value="slow">
                    {t('protocol.specialMoments.options.tempo.slow')}
                  </option>
                  <option value="medium">
                    {t('protocol.specialMoments.options.tempo.medium')}
                  </option>
                  <option value="fast">
                    {t('protocol.specialMoments.options.tempo.fast')}
                  </option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">
                  {t('protocol.specialMoments.labels.era')}
                </label>
                <select
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={aiEra}
                  onChange={(e) => setAiEra(e.target.value)}
                >
                  <option value="">
                    {t('protocol.specialMoments.options.era.any')}
                  </option>
                  <option value="80s">
                    {t('protocol.specialMoments.options.era.80s')}
                  </option>
                  <option value="90s">
                    {t('protocol.specialMoments.options.era.90s')}
                  </option>
                  <option value="2000s">
                    {t('protocol.specialMoments.options.era.2000s')}
                  </option>
                  <option value="2010s">
                    {t('protocol.specialMoments.options.era.2010s')}
                  </option>
                  <option value="current">
                    {t('protocol.specialMoments.options.era.current')}
                  </option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">
                  {t('protocol.specialMoments.labels.genre')}
                </label>
                <select
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={aiGenre}
                  onChange={(e) => setAiGenre(e.target.value)}
                >
                  <option value="">
                    {t('protocol.specialMoments.options.genre.any')}
                  </option>
                  <option value="pop">
                    {t('protocol.specialMoments.options.genre.pop')}
                  </option>
                  <option value="rock">
                    {t('protocol.specialMoments.options.genre.rock')}
                  </option>
                  <option value="jazz">
                    {t('protocol.specialMoments.options.genre.jazz')}
                  </option>
                  <option value="latin">
                    {t('protocol.specialMoments.options.genre.latin')}
                  </option>
                  <option value="classical">
                    {t('protocol.specialMoments.options.genre.classical')}
                  </option>
                  <option value="indie">
                    {t('protocol.specialMoments.options.genre.indie')}
                  </option>
                  <option value="rnb">
                    {t('protocol.specialMoments.options.genre.rnb')}
                  </option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 items-start">
              <textarea
                rows={2}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={t('protocol.specialMoments.placeholders.aiPrompt')}
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                onClick={handleAISearch}
                className="bg-purple-600 text-white px-3 py-2 rounded flex items-center gap-1"
              >
                <Sparkles size={16} /> {t('protocol.specialMoments.buttons.searchWithAI')}
              </button>
            </div>
            {aiLoading && (
              <p className="text-sm text-gray-500">
                {t('protocol.specialMoments.ai.loading')}
              </p>
            )}
            {aiError && <p className="text-sm text-red-600">{aiError}</p>}
            {aiSongs.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <div className="bg-gray-50 p-2 border-b text-sm font-medium">
                  {t('protocol.specialMoments.ai.resultsTitle')}
                  <button
                    onClick={() => setAiSongs([])}
                    className="float-right text-gray-500 hover:text-gray-700"
                  >
                    <X size={16} />
                  </button>
                </div>
                <ul className="divide-y">
                  {aiSongs.map((s) => (
                    <li key={s.id} className="p-2 hover:bg-purple-50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {s.title}{' '}
                            {s.artist ? <span className="text-gray-500">- {s.artist}</span> : null}
                          </div>
                          {(s.mood || s.tempo || s.era || s.tags?.length) && (
                            <div className="text-xs text-gray-500 truncate">
                              {[s.mood, s.tempo, s.era].filter(Boolean).join(' · ')}
                              {s.tags?.length ? ` · ${s.tags.join(' · ')}` : ''}
                            </div>
                          )}
                          {s.reason && (
                            <div className="text-xs text-gray-600 line-clamp-2">{s.reason}</div>
                          )}
                          <div className="text-xs text-gray-500 truncate mt-1">
                            {t('protocol.specialMoments.labels.viewOn')}{' '}
                            <a
                              className="ml-1 hover:underline"
                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${s.title} ${s.artist || ''}`)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              YouTube
                            </a>
                            <span> · </span>
                            <a
                              className="hover:underline"
                              href={`https://open.spotify.com/search/${encodeURIComponent(`${s.title} ${s.artist || ''}`)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Spotify
                            </a>
                            <span> · </span>
                            <a
                              className="hover:underline"
                              href={`https://music.apple.com/search?term=${encodeURIComponent(`${s.title} ${s.artist || ''}`)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Apple
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            title={
                              playingId === s.id
                                ? t('protocol.specialMoments.player.pause')
                                : t('protocol.specialMoments.player.play')
                            }
                            onClick={() => togglePreview(s)}
                            className="text-gray-500 hover:text-purple-600 p-1"
                          >
                            {playingId === s.id ? <Pause size={16} /> : <Play size={16} />}
                          </button>
                          <Button
                            className="text-xs py-1 px-2"
                            onClick={() => {
                              if (!moments[activeTab]?.length) {
                                addMoment(activeTab, {
                                  order: 1,
                                  title: t('protocol.specialMoments.defaults.momentTitle'),
                                  song: `${s.title}${s.artist ? ` - ${s.artist}` : ''}`,
                                  time: '',
                                });
                              } else {
                                const last = [...(moments[activeTab] || [])].pop();
                                if (last)
                                  updateMoment(activeTab, last.id, {
                                    ...last,
                                    song: `${s.title}${s.artist ? ` - ${s.artist}` : ''}`,
                                  });
                              }
                            }}
                          >
                            {t('protocol.specialMoments.buttons.use')}
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Buscador de Canciones (por nombre) */}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('protocol.specialMoments.placeholders.searchSong')}
              className="flex-1 border rounded px-3 py-2"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-1"
            >
              <SearchIcon size={16} /> {t('app.search')}
            </button>
          </div>

          {/* Estado búsqueda */}
          {loadingSearch && (
            <p className="text-sm text-gray-500">
              {t('protocol.specialMoments.search.loading')}
            </p>
          )}
          {errorSearch && <p className="text-sm text-red-600">{errorSearch}</p>}

          {/* Resultados búsqueda */}
          {results.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-50 p-2 border-b text-sm font-medium">
                {t('protocol.specialMoments.search.resultsTitle')}
                <button
                  onClick={() => {
                    setResults([]);
                    stopAudio();
                  }}
                  className="float-right text-gray-500 hover:text-gray-700"
                >
                  <X size={16} />
                </button>
              </div>
              <ul className="divide-y">
                {results.map((song) => (
                  <li key={song.id} className="p-2 hover:bg-blue-50">
                    <div className="w-full flex items-center gap-2">
                      {song.artwork && (
                        <img
                          src={song.artwork}
                          alt="cover"
                          className="w-8 h-8 rounded object-cover"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium">
                          {song.title} <span className="text-gray-500">- {song.artist}</span>
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          <a
                            className="hover:underline"
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.title} ${song.artist}`)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            YouTube
                          </a>
                          <span> · </span>
                          <a
                            className="hover:underline"
                            href={`https://open.spotify.com/search/${encodeURIComponent(`${song.title} ${song.artist}`)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Spotify
                          </a>
                          <span> · </span>
                          <a
                            className="hover:underline"
                            href={
                              song.trackUrl ||
                              `https://music.apple.com/search?term=${encodeURIComponent(`${song.title} ${song.artist}`)}`
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            Apple
                          </a>
                        </div>
                      </div>

                      <button
                        title={
                          playingId === song.id
                            ? t('protocol.specialMoments.player.pause')
                            : t('protocol.specialMoments.player.play')
                        }
                        onClick={() => togglePreview(song)}
                        className="text-gray-500 hover:text-blue-600 p-1"
                      >
                        {playingId === song.id ? <Pause size={16} /> : <Play size={16} />}
                      </button>

                      <button
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                        onClick={() => {
                          if (!moments[activeTab]?.length) {
                            addMoment(activeTab, {
                              order: 1,
                              title: t('protocol.specialMoments.defaults.momentTitle'),
                              song: `${song.title} - ${song.artist}`,
                              time: '',
                            });
                          } else {
                            const lastMoment = [...(moments[activeTab] || [])].pop();
                            if (lastMoment) {
                              updateMoment(activeTab, lastMoment.id, {
                                ...lastMoment,
                                song: `${song.title} - ${song.artist}`,
                              });
                            }
                          }
                          setResults([]);
                          stopAudio();
                        }}
                      >
                        {t('protocol.specialMoments.buttons.use')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

        {/* Lista de momentos */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
              <h3
                className="font-medium"
                onDoubleClick={() => {
                  try {
                    const current = (blocks || []).find((b) => (b.id || b.key) === activeTab);
                    if (!current) return;
                    const newName = prompt(
                      t('protocol.specialMoments.prompts.renameSection'),
                      current.name || ''
                    );
                    if (!newName) return;
                    renameBlock(current.id || current.key, newName);
                  } catch {}
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  try {
                    if (!Array.isArray(blocks) || !blocks.length) return;
                    const idx = blocks.findIndex((b) => (b.id || b.key) === activeTab);
                    if (idx === -1) return;
                    const action = prompt(t('protocol.specialMoments.prompts.blockAction'));
                    if (!action) return;
                    const lower = action.trim().toLowerCase();
                    if (lower.startsWith('elimi')) {
                      if (
                        !confirm(
                          t('protocol.specialMoments.prompts.deleteSection', {
                            name: blocks[idx].name,
                          })
                        )
                      )
                        return;
                      const nextIdx = idx > 0 ? idx - 1 : (blocks.length > 1 ? 1 : -1);
                      removeBlock(blocks[idx].id || blocks[idx].key);
                      if (nextIdx !== -1 && blocks[nextIdx]) setActiveTab(blocks[nextIdx].id || blocks[nextIdx].key);
                    } else if (lower.includes('izq')) {
                      if (idx <= 0) return;
                      reorderBlocks(idx, idx - 1);
                    } else if (lower.includes('der')) {
                      if (idx >= blocks.length - 1) return;
                      reorderBlocks(idx, idx + 1);
                    }
                  } catch {}
                }}
                title={t('protocol.specialMoments.tooltips.blockHeader')}
              >
                {blocks?.find((b) => (b.id || b.key) === activeTab)?.name || t('protocol.specialMoments.title')}
              </h3>
              <Button
                onClick={handleAddMoment}
                className="py-1 px-3 text-sm flex items-center gap-1"
              >
                <Plus size={14} /> {t('protocol.specialMoments.buttons.addMoment')}
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              {t('protocol.specialMoments.helperTexts.sectionTip')}
            </p>

            <div className="space-y-3">
              {moments[activeTab]?.length ? (
                moments[activeTab]
                  .sort((a, b) => a.order - b.order)
                  .map((moment, idx) => (
                    <div key={moment.id} className="border rounded-lg p-3">
                      <div className="flex justify-between gap-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            className="w-full font-medium border-0 border-b border-transparent focus:border-blue-300 focus:ring-0 p-0 pb-1"
                            value={moment.title || ''}
                            onChange={(e) =>
                              updateMoment(activeTab, moment.id, {
                                ...moment,
                                title: e.target.value,
                              })
                            }
                            placeholder={t('protocol.specialMoments.placeholders.momentTitle')}
                          />

                          <div className="mt-2 flex flex-wrap gap-2">
                            <div className="flex-1 min-w-[200px]">
                              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <Music size={12} /> {t('protocol.specialMoments.labels.song')}
                              </div>
                              <input
                                type="text"
                                className="w-full border rounded px-2 py-1 text-sm"
                                value={moment.song || ''}
                                onChange={(e) =>
                                  updateMoment(activeTab, moment.id, {
                                    ...moment,
                                    song: e.target.value,
                                  })
                                }
                                placeholder={t('protocol.specialMoments.placeholders.song')}
                              />
                              {/* Si pega un enlace de Spotify vlido, mstrams el reproductor embebido */}
                              {(() => {
                                const embed = getSpotifyEmbedUrl(moment.song);
                                if (!embed) return null;
                                return (
                                  <div className="mt-2">
                                    <iframe
                                      title="Spotify Player"
                                      src={embed}
                                      width="100%"
                                      height="80"
                                      frameBorder="0"
                                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                      loading="lazy"
                                    />
                                    <div className="text-[11px] text-gray-500 mt-1">
                                      {t('protocol.specialMoments.helperTexts.spotifyEmbed')}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="w-24">
                              <div className="text-xs text-gray-500 mb-1">
                                {t('protocol.specialMoments.labels.time')}
                              </div>
                              <input
                                type="text"
                                className="w-full border rounded px-2 py-1 text-sm"
                                value={moment.time || ''}
                                onChange={(e) =>
                                  updateMoment(activeTab, moment.id, {
                                    ...moment,
                                    time: e.target.value,
                                  })
                                }
                                placeholder={t('protocol.specialMoments.placeholders.time')}
                              />
                            </div>

                            <div className="w-28">
                              <div className="text-xs text-gray-500 mb-1">
                                {t('protocol.specialMoments.labels.duration')}
                              </div>
                              <input
                                type="text"
                                className="w-full border rounded px-2 py-1 text-sm"
                                value={moment.duration || ''}
                                onChange={(e) =>
                                  updateMoment(activeTab, moment.id, {
                                    ...moment,
                                    duration: e.target.value,
                                  })
                                }
                                placeholder={t('protocol.specialMoments.placeholders.duration')}
                              />
                            </div>
                          </div>
                        </div>
                        {(() => {
                          const recipientMode = moment.recipientRole
                            ? 'role'
                            : moment.recipientId
                            ? 'guest'
                            : moment.recipientName
                            ? 'custom'
                            : 'none';
                          const selectedValue =
                            recipientMode === 'guest'
                              ? String(moment.recipientId)
                              : recipientMode === 'custom'
                              ? '__custom'
                              : recipientMode === 'role'
                              ? `__role__${moment.recipientRole}`
                              : '';
                          const selectedGuest =
                            recipientMode === 'guest' && selectedValue && selectedValue !== '__custom'
                              ? guestOptionMap.get(selectedValue)
                              : null;
                          const buttonLabel =
                            recipientMode === 'role'
                              ? recipientRoleMap.get(moment.recipientRole) ||
                                t('protocol.specialMoments.labels.recipientRoleFallback')
                              : selectedGuest?.name ||
                                moment.recipientName ||
                                t('protocol.specialMoments.labels.recipientDefault');
                          return (
                            <div className="mt-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setRecipientPanelsOpen((prev) => ({
                                    ...prev,
                                    [moment.id]: !prev[moment.id],
                                  }))
                                }
                                className="text-xs text-blue-600 hover:underline"
                              >
                                {recipientPanelsOpen[moment.id]
                                  ? t('protocol.specialMoments.toggles.hideRecipient')
                                  : t('protocol.specialMoments.labels.recipientSummary', {
                                      label: buttonLabel,
                                    })}
                              </button>
                              {recipientPanelsOpen[moment.id] && (
                                <div className="mt-2 space-y-2 rounded border border-gray-200 bg-gray-50 p-3">
                                  <div className="text-xs text-gray-500">
                                    {t('protocol.specialMoments.labels.recipientHint')}
                                  </div>
                                  <select
                                    className="w-full border rounded px-2 py-1 text-sm"
                                    value={selectedValue}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (!value) {
                                        updateMoment(activeTab, moment.id, {
                                          ...moment,
                                          recipientId: '',
                                          recipientName: '',
                                          recipientRole: '',
                                        });
                                      } else if (value === '__custom') {
                                        updateMoment(activeTab, moment.id, {
                                          ...moment,
                                          recipientId: '',
                                          recipientRole: '',
                                          recipientName: moment.recipientName || '',
                                        });
                                      } else if (value.startsWith('__role__')) {
                                        const roleValue = value.replace('__role__', '');
                                        updateMoment(activeTab, moment.id, {
                                          ...moment,
                                          recipientRole: roleValue,
                                          recipientId: '',
                                          recipientName: '',
                                        });
                                      } else {
                                        const guest = guestOptionMap.get(value);
                                        updateMoment(activeTab, moment.id, {
                                          ...moment,
                                          recipientId: value,
                                          recipientRole: '',
                                          recipientName: guest?.name || guest?.email || '',
                                        });
                                      }
                                    }}
                                  >
                                    <option value="">
                                      {t('protocol.specialMoments.options.recipient.none')}
                                    </option>
                                    <option value="__custom">
                                      {t('protocol.specialMoments.options.recipient.custom')}
                                    </option>
                                    {recipientRoleOptions.map((role) => (
                                      <option key={role.value} value={`__role__${role.value}`}>
                                        {t('protocol.specialMoments.options.recipient.rolePrefix', {
                                          role: role.label,
                                        })}
                                      </option>
                                    ))}
                                    {recipientOptions.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}{' '}
                                        {option.raw?.table
                                          ? t('protocol.specialMoments.options.recipient.table', {
                                              table: option.raw.table,
                                            })
                                          : ''}
                                      </option>
                                    ))}
                                  </select>
                                  {selectedValue === '__custom' && (
                                    <input
                                      type="text"
                                      className="w-full border rounded px-2 py-1 text-sm"
                                      placeholder={t(
                                        'common.protocol.specialMoments.placeholders.recipientManual'
                                      )}
                                      value={moment.recipientName || ''}
                                      onChange={(e) =>
                                        updateMoment(activeTab, moment.id, {
                                          ...moment,
                                          recipientId: '',
                                          recipientRole: '',
                                          recipientName: e.target.value,
                                        })
                                      }
                                    />
                                  )}
                                  {selectedGuest && (
                                    <div className="text-xs text-gray-500">
                                      {t('protocol.specialMoments.helperTexts.recipientDetails', {
                                        table: selectedGuest.table || selectedGuest.tableId || '—',
                                        diet: selectedGuest.dietaryRestrictions || '—',
                                      })}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      className="text-xs text-gray-500 hover:text-red-600"
                                      onClick={() =>
                                        updateMoment(activeTab, moment.id, {
                                          ...moment,
                                          recipientId: '',
                                          recipientRole: '',
                                          recipientName: '',
                                        })
                                      }
                                    >
                                      {t('protocol.specialMoments.buttons.clear')}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}


                        <MomentActions
                          canMoveUp={idx > 0}
                          canMoveDown={idx < (moments?.[activeTab]?.length || 0) - 1}
                          onMoveUp={() => reorderMoment(activeTab, moment.id, 'up')}
                          onMoveDown={() => reorderMoment(activeTab, moment.id, 'down')}
                          onDuplicateHere={() => handleDuplicateSameBlock(moment)}
                          onDuplicateElse={() => openActionPanel(moment.id, 'duplicate')}
                          onMoveElse={() => openActionPanel(moment.id, 'move')}
                          onDelete={() => removeMoment(activeTab, moment.id)}
                        />
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>{t('protocol.specialMoments.empty.title')}</p>
                  <p className="text-sm mt-1">
                    {t('protocol.specialMoments.empty.subtitle')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default MomentosEspeciales;
