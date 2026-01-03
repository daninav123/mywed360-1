import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { getBackendUrl } from '../../config';

const API_URL = getBackendUrl();

/**
 * Modal de chat IA para diseño de boda
 */
const WeddingDesignChat = ({ 
  isOpen, 
  onClose, 
  context,
  weddingInfo,
  weddingDesign,
  supplierRequirements,
  onUpdateDesign,
  onUpdateRequirements,
}) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: getInitialMessage(context),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Resetear mensajes cuando cambia el contexto
  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          role: 'assistant',
          content: getInitialMessage(context),
        }
      ]);
    }
  }, [isOpen, context]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    // Añadir mensaje del usuario
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/wedding-design/chat`, {
        message: userMessage,
        context: {
          weddingInfo,
          weddingDesign,
          supplierRequirements,
          currentSection: context?.section,
          currentCategory: context?.category,
        },
        phase: context?.phase || 'general',
      });

      // Añadir respuesta de la IA
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.response,
      }]);

      // Si hay sugerencias de actualizaciones, notificar
      if (response.data.updates?.suggestions?.length > 0) {
        toast.info('💡 He detectado algunas preferencias. Recuerda marcarlas en el formulario.', {
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error('Error en chat:', error);
      toast.error('Error al comunicar con la IA. Inténtalo de nuevo.');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💬</span>
            <div>
              <h3 className="font-bold text-lg">Asistente de Diseño</h3>
              <p className="text-xs opacity-90">
                {getContextLabel(context)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin text-purple-600" />
                <span className="text-sm text-gray-600">Pensando...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows="2"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-xl hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Presiona Enter para enviar. Shift+Enter para nueva línea.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Mensaje inicial según contexto
 */
function getInitialMessage(context) {
  if (!context) {
    return '¡Hola! 👋 Soy tu asistente de diseño de bodas. Estoy aquí para ayudarte a crear la boda perfecta. ¿En qué puedo ayudarte?';
  }

  if (context.section === 'vision') {
    return '¡Genial! 🎨 Vamos a descubrir juntos el estilo perfecto para vuestra boda.\n\n¿Habéis pensado ya en qué tipo de boda os gustaría? ¿Algo íntimo, una gran celebración, rústico, moderno...?';
  }

  if (context.category) {
    const messages = {
      fotografia: '📸 ¡Perfecto! Vamos a definir qué necesitáis en fotografía.\n\nPrimero, ¿habéis pensado en cuántas horas de cobertura necesitáis? Normalmente recomiendo entre 8-10 horas para cubrir preparativos, ceremonia y banquete.',
      video: '🎥 ¡Genial! El vídeo es un recuerdo increíble de vuestra boda.\n\n¿Os gustaría tener vídeo aéreo con dron? Da una perspectiva espectacular del lugar y los invitados.',
      dj: '🎧 ¡Vamos a crear la fiesta perfecta!\n\n¿Qué efectos especiales os gustarían? Os cuento los más populares:\n\n❄️ Fuego frío - seguro y muy espectacular\n🎊 Confeti\n💨 Humo\n💡 Luces LED\n\n¿Alguno os llama la atención?',
      animacion: '🎭 ¡Perfecto! La animación añade ese toque especial.\n\n¿Qué tipo de espectáculo os imagináis? ¿Algo más interactivo con los invitados o una exhibición para sorprender?',
      iluminacion: '💡 ¡La iluminación transforma completamente el ambiente!\n\n¿Os gustaría proyectar vuestros nombres en algún sitio? El efecto "gobo" es precioso y muy personal.',
    };

    return messages[context.category] || `¡Hola! Vamos a definir qué necesitáis para ${context.category}. ¿Qué te gustaría saber?`;
  }

  return '¡Hola! 👋 ¿En qué puedo ayudarte?';
}

/**
 * Label del contexto actual
 */
function getContextLabel(context) {
  if (!context) return 'Asistencia general';
  if (context.section === 'vision') return 'Visión y Estilo';
  if (context.category) {
    const names = {
      fotografia: 'Fotografía',
      video: 'Vídeo',
      dj: 'DJ y Efectos',
      musica: 'Música',
      animacion: 'Animación',
      iluminacion: 'Iluminación',
    };
    return names[context.category] || context.category;
  }
  return 'Asistencia general';
}

export default WeddingDesignChat;
