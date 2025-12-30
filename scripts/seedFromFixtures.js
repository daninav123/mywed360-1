#!/usr/bin/env node
/**
 * Script: seedFromFixtures.js
 * Seed determinista usando fixtures para tests E2E estables
 * 
 * Uso:
 *   node scripts/seedFromFixtures.js [--cleanup] [--fixtures=users,weddings,guests]
 */

import admin from 'firebase-admin';
import { loadFixture, loadAllFixtures } from './fixtureLoader.js';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse argumentos
function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      args[key] = value || true;
    }
  }
  return args;
}

// Inicializar Firebase Admin
function initializeFirebase() {
  if (admin.apps.length) return;
  
  try {
    // Intentar usar credenciales de entorno
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
      console.log('✅ Firebase inicializado con GOOGLE_APPLICATION_CREDENTIALS');
    } else {
      // Buscar archivo de service account
      const fs = require('fs');
      const rootDir = join(__dirname, '..');
      const files = fs.readdirSync(rootDir);
      const serviceAccountFile = files.find(f => /firebase.*adminsdk.*\.json$/i.test(f));
      
      if (!serviceAccountFile) {
        throw new Error('No se encontró archivo de service account');
      }
      
      const serviceAccount = require(join(rootDir, serviceAccountFile));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log(`✅ Firebase inicializado con ${serviceAccountFile}`);
    }
  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error.message);
    process.exit(1);
  }
}

// Limpiar datos de test existentes
async function cleanupTestData() {
  console.log('\n🧹 Limpiando datos de test existentes...');
  const db = admin.firestore();
  const auth = admin.auth();
  
  try {
    // Limpiar usuarios de test
    const users = await auth.listUsers();
    for (const user of users.users) {
      if (user.email && user.email.includes('@test.maloveapp.com')) {
        await auth.deleteUser(user.uid);
        console.log(`  🗑️  Usuario eliminado: ${user.email}`);
      }
    }
    
    // Limpiar colección users
    const usersSnapshot = await db.collection('users').get();
    const batch = db.batch();
    let count = 0;
    
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      if (data.email && data.email.includes('@test.maloveapp.com')) {
        batch.delete(doc.ref);
        count++;
      }
    }
    
    if (count > 0) {
      await batch.commit();
      console.log(`  🗑️  ${count} documentos de users eliminados`);
    }
    
    // Limpiar bodas de test
    const weddingsSnapshot = await db.collection('weddings')
      .where('__name__', '>=', 'test-wedding')
      .where('__name__', '<', 'test-weddinz')
      .get();
    
    for (const doc of weddingsSnapshot.docs) {
      // Eliminar subcolecciones
      const subCollections = ['guests', 'tasks', 'suppliers', 'seatingPlan', 'finance'];
      for (const subCol of subCollections) {
        const subDocs = await doc.ref.collection(subCol).get();
        const subBatch = db.batch();
        subDocs.forEach(subDoc => subBatch.delete(subDoc.ref));
        if (!subDocs.empty) await subBatch.commit();
      }
      
      await doc.ref.delete();
      console.log(`  🗑️  Boda eliminada: ${doc.id}`);
    }
    
    console.log('✅ Limpieza completada\n');
  } catch (error) {
    console.error('❌ Error en limpieza:', error.message);
    throw error;
  }
}

