import { ArrowLeft, CheckCircle, Circle } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useTranslations from '../hooks/useTranslations';
import { formatDate } from '../utils/formatUtils';

import PageWrapper from '../components/PageWrapper';
import Button from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';
import WeddingModulePermissionsCard from '../components/weddings/WeddingModulePermissionsCard.jsx';
import { useWedding } from '../context/WeddingContext';
import { performanceMonitor } from '../services/PerformanceMonitor';
import { updateWeddingModulePermissions } from '../services/WeddingService';
import {
  getEventStyleOptions,
  getGuestCountOptions,
  getFormalityOptions,
  getCeremonyTypeOptions,
  getEventTypeOptions,
} from '../config/eventStyles';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004/api';

const toLabelMap = (options) =>
  options.reduce((map, option) => {
    map[option.value] = option.label;
    return map;
  }, {});

const STYLE_LABELS = toLabelMap(EVENT_STYLE_OPTIONS);
const GUEST_COUNT_LABELS = toLabelMap(GUEST_COUNT_OPTIONS);
const FORMALITY_LABELS = toLabelMap(FORMALITY_OPTIONS);
const CEREMONY_LABELS = toLabelMap(CEREMONY_TYPE_OPTIONS);
const RELATED_EVENT_LABELS = toLabelMap(RELATED_EVENT_OPTIONS);

function formatDateEs(dateVal) {
  if (!dateVal) return '';
  try {
    if (typeof dateVal === 'string') return dateVal;
    if (dateVal.seconds) return formatDate(new Date(dateVal.seconds * 1000), 'short');
    return formatDate(dateVal, 'short');
  } catch {
    return '';
  }
}

