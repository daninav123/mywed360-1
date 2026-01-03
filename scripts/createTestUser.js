/**
 * Script para crear un usuario de prueba en Firebase Auth
 */

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createTestUser() {
  const testEmail = 'test@maloveapp.com';
  const testPassword = 'test123456';
  
  try {
    console.log('🔄 Creando usuario de prueba...');
    
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    const user = userCredential.user;
    
    console.log('✅ Usuario creado en Firebase Auth:', user.uid);
    
    // Crear documento de usuario en Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: testEmail,
      name: 'Usuario de Prueba',
      createdAt: new Date(),
      role: 'planner'
    });
    
    console.log('✅ Documento de usuario creado en Firestore');
    
    // Crear una boda de prueba en la subcolección
    await setDoc(doc(db, 'users', user.uid, 'weddings', 'boda-test-1'), {
      name: 'Boda de Prueba',
      slug: 'boda-prueba',
      brideFirstName: 'María',
      brideLastName: 'García',
      groomFirstName: 'Juan',
      groomLastName: 'Pérez',
      weddingDate: '2025-06-15',
      createdAt: new Date(),
      status: 'active'
    });
    
    console.log('✅ Boda de prueba creada');
    
    console.log('\n🎉 Usuario de prueba creado exitosamente:');
    console.log('📧 Email:', testEmail);
    console.log('🔑 Password:', testPassword);
    console.log('🆔 UID:', user.uid);
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ El usuario de prueba ya existe');
    } else {
      console.error('❌ Error creando usuario de prueba:', error);
    }
  }
  
  process.exit(0);
}

createTestUser();
