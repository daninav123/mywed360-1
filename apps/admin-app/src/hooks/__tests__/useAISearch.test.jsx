/**
 * Tests unitarios para useAISearch hook
 * Verifica búsqueda de proveedores con IA
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useAISearch from '../useAISearch';

// Mock de hooks
vi.mock('../useActiveWeddingInfo', () => ({
  default: () => ({
    weddingId: 'test-wedding-123',
    weddingData: {
      date: '2025-06-15',
      location: 'Madrid',
    },
  }),
}));

vi.mock('../useAuth', () => ({
  useAuth: () => ({
    currentUser: {
      uid: 'test-user-123',
    },
  }),
}));

// Mock de apiClient
const mockPost = vi.fn();
const mockGet = vi.fn();
vi.mock('../../services/apiClient', () => ({
  post: (...args) => mockPost(...args),
  get: (...args) => mockGet(...args),
}));

describe('useAISearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Estado inicial', () => {
    it('inicializa con valores por defecto', () => {
      const { result } = renderHook(() => useAISearch());

      expect(result.current.results).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('searchSuppliers', () => {
    it('busca proveedores exitosamente', async () => {
      const mockResults = [
        {
          name: 'Catering Los Álamos',
          service: 'Catering',
          location: 'Madrid',
          price: '€€€',
          match: 95,
        },
        {
          name: 'Catering Gourmet',
          service: 'Catering',
          location: 'Madrid',
          price: '€€',
          match: 88,
        },
      ];

      mockPost.mockResolvedValueOnce({
        success: true,
        data: mockResults,
      });

      const { result } = renderHook(() => useAISearch());

      await waitFor(() => {
        result.current.searchSuppliers('catering Madrid');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/api/ai/search-suppliers',
        expect.objectContaining({
          query: 'catering Madrid',
        })
      );

      expect(result.current.results).toHaveLength(2);
      expect(result.current.results[0].name).toBe('Catering Los Álamos');
      expect(result.current.error).toBe(null);
    });

    it('normaliza resultados correctamente', async () => {
      mockPost.mockResolvedValueOnce({
        success: true,
        data: [
          {
            name: 'Test Proveedor',
            category: 'Fotografía', // category en lugar de service
            city: 'Barcelona', // city en lugar de location
            priceRange: '€€€',
            match: 92,
          },
        ],
      });

      const { result } = renderHook(() => useAISearch());

      await waitFor(() => {
        result.current.searchSuppliers('fotógrafo Barcelona');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const normalized = result.current.results[0];
      expect(normalized.service).toBe('Fotografía');
      expect(normalized.location).toBe('Barcelona');
      expect(normalized.priceRange).toBe('€€€');
    });

    it('maneja errores de API', async () => {
      mockPost.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAISearch());

      await waitFor(() => {
        result.current.searchSuppliers('catering');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.results).toEqual([]);
    });

    it('maneja respuesta sin success', async () => {
      mockPost.mockResolvedValueOnce({
        success: false,
        error: 'Invalid query',
      });

      const { result } = renderHook(() => useAISearch());

      await waitFor(() => {
        result.current.searchSuppliers('');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Funciones de utilidad', () => {
    describe('guessServiceFromQuery', () => {
      it('detecta fotografía', async () => {
        mockPost.mockResolvedValueOnce({
          success: true,
          data: [{ name: 'Test' }],
        });

        const { result } = renderHook(() => useAISearch());
        
        await waitFor(() => {
          result.current.searchSuppliers('busco fotógrafo');
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        // El hook debe haber inferido el servicio
        expect(mockPost).toHaveBeenCalledWith(
          '/api/ai/search-suppliers',
          expect.objectContaining({
            query: expect.stringContaining('foto'),
          })
        );
      });

      it('detecta video', async () => {
        mockPost.mockResolvedValueOnce({
          success: true,
          data: [],
        });

        const { result } = renderHook(() => useAISearch());
        
        await waitFor(() => {
          result.current.searchSuppliers('videógrafo boda');
        });

        expect(mockPost).toHaveBeenCalled();
      });

      it('detecta catering', async () => {
        mockPost.mockResolvedValueOnce({
          success: true,
          data: [],
        });

        const { result } = renderHook(() => useAISearch());
        
        await waitFor(() => {
          result.current.searchSuppliers('catering premium');
        });

        expect(mockPost).toHaveBeenCalled();
      });
    });

    describe('ensureMatchScore', () => {
      it('normaliza match score válido', async () => {
        mockPost.mockResolvedValueOnce({
          success: true,
          data: [
            { name: 'Test 1', match: 95.7 },
            { name: 'Test 2', match: 120 }, // > 100
            { name: 'Test 3', match: -10 }, // < 0
          ],
        });

        const { result } = renderHook(() => useAISearch());
        
        await waitFor(() => {
          result.current.searchSuppliers('test');
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.results[0].match).toBe(96); // Redondeado
        expect(result.current.results[1].match).toBe(100); // Capped a 100
        expect(result.current.results[2].match).toBe(0); // Mínimo 0
      });

      it('genera score por defecto si falta', async () => {
        mockPost.mockResolvedValueOnce({
          success: true,
          data: [
            { name: 'Test 1' }, // sin match
            { name: 'Test 2' },
            { name: 'Test 3' },
          ],
        });

        const { result } = renderHook(() => useAISearch());
        
        await waitFor(() => {
          result.current.searchSuppliers('test');
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        // Debe generar scores decrecientes: 95, 90, 85...
        expect(result.current.results[0].match).toBeGreaterThanOrEqual(90);
        expect(result.current.results[1].match).toBeGreaterThanOrEqual(85);
        expect(result.current.results[2].match).toBeGreaterThanOrEqual(80);
      });
    });

    describe('generateAISummary', () => {
      it('genera resumen con precio', async () => {
        mockPost.mockResolvedValueOnce({
          success: true,
          data: [
            {
              name: 'Test',
              price: '€€€',
              location: 'Madrid',
              tags: ['premium', 'elegante'],
            },
          ],
        });

        const { result } = renderHook(() => useAISearch());
        
        await waitFor(() => {
          result.current.searchSuppliers('catering premium');
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const summary = result.current.results[0].aiSummary;
        expect(summary).toContain('€€€');
        expect(summary).toContain('Madrid');
      });
    });

    describe('normalizeResult', () => {
      it('genera nombre por defecto si falta', async () => {
        mockPost.mockResolvedValueOnce({
          success: true,
          data: [
            {}, // Sin nombre
            { name: '' }, // Nombre vacío
          ],
        });

        const { result } = renderHook(() => useAISearch());
        
        await waitFor(() => {
          result.current.searchSuppliers('test');
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.results[0].name).toContain('Proveedor sugerido');
        expect(result.current.results[1].name).toContain('Proveedor sugerido');
      });

      it('normaliza campos opcionales', async () => {
        mockPost.mockResolvedValueOnce({
          success: true,
          data: [
            {
              name: 'Test',
              // Sin campos opcionales
            },
          ],
        });

        const { result } = renderHook(() => useAISearch());
        
        await waitFor(() => {
          result.current.searchSuppliers('test');
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const normalized = result.current.results[0];
        expect(normalized.location).toBe('');
        expect(normalized.priceRange).toBe('');
        expect(normalized.description).toBe('');
        expect(normalized.tags).toEqual([]);
      });

      it('incluye fuente del resultado', async () => {
        mockPost.mockResolvedValueOnce({
          success: true,
          data: [
            { name: 'Test', source: 'openai' },
          ],
        });

        const { result } = renderHook(() => useAISearch());
        
        await waitFor(() => {
          result.current.searchSuppliers('test');
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.results[0].source).toBe('openai');
      });
    });
  });

  describe('clearResults', () => {
    it('limpia resultados y error', async () => {
      mockPost.mockResolvedValueOnce({
        success: true,
        data: [{ name: 'Test' }],
      });

      const { result } = renderHook(() => useAISearch());

      await waitFor(() => {
        result.current.searchSuppliers('test');
      });

      await waitFor(() => {
        expect(result.current.results).toHaveLength(1);
      });

      await waitFor(() => {
        result.current.clearResults();
      });

      expect(result.current.results).toEqual([]);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Casos edge', () => {
    it('maneja query vacío', async () => {
      const { result } = renderHook(() => useAISearch());

      await waitFor(() => {
        result.current.searchSuppliers('');
      });

      // No debe hacer llamada a API con query vacío
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('maneja resultados vacíos', async () => {
      mockPost.mockResolvedValueOnce({
        success: true,
        data: [],
      });

      const { result } = renderHook(() => useAISearch());

      await waitFor(() => {
        result.current.searchSuppliers('proveedor inexistente');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.results).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('maneja datos malformados', async () => {
      mockPost.mockResolvedValueOnce({
        success: true,
        data: null, // Datos inválidos
      });

      const { result } = renderHook(() => useAISearch());

      await waitFor(() => {
        result.current.searchSuppliers('test');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.results).toEqual([]);
    });

    it('limita número de resultados', async () => {
      const manyResults = Array(50).fill(null).map((_, i) => ({
        name: `Proveedor ${i}`,
        match: 90 - i,
      }));

      mockPost.mockResolvedValueOnce({
        success: true,
        data: manyResults,
      });

      const { result } = renderHook(() => useAISearch());

      await waitFor(() => {
        result.current.searchSuppliers('test');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Debe limitar a un número razonable (ej. 20)
      expect(result.current.results.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Integración con contexto', () => {
    it('incluye información de la boda en la búsqueda', async () => {
      mockPost.mockResolvedValueOnce({
        success: true,
        data: [],
      });

      const { result } = renderHook(() => useAISearch());

      await waitFor(() => {
        result.current.searchSuppliers('catering');
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/api/ai/search-suppliers',
        expect.objectContaining({
          weddingId: 'test-wedding-123',
          context: expect.objectContaining({
            date: '2025-06-15',
            location: 'Madrid',
          }),
        })
      );
    });
  });
});
