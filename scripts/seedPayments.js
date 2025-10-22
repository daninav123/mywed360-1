/**
 * Script para crear datos de prueba de pagos en Firestore
 * Genera pagos aleatorios de los últimos 90 días
 */

import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicializar Firebase Admin
const serviceAccountPath = path.resolve(__dirname, '../backend/serviceAccountKey.json');
const serviceAccount = JSON.parse(await import('fs').then(fs => fs.promises.readFile(serviceAccountPath, 'utf8')));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

// Configuración
const NUM_PAYMENTS = 50; // Número de pagos a crear
const DAYS_BACK = 90; // Crear pagos de los últimos X días

const PAYMENT_STATUSES = [
  { status: 'paid', weight: 70 },
  { status: 'succeeded', weight: 20 },
  { status: 'pending', weight: 5 },
  { status: 'failed', weight: 5 },
];

const PAYMENT_METHODS = ['card', 'transfer', 'paypal'];
const CURRENCIES = ['EUR', 'USD'];

// Función para generar fecha aleatoria en los últimos X días
function randomDate(daysBack) {
  const now = new Date();
  const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime);
}

// Función para generar monto aleatorio
function randomAmount() {
  const amounts = [35, 55, 120, 200, 800, 1500];
  return amounts[Math.floor(Math.random() * amounts.length)];
}

// Función para elegir con peso
function weightedRandom(options) {
  const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const option of options) {
    if (random < option.weight) {
      return option.status;
    }
    random -= option.weight;
  }
  return options[0].status;
}

// Generar pagos
async function seedPayments() {
  console.log(`\n🔧 Creando ${NUM_PAYMENTS} pagos de prueba...\n`);
  
  const batch = db.batch();
  const payments = [];
  
  for (let i = 0; i < NUM_PAYMENTS; i++) {
    const createdAt = randomDate(DAYS_BACK);
    const updatedAt = new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000);
    const status = weightedRandom(PAYMENT_STATUSES);
    const amount = randomAmount();
    const currency = CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)];
    
    const payment = {
      amount,
      currency,
      status,
      method: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)],
      description: `Pago de prueba #${i + 1}`,
      userId: `user_${Math.floor(Math.random() * 10) + 1}`,
      weddingId: `wedding_${Math.floor(Math.random() * 5) + 1}`,
      createdAt: admin.firestore.Timestamp.fromDate(createdAt),
      updatedAt: admin.firestore.Timestamp.fromDate(updatedAt),
      metadata: {
        test: true,
        generatedBy: 'seedPayments.js',
        generatedAt: new Date().toISOString(),
      }
    };
    
    const docRef = db.collection('payments').doc();
    batch.set(docRef, payment);
    payments.push({ id: docRef.id, ...payment });
    
    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ Preparados ${i + 1}/${NUM_PAYMENTS} pagos`);
    }
  }
  
  console.log('\n💾 Guardando en Firestore...');
  await batch.commit();
  console.log('✅ Todos los pagos creados exitosamente\n');
  
  // Estadísticas
  const stats = {
    total: payments.length,
    byStatus: {},
    totalAmount: 0,
    byCurrency: {},
  };
  
  payments.forEach(p => {
    stats.byStatus[p.status] = (stats.byStatus[p.status] || 0) + 1;
    if (p.status === 'paid' || p.status === 'succeeded') {
      stats.totalAmount += p.amount;
    }
    stats.byCurrency[p.currency] = (stats.byCurrency[p.currency] || 0) + 1;
  });
  
  console.log('📊 ESTADÍSTICAS:');
  console.log('  - Total pagos:', stats.total);
  console.log('  - Por estado:', stats.byStatus);
  console.log('  - Facturación total:', stats.totalAmount.toFixed(2), 'EUR/USD');
  console.log('  - Por moneda:', stats.byCurrency);
  
  // Calcular últimos 30 días
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const last30Days = payments.filter(p => {
    const date = p.createdAt.toDate();
    return date >= thirtyDaysAgo && (p.status === 'paid' || p.status === 'succeeded');
  });
  
  const revenue30d = last30Days.reduce((sum, p) => sum + p.amount, 0);
  
  console.log('\n💰 ÚLTIMOS 30 DÍAS:');
  console.log('  - Pagos completados:', last30Days.length);
  console.log('  - Facturación:', revenue30d.toFixed(2), 'EUR/USD');
  
  console.log('\n🎯 PRÓXIMO PASO:');
  console.log('  1. Crea los índices en Firestore (ver docs/firestore-indexes-needed.md)');
  console.log('  2. Recarga el dashboard de admin');
  console.log('  3. Deberías ver la facturación actualizada\n');
}

// Ejecutar
seedPayments()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
