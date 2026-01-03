import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Moon, LogOut } from 'lucide-react';

import { Card } from '../components/ui/Card';
import DarkModeToggle from '../components/DarkModeToggle';
import LanguageSelector from '../components/ui/LanguageSelector';
import Nav from '../components/Nav';
import NotificationCenter from '../components/NotificationCenter';
import { useAuth } from '../hooks/useAuth.jsx';
import { createWedding } from '../services/WeddingService';
import { useWedding } from '../context/WeddingContext';
import { performanceMonitor } from '../services/PerformanceMonitor';
import {
  getEventStyleOptions,
  GUEST_COUNT_OPTIONS,
  FORMALITY_OPTIONS,
  CEREMONY_TYPE_OPTIONS,
  RELATED_EVENT_OPTIONS,
  EVENT_TYPE_OPTIONS,
  DEFAULT_EVENT_TYPE,
  DEFAULT_STYLE,
  DEFAULT_GUEST_COUNT,
  DEFAULT_FORMALITY,
  DEFAULT_CEREMONY_TYPE,
} from '../config/eventStyles';

export default function CreateWeddingAI() {
  const { currentUser, userProfile, hasRole, isLoading, logout: logoutUnified } = useAuth();
  const navigate = useNavigate();
  const { weddings, weddingsReady } = useWedding();
  const { t } = useTranslation();
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    coupleName: '',
    weddingDate: '',
    location: '',
    style: DEFAULT_STYLE,
    eventType: DEFAULT_EVENT_TYPE,
    guestCountRange: DEFAULT_GUEST_COUNT,
    formalityLevel: DEFAULT_FORMALITY,
    ceremonyType: DEFAULT_CEREMONY_TYPE,
    relatedEvents: [],
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Telemetría: vista del asistente
  React.useEffect(() => {
    try {
      performanceMonitor.logEvent('event_creation_view', {
        uid: currentUser?.uid || null,
        has_wedding_before: Array.isArray(weddings) ? weddings.length > 0 : false,
        weddings_ready: !!weddingsReady,
        eventType_default: form.eventType,
        style_default: form.style,
      });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOwnerLike = hasRole('owner', 'pareja', 'admin');
  const forbiddenRole =
    !isLoading && (!!currentUser || !!userProfile) && !isOwnerLike;

  const isWedding = form.eventType === 'boda';
  const relatedEventLabel = useMemo(
    () =>
      RELATED_EVENT_OPTIONS.reduce((map, option) => {
        map[option.value] = option.label;
        return map;
      }, {}),
    []
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const toggleRelatedEvent = (value) => {
    setForm((prev) => {
      const hasValue = prev.relatedEvents.includes(value);
      const nextRelated = hasValue
        ? prev.relatedEvents.filter((item) => item !== value)
        : [...prev.relatedEvents, value];
      return { ...prev, relatedEvents: nextRelated };
    });
  };

  const validateStepOne = () => {
    const nextErrors = {};
    if (!form.weddingDate) nextErrors.weddingDate = 'Selecciona la fecha del evento';
    if (!form.location.trim()) nextErrors.location = 'Indica la ubicación del evento';
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goToStepTwo = () => {
    if (validateStepOne()) {
      try {
        performanceMonitor.logEvent('event_creation_step1_completed', {
          uid: currentUser?.uid || null,
          eventType: form.eventType,
          has_date: !!form.weddingDate,
          has_location: !!(form.location && form.location.trim()),
          has_couple_name: !!(form.coupleName && form.coupleName.trim()),
          style: form.style,
        });
      } catch {}
      setStep(2);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (step === 1) {
      goToStepTwo();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const hasRelatedEvents = Array.isArray(form.relatedEvents) && form.relatedEvents.length > 0;
      const trimmedNotes = form.notes.trim();
      const hasNotes = trimmedNotes.length > 0;
      try {
        performanceMonitor.logEvent('event_creation_step2_completed', {
          uid: currentUser?.uid || null,
          eventType: form.eventType,
          guestCountRange: form.guestCountRange,
          formalityLevel: form.formalityLevel,
          ceremonyType: form.ceremonyType,
          has_related: hasRelatedEvents,
          has_notes: hasNotes,
          style: form.style,
        });
        performanceMonitor.logEvent('event_creation_submit', {
          uid: currentUser?.uid || null,
          eventType: form.eventType,
          guestCountRange: form.guestCountRange,
          formalityLevel: form.formalityLevel,
          has_related: hasRelatedEvents,
          has_notes: hasNotes,
          style: form.style,
        });
      } catch {}
      if (!currentUser?.uid) throw new Error('No autenticado');
      const fallbackName = form.eventType === 'boda' ? 'Mi Boda' : 'Mi Evento';
      const weddingId = await createWedding(currentUser.uid, {
        name: form.coupleName || fallbackName,
        weddingDate: form.weddingDate || '',
        location: form.location || '',
        eventType: form.eventType,
        eventProfile: {
          guestCountRange: form.guestCountRange,
          formalityLevel: form.formalityLevel,
          ceremonyType: isWedding ? form.ceremonyType : null,
          relatedEvents: form.relatedEvents,
          notes: trimmedNotes || '',
        },
        preferences: { style: form.style },
      });
      try {
        performanceMonitor.logEvent('event_creation_succeeded', {
          uid: currentUser?.uid || null,
          weddingId,
          eventType: form.eventType,
          guestCountRange: form.guestCountRange,
          formalityLevel: form.formalityLevel,
          has_related: hasRelatedEvents,
          has_notes: hasNotes,
          style: form.style,
        });
      } catch {}
      navigate(`/bodas/${weddingId}`);
    } catch (err) {
      setError(err?.message || 'Error creando la boda');
      try {
        performanceMonitor.logEvent('event_creation_failed', {
          uid: currentUser?.uid || null,
          eventType: form.eventType,
          error: String(err?.message || err) || 'unknown',
          error_code: err?.code || err?.status || 'exception',
          guestCountRange: form.guestCountRange,
          formalityLevel: form.formalityLevel,
          has_related: Array.isArray(form.relatedEvents) && form.relatedEvents.length > 0,
          has_notes: !!form.notes && form.notes.trim().length > 0,
          style: form.style,
        });
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="p-6 text-center text-sm " className="text-secondary">Cargando…</Card>
      </div>
    );
  }

  if (forbiddenRole) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="p-6 space-y-3 text-sm">
          <h1 className="text-xl font-semibold " className="text-body">Acceso restringido</h1>
          <p>
            Este asistente está reservado para propietarios del evento. Solicita acceso al owner o
            al administrador si necesitas crear un nuevo evento.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center px-4 py-2  text-white rounded" style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Volver al inicio
          </button>
        </Card>
      </div>
    );
  }

  return (
    <>
    <div className="absolute top-4 right-4 flex items-center space-x-3" style={{ zIndex: 100 }}>
      <LanguageSelector variant="minimal" />
      <div className="relative" data-user-menu>
        <button onClick={() => setOpenUserMenu(!openUserMenu)} className="w-11 h-11 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center" title={t('navigation.userMenu', { defaultValue: 'Menú de usuario' })} style={{ backgroundColor: openUserMenu ? 'var(--color-lavender)' : 'rgba(255, 255, 255, 0.95)', border: `2px solid ${openUserMenu ? 'var(--color-primary)' : 'rgba(255,255,255,0.8)'}`, boxShadow: openUserMenu ? '0 4px 12px rgba(94, 187, 255, 0.3)' : '0 2px 8px rgba(0,0,0,0.15)' }}>
          <User className="w-5 h-5" style={{ color: openUserMenu ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
        </button>
        {openUserMenu && (
          <div className="absolute right-0 mt-3 bg-[var(--color-surface)] p-2 space-y-1" style={{ minWidth: '220px', border: '1px solid var(--color-border-soft)', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 9999 }}>
            <div className="px-2 py-1"><NotificationCenter /></div>
            <Link to="/perfil" onClick={() => setOpenUserMenu(false)} className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200" className="text-body" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <User className="w-4 h-4 mr-3" />{t('navigation.profile', { defaultValue: 'Perfil' })}
            </Link>
            <Link to="/email" onClick={() => setOpenUserMenu(false)} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200" className="text-body">
              <Mail className="w-4 h-4 mr-3" />{t('navigation.emailInbox', { defaultValue: 'Buzón de Emails' })}
            </Link>
            <div className="px-3 py-2.5 rounded-xl transition-all duration-200" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <div className="flex items-center justify-between"><span className="text-sm flex items-center" className="text-body"><Moon className="w-4 h-4 mr-3" />{t('navigation.darkMode', { defaultValue: 'Modo oscuro' })}</span><DarkModeToggle className="ml-2" /></div>
            </div>
            <div style={{ height: '1px', backgroundColor: 'var(--color-border-soft)', margin: '8px 0' }}></div>
            <button onClick={() => { logoutUnified(); setOpenUserMenu(false); }} className="w-full text-left px-3 py-2.5 text-sm rounded-xl transition-all duration-200 flex items-center" className="text-danger" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-danger-10)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <LogOut className="w-4 h-4 mr-3" />{t('navigation.logout', { defaultValue: 'Cerrar sesión' })}
            </button>
          </div>
        )}
      </div>
    </div>
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <Card className="p-6 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold " className="text-body">Crear evento con IA (beta)</h1>
            <p className="text-sm " className="text-secondary">
              Generaremos tareas, finanzas y recordatorios iniciales en base a tus respuestas.
              Podrás ajustarlos después.
            </p>
          </div>
          <span className="text-sm font-medium " className="text-muted">Paso {step} de 2</span>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          {step === 1 && (
            <section className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="coupleName">
                  Nombre del evento o pareja
                </label>
                <input
                  id="coupleName"
                  name="coupleName"
                  value={form.coupleName}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="María & Juan"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="weddingDate">
                    Fecha del evento
                  </label>
                  <input
                    id="weddingDate"
                    type="date"
                    name="weddingDate"
                    value={form.weddingDate}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                  {fieldErrors.weddingDate && (
                    <p className="mt-1 text-xs " className="text-danger">{fieldErrors.weddingDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="location">
                    Ubicación
                  </label>
                  <input
                    id="location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    placeholder={t('createWedding.locationPlaceholder')}
                  />
                  {fieldErrors.location && (
                    <p className="mt-1 text-xs " className="text-danger">{fieldErrors.location}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="eventType">
                    Tipo de evento
                  </label>
                  <select
                    id="eventType"
                    name="eventType"
                    value={form.eventType}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  >
                    {EVENT_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="style">
                    Estilo deseado
                  </label>
                  <select
                    id="style"
                    name="style"
                    value={form.style}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  >
                    {EVENT_STYLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="guestCountRange">
                    Tamaño estimado
                  </label>
                  <select
                    id="guestCountRange"
                    name="guestCountRange"
                    value={form.guestCountRange}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  >
                    {getGuestCountOptions(t).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="formalityLevel">
                    Nivel de formalidad
                  </label>
                  <select
                    id="formalityLevel"
                    name="formalityLevel"
                    value={form.formalityLevel}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  >
                    {getFormalityOptions(t).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isWedding && (
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="ceremonyType">
                    Tipo de ceremonia
                  </label>
                  <select
                    id="ceremonyType"
                    name="ceremonyType"
                    value={form.ceremonyType}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  >
                    {getCeremonyTypeOptions(t).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <span className="block text-sm font-medium mb-1">Eventos relacionados</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {getRelatedEventOptions(t).map((option) => {
                    const checked = form.relatedEvents.includes(option.value);
                    return (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 border rounded px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          value={option.value}
                          checked={checked}
                          onChange={() => toggleRelatedEvent(option.value)}
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
                {form.relatedEvents.length > 0 && (
                  <p className="mt-1 text-xs " className="text-muted">
                    Seleccionado: {form.relatedEvents.map((value) => relatedEventLabel[value]).join(', ')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="notes">
                  Notas o matices importantes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 h-28"
                  placeholder={t('createWedding.notesPlaceholder')}
                />
              </div>
            </section>
          )}

          {error && <div className="text-sm " className="text-danger">{error}</div>}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-xs " className="text-muted">
              Podrás modificar estos datos en la configuración del evento cuando lo necesites.
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-gray-200 rounded"
                disabled={loading}
              >
                Cancelar
              </button>
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2  rounded" className="bg-page"
                  disabled={loading}
                >
                  Volver
                </button>
              )}
              <button
                type={step === 2 ? 'submit' : 'button'}
                onClick={step === 1 ? goToStepTwo : undefined}
                disabled={loading}
                className="px-4 py-2  text-white rounded" style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {loading
                  ? 'Creando…'
                  : step === 2
                  ? isWedding
                    ? 'Crear boda'
                    : 'Crear evento'
                  : 'Siguiente'}
              </button>
            </div>
          </div>
        </form>
        </Card>
      </div>
      <Nav />
    </>
  );
}
