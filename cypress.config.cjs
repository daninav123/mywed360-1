const { defineConfig } = require("cypress");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const admin = require("firebase-admin");

// Cargar variables locales para que Cypress use siempre el backend local en dev/test
// Priorizar .env.test si existe
[
  path.resolve(__dirname, ".env.test"),
  path.resolve(__dirname, ".env.local"),
  path.resolve(__dirname, ".env"),
].forEach((envPath) => {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
});

// Inicializar Firebase Admin para tareas de Cypress
let firebaseInitialized = false;

function initializeFirebase() {
  if (!firebaseInitialized && !admin.apps.length) {
    try {
      // Buscar serviceAccount.json en varios lugares posibles
      const possiblePaths = [
        path.join(__dirname, 'serviceAccount.json'),
        path.join(__dirname, 'backend', 'serviceAccount.json'),
      ];
      
      let serviceAccountPath = null;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          serviceAccountPath = testPath;
          break;
        }
      }
      
      if (serviceAccountPath) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        firebaseInitialized = true;
        console.log("✅ Firebase Admin inicializado para Cypress desde:", serviceAccountPath);
      } else {
        console.warn("⚠️ serviceAccount.json no encontrado en:", possiblePaths);
      }
    } catch (error) {
      console.error("❌ Error inicializando Firebase Admin:", error.message);
    }
  }
  return firebaseInitialized;
}

