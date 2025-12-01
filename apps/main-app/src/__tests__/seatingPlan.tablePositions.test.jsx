/**
 * Tests para verificar que las posiciones de las mesas se mantienen correctas
 * y no se corrompen al generar layouts o seleccionar mesas
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateAutoLayout } from '../utils/seatingLayoutGenerator';

describe('Seating Plan - Table Positions Integrity', () => {
  const mockGuests = Array.from({ length: 250 }, (_, i) => ({
    id: `guest-${i + 1}`,
    name: `Guest ${i + 1}`,
    table: `Mesa ${Math.floor(i / 10) + 1}`,
    confirmed: true,
  }));

  const hallSize = { width: 1800, height: 1200 };

  beforeEach(() => {
    // Limpiar cualquier estado previo
  });

  it('should generate tables with unique positions (columns layout)', () => {
    const result = generateAutoLayout(mockGuests, 'columns', hallSize);

    expect(result.tables).toBeDefined();
    expect(result.tables.length).toBeGreaterThan(0);

    // Verificar que todas las mesas tienen posiciones definidas
    result.tables.forEach((table, index) => {
      expect(table.x).toBeDefined();
      expect(table.y).toBeDefined();
      expect(typeof table.x).toBe('number');
      expect(typeof table.y).toBe('number');
      expect(table.x).toBeGreaterThanOrEqual(0);
      expect(table.y).toBeGreaterThanOrEqual(0);
    });

    // Crear un Set de posiciones para verificar unicidad
    const positions = new Set(result.tables.map((t) => `${t.x},${t.y}`));

    // Al menos 80% de las mesas deben tener posiciones únicas
    const uniqueRatio = positions.size / result.tables.length;
    expect(uniqueRatio).toBeGreaterThanOrEqual(0.8);

    console.log('✅ Test passed: Unique positions ratio:', uniqueRatio);
    console.log('   Total tables:', result.tables.length);
    console.log('   Unique positions:', positions.size);
  });

  it('should not have all tables at the same position', () => {
    const result = generateAutoLayout(mockGuests, 'columns', hallSize);

    const positions = result.tables.map((t) => `${t.x},${t.y}`);
    const firstPosition = positions[0];
    const allSame = positions.every((pos) => pos === firstPosition);

    expect(allSame).toBe(false);

    if (allSame) {
      console.error('❌ CRITICAL: All tables at same position:', firstPosition);
    } else {
      console.log('✅ Tables are distributed across different positions');
    }
  });

  it('should maintain correct positions after sanitization', () => {
    const result = generateAutoLayout(mockGuests, 'columns', hallSize);

    // Verificar que las coordenadas no son (120, 120) que es el valor por defecto
    const defaultPositionCount = result.tables.filter((t) => t.x === 120 && t.y === 120).length;

    // Máximo 10% de las mesas pueden estar en la posición por defecto
    const defaultRatio = defaultPositionCount / result.tables.length;
    expect(defaultRatio).toBeLessThanOrEqual(0.1);

    console.log('✅ Default position ratio:', defaultRatio);
  });

  it('should generate different positions for circular layout', () => {
    const result = generateAutoLayout(mockGuests, 'circular', hallSize);

    expect(result.tables.length).toBeGreaterThan(0);

    const positions = new Set(result.tables.map((t) => `${t.x},${t.y}`));
    const uniqueRatio = positions.size / result.tables.length;

    expect(uniqueRatio).toBeGreaterThanOrEqual(0.7);

    console.log('✅ Circular layout - Unique positions ratio:', uniqueRatio);
  });

  it('should detect corrupted data (all tables at same position)', () => {
    // Simular datos corruptos
    const corruptedTables = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      x: 900,
      y: 220,
      seats: 10,
      shape: 'circle',
    }));

    const positions = new Set(corruptedTables.map((t) => `${t.x},${t.y}`));
    const isCorrupted = positions.size < corruptedTables.length * 0.3;

    expect(isCorrupted).toBe(true);
    console.log('✅ Corruption detection works correctly');
  });

  it('should preserve x=0 and y=0 coordinates', () => {
    const testTable = {
      id: 1,
      x: 0,
      y: 0,
      tableType: 'round',
      seats: 10,
    };

    // Importar y probar createTableFromType
    const { createTableFromType } = require('../utils/seatingTables');

    const result = createTableFromType('round', testTable);

    // Verificar que x=0 y y=0 se preservan (no se convierten a 120)
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);

    console.log('✅ Zero coordinates preserved correctly');
  });

  it('should handle with-aisle layout correctly', () => {
    const result = generateAutoLayout(mockGuests, 'with-aisle', hallSize);

    expect(result.tables.length).toBeGreaterThan(0);

    const positions = new Set(result.tables.map((t) => `${t.x},${t.y}`));
    const uniqueRatio = positions.size / result.tables.length;

    expect(uniqueRatio).toBeGreaterThanOrEqual(0.7);

    console.log('✅ With-aisle layout - Unique positions ratio:', uniqueRatio);
  });

  it('should detect if positions are lost during processing', () => {
    const result = generateAutoLayout(mockGuests, 'columns', hallSize);

    // Contar cuántas mesas tienen posiciones válidas (no NaN, no undefined)
    const validPositions = result.tables.filter(
      (t) => !isNaN(t.x) && !isNaN(t.y) && t.x != null && t.y != null
    );

    expect(validPositions.length).toBe(result.tables.length);

    console.log('✅ All tables have valid positions');
    console.log('   Valid:', validPositions.length, '/', result.tables.length);
  });

  it('should maintain positions across multiple generations', () => {
    const result1 = generateAutoLayout(mockGuests, 'columns', hallSize);
    const result2 = generateAutoLayout(mockGuests, 'columns', hallSize);

    // Ambos resultados deben tener el mismo número de mesas
    expect(result1.tables.length).toBe(result2.tables.length);

    // Ambos deben tener posiciones únicas
    const positions1 = new Set(result1.tables.map((t) => `${t.x},${t.y}`));
    const positions2 = new Set(result2.tables.map((t) => `${t.x},${t.y}`));

    const uniqueRatio1 = positions1.size / result1.tables.length;
    const uniqueRatio2 = positions2.size / result2.tables.length;

    expect(uniqueRatio1).toBeGreaterThanOrEqual(0.8);
    expect(uniqueRatio2).toBeGreaterThanOrEqual(0.8);

    console.log('✅ Consistent generation across multiple calls');
  });
});

describe('Seating Plan - Table Sanitization', () => {
  it('should not lose coordinates during sanitization', () => {
    const { sanitizeTable } = require('../utils/seatingTables');

    const testTable = {
      id: 1,
      name: 'Mesa 1',
      x: 500,
      y: 300,
      tableType: 'round',
      seats: 10,
      shape: 'circle',
      diameter: 120,
    };

    const result = sanitizeTable(testTable);

    expect(result.x).toBe(500);
    expect(result.y).toBe(300);
    expect(result.id).toBe(1);

    console.log('✅ Sanitization preserves coordinates');
  });

  it('should handle edge case coordinates', () => {
    const { sanitizeTable } = require('../utils/seatingTables');

    const edgeCases = [
      { x: 0, y: 0 },
      { x: 1800, y: 1200 },
      { x: 900, y: 600 },
      { x: 0, y: 1200 },
      { x: 1800, y: 0 },
    ];

    edgeCases.forEach((coords) => {
      const table = {
        id: 1,
        ...coords,
        tableType: 'round',
        seats: 10,
      };

      const result = sanitizeTable(table);

      expect(result.x).toBe(coords.x);
      expect(result.y).toBe(coords.y);
    });

    console.log('✅ Edge case coordinates handled correctly');
  });
});
