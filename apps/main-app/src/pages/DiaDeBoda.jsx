/**
 * DiaDeBoda - Gestión del día de la boda
 * FASE 7.1 del WORKFLOW-USUARIO.md
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Phone, CheckCircle2, Edit2, Plus, Trash2, AlertCircle } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useWedding } from '../context/WeddingContext';
import PageWrapper from '../components/PageWrapper';
import { toast } from 'react-toastify';
import { 
  MOMENTOS_DIA, 
  CHECKLIST_DEFAULT, 
  CONTACTOS_EMERGENCIA_DEFAULT,
  TIMELINE_DEFAULT 
} from '../data/diaBodaData';

const ChecklistItem = ({ item, momento, onToggle, onEdit, onDelete }) => {
  return (
    <div 
      className="flex items-start gap-3 p-3 rounded-lg transition-all"
      style={{ 
        backgroundColor: item.completado ? 'var(--color-success-10)' : 'var(--color-surface)'
      }}
      onMouseEnter={(e) => !item.completado && (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
      onMouseLeave={(e) => !item.completado && (e.currentTarget.style.backgroundColor = 'var(--color-surface)')}
    >
      <button
        onClick={() => onToggle(momento, item.id)}
        className="flex-shrink-0 w-5 h-5 rounded border-2 mt-0.5 transition-all"
        style={{
          backgroundColor: item.completado ? 'var(--color-success)' : 'transparent',
          borderColor: item.completado ? 'var(--color-success)' : 'var(--color-border)'
        }}
        onMouseEnter={(e) => !item.completado && (e.currentTarget.style.borderColor = 'var(--color-success)')}
        onMouseLeave={(e) => !item.completado && (e.currentTarget.style.borderColor = 'var(--color-border)')}
      >
        {item.completado && <CheckCircle2 className="w-4 h-4 text-white" />}
      </button>
      
      <div className="flex-1">
        <span className={`text-sm ${item.completado ? 'line-through' : ''}`} style={{ color: item.completado ? 'var(--color-muted)' : 'var(--color-text)' }}>
          {item.importante && <span className="mr-1" style={{ color: 'var(--color-danger)' }}>*</span>}
          {item.texto}
        </span>
        {item.nota && (
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{item.nota}</p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(momento, item)}
          className="p-1 rounded transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.backgroundColor = 'var(--color-primary-10)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          onClick={() => onDelete(momento, item.id)}
          className="p-1 rounded transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-danger)'; e.currentTarget.style.backgroundColor = 'var(--color-danger-10)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

const TimelineItem = ({ item, onEdit, onDelete }) => {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg transition-shadow" style={{ backgroundColor: 'var(--color-surface)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-sm)' }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-md)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}>
      <div className="flex-shrink-0 text-center">
        <div className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>{item.hora}</div>
        <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{item.duracion}min</div>
      </div>
      
      <div className="flex-1">
        <h4 className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{item.actividad}</h4>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>👤 {item.responsable}</p>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(item)}
          className="p-2  hover: hover:bg-blue-50 rounded transition-colors" style={{ color: 'var(--color-primary)' }} style={{ color: 'var(--color-text-secondary)' }}
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-2  hover: hover:bg-red-50 rounded transition-colors" style={{ color: 'var(--color-danger)' }} style={{ color: 'var(--color-text-secondary)' }}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ContactoCard = ({ contacto, onEdit, onDelete }) => {
  return (
    <div className="border-2 rounded-lg p-4" style={{ borderColor: contacto.importante ? '#F97316' : 'var(--color-border)', backgroundColor: contacto.importante ? 'rgba(249, 115, 22, 0.1)' : 'var(--color-surface)' }}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold" style={{ color: 'var(--color-text)' }}>
            {contacto.nombre}
            {contacto.importante && <span className="ml-2 text-xs" style={{ color: '#F97316' }}>⭐ Prioritario</span>}
          </h4>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{contacto.rol}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(contacto)}
            className="p-2  hover: hover:bg-blue-50 rounded transition-colors" style={{ color: 'var(--color-primary)' }} style={{ color: 'var(--color-text-secondary)' }}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(contacto.id)}
            className="p-2  hover: hover:bg-red-50 rounded transition-colors" style={{ color: 'var(--color-danger)' }} style={{ color: 'var(--color-text-secondary)' }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {contacto.telefono && (
        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
          <a href={`tel:${contacto.telefono}`} className="hover:underline" style={{ color: 'var(--color-primary)' }}>
            {contacto.telefono}
          </a>
        </div>
      )}
      
      {!contacto.telefono && (
        <p className="text-xs  italic" style={{ color: 'var(--color-muted)' }}>{t('weddingDay.noPhoneRegistered')}</p>
      )}
    </div>
  );
};

const ChecklistModal = ({ momento, item, onSave, onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(
    item || {
      texto: '',
      importante: false,
      nota: ''
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.texto) {
      toast.error(t('weddingDay.textRequired'));
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className=" rounded-lg max-w-md w-full" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold " style={{ color: 'var(--color-text)' }}>
              {item ? t('weddingDay.editTask') : t('weddingDay.newTask')}
            </h2>
            <button onClick={onClose} className=" hover:" style={{ color: 'var(--color-muted)' }} style={{ color: 'var(--color-text-secondary)' }}>✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                {t('weddingDay.task')} *
              </label>
              <input
                type="text"
                value={formData.texto}
                onChange={(e) => setFormData({ ...formData, texto: e.target.value })}
                placeholder={t('weddingDay.taskDescriptionPlaceholder')}
                className="w-full border  rounded-lg px-3 py-2" style={{ borderColor: 'var(--color-border)' }}
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.importante}
                  onChange={(e) => setFormData({ ...formData, importante: e.target.checked })}
                  className="w-4 h-4  rounded" style={{ color: 'var(--color-primary)' }}
                />
                <span className="text-sm " style={{ color: 'var(--color-text)' }}>{t('weddingDay.markAsImportant')}</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                {t('weddingDay.additionalNote')}
              </label>
              <textarea
                value={formData.nota}
                onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                placeholder={t('weddingDay.momentNamePlaceholder')}
                rows={2}
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
                {item ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const TimelineModal = ({ item, onSave, onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(
    item || {
      hora: '',
      actividad: '',
      responsable: '',
      duracion: 30
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.hora || !formData.actividad) {
      toast.error(t('weddingDay.timeAndActivityRequired'));
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className=" rounded-lg max-w-md w-full" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold " style={{ color: 'var(--color-text)' }}>
              {item ? t('weddingDay.editActivity') : t('weddingDay.newActivity')}
            </h2>
            <button onClick={onClose} className=" hover:" style={{ color: 'var(--color-muted)' }} style={{ color: 'var(--color-text-secondary)' }}>✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                  {t('weddingDay.time')} *
                </label>
                <input
                  type="time"
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  className="w-full border  rounded-lg px-3 py-2" style={{ borderColor: 'var(--color-border)' }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                  {t('weddingDay.duration')}
                </label>
                <input
                  type="number"
                  value={formData.duracion}
                  onChange={(e) => setFormData({ ...formData, duracion: parseInt(e.target.value) })}
                  min="5"
                  step="5"
                  className="w-full border  rounded-lg px-3 py-2" style={{ borderColor: 'var(--color-border)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                {t('weddingDay.activity')} *
              </label>
              <input
                type="text"
                value={formData.actividad}
                onChange={(e) => setFormData({ ...formData, actividad: e.target.value })}
                placeholder={t('weddingDay.taskDescriptionPlaceholder')}
                className="w-full border  rounded-lg px-3 py-2" style={{ borderColor: 'var(--color-border)' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                {t('weddingDay.responsible')}
              </label>
              <input
                type="text"
                value={formData.responsable}
                onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                placeholder={t('weddingDay.taskDescriptionPlaceholder')}
                className="w-full border  rounded-lg px-3 py-2" style={{ borderColor: 'var(--color-border)' }}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border  rounded-lg hover: transition-colors" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-bg)' }}
              >
                {t('weddingDay.cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2  text-white rounded-lg hover:bg-blue-700 transition-colors" style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {item ? t('weddingDay.save') : t('weddingDay.create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ContactoModal = ({ contacto, onSave, onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(
    contacto || {
      nombre: '',
      rol: '',
      telefono: '',
      importante: false
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre) {
      toast.error(t('weddingDay.textRequired'));
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className=" rounded-lg max-w-md w-full" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold " style={{ color: 'var(--color-text)' }}>
              {contacto ? t('weddingDay.editContact') : t('weddingDay.newContact')}
            </h2>
            <button onClick={onClose} className=" hover:" style={{ color: 'var(--color-muted)' }} style={{ color: 'var(--color-text-secondary)' }}>✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                {t('weddingDay.name')} *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder={t('weddingDay.taskDescriptionPlaceholder')}
                className="w-full border  rounded-lg px-3 py-2" style={{ borderColor: 'var(--color-border)' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                Rol
              </label>
              <input
                type="text"
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                placeholder={t('weddingDay.rolePlaceholder')}
                className="w-full border  rounded-lg px-3 py-2" style={{ borderColor: 'var(--color-border)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder={t('common.phonePlaceholder')}
                className="w-full border  rounded-lg px-3 py-2" style={{ borderColor: 'var(--color-border)' }}
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.importante}
                  onChange={(e) => setFormData({ ...formData, importante: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded"
                />
                <span className="text-sm " style={{ color: 'var(--color-text)' }}>Marcar como prioritario</span>
              </label>
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
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                {contacto ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function DiaDeBoda() {
  const { activeWedding } = useWedding();
  const [checklist, setChecklist] = useState({});
  const [timeline, setTimeline] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('checklist');
  const [activeView, setActiveView] = useState('checklist');
  const [activeMomento, setActiveMomento] = useState('manana');
  
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showContactoModal, setShowContactoModal] = useState(false);
  
  const [editingChecklistItem, setEditingChecklistItem] = useState(null);
  const [editingTimelineItem, setEditingTimelineItem] = useState(null);
  const [editingContacto, setEditingContacto] = useState(null);

  useEffect(() => {
    if (!activeWedding) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const docRef = doc(db, 'weddings', activeWedding, 'wedding-day', 'planning');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setChecklist(data.checklist || {});
          setTimeline(data.timeline || []);
          setContactos(data.contactos || []);
        } else {
          const defaultChecklist = {};
          Object.keys(CHECKLIST_DEFAULT).forEach(momento => {
            defaultChecklist[momento] = CHECKLIST_DEFAULT[momento].map((item, idx) => ({
              id: `${momento}-${idx}`,
              ...item,
              completado: false
            }));
          });
          
          const defaultTimeline = TIMELINE_DEFAULT.map((item, idx) => ({
            id: `timeline-${idx}`,
            ...item
          }));
          
          const defaultContactos = CONTACTOS_EMERGENCIA_DEFAULT.map((item, idx) => ({
            id: `contacto-${idx}`,
            ...item
          }));
          
          setChecklist(defaultChecklist);
          setTimeline(defaultTimeline);
          setContactos(defaultContactos);
          
          await saveData(defaultChecklist, defaultTimeline, defaultContactos);
        }
      } catch (error) {
        console.error('Error loading wedding day data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeWedding]);

  const saveData = useCallback(async (newChecklist, newTimeline, newContactos) => {
    if (!activeWedding) return;

    try {
      const docRef = doc(db, 'weddings', activeWedding, 'wedding-day', 'planning');
      await setDoc(docRef, {
        checklist: newChecklist,
        timeline: newTimeline,
        contactos: newContactos,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving wedding day data:', error);
      toast.error('Error al guardar');
    }
  }, [activeWedding]);

  const handleToggleChecklistItem = useCallback((momento, itemId) => {
    const newChecklist = {
      ...checklist,
      [momento]: checklist[momento].map(item =>
        item.id === itemId ? { ...item, completado: !item.completado } : item
      )
    };
    setChecklist(newChecklist);
    saveData(newChecklist, timeline, contactos);
  }, [checklist, timeline, contactos, saveData]);

  const handleSaveChecklistItem = useCallback((formData) => {
    let newChecklist = { ...checklist };
    
    if (editingChecklistItem) {
      newChecklist[activeMomento] = newChecklist[activeMomento].map(item =>
        item.id === editingChecklistItem.id ? { ...item, ...formData } : item
      );
      toast.success('Tarea actualizada');
    } else {
      const newItem = {
        id: `${activeMomento}-${Date.now()}`,
        ...formData,
        completado: false
      };
      newChecklist[activeMomento] = [...(newChecklist[activeMomento] || []), newItem];
      toast.success('Tarea añadida');
    }
    
    setChecklist(newChecklist);
    saveData(newChecklist, timeline, contactos);
    setShowChecklistModal(false);
    setEditingChecklistItem(null);
  }, [checklist, timeline, contactos, activeMomento, editingChecklistItem, saveData]);

  const handleDeleteChecklistItem = useCallback((momento, itemId) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    
    const newChecklist = {
      ...checklist,
      [momento]: checklist[momento].filter(item => item.id !== itemId)
    };
    setChecklist(newChecklist);
    saveData(newChecklist, timeline, contactos);
    toast.success('Tarea eliminada');
  }, [checklist, timeline, contactos, saveData]);

  const handleSaveTimelineItem = useCallback((formData) => {
    let newTimeline;
    
    if (editingTimelineItem) {
      newTimeline = timeline.map(item =>
        item.id === editingTimelineItem.id ? { ...item, ...formData } : item
      );
      toast.success('Evento actualizado');
    } else {
      const newItem = {
        id: `timeline-${Date.now()}`,
        ...formData
      };
      newTimeline = [...timeline, newItem].sort((a, b) => a.hora.localeCompare(b.hora));
      toast.success('Evento añadido');
    }
    
    setTimeline(newTimeline);
    saveData(checklist, newTimeline, contactos);
    setShowTimelineModal(false);
    setEditingTimelineItem(null);
  }, [timeline, checklist, contactos, editingTimelineItem, saveData]);

  const handleDeleteTimelineItem = useCallback((itemId) => {
    if (!confirm('¿Eliminar este evento?')) return;
    
    const newTimeline = timeline.filter(item => item.id !== itemId);
    setTimeline(newTimeline);
    saveData(checklist, newTimeline, contactos);
    toast.success('Evento eliminado');
  }, [timeline, checklist, contactos, saveData]);

  const handleSaveContacto = useCallback((formData) => {
    let newContactos;
    
    if (editingContacto) {
      newContactos = contactos.map(c =>
        c.id === editingContacto.id ? { ...c, ...formData } : c
      );
      toast.success('Contacto actualizado');
    } else {
      const newContacto = {
        id: `contacto-${Date.now()}`,
        ...formData
      };
      newContactos = [...contactos, newContacto];
      toast.success('Contacto añadido');
    }
    
    setContactos(newContactos);
    saveData(checklist, timeline, newContactos);
    setShowContactoModal(false);
    setEditingContacto(null);
  }, [contactos, checklist, timeline, editingContacto, saveData]);

  const handleDeleteContacto = useCallback((id) => {
    if (!confirm('¿Eliminar este contacto?')) return;
    
    const newContactos = contactos.filter(c => c.id !== id);
    setContactos(newContactos);
    saveData(checklist, timeline, newContactos);
    toast.success('Contacto eliminado');
  }, [contactos, checklist, timeline, saveData]);

  const stats = useMemo(() => {
    const totalTareas = Object.values(checklist).flat().length;
    const completadas = Object.values(checklist).flat().filter(t => t.completado).length;
    const contactosImportantes = contactos.filter(c => c.importante).length;
    const porcentaje = totalTareas > 0 ? Math.round((completadas / totalTareas) * 100) : 0;
    
    return {
      totalTareas,
      completadas,
      timeline: timeline.length,
      contactos: contactos.length,
      contactosImportantes,
      porcentaje
    };
  }, [checklist, timeline, contactos]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
            <p className="" style={{ color: 'var(--color-text-secondary)' }}>Cargando día de la boda...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3  rounded-lg shadow-sm" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <Calendar className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold " style={{ color: 'var(--color-text)' }}>Día de la Boda</h1>
                  <p className="text-sm " style={{ color: 'var(--color-text-secondary)' }}>
                    Checklist, timeline y contactos de emergencia
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className=" rounded-lg p-3 border " style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
                <div className="text-2xl font-bold " style={{ color: 'var(--color-text)' }}>{stats.totalTareas}</div>
                <div className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>Tareas totales</div>
              </div>
              <div className=" rounded-lg p-3 border " style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
                <div className="text-2xl font-bold " style={{ color: 'var(--color-success)' }}>{stats.completadas}</div>
                <div className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>Completadas</div>
              </div>
              <div className=" rounded-lg p-3 border " style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
                <div className="text-2xl font-bold " style={{ color: 'var(--color-primary)' }}>{stats.timeline}</div>
                <div className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>Eventos timeline</div>
              </div>
              <div className=" rounded-lg p-3 border " style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
                <div className="text-2xl font-bold text-orange-600">{stats.contactos}</div>
                <div className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>Contactos</div>
              </div>
              <div className=" rounded-lg p-3 border " style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
                <div className="text-2xl font-bold text-purple-600">{stats.porcentaje}%</div>
                <div className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>Progreso</div>
              </div>
            </div>

            {stats.totalTareas > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className=" font-medium" style={{ color: 'var(--color-text)' }}>Progreso general</span>
                  <span className="" style={{ color: 'var(--color-text-secondary)' }}>{stats.completadas}/{stats.totalTareas}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-pink-600 to-purple-600 h-3 rounded-full transition-all"
                    style={{ width: `${stats.porcentaje}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Main Tabs */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setActiveView('checklist')}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeView === 'checklist'
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 bg-white hover:border-pink-300'
              }`}
            >
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-pink-600" />
              <div className="font-semibold " style={{ color: 'var(--color-text)' }}>Checklist</div>
              <div className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>{stats.completadas}/{stats.totalTareas}</div>
            </button>

            <button
              onClick={() => setActiveView('timeline')}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeView === 'timeline'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <Clock className="w-6 h-6 mx-auto mb-2 " style={{ color: 'var(--color-primary)' }} />
              <div className="font-semibold " style={{ color: 'var(--color-text)' }}>Timeline</div>
              <div className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>{stats.timeline} eventos</div>
            </button>

            <button
              onClick={() => setActiveView('contactos')}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeView === 'contactos'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-orange-300'
              }`}
            >
              <Phone className="w-6 h-6 mx-auto mb-2 text-orange-600" />
              <div className="font-semibold " style={{ color: 'var(--color-text)' }}>Contactos</div>
              <div className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>{stats.contactosImportantes} prioritarios</div>
            </button>
          </div>

          {/* Checklist View */}
          {activeView === 'checklist' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold " style={{ color: 'var(--color-text)' }}>Checklist del Día</h2>
                <button
                  onClick={() => {
                    setEditingChecklistItem(null);
                    setShowChecklistModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Añadir tarea
                </button>
              </div>

              {/* Momento Tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                {MOMENTOS_DIA.map((momento) => {
                  const tareas = checklist[momento.id] || [];
                  const completadas = tareas.filter(t => t.completado).length;
                  
                  return (
                    <button
                      key={momento.id}
                      onClick={() => setActiveMomento(momento.id)}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        activeMomento === momento.id
                          ? 'bg-pink-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="mr-2">{momento.icon}</span>
                      {momento.nombre}
                      <span className="ml-2 text-xs">({completadas}/{tareas.length})</span>
                    </button>
                  );
                })}
              </div>

              {/* Checklist Items */}
              <div className=" border  rounded-lg p-4" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
                {(!checklist[activeMomento] || checklist[activeMomento].length === 0) ? (
                  <div className="text-center py-8">
                    <p className="" style={{ color: 'var(--color-text-secondary)' }}>No hay tareas para este momento</p>
                    <button
                      onClick={() => setShowChecklistModal(true)}
                      className="mt-4 text-pink-600 hover:text-pink-700"
                    >
                      Añadir primera tarea
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {checklist[activeMomento].map((item) => (
                      <ChecklistItem
                        key={item.id}
                        item={item}
                        momento={activeMomento}
                        onToggle={handleToggleChecklistItem}
                        onEdit={(momento, item) => {
                          setEditingChecklistItem(item);
                          setShowChecklistModal(true);
                        }}
                        onDelete={handleDeleteChecklistItem}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline View */}
          {activeView === 'timeline' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold " style={{ color: 'var(--color-text)' }}>Timeline del Día</h2>
                <button
                  onClick={() => {
                    setEditingTimelineItem(null);
                    setShowTimelineModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2  text-white rounded-lg hover:bg-blue-700 transition-colors" style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Plus className="w-5 h-5" />
                  Añadir evento
                </button>
              </div>

              {timeline.length === 0 ? (
                <div className=" border-2 border-dashed  rounded-lg p-12 text-center" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
                  <Clock className="w-16 h-16  mx-auto mb-4" style={{ color: 'var(--color-muted)' }} />
                  <p className=" mb-4" style={{ color: 'var(--color-text-secondary)' }}>No hay eventos en el timeline</p>
                  <button
                    onClick={() => setShowTimelineModal(true)}
                    className=" hover:text-blue-700" style={{ color: 'var(--color-primary)' }}
                  >
                    Añadir primer evento
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {timeline.map((item) => (
                    <TimelineItem
                      key={item.id}
                      item={item}
                      onEdit={(item) => {
                        setEditingTimelineItem(item);
                        setShowTimelineModal(true);
                      }}
                      onDelete={handleDeleteTimelineItem}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contactos View */}
          {activeView === 'contactos' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold " style={{ color: 'var(--color-text)' }}>Contactos de Emergencia</h2>
                <button
                  onClick={() => {
                    setEditingContacto(null);
                    setShowContactoModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Añadir contacto
                </button>
              </div>

              {contactos.filter(c => !c.telefono).length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <strong>{contactos.filter(c => !c.telefono).length} contactos</strong> sin teléfono registrado. 
                      Completa la información para tenerla disponible el día de la boda.
                    </div>
                  </div>
                </div>
              )}

              {contactos.length === 0 ? (
                <div className=" border-2 border-dashed  rounded-lg p-12 text-center" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
                  <Phone className="w-16 h-16  mx-auto mb-4" style={{ color: 'var(--color-muted)' }} />
                  <p className=" mb-4" style={{ color: 'var(--color-text-secondary)' }}>No hay contactos registrados</p>
                  <button
                    onClick={() => setShowContactoModal(true)}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    Añadir primer contacto
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contactos.map((contacto) => (
                    <ContactoCard
                      key={contacto.id}
                      contacto={contacto}
                      onEdit={(c) => {
                        setEditingContacto(c);
                        setShowContactoModal(true);
                      }}
                      onDelete={handleDeleteContacto}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        {showChecklistModal && (
          <ChecklistModal
            momento={activeMomento}
            item={editingChecklistItem}
            onSave={handleSaveChecklistItem}
            onClose={() => {
              setShowChecklistModal(false);
              setEditingChecklistItem(null);
            }}
          />
        )}

        {showTimelineModal && (
          <TimelineModal
            item={editingTimelineItem}
            onSave={handleSaveTimelineItem}
            onClose={() => {
              setShowTimelineModal(false);
              setEditingTimelineItem(null);
            }}
          />
        )}

        {showContactoModal && (
          <ContactoModal
            contacto={editingContacto}
            onSave={handleSaveContacto}
            onClose={() => {
              setShowContactoModal(false);
              setEditingContacto(null);
            }}
          />
        )}
      </div>
    </PageWrapper>
  );
}