export default function BodaDetalle() {
  const { id } = useParams();
  const [wedding, setWedding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingState, setUpdatingState] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const navigate = useNavigate();
  const { activeWedding, setActiveWedding, activeWeddingPermissions } = useWedding();

  const { data: guests } = useWeddingCollection('guests', id, []);
  const { data: tasks } = useWeddingCollection('tasks', id, []);
  const { data: suppliers } = useWeddingCollection('suppliers', id, []);

  const DESIGN_ITEMS = [
    { key: 'web', label: 'Página web' },
    { key: 'invitacion', label: 'Invitaciones' },
    { key: 'seating', label: 'Seating plan' },
    { key: 'menu', label: 'Menú' },
    { key: 'logo', label: 'Logo' },
  ];

  useEffect(() => {
    if (!id) return;
    
    const loadWedding = async () => {
      try {
        const response = await fetch(`${API_URL}/wedding-info/${id}`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Error al cargar boda');
        }
        
        const data = await response.json();
        const resolvedName =
          typeof data.name === 'string' && data.name.trim().length
            ? data.name.trim()
            : typeof data.coupleName === 'string' && data.coupleName.trim().length
            ? data.coupleName.trim()
            : '';
        setWedding({
          id: data.id,
          name: resolvedName,
          date: data.weddingDate || data.date || '',
          location: data.location || data.venue || '',
          progress: Number.isFinite(data.progress) ? data.progress : 0,
          guests: Array.isArray(data.guests) ? data.guests : [],
          tasks: Array.isArray(data.tasks) ? data.tasks : [],
          suppliers: Array.isArray(data.suppliers) ? data.suppliers : [],
          designs: Array.isArray(data.designs) ? data.designs : [],
          documents: Array.isArray(data.documents) ? data.documents : [],
          active: data.active !== false,
          eventType: data.eventType || 'boda',
          eventProfile: data.eventProfile || null,
          eventProfileSummary: data.eventProfileSummary || null,
          placeholder: t('weddingDetail.namePlaceholder'),
          preferences: data.preferences || {},
          modulePermissions: data.modulePermissions || {},
        });
        setLoading(false);
      } catch (error) {
        console.error('Error cargando boda:', error);
        setLoading(false);
      }
    };
    
    loadWedding();
  }, [id]);

  if (loading) return <p>Cargando detalle...</p>;
  if (!wedding) return <p>No se encontró la boda.</p>;

  const pendingTasks = (Array.isArray(tasks) ? tasks : []).filter((t) => !t?.done).length;
  const isActive = wedding.active !== false;
  const eventTypeValue = typeof wedding.eventType === 'string' ? wedding.eventType.toLowerCase() : 'boda';
  const eventLabel = EVENT_TYPE_LABELS[eventTypeValue] || 'Evento';
  const isBoda = eventTypeValue === 'boda';
  const fallbackTitle = isBoda ? 'Boda sin nombre' : 'Evento sin nombre';
  const singularLabel = isBoda ? 'boda' : 'evento';

  const eventProfile = useMemo(() => {
    if (wedding.eventProfile && typeof wedding.eventProfile === 'object') return wedding.eventProfile;
    if (wedding.eventProfileSummary && typeof wedding.eventProfileSummary === 'object') {
      return wedding.eventProfileSummary;
    }
    return {};
  }, [wedding.eventProfile, wedding.eventProfileSummary]);

  const guestLabel = eventProfile?.guestCountRange
    ? GUEST_COUNT_LABELS[eventProfile.guestCountRange] || eventProfile.guestCountRange
    : null;
  const formalityLabel = eventProfile?.formalityLevel
    ? FORMALITY_LABELS[eventProfile.formalityLevel] || eventProfile.formalityLevel
    : null;
  const ceremonyLabel =
    isBoda && eventProfile?.ceremonyType
      ? CEREMONY_LABELS[eventProfile.ceremonyType] || eventProfile.ceremonyType
      : null;
  const relatedLabels = Array.isArray(eventProfile?.relatedEvents)
    ? eventProfile.relatedEvents
        .map((value) => RELATED_EVENT_LABELS[value] || value)
        .filter(Boolean)
    : [];
  const notes =
    typeof eventProfile?.notes === 'string' && eventProfile.notes.trim().length
      ? eventProfile.notes.trim()
      : '';
  const styleLabel =
    typeof wedding.preferences?.style === 'string'
      ? STYLE_LABELS[wedding.preferences.style] || wedding.preferences.style
      : null;

  const hasProfileData =
    guestLabel || formalityLabel || ceremonyLabel || relatedLabels.length > 0 || notes || styleLabel;

  const canEditPermissions = Boolean(activeWeddingPermissions?.manageSettings);

  const handlePermissionsSave = async (nextPermissions) => {
    if (!id) return;
    setSavingPermissions(true);
    try {
      await updateWeddingModulePermissions(id, nextPermissions);
      performanceMonitor?.logEvent?.('wedding_permissions_updated', { weddingId: id });
    } catch (error) {
      // console.error('[BodaDetalle] No se pudieron actualizar los permisos', error);
      toast.error(t('wedding.permissions.updateError'));
    } finally {
      setSavingPermissions(false);
    }
  };

  const toggleArchive = async () => {
    const nextActive = !isActive;
    const confirmMessage = nextActive
      ? `¿Restaurar esta ${singularLabel} y volver a marcarla como activa?`
      : `¿Archivar esta ${singularLabel}? Podrás restaurarla más adelante.`;
    if (!window.confirm(confirmMessage)) return;
    try {
      setUpdatingState(true);
      await fetch(`${API_URL}/wedding-info/${wedding.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          active: nextActive,
          archivedAt: nextActive ? null : new Date().toISOString(),
        }),
      });
      performanceMonitor.logEvent(nextActive ? 'wedding_restored' : 'wedding_archived', {
        weddingId: wedding.id,
        source: 'wedding_detail',
      });
      if (!nextActive && activeWedding === wedding.id) {
        setActiveWedding('');
      }
      setWedding((prev) => (prev ? { ...prev, active: nextActive } : prev));
    } catch (error) {
      // console.error('[BodaDetalle] No se pudo actualizar el estado de la boda', error);
      toast.error(t('wedding.status.updateError'));
    } finally {
      setUpdatingState(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-700">
          {eventLabel}
        </span>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded ${
            isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {isActive ? 'Activa' : 'Archivada'}
        </span>
        <Button variant="outline" size="sm" disabled={updatingState} onClick={toggleArchive}>
          {isActive ? 'Archivar' : 'Restaurar'}
        </Button>
      </div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-[color:var(--color-accent)] hover:underline"
      >
        <ArrowLeft size={18} className="mr-1" /> Volver
      </button>

      <p className="text-muted mt-1">
        {formatDateEs(wedding.date)}
        {wedding.location ? ` • ${wedding.location}` : ''}
        {styleLabel ? ` • ${styleLabel}` : ''}
      </p>

      {hasProfileData && (
        <Card className="mt-4 bg-[var(--color-surface)]">
          <h2 className="text-lg font-semibold text-[color:var(--color-text)] mb-3">
            Perfil del {singularLabel}
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[color:var(--color-text)]">
            {styleLabel && (
              <div>
                <dt className="font-medium " className="text-muted">Estilo</dt>
                <dd>{styleLabel}</dd>
              </div>
            )}
            {guestLabel && (
              <div>
                <dt className="font-medium " className="text-muted">Tamaño estimado</dt>
                <dd>{guestLabel}</dd>
              </div>
            )}
            {formalityLabel && (
              <div>
                <dt className="font-medium " className="text-muted">Formalidad</dt>
                <dd>{formalityLabel}</dd>
              </div>
            )}
            {ceremonyLabel && (
              <div>
                <dt className="font-medium " className="text-muted">Tipo de ceremonia</dt>
                <dd>{ceremonyLabel}</dd>
              </div>
            )}
            {relatedLabels.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="font-medium " className="text-muted">Eventos relacionados</dt>
                <dd>{relatedLabels.join(', ')}</dd>
              </div>
            )}
            {notes && (
              <div className="sm:col-span-2">
                <dt className="font-medium " className="text-muted">Notas</dt>
                <dd>{notes}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <Card className="text-center cursor-pointer" onClick={() => navigate('/invitados')}>
          <p className="text-sm text-muted">Invitados</p>
          <p className="text-2xl font-bold text-[color:var(--color-text)]">{(Array.isArray(guests) ? guests.length : 0)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-muted">Tareas pendientes</p>
          <p className="text-2xl font-bold text-[color:var(--color-text)]">{pendingTasks}</p>
        </Card>
        <Card className="text-center cursor-pointer" onClick={() => navigate('/proveedores')}>
          <p className="text-sm text-muted">Proveedores</p>
          <p className="text-2xl font-bold text-[color:var(--color-text)]">{(Array.isArray(suppliers) ? suppliers.length : 0)}</p>
        </Card>
      </div>

      <WeddingModulePermissionsCard
        modulePermissions={wedding.modulePermissions}
        onSave={handlePermissionsSave}
        canEdit={canEditPermissions}
        saving={savingPermissions}
      />

      <div className="mt-6">
        <div className="flex justify-between text-sm mb-1">
          <span>Progreso</span>
          <span className="font-medium">{wedding.progress}%</span>
        </div>
        <Progress value={wedding.progress} className="h-3" />
      </div>

      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Diseños</h2>
        <ul className="space-y-1">
          {DESIGN_ITEMS.map((item) => {
            const done = (wedding.designs || []).some((d) =>
              String(d.type || '')
                .toLowerCase()
                .includes(item.key)
            );
            return (
              <li
                key={item.key}
                className="flex items-center bg-[var(--color-surface)] rounded-md p-3 shadow-sm"
              >
                {done ? (
                  <CheckCircle className="text-[color:var(--color-success)] w-5 h-5 mr-2" />
                ) : (
                  <Circle className="text-[color:var(--color-text-40)] w-5 h-5 mr-2" />
                )}
                <span className={done ? 'text-[color:var(--color-success)] font-medium' : 'text-body'}>
                  {item.label}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Documentos</h2>
        <ul className="space-y-1">
          {(wedding.documents || []).map((d) => (
            <li
              key={d.id || d.name}
              className="flex justify-between bg-[var(--color-surface)] rounded-md p-3 shadow-sm"
            >
              <span>{d.name}</span>
              {d.url && (
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  placeholder={t('weddingDetail.descriptionPlaceholder')}
                  className="text-primary underline"
                >
                  Ver
                </a>
              )}
            </li>
          ))}
          {(!wedding.documents || wedding.documents.length === 0) && (
            <li className="text-sm text-muted">Sin documentos</li>
          )}
        </ul>
      </section>
    </div>
  );
}
