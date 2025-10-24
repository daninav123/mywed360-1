/* eslint-disable no-unused-vars */
// @vitest-environment node
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { beforeAll, afterAll, describe, test, expect } from 'vitest';

let testEnv;

/** @type {RulesTestEnvironment} */

const PROJECT_ID = 'maloveapp-test';

beforeAll(async () => {
  // Carga las reglas del archivo real del proyecto
  const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules },
  });

  // Semilla de datos: crear una boda con distintos roles
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const adminDb = ctx.firestore();

    await adminDb.doc('weddings/w1').set({
      ownerIds: ['owner1'],
      plannerIds: ['planner1'],
      assistantIds: ['assistant1'],
      name: 'Test Wedding',
    });

    // Subcolección de tareas
    await adminDb.doc('weddings/w1/tasks/t1').set({
      name: 'Reservar catering',
      completed: false,
    });

});
}, 60000);

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

const getContext = (uid) => {
  if (!uid) return testEnv.unauthenticatedContext();
  return testEnv.authenticatedContext(uid);
};

describe('Reglas de Firestore - bodas', () => {
  test('Owner puede leer y escribir su boda', async () => {
    const ctx = getContext('owner1');
    const db = ctx.firestore();

    // Read
    const weddingRef = db.doc('weddings/w1');
    await assertSucceeds(weddingRef.get());
    // Write (update un campo)
    await assertSucceeds(weddingRef.set({ updatedBy: 'owner1' }, { merge: true }));
  });

  test('Planner puede leer y escribir su boda', async () => {
    const ctx = getContext('planner1');
    const db = ctx.firestore();
    const weddingRef = db.doc('weddings/w1');
    await assertSucceeds(weddingRef.get());
    await assertSucceeds(weddingRef.set({ title: 'Planner edit' }, { merge: true }));
  });

  test('Assistant puede leer pero no escribir', async () => {
    const ctx = getContext('assistant1');
    const db = ctx.firestore();
    const weddingRef = db.doc('weddings/w1');
    await assertSucceeds(weddingRef.get());
    await assertFails(weddingRef.set({ title: 'No allowed' }, { merge: true }));
  });

  test('Usuario externo no puede leer', async () => {
    const ctx = getContext('randomUser');
    const db = ctx.firestore();
    await assertFails(db.doc('weddings/w1').get());
  });

  test('Planner puede leer y escribir subcolección tasks', async () => {
    const ctx = getContext('planner1');
    const db = ctx.firestore();
    const taskRef = db.doc('weddings/w1/tasks/t1');
    await assertSucceeds(taskRef.get());
    await assertSucceeds(taskRef.set({ completed: true }, { merge: true }));
  });

  test('Assistant puede leer pero no escribir subcolección', async () => {
    const ctx = getContext('assistant1');
    const db = ctx.firestore();
    const taskRef = db.doc('weddings/w1/tasks/t1');
    await assertSucceeds(taskRef.get());
    await assertFails(taskRef.set({ completed: true }, { merge: true }));
  });
});

describe('Colecciones de diagnóstico', () => {
  test('_conexion_prueba lectura/escritura sin auth', async () => {
    const ctx = getContext(null); // no autenticado
    const db = ctx.firestore();
    const ref = db.doc('_conexion_prueba/test');
    await assertFails(ref.set({ ok: true }));
    await assertSucceeds(ref.get());
  });

  test('_test_connection lectura/escritura sin auth', async () => {
    const ctx = getContext(null);
    const db = ctx.firestore();
    const ref = db.doc('_test_connection/test');
    await assertFails(ref.set({ ok: true }));
    await assertSucceeds(ref.get());
  });
});
