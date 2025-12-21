/**
 * Script para obtener el UID del usuario actualmente logueado
 * 
 * INSTRUCCIONES:
 * 1. Abre http://localhost:5176 (admin panel)
 * 2. Loguéate si no lo estás
 * 3. Abre la consola del navegador (F12)
 * 4. Pega este código:
 * 
 *    firebase.auth().currentUser.uid
 * 
 * 5. Copia el UID que aparece
 * 6. Ejecuta: node scripts/add-admin.js <tu-email> <uid-copiado>
 */

console.log('');
console.log('📋 INSTRUCCIONES PARA OBTENER TU UID:');
console.log('');
console.log('1️⃣  Abre http://localhost:5176 en el navegador');
console.log('2️⃣  Loguéate en el panel admin si no lo estás');
console.log('3️⃣  Presiona F12 para abrir DevTools → Console');
console.log('4️⃣  Pega este código:');
console.log('');
console.log('    firebase.auth().currentUser.uid');
console.log('');
console.log('5️⃣  Copia el UID que aparece (algo como: "abc123xyz456...")');
console.log('6️⃣  Ejecuta:');
console.log('');
console.log('    node scripts/add-admin.js tu@email.com <uid-copiado>');
console.log('');
console.log('📝 Ejemplo:');
console.log('    node scripts/add-admin.js admin@malove.app xyz123abc456def');
console.log('');
