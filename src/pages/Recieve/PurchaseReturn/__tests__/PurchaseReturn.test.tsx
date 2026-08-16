import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import PurchaseReturn from '../PurchaseReturn';
import {
  useGetReturnableBatchesQuery,
  ReturnableBatch,
} from '../../../../redux/slices/supplierReturnsApi';

const theme = createTheme();
const mockNavigate = jest.fn();

jest.mock('../../../../redux/slices/supplierReturnsApi');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Simple pass-through table mock (same pattern as OrderReceive.test.tsx):
// renders every column cell so the checkbox / qty inputs are reachable.
jest.mock('../../../../components/PharmaTable', () => ({
  ReusableTable: ({ data, columns }: any) => (
    <div data-testid="reusable-table">
      <div data-testid="table-data-count">{data?.length || 0}</div>
      <div data-testid="table-headers">
        {columns.map((col: any) => (
          <div key={col.key} data-testid={`header-${col.key}`}>
            {col.header}
          </div>
        ))}
      </div>
      {data?.map((row: any, idx: number) => (
        <div key={row.batch_id ?? idx} data-testid={`table-row-${idx}`}>
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

const makeBatch = (over: Partial<ReturnableBatch> = {}): ReturnableBatch => ({
  batch_id: 1,
  batch_number: 'B1',
  product_id: 10,
  product_name: 'Paracetamol 500',
  type: 'Tablet',
  brand_name: 'Acme',
  quantity: 5,
  receipt_qty: 10,
  pack_qty: 10,
  purchase_price_per_unit: 10,
  mrp: 5.5,
  expiry_date: '2026-08-20',
  days_until_expiry: 9,
  expiry_status: 'NEAR_EXPIRY',
  supplier_id: 3,
  supplier_name: 'SupCo',
  receipt_id: 7,
  receipt_number: 'GRN-000007',
  supplier_invoice_number: 'INV-77',
  po_number: 'PO-9',
  receipt_line_id: 12,
  ...over,
});

// Row 0: supplier A (SupCo); row 1: supplier B (OtherCo); row 2: unattributable;
// row 3: OK-status (hidden by the default "Expired & Near Expiry" filter).
const batches: ReturnableBatch[] = [
  makeBatch(),
  makeBatch({
    batch_id: 2,
    batch_number: 'B2',
    product_name: 'Ibuprofen 200',
    receipt_number: 'ELE/GRN/25-26/0042', // scheme-enabled org template — rendered verbatim

    supplier_id: 4,
    supplier_name: 'OtherCo',
    expiry_status: 'EXPIRED',
    days_until_expiry: -3,
  }),
  makeBatch({
    batch_id: 3,
    batch_number: 'B3',
    product_name: 'Orphan Syrup',
    supplier_id: null,
    supplier_name: null,
    receipt_id: null,
    receipt_number: null,
    supplier_invoice_number: null,
    po_number: null,
    receipt_line_id: null,
    receipt_qty: null,
    purchase_price_per_unit: null,
    expiry_status: 'EXPIRED',
    days_until_expiry: -10,
  }),
  makeBatch({
    batch_id: 4,
    batch_number: 'B4',
    product_name: 'Fresh Vitamin C',
    expiry_status: 'OK',
    days_until_expiry: 400,
  }),
];

const mockUseGetReturnableBatchesQuery =
  useGetReturnableBatchesQuery as jest.MockedFunction<typeof useGetReturnableBatchesQuery>;

const queryResult = (data: any, isLoading = false, error: any = null) =>
  ({ data, isLoading, error, refetch: jest.fn() } as any);

const createMockStore = () =>
  configureStore({
    reducer: {
      auth: (state = { user: { id: 1, username: 'testuser' } }) => state,
    },
  });

const renderPage = () =>
  render(
    <Provider store={createMockStore()}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <PurchaseReturn />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );

const rowCheckbox = (idx: number) =>
  within(screen.getByTestId(`cell-select-${idx}`)).getByRole('checkbox') as HTMLInputElement;
const rowQtyInput = (idx: number) =>
  within(screen.getByTestId(`cell-return_qty-${idx}`)).getByRole('spinbutton') as HTMLInputElement;
const returnButton = () => screen.getByRole('button', { name: /^return$/i });

describe('PurchaseReturn (landing)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetReturnableBatchesQuery.mockReturnValue(queryResult({ batches }));
  });

  describe('rendering & expiry filter', () => {
    it('renders the returnable batches with supplier attribution', () => {
      renderPage();
      expect(screen.getByText('Purchase Return')).toBeInTheDocument();
      expect(screen.getByText('Paracetamol 500')).toBeInTheDocument();
      expect(screen.getByText('Ibuprofen 200')).toBeInTheDocument();
      expect(screen.getByText('SupCo')).toBeInTheDocument();
      expect(screen.getByText('OtherCo')).toBeInTheDocument();
      // Unattributable row renders with the Unattributed placeholder.
      expect(screen.getByText('Orphan Syrup')).toBeInTheDocument();
      expect(screen.getByText('Unattributed')).toBeInTheDocument();
    });

    it('defaults the expiry filter to "Expired & Near Expiry", hiding OK batches', () => {
      renderPage();
      // The default option label is displayed in the expiry Select.
      expect(screen.getByText('Expired & Near Expiry')).toBeInTheDocument();
      // OK batch is filtered out by default; the three attention batches show.
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('3');
      expect(screen.queryByText('Fresh Vitamin C')).not.toBeInTheDocument();
    });

    it('shows OK batches after switching the expiry filter to All', () => {
      renderPage();
      const expirySelect = screen.getByText('Expired & Near Expiry');
      fireEvent.mouseDown(expirySelect);
      const listbox = within(screen.getByRole('listbox'));
      fireEvent.click(listbox.getByText('All'));

      expect(screen.getByTestId('table-data-count')).toHaveTextContent('4');
      expect(screen.getByText('Fresh Vitamin C')).toBeInTheDocument();
    });

    it('renders the renamed / new column headers', () => {
      renderPage();
      const headers = within(screen.getByTestId('table-headers'));
      expect(headers.getByText('Invoice Number')).toBeInTheDocument();
      expect(headers.getByText('Purchase Price')).toBeInTheDocument();
      expect(headers.getByText('Qty on Hand')).toBeInTheDocument();
      expect(headers.getByText('Receipt Qty')).toBeInTheDocument();
    });

    it('shows invoice number with the server receipt (GRN) number as subtext, not a rebuilt RA key', () => {
      renderPage();
      const receiptCell = within(screen.getByTestId('cell-receipt-0'));
      expect(receiptCell.getByText('INV-77')).toBeInTheDocument();
      expect(receiptCell.getByText('GRN-000007')).toBeInTheDocument();
      expect(receiptCell.queryByText('RA7')).not.toBeInTheDocument();
      expect(receiptCell.queryByText('PO-9')).not.toBeInTheDocument();
    });

    it('renders a scheme-templated receipt number verbatim', () => {
      renderPage();
      expect(
        within(screen.getByTestId('cell-receipt-1')).getByText('ELE/GRN/25-26/0042'),
      ).toBeInTheDocument();
    });

    it('omits the receipt number subtext on an unattributable batch', () => {
      renderPage();
      // Row 2 is unattributable: receipt_number null → invoice em dash only, no subtext.
      const receiptCell = within(screen.getByTestId('cell-receipt-2'));
      expect(receiptCell.getByText('—')).toBeInTheDocument();
      expect(receiptCell.queryByText(/GRN/)).not.toBeInTheDocument();
      expect(receiptCell.queryByText(/^RA/)).not.toBeInTheDocument();
    });

    it('renders receipt qty, with an em dash when null', () => {
      renderPage();
      expect(within(screen.getByTestId('cell-receipt_qty-0')).getByText('10')).toBeInTheDocument();
      // Unattributable row (index 2) has receipt_qty null.
      expect(within(screen.getByTestId('cell-receipt_qty-2')).getByText('—')).toBeInTheDocument();
    });

    it('shows the loading state', () => {
      mockUseGetReturnableBatchesQuery.mockReturnValue(queryResult(undefined, true));
      renderPage();
      expect(screen.getByText(/Loading returnable batches/i)).toBeInTheDocument();
    });

    it('shows the error state with a Retry that refetches', () => {
      const refetch = jest.fn();
      mockUseGetReturnableBatchesQuery.mockReturnValue({
        ...queryResult(undefined, false, { status: 500, data: { error: 'Server error' } }),
        refetch,
      });
      renderPage();
      // extractErrorMessage surfaces the API error body.
      expect(screen.getByText('Server error')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Retry'));
      expect(refetch).toHaveBeenCalled();
    });
  });

  describe('supplier filter', () => {
    const supplierInput = () =>
      screen.getByPlaceholderText('All suppliers') as HTMLInputElement;

    const pickSupplier = (label: string) => {
      fireEvent.mouseDown(supplierInput());
      fireEvent.click(within(screen.getByRole('listbox')).getByText(label));
    };

    it('filters rows to the chosen supplier', () => {
      renderPage();
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('3');

      pickSupplier('SupCo');
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('1');
      expect(screen.getByText('Paracetamol 500')).toBeInTheDocument();
      expect(screen.queryByText('Ibuprofen 200')).not.toBeInTheDocument();
      expect(screen.queryByText('Orphan Syrup')).not.toBeInTheDocument();
    });

    it('is clearable, restoring all rows', () => {
      renderPage();
      pickSupplier('OtherCo');
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('1');

      fireEvent.click(screen.getByLabelText('Clear'));
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('3');
    });
  });

  describe('supplier lock & unattributable rows', () => {
    it('always disables unattributable (null-supplier) rows', () => {
      renderPage();
      expect(rowCheckbox(2)).toBeDisabled(); // Orphan Syrup
      // Attributed rows start enabled.
      expect(rowCheckbox(0)).toBeEnabled();
      expect(rowCheckbox(1)).toBeEnabled();
    });

    it("selecting a row locks the supplier and disables other suppliers' rows", () => {
      renderPage();
      fireEvent.click(rowCheckbox(0)); // SupCo row

      // Lock banner names the supplier.
      expect(screen.getByText('SupCo', { selector: 'strong' })).toBeInTheDocument();
      expect(screen.getByText(/lines from other suppliers are locked/i)).toBeInTheDocument();

      expect(rowCheckbox(1)).toBeDisabled(); // OtherCo locked out
      expect(rowCheckbox(2)).toBeDisabled(); // unattributable stays disabled
      expect(rowCheckbox(0)).toBeEnabled(); // same-supplier row still selectable
    });

    it('Clear selection releases the supplier lock', () => {
      renderPage();
      fireEvent.click(rowCheckbox(0));
      expect(rowCheckbox(1)).toBeDisabled();

      fireEvent.click(screen.getByText('Clear selection'));
      expect(rowCheckbox(1)).toBeEnabled();
      expect(screen.queryByText(/lines from other suppliers are locked/i)).not.toBeInTheDocument();
    });
  });

  describe('quantity clamp & Return button enablement', () => {
    it('Return button starts disabled and enables once a valid line is selected', () => {
      renderPage();
      expect(returnButton()).toBeDisabled();

      fireEvent.click(rowCheckbox(0)); // qty defaults to '1'
      expect(returnButton()).toBeEnabled();
      expect(screen.getByText('1 line · 1 unit selected')).toBeInTheDocument();
    });

    it('flags a quantity above stock on hand as an error and disables Return', () => {
      renderPage();
      fireEvent.click(rowCheckbox(0)); // stock on hand is 5
      fireEvent.change(rowQtyInput(0), { target: { value: '99' } });

      expect(screen.getByText('Enter 1 to stock on hand')).toBeInTheDocument();
      expect(returnButton()).toBeDisabled();
    });

    it('flags zero / non-integer quantities as errors', () => {
      renderPage();
      fireEvent.click(rowCheckbox(0));

      fireEvent.change(rowQtyInput(0), { target: { value: '0' } });
      expect(screen.getByText('Enter 1 to stock on hand')).toBeInTheDocument();
      expect(returnButton()).toBeDisabled();

      fireEvent.change(rowQtyInput(0), { target: { value: '1.5' } });
      expect(screen.getByText('Enter 1 to stock on hand')).toBeInTheDocument();
      expect(returnButton()).toBeDisabled();
    });

    it('recovers when the quantity is corrected back into range', () => {
      renderPage();
      fireEvent.click(rowCheckbox(0));
      fireEvent.change(rowQtyInput(0), { target: { value: '99' } });
      expect(returnButton()).toBeDisabled();

      fireEvent.change(rowQtyInput(0), { target: { value: '5' } }); // = stock on hand
      expect(screen.queryByText('Enter 1 to stock on hand')).not.toBeInTheDocument();
      expect(returnButton()).toBeEnabled();
      expect(screen.getByText('1 line · 5 units selected')).toBeInTheDocument();
    });

    it('navigates to the details page with the locked supplier and valid lines', () => {
      renderPage();
      fireEvent.click(rowCheckbox(0));
      fireEvent.change(rowQtyInput(0), { target: { value: '2' } });
      fireEvent.click(returnButton());

      expect(mockNavigate).toHaveBeenCalledWith('/receive/purchase-return/details', {
        state: {
          supplier: { id: 3, name: 'SupCo' },
          lines: [{ batch: batches[0], quantity: 2 }],
        },
      });
    });

    it('does not navigate while any selected line is invalid', () => {
      renderPage();
      fireEvent.click(rowCheckbox(0));
      fireEvent.change(rowQtyInput(0), { target: { value: '99' } });
      expect(returnButton()).toBeDisabled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('navigates to the Returns Log', () => {
    renderPage();
    fireEvent.click(screen.getByText('Returns Log'));
    expect(mockNavigate).toHaveBeenCalledWith('/receive/purchase-return/log');
  });
});
