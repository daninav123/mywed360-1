import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SeatingPlan from '../pages/SeatingPlan';

// Mock fetch for guests
beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
  );
  // stub html2canvas & jsPDF used inside component
  jest.mock('html2canvas', () => () => Promise.resolve(document.createElement('canvas')));
  jest.mock('jspdf', () => function() { this.addImage = jest.fn(); this.save = jest.fn(); });
});

afterAll(() => {
  global.fetch.mockClear();
  delete global.fetch;
});

describe.skip('SeatingPlan Legacy Undo/Redo', () => {
  it('adds table and can undo/redo', async () => {
    render(<SeatingPlan />);

    // click add table
    const addBtn = screen.getByRole('button', { name: /añadir mesa/i });
    fireEvent.click(addBtn);

    // verify mesa count indicator changes (Mesas: 1)
    expect(await screen.findByText(/Mesas: 1/)).toBeInTheDocument();

    // undo
    fireEvent.click(screen.getByRole('button', { name: /undo/i }));
    await waitFor(() => expect(screen.getByText(/Mesas: 0/)).toBeInTheDocument());

    // redo
    fireEvent.click(screen.getByRole('button', { name: /redo/i }));
    await waitFor(() => expect(screen.getByText(/Mesas: 1/)).toBeInTheDocument());
  });
});
