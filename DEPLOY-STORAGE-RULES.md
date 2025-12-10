# 📋 Cómo Desplegar las Reglas de Firebase Storage

Las reglas de Storage en `storage.rules` deben desplegarse manualmente desde Firebase Console.

## 🔧 Pasos para Desplegar:

### Opción 1: Firebase Console (Recomendado)

1. Ve a [Firebase Console](https://console.firebase.google.com/project/lovenda-98c77/storage/rules)

2. Selecciona el proyecto **lovenda-98c77**

3. Ve a **Storage** → **Rules**

4. Copia y pega el contenido de `storage.rules`:

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    // Suppliers portfolio images
    match /suppliers/{supplierId}/portfolio/{allPaths=**} {
      allow read: if true;
      allow write, delete: if request.auth != null &&
                               request.auth.token.supplierId == supplierId;
    }

    // Wedding photos and documents
    match /weddings/{weddingId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write, delete: if request.auth != null;
    }

    // User profile images
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write, delete: if request.auth != null && request.auth.uid == userId;
    }

    // Public assets
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Web galleries - for Craft.js web builder
    match /web-galleries/{imageId} {
      allow read: if true;
      allow write: if request.auth != null &&
                     request.resource.size < 5 * 1024 * 1024 &&
                     request.resource.contentType.matches('image/.*');
      allow delete: if request.auth != null;
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

5. Haz clic en **Publish**

### Opción 2: Firebase CLI

```bash
firebase deploy --only storage
```

## ✅ Reglas Añadidas para Web Galleries:

- **Lectura pública**: Cualquiera puede ver las imágenes
- **Escritura autenticada**: Solo usuarios logueados pueden subir
- **Validación**:
  - Máximo 5MB por imagen
  - Solo archivos de tipo `image/*`
- **Eliminación**: Solo usuarios autenticados

## 📍 Ubicación de Imágenes:

Las imágenes de galerías se guardan en:

```
/web-galleries/{timestamp}_{random}.{ext}
```

Ejemplo:

```
/web-galleries/1701234567_abc123.jpg
```
