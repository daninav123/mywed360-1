import React, { useMemo, useState } from 'react';

import Button from '../ui/Button';
import Card from '../ui/Card';
import Loader from '../ui/Loader';

const ESSENTIAL_SERVICES = [
  { label: 'Lugar / Venue', description: 'Espacio principal para ceremonia y celebracion.' },
  { label: 'Catering', description: 'Banquete, coctel y bebidas para invitados.' },
  { label: 'Fotografia', description: 'Cobertura fotografica completa del evento.' },
  { label: 'Musica / DJ', description: 'Ambientacion musical y animacion de la fiesta.' },
];

const IMPORTANT_SERVICES = [
  { label: 'Flores y decoracion', description: 'Ambientacion floral y detalles decorativos.' },
  { label: 'Video', description: 'Grabacion y edicion del video de boda.' },
  { label: 'Transporte', description: 'Traslados para novios e invitados.' },
  { label: 'Maquillaje y peluqueria', description: 'Preparacion de la pareja y cortejo.' },
];

const OPTIONAL_SERVICES = [
  { label: 'Wedding planner', description: 'Coordinacion profesional integral.' },
  { label: 'Fotomaton', description: 'Cabina fotografica y entretenimiento extra.' },
  { label: 'Detalles y regalos', description: 'Obsequios personalizados para invitados.' },
  { label: 'Iluminacion', description: 'Escenografia de luces y efectos especiales.' },
  { label: 'Mesa dulce / postres', description: 'Reposteria, candy bar y opciones especiales.' },
];

const DEFAULT_SELECTION = ESSENTIAL_SERVICES.map((item) => item.label);

const normalizeLabels = (labels) => {
  return labels
    .map((text) => text.replace(/\s+/g, ' ').trim())
    .filter((text) => text.length > 0)
    .filter((text, index, arr) => arr.indexOf(text) === index);
};

