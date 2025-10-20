import {
  Music,
  Edit2,
  Play,
  Plus,
  Trash2,
  Search as SearchIcon,
  X,
  ChevronUp,
  ChevronDown,
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
import useSpecialMoments from '../../hooks/useSpecialMoments';
import useGuests from '../../hooks/useGuests';
import { post as apiPost } from '../../services/apiClient';
import * as Playback from '../../services/PlaybackService';

const MOMENT_TYPE_OPTIONS = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'lectura', label: 'Lectura' },
  { value: 'votos', label: 'Votos' },
  { value: 'anillos', label: 'Intercambio de anillos' },
  { value: 'baile', label: 'Baile' },
  { value: 'discurso', label: 'Discurso' },
  { value: 'corte_pastel', label: 'Corte de pastel' },
  { value: 'salida', label: 'Salida' },
  { value: 'otro', label: 'Otro' },
];

const MOMENT_STATE_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'ensayo', label: 'Ensayo' },
];

const RECIPIENT_ROLE_OPTIONS = [
  { value: 'novia', label: 'Novia' },
  { value: 'novio', label: 'Novio' },
  { value: 'planner', label: 'Planner' },
  { value: 'oficiante', label: 'Oficiante / Maestro de ceremonias' },
  { value: 'familia', label: 'Familiar cercano' },
  { value: 'amigo', label: 'Amigo/a' },
  { value: 'proveedor', label: 'Proveedor' },
];

const STATE_BADGE_TYPE = {
  pendiente: 'warning',
  confirmado: 'success',
  ensayo: 'info',
};

const RESPONSABLES_LIMIT = 12;
const SUPPLIERS_LIMIT = 12;

// Tabs pasan a ser dinmicas desde el hook (blocks)

