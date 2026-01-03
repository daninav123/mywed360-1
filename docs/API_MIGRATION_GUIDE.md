# Guía de Migración a Nuevo Formato de API

**Fecha:** 20 de octubre de 2025  
**Versión:** 1.0  
**Autor:** Sistema de Alineación con Documentación

## Introducción

Esta guía te ayudará a migrar tu código para trabajar con el nuevo formato estandarizado de respuestas API, definido en `docs/API_CONVENTIONS.md`.

## Cambios en el Formato de Respuesta

### Antes (Formato Antiguo)

```javascript
// Respuesta exitosa
{
  "token": "abc123",
  "link": "https://example.com/rsvp/abc123"
}

// Respuesta de error
{
  "error": "not_found"
}
// o
{
  "error": "validation_error",
  "message": "Email is required"
}
```

### Ahora (Formato Nuevo)

```javascript
// Respuesta exitosa
{
  "success": true,
  "data": {
    "token": "abc123",
    "link": "https://example.com/rsvp/abc123"
  }
}

// Respuesta de error
{
  "success": false,
  "error": {
    "code": "not_found",
    "message": "Resource not found"
  },
  "requestId": "uuid-1234-5678"
}
```

## Migración del Frontend

### Opción 1: Usar el Cliente API Nuevo (Recomendado)

El nuevo cliente API (`src/utils/apiClient.js`) maneja automáticamente ambos formatos:

```javascript
// Importar el cliente
import { apiGet, apiPost, handleApiError } from '@/utils/apiClient';

// Ejemplo de uso
async function inviteGuest(weddingId, guestData) {
  try {
    // El cliente devuelve directamente los datos
    const { token, link } = await apiPost(
      `/api/guests/${weddingId}/invite`,
      guestData
    );
    
    console.log('Token:', token);
    console.log('Link:', link);
    return { token, link };
  } catch (error) {
    // Manejar error con información detallada
    handleApiError(error, showNotification);
    throw error;
  }
}
```

### Opción 2: Migración Manual

Si prefieres no usar el cliente API, actualiza tus llamadas manualmente:

#### ANTES
```javascript
async function getData() {
  const response = await fetch('/api/guests/123/abc');
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.message || data.error);
  }
  
  return data; // { name: '...', status: '...', ... }
}
```

#### DESPUÉS
```javascript
async function getData() {
  const response = await fetch('/api/guests/123/abc');
  const result = await response.json();
  
  if (!result.success) {
    const error = new Error(result.error?.message || 'Error occurred');
    error.code = result.error?.code;
    error.requestId = result.requestId;
    throw error;
  }
  
  return result.data; // { name: '...', status: '...', ... }
}
```

### Opción 3: Wrapper de Compatibilidad

Crea un wrapper que normalice ambos formatos:

```javascript
// src/utils/legacyApiWrapper.js
export async function fetchAPI(url, options = {}) {
  const response = await fetch(url, options);
  const result = await response.json();
  
  // Detectar formato nuevo
  if (typeof result.success === 'boolean') {
    if (!result.success) {
      const error = new Error(result.error?.message || 'API Error');
      error.code = result.error?.code;
      error.requestId = result.requestId;
      throw error;
    }
    return result.data;
  }
  
  // Formato antiguo
  if (result.error) {
    throw new Error(result.message || result.error);
  }
  
  return result;
}
```

## Endpoints Migrados

### ✅ Completamente Migrados

Los siguientes endpoints ya usan el nuevo formato:

#### backend/routes/ai.js
- `GET /api/ai/debug-env` (requiere admin)
- `POST /api/ai/parse-dialog`
- `GET /api/ai/search-suppliers`

#### backend/routes/guests.js
- `POST /api/guests/:weddingId/invite`
- `GET /api/guests/:weddingId/:token`
- `PUT /api/guests/:weddingId/:token`
- `POST /api/guests/:weddingId/id/:docId/rsvp-link`

### ⚠️ Pendientes de Migración

Los siguientes endpoints aún usan el formato antiguo y requieren migración:

- `backend/routes/mail.js`
- `backend/routes/mail-ops.js`
- `backend/routes/suppliers.js`
- `backend/routes/automation.js`
- `backend/routes/contracts.js`
- Y otros...

## Patrones de Migración por Caso de Uso

### 1. Formularios con Validación

