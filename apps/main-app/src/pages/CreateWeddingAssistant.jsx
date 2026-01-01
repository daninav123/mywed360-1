import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import PageWrapper from '../components/PageWrapper';
import Button from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { createWedding } from '../services/WeddingService';
import {
  getEventStyleOptions,
  getGuestCountOptions,
  getFormalityOptions,
  getCeremonyTypeOptions,
  getRelatedEventOptions,
  getEventTypeOptions,
} from '../config/eventStyles';

const getOptionSets = (t) => ({
  eventType: getEventTypeOptions(t),
  style: getEventStyleOptions(t),
  guestCountRange: getGuestCountOptions(t),
  formalityLevel: getFormalityOptions(t),
  ceremonyType: getCeremonyTypeOptions(t),
});

const BASE_STEPS = [
  {
    id: 'eventType',
    field: 'eventType',
    question: '�Qu� tipo de evento quieres organizar? (por ejemplo, boda u otro tipo de evento)',
    type: 'options',
    optionsKey: 'eventType',
  },
  {
    id: 'coupleName',
    field: 'coupleName',
    question: 'Perfecto. �C�mo se llama la pareja o c�mo te gustar�a nombrar el evento?',
  },
  {
    id: 'weddingDate',
    field: 'weddingDate',
    question: '�Cu�l es la fecha prevista? (formato 2025-05-17)',
  },
  {
    id: 'location',
    field: 'location',
    question: '�En qu� ciudad o lugar te gustar�a celebrarlo?',
  },
  {
    id: 'style',
    field: 'style',
    question: 'Hablemos del estilo general. �Cu�l encaja mejor?',
    type: 'options',
    optionsKey: 'style',
  },
  {
    id: 'guestCountRange',
    field: 'guestCountRange',
    question: '�Cu�ntas personas calculas que asistir�n?',
    type: 'options',
    optionsKey: 'guestCountRange',
  },
  {
    id: 'formalityLevel',
    field: 'formalityLevel',
    question: '�Qu� nivel de formalidad imaginas?',
    type: 'options',
    optionsKey: 'formalityLevel',
  },
  {
    id: 'ceremonyType',
    field: 'ceremonyType',
    question: 'Y sobre la ceremonia, ¿cómo te gustaría que fuese?',
    type: 'options',
    optionsKey: 'ceremonyType',
    condition: (form) => form.eventType === 'boda',
  },
  {
    id: 'budget',
    field: 'budget',
    question: '¿Cuál es tu presupuesto aproximado para el evento? (ejemplo: 15000 o "flexible")',
    optional: false,
  },
  {
    id: 'timeAvailable',
    field: 'timeAvailable',
    question: '¿Cuánto tiempo tienes para organizar todo? (meses aproximados)',
    optional: false,
  },
  {
    id: 'priorities',
    field: 'priorities',
    question: 'Ordena tus 3 prioridades principales: 1) Fotografía/Video, 2) Comida/Catering, 3) Decoración, 4) Música, 5) Locación (escribe los números en orden, ejemplo: 1,3,2)',
    optional: false,
  },
  {
    id: 'concerns',
    field: 'concerns',
    question: '¿Hay algo que te preocupe especialmente o quieras asegurarte de que salga perfecto?',
    optional: true,
  },
  {
    id: 'notes',
    field: 'notes',
    question: '¿Quieres añadir algún detalle importante o inspiración que debamos tener en cuenta?',
    optional: true,
  },
];

let OPTION_SETS = {};

const INITIAL_FORM = {
  eventType: 'boda',
  coupleName: '',
  weddingDate: '',
  location: '',
  style: 'clasico',
  guestCountRange: '50-100',
  formalityLevel: 'formal',
  ceremonyType: 'religiosa',
  budget: '',
  timeAvailable: '',
  priorities: '',
  concerns: '',
  notes: '',
};

const roles = {
  assistant: 'assistant',
  user: 'user',
};

let autoId = 0;

const nextId = (prefix = 'msg') => {
  autoId += 1;
  return `${prefix}-${Date.now()}-${autoId}`;
};

