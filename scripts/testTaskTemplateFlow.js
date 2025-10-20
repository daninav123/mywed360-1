/**
 * Script de prueba: Crea boda de prueba y verifica que usa la plantilla activa
 * 
 * Ejecución:
 * node scripts/testTaskTemplateFlow.js
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
  'C:\\Users\\Administrator\\Downloads\\serviceAccount.json';

let serviceAccount;
try {
  const content = readFileSync(serviceAccountPath, 'utf8');
  serviceAccount = JSON.parse(content);
  console.log('[testFlow] Service account cargado\n');
} catch (error) {
  console.error('[testFlow] Error cargando serviceAccount.json:', error.message);
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

/**
 * 1. Verificar que existe plantilla publicada
 */
async function verifyPublishedTemplate() {
  console.log('📋 Paso 1: Verificando plantilla publicada...');
  
  // Query simple sin índice compuesto
  const snapshot = await db
    .collection('adminTaskTemplates')
    .where('status', '==', 'published')
    .limit(10)
    .get();

  if (snapshot.empty) {
    throw new Error('No hay plantilla publicada. Ejecuta primero: node scripts/migrateTaskSeed.js');
  }

  const template = snapshot.docs[0];
  const data = template.data();

  console.log('   ✓ Plantilla encontrada');
  console.log('   ID:', template.id);
  console.log('   Version:', data.version);
  console.log('   Bloques:', data.totals?.blocks || 0);
  console.log('   Subtareas:', data.totals?.subtasks || 0);
  console.log('');

  return {
    id: template.id,
    data,
  };
}

/**
 * 2. Crear usuario de prueba si no existe
 */
