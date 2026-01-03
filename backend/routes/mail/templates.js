import express from 'express';
const router = express.Router();

// Re-exportar las rutas de email-templates desde el nivel superior
// Este archivo es un wrapper para mantener compatibilidad con la estructura de rutas
import emailTemplatesRouter from '../email-templates.js';

// Montar las rutas de templates
router.use('/templates', emailTemplatesRouter);

export default router;
