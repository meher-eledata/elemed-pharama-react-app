import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import InventoryAdjustment from '../InventoryAdjustment';
import {
  useGetBatchesForProductMutation,
  useGetBrandsFromProductNameMutation,
  useGetTypesForBrandAndProductMutation,
  useAdjustInventoryBatchesMutation,
  useDeleteBatchMutation,
} from '../../../redux/slices/inventoryApi';
import { useGetProductsQuery } from '../../../redux/slices/receiveApi';

const theme = createTheme();

jest.mock('../../../redux/slices/inventoryApi');
jest.mock('../../../redux/slices/receiveApi');

// Mock the table so each column's render(row) is invoked, exposing the action buttons/cells.
jest.mock('../../../components/PharmaTable', () => ({
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

// Mock the confirmation dialog (also used for the blocked-message modal) so we can read
// title/message and trigger confirm.
jest.mock('../../../components/DeleteDialogue/ConfirmationDialog', () => ({
  __esModule: true,
  default: ({ open, onClose, onConfirm, title, message, confirmLabel }: any) =>
    open ? (
      <div data-testid={`dialog-${title}`}>
        <div>{title}</div>
        <div data-testid="dialog-message">{message}</div>
        <button onClick={onClose}>dialog-close</button>
        <button onClick={onConfirm}>{confirmLabel || 'Yes'}</button>
      </div>
    ) : null,
}));

const mockProductInfo = {
  product_id: 42,
  product_name: 'Amoxicillin',
  type: 'Capsule',
  brand_id: '1',
  brand_name: 'BrandA',
  hsn_id: 'HSN1',
  total_quantity: 100,
};

// Two rows share the SAME batch_number ('AMX-DUP') but have DISTINCT batch_ids — the bug fix must
// delete only the targeted batch_id, not every row with that batch_number.
const mockBatches = [
  { batch_id: 101, batch_number: 'AMX-DUP', current_qty: 50, expiry_date: '2027-01-01', mrp: 10, pack_qty: 1 },
  { batch_id: 102, batch_number: 'AMX-DUP', current_qty: 50, expiry_date: '2027-02-01', mrp: 12, pack_qty: 1 },
];

const createMockStore = () =>
  configureStore({ reducer: { auth: (state = { user: { username: 'admin' } }) => state } });

const renderWithProviders = (component: React.ReactElement) =>
  render(
    <Provider store={createMockStore()}>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </Provider>
  );

const mockGetBatches = useGetBatchesForProductMutation as jest.MockedFunction<typeof useGetBatchesForProductMutation>;
const mockGetBrandsFromProductName = useGetBrandsFromProductNameMutation as jest.MockedFunction<typeof useGetBrandsFromProductNameMutation>;
const mockGetTypes = useGetTypesForBrandAndProductMutation as jest.MockedFunction<typeof useGetTypesForBrandAndProductMutation>;
const mockAdjust = useAdjustInventoryBatchesMutation as jest.MockedFunction<typeof useAdjustInventoryBatchesMutation>;
const mockDeleteBatch = useDeleteBatchMutation as jest.MockedFunction<typeof useDeleteBatchMutation>;
const mockGetProducts = useGetProductsQuery as jest.MockedFunction<typeof useGetProductsQuery>;

let getBatchesTrigger: jest.Mock;
let deleteBatchTrigger: jest.Mock;
let adjustTrigger: jest.Mock;

const queryResult = (data: any) => ({
  data,
  isLoading: false,
  error: null,
  refetch: jest.fn(),
  isFetching: false,
  isSuccess: true,
  isError: false,
  isUninitialized: false,
} as any);

beforeEach(() => {
  jest.clearAllMocks();

  getBatchesTrigger = jest
    .fn()
    .mockReturnValue({ unwrap: () => Promise.resolve({ product: mockProductInfo, batches: mockBatches }) });
  deleteBatchTrigger = jest.fn().mockReturnValue({ unwrap: () => Promise.resolve({ message: 'Batch deleted' }) });
  adjustTrigger = jest.fn().mockReturnValue({ unwrap: () => Promise.resolve({ message: 'ok' }) });

  mockGetBatches.mockReturnValue([getBatchesTrigger, { isLoading: false } as any] as any);
  // Single brand for the medicine → auto-selects → fetches types.
  mockGetBrandsFromProductName.mockReturnValue([
    jest.fn().mockReturnValue({ unwrap: () => Promise.resolve([{ id: 1, brand_name: 'BrandA' }]) }),
    {} as any,
  ] as any);
  // Single type → auto-selects → fetches batches.
  mockGetTypes.mockReturnValue([
    jest.fn().mockReturnValue({ unwrap: () => Promise.resolve([{ type: 'Capsule', product_id: 42 }]) }),
    {} as any,
  ] as any);
  mockAdjust.mockReturnValue([adjustTrigger, { isLoading: false } as any] as any);
  // Register the deleteBatch hook to avoid the lazy-tuple-destructuring crash.
  mockDeleteBatch.mockReturnValue([deleteBatchTrigger, { isLoading: false } as any] as any);
  // Medicine-name options come from the receiveApi get-products query (same source as Sales).
  mockGetProducts.mockReturnValue(queryResult([{ name: 'Amoxicillin', id: 42, currentQuantity: 100 }]));
});

// Select a medicine name → brand + type auto-select → batches load into the table.
const loadBatches = async () => {
  renderWithProviders(<InventoryAdjustment />);
  const input = screen.getByPlaceholderText('Select Medicine');
  input.focus();
  fireEvent.change(input, { target: { value: 'Amoxicillin' } });
  const option = await screen.findByRole('option', { name: 'Amoxicillin' });
  fireEvent.click(option);
  await waitFor(() => expect(screen.getByTestId('table-row-0')).toBeInTheDocument());
};

describe('InventoryAdjustment - product lookup order', () => {
  it('renders the medicine → brand → type cascade and no Product ID search', () => {
    renderWithProviders(<InventoryAdjustment />);
    expect(screen.getByPlaceholderText('Select Medicine')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Select Brand')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Select Type')).toBeInTheDocument();
    // The legacy "Search by Product ID" flow is gone.
    expect(screen.queryByLabelText('Search by Product ID')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Select Product ID')).not.toBeInTheDocument();
  });

  it('loads batches via medicine → brand → type cascade', async () => {
    await loadBatches();
    expect(getBatchesTrigger).toHaveBeenCalledWith({ product_id: 42 });
    expect(screen.getByTestId('table-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('table-row-1')).toBeInTheDocument();
  });
});

describe('InventoryAdjustment - batch deletion', () => {
  it('marks a row for deletion instead of removing it when trash is clicked', async () => {
    await loadBatches();

    // Two rows present.
    expect(screen.getByTestId('table-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('table-row-1')).toBeInTheDocument();

    fireEvent.click(screen.getAllByAltText('Delete')[0]);

    // Row still present, now showing the will-be-deleted indicator + undo affordance.
    expect(screen.getByTestId('table-row-0')).toBeInTheDocument();
    expect(screen.getByText('Will be deleted')).toBeInTheDocument();
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });

  it('undoes a marked deletion when Undo is clicked', async () => {
    await loadBatches();
    fireEvent.click(screen.getAllByAltText('Delete')[0]);
    expect(screen.getByText('Will be deleted')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Undo'));
    expect(screen.queryByText('Will be deleted')).not.toBeInTheDocument();
  });

  it('deletes only the targeted batch_id when two rows share a batch_number', async () => {
    await loadBatches();

    // Both rows display the SAME batch_number but are distinct rows (distinct batch_id).
    expect(screen.getByTestId('table-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('table-row-1')).toBeInTheDocument();

    // Mark ONLY the first duplicate row for deletion.
    fireEvent.click(screen.getAllByAltText('Delete')[0]);
    fireEvent.click(screen.getByText('Save'));
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => expect(deleteBatchTrigger).toHaveBeenCalledTimes(1));
    // Targets exactly the first row's unique batch_id (101) — NOT batch_number, NOT the second row (102).
    expect(deleteBatchTrigger).toHaveBeenCalledWith({ batch_id: 101 });
    expect(deleteBatchTrigger).not.toHaveBeenCalledWith({ batch_id: 102 });
  });

  it('shows the message modal listing invoice numbers on a 409 (sold) response', async () => {
    deleteBatchTrigger.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          status: 409,
          data: {
            error: 'Batch has been sold and cannot be deleted',
            invoice_numbers: ['INV-001', 'INV-002'],
            invoices: [
              { invoice_id: 1, invoice_number: 'INV-001' },
              { invoice_id: 2, invoice_number: 'INV-002' },
            ],
          },
        }),
    });

    await loadBatches();
    fireEvent.click(screen.getAllByAltText('Delete')[0]);
    fireEvent.click(screen.getByText('Save'));
    fireEvent.click(screen.getByText('Confirm'));

    const modal = await screen.findByTestId('dialog-Batch cannot be deleted');
    expect(modal).toBeInTheDocument();
    const message = screen.getByTestId('dialog-message');
    expect(message).toHaveTextContent('AMX-DUP');
    expect(message).toHaveTextContent('INV-001, INV-002');
  });

  it('refreshes the batch list after a successful deletion', async () => {
    await loadBatches();
    getBatchesTrigger.mockClear();

    fireEvent.click(screen.getAllByAltText('Delete')[0]);
    fireEvent.click(screen.getByText('Save'));
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => expect(deleteBatchTrigger).toHaveBeenCalled());
    // fetchBatchesForProduct is called again to refresh.
    await waitFor(() => expect(getBatchesTrigger).toHaveBeenCalled());
  });
});
