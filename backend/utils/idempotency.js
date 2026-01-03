import { db } from '../db.js';

// Stores a short-lived marker document per webhook/event to avoid duplicates.
// Returns true if the id was already seen (duplicate), false otherwise.
// When first seen, it writes a doc with an expireAt timestamp to allow TTL cleanup.
async function seenOrMark(id, ttlSeconds = 60 * 60) {
  const now = new Date();
  const expireAt = new Date(now.getTime() + ttlSeconds * 1000);
  const ref = db.collection('webhookDedup').doc(id);
  try {
    // .create() fails if the document exists — atomic idempotency gate
    await ref.create({ createdAt: now.toISOString(), expireAt });
    return false; // first time
  } catch (e) {
    // If already exists or any other error, treat as seen to be safe for idempotency
    return true;
  }
}

export { seenOrMark };

