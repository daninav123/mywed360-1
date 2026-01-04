import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../services/emailResetService.js';
import { sendSuccess, sendValidationError, sendInternalError } from '../utils/apiResponse.js';
import { generateUserEmailAliases } from '../utils/emailAliasGenerator.js';
import { requireAuth } from '../middleware/authMiddleware.js';

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
    const {
      email,
      password,
      role = 'particular',
      fullName,
      weddingInfo,
      plannerInfo,
      assistantInfo,
    } = req.body;

    console.log('[Auth] Register attempt:', {
      email,
      hasPassword: !!password,
      passwordLength: password?.length,
    });

    // Validación
    if (!email || !password) {
      return sendValidationError(req, res, [{ message: 'Email y password requeridos' }]);
    }

    if (password.length < 8) {
      return sendValidationError(req, res, [
        { message: 'Password debe tener al menos 8 caracteres' },
      ]);
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return sendValidationError(req, res, [{ message: 'Email ya registrado' }]);
    }

    console.log('[Auth] Hasheando password...');
    // Hash del password
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('[Auth] Password hasheado correctamente');

    // Generar verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Mapear rol del formulario a UserRole de Prisma
    const roleMap = {
      particular: 'OWNER',
      planner: 'PLANNER',
      assistant: 'ASSISTANT',
      supplier: 'SUPPLIER',
    };
    const prismaRole = roleMap[role] || 'OWNER';

    // Generar alias de email único @planivia.net
    const emailAliases = await generateUserEmailAliases(fullName || email, prisma);
    console.log('[Auth] Email aliases generados:', emailAliases);

    // Crear usuario con perfil
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        verificationToken,
        role: prismaRole,
        profile: {
          create: {
            role: role,
            phone:
              weddingInfo?.phone || plannerInfo?.professionalPhone || assistantInfo?.phone || null,
            planiviaEmail: emailAliases.planiviaEmail,
            settings: {},
            metadata: {
              fullName: fullName || null,
              ...(plannerInfo && { plannerInfo }),
              ...(assistantInfo && { assistantInfo }),
            },
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

    // Si es particular, crear boda inicial con weddingInfo
    if (role === 'particular') {
      try {
        const weddingDate = weddingInfo?.weddingDate ? new Date(weddingInfo.weddingDate) : null;

        const wedding = await prisma.wedding.create({
          data: {
            userId: user.id,
            coupleName: weddingInfo?.coupleName || `Boda de ${fullName}`,
            weddingDate: weddingDate,
            celebrationCity: weddingInfo?.celebrationCity || null,
            celebrationPlace: null,
            celebrationAddress: null,
            banquetPlace: null,
            receptionAddress: null,
            schedule: null,
            numGuests: 0,
            status: 'planning',
            access: {
              create: {
                userId: user.id,
                role: 'OWNER',
                permissions: {},
                status: 'active',
              },
            },
          },
        });
        console.log('[Auth] Boda inicial creada para particular:', wedding.id);
      } catch (weddingError) {
        console.error('[Auth] Error creando boda inicial:', weddingError);
        console.error('[Auth] Error details:', weddingError.message);
        // No fallar el registro si falla la creación de la boda
      }
    }

    // Respuesta (sin password hash)
    const { passwordHash: _, verificationToken: __, resetToken: ___, ...userData } = user;

    // COMPATIBILIDAD: Alias temporal myWed360Email -> planiviaEmail
    if (userData.profile?.planiviaEmail && !userData.profile?.myWed360Email) {
      userData.profile.myWed360Email = userData.profile.planiviaEmail;
    }

    console.log('[Auth] Registro exitoso:', userData.email);
    return sendSuccess(
      req,
      res,
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
        },
        token,
        refreshToken,
      },
      201
    );
  } catch (error) {
    console.error('[Auth] Error en registro:', error);
    console.error('[Auth] Error stack:', error.stack);
    console.error('[Auth] Error message:', error.message);
    return sendInternalError(req, res, error);
  }
});

