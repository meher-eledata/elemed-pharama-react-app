import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import SalesReceipt from '../SalesReceipt';
import cartReducer from '../../../redux/slices/cartSlice';
import * as salesApi from '../../../redux/slices/salesApi';
import * as receiveApi from '../../../redux/slices/receiveApi';
import { getTodayDate } from '../SalesReceipt.utils';

// Issue 1: a NEW sale used to show an empty invoice-number box (the "Auto-generated"
// placeholder was force-hidden by MUI). The page now peeks the next number from
// GET /api/org/document-numbering/next and shows it as PROVISIONAL — never in edit mode,
// where the persisted number is authoritative.

const theme = createTheme();

const makeMutation = (resolved: any = { data: {} }) =>
  jest.fn(() => [
    jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue(resolved) })),
    { isLoading: false },
  ]);

let mockLocationState: any = null;
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/sales/receipt', state: mockLocationState }),
}));

const mockPeek = jest.fn();
const mockInvalidateTags = jest.fn(() => ({ type: 'orgApi/invalidateTags' }));
jest.mock('../../../redux/slices/orgApi', () => ({
  orgApi: { util: { invalidateTags: (...args: any[]) => mockInvalidateTags(...(args as [])) } },
  useGetNextDocumentNumberQuery: (...args: any[]) => mockPeek(...args),
}));

jest.mock('../../../redux/slices/salesApi');
jest.mock('../../../redux/slices/receiveApi');
jest.mock('../../../utils/cartStorage', () => ({
  clearCartFromStorage: jest.fn(),
  clearFormDataFromStorage: jest.fn(),
  getCartFromStorage: jest.fn(() => ({ items: [], total: 0 })),
  getFormDataFromStorage: jest.fn(() => null),
  setEditInvoiceId: jest.fn(),
  saveSalesHistoryToStorage: jest.fn(),
}));

const organization = (invoice_number_enabled: boolean) => ({
  id: 1,
  name: 'EleMed',
  slug: 'elemed',
  logo_url: null,
  legal_name: null,
  address: null,
  dl_numbers: null,
  gstin: null,
  phone: null,
  invoice_number_enabled,
  invoice_number_template: null,
  invoice_number_reset: 'none' as const,
  invoice_seq_start: null,
});

const createStore = (org: any) =>
  configureStore({
    reducer: {
      auth: (state = { user: { id: 1, username: 'testuser' } }) => state,
      org: (state = { organization: org, activeModules: ['pharmacy'], loaded: true }) => state,
      cart: cartReducer,
    },
  });

const renderReceipt = (org: any = organization(true)) =>
  render(
    <Provider store={createStore(org)}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <SalesReceipt />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );

const peekResult = (number: string, enabled = true) => ({
  data: { doc_type: 'sales_invoice', number, period_key: enabled ? 2026 : 0, enabled },
  isFetching: false,
});

const invoiceNumberField = () => screen.getByLabelText(/sale number/i);
const PROVISIONAL = 'Provisional until saved';

