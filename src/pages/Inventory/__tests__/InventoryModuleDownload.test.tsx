global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';

// Capture what is handed to the shared CSV download (no real file logic).
const mockDownloadCsv = jest.fn();
jest.mock('../../../utils/csv', () => ({
  __esModule: true,
  ...jest.requireActual('../../../utils/csv'),
  downloadCsv: (...args: unknown[]) => mockDownloadCsv(...args),
}));

// Mock the activity logDownload mutation — this is the assertion target.
const mockLogDownload = jest.fn().mockReturnValue({ catch: jest.fn() });
jest.mock('../../../redux/slices/activityApi', () => ({
  useLogDownloadMutation: () => [mockLogDownload],
}));

// Fully mock inventoryApi so the page is NOT stuck in the RTK Query loading branch
// (the download toolbar only renders once loading resolves). Every exported hook is
// provided to avoid the auto-mocked-slice gotcha (a missing hook would auto-mock to
// undefined and throw when array-destructured). The 'low' tab is the default, so we
// give useGetLowStockQuery a couple of rows; the rest return non-loading empties.
const idleQuery = (data: any) => () => ({ data, isLoading: false, error: undefined });
const lazyMutation = () => [jest.fn(), { isLoading: false }];
jest.mock('../../../redux/slices/inventoryApi', () => ({
  useGetProductIdsQuery: idleQuery([]),
  useGetLowStockQuery: idleQuery([
    { id: 'p1', name: 'Paracetamol', currentQuantity: 5, minQuantity: 10 },
    { id: 'p2', name: 'Ibuprofen', currentQuantity: 2, minQuantity: 8 },
  ]),
  useGetExcessStockQuery: idleQuery([]),
  useGetExpiredStockQuery: idleQuery([
    // Stored at UTC midnight; the second row has no batch number or expiry.
    { id: 'e1', name: 'Cough Syrup', brand: 'Acme', type: 'Syrup', batchNumber: 'CS-1', currentQuantity: 3, expiryDate: '2026-12-28T00:00:00.000Z', daysPastExpiry: 4 },
    { id: 'e2', name: 'Eye Drops', brand: 'Acme', type: 'Drops', batchNumber: '', currentQuantity: 0, expiryDate: null, daysPastExpiry: 0 },
  ]),
  useGetNearExpiryStockQuery: idleQuery([]),
  useGetInventorySummaryQuery: idleQuery(undefined),
  useGetTotalStockQuery: idleQuery({ products: [] }),
  useAddProductMutation: lazyMutation,
  useGetBatchesForProductMutation: lazyMutation,
  useGetAllBrandsQuery: idleQuery([]),
  useGetProductsForBrandMutation: lazyMutation,
  useGetBrandsFromProductIdMutation: lazyMutation,
  useGetBrandsFromProductNameMutation: lazyMutation,
  useGetTypesForBrandAndProductMutation: lazyMutation,
  useAdjustInventoryBatchesMutation: lazyMutation,
  useUpdateMinQuantityMutation: lazyMutation,
}));

// NewProductModal (mounted by this page) calls useGetProductFieldOptionsQuery for its
// Type/Unit-of-Measure dropdowns; the test store doesn't wire masterApi, so mock the hook
// (auto-mocked-slice gotcha) to a non-loading empty options result.
jest.mock('../../../redux/slices/masterApi', () => ({
  useGetProductFieldOptionsQuery: () => ({ data: { types: [], units: [] } }),
}));

import InventoryModule from '../InventoryModule';

const createStore = () =>
  configureStore({
    reducer: {
      auth: (state = { token: 'JWT123', isAuthenticated: true, user: { role: 1 } }) => state,
      cart: (state = { items: [] }) => state,
    },
  });

const renderPage = (tab?: string) =>
  render(
    <Provider store={createStore()}>
      <MemoryRouter initialEntries={[{ pathname: '/inventory', state: tab ? { tab } : undefined }]}>
        <InventoryModule />
      </MemoryRouter>
    </Provider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockLogDownload.mockReturnValue({ catch: jest.fn() });
});

describe('InventoryModule — CSV download is logged', () => {
  it('calls logDownload with category=inventory and the stock-type label on download', () => {
    renderPage();

    // The download control is an IconButton wrapped in a Tooltip titled "Download";
    // it renders MUI's DownloadIcon (data-testid="DownloadIcon"). Click its button.
    const downloadIcon = screen.getByTestId('DownloadIcon');
    const downloadBtn = downloadIcon.closest('button')!;
    fireEvent.click(downloadBtn);

    expect(mockLogDownload).toHaveBeenCalledTimes(1);
    const arg = mockLogDownload.mock.calls[0][0];
    expect(arg).toMatchObject({
      category: 'inventory',
      name: 'Low Stock', // default selectedStockType === 'low'
      format: 'csv',
    });
    expect(typeof arg.count).toBe('number');
  });

  it('exports labelled columns through the shared CSV download', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('DownloadIcon').closest('button')!);
    const [filename, rows, headers] = mockDownloadCsv.mock.calls[0];
    expect(filename).toMatch(/^inventory_low_stock_\d{4}-\d{2}-\d{2}\.csv$/);
    expect(headers).toEqual(['Product Name', 'Brand', 'Type', 'Current Qty', 'Min Qty']);
    expect(rows).toContainEqual({ 'Product Name': 'Paracetamol', Brand: '-', Type: '-', 'Current Qty': 5, 'Min Qty': 10 });
  });

  it('exports expiry as the UTC calendar date (YYYY-MM-DD), "-" only for missing values', () => {
    renderPage('expired');
    fireEvent.click(screen.getByTestId('DownloadIcon').closest('button')!);
    const rows = mockDownloadCsv.mock.calls[0][1];
    expect(rows.find((r: any) => r['Product Name'] === 'Cough Syrup')['Expiry Date']).toBe('2026-12-28');
    // Missing values are '-', but a real 0 (quantity, days past expiry) stays 0.
    expect(rows.find((r: any) => r['Product Name'] === 'Eye Drops')).toMatchObject({
      'Batch No': '-',
      'Expiry Date': '-',
      'Current Qty': 0,
      'No Days Past': 0,
    });
  });
});
