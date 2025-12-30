// backend/routes/supplier-registration.js
// Sistema de REGISTRO PÚBLICO para proveedores (sin necesidad de invitación)

import express from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import { sendEmail } from '../services/mailgunService.js';
import { generateSupplierSlug } from '../utils/slugGenerator.js';

const router = express.Router();

/**
 * Esquema de validación para registro de proveedor
 */
const registrationSchema = z.object({
  // Información básica
  name: z.string().min(2).max(100),
  email: z.string().email().max(100),
  phone: z.string().min(9).max(20).optional(),
  website: z.string().url().max(200).optional(),

  // Negocio
  businessName: z.string().min(2).max(100).optional(),
  category: z.string().min(2).max(50), // fotógrafo, catering, música, etc.
  services: z.array(z.string()).min(1).max(10), // servicios específicos

  // Ubicación
  location: z.object({
    city: z.string().min(2).max(100),
    province: z.string().min(2).max(100),
    country: z.string().min(2).max(100).default('España'),
    postalCode: z.string().max(10).optional(),
  }),

  // Descripción
  description: z.string().min(10).max(2000),

  // Rango de precios
  priceRange: z
    .object({
      min: z.number().nonnegative().optional(),
      max: z.number().nonnegative().optional(),
      currency: z.string().max(3).default('EUR'),
    })
    .optional(),

  // Disponibilidad
  availability: z.enum(['available', 'limited', 'unavailable']).default('available'),

  // Términos y condiciones
  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar los términos y condiciones',
  }),
});

/**
 * POST /api/supplier-registration/register
 * Registro PÚBLICO de proveedor (sin autenticación)
 */
