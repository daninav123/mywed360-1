/**
 * Script para sincronizar categorías de proveedores a Firestore
 * Guarda las categorías en: suppliers/config/categories
 *
 * Uso: node scripts/syncCategoriesToFirestore.js
 */

import admin from 'firebase-admin';
import { SUPPLIER_CATEGORIES } from '../shared/supplierCategories.js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde backend
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

function initializeFirebaseAdmin() {
  if (admin.apps.length) return;

  try {
    // Intentar usar serviceAccountKey.json primero
    const serviceAccountPath = path.join(__dirname, '../backend/serviceAccountKey.json');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin inicializado con serviceAccountKey.json\n');
    } else {
      // Fallback a variables de entorno
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      console.log('✅ Firebase Admin inicializado con variables de entorno\n');
    }
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin:', error.message);
    throw error;
  }
}

async function syncCategories() {
  initializeFirebaseAdmin();
  const db = admin.firestore();

  try {
    console.log('🔄 Sincronizando categorías de proveedores a Firestore...\n');

    // Guardar en: suppliers/config/categories
    const categoriesRef = db.collection('suppliers').doc('config');

    const categoriesData = {
      categories: SUPPLIER_CATEGORIES.map((cat) => ({
        id: cat.id,
        name: cat.name,
        nameEn: cat.nameEn,
        icon: cat.icon,
        description: cat.description,
        googlePlacesType: cat.googlePlacesType,
        keywords: cat.keywords,
        coverage: cat.coverage,
      })),
      version: '1.0',
      totalCategories: SUPPLIER_CATEGORIES.length,
      lastSync: new Date().toISOString(),
      syncedBy: 'syncCategoriesToFirestore script',
    };

    await categoriesRef.set(categoriesData, { merge: true });

    console.log('✅ Categorías sincronizadas correctamente!');
    console.log(`📊 Total: ${SUPPLIER_CATEGORIES.length} categorías\n`);

    // Mostrar categorías guardadas
    console.log('📋 Categorías guardadas:');
    SUPPLIER_CATEGORIES.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} (${cat.id})`);
    });

    console.log('\n📍 Ubicación en Firestore:');
    console.log('   Collection: suppliers');
    console.log('   Document: config');
    console.log('   Field: categories (array)\n');

    // Crear índice de categorías por ID para búsquedas rápidas
    const categoriesById = {};
    SUPPLIER_CATEGORIES.forEach((cat) => {
      categoriesById[cat.id] = {
        name: cat.name,
        nameEn: cat.nameEn,
        icon: cat.icon,
        description: cat.description,
      };
    });

    await categoriesRef.update({
      categoriesById,
    });

    console.log('✅ Índice de categorías creado (categoriesById)\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error sincronizando categorías:', error);
    process.exit(1);
  }
}

// Ejecutar
syncCategories().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