// POST /api/auth/login - Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendValidationError(req, res, [{ message: 'Email y password requeridos' }]);
    }

    console.log('[Auth] Login attempt:', email.toLowerCase());

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true },
    });

    if (!user) {
      console.log('[Auth] Usuario no encontrado:', email.toLowerCase());
      return sendValidationError(req, res, [{ message: 'Credenciales inválidas' }]);
    }

    // Validación de passwordHash (logs sensibles removidos por seguridad)

    if (!user.passwordHash) {
      console.log('[Auth] Usuario sin passwordHash - requiere migración de Firebase');
      return sendValidationError(req, res, [{ message: 'Credenciales inválidas' }]);
    }

    // Verificar password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    console.log('[Auth] Password válida:', validPassword);

    if (!validPassword) {
      return sendValidationError(req, res, [{ message: 'Credenciales inválidas' }]);
    }

    console.log('[Auth] Generando tokens...');
    // Generar tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken();
    console.log(
      '[Auth] Tokens generados. Token length:',
      token?.length,
      'RefreshToken length:',
      refreshToken?.length
    );

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

    // COMPATIBILIDAD: Alias temporal myWed360Email -> planiviaEmail
    if (userData.profile?.planiviaEmail && !userData.profile?.myWed360Email) {
      userData.profile.myWed360Email = userData.profile.planiviaEmail;
    }

    console.log('[Auth] Enviando respuesta exitosa');
    return sendSuccess(req, res, {
      user: userData,
      token,
      refreshToken,
    });
  } catch (error) {
    console.error('[Auth] Error en login:', error);
    return sendInternalError(req, res, error);
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

    // COMPATIBILIDAD: Alias temporal myWed360Email -> planiviaEmail
    if (userData.profile?.planiviaEmail && !userData.profile?.myWed360Email) {
      userData.profile.myWed360Email = userData.profile.planiviaEmail;
    }

    return sendSuccess(req, res, { user: userData });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return sendInternalError(req, res, new Error('Error en el login'));
    }
    console.error('[Auth] Error en /me:', error);
    return sendInternalError(req, res, error);
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

    return sendSuccess(req, res, { message: 'Sesión cerrada' });
  } catch (error) {
    console.error('[Auth] Error en logout:', error);
    return sendInternalError(req, res, error);
  }
});

// POST /api/auth/refresh - Refrescar token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendValidationError(req, res, [{ message: 'Refresh token requerido' }]);
    }

    // Buscar sesión
    const session = await prisma.session.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { profile: true } } },
    });

    if (!session) {
      return sendValidationError(req, res, [{ message: 'Sesión inválida' }]);
    }

    // Verificar expiración
    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } });
      return sendValidationError(req, res, [{ message: 'Sesión expirada' }]);
    }

    // Generar nuevo token JWT
    const token = generateToken(session.userId);

    return sendSuccess(req, res, { token });
  } catch (error) {
    console.error('[Auth] Error en refresh:', error);
    return sendInternalError(req, res, error);
  }
});

// POST /api/auth/forgot-password - Solicitar reset de password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendValidationError(req, res, [{ message: 'Email requerido' }]);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // No revelar si el email existe o no (seguridad)
    if (!user) {
      return sendSuccess(req, res, { message: 'Si el email existe, recibirás instrucciones' });
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

    return sendSuccess(req, res, {
      message: 'Si el email existe, recibirás instrucciones',
      // Solo en desarrollo, devolver token para testing
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    });
  } catch (error) {
    console.error('[Auth] Error en forgot-password:', error);
    return sendInternalError(req, res, error);
  }
});

// POST /api/auth/reset-password - Resetear password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return sendValidationError(req, res, [{ message: 'Token y nueva password requeridos' }]);
    }

    if (newPassword.length < 6) {
      return sendValidationError(req, res, [
        { message: 'Password debe tener al menos 6 caracteres' },
      ]);
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
      return sendValidationError(req, res, [{ message: 'Token inválido o expirado' }]);
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

    return sendSuccess(req, res, { message: 'Password actualizada exitosamente' });
  } catch (error) {
    console.error('[Auth] Error en reset-password:', error);
    return sendInternalError(req, res, error);
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
      return sendValidationError(req, res, [{ message: 'Passwords requeridas' }]);
    }

    if (newPassword.length < 6) {
      return sendValidationError(req, res, [
        { message: 'Nueva password debe tener al menos 6 caracteres' },
      ]);
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

// GET /api/auth/verify - Verificar token JWT actual
router.get('/verify', requireAuth, async (req, res) => {
  try {
    // Si llegamos aquí, el middleware requireAuth ya validó el token
    const user = await prisma.user.findUnique({
      where: { id: req.user.uid },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        role: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }

    return sendSuccess(req, res, {
      user: user,
    });
  } catch (error) {
    console.error('[Auth] Error en verify:', error);
    return sendInternalError(req, res, error);
  }
});

export default router;