// Seed usuarios
async function seedUsers(usersData) {
  console.log('\n👤 Seeding usuarios...');
  const auth = admin.auth();
  const db = admin.firestore();
  
  for (const [key, user] of Object.entries(usersData)) {
    try {
      // Crear usuario en Auth
      let userRecord;
      try {
        userRecord = await auth.createUser({
          uid: user.uid,
          email: user.email,
          password: user.password,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        });
        console.log(`  ✅ Usuario creado: ${user.email} (${user.role})`);
      } catch (error) {
        if (error.code === 'auth/uid-already-exists') {
          userRecord = await auth.getUserByEmail(user.email);
          console.log(`  ℹ️  Usuario existente: ${user.email}`);
        } else {
          throw error;
        }
      }
      
      // Crear documento en Firestore
      await db.collection('users').doc(user.uid).set({
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        createdAt: admin.firestore.Timestamp.fromDate(new Date(user.createdAt)),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
    } catch (error) {
      console.error(`  ❌ Error con usuario ${user.email}:`, error.message);
    }
  }
}

// Seed bodas
async function seedWeddings(weddingsData) {
  console.log('\n💍 Seeding bodas...');
  const db = admin.firestore();
  
  for (const [key, wedding] of Object.entries(weddingsData)) {
    try {
      const weddingRef = db.collection('weddings').doc(wedding.id);
      
      const weddingDoc = {
        ...wedding,
        createdAt: admin.firestore.Timestamp.fromDate(new Date(wedding.createdAt)),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await weddingRef.set(weddingDoc, { merge: true });
      console.log(`  ✅ Boda creada: ${wedding.name} (${wedding.id})`);
      
    } catch (error) {
      console.error(`  ❌ Error con boda ${wedding.name}:`, error.message);
    }
  }
}

// Seed invitados
async function seedGuests(guestsData) {
  console.log('\n👥 Seeding invitados...');
  const db = admin.firestore();
  const { weddingId, guests } = guestsData;
  
  const batch = db.batch();
  let count = 0;
  
  for (const guest of guests) {
    const guestRef = db.collection('weddings').doc(weddingId).collection('guests').doc(guest.id);
    
    batch.set(guestRef, {
      ...guest,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(guest.createdAt)),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    count++;
    
    // Commit cada 500 documentos (límite de Firestore)
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`  ⏳ ${count} invitados procesados...`);
    }
  }
  
  if (count % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`  ✅ ${count} invitados creados para wedding ${weddingId}`);
}

// Seed seating plan
async function seedSeating(seatingData) {
  console.log('\n🪑 Seeding seating plan...');
  const db = admin.firestore();
  const { weddingId, tables, spaces, assignments } = seatingData;
  
  const weddingRef = db.collection('weddings').doc(weddingId);
  
  // Guardar espacios en el documento principal
  if (spaces) {
    await weddingRef.set({
      seatingSpaces: spaces,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
  
  // Crear mesas
  const batch = db.batch();
  for (const table of tables) {
    const tableRef = weddingRef.collection('seatingPlan').doc(table.id);
    batch.set(tableRef, {
      ...table,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(table.createdAt)),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
  
  await batch.commit();
  console.log(`  ✅ ${tables.length} mesas creadas`);
  
  // Actualizar asignaciones en invitados
  if (assignments && assignments.length > 0) {
    const guestBatch = db.batch();
    for (const assignment of assignments) {
      const guestRef = weddingRef.collection('guests').doc(assignment.guestId);
      guestBatch.update(guestRef, {
        tableAssignment: assignment.tableId,
        seatNumber: assignment.seatNumber || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    await guestBatch.commit();
    console.log(`  ✅ ${assignments.length} asignaciones actualizadas`);
  }
}

// Seed finanzas
async function seedFinance(financeData) {
  console.log('\n💰 Seeding finanzas...');
  const db = admin.firestore();
  const { weddingId, budget, transactions, payments } = financeData;
  
  const weddingRef = db.collection('weddings').doc(weddingId);
  
  // Crear documento de finanzas
  await weddingRef.collection('finance').doc('main').set({
    budget: budget,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  
  // Crear transacciones
  const txnBatch = db.batch();
  for (const txn of transactions) {
    const txnRef = weddingRef.collection('finance').doc('main').collection('transactions').doc(txn.id);
    txnBatch.set(txnRef, {
      ...txn,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(txn.createdAt))
    }, { merge: true });
  }
  await txnBatch.commit();
  console.log(`  ✅ ${transactions.length} transacciones creadas`);
  
  // Crear pagos programados
  if (payments && payments.length > 0) {
    const payBatch = db.batch();
    for (const payment of payments) {
      const payRef = weddingRef.collection('payments').doc(payment.id);
      payBatch.set(payRef, payment, { merge: true });
    }
    await payBatch.commit();
    console.log(`  ✅ ${payments.length} pagos programados creados`);
  }
}

// Seed tareas
async function seedTasks(tasksData) {
  console.log('\n✅ Seeding tareas...');
  const db = admin.firestore();
  const { weddingId, tasks, checklist } = tasksData;
  
  const weddingRef = db.collection('weddings').doc(weddingId);
  
  // Crear tareas
  const batch = db.batch();
  for (const task of tasks) {
    const taskRef = weddingRef.collection('tasks').doc(task.id);
    
    const taskDoc = {
      ...task,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(task.createdAt)),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (task.completedAt) {
      taskDoc.completedAt = admin.firestore.Timestamp.fromDate(new Date(task.completedAt));
    }
    
    batch.set(taskRef, taskDoc, { merge: true });
  }
  
  await batch.commit();
  console.log(`  ✅ ${tasks.length} tareas creadas`);
  
  // Guardar checklist
  if (checklist) {
    await weddingRef.set({
      checklist: checklist,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`  ✅ Checklist guardado`);
  }
}

// Seed proveedores
async function seedSuppliers(suppliersData) {
  console.log('\n🏢 Seeding proveedores...');
  const db = admin.firestore();
  const { suppliers, quoteRequests } = suppliersData;
  
  // Crear proveedores globales
  const batch = db.batch();
  for (const supplier of suppliers) {
    const supplierRef = db.collection('suppliers').doc(supplier.id);
    batch.set(supplierRef, {
      ...supplier,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(supplier.createdAt)),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
  
  await batch.commit();
  console.log(`  ✅ ${suppliers.length} proveedores creados`);
  
  // Crear solicitudes de cotización
  if (quoteRequests && quoteRequests.length > 0) {
    const quoteBatch = db.batch();
    for (const quote of quoteRequests) {
      const quoteRef = db.collection('weddings')
        .doc(quote.weddingId)
        .collection('quoteRequests')
        .doc(quote.id);
      
      quoteBatch.set(quoteRef, {
        ...quote,
        createdAt: admin.firestore.Timestamp.fromDate(new Date(quote.createdAt)),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
    await quoteBatch.commit();
    console.log(`  ✅ ${quoteRequests.length} solicitudes de cotización creadas`);
  }
}

// Main
async function main() {
  console.log('🌱 Seed desde Fixtures - Sistema Determinista\n');
  console.log('='.repeat(50));
  
  const args = parseArgs();
  
  // Inicializar Firebase
  initializeFirebase();
  
  // Limpiar si se solicita
  if (args.cleanup) {
    await cleanupTestData();
  }
  
  // Cargar fixtures
  console.log('📂 Cargando fixtures...\n');
  const fixtures = loadAllFixtures();
  
  // Seed en orden correcto
  try {
    await seedUsers(fixtures.users);
    await seedWeddings(fixtures.weddings);
    await seedGuests(fixtures.guests);
    await seedSeating(fixtures.seating);
    await seedFinance(fixtures.finance);
    await seedTasks(fixtures.tasks);
    await seedSuppliers(fixtures.suppliers);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Seed completado exitosamente');
    console.log('='.repeat(50));
    console.log('\nDatos de test disponibles:');
    console.log('  • Usuarios: 5 (planner, owner, assistant, supplier, admin)');
    console.log('  • Bodas: 3 (test-wedding-001, 002, minimal)');
    console.log('  • Invitados: 10 para wedding-001');
    console.log('  • Mesas: 4 para seating plan');
    console.log('  • Tareas: 8 tareas con estados variados');
    console.log('  • Transacciones: 5 movimientos financieros');
    console.log('  • Proveedores: 5 proveedores + 2 cotizaciones');
    console.log('\n📧 Credenciales de test:');
    console.log('  Email: planner@test.maloveapp.com');
    console.log('  Password: test123456');
    console.log('\n⚠️  Estos datos son SOLO para tests E2E\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante el seed:', error);
    process.exit(1);
  }
}

main();
