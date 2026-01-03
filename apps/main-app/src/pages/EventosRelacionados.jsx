/**
 * EventosRelacionados - Gestión de eventos relacionados con la boda
 * FASE 5.6 del WORKFLOW-USUARIO.md
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, Users, Clock, Edit2, Trash2, Plus, Wine, Coffee, PartyPopper, Music } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004/api';
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
            <h3 className="font-semibold " className="text-body">
              {event.customName || typeConfig.name}
            </h3>
            <p className="text-sm " className="text-secondary">{typeConfig.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(event)}
            className="p-2  hover: hover:bg-blue-50 rounded transition-colors" className="text-primary" className="text-secondary"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="p-2  hover: hover:bg-red-50 rounded transition-colors" className="text-danger" className="text-secondary"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {event.date && (
          <div className="flex items-center gap-2 text-sm " className="text-body">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>{formatDate(event.date)}</span>
            {event.time && <span className="" className="text-muted">• {event.time}</span>}
          </div>
        )}

        {event.location && (
          <div className="flex items-start gap-2 text-sm " className="text-body">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{event.location}</span>
          </div>
        )}

        {event.guestCount && (
          <div className="flex items-center gap-2 text-sm " className="text-body">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>{event.guestCount} invitados</span>
          </div>
        )}

        {event.activities && event.activities.length > 0 && (
          <div className="pt-3 border-t " className="border-default">
            <p className="text-xs font-medium  mb-2" className="text-secondary">Actividades:</p>
            <div className="flex flex-wrap gap-2">
              {event.activities.map((activity, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1  rounded-full text-xs  border " className="border-default" className="text-body" className="bg-surface"
                >
                  {activity}
                </span>
              ))}
            </div>
          </div>
        )}

        {event.budget && (
          <div className="text-sm  pt-2 border-t " className="border-default" className="text-body">
            💰 Presupuesto: {event.budget}€
          </div>
        )}

        {event.notes && (
          <div className="text-xs  pt-3 border-t " className="border-default" className="text-secondary">
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
      <div className=" rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" className="bg-surface">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold " className="text-body">
              {event ? 'Editar evento' : 'Nuevo evento relacionado'}
            </h2>
            <button onClick={onClose} className=" hover:" className="text-muted" className="text-secondary">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium  mb-2" className="text-body">
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
                    <span className="text-xs  line-clamp-2" className="text-body">{type.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {formData.type === 'otro' && (
              <div>
                <label className="block text-sm font-medium  mb-1" className="text-body">
                  {t('relatedEvents.namePlaceholder')}
                </label>
                <input
                  type="text"
                  value={formData.customName}
                  onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
                  placeholder={t('relatedEvents.namePlaceholder')}
                  className="w-full border  rounded-lg px-3 py-2" className="border-default"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium  mb-1" className="text-body">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full border  rounded-lg px-3 py-2" className="border-default"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium  mb-1" className="text-body">
                  Hora
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full border  rounded-lg px-3 py-2" className="border-default"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium  mb-1" className="text-body">
                Ubicación
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Dirección o lugar"
                className="w-full border  rounded-lg px-3 py-2" className="border-default"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium  mb-1" className="text-body">
                  Número de invitados
                </label>
                <input
                  type="number"
                  value={formData.guestCount}
                  onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                  placeholder="0"
                  className="w-full border  rounded-lg px-3 py-2" className="border-default"
                />
              </div>

              <div>
                <label className="block text-sm font-medium  mb-1" className="text-body">
                  Presupuesto (€)
                </label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="0"
                  className="w-full border  rounded-lg px-3 py-2" className="border-default"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium " className="text-body">
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
                  className="flex-1 border  rounded-lg px-3 py-2 text-sm" className="border-default"
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
              <label className="block text-sm font-medium  mb-1" className="text-body">
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('relatedEvents.notesPlaceholder')}
                rows={3}
                className="w-full border  rounded-lg px-3 py-2" className="border-default"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border  rounded-lg hover: transition-colors" className="border-default" className="bg-page"
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
            <p className="" className="text-secondary">Cargando eventos...</p>
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
                <div className="p-3  rounded-lg shadow-sm" className="bg-surface">
                  <PartyPopper className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold " className="text-body">Eventos Relacionados</h1>
                  <p className="text-sm " className="text-secondary">
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
              <div className=" rounded-lg p-3 border " className="border-default" className="bg-surface">
                <div className="text-2xl font-bold " className="text-body">{events.length}</div>
                <div className="text-xs " className="text-secondary">Eventos</div>
              </div>
              <div className=" rounded-lg p-3 border " className="border-default" className="bg-surface">
                <div className="text-2xl font-bold " className="text-body">{totalGuests}</div>
                <div className="text-xs " className="text-secondary">Invitados totales</div>
              </div>
              <div className=" rounded-lg p-3 border " className="border-default" className="bg-surface">
                <div className="text-2xl font-bold " className="text-body">{totalBudget.toFixed(0)}€</div>
                <div className="text-xs " className="text-secondary">Presupuesto total</div>
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
            <div className=" border-2 border-dashed  rounded-lg p-12 text-center" className="border-default" className="bg-surface">
              <PartyPopper className="w-16 h-16  mx-auto mb-4" className="text-muted" />
              <h3 className="text-lg font-semibold  mb-2" className="text-body">
                No hay eventos relacionados
              </h3>
              <p className="text-sm  mb-4" className="text-secondary">
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
            <div className=" border  rounded-lg p-8 text-center" className="border-default" className="bg-surface">
              <p className="" className="text-secondary">No hay eventos de este tipo</p>
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
    </PageWrapper>
  );
}
