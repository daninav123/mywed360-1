import axios from 'axios';
import { db } from '../db.js';

const TEST_CONFIG = {
  userId: '9EstYa0T8WRBm9j0XwnE8zU1iFo1',
  supplierId: 'resonaevents',
  supplierEmail: 'info@resonaevents.com',
  apiUrl: 'http://localhost:4004',
};

async function testRealQuoteRequest() {
  try {
    console.log('🧪 TEST: Solicitud real de presupuesto desde API\n');
    console.log('=====================================\n');

    // 1. Obtener info del usuario
    console.log('1️⃣ Verificando usuario...');
    const userDoc = await db.collection('users').doc(TEST_CONFIG.userId).get();
    if (!userDoc.exists) {
      throw new Error('Usuario no encontrado');
    }
    const userData = userDoc.data();
    console.log(`✅ Usuario: ${userData.email}`);
    console.log(`   maLoveEmail: ${userData.maLoveEmail}`);
    console.log(`   myWed360Email: ${userData.myWed360Email}\n`);

    // 2. Simular payload del frontend
    console.log('2️⃣ Enviando solicitud de presupuesto (simulando frontend)...');
    const payload = {
      weddingInfo: {
        fecha: '2025-06-15',
        hora: '18:00',
        lugar: 'Barcelona',
        ciudad: 'Barcelona',
        numeroInvitados: 150,
        presupuestoAsignado: 2000,
      },
      contacto: {
        nombre: 'Dani Navarro',
        email: userData.email, // Email de login (danielnavarrocampos@icloud.com)
        telefono: '+34 600 000 000',
      },
      proveedor: {
        id: TEST_CONFIG.supplierId,
        name: 'ReSona Events',
        category: 'musica',
        categoryName: 'Música',
        email: TEST_CONFIG.supplierEmail,
        source: 'internet',
      },
      serviceDetails: {
        tipo: 'DJ + Saxo',
        duracion: '5 horas',
      },
      customMessage: 'Test desde API - verificar Reply-To y bandeja salida',
      userId: TEST_CONFIG.userId,
      weddingId: null,
    };

    console.log(`   userId: ${payload.userId}`);
    console.log(`   contacto.email: ${payload.contacto.email}`);

    const response = await axios.post(
      `${TEST_CONFIG.apiUrl}/api/suppliers/${TEST_CONFIG.supplierId}/quote-requests`,
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    console.log(`✅ Solicitud enviada exitosamente`);
    console.log(`   Request ID: ${response.data.requestId || 'N/A'}\n`);

    // 3. Verificar en bandeja de salida del usuario
    console.log('3️⃣ Verificando email en bandeja salida del usuario...');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const sentMails = await db.collection('users')
      .doc(TEST_CONFIG.userId)
      .collection('mails')
      .where('folder', '==', 'sent')
      .limit(20)
      .get();

    if (sentMails.empty) {
      console.log('❌ FALLO: Email NO encontrado en bandeja de salida del usuario\n');
      process.exit(1);
    }

    // Buscar el más reciente
    let latestSent = null;
    let latestDate = null;
    sentMails.docs.forEach(doc => {
      const data = doc.data();
      const mailDate = new Date(data.date);
      if (!latestDate || mailDate > latestDate) {
        latestDate = mailDate;
        latestSent = { id: doc.id, data };
      }
    });

    const mailData = latestSent.data;
    
    console.log('✅ Email encontrado en bandeja de salida');
    console.log(`   ID: ${latestSent.id}`);
    console.log(`   From: ${mailData.from}`);
    console.log(`   To: ${mailData.to}`);
    console.log(`   Subject: ${mailData.subject}`);
    console.log(`   Folder: ${mailData.folder}\n`);

    // 4. Verificar Reply-To correcto
    if (mailData.from === userData.maLoveEmail || mailData.from === userData.myWed360Email) {
      console.log('✅ Reply-To correcto: Usa email de la app (@malove.app)');
    } else if (mailData.from === userData.email) {
      console.log('❌ FALLO: Reply-To usa email de login, debería usar maLoveEmail');
    } else {
      console.log(`⚠️ Reply-To inesperado: ${mailData.from}`);
    }

    console.log('\n🎉 TEST COMPLETADO\n');
    console.log('=====================================');
    console.log('✅ Solicitud enviada desde API');
    console.log('✅ Email guardado en bandeja salida del usuario');
    console.log('👀 Revisa tu bandeja en: http://localhost:5173');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en test:', error.response?.data || error.message);
    process.exit(1);
  }
}

testRealQuoteRequest();
