import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import PurchaseReturnDetails from '../PurchaseReturnDetails';
import { supplierReturnsApi } from '../../../../redux/slices/supplierReturnsApi';
import { inventoryApi } from '../../../../redux/slices/inventoryApi';
import { receiveApi } from '../../../../redux/slices/receiveApi';
import { baseQueryWithReauth } from '../../../../redux/baseQuery';
import type { PurchaseReturnSelectionState } from '../PurchaseReturn';

const theme = createTheme();
const mockNavigate = jest.fn();

// This suite uses the REAL supplierReturnsApi slice (mocked base query) so the
// double-submit guard is exercised through genuine RTK Query isLoading state.
jest.mock('../../../../redux/baseQuery', () => ({
  baseQueryWithReauth: jest.fn(),
}));

// Router: navigation captured; location.state controllable per-test.
let mockLocationState: PurchaseReturnSelectionState | null = null;
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/receive/purchase-return/details', state: mockLocationState }),
}));

// Confirmation dialog mock: the Confirm button stays CLICKABLE regardless of
// confirmDisabled so a rapid second click reaches onConfirm and must be
// swallowed by the page's own isSubmitting guard (the real double-submit test).
// The prop is still surfaced for assertion.
jest.mock('../../../../components/DeleteDialogue/ConfirmationDialog', () => ({
  __esModule: true,
  default: ({ open, onClose, onConfirm, title, confirmDisabled }: any) =>
    open ? (
      <div data-testid="confirmation-dialog" data-confirm-disabled={String(!!confirmDisabled)}>
        <div>{title}</div>
        <button onClick={onClose}>Dialog Cancel</button>
        <button onClick={onConfirm}>Dialog Confirm</button>
      </div>
    ) : null,
}));