describe('SalesReceipt — provisional invoice number', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationState = null;
    mockPeek.mockReturnValue({ data: undefined, isFetching: false });

    (salesApi.useGetDoctorNamesQuery as jest.Mock) = jest.fn(() => ({ data: [], isLoading: false }));
    (salesApi.useGetAllCustomerNamesQuery as jest.Mock) = jest.fn(() => ({ data: [], refetch: jest.fn() }));
    (salesApi.useGetCustomerOptionsQuery as jest.Mock) = jest.fn(() => ({ data: [], isLoading: false }));
    (salesApi.useSubmitSaleMutation as jest.Mock) = makeMutation();
    (salesApi.useAddCustomerMutation as jest.Mock) = makeMutation();
    (salesApi.useGetCustomerPhonesMutation as jest.Mock) = makeMutation();
    (salesApi.useGetDoctorPhonesAndEmailsMutation as jest.Mock) = makeMutation();
    (salesApi.useUpdateSalesMutation as jest.Mock) = makeMutation();
    (salesApi.useEditSaleMutation as jest.Mock) = makeMutation();
    (salesApi.useDeleteSalesMutation as jest.Mock) = makeMutation();
    (salesApi.useUpsertInvoicePaymentsMutation as jest.Mock) = makeMutation();
    (salesApi.useDeleteInvoiceMutation as jest.Mock) = makeMutation();
    (salesApi.useGetInvoiceDetailsMutation as jest.Mock) = makeMutation({});
    (receiveApi.useGetProductsQuery as jest.Mock) = jest.fn(() => ({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    }));
  });

  it('peeks the next number for today and shows it as provisional', () => {
    mockPeek.mockReturnValue(peekResult('SI-EL-26-000001'));

    renderReceipt();

    expect(mockPeek).toHaveBeenCalledWith(
      { doc_type: 'sales_invoice', date: getTodayDate() },
      // refetchOnMountOrArgChange: the contract says re-fetch on page open — returning to
      // the new-sale page within RTK Query's 60s cache must not quote a stale number.
      { skip: false, refetchOnMountOrArgChange: true }
    );
    expect(invoiceNumberField()).toHaveValue('SI-EL-26-000001');
    expect(screen.getByText(PROVISIONAL)).toBeInTheDocument();
  });

  it('re-queries with the new date when the invoice date changes', async () => {
    mockPeek.mockReturnValue(peekResult('SI-EL-26-000001'));

    renderReceipt();
    mockPeek.mockClear();

    // Open the invoice-date calendar and pick the 15th of the shown month.
    fireEvent.click(screen.getByRole('button', { name: /choose date/i }));
    fireEvent.click(await screen.findByRole('gridcell', { name: '15' }));

    await waitFor(() => {
      const dates = mockPeek.mock.calls.map((c) => c[0].date);
      expect(dates.some((d: string) => /^\d{4}-\d{2}-15$/.test(d))).toBe(true);
    });
    // Every call stays skip:false and on the sales_invoice series.
    mockPeek.mock.calls.forEach((c) => {
      expect(c[0].doc_type).toBe('sales_invoice');
      expect(c[1]).toEqual({ skip: false, refetchOnMountOrArgChange: true });
    });
  });

  it('shows a pending value (never an empty box or a stale number) while the peek is in flight', () => {
    mockPeek.mockReturnValue({ data: undefined, isFetching: true });

    renderReceipt();

    expect(invoiceNumberField()).toHaveValue('Generating…');
    expect(screen.getByText(PROVISIONAL)).toBeInTheDocument();
  });

  it('degrades to visible "Auto-generated" text when the peek fails', () => {
    mockPeek.mockReturnValue({ data: undefined, isFetching: false, isError: true });

    renderReceipt();

    expect(invoiceNumberField()).toHaveValue('Auto-generated');
    expect(screen.getByText(PROVISIONAL)).toBeInTheDocument();
  });

  it('decorates a bare number exactly like the saved sale does when the scheme is off', () => {
    // Scheme disabled → the server peeks "401" and the Sales Log will show "INV401".
    mockPeek.mockReturnValue(peekResult('401', false));

    renderReceipt(organization(false));

    expect(invoiceNumberField()).toHaveValue('INV401');
  });

  it("trusts the peek's own enabled flag over the legacy org-level field", () => {
    // The peek carries the per-doc-type truth; the stale org flag must not suppress
    // the legacy INV decoration.
    mockPeek.mockReturnValue(peekResult('401', false));

    renderReceipt(organization(true));

    expect(invoiceNumberField()).toHaveValue('INV401');
  });

  it('never peeks in edit mode and shows the persisted number', async () => {
    mockLocationState = { isEditMode: true, invoiceId: 42, invoiceNumber: 'SI-EL-26-000042' };
    (salesApi.useGetInvoiceDetailsMutation as jest.Mock) = makeMutation({
      invoice: {
        invoice_number: 'SI-EL-26-000042',
        invoice_date: '2026-08-01',
        payment_mode: 'CASH',
      },
      lines: [],
      payments: [],
    });

    renderReceipt();

    await waitFor(() => expect(invoiceNumberField()).toHaveValue('SI-EL-26-000042'));
    expect(screen.queryByText(PROVISIONAL)).not.toBeInTheDocument();
    // The hook still runs (rules of hooks) but is always skipped.
    expect(mockPeek).toHaveBeenCalled();
    mockPeek.mock.calls.forEach((c) =>
      expect(c[1]).toEqual({ skip: true, refetchOnMountOrArgChange: true })
    );
  });
});
