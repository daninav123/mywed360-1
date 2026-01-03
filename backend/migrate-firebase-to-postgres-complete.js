/**
 * MIGRACIÓN COMPLETA: Firebase → PostgreSQL
 * Migra Timeline, Checklist/Tasks, Special Moments y Finance
 */

import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccount.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const prisma = new PrismaClient();

console.log('\n🔄 MIGRACIÓN COMPLETA: Firebase → PostgreSQL\n');
console.log('='.repeat(70));

async function migrateAllData() {
  try {
    // 1. Obtener todas las bodas de PostgreSQL
    const weddings = await prisma.wedding.findMany({
      select: { id: true, coupleName: true }
    });

    console.log(`\n📋 Bodas encontradas: ${weddings.length}\n`);

    let totalMigrated = {
      tasks: 0,
      timelineEvents: 0,
      specialMoments: 0,
      transactions: 0
    };

    for (const wedding of weddings) {
      console.log(`\n🔹 Procesando: ${wedding.coupleName} (${wedding.id})`);

      // ==================================================
      // MIGRAR CHECKLIST/TASKS
      // ==================================================
      try {
        const checklistDoc = await db
          .collection('weddings')
          .doc(wedding.id)
          .collection('ceremonyChecklist')
          .doc('main')
          .get();

        if (checklistDoc.exists) {
          const data = checklistDoc.data();
          const items = data.items || [];
          
          for (const item of items) {
            await prisma.task.create({
              data: {
                weddingId: wedding.id,
                title: item.label || item.title || 'Sin título',
                description: item.notes || null,
                category: item.category || 'general',
                status: item.status || 'pending',
                dueDate: item.dueDate ? new Date(item.dueDate) : null,
                priority: item.critical ? 'high' : 'medium',
                completed: item.status === 'done',
                completedAt: item.status === 'done' ? new Date() : null,
                notes: item.relatedDocType || null
              }
            });
            totalMigrated.tasks++;
          }
          console.log(`   ✅ Tasks: ${items.length} migradas`);
        }
      } catch (error) {
        console.log(`   ⚠️  Tasks: No se encontraron o error - ${error.message}`);
      }

      // ==================================================
      // MIGRAR TIMELINE
      // ==================================================
      try {
        const timelineDoc = await db
          .collection('weddings')
          .doc(wedding.id)
          .collection('timeline')
          .doc('main')
          .get();

        if (timelineDoc.exists) {
          const data = timelineDoc.data();
          const blocks = data.blocks || [];
          
          let order = 0;
          for (const block of blocks) {
            await prisma.timelineEvent.create({
              data: {
                weddingId: wedding.id,
                name: block.name || block.id,
                startTime: block.startTime || '00:00',
                endTime: block.endTime || '00:00',
                status: block.status || 'on-time',
                order: order++,
                moments: block.moments || null,
                alerts: block.alerts || null,
                notes: block.id || null
              }
            });
            totalMigrated.timelineEvents++;
          }
          console.log(`   ✅ Timeline: ${blocks.length} eventos migrados`);
        }
      } catch (error) {
        console.log(`   ⚠️  Timeline: No se encontró o error - ${error.message}`);
      }

      // ==================================================
      // MIGRAR SPECIAL MOMENTS (Música)
      // ==================================================
      try {
        const momentsSnapshot = await db
          .collection('weddings')
          .doc(wedding.id)
          .collection('specialMoments')
          .get();

        let momentCount = 0;
        for (const doc of momentsSnapshot.docs) {
          const moment = doc.data();
          
          await prisma.specialMoment.create({
            data: {
              weddingId: wedding.id,
              blockId: moment.blockId || 'general',
              title: moment.title || 'Momento especial',
              time: moment.time || null,
              duration: moment.duration?.toString() || '15',
              songTitle: moment.song?.title || moment.songTitle || null,
              artist: moment.song?.artist || moment.artist || null,
              spotifyId: moment.song?.spotifyId || null,
              responsible: moment.responsables?.[0]?.name || null,
              status: moment.state || moment.status || 'pendiente',
              type: moment.type || null,
              notes: doc.id
            }
          });
          momentCount++;
          totalMigrated.specialMoments++;
        }
        
        if (momentCount > 0) {
          console.log(`   ✅ Música: ${momentCount} momentos migrados`);
        }
      } catch (error) {
        console.log(`   ⚠️  Música: No se encontraron o error - ${error.message}`);
      }

      // ==================================================
      // MIGRAR FINANCE/TRANSACTIONS
      // ==================================================
      try {
        const transactionsSnapshot = await db
          .collection('weddings')
          .doc(wedding.id)
          .collection('transactions')
          .get();

        let txCount = 0;
        for (const doc of transactionsSnapshot.docs) {
          const tx = doc.data();
          
          await prisma.transaction.create({
            data: {
              weddingId: wedding.id,
              category: tx.category || 'otros',
              description: tx.description || tx.title || 'Transacción',
              amount: parseFloat(tx.amount) || 0,
              type: tx.type || 'expense',
              status: tx.status || 'pending',
              dueDate: tx.dueDate ? new Date(tx.dueDate) : null,
              paidDate: tx.paidDate ? new Date(tx.paidDate) : null,
              supplierId: tx.supplierId || null,
              notes: tx.notes || null
            }
          });
          txCount++;
          totalMigrated.transactions++;
        }
        
        if (txCount > 0) {
          console.log(`   ✅ Transacciones: ${txCount} migradas`);
        }
      } catch (error) {
        console.log(`   ⚠️  Transacciones: No se encontraron o error - ${error.message}`);
      }
    }

    // ==================================================
    // RESUMEN FINAL
    // ==================================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN DE MIGRACIÓN');
    console.log('='.repeat(70));
    console.log(`✅ Tasks migradas:          ${totalMigrated.tasks}`);
    console.log(`✅ Timeline events:         ${totalMigrated.timelineEvents}`);
    console.log(`✅ Special moments:         ${totalMigrated.specialMoments}`);
    console.log(`✅ Transactions:            ${totalMigrated.transactions}`);
    console.log('='.repeat(70));
    console.log('\n🎉 MIGRACIÓN COMPLETADA\n');

  } catch (error) {
    console.error('\n❌ ERROR EN MIGRACIÓN:', error);
    throw error;
  }
}

// Ejecutar migración
await migrateAllData();
await prisma.$disconnect();
process.exit(0);
