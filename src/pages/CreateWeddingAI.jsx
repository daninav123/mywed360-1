import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { createWedding } from '../services/WeddingService';
import {
  EVENT_STYLE_OPTIONS,
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
  const { currentUser, userProfile, hasRole, isLoading } = useAuth();
  const navigate = useNavigate();
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
    if (validateStepOne()) setStep(2);
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
      if (!currentUser?.uid) throw new Error('No autenticado');
      const fallbackName = form.eventType === 'boda' ? 'Mi Boda' : 'Mi Evento';
      const trimmedNotes = form.notes.trim();
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
      navigate(`/bodas/${weddingId}`);
    } catch (err) {
      setError(err?.message || 'Error creando la boda');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="p-6 text-center text-sm text-gray-600">Cargando…</Card>
      </div>
    );
  }

  if (forbiddenRole) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="p-6 space-y-3 text-sm">
          <h1 className="text-xl font-semibold text-gray-900">Acceso restringido</h1>
          <p>
            Este asistente está reservado para propietarios del evento. Solicita acceso al owner o
            al administrador si necesitas crear un nuevo evento.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded"
          >
            Volver al inicio
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <Card className="p-6 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Crear evento con IA (beta)</h1>
            <p className="text-sm text-gray-600">
              Generaremos tareas, finanzas y recordatorios iniciales en base a tus respuestas.
              Podrás ajustarlos después.
            </p>
          </div>
          <span className="text-sm font-medium text-gray-500">Paso {step} de 2</span>
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
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.weddingDate}</p>
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
                    placeholder="Sevilla, España"
                  />
                  {fieldErrors.location && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.location}</p>
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
                    {GUEST_COUNT_OPTIONS.map((option) => (
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
                    {FORMALITY_OPTIONS.map((option) => (
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
                    {CEREMONY_TYPE_OPTIONS.map((option) => (
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
                  {RELATED_EVENT_OPTIONS.map((option) => {
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
                  <p className="mt-1 text-xs text-gray-500">
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
                  placeholder="Cuéntanos detalles sobre estilo, inspiración o restricciones."
                />
              </div>
            </section>
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-xs text-gray-500">
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
                  className="px-4 py-2 bg-gray-100 rounded"
                  disabled={loading}
                >
                  Volver
                </button>
              )}
              <button
                type={step === 2 ? 'submit' : 'button'}
                onClick={step === 1 ? goToStepTwo : undefined}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded"
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
  );
}
