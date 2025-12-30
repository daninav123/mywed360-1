/**
 * GestionNinos - Gestión de niños en el evento
 * FASE 6.4 del WORKFLOW-USUARIO.md
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Baby, Users, Utensils, Gamepad2, Clock, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useWedding } from '../context/WeddingContext';
import PageWrapper from '../components/PageWrapper';
import { toast } from 'react-toastify';

const getActivityTypes = (t) => [
  { id: 'juegos', name: t('children.types.games'), icon: '🎲', ageRange: '3-12' },
  { id: 'manualidades', name: t('children.types.crafts'), icon: '🎨', ageRange: '4-12' },
  { id: 'pintacaras', name: t('children.types.facepainting'), icon: '🎭', ageRange: '3-10' },
  { id: 'globoflexia', name: t('children.types.balloons'), icon: '🎈', ageRange: '2-10' },
  { id: 'cuentacuentos', name: t('children.types.storytelling'), icon: '📚', ageRange: '3-8' },
  { id: 'disfraces', name: t('children.types.costumes'), icon: '👗', ageRange: '3-10' },
  { id: 'videojuegos', name: t('children.types.videogames'), icon: '🎮', ageRange: '6-14' },
  { id: 'castillo', name: t('children.types.castle'), icon: '🏰', ageRange: '2-10' },
  { id: 'magia', name: t('children.types.magic'), icon: '🪄', ageRange: '4-12' },
  { id: 'animacion', name: t('children.types.animation'), icon: '🤹', ageRange: '2-12' },
];

const getMenuOptions = (t) => [
  { id: 'nuggets', name: t('children.menuOptions.nuggets'), icon: '🍗' },
  { id: 'pasta', name: t('children.menuOptions.pasta'), icon: '🍝' },
  { id: 'pizza', name: t('children.menuOptions.pizza'), icon: '🍕' },
  { id: 'hamburguesa', name: t('children.menuOptions.burger'), icon: '🍔' },
  { id: 'ensalada', name: t('children.menuOptions.salad'), icon: '🥗' },
  { id: 'fruta', name: t('children.menuOptions.fruit'), icon: '🍓' },
  { id: 'verduras', name: t('children.menuOptions.vegetables'), icon: '🥕' },
  { id: 'helado', name: t('children.menuOptions.icecream'), icon: '🍦' },
  { id: 'zumo', name: t('children.menuOptions.juice'), icon: '🧃' },
  { id: 'agua', name: t('children.menuOptions.water'), icon: '💧' },
];

const ActivityCard = ({ activity, onEdit, onDelete, onToggle }) => {
  const typeConfig = ACTIVITY_TYPES.find(t => t.id === activity.type) || ACTIVITY_TYPES[0];
  
  return (
    <div className={`border rounded-lg p-4 transition-all ${
      activity.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300 hover:shadow-md'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggle(activity.id)}
            className={`flex-shrink-0 w-6 h-6 rounded border-2 transition-all ${
              activity.completed
                ? 'bg-green-500 border-green-500'
                : 'border-gray-300 hover:border-green-500'
            }`}
          >
            {activity.completed && <CheckCircle2 className="w-5 h-5 text-white" />}
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{typeConfig.icon}</span>
              <h3 className={`font-semibold text-gray-800 ${
                activity.completed ? 'line-through' : ''
              }`}>
                {typeConfig.name}
              </h3>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Edades: {activity.ageRange || typeConfig.ageRange}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(activity)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(activity.id)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activity.time && (
        <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
          <Clock className="w-4 h-4" />
          <span>{activity.time}</span>
        </div>
      )}

      {activity.provider && (
        <div className="text-sm text-gray-700 mb-2">
          Proveedor: {activity.provider}
        </div>
      )}

      {activity.notes && (
        <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
          {activity.notes}
        </div>
      )}
    </div>
  );
};

const CaregiverCard = ({ caregiver, onEdit, onDelete }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{caregiver.name}</h3>
            {caregiver.role && (
              <p className="text-sm text-gray-600">{caregiver.role}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(caregiver)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(caregiver.id)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {caregiver.contact && (
        <div className="text-sm text-gray-700 mb-2">
          📞 {caregiver.contact}
        </div>
      )}

      {caregiver.hours && (
        <div className="text-sm text-gray-700 mb-2">
          ⏰ Horario: {caregiver.hours}
        </div>
      )}

      {caregiver.notes && (
        <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
          {caregiver.notes}
        </div>
      )}
    </div>
  );
};

const ActivityModal = ({ activity, onSave, onClose }) => {
  const [formData, setFormData] = useState(
    activity || {
      type: 'juegos',
      time: '',
      ageRange: '',
      provider: '',
      notes: '',
      completed: false,
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const selectedType = ACTIVITY_TYPES.find(t => t.id === formData.type) || ACTIVITY_TYPES[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {activity ? 'Editar actividad' : 'Nueva actividad'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de actividad
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ACTIVITY_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      type: type.id,
                      ageRange: formData.ageRange || type.ageRange 
                    })}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      formData.type === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <span className="text-2xl mb-1 block">{type.icon}</span>
                    <span className="text-xs text-gray-700">{type.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('children.schedule')}
              </label>
              <input
                type="text"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                placeholder={t('children.searchPlaceholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('children.ageRange')}
              </label>
              <input
                type="text"
                value={formData.ageRange}
                onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                placeholder={selectedType.ageRange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('children.provider')}
              </label>
              <input
                type="text"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder={t('children.namePlaceholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('children.notesPlaceholder')}
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
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {activity ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const CaregiverModal = ({ caregiver, onSave, onClose }) => {
  const [formData, setFormData] = useState(
    caregiver || {
      name: '',
      role: '',
      contact: '',
      hours: '',
      notes: '',
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('El nombre es obligatorio');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {caregiver ? 'Editar cuidador' : 'Nuevo cuidador'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('children.notesPlaceholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Ej: Canguro, Animador infantil"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contacto
              </label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder={t('childrenManagement.contactPlaceholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horario
              </label>
              <input
                type="text"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                placeholder="Ej: 17:00 - 23:00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('childrenManagement.needsPlaceholder')}
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
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {caregiver ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function GestionNinos() {
  const { activeWedding } = useWedding();
  const [activities, setActivities] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showCaregiverModal, setShowCaregiverModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [editingCaregiver, setEditingCaregiver] = useState(null);
  const [activeTab, setActiveTab] = useState('activities');

  useEffect(() => {
    if (!activeWedding) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const docRef = doc(db, 'weddings', activeWedding, 'kids', 'management');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setActivities(data.activities || []);
          setCaregivers(data.caregivers || []);
          setMenu(data.menu || []);
        }
      } catch (error) {
        console.error('Error loading kids data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeWedding]);

  const saveData = useCallback(async (newActivities, newCaregivers, newMenu) => {
    if (!activeWedding) return;

    try {
      const docRef = doc(db, 'weddings', activeWedding, 'kids', 'management');
      await setDoc(docRef, {
        activities: newActivities,
        caregivers: newCaregivers,
        menu: newMenu,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving kids data:', error);
      toast.error('Error al guardar');
    }
  }, [activeWedding]);

  const handleSaveActivity = useCallback((formData) => {
    let newActivities;
    
    if (editingActivity) {
      newActivities = activities.map(a => 
        a.id === editingActivity.id ? { ...formData, id: a.id } : a
      );
      toast.success('Actividad actualizada');
    } else {
      const newActivity = {
        ...formData,
        id: `activity-${Date.now()}`,
      };
      newActivities = [...activities, newActivity];
      toast.success('Actividad añadida');
    }

    setActivities(newActivities);
    saveData(newActivities, caregivers, menu);
    setShowActivityModal(false);
    setEditingActivity(null);
  }, [activities, caregivers, menu, editingActivity, saveData]);

  const handleDeleteActivity = useCallback((id) => {
    if (!confirm('¿Eliminar esta actividad?')) return;
    
    const newActivities = activities.filter(a => a.id !== id);
    setActivities(newActivities);
    saveData(newActivities, caregivers, menu);
    toast.success('Actividad eliminada');
  }, [activities, caregivers, menu, saveData]);

  const handleToggleActivity = useCallback((id) => {
    const newActivities = activities.map(a => 
      a.id === id ? { ...a, completed: !a.completed } : a
    );
    setActivities(newActivities);
    saveData(newActivities, caregivers, menu);
  }, [activities, caregivers, menu, saveData]);

  const handleSaveCaregiver = useCallback((formData) => {
    let newCaregivers;
    
    if (editingCaregiver) {
      newCaregivers = caregivers.map(c => 
        c.id === editingCaregiver.id ? { ...formData, id: c.id } : c
      );
      toast.success('Cuidador actualizado');
    } else {
      const newCaregiver = {
        ...formData,
        id: `caregiver-${Date.now()}`,
      };
      newCaregivers = [...caregivers, newCaregiver];
      toast.success('Cuidador añadido');
    }

    setCaregivers(newCaregivers);
    saveData(activities, newCaregivers, menu);
    setShowCaregiverModal(false);
    setEditingCaregiver(null);
  }, [caregivers, activities, menu, editingCaregiver, saveData]);

  const handleDeleteCaregiver = useCallback((id) => {
    if (!confirm('¿Eliminar este cuidador?')) return;
    
    const newCaregivers = caregivers.filter(c => c.id !== id);
    setCaregivers(newCaregivers);
    saveData(activities, newCaregivers, menu);
    toast.success('Cuidador eliminado');
  }, [caregivers, activities, menu, saveData]);

  const handleToggleMenuOption = useCallback((optionId) => {
    const newMenu = menu.includes(optionId)
      ? menu.filter(id => id !== optionId)
      : [...menu, optionId];
    
    setMenu(newMenu);
    saveData(activities, caregivers, newMenu);
  }, [menu, activities, caregivers, saveData]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
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
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Baby className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Gestión de Niños</h1>
                  <p className="text-sm text-gray-600">
                    Actividades, menú y cuidadores
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">{activities.length}</div>
                <div className="text-xs text-gray-600">Actividades</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">{caregivers.length}</div>
                <div className="text-xs text-gray-600">Cuidadores</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">{menu.length}</div>
                <div className="text-xs text-gray-600">Opciones menú</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('activities')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'activities'
                  ? 'bg-pink-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Gamepad2 className="w-5 h-5 inline mr-2" />
              Actividades
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'menu'
                  ? 'bg-pink-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Utensils className="w-5 h-5 inline mr-2" />
              Menú
            </button>
            <button
              onClick={() => setActiveTab('caregivers')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'caregivers'
                  ? 'bg-pink-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              Cuidadores
            </button>
          </div>

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Actividades y Entretenimiento</h2>
                <button
                  onClick={() => {
                    setEditingActivity(null);
                    setShowActivityModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Añadir actividad
                </button>
              </div>

              {activities.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay actividades
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Planifica entretenimiento para los niños del evento
                  </p>
                  <button
                    onClick={() => setShowActivityModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Añadir primera actividad
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onEdit={(a) => {
                        setEditingActivity(a);
                        setShowActivityModal(true);
                      }}
                      onDelete={handleDeleteActivity}
                      onToggle={handleToggleActivity}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Menu Tab */}
          {activeTab === 'menu' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Menú Infantil</h2>
              <p className="text-sm text-gray-600 mb-6">
                Selecciona las opciones que incluirás en el menú para niños
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {MENU_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleToggleMenuOption(option.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      menu.includes(option.id)
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-pink-300'
                    }`}
                  >
                    <span className="text-3xl mb-2 block">{option.icon}</span>
                    <span className="text-sm font-medium text-gray-800 block">
                      {option.name}
                    </span>
                    {menu.includes(option.id) && (
                      <CheckCircle2 className="w-5 h-5 text-pink-600 mt-2 mx-auto" />
                    )}
                  </button>
                ))}
              </div>

              {menu.length > 0 && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">
                    Menú seleccionado ({menu.length} opciones):
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {menu.map((id) => {
                      const option = MENU_OPTIONS.find(o => o.id === id);
                      return option ? (
                        <span key={id} className="px-3 py-1 bg-white rounded-full text-sm border border-green-200">
                          {option.icon} {option.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Caregivers Tab */}
          {activeTab === 'caregivers' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Cuidadores</h2>
                <button
                  onClick={() => {
                    setEditingCaregiver(null);
                    setShowCaregiverModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Añadir cuidador
                </button>
              </div>

              {caregivers.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay cuidadores
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Añade canguros o animadores infantiles
                  </p>
                  <button
                    onClick={() => setShowCaregiverModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Añadir primer cuidador
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {caregivers.map((caregiver) => (
                    <CaregiverCard
                      key={caregiver.id}
                      caregiver={caregiver}
                      onEdit={(c) => {
                        setEditingCaregiver(c);
                        setShowCaregiverModal(true);
                      }}
                      onDelete={handleDeleteCaregiver}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        {showActivityModal && (
          <ActivityModal
            activity={editingActivity}
            onSave={handleSaveActivity}
            onClose={() => {
              setShowActivityModal(false);
              setEditingActivity(null);
            }}
          />
        )}

        {showCaregiverModal && (
          <CaregiverModal
            caregiver={editingCaregiver}
            onSave={handleSaveCaregiver}
            onClose={() => {
              setShowCaregiverModal(false);
              setEditingCaregiver(null);
            }}
          />
        )}
      </div>
    </PageWrapper>
  );
}
