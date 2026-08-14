import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getOrderReceiveColumns } from '../TableColumns';
import { OrderReceiveRow } from '../../types';
import { ORDER_RECEIVE_TABLE_HEADERS } from '../../../../config/label/OrderReceive.labels';

// Only the receipt-number column is rendered here, so the attachment cell (which needs
// the auth store and a lazy RTK Query hook) is never mounted. The module is still
// imported by TableColumns, so it is stubbed to keep this suite free of store wiring.
jest.mock('../InvoiceAttachment', () => () => null);

// -----------------------------------------------------------------------------
// The GRN column renders OUR goods-receipt number (Receipt.receipt_number), which is
// NULL on every row that predates migration 019's backfill and on any org that has not
// opted into a custom scheme. The internal RA-key (`reNo`) is the fallback — it is a
// row identity, not a document number, so it must never be shown when a real number
// exists, and must always be shown when one does not (a blank cell would leave the row
// unidentifiable in the list).
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
  ...over,
});

const columns = () =>
  getOrderReceiveColumns(
    null,            // editingRowId
    null,            // editingDraft
    jest.fn(),       // setEditingDraft
    jest.fn(),       // handleViewDetailsClick
    jest.fn(),       // handleEditClick
    jest.fn(),       // handlePaymentDetailsClick
    jest.fn(),       // handleSaveClick
    jest.fn(),       // handleCancelClick
    jest.fn(() => true), // validateInlineEditing
  );

const renderReceiptNumberCell = (row: OrderReceiveRow) => {
  const column = columns().find((c) => c.key === 'reNo');
  if (!column?.render) throw new Error('receipt-number column has no render function');
  return render(<>{column.render(row)}</>);
};

describe('OrderReceive table — receipt number column', () => {
  it('is headed with OUR receipt number, distinct from the supplier invoice column', () => {
    const cols = columns();
    expect(cols.find((c) => c.key === 'reNo')?.header).toBe(
      ORDER_RECEIVE_TABLE_HEADERS.RECEIPT_NUMBER,
    );
    expect(cols.find((c) => c.key === 'invoice_number')?.header).toBe(
      ORDER_RECEIVE_TABLE_HEADERS.SUPPLIER_INVOICE_NUMBER,
    );
    expect(ORDER_RECEIVE_TABLE_HEADERS.RECEIPT_NUMBER).not.toBe(
      ORDER_RECEIVE_TABLE_HEADERS.SUPPLIER_INVOICE_NUMBER,
    );
  });

  it('renders the legacy GRN number when the row carries one', () => {
    renderReceiptNumberCell(baseRow());
    expect(screen.getByText('GRN-000700')).toBeInTheDocument();
    expect(screen.queryByText('RA700')).not.toBeInTheDocument();
  });

  it('renders a schemed number verbatim — never re-derived or decorated client-side', () => {
    renderReceiptNumberCell(baseRow({ receipt_number: 'GRN/26-27/000042' }));
    expect(screen.getByText('GRN/26-27/000042')).toBeInTheDocument();
  });

  it.each([
    ['null (legacy row, pre-backfill)', null],
    ['undefined (field absent from an older API response)', undefined],
    ['empty string', ''],
  ])('falls back to the internal RA-key when receipt_number is %s', (_label, value) => {
    renderReceiptNumberCell(baseRow({ receipt_number: value as string | null }));
    expect(screen.getByText('RA700')).toBeInTheDocument();
  });

  // The supplier's invoice number lives in its OWN column and must never leak into the
  // receipt-number cell — conflating the two is the mistake the separate columns exist
  // to prevent.
  it('never shows the supplier invoice number in the receipt-number cell', () => {
    renderReceiptNumberCell(baseRow({ receipt_number: null }));
    expect(screen.queryByText('SUP-INV-1')).not.toBeInTheDocument();
  });

  it("shows '-' in the supplier-invoice column when the supplier invoice number is missing", () => {
    const column = columns().find((c) => c.key === 'invoice_number');
    render(<>{column!.render!(baseRow({ invoice_number: undefined }))}</>);
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
