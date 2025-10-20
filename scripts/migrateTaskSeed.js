/**
 * Script de migración ONE-TIME: Migra el seed hardcodeado de defaultWeddingTasks.js
 * a Firebase como plantilla v1 en adminTaskTemplates
 * 
 * Ejecución:
 * node scripts/migrateTaskSeed.js
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar serviceAccount desde la ruta esperada
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
  'C:\\Users\\Administrator\\Downloads\\serviceAccount.json';

let serviceAccount;
try {
  const content = readFileSync(serviceAccountPath, 'utf8');
  serviceAccount = JSON.parse(content);
  console.log('[migrateTaskSeed] Service account cargado desde:', serviceAccountPath);
} catch (error) {
  console.error('[migrateTaskSeed] Error cargando serviceAccount.json:', error.message);
  process.exit(1);
}

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('[migrateTaskSeed] Firebase Admin inicializado');
}

const db = admin.firestore();

// Importar el seed legacy
const legacySeedPath = resolve(__dirname, '../src/services/defaultWeddingTasks.js');
let defaultWeddingTasks;
try {
  // Leer el archivo y parsear manualmente (es un export default)
  const content = readFileSync(legacySeedPath, 'utf8');
  // Extraer el array del código (simple regex para este caso específico)
  const match = content.match(/const parents = (\[[\s\S]*?\]);/);
  if (!match) {
    throw new Error('No se pudo parsear defaultWeddingTasks.js');
  }
  // Usar eval con cuidado (solo para migración)
  defaultWeddingTasks = eval(match[1]);
  console.log(`[migrateTaskSeed] Seed legacy cargado: ${defaultWeddingTasks.length} bloques padre`);
} catch (error) {
  console.error('[migrateTaskSeed] Error cargando defaultWeddingTasks.js:', error.message);
  process.exit(1);
}

/**
 * Transforma el seed legacy al nuevo formato
 */
function transformLegacyToNewFormat(legacySeed) {
  const blocks = legacySeed.map((parent) => {
    const block = {
      id: parent.id,
      name: parent.title,
      category: parent.category || 'GENERAL',
      startPct: parent.phaseStartPct !== undefined ? parent.phaseStartPct / 100 : 0,
      endPct: parent.phaseEndPct !== undefined ? parent.phaseEndPct / 100 : 1,
      items: [],
    };

    // Convertir fechas: el legacy usa startOffsetDays (puede ser negativo)
    // El nuevo formato usa daysBeforeWedding (siempre positivo para "antes")
    if (typeof parent.startOffsetDays === 'number') {
      // Si es negativo (-150), significa 150 días ANTES de la boda
      block.daysBeforeWedding = parent.startOffsetDays < 0 ? Math.abs(parent.startOffsetDays) : 0;
      block.durationDays = parent.durationDays || 0;
    }

    if (parent.children && Array.isArray(parent.children)) {
      block.items = parent.children.map((child) => {
        const item = {
          id: child.id,
          name: child.title,
          category: parent.category || 'GENERAL',
          assigneeSuggestion: 'both',
          checklist: [],
        };

        if (typeof child.startOffsetDays === 'number') {
          item.daysBeforeWedding = child.startOffsetDays < 0 ? Math.abs(child.startOffsetDays) : 0;
          item.durationDays = child.durationDays || 0;
        }

        return item;
      });
    }

    return block;
  });

  // Calcular totales
  const totals = {
    blocks: blocks.length,
    subtasks: blocks.reduce((sum, block) => sum + (block.items?.length || 0), 0),
  };

  return { blocks, totals };
}

/**
 * Migra el seed a Firebase
 */
async function migrateToFirebase() {
  try {
    console.log('\n[migrateTaskSeed] Iniciando migración...\n');

    // Verificar si ya existe plantilla con version "1"
    const existingSnapshot = await db
      .collection('adminTaskTemplates')
      .where('version', '==', '1')
      .get();

    if (!existingSnapshot.empty) {
      console.log('⚠️  Ya existe una plantilla con version "1"');
      console.log('   ID:', existingSnapshot.docs[0].id);
      console.log('   Estado:', existingSnapshot.docs[0].data().status);
      console.log('\n✅ Saltando migración (ya completada)');
      return existingSnapshot.docs[0].id;
    }

    // Transformar seed
    const { blocks, totals } = transformLegacyToNewFormat(defaultWeddingTasks);
    
    console.log(`✓ Seed transformado: ${totals.blocks} bloques, ${totals.subtasks} subtareas\n`);

    // Crear plantilla en Firebase
    const templateData = {
      version: '1',
      status: 'published',
      name: 'Plantilla Base Migrada',
      notes: 'Migración automática desde defaultWeddingTasks.js',
      blocks,
      totals,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'system_migration',
    };

    const docRef = await db.collection('adminTaskTemplates').add(templateData);
    console.log(`✅ Plantilla v1 creada con ID: ${docRef.id}`);
    console.log(`   Bloques: ${totals.blocks}`);
    console.log(`   Subtareas: ${totals.subtasks}`);
    console.log(`   Estado: published\n`);

    return docRef.id;
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}

/**
 * Validar que la plantilla se guardó correctamente
 */
async function validateMigration(templateId) {
  try {
    console.log('[migrateTaskSeed] Validando migración...\n');

    const doc = await db.collection('adminTaskTemplates').doc(templateId).get();
    
    if (!doc.exists) {
      throw new Error('La plantilla no existe después de crearla');
    }

    const data = doc.data();
    
    console.log('✓ Plantilla existe en Firebase');
    console.log('✓ Version:', data.version);
    console.log('✓ Status:', data.status);
    console.log('✓ Bloques:', data.totals?.blocks || 0);
    console.log('✓ Subtareas:', data.totals?.subtasks || 0);
    
    if (data.status !== 'published') {
      throw new Error('La plantilla no está publicada');
    }

    if (!Array.isArray(data.blocks) || data.blocks.length === 0) {
      throw new Error('La plantilla no tiene bloques');
    }

    console.log('\n✅ Validación exitosa\n');
  } catch (error) {
    console.error('❌ Error en validación:', error);
    throw error;
  }
}

/**
 * Main
 */
async function main() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  MIGRACIÓN DE SEED DE TAREAS A FIREBASE');
    console.log('═══════════════════════════════════════════════════════\n');

    const templateId = await migrateToFirebase();
    
    if (templateId) {
      await validateMigration(templateId);
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('  ✅ MIGRACIÓN COMPLETADA CON ÉXITO');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('Próximos pasos:');
    console.log('1. Verificar en panel admin: /admin/task-templates');
    console.log('2. Crear una boda de prueba para verificar que usa la plantilla');
    console.log('3. Editar la plantilla desde el panel si es necesario\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migración falló:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