router.post('/register', express.json({ limit: '2mb' }), async (req, res) => {
  try {
    // Validar datos
    const data = registrationSchema.parse(req.body);

    // Verificar si el email ya existe
    const existingQuery = await db
      .collection('suppliers')
      .where('contact.email', '==', data.email)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      return res.status(409).json({
        error: 'email_exists',
        message: 'Este email ya está registrado',
      });
    }

    // Generar slug único usando la utilidad centralizada
    const slug = await generateSupplierSlug(data.name, data.location.city);

    // Crear documento de proveedor
    const supplierRef = db.collection('suppliers').doc();
    const supplierId = supplierRef.id;

    // Generar token de verificación de email
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const supplierData = {
      // Profile
      profile: {
        name: data.name,
        businessName: data.businessName || data.name,
        slug: slug,
        category: data.category,
        description: data.description,
        registered: true,
        status: 'pending_verification', // pending_verification, verified, active, suspended
        source: 'public_registration',
      },

      // Contact
      contact: {
        email: data.email,
        phone: data.phone || null,
        website: data.website || null,
      },

      // Location
      location: {
        city: data.location.city,
        province: data.location.province,
        country: data.location.country,
        postalCode: data.location.postalCode || null,
        coordinates: null, // Se puede geocodificar después
      },

      // Business
      business: {
        services: data.services,
        priceRange: data.priceRange
          ? {
              min: data.priceRange.min || 0,
              max: data.priceRange.max || null,
              currency: data.priceRange.currency || 'EUR',
            }
          : null,
        availability: data.availability,
      },

      // Verification
      verification: {
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationSentAt: FieldValue.serverTimestamp(),
        phoneVerified: false,
        documentsVerified: false,
      },

      // Authentication
      auth: {
        passwordHash: null, // Se establece después de verificar email
        passwordSetAt: null,
      },

      // Metadata
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastLoginAt: null,

      // Metrics iniciales
      metrics: {
        views: 0,
        clicks: 0,
        conversions: 0,
        rating: 0,
        reviewCount: 0,
        matchScore: 50, // Score inicial
      },

      // IMPORTANTE: Campos para búsqueda híbrida
      registered: true, // Marcar como proveedor REGISTRADO (no de caché)
      name: data.name, // Duplicar en nivel superior para búsqueda
      category: data.category, // Duplicar para búsqueda
      tags: data.services || [], // Tags para búsqueda
    };

    await supplierRef.set(supplierData);

    // Generar enlace para establecer contraseña
    const baseUrl = process.env.PUBLIC_APP_BASE_URL || 'http://localhost:5173';
    const setupPasswordUrl = `${baseUrl}/supplier/setup-password?email=${encodeURIComponent(data.email)}&token=${verificationToken}`;

    // Enviar email de verificación
    try {
      await sendEmail({
        to: data.email,
        subject: '¡Bienvenido a MyWed360! Verifica tu cuenta',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">¡Bienvenido a MyWed360, ${data.name}!</h2>
            <p>Tu registro como proveedor ha sido recibido. Para activar tu cuenta y establecer tu contraseña, haz clic en el siguiente enlace:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${setupPasswordUrl}" 
                 style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Verificar Cuenta y Establecer Contraseña
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Este enlace es válido por 7 días. Si no solicitaste este registro, ignora este email.</p>
            <p style="color: #666; font-size: 14px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="color: #2563eb; font-size: 12px; word-break: break-all;">${setupPasswordUrl}</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #999; font-size: 12px;">MyWed360 - Plataforma de gestión de bodas</p>
          </div>
        `,
        text: `¡Bienvenido a MyWed360, ${data.name}! Para verificar tu cuenta, visita: ${setupPasswordUrl}`
      });
      logger.info('✅ Email de verificación enviado', { email: data.email });
    } catch (emailError) {
      logger.error('⚠️ Error enviando email de verificación (registro continúa)', emailError);
    }

    logger.info('Nuevo proveedor registrado', {
      supplierId,
      email: data.email,
      name: data.name,
      category: data.category,
    });

    return res.status(201).json({
      success: true,
      supplierId,
      slug,
      setupPasswordUrl, // Para testing, en producción solo se envía por email
      message:
        'Registro exitoso. Revisa tu email para verificar tu cuenta y establecer tu contraseña.',
      nextSteps: [
        'Verifica tu email y establece tu contraseña',
        'Inicia sesión en tu dashboard',
        'Completa tu perfil',
        'Sube fotos de tu portfolio',
        'Activa tu cuenta',
      ],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Datos inválidos',
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    logger.error('Error en registro de proveedor', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Error al procesar el registro',
    });
  }
});

/**
 * POST /api/supplier-registration/verify-email
 * Verificar email con token
 */
router.post('/verify-email', express.json(), async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'token_required' });
    }

    // Buscar proveedor con este token
    const query = await db
      .collection('suppliers')
      .where('verification.emailVerificationToken', '==', token)
      .limit(1)
      .get();

    if (query.empty) {
      return res.status(404).json({
        error: 'invalid_token',
        message: 'Token inválido o expirado',
      });
    }

    const supplierDoc = query.docs[0];
    const supplierData = supplierDoc.data();

    // Verificar si ya está verificado
    if (supplierData.verification?.emailVerified) {
      return res.json({
        success: true,
        message: 'Email ya verificado',
        alreadyVerified: true,
      });
    }

    // Marcar como verificado
    await supplierDoc.ref.update({
      'verification.emailVerified': true,
      'verification.emailVerifiedAt': FieldValue.serverTimestamp(),
      'verification.emailVerificationToken': null,
      'profile.status': 'verified',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return res.json({
      success: true,
      message: 'Email verificado exitosamente',
      supplierId: supplierDoc.id,
    });
  } catch (error) {
    logger.error('Error verificando email', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * GET /api/supplier-registration/check-email/:email
 * Verificar si un email ya está registrado (público)
 */
router.get('/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'invalid_email' });
    }

    const query = await db
      .collection('suppliers')
      .where('contact.email', '==', email.toLowerCase())
      .limit(1)
      .get();

    return res.json({
      exists: !query.empty,
      available: query.empty,
    });
  } catch (error) {
    logger.error('Error checking email', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * GET /api/supplier-registration/categories
 * Lista de categorías disponibles
 */
router.get('/categories', async (req, res) => {
  const categories = [
    { value: 'fotografo', label: 'Fotógrafo' },
    { value: 'video', label: 'Videógrafo' },
    { value: 'catering', label: 'Catering' },
    { value: 'musica', label: 'Música y DJ' },
    { value: 'flores', label: 'Flores y Decoración' },
    { value: 'lugar', label: 'Lugar de Celebración' },
    { value: 'iglesia', label: 'Iglesia' },
    { value: 'pasteleria', label: 'Pastelería / Tarta' },
    { value: 'invitaciones', label: 'Invitaciones' },
    { value: 'maquillaje', label: 'Maquillaje y Peluquería' },
    { value: 'transporte', label: 'Transporte' },
    { value: 'coches', label: 'Coches de Boda' },
    { value: 'animacion', label: 'Animación' },
    { value: 'wedding-planner', label: 'Wedding Planner' },
    { value: 'otro', label: 'Otro' },
  ];

  res.json({ categories });
});

export default router;
