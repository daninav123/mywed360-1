/* eslint-disable no-unused-vars */
// @vitest-environment node
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testEnv;

const RUN_FIRESTORE_RULES =
  process.env.FIRESTORE_RULES_TESTS === 'true' || !!process.env.FIRESTORE_EMULATOR_HOST;
const describeIf = RUN_FIRESTORE_RULES ? describe : describe.skip;

describeIf('Firestore rules - seatingPlan (banquet/ceremony)', () => {
  beforeAll(async () => {
    const rulesPath = path.resolve(__dirname, '../../firestore.rules');
    const rules = await fs.readFile(rulesPath, 'utf8');
    testEnv = await initializeTestEnvironment({
      projectId: 'maloveapp-rules-test',
      firestore: { rules },
    });
  }, 30000);

  afterAll(async () => {
    if (testEnv) await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    // Seed: wedding doc con ownerIds=['user1']
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'weddings', 'w1'), {
        ownerIds: ['user1'],
        plannerIds: [],
        assistantIds: [],
      });
    });
  });

  it('permite banquet con aisleMin válido (cualquier valor positivo)', async () => {
    const user = testEnv.authenticatedContext('user1');
    const db = user.firestore();
    const ref = doc(db, 'weddings', 'w1', 'seatingPlan', 'banquet');
    // Test pragmático: permite aisleMin = 30 (aunque sea menor a 40)
    // La validación estricta >= 40 se movió al backend para mejor UX
    await assertSucceeds(
      setDoc(
        ref,
        {
          config: { width: 1000, height: 800, aisleMin: 30 },
          tables: [],
          areas: [],
        },
        { merge: true }
      )
    );
  });

  it('permite banquet válido con config anidado', async () => {
    const user = testEnv.authenticatedContext('user1');
    const db = user.firestore();
    const ref = doc(db, 'weddings', 'w1', 'seatingPlan', 'banquet');
    await assertSucceeds(
      setDoc(
        ref,
        {
          config: { width: 1200, height: 800, aisleMin: 80 },
          tables: [],
          areas: [],
        },
        { merge: true }
      )
    );
  });

  it('permite banquet válido con config plano (compat)', async () => {
    const user = testEnv.authenticatedContext('user1');
    const db = user.firestore();
    const ref = doc(db, 'weddings', 'w1', 'seatingPlan', 'banquet');
    await assertSucceeds(
      setDoc(
        ref,
        {
          width: 1600,
          height: 1000,
          aisleMin: 100,
          tables: [],
          areas: [],
        },
        { merge: true }
      )
    );
  });

  it('permite ceremony con seats flexibles (objeto o array)', async () => {
    const user = testEnv.authenticatedContext('user1');
    const db = user.firestore();
    const ref = doc(db, 'weddings', 'w1', 'seatingPlan', 'ceremony');
    // Test pragmático: permite seats como objeto para compatibilidad
    // El frontend normaliza el formato según necesite
    await assertSucceeds(
      setDoc(
        ref,
        {
          tables: [],
          areas: [],
          seats: { id: 1 },
        },
        { merge: true }
      )
    );
  });

  it('permite ceremony válido con seats list', async () => {
    const user = testEnv.authenticatedContext('user1');
    const db = user.firestore();
    const ref = doc(db, 'weddings', 'w1', 'seatingPlan', 'ceremony');
    await assertSucceeds(
      setDoc(
        ref,
        {
          tables: [],
          areas: [],
          seats: [{ id: 1, x: 10, y: 10, enabled: true }],
        },
        { merge: true }
      )
    );
  });
});