const MomentosEspeciales = () => {
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
    () => new Map(RECIPIENT_ROLE_OPTIONS.map((role) => [role.value, role.label])),
    []
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
      toast.warning('Hay campos requeridos sin completar. Revisa las alertas en cada momento.');
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
  const [profilePrefs, setProfilePrefs] = useState({ languages: ['es'], genres: [], decades: [] });

  // Cargar preferencias guardadas en Perfil desde localStorage si existen
  useEffect(() => {
    try {
      const raw = localStorage.getItem('mywed360_music_prefs');
      if (raw) {
        const parsed = JSON.parse(raw);
        setProfilePrefs({
          languages: Array.isArray(parsed?.languages) ? parsed.languages : ['es'],
          genres: Array.isArray(parsed?.genres) ? parsed.genres : [],
          decades: Array.isArray(parsed?.decades) ? parsed.decades : [],
        });
        // Prefijar idiomsi viene vaco
        if (!aiLanguage && parsed?.languages?.length) {
          setAiLanguage(parsed.languages[0]);
        }
      }
    } catch {}
  }, []);
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

  // Guardar Preferencias msi$1les en localStorage
  const saveProfilePrefs = () => {
    try {
      localStorage.setItem('mywed360_music_prefs', JSON.stringify(profilePrefs));
      if (Array.isArray(profilePrefs.languages) && profilePrefs.languages.length) {
        setAiLanguage(profilePrefs.languages[0]);
      }
    } catch {}
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
      console.error('Error buscando Canciones', err);
      setErrorSearch('No se pudo buscar Canciones. Inténtalo más tarde.');
      setResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleDuplicateSameBlock = useCallback(
    (moment) => {
      if ((moments[activeTab]?.length || 0) >= maxMomentsPerBlock) {
        toast.warning(`Has alcanzado el máximo de ${maxMomentsPerBlock} momentos en esta sección.`);
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
        toast.warning(`Máximo ${RESPONSABLES_LIMIT} responsables por momento.`);
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
        toast.info('Escribe un proveedor antes de añadirlo.');
        return;
      }
      const current = Array.isArray(moment.suppliers) ? [...moment.suppliers] : [];
      if (current.length >= SUPPLIERS_LIMIT) {
        toast.warning(`Máximo ${SUPPLIERS_LIMIT} proveedores por momento.`);
        return;
      }
      if (current.some((supplier) => supplier.toLowerCase() === draft.toLowerCase())) {
        toast.info('Ese proveedor ya está registrado.');
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
    if (!timeValue) warnings.push('Añade una hora estimada.');
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
    if (!responsablesList.length) warnings.push('Define al menos un responsable.');
    const needsRecipient = ['lectura', 'discurso', 'votos'].includes(moment?.type);
    if (needsRecipient && !(moment?.recipientId || moment?.recipientName || moment?.recipientRole)) {
      warnings.push('Asigna destinatario o rol.');
    }
    if (['entrada', 'baile'].includes(moment?.type) && !(moment?.song && String(moment.song).trim())) {
      warnings.push('Añade una canción.');
    }
    return warnings;
  }, []);

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
        toast.info('Selecciona una sección destino.');
        return;
      }
      if (mode === 'duplicate') {
        if ((moments[targetBlockId]?.length || 0) >= maxMomentsPerBlock) {
          toast.warning(`La sección seleccionada ya tiene ${maxMomentsPerBlock} momentos.`);
          return;
        }
        duplicateMoment(activeTab, moment.id, targetBlockId);
        toast.success('Momento duplicado correctamente.');
        closeActionPanel();
        return;
      }
      if (mode === 'move') {
        if (targetBlockId === activeTab) {
          toast.info('Selecciona una sección diferente para mover el momento.');
          return;
        }
        if ((moments[targetBlockId]?.length || 0) >= maxMomentsPerBlock) {
          toast.warning(`La sección seleccionada ya tiene ${maxMomentsPerBlock} momentos.`);
          return;
        }
        duplicateMoment(activeTab, moment.id, targetBlockId);
        removeMoment(activeTab, moment.id);
        toast.success('Momento movido a la nueva sección.');
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
        toast.info('Crea otra sección para usar esta acción.');
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
        ? recipientRoleMap.get(moment.recipientRole) || 'Rol asignado'
        : selectedGuest?.name || moment.recipientName || 'Destinatario';

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
                  aria-label="Arrastrar para reordenar"
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
                  placeholder="Título del momento"
                />
                <Badge type={stateBadgeType} className="uppercase tracking-wide">
                  {moment.state ? moment.state : 'sin estado'}
                </Badge>
                {moment.optional && <Badge type="info">Opcional</Badge>}
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
                  <div className="text-xs text-gray-500 mb-1">Tipo</div>
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
                    {MOMENT_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Ubicación</div>
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
                    placeholder="Capilla, jardín, salón..."
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Estado</div>
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
                    {MOMENT_STATE_OPTIONS.map((option) => (
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
                  <label htmlFor={`optional-${moment.id}`}>Es opcional</label>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,2fr),minmax(0,1fr),minmax(0,1fr)]">
                <div className="min-w-[200px]">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Music size={12} /> Canción
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
                    placeholder="Nombre de la canción"
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
                          Pegaste un enlace de Spotify. Se muestra una vista previa.
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Hora</div>
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
                    placeholder="hh:mm"
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Duración</div>
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
                    placeholder="ej. 10 min"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 lg:min-w-[44px]">
              <button
                onClick={() => removeMoment(activeTab, moment.id)}
                className="text-gray-400 hover:text-red-500 p-1"
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => handleDuplicateSameBlock(moment)}
                className="text-gray-400 hover:text-blue-500 p-1"
                title="Duplicar en esta sección"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => openActionPanel(moment.id, 'duplicate')}
                className="text-gray-400 hover:text-blue-500 p-1 text-[11px]"
                title="Duplicar en otra sección"
              >
                Dup →
              </button>
              <button
                onClick={() => openActionPanel(moment.id, 'move')}
                className="text-gray-400 hover:text-blue-600 p-1 text-[11px]"
                title="Mover a otra sección"
              >
                Mov →
              </button>
              {idx > 0 && (
                <button
                  onClick={() => reorderMoment(activeTab, moment.id, 'up')}
                  className="text-gray-400 hover:text-blue-600 p-1"
                  title="Mover arriba"
                >
                  <ChevronUp size={16} />
                </button>
              )}
              {idx < orderedMoments.length - 1 && (
                <button
                  onClick={() => reorderMoment(activeTab, moment.id, 'down')}
                  className="text-gray-400 hover:text-blue-600 p-1"
                  title="Mover abajo"
                >
                  <ChevronDown size={16} />
                </button>
              )}
            </div>
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
                  {isOpen ? 'Ocultar destinatario' : `Destinatario: ${buttonLabel}`}
                </button>
                {isOpen && (
                  <div className="mt-2 space-y-2 rounded border border-gray-200 bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">
                      Selecciona a quién va dirigido este momento (opcional)
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
                      <option value="">Sin destinatario</option>
                      <option value="__custom">Especificar manualmente</option>
                      {RECIPIENT_ROLE_OPTIONS.map((role) => (
                        <option key={role.value} value={`__role__${role.value}`}>
                          Rol: {role.label}
                        </option>
                      ))}
                      {recipientOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}{' '}
                          {option.raw?.table ? `· Mesa ${option.raw.table}` : ''}
                        </option>
                      ))}
                    </select>
                    {selectedValue === '__custom' && (
                      <input
                        type="text"
                        className="w-full border rounded px-2 py-1 text-sm"
                        placeholder="Nombre o rol del destinatario"
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
                        Mesa: {selectedGuest.table || selectedGuest.tableId || '—'} · Dieta:{' '}
                        {selectedGuest.dietaryRestrictions || '—'}
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
                        Limpiar
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
                {actionMode === 'duplicate' ? 'Duplicar en:' : 'Mover a:'}
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
                      Confirmar
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={closeActionPanel}
                      className="text-xs"
                    >
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <p>No hay otras secciones disponibles.</p>
              )}
            </div>
          )}

          <div>
            <button
              type="button"
              className="text-xs text-blue-600 hover:underline"
              onClick={() => toggleAdvancedSection(moment.id)}
            >
              {isAdvanced ? 'Ocultar detalles avanzados' : 'Mostrar detalles avanzados'}
            </button>
            {isAdvanced && (
              <div className="mt-2 space-y-3 rounded border border-gray-200 bg-gray-50 p-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                    Responsables
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleAddResponsible(activeTab, moment)}
                      disabled={responsablesList.length >= RESPONSABLES_LIMIT}
                    >
                      <UserPlus size={14} className="mr-1" />
                      Añadir
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
                            placeholder="Rol / función"
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
                            placeholder="Nombre"
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
                            placeholder="Contacto (tel/email)"
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
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-500">
                      Añade quién se encargará de este momento.
                    </p>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">
                    Requisitos técnicos / notas
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
                    placeholder="Sonido, iluminación, elementos especiales..."
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">
                    Proveedores relacionados
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
                      Registra proveedores relevantes para este momento.
                    </p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      className="flex-1 border rounded px-2 py-1 text-sm"
                      placeholder="Nombre o referencia"
                      value={supplierDraft}
                      onChange={(e) => handleSupplierInputChange(moment.id, e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSupplier(activeTab, moment)}
                      disabled={!supplierDraft.trim()}
                    >
                      Añadir
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
      toast.warning(`Has alcanzado el máximo de ${maxMomentsPerBlock} momentos en esta sección.`);
      return;
    }
    const nextOrder = currentCount + 1;
    addMoment(activeTab, {
      order: nextOrder,
      title: `Nuevo momento ${nextOrder}`,
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
      // Idioma explcito del selector
      if (aiLanguage === 'es') prefs.push('idioma espaol');
      else if (aiLanguage === 'en') prefs.push('idioma ingls');
      // Si no hay gnero/decada en UI, usa preferencias del perfil
      if (aiTempo) prefs.push(`tempo ${aiTempo}`);
      if (aiEra) prefs.push(`dcada ${aiEra}`);
      if (aiGenre) prefs.push(`gnero ${aiGenre}`);
      if (!aiGenre && profilePrefs.genres?.length)
        prefs.push(`gneros: ${profilePrefs.genres.join(', ')}`);
      if (!aiEra && profilePrefs.decades?.length)
        prefs.push(`dcadas: ${profilePrefs.decades.join(', ')}`);
      // Idiomas adicionales como pista
      const extraLangs = (profilePrefs.languages || []).filter((l) => l !== aiLanguage);
      if (extraLangs.length) prefs.push(`tambin considerar Idiomas: ${extraLangs.join(', ')}`);
      const fullPrompt = prefs.length ? `${prompt}. Preferencias: ${prefs.join(', ')}` : prompt;
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
        title: s.title || s.name || 'Cancin',
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
      console.error('AI songs error', e);
      setAiError('No se pudo obtener recomendaciones. Prueba de nuevo.');
      setAiSongs([]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <PageWrapper title="Momentos Especiales">
      <div className="space-y-6">
        {/* Se elimin la tarjeta de conexin con Spotify */}
        {/* Preferencias msi$1les (movidas desde Perfil) */}
        <Card className="space-y-4 p-5">
          <h3 className="text-md font-medium flex items-center gap-2">
            <Music size={16} /> Preferencias msi$1les
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium mb-1">Idiomas</div>
              <div className="flex flex-wrap gap-2">
                {['es', 'en', 'it', 'fr', 'pt'].map((lang) => (
                  <label
                    key={lang}
                    className={`text-xs border rounded px-2 py-1 cursor-pointer ${profilePrefs.languages.includes(lang) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={profilePrefs.languages.includes(lang)}
                      onChange={(e) => {
                        setProfilePrefs((prev) => {
                          const set = new Set(prev.languages);
                          e.target.checked ? set.add(lang) : set.delete(lang);
                          return { ...prev, languages: Array.from(set) };
                        });
                      }}
                    />
                    {lang.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Gneros</div>
              <div className="flex flex-wrap gap-2">
                {[
                  'pop',
                  'rock',
                  'jazz',
                  'latino',
                  'cl\\u00E1sica',
                  'indie',
                  'r&b',
                  'electr\\u00F3nica',
                ].map((genre) => (
                  <label
                    key={genre}
                    className={`text-xs border rounded px-2 py-1 cursor-pointer ${profilePrefs.genres.includes(genre) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={profilePrefs.genres.includes(genre)}
                      onChange={(e) => {
                        setProfilePrefs((prev) => {
                          const set = new Set(prev.genres);
                          e.target.checked ? set.add(genre) : set.delete(genre);
                          return { ...prev, genres: Array.from(set) };
                        });
                      }}
                    />
                    {genre}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Dcadas</div>
              <div className="flex flex-wrap gap-2">
                {['70s', '80s', '90s', '2000s', '2010s', 'actual'].map((dec) => (
                  <label
                    key={dec}
                    className={`text-xs border rounded px-2 py-1 cursor-pointer ${profilePrefs.decades.includes(dec) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={profilePrefs.decades.includes(dec)}
                      onChange={(e) => {
                        setProfilePrefs((prev) => {
                          const set = new Set(prev.decades);
                          e.target.checked ? set.add(dec) : set.delete(dec);
                          return { ...prev, decades: Array.from(set) };
                        });
                      }}
                    />
                    {dec}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="text-right">
            <Button onClick={saveProfilePrefs}>Guardar preferencias</Button>
          </div>
        </Card>
        <p className="text-gray-600">
          Planifica cada instante clave con la msi$1 y el momento adecuados.
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
              const name = prompt('Nombre de la nueva seccin (ej. Ensayo, Brunch...)');
              if (!name) return;
              try { addBlock(name); } catch {}
            }}
            title="Aadir seccin personalizada"
          >
            Aadir seccin
          </button>
        </div>

        {/* Content */}
        <Card className="space-y-5 p-5">
          {/* Mini reproductor (desplegable) para previews HTML5 */}
          {playerState?.currentId ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 truncate mr-2">
                  Reproduciendo vista previa
                </div>
                <button
                  className="text-xs border rounded px-2 py-1 hover:bg-gray-50"
                  onClick={() => setPlayerOpen((v) => !v)}
                >
                  {playerOpen ? 'Ocultar' : 'Reproductor'}
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
                      title={playerState.paused ? 'Reproducir' : 'Pausar'}
                    >
                      {playerState.paused ? <Play size={16} /> : <Pause size={16} />}
                    </button>
                    <button
                      onClick={async () => { await Playback.stop(); setPlayerOpen(false); }}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Detener"
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
                    <div className="text-xs text-gray-600">Volumen</div>
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
          {/* Inspiracin */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-yellow-600" />
              <h3 className="font-medium">Inspiracin</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(MUSIC_INSPIRATION[activeTab] || {}).map(([cat, songs]) => (
                <div key={cat} className="border rounded-md">
                  <button
                    className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between"
                    onClick={() => setOpenCategory((prev) => (prev === cat ? null : cat))}
                  >
                    <span className="font-medium text-sm">{cat}</span>
                    <span className="text-xs text-gray-500">
                      {openCategory === cat ? 'Ocultar' : 'Ver sugerencias'}
                    </span>
                  </button>
                  {openCategory === cat && (
                    <ul className="divide-y">
                      {songs.map((s, idx) => (
                        <li
                          key={`${cat}-${idx}`}
                          className="p-2 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {s.title} <span className="text-gray-500">- {s.artist}</span>
                            </div>
                            {s.tags?.length ? (
                              <div className="text-xs text-gray-500 truncate">
                                {s.tags.join(' · ')}
                              </div>
                            ) : null}
                          </div>
                          <Button
                            className="text-xs py-1 px-2"
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
                            }}
                          >
                            Usar
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* IA */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-600" />
              <h3 className="font-medium">Encuentra la Cancin perfecta (IA)</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <label className="text-gray-600">Idioma</label>
              <select
                className="border rounded px-2 py-1"
                value={aiLanguage}
                onChange={(e) => setAiLanguage(e.target.value)}
              >
                <option value="es">Espaol</option>
                <option value="en">Ingls</option>
              </select>
              <label className="text-gray-600">Tempo</label>
              <select
                className="border rounded px-2 py-1"
                value={aiTempo}
                onChange={(e) => setAiTempo(e.target.value)}
              >
                <option value="">Cualquiera</option>
                <option value="lento">Lento</option>
                <option value="medio">Medio</option>
                <option value="rpido">Rpido</option>
              </select>
              <label className="text-gray-600">Dcada</label>
              <select
                className="border rounded px-2 py-1"
                value={aiEra}
                onChange={(e) => setAiEra(e.target.value)}
              >
                <option value="">Cualquiera</option>
                <option value="80s">80s</option>
                <option value="90s">90s</option>
                <option value="2000s">2000s</option>
                <option value="2010s">2010s</option>
                <option value="actual">Actual</option>
              </select>
              <label className="text-gray-600">Gnero</label>
              <select
                className="border rounded px-2 py-1"
                value={aiGenre}
                onChange={(e) => setAiGenre(e.target.value)}
              >
                <option value="">Cualquiera</option>
                <option value="pop">Pop</option>
                <option value="rock">Rock</option>
                <option value="jazz">Jazz</option>
                <option value="latino">Latino</option>
                <option value="clsica">Clsica</option>
                <option value="indie">Indie</option>
                <option value="r&b">R&B</option>
              </select>
            </div>
            <div className="flex gap-2 items-start">
              <textarea
                rows={2}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe el momento: 'primer baile, balada en espaol'"
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                onClick={handleAISearch}
                className="bg-purple-600 text-white px-3 py-2 rounded flex items-center gap-1"
              >
                <Sparkles size={16} /> Buscar con IA
              </button>
            </div>
            {aiLoading && <p className="text-sm text-gray-500">Buscando recomendaciones...</p>}
            {aiError && <p className="text-sm text-red-600">{aiError}</p>}
            {aiSongs.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <div className="bg-gray-50 p-2 border-b text-sm font-medium">
                  Recomendaciones de IA
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
                            Ver en:
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
                            title={playingId === s.id ? 'Pausar' : 'Reproducir'}
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
                                  title: 'Nuevo momento',
                                  song: `${s.title}${s.artist ? ' - ' + s.artist : ''}`,
                                  time: '',
                                });
                              } else {
                                const last = [...(moments[activeTab] || [])].pop();
                                if (last)
                                  updateMoment(activeTab, last.id, {
                                    ...last,
                                    song: `${s.title}${s.artist ? ' - ' + s.artist : ''}`,
                                  });
                              }
                            }}
                          >
                            Usar
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
              placeholder="Buscar Cancin por nombre..."
              className="flex-1 border rounded px-3 py-2"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-1"
            >
              <SearchIcon size={16} /> Buscar
            </button>
          </div>

          {/* Estado búsqueda */}
          {loadingSearch && <p className="text-sm text-gray-500">Buscando...</p>}
          {errorSearch && <p className="text-sm text-red-600">{errorSearch}</p>}

          {/* Resultados búsqueda */}
          {results.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-50 p-2 border-b text-sm font-medium">
                Resultados
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
                        title={playingId === song.id ? 'Pausar' : 'Reproducir'}
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
                              title: 'Nuevo momento',
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
                        Usar
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
                    const newName = prompt('Nuevo nombre de la seccin:', current.name || '');
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
                    const action = prompt('Accin: eliminar | mover-izquierda | mover-derecha');
                    if (!action) return;
                    const lower = action.trim().toLowerCase();
                    if (lower.startsWith('elimi')) {
                      if (!confirm(`Eliminar seccin "${blocks[idx].name}"?`)) return;
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
                title="Doble clic para renombrar seccin (clic derecho para ms opciones)"
              >
                {blocks?.find((b) => (b.id || b.key) === activeTab)?.name || 'Momentos'}
              </h3>
              <Button
                onClick={handleAddMoment}
                className="py-1 px-3 text-sm flex items-center gap-1"
              >
                <Plus size={14} /> Aadir momento
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              Consejo: doble clic sobre el nombre de la seccin para renombrar. Clic derecho para eliminar o mover la seccin. Usa “Dup →” para duplicar un momento en otra seccin y “Mov →” para moverlo.
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
                            placeholder="Ttulo del momento"
                          />

                          <div className="mt-2 flex flex-wrap gap-2">
                            <div className="flex-1 min-w-[200px]">
                              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <Music size={12} /> Cancin
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
                                placeholder="Nombre de la Cancin"
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
                                      Pegaste un enlace de Spotify. Se mstra un reproductor de
                                      vista previa.
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="w-24">
                              <div className="text-xs text-gray-500 mb-1">Hora</div>
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
                                placeholder="hh:mm"
                              />
                            </div>

                            <div className="w-28">
                              <div className="text-xs text-gray-500 mb-1">Duracin</div>
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
                                placeholder="ej. 10 min"
                              />
                            </div>
                          </div>
                        </div>
                        {(() => {
                          const recipientMode = moment.recipientId ? 'guest' : moment.recipientName ? 'custom' : 'none';
                          const selectedValue = recipientMode === 'guest' ? String(moment.recipientId) : recipientMode === 'custom' ? '__custom' : '';
                          const selectedGuest = selectedValue && selectedValue !== '__custom' ? guestOptionMap.get(selectedValue) : null;
                          const buttonLabel = selectedGuest?.name || moment.recipientName || 'Destinatario';
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
                                  ? 'Ocultar destinatario'
                                  : `Destinatario: ${buttonLabel}`}
                              </button>
                              {recipientPanelsOpen[moment.id] && (
                                <div className="mt-2 space-y-2 rounded border border-gray-200 bg-gray-50 p-3">
                                  <div className="text-xs text-gray-500">Selecciona a quién va dirigido este momento (opcional)</div>
                                  <select
                                    className="w-full border rounded px-2 py-1 text-sm"
                                    value={selectedValue}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (!value || value === '') {
                                        updateMoment(activeTab, moment.id, {
                                          ...moment,
                                          recipientId: '',
                                          recipientName: '',
                                        });
                                      } else if (value === '__custom') {
                                        updateMoment(activeTab, moment.id, {
                                          ...moment,
                                          recipientId: '',
                                          recipientName: moment.recipientName || '',
                                        });
                                      } else {
                                        const guest = guestOptionMap.get(value);
                                        updateMoment(activeTab, moment.id, {
                                          ...moment,
                                          recipientId: value,
                                          recipientName: guest?.name || guest?.email || '',
                                        });
                                      }
                                    }}
                                  >
                                    <option value="">Sin destinatario</option>
                                    <option value="__custom">Especificar manualmente</option>
                                    {recipientOptions.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label} {option.raw?.table ? `· Mesa ${option.raw.table}` : ''}
                                      </option>
                                    ))}
                                  </select>
                                  {selectedValue === '__custom' && (
                                    <input
                                      type="text"
                                      className="w-full border rounded px-2 py-1 text-sm"
                                      placeholder="Nombre o rol del destinatario"
                                      value={moment.recipientName || ''}
                                      onChange={(e) =>
                                        updateMoment(activeTab, moment.id, {
                                          ...moment,
                                          recipientId: '',
                                          recipientName: e.target.value,
                                        })
                                      }
                                    />
                                  )}
                                  {selectedGuest && (
                                    <div className="text-xs text-gray-500">
                                      Mesa: {selectedGuest.table || selectedGuest.tableId || '—'} · Dieta: {selectedGuest.dietaryRestrictions || '—'}
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
                                        })
                                      }
                                    >
                                      Limpiar
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}


                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => removeMoment(activeTab, moment.id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>

                          <button
                            onClick={() => duplicateMoment(activeTab, moment.id, activeTab)}
                            className="text-gray-400 hover:text-blue-500 p-1"
                            title="Duplicar"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            onClick={() => {
                              try {
                                const names = (blocks || []).map((b) => `${b.name}:::${b.id}`);
                                const choice = prompt(`Duplicar en (escribe tal cual):\n${names.map(n => '- ' + n.split(':::')[0]).join('\n')}`);
                                if (!choice) return;
                                const found = (blocks || []).find((b) => b.name === choice || `${b.name}:::${b.id}` === choice);
                                if (!found) return;
                                duplicateMoment(activeTab, moment.id, found.id);
                              } catch {}
                            }}
                            className="text-gray-400 hover:text-blue-500 p-1"
                            title="Duplicar en otra seccin"
                          >
                            <span className="text-[11px]">Dup ?</span>
                          </button>

                          <button
                            onClick={() => {
                              try {
                                const names = (blocks || []).map((b) => `${b.name}:::${b.id}`);
                                const choice = prompt(`Mover a (escribe tal cual):\n${names.map(n => '- ' + n.split(':::')[0]).join('\n')}`);
                                if (!choice) return;
                                const found = (blocks || []).find((b) => b.name === choice || `${b.name}:::${b.id}` === choice);
                                if (!found) return;
                                duplicateMoment(activeTab, moment.id, found.id);
                                removeMoment(activeTab, moment.id);
                              } catch {}
                            }}
                            className="text-gray-400 hover:text-blue-600 p-1"
                            title="Mover a otra seccin"
                          >
                            <span className="text-[11px]">Mov ?</span>
                          </button>

                          {idx > 0 && (
                            <button
                              onClick={() => reorderMoment(activeTab, moment.id, 'up')}
                              className="text-gray-400 hover:text-blue-600 p-1"
                              title="Mover arriba"
                            >
                              <ChevronUp size={16} />
                            </button>
                          )}

                          {idx < moments[activeTab].length - 1 && (
                            <button
                              onClick={() => reorderMoment(activeTab, moment.id, 'down')}
                              className="text-gray-400 hover:text-blue-600 p-1"
                              title="Mover abajo"
                            >
                              <ChevronDown size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No hay momentos en esta seccin.</p>
                  <p className="text-sm mt-1">Haz clic en "Aadir momento" para crear uno nuevo.</p>
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
































