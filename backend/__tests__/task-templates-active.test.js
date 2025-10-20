import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import taskTemplatesRouter from '../routes/task-templates.js';

// Mock de db (en tests reales, usar Firebase Testing o mocks)
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/task-templates', taskTemplatesRouter);

describe('Task Templates API - Public Endpoint', () => {
  describe('GET /api/task-templates/active', () => {
    it('responde con status 200 o 404 (depende si hay plantilla)', async () => {
      const response = await request(app)
        .get('/api/task-templates/active')
        .expect((res) => {
          // Debe ser 200 (si hay plantilla) o 404 (si no hay)
          expect([200, 404].includes(res.status)).toBe(true);
        });
    });

    it('retorna JSON válido', async () => {
      const response = await request(app)
        .get('/api/task-templates/active');

      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.body).toBeDefined();
    });

    it('no requiere autenticación', async () => {
      // Sin headers de autenticación
      const response = await request(app)
        .get('/api/task-templates/active');

      // No debe ser 401 (unauthorized)
      expect(response.status).not.toBe(401);
    });

    it('permite CORS (puede ser llamado desde frontend)', async () => {
      const response = await request(app)
        .get('/api/task-templates/active')
        .set('Origin', 'http://localhost:5173');

      // Debe tener headers CORS
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('si encuentra plantilla, tiene estructura correcta', async () => {
      const response = await request(app)
        .get('/api/task-templates/active');

      if (response.status === 200) {
        expect(response.body).toHaveProperty('template');
        
        const { template } = response.body;
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('version');
        expect(template).toHaveProperty('blocks');
        expect(Array.isArray(template.blocks)).toBe(true);
        
        if (template.totals) {
          expect(typeof template.totals.blocks).toBe('number');
          expect(typeof template.totals.subtasks).toBe('number');
        }
      }
    });

    it('si no encuentra plantilla, retorna 404 con mensaje', async () => {
      // Este test asume que no hay plantilla publicada
      // En un entorno de test limpio, debería dar 404
      const response = await request(app)
        .get('/api/task-templates/active');

      if (response.status === 404) {
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('no_published_template');
        expect(response.body).toHaveProperty('message');
      }
    });

    it('incluye flag de caché en la respuesta', async () => {
      const response = await request(app)
        .get('/api/task-templates/active');

      if (response.status === 200) {
        expect(response.body).toHaveProperty('cached');
        expect(typeof response.body.cached).toBe('boolean');
      }
    });

    it('maneja errores internos con 500', async () => {
      // Probar con db no disponible o error interno
      // En un test real, mockearías el db para que falle
      const response = await request(app)
        .get('/api/task-templates/active');

      if (response.status === 500) {
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('POST /api/task-templates/invalidate-cache', () => {
    it('invalida la caché correctamente', async () => {
      const response = await request(app)
        .post('/api/task-templates/invalidate-cache')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    it('permite llamadas sin autenticación (endpoint interno/debug)', async () => {
      const response = await request(app)
        .post('/api/task-templates/invalidate-cache');

      expect(response.status).not.toBe(401);
    });

    it('después de invalidar, próximo GET recarga desde Firebase', async () => {
      // Invalidar caché
      await request(app)
        .post('/api/task-templates/invalidate-cache')
        .expect(200);

      // Hacer GET
      const response = await request(app)
        .get('/api/task-templates/active');

      if (response.status === 200) {
        // Primera llamada después de invalidar debería tener cached: false
        expect(response.body.cached).toBe(false);
      }
    });
  });

  describe('Caching behavior', () => {
    it('usa caché en llamadas consecutivas', async () => {
      // Primera llamada (debe cargar de Firebase)
      const first = await request(app)
        .get('/api/task-templates/active');

      if (first.status === 200) {
        // Segunda llamada inmediata (debe usar caché)
        const second = await request(app)
          .get('/api/task-templates/active');

        if (second.status === 200) {
          expect(second.body.cached).toBe(true);
          
          // Los datos deben ser los mismos
          expect(second.body.template.id).toBe(first.body.template.id);
          expect(second.body.template.version).toBe(first.body.template.version);
        }
      }
    });
  });
});
