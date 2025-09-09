// Signature Service (stub) - integra solicitudes de firma digital de forma simulada
// Integra con servicios reales (DocuSign/HelloSign) en el futuro.

import admin from 'firebase-admin';
import { randomUUID } from 'crypto';

const weddingDoc = (weddingId) => admin.firestore().collection('weddings').doc(String(weddingId));

export async function createSignatureRequest(weddingId, documentMeta, signers = []) {
  if (!weddingId) throw new Error('weddingId requerido');
  const id = `sig_${Date.now()}_${randomUUID()}`;
  const payload = {
    id,
    documentId: documentMeta?.id || null,
    title: documentMeta?.title || 'Documento a firmar',
    status: 'pending',
    signers: signers.map((s, i) => ({
      id: s.id || `signer_${i+1}`,
      name: s.name,
      email: s.email,
      role: s.role || 'participant',
      status: 'pending',
    })),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await weddingDoc(weddingId).collection('signatures').doc(id).set(payload);
  return payload;
}

export async function listSignatureRequests(weddingId, limit = 50) {
  const snap = await weddingDoc(weddingId).collection('signatures').orderBy('createdAt', 'desc').limit(limit).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateSignatureStatus(weddingId, signatureId, updates) {
  const ref = weddingDoc(weddingId).collection('signatures').doc(signatureId);
  await ref.set({ ...updates, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  const fresh = await ref.get();
  return { id: fresh.id, ...fresh.data() };
}

export async function getSignatureStatus(weddingId, signatureId) {
  const snap = await weddingDoc(weddingId).collection('signatures').doc(signatureId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}