#### ANTES
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await fetch('/api/guests/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await response.json();
    
    if (data.error) {
      setError(data.message || 'Error creating guest');
      return;
    }
    
    setSuccess(true);
    navigate(`/rsvp/${data.token}`);
  } catch (err) {
    setError('Network error');
  }
};
```

#### DESPUÉS
```javascript
import { apiPost, ApiError } from '@/utils/apiClient';

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const { token, link } = await apiPost('/api/guests/invite', formData);
    
    setSuccess(true);
    navigate(`/rsvp/${token}`);
  } catch (err) {
    if (err instanceof ApiError) {
      // Error de API con información detallada
      setError(err.message);
      console.log('Error code:', err.code);
      console.log('Request ID:', err.requestId);
    } else {
      setError('Network error');
    }
  }
};
```

### 2. Carga de Datos con useEffect

#### ANTES
```javascript
useEffect(() => {
  fetch(`/api/guests/${weddingId}/${token}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        setError(data.message);
      } else {
        setGuest(data);
      }
    })
    .catch(err => setError('Failed to load'));
}, [weddingId, token]);
```

#### DESPUÉS
```javascript
import { apiGet } from '@/utils/apiClient';

useEffect(() => {
  const loadGuest = async () => {
    try {
      const guestData = await apiGet(`/api/guests/${weddingId}/${token}`);
      setGuest(guestData);
    } catch (err) {
      setError(err.message || 'Failed to load');
    }
  };
  
  loadGuest();
}, [weddingId, token]);
```

### 3. Listas Paginadas

```javascript
import { apiGet } from '@/utils/apiClient';

async function loadGuests(cursor = null) {
  try {
    const url = cursor 
      ? `/api/guests?cursor=${cursor}`
      : '/api/guests';
    
    // Si el endpoint usa sendPaginated, la respuesta será:
    // { items: [...], nextCursor: '...' }
    const { items, nextCursor } = await apiGet(url);
    
    setGuests(prevGuests => [...prevGuests, ...items]);
    setNextCursor(nextCursor);
  } catch (error) {
    console.error('Failed to load guests:', error);
  }
}
```

## Manejo de Errores Mejorado

### Códigos de Error Estándar

El nuevo formato incluye códigos de error consistentes:

```javascript
// backend/utils/response.js define estos códigos:
- 'validation_error'   // 400 - Error de validación
- 'unauthorized'       // 401 - No autenticado
- 'forbidden'          // 403 - Sin permisos
- 'not_found'          // 404 - Recurso no encontrado
- 'rate_limit'         // 429 - Rate limit excedido
- 'internal_error'     // 500 - Error del servidor
- 'service_unavailable' // 503 - Servicio no disponible
```

### Manejo por Tipo de Error

```javascript
import { apiPost, ApiError, handleApiError } from '@/utils/apiClient';

try {
  const result = await apiPost('/api/ai/parse-dialog', { text: input });
  // Usar resultado...
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'validation_error':
        showNotification('Por favor verifica los datos ingresados');
        break;
      case 'rate_limit':
        showNotification('Demasiadas solicitudes. Espera un momento.');
        break;
      case 'service_unavailable':
        showNotification('El servicio no está disponible. Intenta más tarde.');
        break;
      case 'unauthorized':
        // Redirigir al login
        navigate('/login');
        break;
      default:
        showNotification(`Error: ${error.message}`);
    }
    
    // Registrar para debugging
    if (error.requestId) {
      console.log(`Request ID para soporte: ${error.requestId}`);
    }
  }
}
```

## Testing

### Tests del Frontend

```javascript
import { describe, it, expect, vi } from 'vitest';
import { apiGet, ApiError } from '@/utils/apiClient';

describe('Guest API Integration', () => {
  it('should handle new API format', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          name: 'John Doe',
          status: 'pending'
        }
      })
    });
    
    const guest = await apiGet('/api/guests/w1/t1');
    expect(guest.name).toBe('John Doe');
  });
  
  it('should handle API errors correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        success: false,
        error: {
          code: 'not_found',
          message: 'Guest not found'
        },
        requestId: 'req-123'
      })
    });
    
    await expect(apiGet('/api/guests/w1/invalid')).rejects.toThrow(ApiError);
  });
});
```

## Migración del Backend

### Para Nuevas Rutas

Usa siempre las utilidades de respuesta:

```javascript
import express from 'express';
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendInternalError,
} from '../utils/response.js';

const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return sendValidationError(res, 'ID is required', null, req);
    }
    
    const item = await findById(id);
    
    if (!item) {
      return sendNotFound(res, 'Item not found', req);
    }
    
    return sendSuccess(res, item);
  } catch (error) {
    return sendInternalError(res, error, req);
  }
});

export default router;
```

### Para Rutas Existentes

Reemplaza respuestas directas con utilidades:

#### ANTES
```javascript
router.get('/:id', async (req, res) => {
  try {
    const item = await findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'not_found' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
});
```

#### DESPUÉS
```javascript
import { sendSuccess, sendNotFound, sendInternalError } from '../utils/response.js';

router.get('/:id', async (req, res) => {
  try {
    const item = await findById(req.params.id);
    if (!item) {
      return sendNotFound(res, 'Item not found', req);
    }
    return sendSuccess(res, item);
  } catch (err) {
    return sendInternalError(res, err, req);
  }
});
```

## Checklist de Migración

### Frontend
- [ ] Instalar/actualizar `src/utils/apiClient.js`
- [ ] Identificar todos los archivos que hacen llamadas a API
- [ ] Reemplazar llamadas directas con el cliente API
- [ ] Actualizar manejo de errores
- [ ] Añadir tests
- [ ] Probar en desarrollo
- [ ] Verificar en staging

### Backend
- [ ] Importar utilidades de respuesta en rutas afectadas
- [ ] Reemplazar respuestas directas con utilidades
- [ ] Añadir tests unitarios
- [ ] Verificar que requestId se incluye en errores
- [ ] Actualizar documentación de API
- [ ] Probar endpoints manualmente
- [ ] Ejecutar suite de tests

## Soporte y Ayuda

### Recursos
- 📄 `docs/API_CONVENTIONS.md` - Convenciones completas
- 📄 `docs/IMPLEMENTATION_CHANGES_SUMMARY.md` - Resumen de cambios
- 📄 `docs/IMPLEMENTATION_GAPS_REPORT.md` - Análisis detallado
- 💻 `src/utils/apiClient.js` - Cliente API frontend
- 💻 `backend/utils/response.js` - Utilidades backend
- 🧪 `backend/__tests__/utils/response.test.js` - Tests de ejemplo

### ¿Preguntas?
- Revisa los ejemplos en este documento
- Consulta el código de los endpoints migrados
- Busca patrones similares en tu caso de uso

## Versionado

Esta guía se actualiza conforme se migran más endpoints. Revisa la fecha en el encabezado para verificar que tienes la versión más reciente.

**Última actualización:** 20 de octubre de 2025
