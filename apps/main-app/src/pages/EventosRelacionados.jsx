/**
 * EventosRelacionados - Gestión de eventos relacionados con la boda
 * FASE 5.6 del WORKFLOW-USUARIO.md
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Users, Clock, Edit2, Trash2, Plus, Wine, Coffee, PartyPopper, Music } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useWedding } from '../context/WeddingContext';
import PageWrapper from '../components/PageWrapper';
import { toast } from 'react-toastify';

const getEventTypes = (t) => [
  {
    id: 'despedida-soltera',
    name: t('relatedEvents.types.bridal'),
    icon: '👰',
    color: 'pink',
    defaultActivities: ['Spa', 'Cena', 'Fiesta', 'Juegos']
  },
  {
    id: 'despedida-soltero',
    name: t('relatedEvents.types.bachelor'),
    icon: '🤵',
    color: 'blue',
    defaultActivities: ['Karting', 'Paintball', 'Cena', 'Copa']
  },
  {
    id: 'cena-ensayo',
    name: t('relatedEvents.types.rehearsal'),
    icon: '🍽️',
    color: 'purple',
    defaultActivities: ['Ensayo ceremonia', 'Cena íntima', 'Brindis']
  },
  {
    id: 'brunch-post',
    name: t('relatedEvents.types.brunch'),
    icon: '☕',
    color: 'orange',
    defaultActivities: ['Desayuno', 'Fotos informales', 'Despedidas']
  },
  {
    id: 'welcome-party',
    name: t('relatedEvents.types.welcome'),
    icon: '🎉',
    color: 'green',
    defaultActivities: ['Recepción', 'Cóctel', 'Presentaciones']
  },
  {
    id: 'ceremonia-civil',
    name: t('relatedEvents.types.civil'),
    icon: '📋',
    color: 'gray',
    defaultActivities: ['Firma documentos', 'Ceremonia breve', 'Fotos']
  },
  {
    id: 'otro',
    name: t('relatedEvents.types.other'),
    icon: '🎊',
    color: 'indigo',
    defaultActivities: []
  }
];

const EventCard = ({ event, onEdit, onDelete }) => {
  const { t } = useTranslation('pages');
  const EVENT_TYPES = getEventTypes(t);
  const typeConfig = EVENT_TYPES.find(type => type.id === event.type) || EVENT_TYPES[6];
  
  const getColorClasses = (color) => {
    const colors = {
      pink: 'border-pink-200 bg-pink-50',
      blue: 'border-blue-200 bg-blue-50',
      purple: 'border-purple-200 bg-purple-50',
      orange: 'border-orange-200 bg-orange-50',
      green: 'border-green-200 bg-green-50',
      gray: 'border-gray-200 bg-gray-50',
      indigo: 'border-indigo-200 bg-indigo-50'
    };
    return colors[color] || colors.gray;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className={`border-2 rounded-lg p-5 transition-shadow hover:shadow-md ${getColorClasses(typeConfig.color)}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{typeConfig.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-800">
              {event.customName || typeConfig.name}
            </h3>
            <p className="text-sm text-gray-600">{typeConfig.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(event)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {event.date && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>{formatDate(event.date)}</span>
            {event.time && <span className="text-gray-500">• {event.time}</span>}
          </div>
        )}

        {event.location && (
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{event.location}</span>
          </div>
        )}

        {event.guestCount && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>{event.guestCount} invitados</span>
          </div>
        )}

        {event.activities && event.activities.length > 0 && (
          <div className="pt-3 border-t border-gray-300">
            <p className="text-xs font-medium text-gray-600 mb-2">Actividades:</p>
            <div className="flex flex-wrap gap-2">
              {event.activities.map((activity, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-white rounded-full text-xs text-gray-700 border border-gray-300"
                >
                  {activity}
                </span>
              ))}
            </div>
          </div>
        )}

        {event.budget && (
          <div className="text-sm text-gray-700 pt-2 border-t border-gray-300">
            💰 Presupuesto: {event.budget}€
          </div>
        )}

        {event.notes && (
          <div className="text-xs text-gray-600 pt-3 border-t border-gray-300">
            {event.notes}
          </div>
        )}
      </div>
    </div>
  );
};

const EventModal = ({ event, onSave, onClose }) => {
  const [formData, setFormData] = useState(
    event || {
      type: 'despedida-soltera',
      customName: '',
      date: '',
      time: '',
      location: '',
      guestCount: '',
      activities: [],
      budget: '',
      notes: ''
    }
  );

  const [newActivity, setNewActivity] = useState('');
  const selectedType = EVENT_TYPES.find(t => t.id === formData.type) || EVENT_TYPES[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.date) {
      toast.error('La fecha es obligatoria');
      return;
    }
    onSave(formData);
  };

  const handleAddActivity = () => {
    if (!newActivity.trim()) return;
    
    setFormData({
      ...formData,
      activities: [...formData.activities, newActivity.trim()]
    });
    setNewActivity('');
  };

  const handleRemoveActivity = (idx) => {
    setFormData({
      ...formData,
      activities: formData.activities.filter((_, i) => i !== idx)
    });
  };

  const handleLoadDefaultActivities = () => {
    if (selectedType.defaultActivities.length > 0) {
      setFormData({
        ...formData,
        activities: [...selectedType.defaultActivities]
      });
      toast.success('Actividades por defecto cargadas');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {event ? 'Editar evento' : 'Nuevo evento relacionado'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de evento
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {EVENT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.id })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.type === type.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <span className="text-2xl mb-1 block">{type.icon}</span>
                    <span className="text-xs text-gray-700 line-clamp-2">{type.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {formData.type === 'otro' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('relatedEvents.namePlaceholder')}
                </label>
                <input
                  type="text"
                  value={formData.customName}
                  onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
                  placeholder={t('relatedEvents.namePlaceholder')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Dirección o lugar"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de invitados
                </label>
                <input
                  type="number"
                  value={formData.guestCount}
                  onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Presupuesto (€)
                </label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Actividades
                </label>
                {formData.activities.length === 0 && selectedType.defaultActivities.length > 0 && (
                  <button
                    type="button"
                    onClick={handleLoadDefaultActivities}
                    className="text-xs text-purple-600 hover:text-purple-700"
                  >
                    Cargar actividades típicas
                  </button>
                )}
              </div>

              {formData.activities.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.activities.map((activity, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm"
                    >
                      {activity}
                      <button
                        type="button"
                        onClick={() => handleRemoveActivity(idx)}
                        className="hover:text-purple-900"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddActivity())}
                  placeholder="Nueva actividad..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddActivity}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('relatedEvents.notesPlaceholder')}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {event ? 'Guardar' : 'Crear evento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function EventosRelacionados() {
  const { activeWedding } = useWedding();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (!activeWedding) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const docRef = doc(db, 'weddings', activeWedding, 'events', 'related');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeWedding]);

  const saveData = useCallback(async (newEvents) => {
    if (!activeWedding) return;

    try {
      const docRef = doc(db, 'weddings', activeWedding, 'events', 'related');
      await setDoc(docRef, {
        events: newEvents,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving events:', error);
      toast.error('Error al guardar');
    }
  }, [activeWedding]);

  const handleSave = useCallback((formData) => {
    let newEvents;
    
    if (editingEvent) {
      newEvents = events.map(e => 
        e.id === editingEvent.id ? { ...formData, id: e.id } : e
      );
      toast.success('Evento actualizado');
    } else {
      const newEvent = {
        ...formData,
        id: `event-${Date.now()}`,
      };
      newEvents = [...events, newEvent];
      toast.success('Evento creado');
    }

    setEvents(newEvents);
    saveData(newEvents);
    setShowModal(false);
    setEditingEvent(null);
  }, [events, editingEvent, saveData]);

  const handleDelete = useCallback((id) => {
    if (!confirm('¿Eliminar este evento?')) return;
    
    const newEvents = events.filter(e => e.id !== id);
    setEvents(newEvents);
    saveData(newEvents);
    toast.success('Evento eliminado');
  }, [events, saveData]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando eventos...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const filteredEvents = filterType === 'all' 
    ? events 
    : events.filter(e => e.type === filterType);

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });

  const typeStats = EVENT_TYPES.map(type => ({
    ...type,
    count: events.filter(e => e.type === type.id).length
  })).filter(t => t.count > 0);

  const totalGuests = events.reduce((sum, e) => sum + (parseInt(e.guestCount) || 0), 0);
  const totalBudget = events.reduce((sum, e) => sum + (parseFloat(e.budget) || 0), 0);

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <PartyPopper className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Eventos Relacionados</h1>
                  <p className="text-sm text-gray-600">
                    Gestiona todos los eventos alrededor de tu boda
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Añadir evento
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">{events.length}</div>
                <div className="text-xs text-gray-600">Eventos</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">{totalGuests}</div>
                <div className="text-xs text-gray-600">Invitados totales</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">{totalBudget.toFixed(0)}€</div>
                <div className="text-xs text-gray-600">Presupuesto total</div>
              </div>
            </div>
          </div>

          {/* Type Filter */}
          {events.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterType === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Todos ({events.length})
              </button>
              {typeStats.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFilterType(type.id)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterType === type.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {type.icon} {type.name} ({type.count})
                </button>
              ))}
            </div>
          )}

          {/* Events */}
          {events.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <PartyPopper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No hay eventos relacionados
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Añade despedidas, cenas, brunches y otros eventos alrededor de tu boda
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Añadir primer evento
              </button>
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-600">No hay eventos de este tipo</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onEdit={(e) => {
                    setEditingEvent(e);
                    setShowModal(true);
                  }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <EventModal
            event={editingEvent}
            onSave={handleSave}
            onClose={() => {
              setShowModal(false);
              setEditingEvent(null);
            }}
          />
        )}
      </div>
    </PageWrapper>
  );
}
