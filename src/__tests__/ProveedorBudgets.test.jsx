import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

import ProveedorBudgets from '../components/proveedores/ProveedorBudgets';

// Mock del hook para controlar datos y acciones
const mockUpdate = vi.fn();
vi.mock('../hooks/useSupplierBudgets', () => ({
  __esModule: true,
  default: () => ({
    budgets: [
      { id: 'b1', description: 'Fotografía', amount: 1000, currency: 'EUR', status: 'pending' },
      { id: 'b2', description: 'Vídeo', amount: 800, currency: 'EUR', status: 'accepted' },
    ],
    updateBudgetStatus: mockUpdate,
  }),
}));

describe('<ProveedorBudgets />', () => {
  beforeEach(() => {
    mockUpdate.mockReset();
  });

  it('renderiza los presupuestos y permite aceptar uno pendiente', () => {
    render(<ProveedorBudgets supplierId="sup1" />);

    // Verificar que los presupuestos se muestran
    expect(screen.getByText('Fotografía')).toBeInTheDocument();
    expect(screen.getByText('Vídeo')).toBeInTheDocument();

    // Click en Aceptar del primer presupuesto (pendiente)
    const acceptBtn = screen.getAllByRole('button', { name: /aceptar/i })[0];
    fireEvent.click(acceptBtn);

    expect(mockUpdate).toHaveBeenCalledWith('b1', 'accept');
  });
});