const optionLabel = (optionsKey, value) => {
  const set = OPTION_SETS[optionsKey] || [];
  const match = set.find((opt) => opt.value === value);
  return match ? match.label : value;
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getOptionParse = (optionsKey) => {
  const set = OPTION_SETS[optionsKey] || [];
  return (input) => {
    const normalized = input.trim().toLowerCase();
    const match = set.find(
      (opt) =>
        opt.value.toLowerCase() === normalized ||
        opt.label.toLowerCase() === normalized
    );
    if (!match) {
      const labels = set.map((opt) => opt.label).join(', ');
      return {
        ok: false,
        message: `Puedes elegir entre: ${labels}.`,
      };
    }
    return {
      ok: true,
      value: match.value,
      display: match.label,
    };
  };
};

const stepParsers = {
  eventType: getOptionParse('eventType'),
  style: getOptionParse('style'),
  guestCountRange: getOptionParse('guestCountRange'),
  formalityLevel: getOptionParse('formalityLevel'),
  ceremonyType: getOptionParse('ceremonyType'),
  coupleName: (input) => {
    const value = input.trim();
    if (!value) {
      return { ok: false, message: t('weddingAssistant.validation.nameRequired') };
    }
    return { ok: true, value, display: value };
  },
  weddingDate: (input) => {
    const formatted = formatDate(input);
    if (!formatted) {
      return {
        ok: false,
        message: t('weddingAssistant.validation.dateInvalid'),
      };
    }
    return { ok: true, value: formatted, display: formatted };
  },
  location: (input) => {
    const value = input.trim();
    if (!value) {
      return {
        ok: false,
        message: t('weddingAssistant.validation.locationRequired'),
      };
    }
    return { ok: true, value, display: value };
  },
  budget: (input) => {
    const value = input.trim();
    if (!value) {
      return { ok: false, message: t('weddingAssistant.validation.budgetRequired') };
    }
    return { ok: true, value, display: value };
  },
  timeAvailable: (input) => {
    const value = input.trim();
    const months = parseInt(value, 10);
    if (isNaN(months) || months < 1) {
      return { ok: false, message: t('weddingAssistant.validation.timeInvalid') };
    }
    return { ok: true, value: `${months}`, display: `${months} meses` };
  },
  priorities: (input) => {
    const value = input.trim();
    const pattern = /^\d,\d,\d$/;
    if (!pattern.test(value)) {
      return { ok: false, message: t('weddingAssistant.validation.prioritiesInvalid') };
    }
    return { ok: true, value, display: value };
  },
  concerns: (input) => {
    const value = input.trim();
    if (!value) {
      return { ok: true, value: '', display: t('weddingAssistant.validation.noConcerns') };
    }
    return { ok: true, value, display: value };
  },
  notes: (input) => {
    const value = input.trim();
    if (!value) {
      return { ok: true, value: '', display: t('weddingAssistant.validation.noNotes') };
    }
    return { ok: true, value, display: value };
  },
};

const findNextStepIndex = (currentIndex, form) => {
  for (let i = currentIndex + 1; i < BASE_STEPS.length; i += 1) {
    const step = BASE_STEPS[i];
    if (!step.condition || step.condition(form)) {
      return i;
    }
  }
  return -1;
};

const firstActiveStepIndex = (form) => {
  for (let i = 0; i < BASE_STEPS.length; i += 1) {
    const step = BASE_STEPS[i];
    if (!step.condition || step.condition(form)) return i;
  }
  return 0;
};

const initialStepIndex = firstActiveStepIndex(INITIAL_FORM);

export default function CreateWeddingAssistant() {
  const { t } = useTranslation();
  OPTION_SETS = getOptionSets(t);
  const { currentUser, userProfile, hasRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      role: roles.assistant,
      content: t('weddingAssistant.welcome'),
    },
    {
      id: `step-${BASE_STEPS[initialStepIndex].id}`,
      role: roles.assistant,
      content: BASE_STEPS[initialStepIndex].question,
    },
  ]);
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex);
  const [inputValue, setInputValue] = useState('');
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [lastCreatedId, setLastCreatedId] = useState('');
  const messagesRef = useRef(null);

  const isOwnerLike = hasRole('owner', 'pareja', 'admin');
  const forbiddenRole =
    !isLoading && (!!currentUser || !!userProfile) && !isOwnerLike;

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const appendMessage = (message) => {
    const prefix = message.role === roles.user ? roles.user : roles.assistant;
    setMessages((prev) => [
      ...prev,
      {
        ...message,
        id: message.id || nextId(prefix),
      },
    ]);
  };

  const activeStep = summaryVisible ? null : BASE_STEPS[currentStepIndex];

  const restartConversation = () => {
    setForm(INITIAL_FORM);
    setInputValue('');
    setSummaryVisible(false);
    setCreating(false);
    setRequestError('');
    setLastCreatedId('');
    const firstIndex = firstActiveStepIndex(INITIAL_FORM);
    setCurrentStepIndex(firstIndex);
    setMessages([
      {
        id: 'welcome',
        role: roles.assistant,
        content: t('weddingAssistant.restart'),
      },
      {
        id: `step-${BASE_STEPS[firstIndex].id}`,
        role: roles.assistant,
        content: BASE_STEPS[firstIndex].question,
      },
    ]);
  };

  const goToNextStep = (updatedForm) => {
    const nextIndex = findNextStepIndex(currentStepIndex, updatedForm);
    if (nextIndex === -1) {
      setSummaryVisible(true);
      appendMessage({
        role: roles.assistant,
        content: t('weddingAssistant.allInfoCollected'),
      });
    } else {
      setCurrentStepIndex(nextIndex);
      appendMessage({
        role: roles.assistant,
        content: BASE_STEPS[nextIndex].question,
      });
    }
  };

  const submitAnswer = (rawInput) => {
    if (!activeStep) return;
    const parser = stepParsers[activeStep.field];
    const parsed = parser ? parser(rawInput, form) : { ok: true, value: rawInput, display: rawInput };
    if (!parsed.ok) {
      appendMessage({
        role: roles.assistant,
        content: parsed.message || t('weddingAssistant.parseError'),
      });
      return;
    }

    appendMessage({
      role: roles.user,
      content: parsed.display || rawInput,
    });

    setForm((prev) => {
      const nextForm = { ...prev, [activeStep.field]: parsed.value };
      setTimeout(() => {
        goToNextStep(nextForm);
      }, 80);
      return nextForm;
    });
    setInputValue('');
  };

  const handleSend = (event) => {
    event.preventDefault();
    if (creating || summaryVisible || !activeStep) return;
    const trimmed = inputValue.trim();
    if (!trimmed && !activeStep.optional) return;
    submitAnswer(trimmed);
  };

  const handleOptionClick = (value) => {
    if (creating || summaryVisible || !activeStep) return;
    submitAnswer(value);
  };

  const summaryData = useMemo(() => {
    if (!summaryVisible) return [];
    const rows = [
      {
        label: 'Tipo de evento',
        value: optionLabel('eventType', form.eventType),
      },
      {
        label: 'Nombre / pareja',
        value: form.coupleName || '(no indicado)',
      },
      {
        label: 'Fecha',
        value: form.weddingDate || '(por confirmar)',
      },
      {
        label: 'Ubicaci�n',
        value: form.location || '(por definir)',
      },
      {
        label: 'Estilo',
        value: optionLabel('style', form.style),
      },
      {
        label: 'N�mero de invitados',
        value: optionLabel('guestCountRange', form.guestCountRange),
      },
      {
        label: 'Formalidad',
        value: optionLabel('formalityLevel', form.formalityLevel),
      },
    ];
    if (form.eventType === 'boda') {
      rows.push({
        label: 'Tipo de ceremonia',
        value: optionLabel('ceremonyType', form.ceremonyType),
      });
    }
    rows.push({
      label: 'Notas',
      value: form.notes || 'Sin notas adicionales',
    });
    return rows;
  }, [summaryVisible, form]);

  const handleCreateWedding = async () => {
    setCreating(true);
    setRequestError('');
    try {
      if (!currentUser?.uid) throw new Error('No hay sesi�n activa');
      const fallbackName = form.eventType === 'boda' ? 'Mi Boda' : 'Mi Evento';
      const payload = {
        name: form.coupleName || fallbackName,
        weddingDate: form.weddingDate || '',
        location: form.location || '',
        eventType: form.eventType,
        eventProfile: {
          guestCountRange: form.guestCountRange,
          formalityLevel: form.formalityLevel,
          ceremonyType: form.eventType === 'boda' ? form.ceremonyType : null,
          relatedEvents: [],
          notes: form.notes || '',
        },
        preferences: { style: form.style },
        onboarding: {
          budget: form.budget || '',
          timeAvailable: form.timeAvailable || '',
          priorities: form.priorities || '',
          concerns: form.concerns || '',
          completedAt: new Date().toISOString(),
          method: 'assistant',
        },
      };
      const weddingId = await createWedding(currentUser.uid, payload);
      setLastCreatedId(weddingId);
      appendMessage({
        role: roles.assistant,
        content: '�Listo! He creado la boda y ya puedes empezar a trabajar con ella.',
      });
      setTimeout(() => {
        navigate(`/bodas/${weddingId}`);
      }, 600);
    } catch (error) {
      const message = error?.message || 'No pude crear el evento. Int�ntalo de nuevo.';
      setRequestError(message);
      appendMessage({
        role: roles.assistant,
        content: message,
      });
      setCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="p-6 text-center text-sm text-[color:var(--color-muted)]">Cargando...</Card>
      </div>
    );
  }

  if (forbiddenRole) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="space-y-3 text-sm">
          <h2 className="text-xl font-semibold text-[color:var(--color-text)]">Acceso restringido</h2>
          <p className="text-[color:var(--color-muted)]">
            Este asistente está reservado para propietarios del evento. Solicita acceso al owner o al
            administrador si necesitas crear un nuevo evento.
          </p>
          <Button type="button" onClick={() => navigate('/home')}>
            Volver al panel
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card className="flex h-[70vh] flex-col gap-4 p-6 md:h-[75vh]">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold text-[color:var(--color-text)]">
          Configuraci�n r�pida con IA
        </h2>
        <p className="text-sm text-[color:var(--color-muted)]">
          Charlemos unos minutos y dejar� lista la base del evento con las respuestas que me
          compartas.
        </p>
      </header>

      <div
        ref={messagesRef}
        className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-60)] p-4"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === roles.user ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                message.role === roles.user
                  ? 'bg-[var(--color-primary)] text-[color:var(--color-surface)]'
                  : 'border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text)]'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {!summaryVisible && activeStep ? (
        <form onSubmit={handleSend} className="space-y-3">
          {activeStep.type === 'options' && (
            <div className="flex flex-wrap gap-2">
              {(OPTION_SETS[activeStep.optionsKey] || []).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionClick(option.value)}
                  className="rounded-full border border-[color:var(--color-primary-40)] bg-[color:var(--color-surface)] px-3 py-1.5 text-sm text-[color:var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-[color:var(--color-surface)]"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-4">
            {activeStep.optional && (
              <button
                type="button"
                onClick={() => submitAnswer('')}
                className="text-xs text-[color:var(--color-primary)] hover:underline"
                disabled={creating}
              >
                Saltar este detalle
              </button>
            )}
            <button
              type="button"
              onClick={handleSend}
              className="px-4 py-2  text-white rounded-lg hover:bg-blue-700" style={{ backgroundColor: 'var(--color-primary)' }}
              disabled={creating}
            >
              Continuar
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 text-sm">
            <h3 className="mb-2 text-base font-semibold text-[color:var(--color-text)]">
              Resumen del evento
            </h3>
            <ul className="space-y-1">
              {summaryData.map((item) => (
                <li
                  key={item.label}
                  className="flex flex-col md:flex-row md:items-center md:gap-3"
                >
                  <span className="font-medium text-[color:var(--color-muted)] md:w-48">
                    {item.label}
                  </span>
                  <span className="text-[color:var(--color-text)]">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>

          {requestError && (
            <div className="text-sm text-[color:var(--color-danger)]">{requestError}</div>
          )}

          <div className="flex flex-col gap-2 md:flex-row md:justify-between">
            <div className="text-xs text-[color:var(--color-muted)]">
              {lastCreatedId
                ? `ID creado: ${lastCreatedId}`
                : 'Podr�s ajustar cualquier dato del evento m�s adelante desde su configuraci�n.'}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={restartConversation}
                disabled={creating}
              >
                Cambiar respuestas
              </Button>
              <Button type="button" onClick={handleCreateWedding} disabled={creating}>
                {creating ? 'Creando...' : 'Crear evento'}
              </Button>
            </div>
          </div>
        </div>
      )}
      </Card>
    </div>
  );
}
