import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import SalesReceipt from '../SalesReceipt';
import cartReducer from '../../../redux/slices/cartSlice';
import * as salesApi from '../../../redux/slices/salesApi';
import * as receiveApi from '../../../redux/slices/receiveApi';

// Bug 2026-09-07 (prod SI-EL-26-002535/002536): opening a DELETED sale showed
// "Cash" although it was paid by UPI. deleteInvoice voids every linked payment,
// the page dropped every voided row, and the empty list fell back to the default
// payment mode. For a deleted invoice the voided rows ARE the original payments
// and must drive the displayed method. Active invoices keep dropping voided rows.

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

jest.mock('../../../redux/slices/orgApi', () => ({
  orgApi: { util: { invalidateTags: () => ({ type: 'orgApi/invalidateTags' }) } },
  useGetNextDocumentNumberQuery: () => ({ data: undefined, isFetching: false }),
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

const organization = {
  id: 1,
  name: 'EleMed',
  slug: 'elemed',
  logo_url: null,
  legal_name: null,
  address: null,
  dl_numbers: null,
  gstin: null,
  phone: null,
  invoice_number_enabled: true,
  invoice_number_template: null,
  invoice_number_reset: 'none' as const,
  invoice_seq_start: null,
};

const createStore = () =>
  configureStore({
    reducer: {
      auth: (state = { user: { id: 1, username: 'testuser' } }) => state,
      org: (state = { organization, activeModules: ['pharmacy'], loaded: true }) => state,
      cart: cartReducer,
    },
  });

const renderReceipt = () =>
  render(
    <Provider store={createStore()}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <SalesReceipt />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );

// The payment-mode Autocomplete has no label; its placeholder is the default mode.
const paymentModeField = () => screen.getByPlaceholderText('Cash') as HTMLInputElement;

const voidedUpi = {
  id: 2116,
  related_invoice_id: 1803,
  payment_type: 'INVOICE',
  direction: 'IN',
  payment_method: 'UPI',
  payment_amount: 1788,
  status: 'VOID',
  payment_status: 'Voided',
  transaction_number: 'INV-1803-1787982777160',
};

describe('SalesReceipt — payment mode of a deleted sale', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationState = { isEditMode: true, invoiceId: 1803, invoiceNumber: 'SI-EL-26-002536' };
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
    (receiveApi.useGetProductsQuery as jest.Mock) = jest.fn(() => ({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    }));
  });

  it('shows the original (voided) payment method for a DELETED sale', async () => {
    (salesApi.useGetInvoiceDetailsMutation as jest.Mock) = makeMutation({
      invoice: {
        id: 1803,
        invoice_number: 'SI-EL-26-002536',
        invoice_date: '2026-08-29',
        record_status: 'DELETED',
        deleted_at: '2026-08-29T06:04:00.153Z',
      },
      lines: [],
      payments: [voidedUpi],
    });

    renderReceipt();

    await waitFor(() => expect(paymentModeField()).toHaveValue('UPI'));
  });

  it('still ignores voided rows on an ACTIVE sale (the live payment wins)', async () => {
    (salesApi.useGetInvoiceDetailsMutation as jest.Mock) = makeMutation({
      invoice: {
        id: 1803,
        invoice_number: 'SI-EL-26-002536',
        invoice_date: '2026-08-29',
        record_status: 'ACTIVE',
        deleted_at: null,
      },
      lines: [],
      payments: [
        voidedUpi,
        { ...voidedUpi, id: 2117, payment_method: 'CREDIT CARD', status: 'ACTIVE', payment_status: 'Paid' },
      ],
    });

    renderReceipt();

    await waitFor(() => expect(paymentModeField()).toHaveValue('Credit Card'));
  });
});
