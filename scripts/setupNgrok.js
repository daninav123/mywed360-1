#!/usr/bin/env node

/**
 * Script para configurar ngrok y obtener la URL pública
 */

import { execSync, spawn } from 'child_process';
import axios from 'axios';

const PORT = 4004;
const WEBHOOK_PATH = '/api/inbound/mailgun';

console.log('\n══════════════════════════════════════════════════════════');
console.log('  🌐 CONFIGURAR NGROK PARA MAILGUN WEBHOOK');
console.log('══════════════════════════════════════════════════════════\n');

// Verificar si ngrok está instalado
const checkNgrok = () => {
  try {
    execSync('ngrok version', { stdio: 'ignore' });
    console.log('✅ ngrok encontrado\n');
    return true;
  } catch (error) {
    console.log('❌ ngrok no está instalado\n');
    console.log('📥 INSTALAR NGROK:');
    console.log('   1. Ve a: https://ngrok.com/download');
    console.log('   2. Descarga e instala ngrok');
    console.log('   3. Ejecuta: ngrok config add-authtoken TU_TOKEN\n');
    console.log('   Opción rápida: choco install ngrok\n');
    return false;
  }
};

// Verificar si el backend está corriendo
const checkBackend = async () => {
  try {
    console.log('🔍 Verificando backend en http://localhost:' + PORT + '...');
    const response = await axios.get(`http://localhost:${PORT}/health`, { timeout: 3000 });
    console.log('✅ Backend corriendo\n');
    return true;
  } catch (error) {
    console.log('❌ Backend no responde\n');
    console.log('💡 Inicia el backend primero:');
    console.log('   cd backend');
    console.log('   npm run dev\n');
    return false;
  }
};

// Obtener la URL pública de ngrok
const getNgrokUrl = async (retries = 10) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get('http://localhost:4040/api/tunnels', { timeout: 1000 });
      const tunnels = response.data.tunnels || [];
      const httpsTunnel = tunnels.find(t => t.proto === 'https');
      
      if (httpsTunnel && httpsTunnel.public_url) {
        return httpsTunnel.public_url;
      }
    } catch (error) {
      // Esperar un poco antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return null;
};

// Mostrar instrucciones
const showInstructions = (ngrokUrl) => {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  ✅ NGROK INICIADO CORRECTAMENTE');
  console.log('══════════════════════════════════════════════════════════\n');
  
  console.log('📋 TU URL PÚBLICA:');
  console.log(`   ${ngrokUrl}\n`);
  
  console.log('📋 WEBHOOK COMPLETO:');
  console.log(`   ${ngrokUrl}${WEBHOOK_PATH}\n`);
  
  console.log('──────────────────────────────────────────────────────────\n');
  
  console.log('🔧 SIGUIENTE PASO: Actualizar Route en Mailgun\n');
  
  console.log('1️⃣  Ve a Mailgun Dashboard:');
  console.log('   https://app.mailgun.com/app/receiving/routes\n');
  
  console.log('2️⃣  Edita tu Route y cambia las Actions a:\n');
  console.log(`   forward("${ngrokUrl}${WEBHOOK_PATH}")`);
  console.log(`   store(notify="${ngrokUrl}${WEBHOOK_PATH}")`);
  console.log('   stop()\n');
  
  console.log('3️⃣  Guarda la Route\n');
  
  console.log('4️⃣  Prueba enviando un email a: dani@malove.app\n');
  
  console.log('══════════════════════════════════════════════════════════\n');
  
  console.log('⚠️  IMPORTANTE:');
  console.log('   • Mantén ngrok corriendo en otra terminal');
  console.log('   • Mantén el backend corriendo');
  console.log('   • Si reinicias ngrok, la URL cambiará\n');
  
  console.log('💡 TIPS:');
  console.log('   • Ver requests: http://localhost:4040 (dashboard de ngrok)');
  console.log('   • Ver logs backend: cd backend && npm run dev');
  console.log('   • Detener ngrok: Ctrl+C en su terminal\n');
};

// Función principal
const main = async () => {
  // 1. Verificar ngrok
  if (!checkNgrok()) {
    process.exit(1);
  }
  
  // 2. Verificar backend
  if (!(await checkBackend())) {
    process.exit(1);
  }
  
  // 3. Verificar si ngrok ya está corriendo
  console.log('🔍 Buscando instancia de ngrok existente...\n');
  let ngrokUrl = await getNgrokUrl(2);
  
  if (ngrokUrl) {
    console.log('✅ ngrok ya está corriendo\n');
    showInstructions(ngrokUrl);
    console.log('🔄 Si quieres reiniciar ngrok, cierra la instancia actual primero.\n');
    return;
  }
  
  // 4. Iniciar ngrok
  console.log('🚀 Iniciando ngrok...\n');
  console.log('──────────────────────────────────────────────────────────');
  console.log('   Comando: ngrok http ' + PORT);
  console.log('   Puerto: ' + PORT);
  console.log('   Esperando URL pública...');
  console.log('──────────────────────────────────────────────────────────\n');
  
  // Iniciar ngrok en un proceso hijo
  const ngrokProcess = spawn('ngrok', ['http', PORT.toString()], {
    stdio: 'inherit',
    shell: true,
  });
  
  ngrokProcess.on('error', (error) => {
    console.log('\n❌ Error al iniciar ngrok:', error.message);
    process.exit(1);
  });
  
  // Esperar a que ngrok esté listo
  console.log('⏳ Esperando a que ngrok inicie (10 segundos)...\n');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Obtener la URL
  ngrokUrl = await getNgrokUrl();
  
  if (!ngrokUrl) {
    console.log('❌ No se pudo obtener la URL de ngrok');
    console.log('   Verifica que ngrok esté corriendo correctamente\n');
    console.log('💡 Inicia ngrok manualmente:');
    console.log('   ngrok http ' + PORT + '\n');
    process.exit(1);
  }
  
  // Mostrar instrucciones
  showInstructions(ngrokUrl);
  
  console.log('⌨️  Presiona Ctrl+C para salir (esto NO detendrá ngrok)\n');
  console.log('══════════════════════════════════════════════════════════\n');
};

// Ejecutar
main().catch(error => {
  console.log('\n❌ Error:', error.message);
  process.exit(1);
});
