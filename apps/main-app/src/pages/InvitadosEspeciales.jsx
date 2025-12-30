/**
 * InvitadosEspeciales - Gestión de necesidades especiales de invitados
 * FASE 2.5 del WORKFLOW-USUARIO.md
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, AlertCircle, Utensils, Baby, Heart, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useWedding } from '../context/WeddingContext';
import PageWrapper from '../components/PageWrapper';
import { toast } from 'react-toastify';

const getDietsAndNeeds = (t) => [
  { id: 'vegetarian', name: t('specialGuests.diets.vegetarian'), icon: '🥗', category: 'diet' },
  { id: 'vegan', name: t('specialGuests.diets.vegan'), icon: '🥦', category: 'diet' },
  { id: 'gluten-free', name: t('specialGuests.diets.glutenFree'), icon: '🌾', category: 'diet' },
  { id: 'lactose-free', name: t('specialGuests.diets.lactoseFree'), icon: '🧀', category: 'diet' },
  { id: 'kosher', name: t('specialGuests.diets.kosher'), icon: '✡️', category: 'diet' },
  { id: 'halal', name: t('specialGuests.diets.halal'), icon: '☪️', category: 'diet' },
  { id: 'diabetes', name: t('specialGuests.diets.diabetes'), icon: '🍬', category: 'diet' },
  { id: 'other', name: t('specialGuests.diets.other'), icon: '🍽️', category: 'diet' },
  { id: 'movilidad', name: t('specialGuests.needs.mobility'), icon: '♿', category: 'need' },
  { id: 'visual', name: t('specialGuests.needs.visual'), icon: '👓', category: 'need' },
  { id: 'auditiva', name: t('specialGuests.needs.hearing'), icon: '👂', category: 'need' },
  { id: 'embarazada', name: t('specialGuests.needs.pregnant'), icon: '🤰', category: 'need' },
  { id: 'bebe', name: t('specialGuests.needs.baby'), icon: '👶', category: 'need' },
  { id: 'mayor', name: t('specialGuests.needs.elderly'), icon: '👴', category: 'need' },
  { id: 'other', name: t('specialGuests.needs.other'), icon: '⚠️', category: 'need' }
];

const getAlergiasComunes = (t) => [
  t('specialGuests.allergies.nuts'),
  t('specialGuests.allergies.shellfish'),
  t('specialGuests.allergies.fish'),
  t('specialGuests.allergies.egg'),
  t('specialGuests.allergies.dairy'),
  t('specialGuests.allergies.gluten'),
  t('specialGuests.allergies.soy'),
  t('specialGuests.allergies.sulfites'),
  t('specialGuests.allergies.mustard'),
  t('specialGuests.allergies.sesame')
];

const getNecesidadesEspeciales = (t) => [
  { id: 'movilidad', nombre: t('specialGuests.needs.mobility'), icon: '♿', color: 'blue' },
  { id: 'visual', nombre: t('specialGuests.needs.visual'), icon: '👓', color: 'purple' },
  { id: 'auditiva', nombre: t('specialGuests.needs.hearing'), icon: '👂', color: 'indigo' },
  { id: 'embarazada', nombre: t('specialGuests.needs.pregnant'), icon: '🤰', color: 'pink' },
  { id: 'bebe', nombre: t('specialGuests.needs.baby'), icon: '👶', color: 'yellow' },
  { id: 'mayor', nombre: t('specialGuests.needs.elderly'), icon: '👴', color: 'orange' },
  { id: 'otra', nombre: t('specialGuests.needs.other'), icon: '⚠️', color: 'gray' }
];

const NecesidadCard = ({ invitado, onEdit, onDelete }) => {
  const { t } = useTranslation('pages');
  const DIETAS_ESPECIALES = getDietasEspeciales(t);
  const NECESIDADES_ESPECIALES = getNecesidadesEspeciales(t);
  
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
                  placeholder={t('specialGuests.namePlaceholder')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('specialGuests.searchPlaceholder')}
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
