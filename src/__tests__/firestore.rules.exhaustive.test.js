// @vitest-environment node
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { beforeAll, afterAll, describe, test } from 'vitest';

const RUN_FIRESTORE_RULES =
  process.env.FIRESTORE_RULES_TESTS === 'true' || !!process.env.FIRESTORE_EMULATOR_HOST;
const D = RUN_FIRESTORE_RULES ? describe : describe.skip;

let testEnv;
const PROJECT_ID = 'maloveapp-test-exhaustive';

beforeAll(async () => {
  if (!RUN_FIRESTORE_RULES) return;
  const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');
  testEnv = await initializeTestEnvironment({ projectId: PROJECT_ID, firestore: { rules } });

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const adminDb = ctx.firestore();

    await setDoc(doc(adminDb, 'weddings', 'wX'), {
      ownerIds: ['ownerX'],
      plannerIds: ['plannerX'],
      assistantIds: ['assistantX'],
      name: 'Wedding X',
    });

    // Seed docs to read later
    const subcollections = [
      'tasks',
      'meetings',
      'guests',
      'seatingPlan',
      'suppliers',
      'weddingInvitations',
      'tasksCompleted',
    ];
    await Promise.all(
      subcollections.map((col) =>
        setDoc(doc(adminDb, 'weddings', 'wX', col, 'doc1'), { sample: true })
      )
    );

    // weddingInfo is a single doc inside the wedding path
    await setDoc(doc(adminDb, 'weddings', 'wX', 'weddingInfo'), { banquetPlace: 'Salon Real' });

    // user profile docs
    await setDoc(doc(adminDb, 'users', 'ownerX'), { name: 'Own', role: 'owner' });
    await setDoc(doc(adminDb, 'users', 'plannerX'), { name: 'Plan', role: 'planner' });
  });
});

afterAll(async () => {
  if (testEnv?.cleanup) {
    await testEnv.cleanup();
  }
});

const ctx = (uid) => (uid ? testEnv.authenticatedContext(uid) : testEnv.unauthenticatedContext());

const COLLECTIONS = [
  'tasks',
  'meetings',
  'guests',
  'seatingPlan',
  'suppliers',
  'weddingInvitations',
  'tasksCompleted',
];

D.each(COLLECTIONS)('%s subcollection permissions', (col) => {
  const newId = col + 'New';

  test('Owner can WRITE', async () => {
    const db = ctx('ownerX').firestore();
    const ref = doc(db, 'weddings', 'wX', col, newId);
    await assertSucceeds(setDoc(ref, { field: 'ok' }));
  });

  test('Planner can WRITE', async () => {
    const db = ctx('plannerX').firestore();
    const ref = doc(db, 'weddings', 'wX', col, newId + '2');
    await assertSucceeds(setDoc(ref, { field: 'ok' }));
  });

  test('Assistant CANNOT WRITE', async () => {
    const db = ctx('assistantX').firestore();
    const ref = doc(db, 'weddings', 'wX', col, newId + '3');
    await assertFails(setDoc(ref, { field: 'nope' }));
  });

  test('Unauthenticated cannot READ', async () => {
    const db = ctx(null).firestore();
    const ref = doc(db, 'weddings', 'wX', col, 'doc1');
    await assertFails(getDoc(ref));
  });
});

D('weddingInfo doc permissions', () => {
  test('Owner can UPDATE weddingInfo', async () => {
    const db = ctx('ownerX').firestore();
    const ref = doc(db, 'weddings', 'wX', 'weddingInfo');
    await assertSucceeds(setDoc(ref, { banquetPlace: 'Nuevo' }, { merge: true }));
  });

  test('Assistant cannot UPDATE weddingInfo', async () => {
    const db = ctx('assistantX').firestore();
    const ref = doc(db, 'weddings', 'wX', 'weddingInfo');
    await assertFails(setDoc(ref, { banquetPlace: 'Hack' }, { merge: true }));
  });
});

D('users profile rules', () => {
  test('User can UPDATE own profile', async () => {
    const db = ctx('plannerX').firestore();
    await assertSucceeds(setDoc(doc(db, 'users', 'plannerX'), { bio: 'hello' }, { merge: true }));
  });

  test('User cannot UPDATE others profile', async () => {
    const db = ctx('plannerX').firestore();
    await assertFails(setDoc(doc(db, 'users', 'ownerX'), { bio: 'hack' }, { merge: true }));
  });

  test('Unauthenticated cannot WRITE profile', async () => {
    const db = ctx(null).firestore();
    await assertFails(setDoc(doc(db, 'users', 'anon'), { name: 'Anon' }));
  });
});

D('wedding delete permissions', () => {
  test('Only owner or planner can DELETE wedding', async () => {
    const dbOwner = ctx('ownerX').firestore();
    await assertSucceeds(deleteDoc(doc(dbOwner, 'weddings', 'wX')));

    // recreate for next test
    await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
      await setDoc(doc(adminCtx.firestore(), 'weddings', 'wX'), {
        ownerIds: ['ownerX'],
        plannerIds: ['plannerX'],
      });
    });

    const dbPlanner = ctx('plannerX').firestore();
    await assertSucceeds(deleteDoc(doc(dbPlanner, 'weddings', 'wX')));
  });

  test('Assistant cannot DELETE wedding', async () => {
    await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
      await setDoc(doc(adminCtx.firestore(), 'weddings', 'wX'), {
        ownerIds: ['ownerX'],
        assistantIds: ['assistantX'],
      });
    });
    const db = ctx('assistantX').firestore();
    await assertFails(deleteDoc(doc(db, 'weddings', 'wX')));
  });
});

