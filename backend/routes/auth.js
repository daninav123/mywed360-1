import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../services/emailResetService.js';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRATION = '7d';
const REFRESH_TOKEN_EXPIRATION = 30; // días

// Helper: generar token JWT
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
}

// Helper: generar refresh token
function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

// POST /api/auth/register - Registro de nuevo usuario
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validación
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password debe tener al menos 6 caracteres' });
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email ya registrado' });
    }

    // Hash del password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generar verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Crear usuario con perfil
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name: name || null,
        verificationToken,
        profile: {
          create: {
            role: 'user',
            settings: {},
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Generar tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken();

    // Crear sesión
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRATION);

    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    // Respuesta (sin password hash)
    const { passwordHash: _, verificationToken: __, ...userData } = user;

    res.status(201).json({
      user: userData,
      token,
      refreshToken,
      message: 'Usuario creado exitosamente',
    });
  } catch (error) {
    console.error('[Auth] Error en register:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// POST /api/auth/login - Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password requeridos' });
    }

    console.log('[Auth] Login attempt:', email.toLowerCase());

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true },
    });

    if (!user) {
      console.log('[Auth] Usuario no encontrado:', email.toLowerCase());
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    console.log('[Auth] Usuario encontrado. passwordHash existe:', !!user.passwordHash);
    console.log('[Auth] passwordHash length:', user.passwordHash?.length || 0);

    if (!user.passwordHash) {
      console.log('[Auth] Usuario sin passwordHash - requiere migración de Firebase');
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    console.log('[Auth] Password válida:', validPassword);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    console.log('[Auth] Generando tokens...');
    // Generar tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken();
    console.log('[Auth] Tokens generados. Token length:', token?.length, 'RefreshToken length:', refreshToken?.length);

    // Crear sesión
    console.log('[Auth] Creando sesión...');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRATION);

    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });
    console.log('[Auth] Sesión creada exitosamente');

    // Respuesta
    const { passwordHash: _, verificationToken: __, resetToken: ___, ...userData } = user;

    console.log('[Auth] Enviando respuesta exitosa');
    res.json({
      user: userData,
      token,
      refreshToken,
      message: 'Login exitoso',
    });
    console.log('[Auth] Login completado exitosamente');
  } catch (error) {
    console.error('[Auth] Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// GET /api/auth/me - Obtener usuario actual
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        profile: true,
        weddings: {
          select: {
            id: true,
            coupleName: true,
            weddingDate: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Respuesta sin datos sensibles
    const { passwordHash: _, verificationToken: __, resetToken: ___, ...userData } = user;

    res.json({ user: userData });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    console.error('[Auth] Error en /me:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Eliminar sesión
      await prisma.session.deleteMany({
        where: { token: refreshToken },
      });
    }

    res.json({ message: 'Sesión cerrada' });
  } catch (error) {
    console.error('[Auth] Error en logout:', error);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
});

// POST /api/auth/refresh - Refrescar token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    // Buscar sesión
    const session = await prisma.session.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { profile: true } } },
    });

    if (!session) {
      return res.status(401).json({ error: 'Sesión inválida' });
    }

    // Verificar expiración
    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } });
      return res.status(401).json({ error: 'Sesión expirada' });
    }

    // Generar nuevo token JWT
    const token = generateToken(session.userId);

    res.json({ token });
  } catch (error) {
    console.error('[Auth] Error en refresh:', error);
    res.status(500).json({ error: 'Error al refrescar token' });
  }
});

// POST /api/auth/forgot-password - Solicitar reset de password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // No revelar si el email existe o no (seguridad)
    if (!user) {
      return res.json({ message: 'Si el email existe, recibirás instrucciones' });
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Enviar email con link de reset
    const emailResult = await sendPasswordResetEmail(user.email, resetToken);
    
    if (!emailResult.success) {
      console.error('[Auth] Error al enviar email de reset:', emailResult.error);
      // No revelamos el error al usuario por seguridad
    }
    
    res.json({
      message: 'Si el email existe, recibirás instrucciones',
      // Solo en desarrollo, devolver token para testing
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    });
  } catch (error) {
    console.error('[Auth] Error en forgot-password:', error);
    res.status(500).json({ error: 'Error al procesar solicitud' });
  }
});

// POST /api/auth/reset-password - Resetear password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Token y nueva password requeridos' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password debe tener al menos 6 caracteres' });
    }

    // Buscar usuario con token válido
    const user = await prisma.user.findFirst({
      where: {
        resetToken,
        resetTokenExpiry: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    // Hash nueva password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Actualizar password y limpiar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Invalidar todas las sesiones del usuario
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    res.json({ message: 'Password actualizada exitosamente' });
  } catch (error) {
    console.error('[Auth] Error en reset-password:', error);
    res.status(500).json({ error: 'Error al resetear password' });
  }
});

// PATCH /api/auth/change-password - Cambiar password (usuario autenticado)
router.patch('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Passwords requeridas' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Nueva password debe tener al menos 6 caracteres' });
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar password actual
    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Password actual incorrecta' });
    }

    // Hash nueva password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Actualizar
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    res.json({ message: 'Password actualizada exitosamente' });
  } catch (error) {
    console.error('[Auth] Error en change-password:', error);
    res.status(500).json({ error: 'Error al cambiar password' });
  }
});

export default router;
