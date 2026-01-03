/**
 * Capa de abstracción de base de datos
 * Permite usar Firebase o PostgreSQL según configuración
 */

import { PrismaClient } from '@prisma/client';

// Singleton de Prisma
let prisma = null;

/**
 * Obtiene instancia de Prisma (PostgreSQL)
 */
export function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return prisma;
}

/**
 * Determina si usar Firebase o PostgreSQL
 */
export const useFirebase = process.env.USE_FIREBASE !== 'false';

/**
 * Database adapter - funciona con Firebase o PostgreSQL
 */
class DatabaseAdapter {
  constructor() {
    this.useFirebase = useFirebase;
    if (!this.useFirebase) {
      this.prisma = getPrisma();
    }
  }

  /**
   * Obtiene un usuario por email
   */
  async getUserByEmail(email) {
    if (this.useFirebase) {
      const { db } = await import('./firebase.js');
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).limit(1).get();
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } else {
      return await this.prisma.user.findUnique({ where: { email } });
    }
  }

  /**
   * Obtiene un usuario por ID
   */
  async getUserById(id) {
    if (this.useFirebase) {
      const { db } = await import('./firebase.js');
      const doc = await db.collection('users').doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } else {
      return await this.prisma.user.findUnique({ where: { id } });
    }
  }

  /**
   * Crea un nuevo usuario
   */
  async createUser(data) {
    if (this.useFirebase) {
      const { db, FieldValue } = await import('./firebase.js');
      const userRef = db.collection('users').doc();
      await userRef.set({
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { id: userRef.id, ...data };
    } else {
      return await this.prisma.user.create({ data });
    }
  }

  /**
   * Actualiza un usuario
   */
  async updateUser(id, data) {
    if (this.useFirebase) {
      const { db, FieldValue } = await import('./firebase.js');
      await db
        .collection('users')
        .doc(id)
        .update({
          ...data,
          updatedAt: FieldValue.serverTimestamp(),
        });
      return { id, ...data };
    } else {
      return await this.prisma.user.update({
        where: { id },
        data,
      });
    }
  }

  /**
   * Obtiene todas las bodas de un usuario
   */
  async getUserWeddings(userId) {
    if (this.useFirebase) {
      const { db } = await import('./firebase.js');
      const snapshot = await db
        .collection('weddings')
        .where('userId', '==', userId)
        .orderBy('weddingDate', 'desc')
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } else {
      return await this.prisma.wedding.findMany({
        where: { userId },
        orderBy: { weddingDate: 'desc' },
      });
    }
  }

  /**
   * Obtiene una boda por ID
   */
  async getWeddingById(id) {
    if (this.useFirebase) {
      const { db } = await import('./firebase.js');
      const doc = await db.collection('weddings').doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } else {
      return await this.prisma.wedding.findUnique({
        where: { id },
        include: {
          guests: true,
          suppliers: {
            include: { supplier: true },
          },
        },
      });
    }
  }

  /**
   * Crea una nueva boda
   */
  async createWedding(data) {
    if (this.useFirebase) {
      const { db, FieldValue } = await import('./firebase.js');
      const weddingRef = db.collection('weddings').doc();
      await weddingRef.set({
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { id: weddingRef.id, ...data };
    } else {
      return await this.prisma.wedding.create({ data });
    }
  }

  /**
   * Obtiene todos los invitados de una boda
   */
  async getWeddingGuests(weddingId) {
    if (this.useFirebase) {
      const { db } = await import('./firebase.js');
      const snapshot = await db
        .collection('weddings')
        .doc(weddingId)
        .collection('guests')
        .orderBy('name')
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } else {
      return await this.prisma.guest.findMany({
        where: { weddingId },
        orderBy: { name: 'asc' },
      });
    }
  }

  /**
   * Cierra la conexión
   */
  async disconnect() {
    if (!this.useFirebase && this.prisma) {
      await this.prisma.$disconnect();
    }
  }
}

// Singleton
let dbAdapter = null;

export function getDatabase() {
  if (!dbAdapter) {
    dbAdapter = new DatabaseAdapter();
  }
  return dbAdapter;
}

// Export prisma client directamente para uso en routes
export default getPrisma();
