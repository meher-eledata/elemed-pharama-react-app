global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';

// Stub react-csv so the hidden CSVLink render is a no-op (no real file logic).
jest.mock('react-csv', () => ({
  CSVLink: React.forwardRef(() => <a data-testid="csv-link" />),
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
  useGetExpiredStockQuery: idleQuery([]),
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

const renderPage = () =>
  render(
    <Provider store={createStore()}>
      <MemoryRouter>
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
});
