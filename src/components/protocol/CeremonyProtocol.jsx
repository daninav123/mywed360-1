import React, { useState } from 'react';
import { Clock, Users, MapPin, FileText, Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../ui/Button';
import { useTranslations } from '../../hooks/useTranslations';

/**
 * Gestor de Protocolo de Ceremonias
 * Define orden de eventos, participantes, ubicaciones
 */
const CeremonyProtocol = ({
  const { t } = useTranslations();
 weddingId, onSave }) => {
  const [protocol, setProtocol] = useState({
    ceremony: [],
    reception: [],
    party: []
  });

  const [expandedSection, setExpandedSection] = useState('ceremony');
  const [editingEvent, setEditingEvent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('ceremony');

  const [formData, setFormData] = useState({
    title: '',
    time: '',
    duration: 15,
    location: '',
    participants: '',
    description: '',
    notes: ''
  });

  // Templates de eventos comunes
  const eventTemplates = {
    ceremony: [
      { title: 'Entrada de Invitados', duration: 30, participants: 'Todos los invitados' },
      { title: 'Entrada de Padrinos', duration: 5, participants: 'Padrinos' },
      { title: 'Entrada de Novia', duration: 5, participants: 'Novia + Padre/Madre' },
      { title: 'Ceremonia Civil/Religiosa', duration: 30, participants: 'Novios + Oficiante' },
      { title: 'Intercambio de Votos', duration: 10, participants: 'Novios' },
      { title: 'Intercambio de Anillos', duration: 5, participants: 'Novios + Padrinos' },
      { title: t('common.declaracion_matrimonio'), duration: 5, participants: 'Oficiante + Novios' },
      { title: 'Salida de Novios', duration: 5, participants: 'Novios' },
      { title: t('common.sesion_fotos'), duration: 45, participants: t('common.novios_fotografo') }
    ],
    reception: [
      { title: t('common.coctel_bienvenida'), duration: 60, participants: 'Todos' },
      { title: t('common.entrada_salon'), duration: 15, participants: 'Todos' },
      { title: 'Entrada de Novios', duration: 5, participants: 'Novios' },
      { title: 'Primer Plato', duration: 30, participants: 'Todos' },
      { title: 'Segundo Plato', duration: 30, participants: 'Todos' },
      { title: 'Postre', duration: 20, participants: 'Todos' },
      { title: 'Discursos y Brindis', duration: 30, participants: 'Padrinos + Familia' }
    ],
    party: [
      { title: 'Primer Baile', duration: 5, participants: 'Novios' },
      { title: 'Baile con Padres', duration: 10, participants: 'Novios + Padres' },
      { title: 'Apertura de Pista', duration: 5, participants: 'Todos' },
      { title: 'Corte de Tarta', duration: 15, participants: 'Novios' },
      { title: 'Lanzamiento de Ramo', duration: 10, participants: 'Novia + Invitadas' },
      { title: 'Baile Libre', duration: 120, participants: 'Todos' },
      { title: 'Despedida de Novios', duration: 15, participants: 'Todos' }
    ]
  };

  const handleAddEvent = () => {
    if (!formData.title) {
      alert(t('common.titulo_obligatorio'));
      return;
    }

    const newEvent = {
      id: Date.now().toString(),
      ...formData,
      duration: parseInt(formData.duration) || 15,
      createdAt: new Date().toISOString()
    };

    setProtocol({
      ...protocol,
      [activeTab]: [...protocol[activeTab], newEvent]
    });

    resetForm();
  };

  const handleUpdateEvent = () => {
    if (!editingEvent) return;

    setProtocol({
      ...protocol,
      [activeTab]: protocol[activeTab].map(e =>
        e.id === editingEvent.id ? { ...e, ...formData, duration: parseInt(formData.duration) } : e
      )
    });

    resetForm();
  };

  const handleDeleteEvent = (id) => {
    if (confirm(t('common.eliminar_este_evento'))) {
      setProtocol({
        ...protocol,
        [activeTab]: protocol[activeTab].filter(e => e.id !== id)
      });
    }
  };

  const handleEditClick = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      time: event.time || '',
      duration: event.duration || 15,
      location: event.location || '',
      participants: event.participants || '',
      description: event.description || '',
      notes: event.notes || ''
    });
    setShowAddModal(true);
  };

  const handleUseTemplate = (template) => {
    setFormData({
      ...formData,
      title: template.title,
      duration: template.duration,
      participants: template.participants
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      time: '',
      duration: 15,
      location: '',
      participants: '',
      description: '',
      notes: ''
    });
    setEditingEvent(null);
    setShowAddModal(false);
  };

  const calculateTotalTime = (events) => {
    return events.reduce((sum, e) => sum + (e.duration || 0), 0);
  };

  const getSectionTitle = (section) => {
    switch (section) {
      case 'ceremony': return 'Ceremonia';
      case 'reception': return {t('common.recepcion')};
      case 'party': return 'Fiesta';
      default: return section;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Protocolo de Ceremonia
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Organiza el orden y timing de cada momento
          </p>
        </div>
        <Button
          onClick={() => onSave?.(protocol)}
          variant="primary"
        >
          Guardar Protocolo
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          {['ceremony', 'reception', 'party'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {getSectionTitle(tab)}
              {protocol[tab].length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs">
                  {protocol[tab].length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Eventos</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">
            {protocol[activeTab].length}
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Duración Total</span>
          </div>
          <p className="text-2xl font-bold text-green-700">
            {calculateTotalTime(protocol[activeTab])} min
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Participantes</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">
            {new Set(protocol[activeTab].map(e => e.participants).filter(Boolean)).size}
          </p>
        </div>
      </div>

      {/* Add Event Button */}
      <Button
        onClick={() => setShowAddModal(true)}
        className="flex items-center gap-2 w-full"
        variant="secondary"
      >
        <Plus className="w-4 h-4" />
        Añadir Evento
      </Button>

      {/* Events List */}
      {protocol[activeTab].length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No hay eventos en {getSectionTitle(activeTab).toLowerCase()}</p>
          <p className="text-sm text-gray-500">Añade eventos o usa una plantilla</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-200">
            {protocol[activeTab].map((event, index) => (
              <div key={event.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {event.time && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{event.time}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{event.duration} minutos</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.participants && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{event.participants}</span>
                        </div>
                      )}
                    </div>

                    {event.description && (
                      <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEditClick(event)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
            </h3>

            {/* Templates */}
            {!editingEvent && eventTemplates[activeTab]?.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plantillas Rápidas
                </label>
                <div className="flex flex-wrap gap-2">
                  {eventTemplates[activeTab].map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleUseTemplate(template)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      {template.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Ej: Entrada de Novios"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Estimada
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duración (minutos)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    min="1"
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
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder={t('common.salon_principal')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Participantes
                </label>
                <input
                  type="text"
                  value={formData.participants}
                  onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Ej: Novios + Padrinos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows="3"
                  placeholder="Detalles del evento..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas Internas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows="2"
                  placeholder="Notas para el staff..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={resetForm}>
                Cancelar
              </Button>
              <Button onClick={editingEvent ? handleUpdateEvent : handleAddEvent}>
                {editingEvent ? 'Actualizar' : t('common.anadir')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CeremonyProtocol;
