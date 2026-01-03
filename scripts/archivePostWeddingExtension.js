/**
 * Script para archivar el producto "Extensión post-boda" de Stripe
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

console.log('\n🗑️  Archivando producto "Extensión post-boda"...\n');

async function main() {
  try {
    const products = await stripe.products.list({ limit: 100 });
    
    const extensionProduct = products.data.find(p => 
      p.name.includes('Extensión post-boda') || 
      p.name.includes('Extension post-boda')
    );
    
    if (!extensionProduct) {
      console.log('✅ No se encontró el producto "Extensión post-boda".');
      console.log('   Ya fue eliminado o no existe.\n');
      return;
    }
    
    console.log(`📦 Producto encontrado: ${extensionProduct.name} (${extensionProduct.id})`);
    console.log(`   Archivando...\n`);
    
    await stripe.products.update(extensionProduct.id, {
      active: false,
    });
    
    console.log('✅ Producto archivado exitosamente\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('El producto ya no aparecerá en el dashboard activo.');
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

main();
