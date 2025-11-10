import React, { useState, useEffect } from 'react';
import {
  Plus,
  Users,
  Euro,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Edit2,
  Trash2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '../ui/Button';
import useTranslations from '../../hooks/useTranslations';

/**
 * Gestor de aportaciones familiares/amigos para la boda
 */
const ContributionsManager = ({ weddingId, onUpdate }) => {
  const { t, currentLanguage } = useTranslations();
  const [contributions, setContributions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContribution, setEditingContribution] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    promisedDate: '',
    status: 'pending', // pending, confirmed, received
    notes: '',
  });

  useEffect(() => {
    loadContributions();
  }, [weddingId]);

  const loadContributions = () => {
    // Cargar desde localStorage o API
    const stored = localStorage.getItem(`contributions_${weddingId}`);
    if (stored) {
      setContributions(JSON.parse(stored));
    }
  };

  const saveContributions = (newContributions) => {
    localStorage.setItem(`contributions_${weddingId}`, JSON.stringify(newContributions));
    setContributions(newContributions);
    if (onUpdate) onUpdate(newContributions);
  };

  const handleAddContribution = () => {
    if (!formData.name || !formData.amount) {
      toast.warn(
        t('finance.contributions.nameAmountRequired', 'Nombre y monto son obligatorios')
      );
      return;
    }

    const newContribution = {
      id: Date.now().toString(),
      ...formData,
      amount: parseFloat(formData.amount),
      createdAt: new Date().toISOString(),
    };

    saveContributions([...contributions, newContribution]);
    resetForm();
  };

  const handleUpdateContribution = () => {
    if (!editingContribution) return;

    const updated = contributions.map((c) =>
      c.id === editingContribution.id
        ? { ...c, ...formData, amount: parseFloat(formData.amount) }
        : c
    );

    saveContributions(updated);
    resetForm();
  };

  const handleDeleteContribution = (id) => {
    if (
      window.confirm(t('finance.contributions.confirmDelete', '¿Eliminar esta aportación?'))
    ) {
      saveContributions(contributions.filter((c) => c.id !== id));
    }
  };

  const handleEditClick = (contribution) => {
    setEditingContribution(contribution);
    setFormData({
      name: contribution.name,
      amount: contribution.amount.toString(),
      promisedDate: contribution.promisedDate || '',
      status: contribution.status,
      notes: contribution.notes || '',
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      promisedDate: '',
      status: 'pending',
      notes: '',
    });
    setEditingContribution(null);
    setShowAddModal(false);
  };

  // Calcular totales
  const totalPromised = contributions.reduce((sum, c) => sum + c.amount, 0);
  const totalReceived = contributions
    .filter((c) => c.status === 'received')
    .reduce((sum, c) => sum + c.amount, 0);
  const totalPending = contributions
    .filter((c) => c.status !== 'received')
    .reduce((sum, c) => sum + c.amount, 0);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'received':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'confirmed':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      received: t('finance.contributions.status.received', 'Recibida'),
      confirmed: t('finance.contributions.status.confirmed', 'Confirmada'),
      pending: t('finance.contributions.status.pending', 'Pendiente'),
    };
    return labels[status] || labels.pending;
  };

  return (
    <div className="space-y-6">
      {/* Header con resumen */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Aportaciones
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona las contribuciones de familiares y amigos
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva Aportación
        </Button>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Euro className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total Prometido</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">€{totalPromised.toFixed(2)}</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Recibido</span>
          </div>
          <p className="text-2xl font-bold text-green-700">€{totalReceived.toFixed(2)}</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-900">Pendiente</span>
          </div>
          <p className="text-2xl font-bold text-yellow-700">€{totalPending.toFixed(2)}</p>
        </div>
      </div>

      {/* Lista de aportaciones */}
      {contributions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No hay aportaciones registradas</p>
          <p className="text-sm text-gray-500">Añade la primera aportación para comenzar</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Persona
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Monto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Fecha Prometida
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Notas
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contributions.map((contribution) => (
                <tr key={contribution.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {contribution.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    €{contribution.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {contribution.promisedDate
                      ? new Date(contribution.promisedDate).toLocaleDateString(
                          currentLanguage || 'es'
                        )
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(contribution.status)}
                      <span className="text-sm text-gray-700">
                        {getStatusLabel(contribution.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {contribution.notes || '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditClick(contribution)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteContribution(contribution.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add/Edit */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingContribution ? 'Editar Aportación' : 'Nueva Aportación'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la persona *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Ej: María García"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha prometida
                </label>
                <input
                  type="date"
                  value={formData.promisedDate}
                  onChange={(e) => setFormData({ ...formData, promisedDate: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="received">Recibida</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows="3"
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={resetForm}>
                Cancelar
              </Button>
              <Button
                onClick={editingContribution ? handleUpdateContribution : handleAddContribution}
              >
                {editingContribution ? 'Actualizar' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContributionsManager;
