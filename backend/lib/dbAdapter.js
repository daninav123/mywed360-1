import { PrismaClient } from '@prisma/client';
import { db as firebaseDb } from '../db.js';

const prisma = new PrismaClient();
const USE_FIREBASE = process.env.USE_FIREBASE !== 'false';

/**
 * Adaptador de base de datos que permite migración gradual de Firebase a PostgreSQL
 * Prioriza PostgreSQL cuando está disponible, cae back a Firebase si es necesario
 */

class DatabaseAdapter {
  constructor() {
    this.prisma = prisma;
    this.firebase = USE_FIREBASE ? firebaseDb : null;
  }

  /**
   * Obtiene colección unificada (Prisma o Firebase)
   * @param {string} collectionName - Nombre de la colección/tabla
   */
  collection(collectionName) {
    // Mapeo de colecciones Firebase a modelos Prisma
    const collectionMap = {
      'users': 'user',
      'weddings': 'wedding',
      'guests': 'guest',
      'tasks': 'task',
      'transactions': 'transaction',
      'suppliers': 'supplier',
      'mails': 'mail',
      'notifications': 'notification',
      'quoteRequests': 'quoteRequest',
      'quote-requests-internet': 'quoteRequest',
      'pushSubscriptions': 'pushSubscription',
      'rsvpTokens': 'rsvpToken',
      'emailInsights': 'emailInsight',
      'blogPosts': 'blogPost',
    };

    const prismaModel = collectionMap[collectionName];

    // Si hay modelo Prisma, usar PostgreSQL
    if (prismaModel && this.prisma[prismaModel]) {
      return new PrismaCollectionAdapter(this.prisma[prismaModel], collectionName);
    }

    // Fallback a Firebase si está disponible
    if (this.firebase && typeof this.firebase.collection === 'function') {
      return this.firebase.collection(collectionName);
    }

    // Si no hay ninguno disponible, lanzar error
    throw new Error(`No database available for collection: ${collectionName}`);
  }

  /**
   * Cierra conexiones
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

/**
 * Adaptador que simula API de Firebase pero usa Prisma
 */
class PrismaCollectionAdapter {
  constructor(model, collectionName) {
    this.model = model;
    this.collectionName = collectionName;
    this.whereConditions = [];
    this.orderByConditions = [];
    this.limitValue = undefined;
  }

  where(field, operator, value) {
    this.whereConditions.push({ field, operator, value });
    return this;
  }

  orderBy(field, direction = 'asc') {
    this.orderByConditions.push({ [field]: direction });
    return this;
  }

  limit(count) {
    this.limitValue = count;
    return this;
  }

  async get() {
    const where = this._buildWhereClause();
    const orderBy = this.orderByConditions.length > 0 ? this.orderByConditions : undefined;

    const results = await this.model.findMany({
      where,
      orderBy,
      take: this.limitValue,
    });

    // Simular estructura de Firebase snapshot
    return {
      empty: results.length === 0,
      size: results.length,
      docs: results.map(doc => ({
        id: doc.id,
        data: () => doc,
        exists: true,
      })),
    };
  }

  async add(data) {
    const result = await this.model.create({ data });
    return {
      id: result.id,
    };
  }

  doc(id) {
    return new PrismaDocumentAdapter(this.model, id);
  }

  _buildWhereClause() {
    const where = {};
    
    for (const condition of this.whereConditions) {
      const { field, operator, value } = condition;
      
      switch (operator) {
        case '==':
          where[field] = value;
          break;
        case '!=':
          where[field] = { not: value };
          break;
        case '>':
          where[field] = { gt: value };
          break;
        case '>=':
          where[field] = { gte: value };
          break;
        case '<':
          where[field] = { lt: value };
          break;
        case '<=':
          where[field] = { lte: value };
          break;
        case 'in':
          where[field] = { in: value };
          break;
        case 'array-contains':
          where[field] = { has: value };
          break;
        default:
          where[field] = value;
      }
    }
    
    return where;
  }
}

/**
 * Adaptador de documento individual
 */
class PrismaDocumentAdapter {
  constructor(model, id) {
    this.model = model;
    this.id = id;
  }

  async get() {
    const doc = await this.model.findUnique({ where: { id: this.id } });
    return {
      exists: !!doc,
      id: this.id,
      data: () => doc,
    };
  }

  async set(data, options = {}) {
    if (options.merge) {
      return await this.model.update({
        where: { id: this.id },
        data,
      });
    } else {
      return await this.model.upsert({
        where: { id: this.id },
        update: data,
        create: { id: this.id, ...data },
      });
    }
  }

  async update(data) {
    return await this.model.update({
      where: { id: this.id },
      data,
    });
  }

  async delete() {
    return await this.model.delete({
      where: { id: this.id },
    });
  }

  collection(subcollectionName) {
    // Para subcolecciones, necesitamos manejar relaciones
    throw new Error(`Subcollections not yet supported in adapter: ${subcollectionName}`);
  }
}

// Exportar instancia singleton
export const dbAdapter = new DatabaseAdapter();
export default dbAdapter;
