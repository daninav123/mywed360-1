// Legal Documents Service - generación básica de PDFs y metadatos
// Requisitos: pdfkit (disponible en package raíz)

import admin from 'firebase-admin';
import PDFDocument from 'pdfkit';
import { randomUUID } from 'crypto';

const weddingCol = (weddingId) => admin.firestore().collection('weddings').doc(String(weddingId));

export function listTemplates() {
  // Plantillas mínimas por tipo/subtipo (expandible)
  return [
    { id: 'provider_contract_basic', name: 'Contrato Proveedor Básico', type: 'provider_contract' },
    { id: 'image_rights_basic', name: 'Cesión de Imagen Básica', type: 'image_rights' },
    { id: 'terms_conditions_basic', name: 'Términos y Condiciones', type: 'terms_conditions' },
  ];
}

export async function generateContract(weddingId, payload = {}) {
  const id = `legal_${Date.now()}_${randomUUID()}`;

  // Construir PDF simple en memoria
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks = [];
  return await new Promise((resolve, reject) => {
    try {
      doc.on('data', (buf) => chunks.push(buf));
      doc.on('end', async () => {
        const pdfBuffer = Buffer.concat(chunks);
        const pdfBase64 = pdfBuffer.toString('base64');
        const meta = {
          id,
          type: payload.type || 'provider_contract',
          subtype: payload.subtype || 'general',
          title: payload.title || 'Documento Legal MaLoveApp',
          createdAt: new Date().toISOString(),
          status: 'draft',
          size: pdfBuffer.length,
        };
        resolve({ id, pdfBase64, meta });
      });

      // Contenido mínimo
      doc.fontSize(18).text('Documento Legal - MaLoveApp', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Boda: ${weddingId}`);
      doc.text(`Tipo: ${payload.type || 'provider_contract'}`);
      if (payload.subtype) doc.text(`Subtipo: ${payload.subtype}`);
      doc.text(`Título: ${payload.title || 'Documento Legal MaLoveApp'}`);
      doc.moveDown();
      doc.fontSize(11).text('Datos del servicio:', { underline: true });
      const lines = JSON.stringify(payload.data || {}, null, 2).split('\n');
      lines.forEach(l => doc.text(l));
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

export async function saveDocumentMeta(weddingId, meta) {
  const ref = await weddingCol(weddingId).collection('documents').add({
    ...meta,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
}

export async function listDocuments(weddingId, limit = 50) {
  const snap = await weddingCol(weddingId).collection('documents').orderBy('createdAt', 'desc').limit(limit).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
