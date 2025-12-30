/**
 * TransporteLogistica - Gestión de transporte y logística del evento
 * FASE 6.2 del WORKFLOW-USUARIO.md
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Car, Bus, MapPin, Clock, Users, Plus, Edit2, Trash2, Navigation, Phone } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useWedding } from '../context/WeddingContext';
import PageWrapper from '../components/PageWrapper';
import { toast } from 'react-toastify';

const getVehicleTypes = (t) => [
  { id: 'coche', name: t('transport.vehicleTypes.car'), icon: '🚗', capacity: 4 },
  { id: 'minivan', name: t('transport.vehicleTypes.minivan'), icon: '🚙', capacity: 7 },
  { id: 'autobus', name: t('transport.vehicleTypes.bus'), icon: '🚌', capacity: 50 },
  { id: 'microbus', name: t('transport.vehicleTypes.microbus'), icon: '🚐', capacity: 20 },
  { id: 'limusina', name: t('transport.vehicleTypes.limousine'), icon: '🚗', capacity: 8 },
  { id: 'vintage', name: t('transport.vehicleTypes.vintage'), icon: '🚙', capacity: 4 },
];

const getRouteTypes = (t) => [
  { id: 'hotel-ceremonia', name: t('transport.routeTypes.hotelToCeremony'), icon: '⛪' },
  { id: 'ceremonia-banquete', name: t('transport.routeTypes.ceremonyToReception'), icon: '🍽️' },
  { id: 'banquete-hotel', name: t('transport.routeTypes.receptionToHotel'), icon: '🏨' },
  { id: 'aeropuerto-hotel', name: t('transport.routeTypes.airportToHotel'), icon: '✈️' },
  { id: 'otro', name: t('transport.routeTypes.other'), icon: '🗺️' },
];

const VehicleCard = ({ vehicle, onEdit, onDelete, t }) => {
  const vehicleTypes = getVehicleTypes(t);
  const typeConfig = vehicleTypes.find(vt => vt.id === vehicle.type) || vehicleTypes[0];
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{typeConfig.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-800">{vehicle.name || typeConfig.name}</h3>
            <p className="text-sm text-gray-600">{typeConfig.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(vehicle)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(vehicle.id)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <Users className="w-4 h-4" />
          <span>Capacidad: {vehicle.capacity || typeConfig.capacity} personas</span>
        </div>

        {vehicle.provider && (
          <div className="flex items-center gap-2 text-gray-700">
            <Phone className="w-4 h-4" />
            <span>Proveedor: {vehicle.provider}</span>
          </div>
        )}

        {vehicle.contact && (
          <div className="text-xs text-gray-600">
            Contacto: {vehicle.contact}
          </div>
        )}

        {vehicle.notes && (
          <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
            {vehicle.notes}
          </div>
        )}
      </div>
    </div>
  );
};

const RouteCard = ({ route, vehicles, onEdit, onDelete, t }) => {
  const routeTypes = getRouteTypes(t);
  const typeConfig = routeTypes.find(rt => rt.id === route.type) || routeTypes[4];
  const assignedVehicle = vehicles.find(v => v.id === route.vehicleId);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{typeConfig.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-800">{typeConfig.name}</h3>
            {route.customName && (
              <p className="text-sm text-gray-600">{route.customName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(route)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(route.id)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <MapPin className="w-4 h-4" />
          <span className="font-medium">Origen:</span>
          <span>{route.origin}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-700">
          <Navigation className="w-4 h-4" />
          <span className="font-medium">Destino:</span>
          <span>{route.destination}</span>
        </div>

        {route.time && (
          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="w-4 h-4" />
            <span>Hora: {route.time}</span>
          </div>
        )}

        {route.passengers && (
          <div className="flex items-center gap-2 text-gray-700">
            <Users className="w-4 h-4" />
            <span>{route.passengers} pasajeros</span>
          </div>
        )}

        {assignedVehicle && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Vehículo asignado:</p>
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {VEHICLE_TYPES.find(t => t.id === assignedVehicle.type)?.icon}
              </span>
              <span className="text-sm font-medium text-gray-800">
                {assignedVehicle.name || VEHICLE_TYPES.find(t => t.id === assignedVehicle.type)?.name}
              </span>
            </div>
          </div>
        )}

        {route.notes && (
          <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
            {route.notes}
          </div>
        )}
      </div>
    </div>
  );
};

const VehicleModal = ({ vehicle, onSave, onClose, t }) => {
  const [formData, setFormData] = useState(
    vehicle || {
      type: 'coche',
      name: '',
      capacity: '',
      provider: '',
      contact: '',
      notes: '',
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const vehicleTypes = getVehicleTypes(t);
  const selectedType = vehicleTypes.find(vt => vt.id === formData.type) || vehicleTypes[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {vehicle ? 'Editar vehículo' : 'Nuevo vehículo'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de vehículo
              </label>
              <div className="grid grid-cols-3 gap-2">
                {VEHICLE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      type: type.id,
                      capacity: formData.capacity || type.capacity 
                    })}
                    className={`p-3 rounded-lg border-2 transition-all ${
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
                Nombre / Identificación
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={`Ej: ${selectedType.name} principal`}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacidad (personas)
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder={`${selectedType.capacity}`}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor
              </label>
              <input
                type="text"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder={t('transport.typePlaceholder')}
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
                placeholder={t('transport.destinationPlaceholder')}
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
                placeholder="Notas adicionales..."
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
                {vehicle ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const RouteModal = ({ route, vehicles, onSave, onClose }) => {
  const [formData, setFormData] = useState(
    route || {
      type: 'hotel-ceremonia',
      customName: '',
      origin: '',
      destination: '',
      time: '',
      passengers: '',
      vehicleId: '',
      notes: '',
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.origin || !formData.destination) {
      toast.error('Origen y destino son obligatorios');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {route ? 'Editar ruta' : 'Nueva ruta'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de ruta
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROUTE_TYPES.map((type) => (
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
                    <span className="text-xl mb-1 block">{type.icon}</span>
                    <span className="text-xs text-gray-700">{type.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {formData.type === 'otro' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la ruta
                </label>
                <input
                  type="text"
                  value={formData.customName}
                  onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
                  placeholder="Ej: Casa novia → Ceremonia"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origen *
              </label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                placeholder="Dirección de origen"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destino *
              </label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="Dirección de destino"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pasajeros
                </label>
                <input
                  type="number"
                  value={formData.passengers}
                  onChange={(e) => setFormData({ ...formData, passengers: e.target.value })}
                  placeholder="Nº"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehículo asignado
              </label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Sin asignar</option>
                {vehicles.map((vehicle) => {
                  const type = VEHICLE_TYPES.find(t => t.id === vehicle.type);
                  return (
                    <option key={vehicle.id} value={vehicle.id}>
                      {type?.icon} {vehicle.name || type?.name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales..."
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
                {route ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function TransporteLogistica() {
  const { activeWedding } = useWedding();
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editingRoute, setEditingRoute] = useState(null);
  const [activeTab, setActiveTab] = useState('vehicles');

  useEffect(() => {
    if (!activeWedding) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const docRef = doc(db, 'weddings', activeWedding, 'logistics', 'transport');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setVehicles(data.vehicles || []);
          setRoutes(data.routes || []);
        }
      } catch (error) {
        console.error('Error loading transport data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeWedding]);

  const saveData = useCallback(async (newVehicles, newRoutes) => {
    if (!activeWedding) return;

    try {
      const docRef = doc(db, 'weddings', activeWedding, 'logistics', 'transport');
      await setDoc(docRef, {
        vehicles: newVehicles,
        routes: newRoutes,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving transport data:', error);
      toast.error('Error al guardar');
    }
  }, [activeWedding]);

  const handleSaveVehicle = useCallback((formData) => {
    let newVehicles;
    
    if (editingVehicle) {
      newVehicles = vehicles.map(v => 
        v.id === editingVehicle.id ? { ...formData, id: v.id } : v
      );
      toast.success('Vehículo actualizado');
    } else {
      const newVehicle = {
        ...formData,
        id: `vehicle-${Date.now()}`,
      };
      newVehicles = [...vehicles, newVehicle];
      toast.success('Vehículo añadido');
    }

    setVehicles(newVehicles);
    saveData(newVehicles, routes);
    setShowVehicleModal(false);
    setEditingVehicle(null);
  }, [vehicles, routes, editingVehicle, saveData]);

  const handleDeleteVehicle = useCallback((id) => {
    if (!confirm('¿Eliminar este vehículo?')) return;
    
    const newVehicles = vehicles.filter(v => v.id !== id);
    setVehicles(newVehicles);
    saveData(newVehicles, routes);
    toast.success('Vehículo eliminado');
  }, [vehicles, routes, saveData]);

  const handleSaveRoute = useCallback((formData) => {
    let newRoutes;
    
    if (editingRoute) {
      newRoutes = routes.map(r => 
        r.id === editingRoute.id ? { ...formData, id: r.id } : r
      );
      toast.success('Ruta actualizada');
    } else {
      const newRoute = {
        ...formData,
        id: `route-${Date.now()}`,
      };
      newRoutes = [...routes, newRoute];
      toast.success('Ruta añadida');
    }

    setRoutes(newRoutes);
    saveData(vehicles, newRoutes);
    setShowRouteModal(false);
    setEditingRoute(null);
  }, [routes, vehicles, editingRoute, saveData]);

  const handleDeleteRoute = useCallback((id) => {
    if (!confirm('¿Eliminar esta ruta?')) return;
    
    const newRoutes = routes.filter(r => r.id !== id);
    setRoutes(newRoutes);
    saveData(vehicles, newRoutes);
    toast.success('Ruta eliminada');
  }, [routes, vehicles, saveData]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando transporte...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const totalCapacity = vehicles.reduce((sum, v) => sum + (parseInt(v.capacity) || 0), 0);
  const totalPassengers = routes.reduce((sum, r) => sum + (parseInt(r.passengers) || 0), 0);

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Transporte y Logística</h1>
                <p className="text-sm text-gray-600">
                  Gestiona vehículos y rutas del evento
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">{vehicles.length}</div>
                <div className="text-xs text-gray-600">Vehículos</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">{totalCapacity}</div>
                <div className="text-xs text-gray-600">Capacidad total</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">{routes.length}</div>
                <div className="text-xs text-gray-600">Rutas</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">{totalPassengers}</div>
                <div className="text-xs text-gray-600">Pasajeros</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'vehicles'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Car className="w-5 h-5 inline mr-2" />
              Vehículos ({vehicles.length})
            </button>
            <button
              onClick={() => setActiveTab('routes')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'routes'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <MapPin className="w-5 h-5 inline mr-2" />
              Rutas ({routes.length})
            </button>
          </div>

          {/* Vehicles Tab */}
          {activeTab === 'vehicles' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Vehículos</h2>
                <button
                  onClick={() => {
                    setEditingVehicle(null);
                    setShowVehicleModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Añadir vehículo
                </button>
              </div>

              {vehicles.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay vehículos
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Añade los vehículos que usarás para el transporte
                  </p>
                  <button
                    onClick={() => setShowVehicleModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Añadir primer vehículo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicles.map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      onEdit={(v) => {
                        setEditingVehicle(v);
                        setShowVehicleModal(true);
                      }}
                      onDelete={handleDeleteVehicle}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Routes Tab */}
          {activeTab === 'routes' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Rutas</h2>
                <button
                  onClick={() => {
                    setEditingRoute(null);
                    setShowRouteModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Añadir ruta
                </button>
              </div>

              {routes.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No hay rutas
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Define las rutas de transporte del evento
                  </p>
                  <button
                    onClick={() => setShowRouteModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Añadir primera ruta
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {routes.map((route) => (
                    <RouteCard
                      key={route.id}
                      route={route}
                      vehicles={vehicles}
                      onEdit={(r) => {
                        setEditingRoute(r);
                        setShowRouteModal(true);
                      }}
                      onDelete={handleDeleteRoute}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        {showVehicleModal && (
          <VehicleModal
            vehicle={editingVehicle}
            onSave={handleSaveVehicle}
            onClose={() => {
              setShowVehicleModal(false);
              setEditingVehicle(null);
            }}
          />
        )}

        {showRouteModal && (
          <RouteModal
            route={editingRoute}
            vehicles={vehicles}
            onSave={handleSaveRoute}
            onClose={() => {
              setShowRouteModal(false);
              setEditingRoute(null);
            }}
          />
        )}
      </div>
    </PageWrapper>
  );
}
