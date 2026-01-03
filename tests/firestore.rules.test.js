import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import fs from 'fs';
import path from 'path';

let testEnv;

describe('Firestore security rules (core)', () => {
  beforeAll(async () => {
    const projectId = `mw360-test-${Date.now()}`;
    const rules = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');
    testEnv = await initializeTestEnvironment({ projectId, firestore: { rules } });
  }, 30000);

  afterAll(async () => {
    await testEnv?.cleanup();
  });

  it('user can read/write own user profile, but not others', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const bob = testEnv.authenticatedContext('bob').firestore();

    await assertSucceeds(alice.doc('users/alice').set({ name: 'Alice' }));
    await assertSucceeds(alice.doc('users/alice').get());

    await assertFails(alice.doc('users/bob').get());
    await assertFails(bob.doc('users/alice').set({ name: 'Nope' }));
  });

  it('wedding read allowed to owner; denied to others', async () => {
    // Seed a wedding with owner alice using admin privileges
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await db.doc('weddings/w1').set({ name: 'Wedding', ownerIds: ['alice'], plannerIds: [], assistantIds: [] });
    });

    const alice = testEnv.authenticatedContext('alice').firestore();
    const bob = testEnv.authenticatedContext('bob').firestore();

    await assertSucceeds(alice.doc('weddings/w1').get());
    await assertFails(bob.doc('weddings/w1').get());
  });

  it('seatingPlan/banquet must respect config constraints (aisleMin >= 40)', async () => {
    // Seed wedding and collaborator
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await db.doc('weddings/w2').set({ name: 'W2', ownerIds: ['alice'], plannerIds: [], assistantIds: [] });
    });

    const alice = testEnv.authenticatedContext('alice').firestore();
    const banquetDoc = alice.doc('weddings/w2/seatingPlan/banquet');

    // Invalid: aisleMin too small
    await assertFails(banquetDoc.set({ config: { width: 500, height: 300, aisleMin: 20 } }));

    // Valid: within range
    await assertSucceeds(banquetDoc.set({ config: { width: 500, height: 300, aisleMin: 60 } }));
  });
});

