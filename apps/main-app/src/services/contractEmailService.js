import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';

import { db } from '../firebaseConfig';

const CONTRACT_COLLECTION_PATH = (weddingId) => ['weddings', weddingId, 'contracts'];
const EMAIL_KEYWORDS = ['contrato', 'contract', 'agreement', 'contratación', 'firmado'];
const ATTACHMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];
const ATTACHMENT_MIME_PREFIX = [
  'application/pdf',
  'application/msword',
  'application/vnd.ms-',
  'application/vnd.openxmlformats-officedocument'
];

const getExtension = (filename = '') => {
  const match = String(filename).toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : '';
};

const isDocumentAttachment = (attachment = {}) => {
  const ext = getExtension(attachment.filename || attachment.name || '');
  if (ext && ATTACHMENT_EXTENSIONS.includes(ext)) return true;
  const type = String(attachment.contentType || attachment.mimeType || attachment.type || '')
    .toLowerCase()
    .trim();
  if (!type) return false;
  return ATTACHMENT_MIME_PREFIX.some((prefix) => type.startsWith(prefix));
};

const matchesContractHeuristics = (email) => {
  const subject = String(email?.subject || '').toLowerCase();
  const body = String(email?.body || '').toLowerCase();
  return EMAIL_KEYWORDS.some((keyword) => subject.includes(keyword) || body.includes(keyword));
};

const buildContractPayload = (email, attachmentList, weddingId) => {
  const primaryAttachment = attachmentList[0] || {};
  const providerName =
    email?.from ||
    email?.sender ||
    email?.headers?.from ||
    email?.headers?.sender ||
    'Proveedor';

  return {
    provider: providerName,
    type: 'Contrato',
    signedDate: null,
    serviceDate: null,
    status: 'Pendiente',
    docUrl: primaryAttachment.url || primaryAttachment.link || null,
    attachments: attachmentList,
    source: {
      emailId: email?.id || null,
      subject: email?.subject || '',
      from: email?.from || email?.sender || '',
      receivedAt: email?.date || new Date().toISOString(),
      weddingId
    },
    createdAt: serverTimestamp()
  };
};

const normalizeAttachment = (attachment, index = 0, emailId = '') => ({
  id: attachment?.id || `${emailId || 'email'}_att_${index}`,
  filename: attachment?.filename || attachment?.name || `adjunto-${index + 1}`,
  url: attachment?.url || attachment?.link || null,
  size: attachment?.size || null,
  contentType: attachment?.contentType || attachment?.mimeType || attachment?.type || null,
  storagePath: attachment?.storagePath || null
});

const shouldProcessEmail = (email) => {
  if (!email) return false;
  if (String(email.folder || '').toLowerCase() !== 'inbox') return false;
  const attachments = Array.isArray(email.attachments) ? email.attachments : [];
  const contractAttachments = attachments.filter(isDocumentAttachment);
  if (!contractAttachments.length) return false;
  if (!matchesContractHeuristics(email)) return false;
  return true;
};

const checkExistingContract = async (weddingId, emailId) => {
  try {
    if (!weddingId || !emailId) return false;
    const colRef = collection(db, ...CONTRACT_COLLECTION_PATH(weddingId));
    const q = query(colRef, where('source.emailId', '==', emailId));
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (error) {
    // console.warn('[contractEmailService] checkExistingContract error', error);
    return false;
  }
};

const processedStorageKey = (weddingId) =>
  `maloveapp_contracts_processed_${weddingId || 'global'}`;

const loadProcessed = (weddingId) => {
  try {
    const raw = localStorage.getItem(processedStorageKey(weddingId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const saveProcessed = (weddingId, processedSet) => {
  try {
    const arr = Array.from(processedSet);
    localStorage.setItem(processedStorageKey(weddingId), JSON.stringify(arr));
  } catch {}
};

/**
 * Analiza un correo entrante y crea automáticamente un contrato básico
 * en Firestore cuando detecta adjuntos relevantes.
 * Devuelve true si se guardó un contrato, false en caso contrario.
 */
export async function ensureContractFromEmail(email, weddingId) {
  try {
    if (!db || !weddingId || !email) return false;
    if (!shouldProcessEmail(email)) return false;

    const processed = loadProcessed(weddingId);
    if (processed.has(email.id)) return false;

    const alreadyExists = await checkExistingContract(weddingId, email.id);
    if (alreadyExists) {
      processed.add(email.id);
      saveProcessed(weddingId, processed);
      return false;
    }

    const attachments = (email.attachments || [])
      .filter(isDocumentAttachment)
      .map((att, index) => normalizeAttachment(att, index, email.id));

    if (!attachments.length) return false;

    const payload = buildContractPayload(email, attachments, weddingId);
    const colRef = collection(db, ...CONTRACT_COLLECTION_PATH(weddingId));
    await addDoc(colRef, payload);

    processed.add(email.id);
    saveProcessed(weddingId, processed);
    return true;
  } catch (error) {
    // console.error('[contractEmailService] ensureContractFromEmail error', error);
    return false;
  }
}

