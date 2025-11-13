import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Archive, Inbox, MessageSquare, User, Search } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import useTranslations from '../../hooks/useTranslations';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4004';

export default function SupplierMessages() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, format } = useTranslations();
  const messagesEndRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, archived
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadConversations();
  }, [id, filter]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('supplier_token');
      const response = await fetch(
        `${API_BASE}/api/supplier-messages/conversations?status=${filter}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);

        // Seleccionar primera conversación si no hay ninguna seleccionada
        if (!selectedConversation && data.conversations.length > 0) {
          setSelectedConversation(data.conversations[0]);
        }
      }
    } catch (error) {
      // console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const token = localStorage.getItem('supplier_token');
      const response = await fetch(
        `${API_BASE}/api/supplier-messages/conversations/${conversationId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      // console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const token = localStorage.getItem('supplier_token');
      const response = await fetch(
        `${API_BASE}/api/supplier-messages/conversations/${selectedConversation.id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: newMessage }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data.message]);
        setNewMessage('');
        loadConversations(); // Actualizar última vista de conversaciones
      }
    } catch (error) {
      // console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleArchiveConversation = async (conversationId) => {
    try {
      const token = localStorage.getItem('supplier_token');
      await fetch(`${API_BASE}/api/supplier-messages/conversations/${conversationId}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadConversations();
      setSelectedConversation(null);
    } catch (error) {
      // console.error('Error archiving conversation:', error);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(`/supplier/dashboard/${id}`)}
            className="flex items-center gap-2 hover:opacity-70"
            style={{ color: 'var(--color-text)' }}
          >
            <ArrowLeft size={20} />
            <span>Volver al Dashboard</span>
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
          Mensajes
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de conversaciones */}
          <div
            className="lg:col-span-1 shadow-md rounded-lg overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            {/* Filtros */}
            <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex gap-2 mb-3">
                {['all', 'active', 'archived'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      filter === f ? 'font-semibold' : ''
                    }`}
                    style={{
                      backgroundColor: filter === f ? 'var(--color-primary)' : 'transparent',
                      color: filter === f ? 'white' : 'var(--color-text)',
                    }}
                  >
                    {f === 'all' && 'Todas'}
                    {f === 'active' && 'Activas'}
                    {f === 'archived' && 'Archivadas'}
                  </button>
                ))}
              </div>

              {/* Búsqueda */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: 'var(--color-muted)' }}
                />
                <input
                  type="text"
                  placeholder="Buscar conversación..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    borderColor: 'var(--color-border)',
                    border: '1px solid',
                  }}
                />
              </div>
            </div>

            {/* Conversaciones */}
            <div className="max-h-[600px] overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare
                    size={48}
                    className="mx-auto mb-4"
                    style={{ color: 'var(--color-muted)' }}
                  />
                  <p style={{ color: 'var(--color-muted)' }}>No hay conversaciones</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 cursor-pointer hover:bg-opacity-50 border-b ${
                      selectedConversation?.id === conv.id ? 'bg-opacity-100' : ''
                    }`}
                    style={{
                      backgroundColor:
                        selectedConversation?.id === conv.id
                          ? 'rgba(109, 40, 217, 0.1)'
                          : 'transparent',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      >
                        <User size={20} color="white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3
                            className="font-semibold truncate"
                            style={{ color: 'var(--color-text)' }}
                          >
                            {conv.client.name}
                          </h3>
                          {conv.unreadCount > 0 && (
                            <span
                              className="text-xs font-bold px-2 py-1 rounded-full"
                              style={{
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                              }}
                            >
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm truncate" style={{ color: 'var(--color-muted)' }}>
                          {conv.lastMessage || 'Sin mensajes'}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {conv.lastMessageAt && format.date
                        ? format.date(conv.lastMessageAt.toDate(), { dateStyle: 'short' })
                        : ''}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat */}
          <div
            className="lg:col-span-2 shadow-md rounded-lg flex flex-col"
            style={{
              backgroundColor: 'var(--color-surface)',
              height: '700px',
            }}
          >
            {selectedConversation ? (
              <>
                {/* Header del chat */}
                <div
                  className="p-4 border-b flex items-center justify-between"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      <User size={20} color="white" />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                        {selectedConversation.client.name}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                        {selectedConversation.client.email || ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleArchiveConversation(selectedConversation.id)}
                    className="p-2 hover:opacity-70 rounded-lg"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    <Archive size={20} />
                  </button>
                </div>

                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderType === 'supplier' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className="max-w-[70%] rounded-lg p-3"
                        style={{
                          backgroundColor:
                            msg.senderType === 'supplier'
                              ? 'var(--color-primary)'
                              : 'rgba(0, 0, 0, 0.05)',
                          color: msg.senderType === 'supplier' ? 'white' : 'var(--color-text)',
                        }}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p
                          className="text-xs mt-1"
                          style={{
                            color:
                              msg.senderType === 'supplier'
                                ? 'rgba(255,255,255,0.7)'
                                : 'var(--color-muted)',
                          }}
                        >
                          {msg.createdAt && format.date
                            ? format.date(msg.createdAt.toDate(), {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input de mensaje */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Escribe un mensaje..."
                      className="flex-1 px-4 py-2 rounded-lg"
                      style={{
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-background)',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                      }}
                    >
                      <Send size={18} />
                      {sending ? 'Enviando...' : 'Enviar'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Inbox
                    size={64}
                    className="mx-auto mb-4"
                    style={{ color: 'var(--color-muted)' }}
                  />
                  <p style={{ color: 'var(--color-muted)' }}>
                    Selecciona una conversación para ver los mensajes
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
