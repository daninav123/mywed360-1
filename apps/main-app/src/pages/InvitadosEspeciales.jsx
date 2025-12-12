/**
 * InvitadosEspeciales - Gestión de necesidades especiales de invitados
 * FASE 2.5 del WORKFLOW-USUARIO.md
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, AlertCircle, Utensils, Baby, Heart, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useWedding } from '../context/WeddingContext';
import PageWrapper from '../components/PageWrapper';
import { toast } from 'react-toastify';

const DIETAS_ESPECIALES = [
  { id: 'vegetariana', nombre: 'Vegetariana', icon: '🥗', color: 'green' },
  { id: 'vegana', nombre: 'Vegana', icon: '🌱', color: 'emerald' },
  { id: 'celiaca', nombre: 'Celíaca / Sin gluten', icon: '🌾', color: 'yellow' },
  { id: 'lactosa', nombre: 'Sin lactosa', icon: '🥛', color: 'blue' },
  { id: 'kosher', nombre: 'Kosher', icon: '✡️', color: 'purple' },
  { id: 'halal', nombre: 'Halal', icon: '☪️', color: 'teal' },
  { id: 'diabetes', nombre: 'Diabética', icon: '🍬', color: 'red' },
  { id: 'otra', nombre: 'Otra', icon: '🍽️', color: 'gray' }
];

const ALERGIAS_COMUNES = [
  'Frutos secos', 'Mariscos', 'Pescado', 'Huevo', 'Lácteos', 
  'Gluten', 'Soja', 'Sulfitos', 'Mostaza', 'Sésamo'
];

const NECESIDADES_ESPECIALES = [
  { id: 'movilidad', nombre: 'Movilidad reducida', icon: '♿', color: 'blue' },
  { id: 'visual', nombre: 'Discapacidad visual', icon: '👓', color: 'purple' },
  { id: 'auditiva', nombre: 'Discapacidad auditiva', icon: '👂', color: 'indigo' },
  { id: 'embarazada', nombre: 'Embarazada', icon: '🤰', color: 'pink' },
  { id: 'bebe', nombre: 'Con bebé', icon: '👶', color: 'yellow' },
  { id: 'mayor', nombre: 'Persona mayor', icon: '👴', color: 'orange' },
  { id: 'otra', nombre: 'Otra', icon: '⚠️', color: 'gray' }
];

const NecesidadCard = ({ invitado, onEdit, onDelete }) => {
  const getDietaBadges = () => {
    if (!invitado.dietas || invitado.dietas.length === 0) return null;
    return invitado.dietas.map(dietaId => {
      const dieta = DIETAS_ESPECIALES.find(d => d.id === dietaId);
      return dieta ? (
        <span key={dietaId} className={`inline-flex items-center gap-1 px-2 py-1 bg-${dieta.color}-100 text-${dieta.color}-700 rounded-full text-xs`}>
          {dieta.icon} {dieta.nombre}
        </span>
      ) : null;
    });
  };

  const getNecesidadesBadges = () => {
    if (!invitado.necesidades || invitado.necesidades.length === 0) return null;
    return invitado.necesidades.map(necId => {
      const nec = NECESIDADES_ESPECIALES.find(n => n.id === necId);
      return nec ? (
        <span key={necId} className={`inline-flex items-center gap-1 px-2 py-1 bg-${nec.color}-100 text-${nec.color}-700 rounded-full text-xs`}>
          {nec.icon} {nec.nombre}
        </span>
      ) : null;
    });
  };

  const hasSpecialNeeds = invitado.dietas?.length > 0 || 
                          invitado.alergias?.length > 0 || 
                          invitado.necesidades?.length > 0 ||
                          invitado.notasEspeciales;

  return (
    <div className={`border-2 rounded-lg p-4 transition-shadow hover:shadow-md ${
      hasSpecialNeeds ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-1">{invitado.nombre}</h3>
          {invitado.mesa && (
            <p className="text-xs text-gray-600">Mesa: {invitado.mesa}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(invitado)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(invitado.id)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {invitado.dietas && invitado.dietas.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <Utensils className="w-3 h-3" /> Dietas:
            </p>
            <div className="flex flex-wrap gap-1">
              {getDietaBadges()}
            </div>
          </div>
        )}

        {invitado.alergias && invitado.alergias.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Alergias:
            </p>
            <div className="flex flex-wrap gap-1">
              {invitado.alergias.map((alergia, idx) => (
                <span key={idx} className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                  ⚠️ {alergia}
                </span>
              ))}
            </div>
          </div>
        )}

        {invitado.necesidades && invitado.necesidades.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <Wheelchair className="w-3 h-3" /> Necesidades:
            </p>
            <div className="flex flex-wrap gap-1">
              {getNecesidadesBadges()}
            </div>
          </div>
        )}

        {invitado.notasEspeciales && (
          <div className="pt-2 border-t border-gray-300">
            <p className="text-xs text-gray-700">{invitado.notasEspeciales}</p>
          </div>
        )}

        {!hasSpecialNeeds && (
          <p className="text-sm text-gray-500 italic">Sin necesidades especiales registradas</p>
        )}
      </div>
    </div>
  );
};

const NecesidadModal = ({ invitado, onSave, onClose }) => {
  const [formData, setFormData] = useState(
    invitado || {
      nombre: '',
      mesa: '',
      dietas: [],
      alergias: [],
      necesidades: [],
      notasEspeciales: ''
    }
  );

  const [newAlergia, setNewAlergia] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre) {
      toast.error('El nombre es obligatorio');
      return;
    }
    onSave(formData);
  };

  const toggleDieta = (dietaId) => {
    const dietas = formData.dietas.includes(dietaId)
      ? formData.dietas.filter(d => d !== dietaId)
      : [...formData.dietas, dietaId];
    setFormData({ ...formData, dietas });
  };

  const toggleNecesidad = (necId) => {
    const necesidades = formData.necesidades.includes(necId)
      ? formData.necesidades.filter(n => n !== necId)
      : [...formData.necesidades, necId];
    setFormData({ ...formData, necesidades });
  };

  const addAlergia = (alergia) => {
    if (!alergia.trim()) return;
    if (formData.alergias.includes(alergia.trim())) {
      toast.error('Esta alergia ya está añadida');
      return;
    }
    setFormData({
      ...formData,
      alergias: [...formData.alergias, alergia.trim()]
    });
    setNewAlergia('');
  };

  const removeAlergia = (alergia) => {
    setFormData({
      ...formData,
      alergias: formData.alergias.filter(a => a !== alergia)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {invitado ? 'Editar invitado' : 'Nuevo invitado con necesidades'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre y apellidos"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mesa asignada
                </label>
                <input
                  type="text"
                  value={formData.mesa}
                  onChange={(e) => setFormData({ ...formData, mesa: e.target.value })}
                  placeholder="Ej: Mesa 5"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dietas especiales
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {DIETAS_ESPECIALES.map((dieta) => (
                  <button
                    key={dieta.id}
                    type="button"
                    onClick={() => toggleDieta(dieta.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.dietas.includes(dieta.id)
                        ? `border-${dieta.color}-500 bg-${dieta.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl block mb-1">{dieta.icon}</span>
                    <span className="text-xs text-gray-700">{dieta.nombre}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alergias e intolerancias
              </label>
              
              {formData.alergias.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.alergias.map((alergia, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                    >
                      ⚠️ {alergia}
                      <button
                        type="button"
                        onClick={() => removeAlergia(alergia)}
                        className="hover:text-red-900"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newAlergia}
                  onChange={(e) => setNewAlergia(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAlergia(newAlergia))}
                  placeholder="Escribir alergia..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => addAlergia(newAlergia)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-500 mb-2">Alergias comunes (clic para añadir):</p>
              <div className="flex flex-wrap gap-2">
                {ALERGIAS_COMUNES.map((alergia) => (
                  <button
                    key={alergia}
                    type="button"
                    onClick={() => addAlergia(alergia)}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                  >
                    + {alergia}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Necesidades especiales
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {NECESIDADES_ESPECIALES.map((nec) => (
                  <button
                    key={nec.id}
                    type="button"
                    onClick={() => toggleNecesidad(nec.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.necesidades.includes(nec.id)
                        ? `border-${nec.color}-500 bg-${nec.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl block mb-1">{nec.icon}</span>
                    <span className="text-xs text-gray-700">{nec.nombre}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas adicionales
              </label>
              <textarea
                value={formData.notasEspeciales}
                onChange={(e) => setFormData({ ...formData, notasEspeciales: e.target.value })}
                placeholder="Cualquier otra información relevante..."
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
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                {invitado ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function InvitadosEspeciales() {
  const { activeWedding } = useWedding();
  const [invitados, setInvitados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInvitado, setEditingInvitado] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDieta, setFilterDieta] = useState('all');
  const [filterNecesidad, setFilterNecesidad] = useState('all');

  useEffect(() => {
    if (!activeWedding) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const docRef = doc(db, 'weddings', activeWedding, 'guests', 'special-needs');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setInvitados(data.invitados || []);
        }
      } catch (error) {
        console.error('Error loading special needs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeWedding]);

  const saveData = useCallback(async (newInvitados) => {
    if (!activeWedding) return;

    try {
      const docRef = doc(db, 'weddings', activeWedding, 'guests', 'special-needs');
      await setDoc(docRef, {
        invitados: newInvitados,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving special needs:', error);
      toast.error('Error al guardar');
    }
  }, [activeWedding]);

  const handleSave = useCallback((formData) => {
    let newInvitados;
    
    if (editingInvitado) {
      newInvitados = invitados.map(i => 
        i.id === editingInvitado.id ? { ...formData, id: i.id } : i
      );
      toast.success('Invitado actualizado');
    } else {
      const newInvitado = {
        ...formData,
        id: `guest-${Date.now()}`,
      };
      newInvitados = [...invitados, newInvitado];
      toast.success('Invitado añadido');
    }

    setInvitados(newInvitados);
    saveData(newInvitados);
    setShowModal(false);
    setEditingInvitado(null);
  }, [invitados, editingInvitado, saveData]);

  const handleDelete = useCallback((id) => {
    if (!confirm('¿Eliminar este invitado?')) return;
    
    const newInvitados = invitados.filter(i => i.id !== id);
    setInvitados(newInvitados);
    saveData(newInvitados);
    toast.success('Invitado eliminado');
  }, [invitados, saveData]);

  const filteredInvitados = useMemo(() => {
    return invitados.filter(inv => {
      const matchSearch = inv.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDieta = filterDieta === 'all' || inv.dietas?.includes(filterDieta);
      const matchNecesidad = filterNecesidad === 'all' || inv.necesidades?.includes(filterNecesidad);
      return matchSearch && matchDieta && matchNecesidad;
    });
  }, [invitados, searchTerm, filterDieta, filterNecesidad]);

  const stats = useMemo(() => {
    const conDietas = invitados.filter(i => i.dietas?.length > 0).length;
    const conAlergias = invitados.filter(i => i.alergias?.length > 0).length;
    const conNecesidades = invitados.filter(i => i.necesidades?.length > 0).length;
    const total = invitados.length;

    const dietaCount = {};
    DIETAS_ESPECIALES.forEach(d => {
      dietaCount[d.id] = invitados.filter(i => i.dietas?.includes(d.id)).length;
    });

    return {
      total,
      conDietas,
      conAlergias,
      conNecesidades,
      dietaCount
    };
  }, [invitados]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando invitados...</p>
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
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Heart className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Invitados Especiales</h1>
                  <p className="text-sm text-gray-600">
                    Gestiona necesidades, dietas y alergias
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingInvitado(null);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Añadir invitado
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                <div className="text-xs text-gray-600">Total invitados</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-green-600">{stats.conDietas}</div>
                <div className="text-xs text-gray-600">Con dietas especiales</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-red-600">{stats.conAlergias}</div>
                <div className="text-xs text-gray-600">Con alergias</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-blue-600">{stats.conNecesidades}</div>
                <div className="text-xs text-gray-600">Con necesidades</div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar invitado..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <select
                value={filterDieta}
                onChange={(e) => setFilterDieta(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">Todas las dietas</option>
                {DIETAS_ESPECIALES.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.icon} {d.nombre} ({stats.dietaCount[d.id] || 0})
                  </option>
                ))}
              </select>

              <select
                value={filterNecesidad}
                onChange={(e) => setFilterNecesidad(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">Todas las necesidades</option>
                {NECESIDADES_ESPECIALES.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.icon} {n.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Invitados List */}
          {invitados.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No hay invitados registrados
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Añade invitados con necesidades especiales, dietas o alergias
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Añadir primer invitado
              </button>
            </div>
          ) : filteredInvitados.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-600">No se encontraron invitados con estos filtros</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInvitados.map((invitado) => (
                <NecesidadCard
                  key={invitado.id}
                  invitado={invitado}
                  onEdit={(i) => {
                    setEditingInvitado(i);
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
          <NecesidadModal
            invitado={editingInvitado}
            onSave={handleSave}
            onClose={() => {
              setShowModal(false);
              setEditingInvitado(null);
            }}
          />
        )}
      </div>
    </PageWrapper>
  );
}
