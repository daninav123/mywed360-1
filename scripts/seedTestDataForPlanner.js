#!/usr/bin/env node
/**
 * Script: seedTestDataForPlanner.js
 * ---------------------------------------------
 * Crea/actualiza un usuario planner con los datos de prueba necesarios
 * y genera una boda de ejemplo con documentos y subcolecciones completas
 * para poder probar la vista de planner.
 *
 * Uso:
 *   node scripts/seedTestDataForPlanner.js --email=danielnavarrocampos@icloud.com
 *   (Opcional) --password=123456 --weddingName="Demo Wedding"
 *
 * Requisitos:
 * - Definir GOOGLE_APPLICATION_CREDENTIALS con la clave de servicio de Firebase
 * - Permisos de Firebase Auth y Firestore
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');
import { randomUUID } from 'crypto';

function parseArgs() {
  const params = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [k, v] = arg.substring(2).split('=');
      params[k] = v ?? true;
    }
  }
  return params;
}

async function ensureAdmin(keyPath) {
  if (admin.apps.length) return;
  let credential;
  if (keyPath) {
    const path = require('path');
    const fs = require('fs');
    const abs = path.isAbsolute(keyPath) ? keyPath : path.join(process.cwd(), keyPath);
    if (!fs.existsSync(abs)) {
      console.error('❌  Credencial no encontrada:', abs);
      process.exit(1);
    }
    credential = admin.credential.cert(require(abs));
  } else {
    credential = admin.credential.applicationDefault();
  }
  admin.initializeApp({ credential });
}

async function ensurePlannerUser(email, password = 'planner123') {
  const auth = admin.auth();
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`ℹ️  Usuario existente: ${userRecord.uid}`);
  } catch {
    userRecord = await auth.createUser({ email, password, emailVerified: false, disabled: false });
    console.log(`✅  Usuario creado: ${userRecord.uid}`);
  }
  // Actualiza rol en colección users
  const db = admin.firestore();
  await db.collection('users').doc(userRecord.uid).set(
    {
      role: 'planner',
      email,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return userRecord.uid;
}

async function ensureWedding(uidPlanner, opts) {
  const db = admin.firestore();
  const { weddingId, weddingName = 'Boda de prueba', dateStr = '2025-10-01' } = opts;
  if (weddingId) {
    // Añadir planner al array plannerIds del documento existente
    const wedRef = db.collection('weddings').doc(weddingId);
    await wedRef.set({ plannerIds: admin.firestore.FieldValue.arrayUnion(uidPlanner) }, { merge: true });
    console.log('ℹ️  Usando boda existente:', weddingId);
    return weddingId;
  }
  // Crear nueva si no existe argumento
  const existingSnap = await db
    .collection('weddings')
    .where('plannerIds', 'array-contains', uidPlanner)
    .limit(1)
    .get();
  if (!existingSnap.empty) {
    console.log('ℹ️  Ya existe una boda de prueba:', existingSnap.docs[0].id);
    return existingSnap.docs[0].id;
  }
  const weddingRef = await db.collection('weddings').add({
    name: weddingName,
    date: dateStr,
    location: 'Lugar de celebración',
    ownerIds: [],
    plannerIds: [uidPlanner],
    assistantIds: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`✅  Boda creada: weddings/${weddingRef.id}`);
  return weddingRef.id;
}


async function seedSubcollections(weddingId) {
  const db = admin.firestore();
  const docsCol = db.collection('weddings').doc(weddingId).collection('documents');
  const guestsCol = db.collection('weddings').doc(weddingId).collection('guests');
  const tasksCol = db.collection('weddings').doc(weddingId).collection('tasks');
  const suppliersCol = db.collection('weddings').doc(weddingId).collection('suppliers');

  // Crear documentos de ejemplo
  const sampleDocs = [
    { name: 'Contrato Lugar.pdf', url: 'https://example.com/contrato-lugar.pdf', type: 'PDF' },
    { name: 'Menú.pdf', url: 'https://example.com/menu.pdf', type: 'PDF' },
    { name: 'Lista canciones.xlsx', url: 'https://example.com/canciones.xlsx', type: 'XLSX' },
  ];
  for (const d of sampleDocs) {
    await docsCol.add({ ...d, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  console.log('✅  Documentos de prueba añadidos');

  // Crear invitados de ejemplo
  const sampleGuests = [
    { name: 'Ana García', email: 'ana@example.com', phone: '+34123456789', status: 'pending' },
    { name: 'Luis Martínez', email: 'luis@example.com', phone: '+34987654321', status: 'accepted' },
  ];
  for (const g of sampleGuests) {
    await guestsCol.add({ ...g, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  console.log('✅  Invitados de prueba añadidos');

  // Crear proveedores de ejemplo
  const sampleSuppliers = [
    { name: 'Floristería Las Rosas', category: 'Flores', phone: '+34911223344', email: 'contacto@floristerialasrosas.com' },
    { name: 'Grupo Catering Gourmet', category: 'Catering', phone: '+34919876543', email: 'info@cateringgourmet.es' },
  ];
  for (const s of sampleSuppliers) {
    await suppliersCol.add({ ...s, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  console.log('✅  Proveedores de prueba añadidos');

  // Crear tareas de ejemplo
  const sampleTasks = [
    { title: 'Confirmar lugar', done: false },
    { title: 'Enviar invitaciones', done: false },
    {
      title: 'Completar expediente matrimonial',
      done: false,
      category: 'CEREMONIA',
      relatedCeremonyId: 'legal',
    },
    {
      title: 'Subir documentación legal de la ceremonia',
      done: false,
      category: 'CEREMONIA',
      relatedCeremonyId: 'legal',
    },
    {
      title: 'Agendar ensayo general de la ceremonia',
      done: false,
      category: 'CEREMONIA',
      relatedCeremonyId: 'rehearsal',
    },
    {
      title: 'Confirmar celebrante y testigos',
      done: false,
      category: 'CEREMONIA',
      relatedCeremonyId: 'roles',
    },
  ];
  for (const t of sampleTasks) {
    await tasksCol.add({ ...t, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  }
  console.log('✅  Tareas de prueba añadidas');

  // Configuración básica de ceremonia (flujo 11)
  const ceremonyConfig = {
    eventType: 'ceremonia_civil',
    multiCeremony: false,
    title: 'Ceremonia principal',
    scheduledDate: '2025-10-01',
    scheduledTime: '18:00',
    location: 'Jardín principal',
    capacity: 120,
    celebrant: 'Oficiante Demo',
    celebrantContact: '+34 600 000 000',
    notes: 'Ceremonia de demostración para planners.',
    rehearsal: {
      date: '2025-09-28',
      time: '19:00',
      location: 'Salón interior',
      attendees: 'Novios, celebrante, testigos, planner',
    },
    traditions: [
      { id: 'arras', label: 'Ceremonia de arras', required: false, responsible: 'Planner' },
      { id: 'lazo', label: 'Ceremonia del lazo', required: false, responsible: '' },
      { id: 'arena', label: 'Ceremonia de la arena', required: false, responsible: '' },
      { id: 'unity_candle', label: 'Unity candle', required: false, responsible: '' },
    ],
    roles: [
      { id: 'celebrant', role: 'Celebrante', name: 'Oficiante Demo', contact: '+34 600 000 000', arrival: '17:15', attire: 'Traje oscuro' },
      { id: 'witness1', role: 'Testigo 1', name: 'Ana Planner', contact: '+34 600 000 001', arrival: '17:30', attire: 'Formal' },
      { id: 'witness2', role: 'Testigo 2', name: 'Luis Planner', contact: '+34 600 000 002', arrival: '17:30', attire: 'Formal' },
      { id: 'ring_bearer', role: 'Porta anillos', name: 'Sobrino demo', contact: '+34 600 000 003', arrival: '17:45', attire: 'Traje ligero' },
    ],
    legal: [
      {
        id: 'id-docs',
        label: 'Identificaciones oficiales de los novios',
        status: 'in-progress',
        dueDate: '2025-09-15',
        notes: 'A la espera de entrega DNI renovado.',
        relatedDocType: 'legal',
      },
      {
        id: 'marriage-license',
        label: 'Expediente matrimonial / licencia',
        status: 'pending',
        dueDate: '2025-09-20',
        notes: '',
        relatedDocType: 'legal',
      },
      {
        id: 'premarital-course',
        label: 'Curso prematrimonial completado',
        status: 'pending',
        dueDate: '2025-09-10',
        notes: '',
        relatedDocType: 'curso',
      },
      {
        id: 'witness-statements',
        label: 'Declaraciones de testigos firmadas',
        status: 'pending',
        dueDate: '2025-09-12',
        notes: '',
        relatedDocType: 'legal',
      },
    ],
    contingency: {
      weatherPlan: 'Carpa lateral y traslado a salón interior en caso de lluvia.',
      technicalPlan: 'Generador de respaldo y proveedor de sonido duplicado.',
      emergencyContacts: 'Seguridad venue +34 600 123 456, Ambulancia 112.',
      mobilityPlan: 'Parking alterno en calle Los Nogales, microbús para invitados VIP.',
    },
  };

  const ceremonyRef = db.collection('weddings').doc(weddingId).collection('ceremony').doc('config');
  await ceremonyRef.set(
    {
      ...ceremonyConfig,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const ceremonyTimeline = {
    sections: [
      {
        id: 'preCeremony',
        title: 'Pre-ceremonia',
        description: 'Preparativos previos y llegada de participantes.',
        items: [
          {
            id: 'prep-arrival',
            title: 'Llegada de cortejo y testigos',
            time: '17:15',
            responsible: 'Planner',
            status: 'pending',
            notes: 'Coordinar fotografías de llegada.',
          },
          {
            id: 'sound-check',
            title: 'Prueba de sonido y música',
            time: '17:30',
            responsible: 'Proveedor sonido',
            status: 'in-progress',
            notes: '',
          },
        ],
      },
      {
        id: 'ceremony',
        title: 'Ceremonia',
        description: 'Desarrollo completo de la ceremonia.',
        items: [
          {
            id: 'processional',
            title: 'Entrada cortejo',
            time: '18:00',
            responsible: 'Planner',
            status: 'pending',
            notes: 'Canción: Canon in D.',
          },
          {
            id: 'vows',
            title: 'Lectura de votos',
            time: '18:20',
            responsible: 'Novios',
            status: 'pending',
            notes: '',
          },
          {
            id: 'rings',
            title: 'Intercambio de anillos',
            time: '18:25',
            responsible: 'Porta anillos',
            status: 'pending',
            notes: 'Confirmar anillos en atril.',
          },
        ],
      },
      {
        id: 'postCeremony',
        title: 'Post-ceremonia',
        description: 'Salida y transición a cóctel.',
        items: [
          {
            id: 'recessional',
            title: 'Salida novios',
            time: '18:40',
            responsible: 'Planner',
            status: 'pending',
            notes: 'Coordinación de pétalos.',
          },
          {
            id: 'photo-session',
            title: 'Fotos inmediatas',
            time: '18:45',
            responsible: 'Fotógrafo',
            status: 'pending',
            notes: 'Priorizar fotos familiares.',
          },
        ],
      },
    ],
  };

  const ceremonyTimelineRef = db.collection('weddings').doc(weddingId).collection('ceremonyTimeline').doc('main');
  await ceremonyTimelineRef.set(
    {
      ...ceremonyTimeline,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const ceremonyChecklist = {
    items: [
      {
        id: 'legal_documents',
        label: 'Documentación legal completa',
        category: 'Documentos',
        status: 'in-progress',
        dueDate: '2025-09-15',
        notes: 'Revisar con registro civil antes del 20/09.',
        relatedDocType: 'legal',
      },
      {
        id: 'course_certificate',
        label: 'Certificado curso prematrimonial',
        category: 'Documentos',
        status: 'pending',
        dueDate: '2025-09-10',
        notes: '',
        relatedDocType: 'curso',
      },
      {
        id: 'ceremony_rehearsal',
        label: 'Ensayo general agendado',
        category: 'Ensayos',
        status: 'pending',
        dueDate: '2025-09-28',
        notes: 'Confirmar disponibilidad celebrante.',
        relatedDocType: 'rehearsal',
      },
      {
        id: 'supplier_confirmation',
        label: 'Confirmación proveedores ceremonia',
        category: 'Proveedores',
        status: 'pending',
        dueDate: '2025-09-20',
        notes: 'Música, sonido y decoración.',
        relatedDocType: 'suppliers',
      },
      {
        id: 'contingency_plan',
        label: 'Plan de contingencia definido',
        category: 'Plan B',
        status: 'in-progress',
        dueDate: '2025-09-18',
        notes: 'Validar con venue.',
        relatedDocType: 'contingency',
      },
    ],
  };

  const ceremonyChecklistRef = db.collection('weddings').doc(weddingId).collection('ceremonyChecklist').doc('main');
  await ceremonyChecklistRef.set(
    {
      ...ceremonyChecklist,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  console.log('✅  Flujo 11 cargado con configuración, timeline y checklist de ejemplo');
}

async function main() {
  const { email, password, weddingName, key, weddingId } = parseArgs();
  if (!email) {
    console.error('Uso: --email=<correoPlanner> [--password=...] [--weddingName="..."]');
    process.exit(1);
  }

  await ensureAdmin(key);
  const uidPlanner = await ensurePlannerUser(email, password);
  const effectiveWeddingId = await ensureWedding(uidPlanner, { weddingId, weddingName });
  await seedSubcollections(effectiveWeddingId);

  console.log('\n🎉  Datos de prueba generados correctamente.');
  console.log('   Planner UID:', uidPlanner);
  console.log('   Wedding ID :', effectiveWeddingId);
  console.log('Ahora inicia sesión con el usuario planner y navega a /bodas para ver la boda de prueba.');
}

main().catch((err) => {
  console.error('❌  Error inesperado:', err);
  process.exit(1);
});
