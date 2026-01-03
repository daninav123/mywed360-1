/**
 * Script para corregir email y reenviar solicitud a ReSona Events
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { sendQuoteRequestEmail } from '../services/quoteRequestEmailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../../../variables entorno/backend/serviceAccount.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = getFirestore();

async function fixResonaEmail() {
  try {
    const requestId = 'lMttrdlwt5HQyhqW8djw';
    const supplierEmail = 'info@resonaevents.com';
    
    console.log('🔧 Corrigiendo solicitud a ReSona Events\n');
    
    // 1. Actualizar email en Firestore
    console.log('📝 Actualizando email en Firestore...');
    await db.collection('quote-requests-internet').doc(requestId).update({
      supplierEmail: supplierEmail,
      'supplierInfo.email': supplierEmail,
      updatedAt: FieldValue.serverTimestamp()
    });
    console.log('✅ Email actualizado\n');
    
    // 2. Obtener datos de la solicitud
    const doc = await db.collection('quote-requests-internet').doc(requestId).get();
    const request = doc.data();
    
    // 3. Enviar email
    console.log('📤 Enviando email a info@resonaevents.com...\n');
    
    await sendQuoteRequestEmail({
      supplierEmail: supplierEmail,
      supplierName: request.supplierName,
      clientName: request.contacto?.nombre,
      clientEmail: request.contacto?.email,
      clientPhone: request.contacto?.telefono,
      weddingDate: request.weddingInfo?.fecha,
      city: request.weddingInfo?.ciudad,
      guestCount: request.weddingInfo?.numeroInvitados,
      totalBudget: request.weddingInfo?.presupuestoTotal,
      categoryName: request.supplierCategoryName || 'Música',
      serviceDetails: request.serviceDetails || {},
      customMessage: request.customMessage || '',
      responseUrl: request.responseUrl,
      requestId: requestId
    });
    
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ EMAIL ENVIADO A RESONA EVENTS                     ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log(`📧 Destinatario: ${supplierEmail}`);
    console.log(`👤 Cliente: ${request.contacto?.nombre}`);
    console.log(`📅 Solicitud: ${requestId}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixResonaEmail();
