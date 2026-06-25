import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import SaleReturn from '../SaleReturn';
import * as salesApi from '../../../redux/slices/salesApi';

const theme = createTheme();

// Location state the page reads to know which invoice it is returning.
const invoiceState = {
  invoiceId: 7896,
  invoiceNumber: 'INV7896',
  invoiceDate: '2026-01-10',
  customerName: 'John Doe',
  customerMobile: '5551231000',
  doctorName: 'Dr. Smith',
  username: 'testuser',
  totalAmount: 1000,
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/sales/sale-return', state: invoiceState }),
}));

jest.mock('../../../redux/slices/salesApi');

const createMockStore = () =>
  configureStore({
    reducer: {
      auth: (state = { user: { id: 1, username: 'testuser' } }) => state,
    },
  });

// Wire the auto-mocked salesApi hooks. getInvoiceDetails is a mutation
// returning [trigger, state]; the trigger's unwrap resolves the invoice lines.
const wireApi = (lines: unknown[]) => {
  const trigger = jest.fn(() => ({
    unwrap: jest.fn().mockResolvedValue({
      invoice: { id: 7896, invoice_number: '7896' },
      lines,
      items: lines,
      payments: [],
    }),
  }));
  (salesApi.useGetInvoiceDetailsMutation as jest.Mock) = jest.fn(() => [
    trigger,
    { isLoading: false },
  ]);
  (salesApi.useSubmitSalesReturnMutation as jest.Mock) = jest.fn(() => [
    jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue({ message: 'ok' }) })),
    { isLoading: false },
  ]);
};

const renderPage = () =>
  render(
    <Provider store={createMockStore()}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <SaleReturn />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );

describe('SaleReturn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing on a legacy/inconsistent line (null rate/discount/selling_price)', async () => {
    // A line with required invoice_line_id but null/undefined numeric fields —
    // the kind of legacy data that previously threw at render (ErrorBoundary).
    wireApi([
      {
        invoice_line_id: 11,
        product_id: 5,
        product_name: 'Legacy Product',
        batch_number: 'B1',
        quantity: 2,
        rate: null,
        selling_price: null,
        discount: null,
        returned_quantity: null,
      },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Legacy Product/i)).toBeInTheDocument();
    });
    // No ErrorBoundary fallback rendered.
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  it('skips lines missing a required invoice_line_id without crashing', async () => {
    wireApi([
      { product_name: 'Orphan Line', quantity: 1 }, // no invoice_line_id -> filtered out
      { invoice_line_id: 22, product_name: 'Valid Product', quantity: 1, rate: '10' },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Valid Product/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Orphan Line/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  it('warns in the confirmation dialog that the invoice becomes uneditable', async () => {
    wireApi([
      {
        invoice_line_id: 33,
        product_name: 'Returnable Product',
        batch_number: 'B2',
        quantity: 3,
        rate: '10',
        selling_price: '10',
        discount: '0',
        refundable_quantity: 3,
      },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Returnable Product/i)).toBeInTheDocument();
    });

    // Select all rows so the Return button enables, then open the dialog.
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBeGreaterThan(0);
    fireEvent.click(checkboxes[0]); // header "select all"

    const returnButton = await screen.findByRole('button', { name: /^return$/i });
    await waitFor(() => expect(returnButton).not.toBeDisabled());
    fireEvent.click(returnButton);

    await waitFor(() => {
      expect(
        screen.getByText(/this invoice can no longer be edited/i)
      ).toBeInTheDocument();
    });
  });
});
