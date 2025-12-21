import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import '@testing-library/jest-dom';

vi.mock('react-dnd', () => ({
  __esModule: true,
  useDrag: () => [{ isDragging: false }, () => {}],
}));

import GuestItem from '../components/GuestItem';

describe('GuestItem', () => {
  it('renders guest name', () => {
    render(<GuestItem guest={{ id: 1, name: 'Juan Pérez' }} />);
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });
});
