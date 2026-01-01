/**
 * PruebasEnsayos - Gestión de pruebas y ensayos pre-boda
 * FASE 2.6 del WORKFLOW-USUARIO.md
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, MapPin, FileText, Plus, Edit2, Trash2, Camera, CheckCircle2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useWedding } from '../context/WeddingContext';
import PageWrapper from '../components/PageWrapper';
import { toast } from 'react-toastify';
const getAppointmentTypes = (t) => [
  { id: 'dress', name: t('appointments.types.dress'), icon: '👗', color: 'pink' },
  { id: 'suit', name: t('appointments.types.suit'), icon: '🤵', color: 'blue' },
  { id: 'hair', name: t('appointments.types.hair'), icon: '💇', color: 'purple' },
  { id: 'makeup', name: t('appointments.types.makeup'), icon: '💄', color: 'rose' },
  { id: 'tasting', name: t('appointments.types.tasting'), icon: '🍽️', color: 'orange' },
  { id: 'cake', name: t('appointments.types.cake'), icon: '🎂', color: 'yellow' },
  { id: 'music', name: t('appointments.types.music'), icon: '🎵', color: 'green' },
  { id: 'rehearsal', name: t('appointments.types.rehearsal'), icon: '⛪', color: 'indigo' },
  { id: 'other', name: t('appointments.types.other'), icon: '📅', color: 'gray' },
];

const AppointmentCard = ({ appointment, onEdit, onDelete, onToggleComplete }) => {
  const { t } = useTranslation('pages');
  const APPOINTMENT_TYPES = getAppointmentTypes(t);
  const typeConfig = APPOINTMENT_TYPES.find(type => type.id === appointment.type) || APPOINTMENT_TYPES[7];
  
  const colorClasses = {
    pink: 'border-pink-200 bg-pink-50',
    blue: 'border-blue-200 bg-blue-50',
    orange: 'border-orange-200 bg-orange-50',
    purple: 'border-purple-200 bg-purple-50',
    indigo: 'border-indigo-200 bg-indigo-50',
    red: 'border-red-200 bg-red-50',
    green: 'border-green-200 bg-green-50',
    gray: 'border-gray-200 bg-gray-50',
  };

  const date = new Date(appointment.date);
  const isPast = date < new Date();

  return (
    <div className={`border rounded-lg p-4 transition-all ${
      appointment.completed ? 'opacity-60' : ''
    } ${colorClasses[typeConfig.color]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleComplete(appointment.id)}
            className={`flex-shrink-0 w-6 h-6 rounded border-2 transition-all ${
              appointment.completed
                ? 'bg-green-500 border-green-500'
                : 'border-gray-300 hover:border-green-500'
            }`}
          >
            {appointment.completed && <CheckCircle2 className="w-5 h-5 text-white" />}
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{typeConfig.icon}</span>
              <h3 className={`font-semibold text-gray-800 ${
                appointment.completed ? 'line-through' : ''
              }`}>
                {typeConfig.name}
              </h3>
            </div>
            {appointment.notes && (
              <p className="text-sm  mt-1" style={{ color: 'var(--color-text-secondary)' }}>{appointment.notes}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(appointment)}
            className="p-2  hover: hover: rounded transition-colors" style={{ color: 'var(--color-primary)' }} style={{ color: 'var(--color-text-secondary)' }} style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(appointment.id)}
            className="p-2  hover: hover: rounded transition-colors" style={{ color: 'var(--color-danger)' }} style={{ color: 'var(--color-text-secondary)' }} style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 " style={{ color: 'var(--color-text)' }}>
          <Calendar className="w-4 h-4" />
          <span>{date.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
          {isPast && !appointment.completed && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
              Pasada
            </span>
          )}
        </div>

        {appointment.time && (
          <div className="flex items-center gap-2 " style={{ color: 'var(--color-text)' }}>
            <Clock className="w-4 h-4" />
            <span>{appointment.time}</span>
          </div>
        )}

        {appointment.location && (
          <div className="flex items-center gap-2 " style={{ color: 'var(--color-text)' }}>
            <MapPin className="w-4 h-4" />
            <span>{appointment.location}</span>
          </div>
        )}

        {appointment.provider && (
          <div className="flex items-center gap-2 " style={{ color: 'var(--color-text)' }}>
            <FileText className="w-4 h-4" />
            <span>Proveedor: {appointment.provider}</span>
          </div>
        )}
      </div>

      {appointment.photos && appointment.photos.length > 0 && (
        <div className="mt-3 pt-3 border-t " style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2 text-sm " style={{ color: 'var(--color-text-secondary)' }}>
            <Camera className="w-4 h-4" />
            <span>{appointment.photos.length} foto{appointment.photos.length > 1 ? 's' : ''} de referencia</span>
          </div>
        </div>
      )}
    </div>
  );
};

const AppointmentModal = ({ appointment, onSave, onClose }) => {
  const [formData, setFormData] = useState(
    appointment || {
      type: 'vestido',
      date: '',
      time: '',
      location: '',
      provider: '',
      notes: '',
      completed: false,
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.date) {
      toast.error('La fecha es obligatoria');
      return;
    }
    onSave(formData);
  };

  const selectedType = APPOINTMENT_TYPES.find(t => t.id === formData.type) || APPOINTMENT_TYPES[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className=" rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold " style={{ color: 'var(--color-text)' }}>
              {appointment ? 'Editar cita' : 'Nueva cita'}
            </h2>
            <button
              onClick={onClose}
              className=" hover:" style={{ color: 'var(--color-muted)' }} style={{ color: 'var(--color-text-secondary)' }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                Tipo de cita
              </label>
              <div className="grid grid-cols-2 gap-2">
                {APPOINTMENT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.id })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.type === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <span className="text-2xl mb-1 block">{type.icon}</span>
                    <span className="text-xs " style={{ color: 'var(--color-text)' }}>{type.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                Fecha *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border  rounded-lg px-3 py-2" style={{ borderColor: 'var(--color-border)' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                Hora
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full border  rounded-lg px-3 py-2" style={{ borderColor: 'var(--color-border)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                Ubicación
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={t('Dirección del lugar')}
                className="w-full border  rounded-lg px-3 py-2" style={{ borderColor: 'var(--color-border)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('Notas o recordatorios...')}
                rows={3}
                className="w-full border  rounded-lg px-3 py-2" style={{ borderColor: 'var(--color-border)' }}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border  rounded-lg hover: transition-colors" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-bg)' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2  text-white rounded-lg hover:bg-blue-700 transition-colors" style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {appointment ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function PruebasEnsayos() {
  const { activeWedding } = useWedding();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);

  useEffect(() => {
    if (!activeWedding) {
      setLoading(false);
      return;
    }

    const loadAppointments = async () => {
      try {
        const docRef = doc(db, 'weddings', activeWedding, 'planning', 'appointments');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setAppointments(docSnap.data().items || []);
        }
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [activeWedding]);

  const saveAppointments = useCallback(async (newAppointments) => {
    if (!activeWedding) return;

    try {
      const docRef = doc(db, 'weddings', activeWedding, 'planning', 'appointments');
      await setDoc(docRef, {
        items: newAppointments,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving appointments:', error);
      toast.error('Error al guardar');
    }
  }, [activeWedding]);

  const handleSave = useCallback((formData) => {
    let newAppointments;
    
    if (editingAppointment) {
      newAppointments = appointments.map(apt => 
        apt.id === editingAppointment.id ? { ...formData, id: apt.id } : apt
      );
      toast.success('Cita actualizada');
    } else {
      const newAppointment = {
        ...formData,
        id: `apt-${Date.now()}`,
      };
      newAppointments = [...appointments, newAppointment];
      toast.success('Cita creada');
    }

    setAppointments(newAppointments);
    saveAppointments(newAppointments);
    setShowModal(false);
    setEditingAppointment(null);
  }, [appointments, editingAppointment, saveAppointments]);

  const handleEdit = useCallback((appointment) => {
    setEditingAppointment(appointment);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback((id) => {
    if (!confirm('¿Eliminar esta cita?')) return;
    
    const newAppointments = appointments.filter(apt => apt.id !== id);
    setAppointments(newAppointments);
    saveAppointments(newAppointments);
    toast.success('Cita eliminada');
  }, [appointments, saveAppointments]);

  const handleToggleComplete = useCallback((id) => {
    const newAppointments = appointments.map(apt => 
      apt.id === id ? { ...apt, completed: !apt.completed } : apt
    );
    setAppointments(newAppointments);
    saveAppointments(newAppointments);
  }, [appointments, saveAppointments]);

  const upcomingAppointments = appointments
    .filter(apt => !apt.completed && new Date(apt.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const pastAppointments = appointments
    .filter(apt => apt.completed || new Date(apt.date) < new Date())
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const stats = {
    total: appointments.length,
    completed: appointments.filter(apt => apt.completed).length,
    upcoming: upcomingAppointments.length,
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2  mx-auto mb-4" style={{ borderColor: 'var(--color-primary)' }}></div>
            <p className="" style={{ color: 'var(--color-text-secondary)' }}>Cargando citas...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold  mb-1" style={{ color: 'var(--color-text)' }}>Pruebas y Ensayos</h1>
                <p className="text-sm " style={{ color: 'var(--color-text-secondary)' }}>
                  Organiza todas tus citas pre-boda
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingAppointment(null);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2  text-white rounded-lg hover:bg-blue-700 transition-colors" style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <Plus className="w-5 h-5" />
                Nueva cita
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className=" rounded-lg p-3 border " style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
                <div className="text-2xl font-bold " style={{ color: 'var(--color-text)' }}>{stats.total}</div>
                <div className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>Total citas</div>
              </div>
              <div className=" rounded-lg p-3 border border-orange-200" style={{ backgroundColor: 'var(--color-surface)' }}>
                <div className="text-2xl font-bold text-orange-600">{stats.upcoming}</div>
                <div className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>Próximas</div>
              </div>
              <div className=" rounded-lg p-3 border border-green-200" style={{ backgroundColor: 'var(--color-surface)' }}>
                <div className="text-2xl font-bold " style={{ color: 'var(--color-success)' }}>{stats.completed}</div>
                <div className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>Completadas</div>
              </div>
            </div>
          </div>

          {/* Upcoming Appointments */}
          {upcomingAppointments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold  mb-3" style={{ color: 'var(--color-text)' }}>
                Próximas citas ({upcomingAppointments.length})
              </h2>
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleComplete={handleToggleComplete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past/Completed Appointments */}
          {pastAppointments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold  mb-3" style={{ color: 'var(--color-text)' }}>
                Completadas/Pasadas ({pastAppointments.length})
              </h2>
              <div className="space-y-3">
                {pastAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleComplete={handleToggleComplete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {appointments.length === 0 && (
            <div className=" border border-dashed  rounded-lg p-12 text-center" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
              <Calendar className="w-16 h-16  mx-auto mb-4" style={{ color: 'var(--color-muted)' }} />
              <h3 className="text-lg font-semibold  mb-2" style={{ color: 'var(--color-text)' }}>
                No tienes citas programadas
              </h3>
              <p className="text-sm  mb-4" style={{ color: 'var(--color-muted)' }}>
                Comienza añadiendo tus pruebas de vestido, menú, maquillaje y más
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2  text-white rounded-lg hover:bg-blue-700 transition-colors" style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <Plus className="w-5 h-5" />
                Crear primera cita
              </button>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <AppointmentModal
            appointment={editingAppointment}
            onSave={handleSave}
            onClose={() => {
              setShowModal(false);
              setEditingAppointment(null);
            }}
          />
        )}
      </div>
    </PageWrapper>
  );
}