jest.mock('../../../../components/PharmaTable', () => ({
  ReusableTable: ({ data, columns }: any) => (
    <div data-testid="reusable-table">
      {data?.map((row: any, idx: number) => (
        <div key={idx} data-testid={`table-row-${idx}`}>
          {columns.map((col: any) => (
            <div key={col.key} data-testid={`cell-${col.key}-${idx}`}>
              {col.render ? col.render(row) : row[col.key]}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
}));

// jsdom may not ship crypto.randomUUID (the page generates its idempotency key
// with it at mount). Test-environment polyfill only.
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = {};
}
if (typeof globalThis.crypto.randomUUID !== 'function') {
  (globalThis.crypto as any).randomUUID = () =>
    `test-uuid-${Math.random().toString(16).slice(2)}`;
}

const mockBaseQuery = baseQueryWithReauth as jest.MockedFunction<typeof baseQueryWithReauth>;

const okMeta = {
  request: new Request('http://localhost:3000/api/supplier-returns/submit-return'),
  response: { status: 201, statusText: 'Created' } as Response,
};

const makeStore = () =>
  configureStore({
    reducer: {
      auth: (state = { user: { id: 1, username: 'testuser' } }) => state,
      [supplierReturnsApi.reducerPath]: supplierReturnsApi.reducer,
      // submitReturn's onQueryStarted invalidates these two APIs' tags.
      [inventoryApi.reducerPath]: inventoryApi.reducer,
      [receiveApi.reducerPath]: receiveApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        supplierReturnsApi.middleware,
        inventoryApi.middleware,
        receiveApi.middleware
      ),
  });

const makeSelectionState = (
  over: Partial<PurchaseReturnSelectionState> = {}
): PurchaseReturnSelectionState => ({
  supplier: { id: 3, name: 'SupCo' },
  lines: [
    {
      batch: {
        batch_id: 1,
        batch_number: 'B1',
        product_id: 10,
        product_name: 'Paracetamol 500',
        type: 'Tablet',
        brand_name: 'Acme',
        quantity: 5,
        pack_qty: 10,
        purchase_price_per_unit: 10,
        mrp: 5.5,
        expiry_date: '2026-08-20',
        days_until_expiry: 9,
        expiry_status: 'NEAR_EXPIRY',
        supplier_id: 3,
        supplier_name: 'SupCo',
        receipt_id: 7,
        supplier_invoice_number: 'INV-77',
        po_number: 'PO-9',
        receipt_line_id: 12,
      },
      quantity: 2,
    },
  ],
  ...over,
});

const submitResponse = {
  message: 'Supplier return submitted',
  supplier_return_id: 42,
  return_number: 'SR-000042',
  return_status: 'AWAITING_CREDIT',
  totals: { taxable_value: 20, cgst_amount: 1.2, sgst_amount: 1.2, total_amount: 22.4 },
  credit: { credit_txn_id: 77, new_balance: 43.6 },
};

const renderPage = () =>
  render(
    <Provider store={makeStore()}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <PurchaseReturnDetails />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );

const finalizeButton = () => screen.getByRole('button', { name: /finalize return/i });

describe('PurchaseReturnDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationState = makeSelectionState();
  });

  it('redirects back to the landing page when opened without router state', () => {
    mockLocationState = null;
    const { container } = renderPage();
    expect(mockNavigate).toHaveBeenCalledWith('/receive/purchase-return', { replace: true });
    expect(container).toBeEmptyDOMElement();
  });

  it('redirects when the state has no lines', () => {
    mockLocationState = makeSelectionState({ lines: [] });
    renderPage();
    expect(mockNavigate).toHaveBeenCalledWith('/receive/purchase-return', { replace: true });
  });

  describe('settlement-mode conditional fields', () => {
    it('CREDIT_NOTE (default): shows the credit-posting info alert, no reference field, Finalize enabled', () => {
      renderPage();
      expect(
        screen.getByText(/posted as a credit entry against the supplier/i)
      ).toBeInTheDocument();
      expect(screen.queryByLabelText(/UPI transaction \/ UTR number/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Receipt \/ voucher note/i)).not.toBeInTheDocument();
      expect(finalizeButton()).toBeEnabled();
    });

    it('UPI: requires a UTR reference before Finalize enables', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: 'UPI' }));

      const utrField = screen.getByLabelText(/UPI transaction \/ UTR number/i);
      expect(utrField).toBeInTheDocument();
      expect(utrField).toBeRequired();
      expect(finalizeButton()).toBeDisabled();

      fireEvent.change(utrField, { target: { value: 'UTR123' } });
      expect(finalizeButton()).toBeEnabled();

      // Whitespace-only does not count.
      fireEvent.change(utrField, { target: { value: '   ' } });
      expect(finalizeButton()).toBeDisabled();
    });

    it('CASH: the voucher note is optional — Finalize stays enabled without it', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: 'Cash' }));
      expect(screen.getByLabelText(/Receipt \/ voucher note/i)).toBeInTheDocument();
      expect(screen.queryByText(/posted as a credit entry/i)).not.toBeInTheDocument();
      expect(finalizeButton()).toBeEnabled();
    });
  });

  it('warns and blocks Finalize on PURCHASE_PRICE basis when a line has no purchase price; MRP unblocks', () => {
    const state = makeSelectionState();
    state.lines[0].batch.purchase_price_per_unit = null;
    mockLocationState = state;
    renderPage();

    expect(screen.getByText(/no attributed purchase price/i)).toBeInTheDocument();
    expect(finalizeButton()).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'MRP' }));
    expect(screen.queryByText(/no attributed purchase price/i)).not.toBeInTheDocument();
    expect(finalizeButton()).toBeEnabled();
  });

  describe('finalize submit', () => {
    it('sends only supplier/settlement choices and { batch_id, quantity } lines — never prices — plus an idempotency key', async () => {
      mockBaseQuery.mockResolvedValue({ data: submitResponse, meta: okMeta });
      renderPage();

      fireEvent.click(finalizeButton());
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Dialog Confirm'));

      await waitFor(() => expect(mockBaseQuery).toHaveBeenCalledTimes(1));
      const arg = mockBaseQuery.mock.calls[0][0] as {
        url: string;
        method: string;
        body: Record<string, unknown>;
      };
      expect(arg.url).toBe('supplier-returns/submit-return');
      expect(arg.method).toBe('POST');
      expect(arg.body).toMatchObject({
        supplier_id: 3,
        gst_treatment: 'WITH_GST',
        value_basis: 'PURCHASE_PRICE',
        settlement_mode: 'CREDIT_NOTE',
        lines: [{ batch_id: 1, quantity: 2 }],
      });
      expect(typeof arg.body.idempotency_key).toBe('string');
      expect((arg.body.idempotency_key as string).length).toBeGreaterThan(0);
      // The server recomputes all money — the client must not send any.
      const serialized = JSON.stringify(arg.body);
      expect(serialized).not.toContain('purchase_price');
      expect(serialized).not.toContain('mrp');
      expect(serialized).not.toContain('total');
    });

    it('rapid double Confirm fires exactly ONE mutation (isSubmitting guard + disabled confirm)', async () => {
      // Deferred response: stays in flight while we hammer the Confirm button.
      let resolveSubmit!: (v: unknown) => void;
      mockBaseQuery.mockImplementation(
        () => new Promise((resolve) => { resolveSubmit = resolve; }) as any
      );
      renderPage();

      fireEvent.click(finalizeButton());
      const confirm = screen.getByText('Dialog Confirm');
      fireEvent.click(confirm);

      // While in flight the dialog's confirm is flagged disabled...
      await waitFor(() =>
        expect(screen.getByTestId('confirmation-dialog')).toHaveAttribute(
          'data-confirm-disabled',
          'true'
        )
      );
      // ...and a second (mock-forced) confirm click is swallowed by the guard.
      fireEvent.click(confirm);
      fireEvent.click(confirm);

      resolveSubmit({ data: submitResponse, meta: okMeta });
      await waitFor(() => expect(screen.getByText('Purchase return submitted')).toBeInTheDocument());
      expect(mockBaseQuery).toHaveBeenCalledTimes(1);
    });

    it('shows the success view with return number, totals and the credit banner', async () => {
      mockBaseQuery.mockResolvedValue({ data: submitResponse, meta: okMeta });
      renderPage();

      fireEvent.click(finalizeButton());
      fireEvent.click(screen.getByText('Dialog Confirm'));

      await waitFor(() =>
        expect(screen.getByText('Purchase return submitted')).toBeInTheDocument()
      );
      expect(screen.getByText('SR-000042')).toBeInTheDocument();
      expect(screen.getByText(/New supplier credit balance/i)).toBeInTheDocument();
      expect(screen.getByText('Awaiting credit')).toBeInTheDocument();
    });

    it('surfaces a 409 conflict in the error snackbar and closes the dialog', async () => {
      mockBaseQuery.mockResolvedValue({
        error: {
          status: 409,
          data: { error: 'Insufficient stock for batch B1: on hand 2, requested 3' },
        },
        meta: okMeta,
      } as any);
      renderPage();

      fireEvent.click(finalizeButton());
      fireEvent.click(screen.getByText('Dialog Confirm'));

      await waitFor(() =>
        expect(
          screen.getByText('Insufficient stock for batch B1: on hand 2, requested 3')
        ).toBeInTheDocument()
      );
      expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument();
      // Still on the form — no success view.
      expect(screen.queryByText('Purchase return submitted')).not.toBeInTheDocument();
    });
  });
});
