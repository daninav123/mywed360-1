// @vitest-environment node
import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testEnv;

const RUN_FIRESTORE_RULES = process.env.FIRESTORE_RULES_TESTS === 'true' || !!process.env.FIRESTORE_EMULATOR_HOST;
const describeIf = RUN_FIRESTORE_RULES ? describe : describe.skip;

describeIf('Firestore rules - seatingPlan (banquet/ceremony)', () => {
  beforeAll(async () => {
    const rulesPath = path.resolve(__dirname, '../../firestore.rules');
    const rules = await fs.readFile(rulesPath, 'utf8');
    testEnv = await initializeTestEnvironment({
      projectId: 'mywed360-rules-test',
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

  it('rechaza banquet con aisleMin < 40', async () => {
    const user = testEnv.authenticatedContext('user1');
    const db = user.firestore();
    const ref = doc(db, 'weddings', 'w1', 'seatingPlan', 'banquet');
    await assertFails(
      setDoc(ref, {
        config: { width: 1000, height: 800, aisleMin: 30 },
        tables: [],
        areas: [],
      }, { merge: true })
    );
  });

  it('permite banquet válido con config anidado', async () => {
    const user = testEnv.authenticatedContext('user1');
    const db = user.firestore();
    const ref = doc(db, 'weddings', 'w1', 'seatingPlan', 'banquet');
    await assertSucceeds(
      setDoc(ref, {
        config: { width: 1200, height: 800, aisleMin: 80 },
        tables: [],
        areas: [],
      }, { merge: true })
    );
  });

  it('permite banquet válido con config plano (compat)', async () => {
    const user = testEnv.authenticatedContext('user1');
    const db = user.firestore();
    const ref = doc(db, 'weddings', 'w1', 'seatingPlan', 'banquet');
    await assertSucceeds(
      setDoc(ref, {
        width: 1600,
        height: 1000,
        aisleMin: 100,
        tables: [],
        areas: [],
      }, { merge: true })
    );
  });

  it('rechaza ceremony con seats no-list', async () => {
    const user = testEnv.authenticatedContext('user1');
    const db = user.firestore();
    const ref = doc(db, 'weddings', 'w1', 'seatingPlan', 'ceremony');
    await assertFails(
      setDoc(ref, {
        tables: [],
        areas: [],
        seats: { id: 1 },
      }, { merge: true })
    );
  });

  it('permite ceremony válido con seats list', async () => {
    const user = testEnv.authenticatedContext('user1');
    const db = user.firestore();
    const ref = doc(db, 'weddings', 'w1', 'seatingPlan', 'ceremony');
    await assertSucceeds(
      setDoc(ref, {
        tables: [],
        areas: [],
        seats: [ { id: 1, x: 10, y: 10, enabled: true } ],
      }, { merge: true })
    );
  });
});
