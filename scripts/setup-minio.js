/**
 * Script para configurar MinIO
 * Crea buckets necesarios y configura políticas
 */

import {
  S3Client,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  ListBucketsCommand,
} from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.migration' });

const s3Client = new S3Client({
  endpoint: `http${process.env.MINIO_USE_SSL === 'true' ? 's' : ''}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

const buckets = [
  process.env.MINIO_BUCKET_PHOTOS || 'malove-photos',
  process.env.MINIO_BUCKET_VIDEOS || 'malove-videos',
  process.env.MINIO_BUCKET_DOCUMENTS || 'malove-documents',
  process.env.MINIO_BUCKET_AVATARS || 'malove-avatars',
];

async function setupMinIO() {
  console.log('🔧 Configurando MinIO...\n');

  try {
    // Listar buckets existentes
    console.log('📋 Listando buckets existentes...');
    const { Buckets } = await s3Client.send(new ListBucketsCommand({}));
    const existingBuckets = new Set(Buckets?.map((b) => b.Name) || []);
    console.log(`✓ Encontrados ${existingBuckets.size} buckets\n`);

    // Crear buckets
    for (const bucket of buckets) {
      if (existingBuckets.has(bucket)) {
        console.log(`⏭️  Bucket "${bucket}" ya existe`);
        continue;
      }

      try {
        console.log(`📦 Creando bucket "${bucket}"...`);
        await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
        console.log(`✓ Bucket "${bucket}" creado`);

        // Configurar política de lectura pública
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucket}/*`],
            },
          ],
        };

        await s3Client.send(
          new PutBucketPolicyCommand({
            Bucket: bucket,
            Policy: JSON.stringify(policy),
          })
        );
        console.log(`✓ Política pública configurada para "${bucket}"\n`);
      } catch (error) {
        console.error(`✗ Error creando bucket "${bucket}":`, error.message);
      }
    }

    console.log('\n✅ MinIO configurado correctamente');
    console.log('\n📍 Acceso:');
    console.log(`   API: http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`);
    console.log(`   Console: http://${process.env.MINIO_ENDPOINT}:9001`);
    console.log(`   Usuario: ${process.env.MINIO_ROOT_USER}`);
    console.log(`   Password: ${process.env.MINIO_ROOT_PASSWORD}`);
  } catch (error) {
    console.error('\n❌ Error configurando MinIO:', error);
    process.exit(1);
  }
}

setupMinIO();
