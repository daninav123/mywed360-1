# ⏳ PENDIENTE: Sistema de Asignar Proveedores a Servicios

**Estado:** Backend completo ✅ | Frontend pendiente ⏳

---

## ✅ **COMPLETADO:**

### **Backend API** (Commit: `898bf690`)

- ✅ `backend/routes/wedding-services.js` creado
- ✅ Registrado en `backend/index.js`
- ✅ Rutas protegidas con autenticación

**Endpoints disponibles:**

```javascript
GET    /api/weddings/:weddingId/services
POST   /api/weddings/:weddingId/services/:serviceId/assign
PUT    /api/weddings/:weddingId/services/:serviceId/status
DELETE /api/weddings/:weddingId/services/:serviceId/assigned
POST   /api/weddings/:weddingId/services/:serviceId/payments
```

---

## ⏳ **PENDIENTE (Frontend):**

### **1. Hook: `useWeddingServices`**

**Archivo:** `src/hooks/useWeddingServices.js`

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useWedding } from '../context/WeddingContext';

export function useWeddingServices() {
  const { user } = useAuth();
  const { activeWedding } = useWedding();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

  // Cargar servicios
  const loadServices = async () => {
    if (!user || !activeWedding) {
      setServices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = await user.getIdToken();
      const response = await axios.get(`${API_URL}/api/weddings/${activeWedding}/services`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setServices(response.data.services || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  // Asignar proveedor
  const assignSupplier = async (serviceId, supplier, price, notes, status = 'interesado') => {
    if (!user || !activeWedding) return;

    const token = await user.getIdToken();
    const response = await axios.post(
      `${API_URL}/api/weddings/${activeWedding}/services/${serviceId}/assign`,
      { supplier, price, currency: 'EUR', notes, status },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Recargar servicios
    await loadServices();
    return response.data;
  };

  // Actualizar estado
  const updateServiceStatus = async (serviceId, status) => {
    if (!user || !activeWedding) return;

    const token = await user.getIdToken();
    await axios.put(
      `${API_URL}/api/weddings/${activeWedding}/services/${serviceId}/status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await loadServices();
  };

  // Quitar proveedor
  const removeAssignedSupplier = async (serviceId) => {
    if (!user || !activeWedding) return;

    const token = await user.getIdToken();
    await axios.delete(`${API_URL}/api/weddings/${activeWedding}/services/${serviceId}/assigned`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    await loadServices();
  };

  useEffect(() => {
    loadServices();
  }, [user, activeWedding]);

  return {
    services,
    loading,
    assignSupplier,
    updateServiceStatus,
    removeAssignedSupplier,
    refreshServices: loadServices,
  };
}
```

---

### **2. Modal: `AssignSupplierModal`**

**Archivo:** `src/components/suppliers/AssignSupplierModal.jsx`

```jsx
import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { SUPPLIER_CATEGORIES } from '../../../shared/supplierCategories';
import Button from '../ui/Button';
import Input from '../Input';
import { toast } from 'react-toastify';

export default function AssignSupplierModal({ supplier, open, onClose, onAssign }) {
  const [selectedService, setSelectedService] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('interesado');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedService) {
      toast.error('Selecciona un servicio');
      return;
    }

    setLoading(true);
    try {
      await onAssign(selectedService, supplier, parseFloat(price) || null, notes, status);
      toast.success('Proveedor asignado correctamente');
      onClose();
    } catch (error) {
      toast.error('Error al asignar proveedor');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Asignar a Servicio</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Proveedor */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Proveedor seleccionado:</p>
            <p className="font-semibold">{supplier.name}</p>
          </div>

          {/* Servicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Servicio *</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Seleccionar servicio...</option>
              {SUPPLIER_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado inicial</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="interesado">Interesado</option>
              <option value="cotizando">Cotizando</option>
              <option value="contratado">Contratado</option>
            </select>
          </div>

          {/* Precio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio estimado (€)
            </label>
            <Input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="1500.00"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              rows="3"
              placeholder="Notas sobre este proveedor..."
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Asignando...' : 'Asignar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

### **3. Actualizar `WeddingServiceCard`**

**Archivo:** `src/components/wedding/WeddingServiceCard.jsx`

Usar el hook `useWeddingServices` y mostrar el proveedor asignado desde Firestore en lugar de props.

---

### **4. Añadir botón en `SupplierCard`**

**Archivo:** `src/components/suppliers/SupplierCard.jsx`

Añadir botón "Asignar a servicio" que abra `AssignSupplierModal`.

---

### **5. Integrar en FavoritesSection**

**Archivo:** `src/components/suppliers/FavoritesSection.jsx`

Añadir botón para asignar proveedor favorito a un servicio.

---

## 📊 **FLUJO COMPLETO:**

```
Usuario busca proveedor
    ↓
Guarda en favoritos ⭐
    ↓
Click "Asignar a servicio" ➕
    ↓
Modal: Seleccionar servicio (Fotografía, Catering, etc.)
    ↓
Guardar precio estimado y notas
    ↓
Estado: Interesado → Cotizando → Contratado → Confirmado → Pagado
    ↓
Tarjeta de servicio muestra proveedor asignado ✅
```

---

## 🎨 **ESTADOS VISUALES:**

```javascript
const statusColors = {
  interesado: 'bg-blue-100 text-blue-800', // 🔵
  cotizando: 'bg-yellow-100 text-yellow-800', // 🟡
  contratado: 'bg-orange-100 text-orange-800', // 🟠
  confirmado: 'bg-green-100 text-green-800', // 🟢
  pagado: 'bg-purple-100 text-purple-800', // 🟣
};
```

---

## ✅ **CHECKLIST:**

- [ ] Crear `src/hooks/useWeddingServices.js`
- [ ] Crear `src/components/suppliers/AssignSupplierModal.jsx`
- [ ] Actualizar `src/components/wedding/WeddingServiceCard.jsx`
- [ ] Añadir botón en `src/components/suppliers/SupplierCard.jsx`
- [ ] Integrar en `src/components/suppliers/FavoritesSection.jsx`
- [ ] Añadir traducciones i18n
- [ ] Probar flujo completo
- [ ] Documentar en README

---

## 🚀 **PARA CONTINUAR:**

1. Crear los 3 archivos del frontend listados arriba
2. Probar asignación desde favoritos
3. Verificar que la tarjeta de servicio se actualiza
4. Implementar cambios de estado
5. Implementar registro de pagos (opcional)

---

**🕐 Última actualización:** 30 Oct 2025 - 1:25am  
**📝 Estado:** Backend completo, frontend pendiente  
**🎯 Próximo paso:** Crear hook useWeddingServices
