/**
 * WeddingTeam - Gestión del equipo de boda
 * FASE 6.1 del WORKFLOW-USUARIO.md
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, UserPlus, Crown, Heart, CheckCircle2, Plus, Edit2, Trash2, Phone, Mail, ClipboardList } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useWedding } from '../context/WeddingContext';
import PageWrapper from '../components/PageWrapper';
import { toast } from 'react-toastify';
const getTeamRoles = (t) => [
  {
    id: 'coordinador',
    name: t('weddingTeam.roles.coordinator.name'),
    icon: '👔',
    description: t('weddingTeam.roles.coordinator.description'),
    responsibilities: [
      t('weddingTeam.roles.coordinator.resp1'),
      t('weddingTeam.roles.coordinator.resp2'),
      t('weddingTeam.roles.coordinator.resp3'),
      t('weddingTeam.roles.coordinator.resp4'),
      t('weddingTeam.roles.coordinator.resp5')
    ]
  },
  {
    id: 'padrinos',
    name: t('weddingTeam.roles.godparents.name'),
    icon: '👑',
    description: t('weddingTeam.roles.godparents.description'),
    responsibilities: [
      'Acompañar en la ceremonia',
      'Firmar como testigos',
      'Dar discurso en el banquete',
      'Ayudar con la organización',
      'Apoyo emocional a los novios'
    ]
  },
  {
    id: 'damas',
    name: t('weddingTeam.roles.bridesmaids.name'),
    icon: '👗',
    description: t('weddingTeam.roles.bridesmaids.description'),
    responsibilities: [
      'Ayudar con preparativos novia',
      'Organizar despedida de soltera',
      'Sostener el ramo en ceremonia',
      'Ayudar con el vestido',
      'Apoyo emocional'
    ]
  },
  {
    id: 'testigos',
    name: t('weddingTeam.roles.witnesses.name'),
    icon: '✍️',
    description: t('weddingTeam.roles.witnesses.description'),
    responsibilities: [
      'Firmar documentos legales',
      'Acompañar en ceremonia',
      'Ayudar con organización',
      'Discurso opcional'
    ]
  },
  {
    id: 'maestro',
    name: t('weddingTeam.roles.mc.name'),
    icon: '🎤',
    description: t('weddingTeam.roles.mc.description'),
    responsibilities: [
      'Presentar momentos clave',
      'Coordinar discursos',
      'Animar la celebración',
      'Mantener timeline',
      'Interactuar con invitados'
    ]
  },
  {
    id: 'flower-kids',
    name: 'Niños de arras/flores',
    icon: '🌸',
    description: 'Participan en la ceremonia',
    responsibilities: [
      'Llevar anillos/arras',
      'Lanzar pétalos',
      'Ensayar ceremonia',
      'Coordinarse con padres'
    ]
  },
  {
    id: 'organizador',
    name: 'Organizador de apoyo',
    icon: '📋',
    description: 'Ayuda en tareas específicas de organización',
    responsibilities: [
      'Tareas específicas asignadas',
      'Apoyo logístico',
      'Coordinación puntual',
      'Backup de coordinador'
    ]
  },
  {
    id: 'otro',
    name: 'Otro rol',
    icon: '⭐',
    description: 'Rol personalizado',
    responsibilities: [
      'Responsabilidades personalizadas'
    ]
  }
];

const MemberCard = ({ member, onEdit, onDelete, onToggleTask }) => {
  const roleConfig = TEAM_ROLES.find(r => r.id === member.role) || TEAM_ROLES[7];
  const completedTasks = member.tasks?.filter(t => t.completed).length || 0;
  const totalTasks = member.tasks?.length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className=" border  rounded-lg p-5 hover:shadow-md transition-shadow" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
            {roleConfig.icon}
          </div>
          <div>
            <h3 className="font-semibold " style={{ color: 'var(--color-text)' }}>{member.name}</h3>
            <p className="text-sm " style={{ color: 'var(--color-text-secondary)' }}>{roleConfig.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(member)}
            className="p-2  hover: hover:bg-blue-50 rounded transition-colors" style={{ color: 'var(--color-primary)' }} style={{ color: 'var(--color-text-secondary)' }}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(member.id)}
            className="p-2  hover: hover:bg-red-50 rounded transition-colors" style={{ color: 'var(--color-danger)' }} style={{ color: 'var(--color-text-secondary)' }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {(member.phone || member.email) && (
        <div className="space-y-1 text-sm  mb-3" style={{ color: 'var(--color-text)' }}>
          {member.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{member.phone}</span>
            </div>
          )}
          {member.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="truncate">{member.email}</span>
            </div>
          )}
        </div>
      )}

      {totalTasks > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="" style={{ color: 'var(--color-text-secondary)' }}>Progreso de tareas</span>
            <span className="font-medium " style={{ color: 'var(--color-text)' }}>{completedTasks}/{totalTasks}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {member.tasks && member.tasks.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium  mb-2" style={{ color: 'var(--color-text-secondary)' }}>Tareas:</p>
          {member.tasks.slice(0, 3).map((task) => (
            <button
              key={task.id}
              onClick={() => onToggleTask(member.id, task.id)}
              className="w-full flex items-start gap-2 text-left text-sm hover: p-1 rounded transition-colors" style={{ backgroundColor: 'var(--color-bg)' }}
            >
              <div className={`flex-shrink-0 w-4 h-4 rounded border-2 mt-0.5 ${
                task.completed ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
              }`}>
                {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
              <span className={task.completed ? 'line-through text-gray-500' : 'text-gray-700'}>
                {task.text}
              </span>
            </button>
          ))}
          {member.tasks.length > 3 && (
            <p className="text-xs  pl-6" style={{ color: 'var(--color-muted)' }}>+{member.tasks.length - 3} más...</p>
          )}
        </div>
      )}

      {member.notes && (
        <div className="text-xs  mt-3 pt-3 border-t " style={{ borderColor: 'var(--color-border)' }} style={{ color: 'var(--color-text-secondary)' }}>
          {member.notes}
        </div>
      )}
    </div>
  );
};

const MemberModal = ({ member, onSave, onClose }) => {
  const [formData, setFormData] = useState(
    member || {
      role: 'padrinos',
      name: '',
      phone: '',
      email: '',
      notes: '',
      tasks: []
    }
  );

  const [newTask, setNewTask] = useState('');
  const selectedRole = TEAM_ROLES.find(r => r.id === formData.role) || TEAM_ROLES[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('El nombre es obligatorio');
      return;
    }
    onSave(formData);
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    
    const task = {
      id: `task-${Date.now()}`,
      text: newTask.trim(),
      completed: false
    };
    
    setFormData({
      ...formData,
      tasks: [...(formData.tasks || []), task]
    });
    setNewTask('');
  };

  const handleRemoveTask = (taskId) => {
    setFormData({
      ...formData,
      tasks: formData.tasks.filter(t => t.id !== taskId)
    });
  };

  const handleLoadDefaultTasks = () => {
    const defaultTasks = selectedRole.responsibilities.map((resp, idx) => ({
      id: `task-${Date.now()}-${idx}`,
      text: resp,
      completed: false
    }));
    setFormData({
      ...formData,
      tasks: defaultTasks
    });
    toast.success('Tareas por defecto cargadas');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className=" rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold " style={{ color: 'var(--color-text)' }}>
              {member ? 'Editar miembro' : 'Nuevo miembro del equipo'}
            </h2>
            <button onClick={onClose} className=" hover:" style={{ color: 'var(--color-muted)' }} style={{ color: 'var(--color-text-secondary)' }}>✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                Rol en la boda
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {TEAM_ROLES.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: role.id })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.role === role.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <span className="text-2xl mb-1 block">{role.icon}</span>
                    <span className="text-xs  line-clamp-2" style={{ color: 'var(--color-text)' }}>{role.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs  mt-2" style={{ color: 'var(--color-text-secondary)' }}>{selectedRole.description}</p>
            </div>

            <div>
              <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                Nombre completo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('weddingTeam.memberNamePlaceholder')}
                className="w-full border  rounded-lg px-3 py-2" style={{ borderColor: 'var(--color-border)' }}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+34 600 000 000"
                  className="w-full border  rounded-lg px-3 py-2" style={{ borderColor: 'var(--color-border)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('weddingTeam.emailPlaceholder')}
                  className="w-full border  rounded-lg px-3 py-2" style={{ borderColor: 'var(--color-border)' }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium " style={{ color: 'var(--color-text)' }}>
                  Tareas y responsabilidades
                </label>
                {formData.tasks.length === 0 && (
                  <button
                    type="button"
                    onClick={handleLoadDefaultTasks}
                    className="text-xs text-purple-600 hover:text-purple-700"
                  >
                    Cargar tareas por defecto
                  </button>
                )}
              </div>

              <div className="space-y-2 mb-2">
                {formData.tasks?.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 " style={{ color: 'var(--color-text)' }}>{task.text}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(task.id)}
                      className=" hover:text-red-700" style={{ color: 'var(--color-danger)' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
                  placeholder="Nueva tarea..."
                  className="flex-1 border  rounded-lg px-3 py-2 text-sm" style={{ borderColor: 'var(--color-border)' }}
                />
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium  mb-1" style={{ color: 'var(--color-text)' }}>
                Notas adicionales
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Cualquier información adicional..."
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
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {member ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function WeddingTeam() {
  const { activeWedding } = useWedding();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    if (!activeWedding) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const docRef = doc(db, 'weddings', activeWedding, 'team', 'members');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTeamMembers(data.members || []);
        }
      } catch (error) {
        console.error('Error loading team data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeWedding]);

  const saveData = useCallback(async (newMembers) => {
    if (!activeWedding) return;

    try {
      const docRef = doc(db, 'weddings', activeWedding, 'team', 'members');
      await setDoc(docRef, {
        members: newMembers,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving team data:', error);
      toast.error('Error al guardar');
    }
  }, [activeWedding]);

  const handleSave = useCallback((formData) => {
    let newMembers;
    
    if (editingMember) {
      newMembers = teamMembers.map(m => 
        m.id === editingMember.id ? { ...formData, id: m.id } : m
      );
      toast.success('Miembro actualizado');
    } else {
      const newMember = {
        ...formData,
        id: `member-${Date.now()}`,
      };
      newMembers = [...teamMembers, newMember];
      toast.success('Miembro añadido');
    }

    setTeamMembers(newMembers);
    saveData(newMembers);
    setShowModal(false);
    setEditingMember(null);
  }, [teamMembers, editingMember, saveData]);

  const handleDelete = useCallback((id) => {
    if (!confirm('¿Eliminar este miembro del equipo?')) return;
    
    const newMembers = teamMembers.filter(m => m.id !== id);
    setTeamMembers(newMembers);
    saveData(newMembers);
    toast.success('Miembro eliminado');
  }, [teamMembers, saveData]);

  const handleToggleTask = useCallback((memberId, taskId) => {
    const newMembers = teamMembers.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          tasks: m.tasks.map(t => 
            t.id === taskId ? { ...t, completed: !t.completed } : t
          )
        };
      }
      return m;
    });
    
    setTeamMembers(newMembers);
    saveData(newMembers);
  }, [teamMembers, saveData]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="" style={{ color: 'var(--color-text-secondary)' }}>Cargando equipo...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const filteredMembers = filterRole === 'all' 
    ? teamMembers 
    : teamMembers.filter(m => m.role === filterRole);

  const totalTasks = teamMembers.reduce((sum, m) => sum + (m.tasks?.length || 0), 0);
  const completedTasks = teamMembers.reduce((sum, m) => 
    sum + (m.tasks?.filter(t => t.completed).length || 0), 0
  );
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const roleStats = TEAM_ROLES.map(role => ({
    ...role,
    count: teamMembers.filter(m => m.role === role.id).length
  })).filter(r => r.count > 0);

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3  rounded-lg shadow-sm" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold " style={{ color: 'var(--color-text)' }}>Wedding Team</h1>
                  <p className="text-sm " style={{ color: 'var(--color-text-secondary)' }}>
                    Gestiona tu equipo y sus responsabilidades
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingMember(null);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                Añadir miembro
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className=" rounded-lg p-3 border " style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
                <div className="text-2xl font-bold " style={{ color: 'var(--color-text)' }}>{teamMembers.length}</div>
                <div className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>Miembros</div>
              </div>
              <div className=" rounded-lg p-3 border " style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
                <div className="text-2xl font-bold " style={{ color: 'var(--color-text)' }}>{roleStats.length}</div>
                <div className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>Roles cubiertos</div>
              </div>
              <div className=" rounded-lg p-3 border " style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
                <div className="text-2xl font-bold " style={{ color: 'var(--color-text)' }}>{totalTasks}</div>
                <div className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>Tareas totales</div>
              </div>
              <div className=" rounded-lg p-3 border " style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
                <div className="text-2xl font-bold " style={{ color: 'var(--color-text)' }}>{Math.round(progressPercent)}%</div>
                <div className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>Completado</div>
              </div>
            </div>

            {totalTasks > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className=" font-medium" style={{ color: 'var(--color-text)' }}>Progreso general del equipo</span>
                  <span className="" style={{ color: 'var(--color-text-secondary)' }}>{completedTasks}/{totalTasks} tareas</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-purple-600 h-3 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Role Filter */}
          {teamMembers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterRole('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterRole === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Todos ({teamMembers.length})
              </button>
              {roleStats.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setFilterRole(role.id)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterRole === role.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {role.icon} {role.name} ({role.count})
                </button>
              ))}
            </div>
          )}

          {/* Team Members */}
          {teamMembers.length === 0 ? (
            <div className=" border-2 border-dashed  rounded-lg p-12 text-center" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
              <Users className="w-16 h-16  mx-auto mb-4" style={{ color: 'var(--color-muted)' }} />
              <h3 className="text-lg font-semibold  mb-2" style={{ color: 'var(--color-text)' }}>
                No hay miembros en el equipo
              </h3>
              <p className="text-sm  mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                Añade a las personas que te ayudarán a organizar y coordinar la boda
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                Añadir primer miembro
              </button>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className=" border  rounded-lg p-8 text-center" style={{ borderColor: 'var(--color-border)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
              <p className="" style={{ color: 'var(--color-text-secondary)' }}>No hay miembros con este rol</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  onEdit={(m) => {
                    setEditingMember(m);
                    setShowModal(true);
                  }}
                  onDelete={handleDelete}
                  onToggleTask={handleToggleTask}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <MemberModal
            member={editingMember}
            onSave={handleSave}
            onClose={() => {
              setShowModal(false);
              setEditingMember(null);
            }}
          />
        )}
      </div>
    </PageWrapper>
  );
}
