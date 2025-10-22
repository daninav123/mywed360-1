/**
 * Script para crear automáticamente todos los productos de Stripe
 * Basado en docs/planes-suscripcion.md
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const priceIds = {};

console.log('\n🚀 Creando productos en Stripe...\n');
console.log('═══════════════════════════════════════════════════\n');

/**
 * Crear producto para parejas (pago único)
 */
async function createCoupleProduct(name, price, description, priceIdKey) {
  try {
    console.log(`📦 Creando producto: ${name}`);
    
    const product = await stripe.products.create({
      name: `${name} - MaLoveApp`,
      description: description,
      metadata: {
        type: 'wedding_license',
        category: 'couples',
      },
    });

    const priceObj = await stripe.prices.create({
      product: product.id,
      unit_amount: price,
      currency: 'eur',
      metadata: {
        priceIdKey: priceIdKey,
      },
    });

    priceIds[priceIdKey] = priceObj.id;
    
    console.log(`   ✅ Producto creado: ${product.id}`);
    console.log(`   💰 Precio: ${price / 100} EUR`);
    console.log(`   🔑 Price ID: ${priceObj.id}`);
    console.log(`   📝 Variable: ${priceIdKey}\n`);
    
    return { product, price: priceObj };
  } catch (error) {
    console.error(`   ❌ Error creando ${name}:`, error.message);
    throw error;
  }
}

/**
 * Crear producto para planners (mensual + anual)
 */
