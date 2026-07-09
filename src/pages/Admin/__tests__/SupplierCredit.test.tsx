global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import SupplierCredit from '../SupplierCredit';
import * as adminCreditApi from '../../../redux/slices/adminCreditApi';
import * as masterApi from '../../../redux/slices/masterApi';

const theme = createTheme();

// react-router: stub navigate (the Back button calls useNavigate).
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Stub the x-date-pickers-backed date picker; the page test does not exercise
// real date selection and this keeps the render free of adapter/canvas deps.
// Keep StandardButton (from the same barrel) REAL so the buttons work.
jest.mock('../../../components/Common', () => {
  const actual = jest.requireActual('../../../components/Common');
  return {
    __esModule: true,
    ...actual,
    PharmaDatePicker: () => <div data-testid="date-picker" />,
  };
});

// GOTCHA: auto-mocking these slices breaks when new hooks are added — mock EXPLICITLY.
// Keep the real module (types, api object) and override only the consumed hooks.
jest.mock('../../../redux/slices/adminCreditApi', () => {
  const actual = jest.requireActual('../../../redux/slices/adminCreditApi');
  return {
    __esModule: true,
    ...actual,
    useListCreditTransactionsQuery: jest.fn(),
    useGetSupplierCreditBalanceQuery: jest.fn(),
    useAdjustSupplierCreditMutation: jest.fn(),
  };
});
jest.mock('../../../redux/slices/masterApi', () => {
  const actual = jest.requireActual('../../../redux/slices/masterApi');
  return { __esModule: true, ...actual, useGetSuppliersQuery: jest.fn() };
});

const mockedCredit = adminCreditApi as unknown as {
  useListCreditTransactionsQuery: jest.Mock;
  useGetSupplierCreditBalanceQuery: jest.Mock;
  useAdjustSupplierCreditMutation: jest.Mock;
};
const mockedMaster = masterApi as unknown as { useGetSuppliersQuery: jest.Mock };

// Amount arrives from pg as a STRING; one IN row and one OUT row.
const FIXTURE: adminCreditApi.ListCreditTransactionsResponse = {
  rows: [
    {
      id: '1',
      credit_type: 'ADJUSTMENT',
      direction: 'IN',
      amount: '1200.00',
      persona_type: 'SUPPLIER',
      persona_id: 3,
      supplier_name: 'Acme Pharma',
      notes: 'Opening balance',
      created_by: 'admin',
      related_payment_id: null,
      related_po_id: null,
      created_at: '2026-07-01T10:00:00.000Z',
    },
    {
      id: '2',
      credit_type: 'SUPPLIER_APPLY',
      direction: 'OUT',
      amount: '300.00',
      persona_type: 'SUPPLIER',
      persona_id: 5,
      supplier_name: 'Beta Meds',
      notes: 'Applied to PO',
      created_by: 'pharma1',
      related_payment_id: 9,
      related_po_id: 500,
      created_at: '2026-07-02T10:00:00.000Z',
    },
  ],
  total: 2,
};

const SUPPLIERS: masterApi.Supplier[] = [
  { id: 3, supplier_name: 'Acme Pharma', supplier_code: 'AC' } as masterApi.Supplier,
];

const createStore = () =>
  configureStore({
    reducer: {
      auth: (state = { token: 'JWT123', user: { id: 1, role: 0 } }) => state,
      [adminCreditApi.adminCreditApi.reducerPath]: adminCreditApi.adminCreditApi.reducer,
      [masterApi.masterApi.reducerPath]: masterApi.masterApi.reducer,
    },
    middleware: (gDM) =>
      gDM().concat(adminCreditApi.adminCreditApi.middleware, masterApi.masterApi.middleware),
  });

const renderPage = () =>
  render(
    <Provider store={createStore()}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <SupplierCredit />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );

// Select a supplier inside the currently-open Adjust dialog's Autocomplete.
const selectDialogSupplier = (dialog: HTMLElement, label: string) => {
  const input = within(dialog).getByPlaceholderText('Select a supplier');
  fireEvent.mouseDown(input);
  fireEvent.change(input, { target: { value: label } });
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  fireEvent.keyDown(input, { key: 'Enter' });
};

