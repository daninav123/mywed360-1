/**
 * Capa de abstracción de almacenamiento
 * Soporta Firebase Storage y MinIO (S3-compatible)
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';

// Determina qué storage usar
const useFirebaseStorage = process.env.USE_FIREBASE_STORAGE !== 'false';

// Cliente S3 para MinIO
let s3Client = null;

function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: `http${process.env.MINIO_USE_SSL === 'true' ? 's' : ''}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
      region: 'us-east-1', // MinIO no usa regiones pero es requerido
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY,
        secretAccessKey: process.env.MINIO_SECRET_KEY,
      },
      forcePathStyle: true, // Necesario para MinIO
    });
  }
  return s3Client;
}

/**
 * Storage adapter que funciona con Firebase o MinIO
 */
class StorageAdapter {
  constructor() {
    this.useFirebase = useFirebaseStorage;
    if (!this.useFirebase) {
      this.s3 = getS3Client();
    }
  }

  /**
   * Sube un archivo
   * @param {Buffer|Stream} file - Contenido del archivo
   * @param {string} destination - Ruta de destino (ej: 'weddings/123/photo.jpg')
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<string>} URL del archivo subido
   */
  async uploadFile(file, destination, options = {}) {
    if (this.useFirebase) {
      // Firebase Storage
      const { storage } = await import('./firebase.js');
      const admin = (await import('firebase-admin')).default;
      const bucket = admin.storage().bucket();

      const fileRef = bucket.file(destination);
      await fileRef.save(file, {
        metadata: options.metadata || {},
        contentType: options.contentType,
      });

      // Hacer público si se requiere
      if (options.public) {
        await fileRef.makePublic();
      }

      return `https://storage.googleapis.com/${bucket.name}/${destination}`;
    } else {
      // MinIO (S3)
      const bucket = this.getBucketFromPath(destination);
      const key = destination.replace(`${bucket}/`, '');

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: options.contentType,
        Metadata: options.metadata || {},
      });

      await this.s3.send(command);

      // URL pública
      return `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucket}/${key}`;
    }
  }

  /**
   * Descarga un archivo
   * @param {string} path - Ruta del archivo
   * @returns {Promise<Buffer>} Contenido del archivo
   */
  async downloadFile(path) {
    if (this.useFirebase) {
      const { storage } = await import('./firebase.js');
      const admin = (await import('firebase-admin')).default;
      const bucket = admin.storage().bucket();
      const file = bucket.file(path);

      const [buffer] = await file.download();
      return buffer;
    } else {
      const bucket = this.getBucketFromPath(path);
      const key = path.replace(`${bucket}/`, '');

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await this.s3.send(command);
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    }
  }

  /**
   * Elimina un archivo
   * @param {string} path - Ruta del archivo
   */
  async deleteFile(path) {
    if (this.useFirebase) {
      const { storage } = await import('./firebase.js');
      const admin = (await import('firebase-admin')).default;
      const bucket = admin.storage().bucket();
      await bucket.file(path).delete();
    } else {
      const bucket = this.getBucketFromPath(path);
      const key = path.replace(`${bucket}/`, '');

      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await this.s3.send(command);
    }
  }

  /**
   * Obtiene URL firmada temporal
   * @param {string} path - Ruta del archivo
   * @param {number} expiresIn - Segundos de validez (default: 3600)
   * @returns {Promise<string>} URL firmada
   */
  async getSignedUrl(path, expiresIn = 3600) {
    if (this.useFirebase) {
      const { storage } = await import('./firebase.js');
      const admin = (await import('firebase-admin')).default;
      const bucket = admin.storage().bucket();
      const file = bucket.file(path);

      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresIn * 1000,
      });
      return url;
    } else {
      const bucket = this.getBucketFromPath(path);
      const key = path.replace(`${bucket}/`, '');

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3, command, { expiresIn });
    }
  }

  /**
   * Lista archivos en un directorio
   * @param {string} prefix - Prefijo del path
   * @returns {Promise<Array>} Lista de archivos
   */
  async listFiles(prefix) {
    if (this.useFirebase) {
      const { storage } = await import('./firebase.js');
      const admin = (await import('firebase-admin')).default;
      const bucket = admin.storage().bucket();

      const [files] = await bucket.getFiles({ prefix });
      return files.map((file) => ({
        name: file.name,
        size: file.metadata.size,
        contentType: file.metadata.contentType,
        updated: file.metadata.updated,
      }));
    } else {
      const bucket = this.getBucketFromPath(prefix);
      const key = prefix.replace(`${bucket}/`, '');

      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: key,
      });

      const response = await this.s3.send(command);
      return (response.Contents || []).map((item) => ({
        name: item.Key,
        size: item.Size,
        updated: item.LastModified,
      }));
    }
  }

  /**
   * Genera nombre de archivo único
   */
  generateUniqueFileName(originalName) {
    const ext = path.extname(originalName);
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}_${hash}${ext}`;
  }

  /**
   * Obtiene el bucket según el path
   */
  getBucketFromPath(path) {
    // Asume formato: bucket/path/to/file
    const parts = path.split('/');
    return parts[0];
  }
}

// Singleton
let storageAdapter = null;

export function getStorage() {
  if (!storageAdapter) {
    storageAdapter = new StorageAdapter();
  }
  return storageAdapter;
}

export default getStorage();
