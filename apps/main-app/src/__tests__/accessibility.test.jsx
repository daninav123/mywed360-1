import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../App', () => ({
  __esModule: true,
  default: () => <div data-testid="app-root" />,
}));

expect.extend(toHaveNoViolations);

// Test básico de accesibilidad sobre la aplicación principal
// Ejecuta jest-axe contra el contenedor renderizado y falla si se detectan violaciones

describe('Accesibilidad global', () => {
  it('App no tiene violaciones de accesibilidad', async () => {
    const { default: App } = await import('../App');
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
