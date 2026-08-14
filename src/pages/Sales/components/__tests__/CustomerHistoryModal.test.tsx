import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CustomerHistoryModal from '../CustomerHistoryModal';
import { CUSTOMER_HISTORY_LABELS } from '../../../../config/label/CustomerHistory.labels';
import * as salesApi from '../../../../redux/slices/salesApi';

/**
 * CustomerHistoryModal renders a customer's invoice list (customer-scoped
 * get-customer-invoices), derives the "last purchase" line from the newest row
 * (list arrives invoice_date DESC), shows an empty state when there are no
 * invoices, and — on row click — drills into a single invoice via the
 * get-invoice-details mutation.
 *
 * The salesApi slice is auto-mocked and the two hooks the modal consumes
 * (useGetCustomerInvoicesQuery / useGetInvoiceDetailsMutation) are overridden per
 * test, mirroring SaleHistory.test.tsx. PrintPreviewModal (only mounted for the
 * detail drill-down) is stubbed so the drill-down assertion stays focused on the
 * mutation, not the receipt renderer.
 */

jest.mock('../../../../redux/slices/salesApi');

jest.mock('../../../../components/Modal/PrintPreview/PrintPreviewModal', () => ({
  __esModule: true,
  default: () => <div data-testid="print-preview" />,
}));

// Org context drives the (optional) receipt letterhead; the modal reads it
// defensively, but wire a realistic org so schemeEnabled/orgHeader are exercised.
const TEST_ORG = {
  id: 1,
  name: 'Test Pharmacy',
  legal_name: 'Testco Pvt Ltd',
  address: '1 Test Street',
  dl_numbers: 'DL-1',
  gstin: 'GSTIN123',
  phone: '000-111',
  logo_url: null,
  invoice_number_enabled: false,
  invoice_number_template: null,
  invoice_number_reset: 'none',
  invoice_seq_start: null,
};

const createStore = () =>
  configureStore({
    reducer: {
      org: (state = { organization: TEST_ORG, activeModules: ['pharmacy'], loaded: true }) => state,
    },
  });

// Raw rows exactly as get-customer-invoices returns them: newest-first,
// total_amount as a whole-rupee STRING.
const INVOICE_ROWS = [
  {
    invoice_id: 9,
    invoice_number: '946',
    invoice_date: '2026-08-10',
    total_amount: '250',
    total_returned_amount: '0',
    return_status: 'No Return',
  },
  {
    invoice_id: 4,
    invoice_number: '945',
    invoice_date: '2026-08-01',
    total_amount: '100',
    total_returned_amount: '0',
    return_status: 'No Return',
  },
];

// Captured per-test so the drill-down assertion can inspect the mutation call.
let detailsTrigger: jest.Mock;
let detailsUnwrap: jest.Mock;

const mockCustomerInvoices = (
  override: Partial<{
    data: unknown;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
  }> = {}
) => {
  (salesApi.useGetCustomerInvoicesQuery as jest.Mock) = jest.fn(() => ({
    data: INVOICE_ROWS,
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: jest.fn(),
    ...override,
  }));
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCustomerInvoices();

  detailsUnwrap = jest.fn().mockResolvedValue({ invoice: {}, lines: [], payments: [] });
  detailsTrigger = jest.fn(() => ({ unwrap: detailsUnwrap }));
  (salesApi.useGetInvoiceDetailsMutation as jest.Mock) = jest.fn(() => [detailsTrigger, {}]);
});

const renderModal = (
  props: Partial<React.ComponentProps<typeof CustomerHistoryModal>> = {}
) =>
  render(
    <Provider store={createStore()}>
      <CustomerHistoryModal
        open
        onClose={jest.fn()}
        customerId={5}
        customerName="John Doe"
        {...props}
      />
    </Provider>
  );

describe('CustomerHistoryModal', () => {
  it("renders the customer's invoices from the mocked slice data", () => {
    renderModal();

    // Both invoice rows are present (dates + net amounts render).
    expect(screen.getByText('01 Aug 2026')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    // The customer name rides the modal title.
    expect(
      screen.getByText(`${CUSTOMER_HISTORY_LABELS.TITLE} — John Doe`)
    ).toBeInTheDocument();
  });

  it('shows the derived "last purchase" line from the newest row', () => {
    renderModal();

    expect(screen.getByText(`${CUSTOMER_HISTORY_LABELS.LAST_PURCHASE}:`)).toBeInTheDocument();
    // Newest row is invoice_date 2026-08-10 -> "10 Aug 2026". It appears both on
    // the last-purchase line and as the first row's date cell.
    expect(screen.getAllByText('10 Aug 2026').length).toBeGreaterThanOrEqual(2);
  });

  it('renders the empty state (and a no-purchases last-purchase line) when there are no invoices', () => {
    mockCustomerInvoices({ data: [] });
    renderModal();

    expect(screen.getByText(CUSTOMER_HISTORY_LABELS.EMPTY)).toBeInTheDocument();
    expect(screen.getByText(CUSTOMER_HISTORY_LABELS.NO_LAST_PURCHASE)).toBeInTheDocument();
  });

  it('fires the invoice-details drill-down mutation with the row invoice id on row click', async () => {
    renderModal();

    // Click a cell in the second row (invoice_id 4) — the click bubbles to the
    // TableRow onClick, which calls the get-invoice-details mutation.
    fireEvent.click(screen.getByText('01 Aug 2026'));

    await waitFor(() => {
      expect(detailsTrigger).toHaveBeenCalledWith({ invoice_id: 4 });
    });
    // The detail preview opens once the mutation resolves.
    await waitFor(() => {
      expect(screen.getByTestId('print-preview')).toBeInTheDocument();
    });
  });
});
