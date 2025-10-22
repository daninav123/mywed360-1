/**
 * Script para eliminar productos de Stripe (útil para test/recreación)
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

console.log('\n🗑️  Eliminando productos de Stripe...\n');
console.log('═══════════════════════════════════════════════════\n');

async function main() {
  try {
    // Listar todos los productos
    const products = await stripe.products.list({ limit: 100 });
    
    console.log(`📦 Productos encontrados: ${products.data.length}\n`);

    if (products.data.length === 0) {
      console.log('✅ No hay productos para eliminar.\n');
      return;
    }

    // Eliminar cada producto
    for (const product of products.data) {
      console.log(`🗑️  Eliminando: ${product.name} (${product.id})`);
      
      // Archivar el producto (más seguro que delete)
      await stripe.products.update(product.id, {
        active: false,
      });
      
      console.log(`   ✅ Producto archivado: ${product.id}\n`);
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ TODOS LOS PRODUCTOS ARCHIVADOS');
    console.log('═══════════════════════════════════════════════════\n');
    console.log('💡 Los productos archivados no aparecerán en el dashboard');
    console.log('   pero se mantienen en el historial para trazabilidad.\n');
    console.log('🔄 Ejecuta ahora: node scripts/createStripeProducts.js\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

main();