let adjustMock: jest.Mock;
let unwrapMock: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockedMaster.useGetSuppliersQuery.mockReturnValue({ data: SUPPLIERS, isLoading: false });
  mockedCredit.useListCreditTransactionsQuery.mockReturnValue({
    data: FIXTURE,
    isLoading: false,
    isFetching: false,
    error: undefined,
  });
  mockedCredit.useGetSupplierCreditBalanceQuery.mockReturnValue({
    data: { supplier_id: 3, available_credit: 20, last_txn_id: 9 },
    isFetching: false,
  });
  unwrapMock = jest.fn().mockResolvedValue({ message: 'Supplier credit adjusted' });
  adjustMock = jest.fn(() => ({ unwrap: unwrapMock }));
  mockedCredit.useAdjustSupplierCreditMutation.mockReturnValue([
    adjustMock,
    { isLoading: false },
  ]);
});

describe('SupplierCredit page', () => {
  it('renders the transactions table with IN and OUT rows (amount string → currency, notes/created_by shown)', () => {
    renderPage();

    // Supplier names for both rows.
    expect(screen.getByText('Acme Pharma')).toBeInTheDocument();
    expect(screen.getByText('Beta Meds')).toBeInTheDocument();

    // Amounts: pg strings formatted to ₹, prefixed with +/- by direction (one node).
    expect(screen.getByText('+₹1,200.00')).toBeInTheDocument();
    expect(screen.getByText('-₹300.00')).toBeInTheDocument();

    // Direction chips.
    expect(screen.getByText('Credit In')).toBeInTheDocument();
    expect(screen.getByText('Credit Out')).toBeInTheDocument();

    // notes (Reason) + created_by (By).
    expect(screen.getByText('Opening balance')).toBeInTheDocument();
    expect(screen.getByText('Applied to PO')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('pharma1')).toBeInTheDocument();

    // Total count from the response.
    expect(screen.getByText(/Total transactions/)).toBeInTheDocument();
  });

  it('renders the supplier + date filters', () => {
    renderPage();
    // Supplier appears as a filter label AND a table header — at least one exists.
    expect(screen.getAllByText('Supplier').length).toBeGreaterThan(0);
    expect(screen.getByText('From date')).toBeInTheDocument();
    expect(screen.getByText('To date')).toBeInTheDocument();
    // 'All suppliers' is the filter Autocomplete placeholder (an attribute, not text).
    expect(screen.getByPlaceholderText('All suppliers')).toBeInTheDocument();
  });

  it('opens the Adjust Credit dialog and shows the form', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Adjust Credit' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Adjust Supplier Credit')).toBeInTheDocument();
    expect(within(dialog).getByText('Add Credit')).toBeInTheDocument();
    expect(within(dialog).getByText('Subtract Credit')).toBeInTheDocument();
    expect(within(dialog).getByPlaceholderText('Enter amount')).toBeInTheDocument();
    expect(within(dialog).getByPlaceholderText('Reason for this adjustment')).toBeInTheDocument();
  });

  it('blocks submit with inline validation when amount/reason are blank', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Adjust Credit' }));
    const dialog = screen.getByRole('dialog');

    // Pick a supplier so validation advances past the supplier check to amount.
    selectDialogSupplier(dialog, 'Acme Pharma');

    // Amount + reason left blank → submit is blocked with an inline error.
    fireEvent.click(within(dialog).getByRole('button', { name: 'Submit Adjustment' }));

    expect(
      await within(dialog).findByText('Please enter an amount greater than 0.')
    ).toBeInTheDocument();
    expect(adjustMock).not.toHaveBeenCalled();
  });

  it('calls the adjust mutation on a valid submit', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Adjust Credit' }));
    const dialog = screen.getByRole('dialog');

    selectDialogSupplier(dialog, 'Acme Pharma');
    fireEvent.change(within(dialog).getByPlaceholderText('Enter amount'), {
      target: { value: '50' },
    });
    fireEvent.change(within(dialog).getByPlaceholderText('Reason for this adjustment'), {
      target: { value: 'Manual top-up' },
    });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Submit Adjustment' }));

    await waitFor(() => expect(adjustMock).toHaveBeenCalledTimes(1));
    expect(adjustMock).toHaveBeenCalledWith(
      expect.objectContaining({
        supplier_id: 3,
        direction: 'IN',
        amount: 50,
        notes: 'Manual top-up',
      })
    );
  });
});
