import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import process from "process";

import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadServiceAccount() {
  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (rawKey) {
    try {
      return JSON.parse(rawKey);
    } catch (err) {
      try {
        const decoded = Buffer.from(rawKey, "base64").toString("utf8");
        return JSON.parse(decoded);
      } catch (err2) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY no es JSON válido ni base64.");
      }
    }
  }

  const candidateEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const candidates = [
    candidateEnv,
    resolve(__dirname, "../serviceAccount.json"),
  ].filter(Boolean);

  for (const p of candidates) {
    try {
      const str = readFileSync(p, "utf8");
      return JSON.parse(str);
    } catch (err) {
      // continue
    }
  }

  throw new Error(
    "No se encontró JSON de service account. Define FIREBASE_SERVICE_ACCOUNT_KEY o GOOGLE_APPLICATION_CREDENTIALS."
  );
}

function initFirebase() {
  if (admin.apps.length) return admin.app();
  const credential = admin.credential.cert(loadServiceAccount());
  return admin.initializeApp({
    credential,
    projectId: process.env.CYPRESS_TEST_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
  });
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta variable de entorno requerida: ${name}`);
  }
  return value;
}

async function ensureAuthUser(auth, { email, password, displayName }) {
  try {
    const existing = await auth.getUserByEmail(email);
    return existing;
  } catch (err) {
    if (err?.code !== "auth/user-not-found") throw err;
  }

  const userRecord = await auth.createUser({
    email,
    password,
    displayName,
    emailVerified: true,
  });
  return userRecord;
}

async function seedDocument(docRef, data) {
  await docRef.set(data, { merge: true });
}

async function seedCollection(collectionRef, docs) {
  if (!docs.length) return;
  const batch = admin.firestore().batch();
  docs.forEach(({ id, data }) => {
    const ref = collectionRef.doc(id);
    batch.set(ref, data, { merge: true });
  });
  await batch.commit();
}

async function deleteCollection(collectionRef) {
  const snapshots = await collectionRef.get();
  const batchSize = snapshots.size;
  if (batchSize === 0) return;
  const batch = admin.firestore().batch();
  snapshots.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

function buildSeedData({ plannerUid, weddingId }) {
  const now = admin.firestore.Timestamp.now();

  const weddingDoc = {
    id: weddingId,
    name: "Boda Cypress QA",
    slug: "boda-cypress-qa",
    weddingDate: admin.firestore.Timestamp.fromDate(new Date("2026-06-20T00:00:00Z")),
    location: "Madrid",
    plannerIds: [plannerUid],
    ownerIds: [plannerUid],
    status: "active",
    active: true,
    createdAt: now,
    updatedAt: now,
    budgetStatus: "tracking",
    progress: 35,
    summary: {
      suppliers: 3,
      tasksPending: 5,
      tasksCompleted: 12,
      rsvpPending: 18,
      rsvpConfirmed: 42,
    },
  };

  const suppliers = [
    {
      id: "supplier-venue-1",
      name: "Finca Las Encinas",
      service: "Venue",
      contact: "Ana Martínez",
      email: "contacto@fincalasencinas.test",
      phone: "+34 600 111 222",
      status: "Confirmado",
      rating: 4.8,
      ratingCount: 24,
      budget: 9500,
      favorite: true,
      notes: "Incluye catering y alojamiento",
      createdAt: now,
      updatedAt: now,
      origin: "manual",
    },
    {
      id: "supplier-photo-1",
      name: "Lightframe Studio",
      service: "Fotografía",
      contact: "Carlos Pérez",
      email: "hola@lightframe.test",
      phone: "+34 622 333 444",
      status: "Seguimiento",
      rating: 4.2,
      ratingCount: 12,
      budget: 2100,
      favorite: false,
      notes: "Propuesta enviada, pendiente de respuesta",
      createdAt: now,
      updatedAt: now,
      origin: "imported",
    },
    {
      id: "supplier-music-1",
      name: "DJ Sunset",
      service: "Música",
      contact: "Marina López",
      email: "booking@djsunset.test",
      phone: "+34 655 777 888",
      status: "Prospecto",
      rating: 4,
      ratingCount: 5,
      budget: 1200,
      favorite: false,
      notes: "Entregó playlist preliminar",
      createdAt: now,
      updatedAt: now,
      origin: "ai_search",
    },
  ];

  const supplierLines = {
    "supplier-venue-1": [
      {
        id: "sv-1-line-1",
        name: "Alquiler finca",
        status: "Confirmado",
        budget: 8000,
        notes: "Incluye mobiliario básico",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "sv-1-line-2",
        name: "Catering",
        status: "En negociación",
        budget: 1500,
        notes: "Propuesta pendiente de firma",
        createdAt: now,
        updatedAt: now,
      },
    ],
    "supplier-photo-1": [
      {
        id: "sp-1-line-1",
        name: "Cobertura completa",
        status: "Seguimiento",
        budget: 1800,
        notes: "Incluye álbum digital",
        createdAt: now,
        updatedAt: now,
      },
    ],
    "supplier-music-1": [
      {
        id: "sm-1-line-1",
        name: "DJ Recepción",
        status: "Prospecto",
        budget: 900,
        notes: "Necesita confirmar disponibilidad",
        createdAt: now,
        updatedAt: now,
      },
    ],
  };

  const notifications = [
    {
      id: "notif-rsvp",
      type: "rsvp",
      message: "Tienes 18 invitados pendientes de confirmar.",
      read: false,
      createdAt: now,
      weddingId,
      severity: "medium",
    },
    {
      id: "notif-providers",
      type: "providers",
      message: "3 proveedores requieren seguimiento esta semana.",
      read: false,
      createdAt: now,
      weddingId,
      severity: "high",
    },
  ];

  const meetings = [
    {
      id: "meet-finca",
      title: "Visita a finca Las Encinas",
      date: admin.firestore.Timestamp.fromDate(new Date("2026-03-12T15:00:00Z")),
      completed: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "meet-foto",
      title: "Reunión con Lightframe Studio",
      date: admin.firestore.Timestamp.fromDate(new Date("2026-03-20T17:30:00Z")),
      completed: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const tasks = [
    {
      id: "task-budget",
      title: "Revisar presupuesto con proveedores clave",
      status: "in_progress",
      dueDate: admin.firestore.Timestamp.fromDate(new Date("2026-03-30T00:00:00Z")),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "task-rsvp",
      title: "Enviar recordatorio RSVP a familiares",
      status: "pending",
      dueDate: admin.firestore.Timestamp.fromDate(new Date("2026-04-05T00:00:00Z")),
      createdAt: now,
      updatedAt: now,
    },
  ];

  const shortlistEntries = [
    {
      id: "shortlist-dj-1",
      providerId: "supplier-music-1",
      notes: "Revisar contrato antes del 10/03",
      createdAt: now,
      updatedAt: now,
      status: "pending",
    },
  ];

  const insights = [
    {
      id: "insight-venue-1",
      providerId: "supplier-venue-1",
      type: "milestone",
      title: "Contrato pendiente de firma",
      createdAt: now,
    },
  ];

  return {
    weddingDoc,
    suppliers,
    supplierLines,
    notifications,
    meetings,
    tasks,
    shortlistEntries,
    insights,
  };
}

async function seed({ reset = false } = {}) {
  initFirebase();
  const auth = admin.auth();
  const db = admin.firestore();

  const plannerEmail = requiredEnv("CYPRESS_TEST_EMAIL");
  const plannerPassword = requiredEnv("CYPRESS_TEST_PASSWORD");
  const weddingId = requiredEnv("CYPRESS_TEST_WEDDING_ID");

  console.log("??  Semilla E2E - Proyecto:", admin.app().options.projectId);
  console.log("   • Planner email:", plannerEmail);
  console.log("   • Wedding ID:", weddingId);

  const user = await ensureAuthUser(auth, {
    email: plannerEmail,
    password: plannerPassword,
    displayName: "Planner E2E QA",
  });

  const plannerUid = user.uid;

  const {
    weddingDoc,
    suppliers,
    supplierLines,
    notifications,
    meetings,
    tasks,
    shortlistEntries,
    insights,
  } = buildSeedData({ plannerUid, weddingId });

  const weddingRef = db.collection("weddings").doc(weddingId);

  if (reset) {
    console.log("??  Limpiando datos existentes para la boda de test...");
    await deleteCollection(weddingRef.collection("suppliers"));
    await deleteCollection(weddingRef.collection("notifications"));
    await deleteCollection(weddingRef.collection("meetings"));
    await deleteCollection(weddingRef.collection("tasks"));
    await deleteCollection(weddingRef.collection("shortlist"));
    await deleteCollection(weddingRef.collection("insights"));
  }

  console.log("??  Sembrando documento principal de la boda...");
  await seedDocument(weddingRef, weddingDoc);

  console.log("??  Sembrando proveedores...");
  await seedCollection(
    weddingRef.collection("suppliers"),
    suppliers.map((prov) => ({ id: prov.id, data: prov }))
  );

  console.log("??  Sembrando líneas de servicio...");
  for (const [supplierId, lines] of Object.entries(supplierLines)) {
    if (!lines.length) continue;
    await seedCollection(
      weddingRef.collection("suppliers").doc(supplierId).collection("serviceLines"),
      lines.map((line) => ({ id: line.id, data: line }))
    );
  }

  console.log("??  Sembrando notificaciones...");
  await seedCollection(
    weddingRef.collection("notifications"),
    notifications.map((notif) => ({ id: notif.id, data: notif }))
  );

  console.log("??  Sembrando reuniones...");
  await seedCollection(
    weddingRef.collection("meetings"),
    meetings.map((item) => ({ id: item.id, data: item }))
  );

  console.log("??  Sembrando tareas...");
  await seedCollection(
    weddingRef.collection("tasks"),
    tasks.map((item) => ({ id: item.id, data: item }))
  );

  console.log("??  Sembrando shortlist...");
  await seedCollection(
    weddingRef.collection("shortlist"),
    shortlistEntries.map((item) => ({ id: item.id, data: item }))
  );

  console.log("??  Sembrando insights...");
  await seedCollection(
    weddingRef.collection("insights"),
    insights.map((item) => ({ id: item.id, data: item }))
  );

  console.log("?  Semilla E2E completada.");
}

const reset = process.argv.includes("--reset");

seed({ reset })
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("?  Error durante la semilla E2E:", err);
    process.exit(1);
  });
