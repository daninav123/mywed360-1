/**
 * Script para actualizar email de proveedor y reenviar solicitud de presupuesto
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

async function resendQuoteEmail() {
  try {
    const requestId = 'BjLhNP2SS8UD9crTp5WM';
    const supplierEmail = 'info@resonaevents.com';
    
    console.log(`📧 Reenviando solicitud de presupuesto: ${requestId}\n`);
    
    // 1. Obtener solicitud
    const doc = await db.collection('quote-requests-internet').doc(requestId).get();
    
    if (!doc.exists) {
      throw new Error('Solicitud no encontrada');
    }
    
    const request = doc.data();
    
    console.log('📄 Solicitud encontrada:');
    console.log(`   Proveedor: ${request.supplierName}`);
    console.log(`   Cliente: ${request.contacto?.nombre}`);
    console.log(`   Email actual: ${request.supplierEmail || 'NO CONFIGURADO'}\n`);
    
    // 2. Actualizar email del proveedor en Firestore
    await db.collection('quote-requests-internet').doc(requestId).update({
      supplierEmail: supplierEmail,
      updatedAt: FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Email actualizado a: ${supplierEmail}\n`);
    
    // 3. Enviar email
    console.log('📤 Enviando email...\n');
    
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
    console.log('║  ✅ EMAIL ENVIADO CORRECTAMENTE                       ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log(`📧 Enviado a: ${supplierEmail}`);
    console.log(`👤 De parte de: ${request.contacto?.nombre}`);
    console.log(`💒 Para evento de ${request.weddingInfo?.numeroInvitados || 'N/A'} personas\n`);
    
    console.log('El proveedor recibirá un email con:');
    console.log('  • Detalles de la boda');
    console.log('  • Info de contacto del cliente');
    console.log('  • Link para responder el presupuesto\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

resendQuoteEmail();
