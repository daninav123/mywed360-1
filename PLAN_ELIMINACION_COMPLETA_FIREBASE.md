# 🔥 PLAN: ELIMINAR FIREBASE 100% - AUTH INCLUIDO

**Objetivo:** Eliminar Firebase completamente, incluyendo Auth  
**Resultado:** PostgreSQL para autenticación + datos  
**Tiempo estimado:** 12-15 horas totales

---

## 📋 FASES DEL PLAN

### **FASE 1: Firestore → PostgreSQL (5-7h)**

#### **1.1 Reemplazar useActiveWeddingInfo (2h)**
- 15 archivos a modificar
- Reemplazar por useWeddingData (ya migrado)

#### **1.2 Reemplazar useWeddingInfoSync (15min)**
- 1 archivo: InfoBoda.jsx

#### **1.3 Reemplazar useWeddingCollection (3h)**
- 10+ componentes
- Reemplazar por hooks específicos

#### **1.4 Limpiar helpers deprecated (1h)**
- Verificar usos
- Eliminar no usados

---

### **FASE 2: Firebase Auth → PostgreSQL Auth (7-8h)**

#### **2.1 Crear schema Auth en PostgreSQL (30min)**
```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String   // bcrypt hash
  emailVerified Boolean  @default(false)
  verificationToken String?
  resetToken    String?
  resetTokenExpiry DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  profile       UserProfile?
  weddings      Wedding[]
  // ... relaciones existentes
}

model UserProfile {
  id        String   @id @default(uuid())
  userId    String   @unique
  name      String?
  phone     String?
  role      String?
  settings  Json?
  user      User     @relation(fields: [userId], references: [id])
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

#### **2.2 Crear API de autenticación (3h)**
```javascript
// backend/routes/auth.js
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
POST   /api/auth/verify-email
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
PATCH  /api/auth/change-password
```

#### **2.3 Implementar JWT (2h)**
- Generar tokens JWT
- Middleware de autenticación
- Refresh tokens
- Validación de tokens

#### **2.4 Migrar useAuth.jsx (2h)**
- Reemplazar Firebase Auth por API custom
- Mantener misma interfaz
- Actualizar contexto
- Testing

#### **2.5 Migrar datos de usuarios (30min)**
- Script migración Firebase Users → PostgreSQL
- Migrar perfiles
- Verificar integridad

---

### **FASE 3: Limpieza y verificación (1h)**

#### **3.1 Eliminar Firebase**
- Remover dependencias de package.json
- Eliminar firebaseConfig.js
- Limpiar imports

#### **3.2 Verificación**
- Probar login/registro
- Probar todas las páginas
- Confirmar 0 dependencias Firebase

---

## 🔧 IMPLEMENTACIÓN DETALLADA

### **PASO 1: Schema PostgreSQL Auth**

```bash
cd backend
# Editar schema.prisma
npx prisma db push
```

### **PASO 2: API Auth Backend**

```javascript
// backend/routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Verificar si existe
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email ya registrado' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: {
          create: { name }
        }
      },
      include: { profile: true }
    });
    
    // Generar token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ user: { id: user.id, email: user.email, profile: user.profile }, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ user: { id: user.id, email: user.email, profile: user.profile }, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { profile: true, weddings: true }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

export default router;
```

### **PASO 3: Nuevo useAuth.jsx**

```javascript
// apps/main-app/src/hooks/useAuth.js
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, []);
  
  const fetchCurrentUser = async (token) => {
    try {
      const { data } = await axios.get('http://localhost:4004/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(data.user);
    } catch (error) {
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };
  
  const login = async (email, password) => {
    const { data } = await axios.post('http://localhost:4004/api/auth/login', {
      email, password
    });
    localStorage.setItem('authToken', data.token);
    setCurrentUser(data.user);
    return data.user;
  };
  
  const register = async (email, password, name) => {
    const { data } = await axios.post('http://localhost:4004/api/auth/register', {
      email, password, name
    });
    localStorage.setItem('authToken', data.token);
    setCurrentUser(data.user);
    return data.user;
  };
  
  const logout = () => {
    localStorage.removeItem('authToken');
    setCurrentUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ currentUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### **Seguridad:**
1. ✅ Usar HTTPS en producción
2. ✅ bcrypt para passwords (salt rounds: 10)
3. ✅ JWT con secret fuerte
4. ✅ Tokens con expiración
5. ✅ Refresh tokens
6. ✅ Rate limiting en login
7. ✅ Validación de emails

### **Migración de datos:**
```javascript
// Script migración users
// Copiar usuarios de Firebase → PostgreSQL
// Enviar emails para resetear passwords
// (Firebase passwords no son exportables)
```

### **Perdidas aceptables:**
- ❌ Passwords de Firebase (no exportables)
- ✅ Solución: Email para crear nueva password
- ✅ OAuth social (Google, etc.) - requiere implementación custom

---

## 📊 COMPARACIÓN

### **CON Firebase Auth:**
✅ Gratis hasta 50K usuarios  
✅ OAuth integrado  
✅ Email verification automático  
✅ Password reset automático  
❌ Dependencia externa  
❌ Vendor lock-in  

### **CON Auth Custom PostgreSQL:**
✅ Control total  
✅ Sin dependencias externas  
✅ Datos en tu DB  
✅ Personalizable  
❌ Mantener seguridad  
❌ Implementar OAuth si necesitas  
❌ Más código a mantener  

---

## ⏱️ TIEMPO TOTAL ESTIMADO

| Fase | Tiempo | Complejidad |
|------|--------|-------------|
| Fase 1: Firestore → PG | 5-7h | Media |
| Fase 2: Auth → PG | 7-8h | Alta |
| Fase 3: Limpieza | 1h | Baja |
| **TOTAL** | **13-16h** | **Alta** |

---

## 🚀 ORDEN DE EJECUCIÓN

1. ✅ Completar Fase 1 (Firestore → PostgreSQL)
2. ✅ Crear schema Auth en PostgreSQL
3. ✅ Implementar API Auth backend
4. ✅ Migrar useAuth.jsx
5. ✅ Script migración usuarios
6. ✅ Probar login/registro
7. ✅ Eliminar Firebase
8. ✅ Verificación final

---

## ✅ RESULTADO FINAL

**Firebase:** 0% (eliminado completamente)  
**PostgreSQL:** 100% (auth + datos)  
**Control:** 100% (sin dependencias externas)

---

**¿Procedo con el plan completo de 13-16 horas?**