async function createPlannerProduct(name, monthlyPrice, annualPrice, maxWeddings, description, monthlyKey, annualKey) {
  try {
    console.log(`📦 Creando producto: ${name}`);
    
    const product = await stripe.products.create({
      name: `${name} - MaLoveApp`,
      description: description,
      metadata: {
        type: 'planner_pack',
        category: 'planners',
        maxWeddings: maxWeddings.toString(),
      },
    });

    // Precio mensual con trial
    const monthlyPriceObj = await stripe.prices.create({
      product: product.id,
      unit_amount: monthlyPrice,
      currency: 'eur',
      recurring: {
        interval: 'month',
        trial_period_days: 30,
      },
      metadata: {
        priceIdKey: monthlyKey,
        billing_type: 'monthly',
      },
    });

    priceIds[monthlyKey] = monthlyPriceObj.id;

    // Precio anual (15% descuento)
    const annualPriceObj = await stripe.prices.create({
      product: product.id,
      unit_amount: annualPrice,
      currency: 'eur',
      metadata: {
        priceIdKey: annualKey,
        billing_type: 'annual',
        discount: '15',
      },
    });

    priceIds[annualKey] = annualPriceObj.id;
    
    console.log(`   ✅ Producto creado: ${product.id}`);
    console.log(`   💰 Precio mensual: ${monthlyPrice / 100} EUR/mes (+ trial 30d)`);
    console.log(`   🔑 Monthly Price ID: ${monthlyPriceObj.id}`);
    console.log(`   📝 Variable: ${monthlyKey}`);
    console.log(`   💰 Precio anual: ${annualPrice / 100} EUR (15% desc.)`);
    console.log(`   🔑 Annual Price ID: ${annualPriceObj.id}`);
    console.log(`   📝 Variable: ${annualKey}\n`);
    
    return { product, monthlyPrice: monthlyPriceObj, annualPrice: annualPriceObj };
  } catch (error) {
    console.error(`   ❌ Error creando ${name}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🔑 Usando Stripe Secret Key:', process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...\n');

    // Productos para Parejas
    console.log('👰 CREANDO PRODUCTOS PARA PAREJAS\n');
    console.log('─────────────────────────────────────────────────\n');

    await createCoupleProduct(
      'Wedding Pass',
      5000,
      'Pago único por boda con funcionalidades completas',
      'STRIPE_PRICE_WEDDING_PASS'
    );

    await createCoupleProduct(
      'Wedding Pass Plus',
      8500,
      'Pago único premium sin marca y con ayudante',
      'STRIPE_PRICE_WEDDING_PASS_PLUS'
    );

    // Productos para Planners
    console.log('\n💼 CREANDO PRODUCTOS PARA PLANNERS\n');
    console.log('─────────────────────────────────────────────────\n');

    await createPlannerProduct(
      'Planner Pack 5',
      4167,
      42500,
      5,
      'Hasta 5 bodas activas simultáneas',
      'STRIPE_PRICE_PLANNER_PACK5_MONTHLY',
      'STRIPE_PRICE_PLANNER_PACK5_ANNUAL'
    );

    await createPlannerProduct(
      'Planner Pack 15',
      11250,
      114750,
      15,
      'Hasta 15 bodas activas simultáneas',
      'STRIPE_PRICE_PLANNER_PACK15_MONTHLY',
      'STRIPE_PRICE_PLANNER_PACK15_ANNUAL'
    );

    await createPlannerProduct(
      'Teams 40',
      26667,
      272000,
      40,
      '40 bodas activas por año + equipo',
      'STRIPE_PRICE_TEAMS40_MONTHLY',
      'STRIPE_PRICE_TEAMS40_ANNUAL'
    );

    await createPlannerProduct(
      'Teams Ilimitado',
      41667,
      425000,
      -1,
      'Bodas y perfiles ilimitados con white-label',
      'STRIPE_PRICE_TEAMS_UNLIMITED_MONTHLY',
      'STRIPE_PRICE_TEAMS_UNLIMITED_ANNUAL'
    );

    // Resumen
    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ TODOS LOS PRODUCTOS CREADOS EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('📋 RESUMEN DE PRICE IDs:\n');
    console.log('Parejas:');
    console.log(`  STRIPE_PRICE_WEDDING_PASS=${priceIds.STRIPE_PRICE_WEDDING_PASS}`);
    console.log(`  STRIPE_PRICE_WEDDING_PASS_PLUS=${priceIds.STRIPE_PRICE_WEDDING_PASS_PLUS}`);
    
    console.log('\nPlanners (Mensual):');
    console.log(`  STRIPE_PRICE_PLANNER_PACK5_MONTHLY=${priceIds.STRIPE_PRICE_PLANNER_PACK5_MONTHLY}`);
    console.log(`  STRIPE_PRICE_PLANNER_PACK15_MONTHLY=${priceIds.STRIPE_PRICE_PLANNER_PACK15_MONTHLY}`);
    console.log(`  STRIPE_PRICE_TEAMS40_MONTHLY=${priceIds.STRIPE_PRICE_TEAMS40_MONTHLY}`);
    console.log(`  STRIPE_PRICE_TEAMS_UNLIMITED_MONTHLY=${priceIds.STRIPE_PRICE_TEAMS_UNLIMITED_MONTHLY}`);
    
    console.log('\nPlanners (Anual):');
    console.log(`  STRIPE_PRICE_PLANNER_PACK5_ANNUAL=${priceIds.STRIPE_PRICE_PLANNER_PACK5_ANNUAL}`);
    console.log(`  STRIPE_PRICE_PLANNER_PACK15_ANNUAL=${priceIds.STRIPE_PRICE_PLANNER_PACK15_ANNUAL}`);
    console.log(`  STRIPE_PRICE_TEAMS40_ANNUAL=${priceIds.STRIPE_PRICE_TEAMS40_ANNUAL}`);
    console.log(`  STRIPE_PRICE_TEAMS_UNLIMITED_ANNUAL=${priceIds.STRIPE_PRICE_TEAMS_UNLIMITED_ANNUAL}`);

    // Actualizar .env
    console.log('\n🔄 Actualizando backend/.env...');
    
    const envPath = path.resolve(__dirname, '../backend/.env');
    let envContent = readFileSync(envPath, 'utf8');
    
    // Reemplazar cada Price ID
    Object.entries(priceIds).forEach(([key, value]) => {
      const regex = new RegExp(`${key}=.*`, 'g');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        // Si no existe, añadirlo
        envContent += `\n${key}=${value}`;
      }
    });
    
    writeFileSync(envPath, envContent, 'utf8');
    
    console.log('   ✅ Archivo .env actualizado\n');

    console.log('═══════════════════════════════════════════════════');
    console.log('🎯 PRÓXIMOS PASOS:');
    console.log('═══════════════════════════════════════════════════\n');
    console.log('1. Reinicia el backend:');
    console.log('   cd backend && npm start\n');
    console.log('2. Verifica la configuración:');
    console.log('   curl http://localhost:4004/api/stripe/test\n');
    console.log('3. Configura el webhook en Stripe Dashboard');
    console.log('   https://dashboard.stripe.com/test/webhooks\n');
    console.log('4. Copia el Webhook Secret al .env:');
    console.log('   STRIPE_WEBHOOK_SECRET=whsec_...\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
