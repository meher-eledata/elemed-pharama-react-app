import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { getOrderReceiveColumns } from '../TableColumns';
import { OrderReceiveRow } from '../../types';

jest.mock('../InvoiceAttachment', () => () => null);

// -----------------------------------------------------------------------------
// A receipt deleted via POST /api/receive/delete-receipt is SOFT-deleted: the backend
// keeps it and keeps returning it in the list, so the row is still here. That is
// deliberate (the history has to stay auditable) — which makes it the UI's job to say
// the row is retired, and to stop offering actions the backend will refuse.
//
// Both actions answer 409 RECEIPT_DELETED server-side. Before this, the list routed a
// deleted receipt straight into edit mode and rendered a working Save.
// -----------------------------------------------------------------------------
const baseRow = (over: Partial<OrderReceiveRow> = {}): OrderReceiveRow => ({
  receiptId: 700,
  reNo: 'RA700',
  poNo: 'PO-9',
  po_id: 500,
  supplier: 'Acme',
  supplierId: 3,
  received: 'Jun 15, 2026 10:00 AM',
  status: 'received',
  reBy: 'tester',
  amt: 100,
  products: [],
  invoice_number: 'SUP-INV-1',
  receipt_number: 'GRN-000700',
  record_status: 'ACTIVE',
  ...over,
});

const deletedRow = (over: Partial<OrderReceiveRow> = {}) =>
  baseRow({
    record_status: 'DELETED',
    deleted_by: 'testadmin',
    deleted_at: '2026-08-20T10:40:33.335Z',
    deletion_reason: 'Entered twice by mistake',
    ...over,
  });

const makeColumns = (handlers: {
  onEdit?: jest.Mock;
  onPayment?: jest.Mock;
} = {}) =>
  getOrderReceiveColumns(
    null,
    null,
    jest.fn(),
    jest.fn(),
    handlers.onEdit ?? jest.fn(),
    handlers.onPayment ?? jest.fn(),
    jest.fn(),
    jest.fn(),
    jest.fn(() => true),
  );

const renderCell = (key: string, row: OrderReceiveRow, handlers = {}) => {
  const column = makeColumns(handlers).find((c) => c.key === key);
  if (!column?.render) throw new Error(`column ${key} has no render function`);
  return render(<>{column.render(row)}</>);
};

describe('OrderReceive table — deleted receipts', () => {
  it('flags a deleted receipt so it cannot be mistaken for a live one', () => {
    renderCell('reNo', deletedRow());
    expect(screen.getByText('Deleted')).toBeInTheDocument();
    // the number itself is still readable — the row is history, not a tombstone
    expect(screen.getByText('GRN-000700')).toBeInTheDocument();
  });

  it('does NOT flag an active receipt', () => {
    renderCell('reNo', baseRow());
    expect(screen.queryByText('Deleted')).not.toBeInTheDocument();
  });

  it('carries who/when/why in the badge tooltip', async () => {
    const user = userEvent.setup();
    renderCell('reNo', deletedRow());

    await user.hover(screen.getByText('Deleted'));

    const tip = await screen.findByRole('tooltip');
    expect(tip).toHaveTextContent('testadmin');
    expect(tip).toHaveTextContent('Entered twice by mistake');
  });

  it('does not route a deleted receipt into edit mode', async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    const { container } = renderCell('actions', deletedRow(), { onEdit });

    const editIcon = container.querySelector('[data-testid="EditIcon"]');
    expect(editIcon).toBeTruthy();
    await user.click(editIcon as Element);

    expect(onEdit).not.toHaveBeenCalled();
  });

  it('does not open payment details for a deleted receipt', async () => {
    const user = userEvent.setup();
    const onPayment = jest.fn();
    renderCell('actions', deletedRow(), { onPayment });

    await user.click(screen.getByText('₹'));

    expect(onPayment).not.toHaveBeenCalled();
  });

  it('still allows both actions on an active receipt', async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    const onPayment = jest.fn();
    const { container } = renderCell('actions', baseRow(), { onEdit, onPayment });

    await user.click(container.querySelector('[data-testid="EditIcon"]') as Element);
    await user.click(screen.getByText('₹'));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onPayment).toHaveBeenCalledTimes(1);
  });
});
