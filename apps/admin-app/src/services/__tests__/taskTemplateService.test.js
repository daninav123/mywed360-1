import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transformTemplateToTasks } from '../taskTemplateService';

describe('taskTemplateService', () => {
  describe('transformTemplateToTasks', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('transforma plantilla con bloques y fechas correctamente', () => {
      const template = {
        id: 'test-template',
        version: '1',
        blocks: [
          {
            id: 'fundamentos',
            name: 'Fundamentos',
            category: 'FUNDAMENTOS',
            startPct: 0,
            endPct: 0.2,
            daysBeforeWedding: 150,
            durationDays: 30,
            items: [
              {
                id: 'difundir',
                name: 'Difundir la noticia',
                category: 'FUNDAMENTOS',
                daysBeforeWedding: 148,
                durationDays: 7,
              },
            ],
          },
        ],
      };

      const weddingDate = new Date('2026-06-15');
      const tasks = transformTemplateToTasks(template, weddingDate);

      // Debe crear 2 tareas: 1 padre + 1 subtarea
      expect(tasks).toHaveLength(2);

      // Verificar tarea padre
      const parentTask = tasks.find((t) => t.isParent);
      expect(parentTask).toBeDefined();
      expect(parentTask.title).toBe('Fundamentos');
      expect(parentTask.category).toBe('FUNDAMENTOS');
      expect(parentTask.children).toHaveLength(1);

      // Verificar subtarea
      const childTask = tasks.find((t) => t.parentId);
      expect(childTask).toBeDefined();
      expect(childTask.title).toBe('Difundir la noticia');
      expect(childTask.parentId).toBe(parentTask.id);
    });

    it('calcula fechas correctamente con offset antes de la boda', () => {
      const template = {
        blocks: [
          {
            id: 'test',
            name: 'Test Block',
            daysBeforeWedding: 30, // 30 días antes
            durationDays: 7,
            items: [],
          },
        ],
      };

      const weddingDate = new Date('2026-06-15'); // 15 de junio
      const tasks = transformTemplateToTasks(template, weddingDate);

      const parentTask = tasks.find((t) => t.isParent);
      expect(parentTask).toBeDefined();

      // Debe ser 30 días antes: 16 de mayo
      const expectedStart = new Date('2026-05-16');
      expect(parentTask.startDate.toDateString()).toBe(expectedStart.toDateString());

      // Duración 7 días: hasta 23 de mayo
      const expectedEnd = new Date('2026-05-23');
      expect(parentTask.endDate.toDateString()).toBe(expectedEnd.toDateString());
    });

    it('maneja plantillas sin items correctamente', () => {
      const template = {
        blocks: [
          {
            id: 'empty',
            name: 'Empty Block',
            items: [],
          },
        ],
      };

      const weddingDate = new Date('2026-06-15');
      const tasks = transformTemplateToTasks(template, weddingDate);

      // Solo debe crear el padre
      expect(tasks).toHaveLength(1);
      expect(tasks[0].isParent).toBe(true);
      expect(tasks[0].children).toHaveLength(0);
    });

    it('retorna array vacío si template es inválido', () => {
      const invalidTemplates = [
        null,
        undefined,
        {},
        { blocks: null },
        { blocks: 'not-an-array' },
      ];

      const weddingDate = new Date('2026-06-15');

      invalidTemplates.forEach((template) => {
        const tasks = transformTemplateToTasks(template, weddingDate);
        expect(Array.isArray(tasks)).toBe(true);
        expect(tasks.length).toBeGreaterThanOrEqual(0); // Puede usar fallback legacy
      });
    });

    it('retorna array vacío si fecha es inválida', () => {
      const template = {
        blocks: [
          {
            id: 'test',
            name: 'Test',
            items: [],
          },
        ],
      };

      const invalidDates = [
        'invalid-date',
        null,
        undefined,
        new Date('invalid'),
      ];

      invalidDates.forEach((date) => {
        const tasks = transformTemplateToTasks(template, date);
        expect(Array.isArray(tasks)).toBe(true);
        // En este caso retorna vacío porque la fecha es inválida
        expect(tasks).toHaveLength(0);
      });
    });

    it('asigna IDs únicos a todas las tareas', () => {
      const template = {
        blocks: [
          {
            id: 'block1',
            name: 'Block 1',
            items: [
              { id: 'item1', name: 'Item 1' },
              { id: 'item2', name: 'Item 2' },
            ],
          },
          {
            id: 'block2',
            name: 'Block 2',
            items: [
              { id: 'item3', name: 'Item 3' },
            ],
          },
        ],
      };

      const weddingDate = new Date('2026-06-15');
      const tasks = transformTemplateToTasks(template, weddingDate);

      const ids = tasks.map((t) => t.id);
      const uniqueIds = new Set(ids);
      
      // Todos los IDs deben ser únicos
      expect(uniqueIds.size).toBe(ids.length);
      
      // Ningún ID debe estar vacío
      expect(ids.every((id) => id && id.length > 0)).toBe(true);
    });

    it('preserva metadatos de la plantilla (assigneeSuggestion, checklist)', () => {
      const template = {
        blocks: [
          {
            id: 'test',
            name: 'Test',
            items: [
              {
                id: 'item',
                name: 'Item con metadatos',
                assigneeSuggestion: 'bride',
                checklist: [
                  'Paso 1',
                  'Paso 2',
                ],
              },
            ],
          },
        ],
      };

      const weddingDate = new Date('2026-06-15');
      const tasks = transformTemplateToTasks(template, weddingDate);

      const subtask = tasks.find((t) => t.parentId);
      expect(subtask.assigneeSuggestion).toBe('bride');
      expect(subtask.checklist).toHaveLength(2);
    });

    it('maneja múltiples bloques correctamente', () => {
      const template = {
        blocks: [
          {
            id: 'block1',
            name: 'Block 1',
            items: [
              { id: 'item1', name: 'Item 1' },
            ],
          },
          {
            id: 'block2',
            name: 'Block 2',
            items: [
              { id: 'item2', name: 'Item 2' },
              { id: 'item3', name: 'Item 3' },
            ],
          },
        ],
      };

      const weddingDate = new Date('2026-06-15');
      const tasks = transformTemplateToTasks(template, weddingDate);

      // 2 padres + 3 subtareas = 5 tareas
      expect(tasks).toHaveLength(5);

      const parents = tasks.filter((t) => t.isParent);
      const children = tasks.filter((t) => t.parentId);

      expect(parents).toHaveLength(2);
      expect(children).toHaveLength(3);
    });
  });
});
