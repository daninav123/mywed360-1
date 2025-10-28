// backend/routes/supplier-registration.js
// Sistema de REGISTRO PÚBLICO para proveedores (sin necesidad de invitación)

import express from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';
import logger from '../logger.js';
import crypto from 'crypto';

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
  priceRange: z.object({
    min: z.number().nonnegative().optional(),
    max: z.number().nonnegative().optional(),
    currency: z.string().max(3).default('EUR'),
  }).optional(),
  
  // Disponibilidad
  availability: z.enum(['available', 'limited', 'unavailable']).default('available'),
  
  // Términos y condiciones
  acceptedTerms: z.boolean().refine(val => val === true, {
    message: 'Debes aceptar los términos y condiciones'
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
    const existingQuery = await db.collection('suppliers')
      .where('contact.email', '==', data.email)
      .limit(1)
      .get();
    
    if (!existingQuery.empty) {
      return res.status(409).json({
        error: 'email_exists',
        message: 'Este email ya está registrado'
      });
    }
    
    // Generar slug único
    const baseSlug = data.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    // Verificar slug único
    while (true) {
      const slugQuery = await db.collection('suppliers')
        .where('profile.slug', '==', slug)
        .limit(1)
        .get();
      
      if (slugQuery.empty) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
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
        priceRange: data.priceRange ? {
          min: data.priceRange.min || 0,
          max: data.priceRange.max || null,
          currency: data.priceRange.currency || 'EUR',
        } : null,
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
      },
    };
    
    await supplierRef.set(supplierData);
    
    // TODO: Enviar email de verificación
    // await sendVerificationEmail(data.email, verificationToken);
    
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
      message: 'Registro exitoso. Revisa tu email para verificar tu cuenta.',
      nextSteps: [
        'Verifica tu email',
        'Completa tu perfil',
        'Sube fotos de tu portfolio',
        'Activa tu cuenta'
      ]
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Datos inválidos',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      });
    }
    
    logger.error('Error en registro de proveedor', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Error al procesar el registro'
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
    const query = await db.collection('suppliers')
      .where('verification.emailVerificationToken', '==', token)
      .limit(1)
      .get();
    
    if (query.empty) {
      return res.status(404).json({
        error: 'invalid_token',
        message: 'Token inválido o expirado'
      });
    }
    
    const supplierDoc = query.docs[0];
    const supplierData = supplierDoc.data();
    
    // Verificar si ya está verificado
    if (supplierData.verification?.emailVerified) {
      return res.json({
        success: true,
        message: 'Email ya verificado',
        alreadyVerified: true
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
    
    const query = await db.collection('suppliers')
      .where('contact.email', '==', email.toLowerCase())
      .limit(1)
      .get();
    
    return res.json({
      exists: !query.empty,
      available: query.empty
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
    { value: 'pasteleria', label: 'Pastelería / Tarta' },
    { value: 'invitaciones', label: 'Invitaciones' },
    { value: 'maquillaje', label: 'Maquillaje y Peluquería' },
    { value: 'transporte', label: 'Transporte' },
    { value: 'animacion', label: 'Animación' },
    { value: 'wedding-planner', label: 'Wedding Planner' },
    { value: 'otro', label: 'Otro' },
  ];
  
  res.json({ categories });
});

export default router;