async function ensureTestUser() {
  console.log('👤 Paso 2: Verificando usuario de prueba...');
  
  const testUserId = 'test-user-tasks-' + Date.now();
  const userRef = db.collection('users').doc(testUserId);

  await userRef.set({
    email: `test-${Date.now()}@example.com`,
    role: 'owner',
    displayName: 'Usuario Prueba Plantillas',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('   ✓ Usuario creado:', testUserId);
  console.log('');

  return testUserId;
}

/**
 * 3. Crear boda de prueba (simula el flujo real)
 */
async function createTestWedding(userId, template) {
  console.log('💒 Paso 3: Creando boda de prueba...');
  
  const weddingDate = new Date('2026-06-15'); // Fecha ejemplo: 15 junio 2026
  const weddingId = 'test-wedding-' + Date.now();

  const weddingData = {
    name: 'Boda Prueba Plantillas',
    weddingDate: admin.firestore.Timestamp.fromDate(weddingDate),
    ownerIds: [userId],
    plannerIds: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    active: true,
    progress: 0,
  };

  await db.collection('weddings').doc(weddingId).set(weddingData);

  console.log('   ✓ Boda creada:', weddingId);
  console.log('   Fecha de boda:', weddingDate.toLocaleDateString('es-ES'));
  console.log('');

  return { weddingId, weddingDate };
}

/**
 * 4. Simular creación de tareas desde plantilla
 */
async function seedTasksFromTemplate(weddingId, weddingDate, template) {
  console.log('📝 Paso 4: Creando tareas desde plantilla...');
  
  const blocks = template.data.blocks || [];
  const endBase = weddingDate;
  const startBase = new Date(endBase);
  startBase.setMonth(startBase.getMonth() - 12); // 12 meses antes

  const span = endBase.getTime() - startBase.getTime();
  const at = (pct) => new Date(startBase.getTime() + span * pct);

  let parentCount = 0;
  let subtaskCount = 0;

  for (const block of blocks) {
    // Crear tarea padre
    const startPct = block.startPct || 0;
    const endPct = block.endPct || 1;

    const parentData = {
      title: block.name,
      name: block.name,
      type: 'task',
      start: admin.firestore.Timestamp.fromDate(at(startPct)),
      end: admin.firestore.Timestamp.fromDate(at(endPct)),
      progress: 0,
      isDisabled: false,
      category: block.category || 'OTROS',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      templateKey: block.id,
      templateVersion: template.data.version,
    };

    const parentRef = await db
      .collection('weddings')
      .doc(weddingId)
      .collection('tasks')
      .add(parentData);

    await parentRef.update({ id: parentRef.id });
    parentCount++;

    // Crear subtareas
    const items = block.items || [];
    for (const item of items) {
      const subtaskData = {
        title: item.name,
        name: item.name,
        parentId: parentRef.id,
        weddingId,
        start: admin.firestore.Timestamp.fromDate(at(startPct)),
        end: admin.firestore.Timestamp.fromDate(at(endPct)),
        progress: 0,
        isDisabled: false,
        category: item.category || block.category || 'OTROS',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        templateItemKey: `${block.id}:${item.id}`,
        templateVersion: template.data.version,
      };

      const subtaskRef = await parentRef
        .collection('subtasks')
        .add(subtaskData);

      await subtaskRef.update({ id: subtaskRef.id });
      subtaskCount++;
    }
  }

  console.log(`   ✓ Tareas creadas: ${parentCount} bloques, ${subtaskCount} subtareas`);
  console.log('');

  return { parentCount, subtaskCount };
}

/**
 * 5. Validar tareas creadas
 */
async function validateCreatedTasks(weddingId, expectedBlocks, expectedSubtasks) {
  console.log('✅ Paso 5: Validando tareas creadas...');
  
  const tasksSnapshot = await db
    .collection('weddings')
    .doc(weddingId)
    .collection('tasks')
    .get();

  const parentTasks = tasksSnapshot.docs.filter(d => (d.data().type || 'task') === 'task');
  
  let totalSubtasks = 0;
  for (const parentDoc of parentTasks) {
    const subtasksSnapshot = await parentDoc.ref
      .collection('subtasks')
      .get();
    totalSubtasks += subtasksSnapshot.size;
  }

  console.log('   📊 Resultados:');
  console.log('   - Bloques esperados:', expectedBlocks);
  console.log('   - Bloques creados:', parentTasks.length);
  console.log('   - Subtareas esperadas:', expectedSubtasks);
  console.log('   - Subtareas creadas:', totalSubtasks);
  console.log('');

  const blocksMatch = parentTasks.length === expectedBlocks;
  const subtasksMatch = totalSubtasks === expectedSubtasks;

  if (blocksMatch && subtasksMatch) {
    console.log('   ✅ Validación exitosa: Todas las tareas coinciden');
  } else {
    console.log('   ⚠️  Discrepancia detectada');
    if (!blocksMatch) console.log('   - Bloques no coinciden');
    if (!subtasksMatch) console.log('   - Subtareas no coinciden');
  }

  console.log('');

  return { blocksMatch, subtasksMatch, parentTasks: parentTasks.length, totalSubtasks };
}

/**
 * 6. Mostrar ejemplo de fechas calculadas
 */
async function showDateExamples(weddingId) {
  console.log('📅 Paso 6: Ejemplos de fechas calculadas...');
  
  const tasksSnapshot = await db
    .collection('weddings')
    .doc(weddingId)
    .collection('tasks')
    .limit(3)
    .get();

  if (tasksSnapshot.empty) {
    console.log('   (No hay tareas para mostrar)');
    return;
  }

  for (const taskDoc of tasksSnapshot.docs) {
    const task = taskDoc.data();
    const start = task.start?.toDate();
    const end = task.end?.toDate();

    if (start && end) {
      console.log(`   "${task.title}"`);
      console.log(`   - Inicio: ${start.toLocaleDateString('es-ES')}`);
      console.log(`   - Fin: ${end.toLocaleDateString('es-ES')}`);
      console.log('');
    }
  }
}

/**
 * 7. Limpiar datos de prueba (opcional)
 */
async function cleanup(userId, weddingId, shouldCleanup) {
  if (!shouldCleanup) {
    console.log('🗑️  Paso 7: Datos de prueba conservados para inspección manual');
    console.log(`   Usuario: ${userId}`);
    console.log(`   Boda: ${weddingId}`);
    console.log('');
    return;
  }

  console.log('🗑️  Paso 7: Limpiando datos de prueba...');
  
  // Eliminar tareas
  const tasksSnapshot = await db
    .collection('weddings')
    .doc(weddingId)
    .collection('tasks')
    .get();

  const batch = db.batch();
  tasksSnapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  // Eliminar boda
  await db.collection('weddings').doc(weddingId).delete();

  // Eliminar usuario
  await db.collection('users').doc(userId).delete();

  console.log('   ✓ Datos de prueba eliminados');
  console.log('');
}

/**
 * Main
 */
async function main() {
  const CLEANUP = process.argv.includes('--cleanup');

  console.log('═══════════════════════════════════════════════════════');
  console.log('  TEST: FLUJO COMPLETO DE PLANTILLAS DE TAREAS');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // 1. Verificar plantilla
    const template = await verifyPublishedTemplate();

    // 2. Crear usuario
    const userId = await ensureTestUser();

    // 3. Crear boda
    const { weddingId, weddingDate } = await createTestWedding(userId, template);

    // 4. Seed de tareas
    const { parentCount, subtaskCount } = await seedTasksFromTemplate(
      weddingId,
      weddingDate,
      template
    );

    // 5. Validar
    const validation = await validateCreatedTasks(
      weddingId,
      template.data.totals?.blocks || 0,
      template.data.totals?.subtasks || 0
    );

    // 6. Mostrar ejemplos
    await showDateExamples(weddingId);

    // 7. Cleanup
    await cleanup(userId, weddingId, CLEANUP);

    console.log('═══════════════════════════════════════════════════════');
    if (validation.blocksMatch && validation.subtasksMatch) {
      console.log('  ✅ TEST EXITOSO - SISTEMA FUNCIONANDO CORRECTAMENTE');
    } else {
      console.log('  ⚠️  TEST CON ADVERTENCIAS - REVISAR DISCREPANCIAS');
    }
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('📋 Resumen:');
    console.log(`   - Plantilla usada: ${template.id} (v${template.data.version})`);
    console.log(`   - Boda creada: ${weddingId}`);
    console.log(`   - Bloques: ${validation.parentTasks}/${template.data.totals?.blocks || 0}`);
    console.log(`   - Subtareas: ${validation.totalSubtasks}/${template.data.totals?.subtasks || 0}`);
    console.log('');

    if (!CLEANUP) {
      console.log('💡 Tip: Usa --cleanup para eliminar datos de prueba automáticamente');
      console.log('   Ejemplo: node scripts/testTaskTemplateFlow.js --cleanup\n');
      console.log('🔍 Puedes inspeccionar los datos en Firebase:');
      console.log(`   - Usuario: users/${userId}`);
      console.log(`   - Boda: weddings/${weddingId}`);
      console.log(`   - Tareas: weddings/${weddingId}/tasks`);
      console.log('');
    }

    process.exit(validation.blocksMatch && validation.subtasksMatch ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Error durante el test:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