export default function SupplierOnboardingModal({
  open,
  onClose,
  onComplete,
  onSkip,
  initialServices = [],
  weddingInfo,
  loadingWedding,
}) {
  const [step, setStep] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [tonePreference, setTonePreference] = useState('tranquilo');
  const [selectedLabels, setSelectedLabels] = useState(() => {
    if (initialServices.length > 0) {
      return normalizeLabels(initialServices);
    }
    return [...DEFAULT_SELECTION];
  });

  const suggestedGroups = useMemo(
    () => [
      { title: 'Imprescindibles', items: ESSENTIAL_SERVICES },
      { title: 'Muy recomendados', items: IMPORTANT_SERVICES },
      { title: 'Extras opcionales', items: OPTIONAL_SERVICES },
    ],
    []
  );

  const weddingSummary = useMemo(() => {
    if (!weddingInfo) return null;
    const date = weddingInfo.date || weddingInfo.weddingDate || weddingInfo.eventDate;
    const formattedDate = date
      ? new Date(date).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null;
    return {
      couple:
        [weddingInfo.brideFirstName, weddingInfo.groomFirstName, weddingInfo.partnerFirstName]
          .filter(Boolean)
          .join(' & ') ||
        weddingInfo.title ||
        weddingInfo.name,
      date: formattedDate,
      budget: weddingInfo.budget || weddingInfo.estimatedBudget || weddingInfo.totalBudget || null,
      guests: weddingInfo.guestCount || weddingInfo.guestsTarget || weddingInfo.guestGoal || null,
      style: weddingInfo.style || weddingInfo.preferredStyle || null,
    };
  }, [weddingInfo]);

  const toggleService = (label) => {
    setSelectedLabels((prev) => {
      if (prev.includes(label)) {
        return prev.filter((value) => value !== label);
      }
      return [...prev, label];
    });
  };

  const addCustomService = () => {
    const value = customInput.trim();
    if (!value) return;
    setSelectedLabels((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setCustomInput('');
  };

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 2));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 0));

  const handleComplete = async () => {
    const finalLabels = normalizeLabels(selectedLabels.length ? selectedLabels : DEFAULT_SELECTION);
    await onComplete?.(finalLabels, { tone: tonePreference });
  };

  const handleSkip = () => {
    onSkip?.();
  };

  if (!open) return null;

  const selectedCount = selectedLabels.length;
  const summaryLabels = normalizeLabels(selectedCount ? selectedLabels : DEFAULT_SELECTION);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-500">Configuracion asistida</p>
            <h2 className="text-2xl font-semibold">Completa tu dashboard de proveedores</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Cerrar"
          >
            ?
          </button>
        </div>

        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {[0, 1, 2].map((index) => (
              <React.Fragment key={index}>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                    step === index
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : step > index
                        ? 'border-blue-500 bg-blue-100 text-blue-700'
                        : 'border-gray-300 bg-white'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 2 && (
                  <span className={`h-px flex-1 ${step > index ? 'bg-blue-400' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Hola, organicemos tus proveedores clave</h3>
              <p className="text-gray-600">
                Te acompanaremos para seleccionar los servicios esenciales y crear tarjetas
                iniciales con estado "Pendiente". Podras ajustarlo mas adelante desde "Configurar
                servicios".
              </p>
              {loadingWedding ? (
                <div className="flex items-center gap-3 text-gray-500">
                  <Loader className="h-5 w-5" />
                  <span>Preparando datos de tu boda...</span>
                </div>
              ) : weddingSummary ? (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                  <p className="font-medium">Informacion detectada</p>
                  <ul className="mt-1 space-y-1">
                    {weddingSummary.couple && <li>Pareja: {weddingSummary.couple}</li>}
                    {weddingSummary.date && <li>Fecha: {weddingSummary.date}</li>}
                    {weddingSummary.guests && <li>Invitados estimados: {weddingSummary.guests}</li>}
                    {weddingSummary.budget && (
                      <li>Presupuesto estimado: {weddingSummary.budget} EUR</li>
                    )}
                    {weddingSummary.style && <li>Estilo preferido: {weddingSummary.style}</li>}
                  </ul>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  <p className="font-medium">No encontramos datos previos</p>
                  <p className="mt-1">
                    Puedes completarlos mas adelante desde la ficha de la boda.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <p className="font-medium text-gray-700">Que tono buscas para el evento?</p>
                <div className="flex flex-wrap gap-2">
                  {['tranquilo', 'festivo', 'elegante'].map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setTonePreference(tone)}
                      className={`rounded-full px-4 py-2 text-sm border ${
                        tonePreference === tone
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {tone.charAt(0).toUpperCase() + tone.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-semibold">Selecciona los servicios que necesitaras</h3>
                <p className="text-gray-600">
                  Puedes marcar y desmarcar libremente. Anade otros servicios al final si lo
                  necesitas.
                </p>
              </div>

              <div className="space-y-4">
                {suggestedGroups.map((group) => (
                  <div key={group.title}>
                    <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                      {group.title}
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {group.items.map((item) => {
                        const active = selectedLabels.includes(item.label);
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => toggleService(item.label)}
                            className={`rounded-lg border p-3 text-left transition ${
                              active
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                          >
                            <p className="font-medium">{item.label}</p>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-dashed border-gray-300 p-4">
                <p className="font-medium text-gray-700">Anade servicios especificos</p>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(event) => setCustomInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addCustomService();
                      }
                    }}
                    placeholder="Ej. Candy bar vegano, animacion infantil..."
                    className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <Button type="button" onClick={addCustomService} disabled={!customInput.trim()}>
                    Anadir
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-semibold">Resumen inicial</h3>
                <p className="text-gray-600">
                  Crearemos tarjetas "Pendiente" para estos servicios y activaremos sugerencias
                  basadas en IA para ayudarte a encontrarlos.
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-700">
                  Servicios seleccionados ({summaryLabels.length})
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {summaryLabels.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-white px-3 py-1 text-sm text-gray-700 border border-gray-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-medium">Que ocurrira al confirmar?</p>
                <ul className="mt-1 space-y-1 list-disc pl-5">
                  <li>
                    Guardaremos los servicios seleccionados con estado "Pendiente" en la boda
                    activa.
                  </li>
                  <li>
                    Las tarjetas apareceran al inicio del dashboard para priorizar su contratacion.
                  </li>
                  <li>
                    Podras ajustar prioridades y filtros desde "Configurar servicios" en cualquier
                    momento.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="flex flex-wrap justify-between gap-3">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Lo hare mas tarde
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={handleBack}>
                  Volver
                </Button>
              )}
              {step < 2 && (
                <Button type="button" onClick={handleNext}>
                  Continuar
                </Button>
              )}
              {step === 2 && (
                <Button type="button" onClick={handleComplete}>
                  Guardar configuracion
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
