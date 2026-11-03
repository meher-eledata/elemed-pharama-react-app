import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import dayjs from 'dayjs';
import { getProductTableColumns } from '../ProductTableColumns';
import { PharmaTableRow } from '../../types';
import { orderLabels } from '../../../../config/label/OrderDetail.labels';

// The receive line-items grid gained an optional, editable Selling Price column
// (per pack, GST-inclusive, same basis as MRP). Blank = not recorded.
const row: PharmaTableRow = {
  id: 'r1',
  productId: 'Paracetamol 500',
  product_id: 10,
  batchNumber: 'B1',
  qtyReceived: 5,
  qtyFree: 0,
  batch: null,
  expiryDate: dayjs('2027-06-30'),
  pp: 10,
  sp: 18,
  pack: '10x10',
  mrp: 20,
  cgst: 2.5,
  sgst: 2.5,
  igst: 0,
  disc: 0,
  margPercent: 0,
  salesDiscPercent: 0,
};

const columnsFor = (editing: Partial<PharmaTableRow> | null, updateEditingData = jest.fn()) =>
  getProductTableColumns({
    editingRowId: editing ? 'r1' : null,
    editingData: editing ?? {},
    updateEditingData,
    startEditing: jest.fn(),
    saveRow: jest.fn(),
    cancelEditing: jest.fn(),
    deleteRow: jest.fn(),
    productOptions: [],
    onAddNewProduct: jest.fn(),
  });

const spColumn = (editing: Partial<PharmaTableRow> | null, update?: jest.Mock) =>
  columnsFor(editing, update).find((c) => c.key === 'sp')!;

describe('ProductTableColumns — Selling Price column', () => {
  it('sits right after MRP and before Purchase Price, sized like them', () => {
    const columns = columnsFor(null);
    const keys = columns.map((c) => c.key);
    expect(keys.slice(keys.indexOf('mrp'), keys.indexOf('mrp') + 3)).toEqual(['mrp', 'sp', 'pp']);
    const sp = columns.find((c) => c.key === 'sp')!;
    expect(sp.header).toBe(orderLabels.sellingPrice);
    expect(sp.columnWidth).toBe(columns.find((c) => c.key === 'mrp')!.columnWidth);
  });

  it('shows the recorded SP, and "-" when it was not recorded', () => {
    const { rerender } = render(<>{spColumn(null).render!(row)}</>);
    expect(screen.getByText('18')).toBeInTheDocument();
    rerender(<>{spColumn(null).render!({ ...row, sp: 0 })}</>);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('edits the SP as a number', () => {
    const update = jest.fn();
    render(<>{spColumn({ ...row }, update).render!(row)}</>);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(input.value).toBe('18');
    expect(input).not.toHaveAttribute('aria-invalid', 'true');

    fireEvent.change(input, { target: { value: '19.5' } });
    expect(update).toHaveBeenCalledWith('sp', 19.5);
  });

  it('renders a blank input for a blank SP', () => {
    render(<>{spColumn({ ...row, sp: 0 }).render!(row)}</>);
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('');
  });

  it('flags the cell invalid while SP is above MRP', () => {
    render(<>{spColumn({ ...row, sp: 25 }).render!(row)}</>);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not offer negative values and flags a typed one invalid', () => {
    render(<>{spColumn({ ...row, sp: -2 }).render!(row)}</>);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});
