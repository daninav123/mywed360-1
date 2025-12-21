/**
 * Configuración de Firebase Admin para el backend
 * Exporta instancias de Firestore y utilidades
 */

import admin from 'firebase-admin';

// Firebase Admin ya está inicializado en authMiddleware.js
// Aquí solo exportamos las utilidades necesarias

/**
 * Instancia de Firestore
 */
export const db = admin.firestore();

/**
 * FieldValue para operaciones de Firestore
 * (serverTimestamp, increment, delete, arrayUnion, etc.)
 */
export const FieldValue = admin?.firestore?.FieldValue || admin?.firestore?.().FieldValue;

/**
 * Timestamp para fechas de Firestore
 */
export const Timestamp = admin?.firestore?.Timestamp || admin?.firestore?.().Timestamp;

/**
 * Auth para gestión de usuarios
 */
export const auth = typeof admin?.auth === 'function' ? admin.auth() : null;

export default {
  db,
  FieldValue,
  Timestamp,
  auth,
};
