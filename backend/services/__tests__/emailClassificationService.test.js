/**
 * Tests unitarios para emailClassificationService
 * Verifica clasificación IA de emails y fallback heurístico
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { callClassificationAPI, getClassificationStats } from '../emailClassificationService.js';

// Mock de OpenAI
const mockCreate = vi.fn();
vi.mock('openai', () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  })),
}));

// Mock de db
const mockAdd = vi.fn();
const mockGet = vi.fn();
const mockWhere = vi.fn();
const mockCollection = vi.fn(() => ({
  add: mockAdd,
  where: mockWhere,
  get: mockGet,
}));

vi.mock('../../db.js', () => ({
  db: {
    collection: mockCollection,
  },
}));

describe('emailClassificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_MODEL = 'gpt-4o-mini';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('callClassificationAPI', () => {
    const testEmail = {
      from: 'proveedor@catering.com',
      to: 'pareja@boda.com',
      subject: 'Presupuesto actualizado para catering',
      body: 'Adjunto el presupuesto actualizado con los cambios solicitados...',
    };

    it('clasifica email correctamente con OpenAI', async () => {
      // Mock respuesta de OpenAI
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              category: 'Proveedor',
              tags: ['proveedor', 'catering', 'presupuesto'],
              folder: 'important',
              confidence: 0.9,
              reason: 'Email de proveedor con presupuesto adjunto',
              autoReply: false,
              priority: 'high',
              actionItems: ['Revisar presupuesto', 'Comparar con otros proveedores'],
            }),
          },
        }],
      });

      // Mock de métricas
      mockAdd.mockResolvedValue({ id: 'metric-001' });

      const result = await callClassificationAPI(testEmail);

      // Verificar llamada a OpenAI
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          temperature: 0.3,
          response_format: { type: 'json_object' },
        })
      );

      // Verificar resultado
      expect(result).toMatchObject({
        category: 'Proveedor',
        tags: ['proveedor', 'catering', 'presupuesto'],
        folder: 'important',
        confidence: 0.9,
        priority: 'high',
        source: 'openai',
        model: 'gpt-4o-mini',
      });

      expect(result.durationMs).toBeGreaterThan(0);
    });

    it('usa fallback heurístico cuando OpenAI falla', async () => {
      mockCreate.mockRejectedValue(new Error('OpenAI API error'));
      mockAdd.mockResolvedValue({ id: 'metric-002' });

      const result = await callClassificationAPI(testEmail);

      // Verificar que usó fallback
      expect(result.source).toBe('heuristic');
      expect(result.model).toBe('local');
      expect(result.category).toBe('Proveedor');
      expect(result.confidence).toBeLessThan(1);
    });

    it('usa fallback cuando OPENAI_API_KEY no está configurada', async () => {
      delete process.env.OPENAI_API_KEY;
      mockAdd.mockResolvedValue({ id: 'metric-003' });

      const result = await callClassificationAPI(testEmail);

      expect(mockCreate).not.toHaveBeenCalled();
      expect(result.source).toBe('heuristic');
    });

    it('valida y normaliza categorías inválidas', async () => {
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              category: 'CategoríaInválida',
              tags: [],
              folder: 'carpeta-invalida',
              confidence: 1.5, // > 1
              reason: '',
              autoReply: false,
              priority: 'invalid',
              actionItems: [],
            }),
          },
        }],
      });

      mockAdd.mockResolvedValue({ id: 'metric-004' });

      const result = await callClassificationAPI(testEmail);

      expect(result.category).toBe('General'); // Fallback a General
      expect(result.folder).toBe('inbox'); // Fallback a inbox
      expect(result.confidence).toBe(1); // Capped a 1
      expect(result.priority).toBe('medium'); // Fallback a medium
    });

    it('limita número de tags y actionItems', async () => {
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              category: 'Proveedor',
              tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7'], // 7 tags
              folder: 'inbox',
              confidence: 0.8,
              reason: 'Test',
              autoReply: false,
              priority: 'medium',
              actionItems: ['item1', 'item2', 'item3', 'item4'], // 4 items
            }),
          },
        }],
      });

      mockAdd.mockResolvedValue({ id: 'metric-005' });

      const result = await callClassificationAPI(testEmail);

      expect(result.tags).toHaveLength(5); // Máximo 5 tags
      expect(result.actionItems).toHaveLength(3); // Máximo 3 items
    });

    it('maneja timeout de OpenAI', async () => {
      // Simular timeout
      mockCreate.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 35000)) // > 30s timeout
      );

      mockAdd.mockResolvedValue({ id: 'metric-006' });

      const result = await callClassificationAPI(testEmail);

      // Debe usar fallback
      expect(result.source).toBe('heuristic');
    });
  });

  describe('Clasificación heurística (fallback)', () => {
    beforeEach(() => {
      delete process.env.OPENAI_API_KEY; // Forzar heurística
    });

    it('detecta emails de proveedores', async () => {
      const email = {
        from: 'info@catering.com',
        to: 'user@test.com',
        subject: 'Propuesta de menú para tu boda',
        body: 'Somos un proveedor de catering...',
      };

      const result = await callClassificationAPI(email);

      expect(result.category).toBe('Proveedor');
      expect(result.tags).toContain('proveedor');
      expect(result.priority).toBe('high');
    });

    it('detecta emails RSVP', async () => {
      const email = {
        from: 'invitado@test.com',
        to: 'user@test.com',
        subject: 'Confirmación de asistencia',
        body: 'Confirmo mi asistencia a la boda...',
      };

      const result = await callClassificationAPI(email);

      expect(result.category).toBe('RSVP');
      expect(result.tags).toContain('rsvp');
      expect(result.autoReply).toBe(true);
      expect(result.priority).toBe('high');
    });

    it('detecta facturas', async () => {
      const email = {
        from: 'contabilidad@proveedor.com',
        to: 'user@test.com',
        subject: 'Factura #12345',
        body: 'Adjunto factura por servicios prestados...',
      };

      const result = await callClassificationAPI(email);

      expect(result.category).toBe('Facturas');
      expect(result.tags).toContain('factura');
    });

    it('detecta presupuestos como finanzas', async () => {
      const email = {
        from: 'proveedor@test.com',
        to: 'user@test.com',
        subject: 'Presupuesto solicitado',
        body: 'Te envío el presupuesto...',
      };

      const result = await callClassificationAPI(email);

      expect(result.category).toBe('Finanzas');
      expect(result.tags).toContain('finanzas');
    });

    it('detecta contratos', async () => {
      const email = {
        from: 'legal@proveedor.com',
        to: 'user@test.com',
        subject: 'Contrato para firma',
        body: 'Adjunto el contrato que necesita su firma...',
      };

      const result = await callClassificationAPI(email);

      expect(result.category).toBe('Contratos');
      expect(result.tags).toContain('contrato');
      expect(result.tags).toContain('legal');
    });

    it('detecta reuniones', async () => {
      const email = {
        from: 'proveedor@test.com',
        to: 'user@test.com',
        subject: 'Propuesta de reunión',
        body: 'Me gustaría agendar una cita para discutir...',
      };

      const result = await callClassificationAPI(email);

      expect(result.category).toBe('Reuniones');
      expect(result.tags).toContain('reunion');
    });

    it('marca como importante emails urgentes', async () => {
      const email = {
        from: 'proveedor@test.com',
        to: 'user@test.com',
        subject: 'URGENTE: Confirmación necesaria',
        body: 'Necesitamos respuesta ASAP...',
      };

      const result = await callClassificationAPI(email);

      expect(result.folder).toBe('important');
      expect(result.priority).toBe('high');
    });

    it('usa General para emails sin coincidencias', async () => {
      const email = {
        from: 'random@test.com',
        to: 'user@test.com',
        subject: 'Hola',
        body: 'Mensaje genérico sin palabras clave...',
      };

      const result = await callClassificationAPI(email);

      expect(result.category).toBe('General');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('getClassificationStats', () => {
    it('calcula estadísticas correctamente', async () => {
      // Mock de datos de métricas
      const mockDocs = [
        {
          data: () => ({
            success: true,
            model: 'gpt-4o-mini',
            category: 'Proveedor',
            durationMs: 1000,
            timestamp: new Date().toISOString(),
          }),
        },
        {
          data: () => ({
            success: true,
            model: 'gpt-4o-mini',
            category: 'RSVP',
            durationMs: 1200,
            timestamp: new Date().toISOString(),
          }),
        },
        {
          data: () => ({
            success: true,
            model: 'local',
            category: 'General',
            durationMs: 50,
            timestamp: new Date().toISOString(),
          }),
        },
        {
          data: () => ({
            success: false,
            error: 'Timeout',
            durationMs: 30000,
            timestamp: new Date().toISOString(),
          }),
        },
      ];

      mockWhere.mockReturnThis();
      mockGet.mockResolvedValue({
        size: 4,
        docs: mockDocs,
      });

      const stats = await getClassificationStats(7);

      expect(stats.total).toBe(4);
      expect(stats.successful).toBe(3);
      expect(stats.failed).toBe(1);
      expect(stats.successRate).toBe(0.75);
      expect(stats.usingOpenAI).toBe(2);
      expect(stats.usingHeuristic).toBe(1);
      expect(stats.avgDurationMs).toBeGreaterThan(0);
      expect(stats.categoryCounts).toEqual({
        Proveedor: 1,
        RSVP: 1,
        General: 1,
      });
    });

    it('maneja colección vacía', async () => {
      mockWhere.mockReturnThis();
      mockGet.mockResolvedValue({
        size: 0,
        docs: [],
      });

      const stats = await getClassificationStats(7);

      expect(stats.total).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.avgDurationMs).toBe(0);
    });
  });

  describe('Integración con contexto', () => {
    it('incluye contexto de boda en el prompt', async () => {
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              category: 'Proveedor',
              tags: [],
              folder: 'inbox',
              confidence: 0.8,
              reason: 'Test',
              autoReply: false,
              priority: 'medium',
              actionItems: [],
            }),
          },
        }],
      });

      mockAdd.mockResolvedValue({ id: 'metric-007' });

      await callClassificationAPI(
        {
          from: 'test@test.com',
          to: 'user@test.com',
          subject: 'Test',
          body: 'Test body',
        },
        { weddingId: 'wedding-123' }
      );

      // Verificar que el prompt incluye el weddingId
      const prompt = mockCreate.mock.calls[0][0].messages[1].content;
      expect(prompt).toContain('wedding-123');
    });
  });
});