module.exports = defineConfig({
  e2e: {
    // URL base por defecto del frontend (siempre 5173 con Vite)
    // Puede sobreescribirse puntualmente con CYPRESS_BASE_URL si fuera necesario
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx}",
    supportFile: "cypress/support/e2e.js",
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    env: {
      BACKEND_BASE_URL:
        process.env.BACKEND_BASE_URL ||
        process.env.VITE_BACKEND_BASE_URL ||
        "http://localhost:4004",
      STUB_RSVP: false,
    },
    setupNodeEvents(on, config) {
      // Importar tareas de crowdsourcing
      const crowdsourcingTasks = require('./cypress/support/crowdsourcing-tasks.cjs');
      
      // Tareas personalizadas de Firebase
      on("task", {
        // Tareas del sistema de crowdsourcing
        ...crowdsourcingTasks,
        
        /**
         * Query de Firestore
         */
        "firebase:query": async ({ collection, where = [], orderBy = [], limit = 10 }) => {
          if (!initializeFirebase()) {
            console.error("Firebase no inicializado");
            return [];
          }

          try {
            const db = admin.firestore();
            let query = db.collection(collection);

            // Aplicar filtros where
            where.forEach(([field, op, value]) => {
              query = query.where(field, op, value);
            });

            // Aplicar orderBy
            orderBy.forEach(([field, direction = 'asc']) => {
              query = query.orderBy(field, direction);
            });

            // Aplicar limit
            if (limit) {
              query = query.limit(limit);
            }

            const snapshot = await query.get();
            
            return snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              // Convertir Timestamps a objetos serializables
              timestamp: doc.data().timestamp?.toDate ? {
                toDate: () => doc.data().timestamp.toDate()
              } : doc.data().timestamp
            }));
          } catch (error) {
            console.error("Error en firebase:query:", error);
            throw error;
          }
        },

        /**
         * Eliminar documentos por condición
         */
        "firebase:deleteWhere": async ({ collection, where = [] }) => {
          if (!initializeFirebase()) {
            console.error("Firebase no inicializado");
            return 0;
          }

          try {
            const db = admin.firestore();
            let query = db.collection(collection);

            where.forEach(([field, op, value]) => {
              query = query.where(field, op, value);
            });

            const snapshot = await query.get();
            const batch = db.batch();

            snapshot.docs.forEach(doc => {
              batch.delete(doc.ref);
            });

            await batch.commit();
            
            console.log(`🗑️ Eliminados ${snapshot.size} documentos de ${collection}`);
            return snapshot.size;
          } catch (error) {
            console.error("Error en firebase:deleteWhere:", error);
            throw error;
          }
        },

        /**
         * Crear documento
         */
        "firebase:create": async ({ collection, data }) => {
          if (!initializeFirebase()) {
            console.error("Firebase no inicializado");
            return null;
          }

          try {
            const db = admin.firestore();
            const docRef = await db.collection(collection).add(data);
            return docRef.id;
          } catch (error) {
            console.error("Error en firebase:create:", error);
            throw error;
          }
        },

        /**
         * Obtener documento por ID
         */
        "firebase:get": async ({ collection, id }) => {
          if (!initializeFirebase()) {
            console.error("Firebase no inicializado");
            return null;
          }

          try {
            const db = admin.firestore();
            const doc = await db.collection(collection).doc(id).get();
            
            if (!doc.exists) {
              return null;
            }

            return {
              id: doc.id,
              ...doc.data()
            };
          } catch (error) {
            console.error("Error en firebase:get:", error);
            throw error;
          }
        },

        /**
         * Limpiar datos de prueba por prefijo
         */
        "cleanTestData": async ({ prefix }) => {
          if (!initializeFirebase()) {
            console.error("Firebase no inicializado");
            return 0;
          }

          try {
            const db = admin.firestore();
            const auth = admin.auth();
            let totalDeleted = 0;

            // Limpiar usuarios
            const users = await auth.listUsers();
            for (const user of users.users) {
              if (user.email && user.email.includes(prefix)) {
                await auth.deleteUser(user.uid);
                totalDeleted++;
                console.log(`🗑️ Usuario eliminado: ${user.email}`);
              }
            }

            // Limpiar colecciones
            const collections = ['weddings', 'suppliers', 'quote-requests', 'quote-responses'];
            for (const collectionName of collections) {
              const snapshot = await db.collection(collectionName).get();
              const batch = db.batch();
              let batchCount = 0;

              for (const doc of snapshot.docs) {
                const data = doc.data();
                const shouldDelete = 
                  (data.email && data.email.includes(prefix)) ||
                  (data.businessName && data.businessName.includes(prefix)) ||
                  (data.coupleName && data.coupleName.includes(prefix));

                if (shouldDelete) {
                  batch.delete(doc.ref);
                  batchCount++;
                }
              }

              if (batchCount > 0) {
                await batch.commit();
                totalDeleted += batchCount;
                console.log(`🗑️ ${batchCount} documentos eliminados de ${collectionName}`);
              }
            }

            return totalDeleted;
          } catch (error) {
            console.error("Error en cleanTestData:", error);
            return 0;
          }
        },

        /**
         * Crear usuario de prueba
         */
        "createTestUser": async ({ email, password, displayName }) => {
          if (!initializeFirebase()) {
            console.error("Firebase no inicializado");
            return null;
          }

          try {
            const auth = admin.auth();
            const user = await auth.createUser({
              email,
              password,
              displayName,
              emailVerified: true,
            });

            console.log(`✅ Usuario de prueba creado: ${email} (${user.uid})`);
            return {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
            };
          } catch (error) {
            console.error("Error en createTestUser:", error);
            throw error;
          }
        },

        /**
         * Crear boda de prueba
         */
        "createTestWedding": async ({ userId, data }) => {
          if (!initializeFirebase()) {
            console.error("Firebase no inicializado");
            return null;
          }

          try {
            const db = admin.firestore();
            const weddingData = {
              ...data,
              userId,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            const docRef = await db.collection('weddings').add(weddingData);
            console.log(`✅ Boda de prueba creada: ${docRef.id}`);
            
            return {
              id: docRef.id,
              ...weddingData,
            };
          } catch (error) {
            console.error("Error en createTestWedding:", error);
            throw error;
          }
        },

        /**
         * Aceptar presupuesto y propagar a InfoBoda
         */
        "acceptQuoteAndPropagate": async ({ quoteResponseId, weddingId, role = 'principal' }) => {
          if (!initializeFirebase()) {
            console.error("Firebase no inicializado");
            return null;
          }

          try {
            const db = admin.firestore();

            // 1. Obtener la respuesta de presupuesto
            const quoteDoc = await db.collection('quote-responses').doc(quoteResponseId).get();
            if (!quoteDoc.exists) {
              throw new Error('Quote response no encontrado');
            }

            const quoteData = quoteDoc.data();

            // 2. Actualizar estado del presupuesto
            await db.collection('quote-responses').doc(quoteResponseId).update({
              status: 'accepted',
              acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
              acceptedRole: role,
            });

            // 3. Obtener boda
            const weddingDoc = await db.collection('weddings').doc(weddingId).get();
            if (!weddingDoc.exists) {
              throw new Error('Wedding no encontrado');
            }

            const weddingData = weddingDoc.data();

            // 4. Construir actualizaciones de InfoBoda
            const infoBodaUpdates = {};
            const categoryKey = quoteData.categoryKey;

            switch (categoryKey) {
              case 'lugares':
                infoBodaUpdates.celebrationPlace = quoteData.venueName || quoteData.supplierName;
                infoBodaUpdates.celebrationAddress = quoteData.venueAddress;
                infoBodaUpdates.celebrationCity = quoteData.city;
                infoBodaUpdates.ceremonyGPS = quoteData.venueGPS;
                infoBodaUpdates.venueManagerName = quoteData.contactName;
                infoBodaUpdates.venueManagerPhone = quoteData.contactPhone;
                infoBodaUpdates._celebrationPlaceSource = 'supplier-confirmed';
                break;
              
              case 'catering':
                infoBodaUpdates.cateringContact = quoteData.contactPhone;
                if (quoteData.menuDescription) {
                  infoBodaUpdates.menu = quoteData.menuDescription;
                }
                break;
            }

            infoBodaUpdates._lastUpdateSource = 'supplier-acceptance';
            infoBodaUpdates._lastUpdateCategory = categoryKey;
            infoBodaUpdates._lastUpdateSupplierName = quoteData.supplierName;
            infoBodaUpdates._lastUpdateTimestamp = Date.now();

            // 5. Actualizar servicios contratados
            const services = weddingData.services || {};
            if (!services[categoryKey]) {
              services[categoryKey] = { suppliers: [], status: 'pending' };
            }

            services[categoryKey].suppliers.push({
              supplierId: quoteData.supplierId,
              supplierName: quoteData.supplierName,
              role: role,
              totalPrice: quoteData.totalPrice,
              status: 'active',
              contractedAt: new Date(),
            });
            services[categoryKey].status = 'contracted';

            // 6. Actualizar presupuesto
            const budget = weddingData.budget || { total: 0, spent: 0, allocated: {} };
            budget.spent = (budget.spent || 0) + quoteData.totalPrice;
            budget.allocated = budget.allocated || {};
            budget.allocated[categoryKey] = quoteData.totalPrice;
            budget.remaining = budget.total - budget.spent;

            // 7. Aplicar todas las actualizaciones
            await db.collection('weddings').doc(weddingId).update({
              ...infoBodaUpdates,
              services,
              budget,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`✅ Presupuesto aceptado y propagado a InfoBoda`);
            console.log(`   - Categoría: ${categoryKey}`);
            console.log(`   - Proveedor: ${quoteData.supplierName}`);
            console.log(`   - Precio: ${quoteData.totalPrice}€`);

            return {
              success: true,
              quoteResponseId,
              weddingId,
              infoBodaUpdates,
            };
          } catch (error) {
            console.error("Error en acceptQuoteAndPropagate:", error);
            throw error;
          }
        },

        /**
         * Crear proveedor de prueba
         */
        "createTestSupplier": async (supplierData) => {
          if (!initializeFirebase()) {
            console.error("Firebase no inicializado");
            return null;
          }

          try {
            const auth = admin.auth();
            const db = admin.firestore();

            // Intentar eliminar usuario existente primero
            try {
              const existingUser = await auth.getUserByEmail(supplierData.email);
              if (existingUser) {
                await auth.deleteUser(existingUser.uid);
                console.log(`🗑️ Usuario proveedor previo eliminado: ${supplierData.email}`);
                
                // Eliminar documentos de supplier asociados
                const suppliersSnapshot = await db.collection('suppliers')
                  .where('email', '==', supplierData.email)
                  .get();
                
                const batch = db.batch();
                suppliersSnapshot.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                
                if (suppliersSnapshot.size > 0) {
                  console.log(`🗑️ ${suppliersSnapshot.size} documento(s) de supplier eliminados`);
                }
              }
            } catch (err) {
              // Usuario no existe, continuar
            }

            // Crear usuario de autenticación
            const authUser = await auth.createUser({
              email: supplierData.email,
              password: supplierData.password,
              emailVerified: true,
            });

            // Crear documento de proveedor
            const providerData = {
              uid: authUser.uid,
              email: supplierData.email,
              businessName: supplierData.businessName,
              categories: supplierData.categories || [],
              contactPhone: supplierData.contactPhone || '',
              address: supplierData.address || '',
              city: supplierData.city || '',
              gps: supplierData.gps || '',
              contactName: supplierData.contactName || '',
              isActive: supplierData.isActive !== false,
              verified: supplierData.verified !== false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            const docRef = await db.collection('suppliers').add(providerData);
            console.log(`✅ Proveedor de prueba creado: ${supplierData.businessName} (${docRef.id})`);

            return {
              id: docRef.id,
              uid: authUser.uid,
              ...providerData,
            };
          } catch (error) {
            console.error("Error en createTestSupplier:", error);
            throw error;
          }
        }
      });

      return config;
    },
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
});
