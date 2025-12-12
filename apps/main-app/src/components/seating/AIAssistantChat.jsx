/**
 * AIAssistantChat - Chat inteligente para ayudar con el seating plan
 * Usa OpenAI GPT-4 para dar sugerencias contextuales
 */
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const AIAssistantChat = ({ guests = [], tables = [], isOpen, onClose, onSuggestion }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        '¡Hola! Soy tu asistente IA para el seating plan. Puedo ayudarte a organizar invitados, sugerir distribuciones y resolver problemas. ¿En qué puedo ayudarte?',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus en input cuando se abre
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Generar contexto del seating plan
  const getContext = () => {
    const totalGuests = guests.length;
    const assignedGuests = guests.filter((g) => g.tableId || g.table).length;
    const unassignedGuests = totalGuests - assignedGuests;
    const totalTables = tables.length;
    const occupiedTables = tables.filter((t) => {
      const tableGuests = guests.filter(
        (g) => String(g.tableId) === String(t.id) || String(g.table) === String(t.name || t.id)
      );
      return tableGuests.length > 0;
    }).length;

    return {
      totalGuests,
      assignedGuests,
      unassignedGuests,
      totalTables,
      occupiedTables,
      emptyTables: totalTables - occupiedTables,
      assignmentPercentage: totalGuests > 0 ? Math.round((assignedGuests / totalGuests) * 100) : 0,
    };
  };

  // Llamada a OpenAI API
  const callOpenAI = async (userMessage) => {
    const context = getContext();

    const systemPrompt = `Eres un asistente experto en organización de eventos y seating plans para bodas.

CONTEXTO ACTUAL:
- Total invitados: ${context.totalGuests}
- Invitados asignados: ${context.assignedGuests} (${context.assignmentPercentage}%)
- Sin asignar: ${context.unassignedGuests}
- Total mesas: ${context.totalTables}
- Mesas ocupadas: ${context.occupiedTables}
- Mesas vacías: ${context.emptyTables}

Tu trabajo es:
1. Responder preguntas sobre organización de mesas
2. Dar sugerencias prácticas y específicas
3. Ayudar a resolver problemas de capacidad
4. Sugerir distribuciones óptimas
5. Ser conciso y directo (máximo 3 párrafos)

Responde siempre en español, de forma amigable y profesional.`;

    const conversationHistory = messages.slice(-5).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer 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`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: userMessage },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('[AIAssistantChat] Error calling OpenAI:', error);
      throw error;
    }
  };

  // Manejar envío de mensaje
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Añadir mensaje del usuario
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Llamar a OpenAI
      const aiResponse = await callOpenAI(userMessage);

      // Añadir respuesta de IA
      const newAIMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, newAIMessage]);
    } catch (error) {
      toast.error('Error al comunicar con el asistente IA. Intenta de nuevo.');

      // Mensaje de error en el chat
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Disculpa, tuve un problema al procesar tu solicitud. ¿Puedes intentarlo de nuevo?',
          timestamp: Date.now(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Sugerencias rápidas
  const quickSuggestions = [
    '¿Cómo distribuyo 150 invitados?',
    '¿Qué distribución me recomiendas?',
    'Mesa 5 está llena, ¿dónde pongo a Juan?',
    'Dame tips para organizar familias',
  ];

  const handleQuickSuggestion = (suggestion) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed right-4 bottom-4 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-[var(--color-primary)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white" />
            <h3 className="font-semibold text-white">Asistente IA</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="p-3 bg-indigo-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              {getContext().assignedGuests}/{getContext().totalGuests} invitados
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {getContext().occupiedTables}/{getContext().totalTables} mesas
            </span>
            <span
              className={`font-semibold ${
                getContext().assignmentPercentage === 100 ? 'text-green-600' : 'text-orange-600'
              }`}
            >
              {getContext().assignmentPercentage}%
            </span>
          </div>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : message.isError
                      ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {new Date(message.timestamp).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Pensando...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sugerencias rápidas */}
        {messages.length === 1 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Preguntas frecuentes:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSuggestion(suggestion)}
                  className="text-xs p-2 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Pregunta algo..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIAssistantChat;
