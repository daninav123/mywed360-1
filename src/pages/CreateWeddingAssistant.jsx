import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { createWedding } from '../services/WeddingService';
import {
  EVENT_TYPE_OPTIONS,
  EVENT_STYLE_OPTIONS,
  GUEST_COUNT_OPTIONS,
  FORMALITY_OPTIONS,
  CEREMONY_TYPE_OPTIONS,
} from '../config/eventStyles';

const OPTION_SETS = {
  eventType: EVENT_TYPE_OPTIONS,
  style: EVENT_STYLE_OPTIONS,
  guestCountRange: GUEST_COUNT_OPTIONS,
  formalityLevel: FORMALITY_OPTIONS,
  ceremonyType: CEREMONY_TYPE_OPTIONS,
};

const BASE_STEPS = [
  {
    id: 'eventType',
    field: 'eventType',
    question: '¿Qué tipo de evento quieres organizar? (por ejemplo, boda u otro tipo de evento)',
    type: 'options',
    optionsKey: 'eventType',
  },
  {
    id: 'coupleName',
    field: 'coupleName',
    question: 'Perfecto. ¿Cómo se llama la pareja o cómo te gustaría nombrar el evento?',
  },
  {
    id: 'weddingDate',
    field: 'weddingDate',
    question: '¿Cuál es la fecha prevista? (formato 2025-05-17)',
  },
  {
    id: 'location',
    field: 'location',
    question: '¿En qué ciudad o lugar te gustaría celebrarlo?',
  },
  {
    id: 'style',
    field: 'style',
    question: 'Hablemos del estilo general. ¿Cuál encaja mejor?',
    type: 'options',
    optionsKey: 'style',
  },
  {
    id: 'guestCountRange',
    field: 'guestCountRange',
    question: '¿Cuántas personas calculas que asistirán?',
    type: 'options',
    optionsKey: 'guestCountRange',
  },
  {
    id: 'formalityLevel',
    field: 'formalityLevel',
    question: '¿Qué nivel de formalidad imaginas?',
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
    id: 'notes',
    field: 'notes',
    question: '¿Quieres añadir algún detalle importante o inspiración que debamos tener en cuenta?',
    optional: true,
  },
];

const INITIAL_FORM = {
  eventType: EVENT_TYPE_OPTIONS[0].value,
  coupleName: '',
  weddingDate: '',
  location: '',
  style: EVENT_STYLE_OPTIONS[0].value,
  guestCountRange: GUEST_COUNT_OPTIONS[0].value,
  formalityLevel: FORMALITY_OPTIONS[0].value,
  ceremonyType: CEREMONY_TYPE_OPTIONS[0].value,
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
      return { ok: false, message: 'Necesito algún nombre, aunque sea provisional.' };
    }
    return { ok: true, value, display: value };
  },
  weddingDate: (input) => {
    const formatted = formatDate(input);
    if (!formatted) {
      return {
        ok: false,
        message: 'No pude entender la fecha. Usa el formato 2025-05-17.',
      };
    }
    return { ok: true, value: formatted, display: formatted };
  },
  location: (input) => {
    const value = input.trim();
    if (!value) {
      return {
        ok: false,
        message: 'Indica al menos una ciudad o zona aproximada.',
      };
    }
    return { ok: true, value, display: value };
  },
  notes: (input) => {
    const value = input.trim();
    if (!value) {
      return { ok: true, value: '', display: 'Sin notas adicionales' };
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
  const { currentUser, userProfile, hasRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      role: roles.assistant,
      content:
        '¡Hola! Soy tu asistente para crear el evento. Te iré haciendo algunas preguntas y con tus respuestas prepararé la base del proyecto.',
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
        content:
          'Perfecto, volvamos a empezar. Te haré de nuevo las preguntas clave para preparar el evento.',
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
        content:
          'Genial, ya tengo toda la información. Aquí tienes un resumen. Si todo está correcto, creamos el evento.',
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
        content: parsed.message || 'No me ha quedado claro, ¿puedes decirlo de otra forma?',
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
        label: 'Ubicación',
        value: form.location || '(por definir)',
      },
      {
        label: 'Estilo',
        value: optionLabel('style', form.style),
      },
      {
        label: 'Número de invitados',
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
      if (!currentUser?.uid) throw new Error('No hay sesión activa');
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
      };
      const weddingId = await createWedding(currentUser.uid, payload);
      setLastCreatedId(weddingId);
      appendMessage({
        role: roles.assistant,
        content: '¡Listo! He creado la boda y ya puedes empezar a trabajar con ella.',
      });
      setTimeout(() => {
        navigate(`/bodas/${weddingId}`);
      }, 600);
    } catch (error) {
      const message = error?.message || 'No pude crear el evento. Inténtalo de nuevo.';
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
            onClick={() => navigate('/home')}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded"
          >
            Volver al panel
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <Card className="p-6 flex flex-col gap-4 h-[70vh] md:h-[75vh]">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Asistente Conversacional</h1>
          <p className="text-sm text-gray-600">
            Charlemos unos minutos y dejaré lista la base del evento con las respuestas que me
            compartas.
          </p>
        </header>

        <div
          ref={messagesRef}
          className="flex-1 overflow-y-auto rounded border border-slate-200 bg-slate-50 p-4 space-y-3"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === roles.user ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  message.role === roles.user
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-800'
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
                    className="px-3 py-1.5 rounded-full border border-blue-200 bg-white text-sm text-blue-700 hover:bg-blue-600 hover:text-white transition"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                disabled={creating}
                placeholder="Escribe tu respuesta y pulsa Enter…"
                className="flex-1 border rounded px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || creating}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
              >
                Enviar
              </button>
            </div>
            {activeStep.optional && (
              <button
                type="button"
                onClick={() => submitAnswer('')}
                className="text-xs text-blue-600 hover:underline"
                disabled={creating}
              >
                Saltar este detalle
              </button>
            )}
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded border border-slate-200 bg-white p-4 text-sm">
              <h2 className="text-base font-semibold text-slate-800 mb-2">Resumen del evento</h2>
              <ul className="space-y-1">
                {summaryData.map((item) => (
                  <li key={item.label} className="flex flex-col md:flex-row md:items-center md:gap-3">
                    <span className="font-medium text-slate-600 md:w-48">{item.label}</span>
                    <span className="text-slate-800">{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            {requestError && (
              <div className="text-sm text-red-600">{requestError}</div>
            )}

            <div className="flex flex-col md:flex-row gap-2 md:justify-between">
              <div className="text-xs text-slate-500">
                {lastCreatedId
                  ? `ID creado: ${lastCreatedId}`
                  : 'Podrás ajustar cualquier dato del evento más adelante desde su configuración.'}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={restartConversation}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded"
                  disabled={creating}
                >
                  Cambiar respuestas
                </button>
                <button
                  type="button"
                  onClick={handleCreateWedding}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
                  disabled={creating}
                >
                  {creating ? 'Creando…' : 'Crear evento'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
