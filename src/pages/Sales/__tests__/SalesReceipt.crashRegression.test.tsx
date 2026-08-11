/**
 * Regression test for the Sales page crash:
 * typing a mobile number into the "customer name" field and then typing into the
 * mobile-number field used to throw "Maximum update depth exceeded" (whole-page
 * crash) — an infinite save→load feedback loop in useFormPersistence that kept
 * recreating an id-0 selectedCustomer object once formData held BOTH a customer
 * name and a mobile value.
 *
 * Unlike SalesReceipt.test.tsx this suite uses the REAL cartSlice reducer, because
 * the loop runs through Redux formData (a stub cart reducer hides the bug).
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import SalesReceipt from '../SalesReceipt';
import cartReducer from '../../../redux/slices/cartSlice';
import * as salesApi from '../../../redux/slices/salesApi';
import * as receiveApi from '../../../redux/slices/receiveApi';

const theme = createTheme();

const makeMutation = (resolved: any = {}) =>
  jest.fn(() => [
    jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue(resolved) })),
    { isLoading: false },
  ]);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/sales/receipt', state: null }),
}));

jest.mock('../../../redux/slices/salesApi');
jest.mock('../../../redux/slices/receiveApi');
jest.mock('../../../utils/cartStorage', () => ({
  clearCartFromStorage: jest.fn(),
  clearFormDataFromStorage: jest.fn(),
  getCartFromStorage: jest.fn(() => ({ items: [], total: 0 })),
  getFormDataFromStorage: jest.fn(() => null),
  setEditInvoiceId: jest.fn(),
}));

const createStore = () =>
  configureStore({
    reducer: {
      auth: (state = { user: { id: 1, username: 'testuser' } }) => state,
      cart: cartReducer, // REAL reducer — the crash loop runs through formData
    },
  });

describe('SalesReceipt crash regression (form-persistence feedback loop)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (salesApi.useGetDoctorNamesQuery as jest.Mock) = jest.fn(() => ({
      data: [],
      isLoading: false,
    }));
    (salesApi.useGetAllCustomerNamesQuery as jest.Mock) = jest.fn(() => ({
      data: ['Sekhar Mulugu'],
      refetch: jest.fn(),
    }));
    (salesApi.useGetCustomerOptionsQuery as jest.Mock) = jest.fn(() => ({
      data: [{ id: '4', name: 'Sekhar Mulugu', phone: '+919911223344' }],
      isLoading: false,
    }));
    (salesApi.useSubmitSaleMutation as jest.Mock) = makeMutation();
    (salesApi.useAddCustomerMutation as jest.Mock) = makeMutation();
    (salesApi.useGetCustomerPhonesMutation as jest.Mock) = jest.fn(() => [
      jest.fn(() => ({
        unwrap: jest.fn().mockResolvedValue({ name: '', phones: [], ids: [] }),
      })),
    ]);
    (salesApi.useGetDoctorPhonesAndEmailsMutation as jest.Mock) = jest.fn(() => [
      jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue({ info: [] }) })),
    ]);
    (salesApi.useUpdateSalesMutation as jest.Mock) = makeMutation();
    (salesApi.useEditSaleMutation as jest.Mock) = makeMutation();
    (salesApi.useDeleteSalesMutation as jest.Mock) = makeMutation();
    (salesApi.useUpsertInvoicePaymentsMutation as jest.Mock) = makeMutation();
    (salesApi.useDeleteInvoiceMutation as jest.Mock) = makeMutation();
    (salesApi.useGetInvoiceDetailsMutation as jest.Mock) = makeMutation();
    (receiveApi.useGetProductsQuery as jest.Mock) = jest.fn(() => ({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    }));
  });

  const renderPage = () =>
    render(
      <Provider store={createStore()}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <SalesReceipt />
          </BrowserRouter>
        </ThemeProvider>
      </Provider>
    );

  // The CustomerModal also carries a "customer name" label, so scope to the first
  // (the section's autocomplete input).
  const getNameInput = () => screen.getAllByLabelText(/customer name/i)[0] as HTMLInputElement;
  const getMobileInput = () => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const mobile = inputs.find((i) => i.closest('.phone-no-field'));
    if (!mobile) throw new Error('customer mobile input not found');
    return mobile as HTMLInputElement;
  };

  it('does not crash when a mobile number is typed into the name field and then the mobile field is edited', () => {
    renderPage();

    // Step 1: a mobile number typed as free text into the customer NAME field
    act(() => {
      fireEvent.change(getNameInput(), { target: { value: '9911223344' } });
    });
    expect(getNameInput().value).toBe('9911223344');

    // Step 2: click into the mobile field and start typing — this used to throw
    // "Maximum update depth exceeded" and unmount the page
    act(() => {
      fireEvent.change(getMobileInput(), { target: { value: '9' } });
    });
    act(() => {
      fireEvent.change(getMobileInput(), { target: { value: '98' } });
    });

    // Page alive and the typed values survived (no wipe, no crash)
    expect(screen.getByText(/customer details/i)).toBeInTheDocument();
    expect(getNameInput().value).toBe('9911223344');
    expect(getMobileInput().value).toBe('98');
  });

  it('keeps typed keystrokes when a customer is selected and the user keeps typing in the mobile field', () => {
    renderPage();

    act(() => {
      fireEvent.change(getNameInput(), { target: { value: 'Free Text Customer' } });
    });
    act(() => {
      fireEvent.change(getMobileInput(), { target: { value: '12345' } });
    });
    act(() => {
      fireEvent.change(getMobileInput(), { target: { value: '123456' } });
    });

    expect(getNameInput().value).toBe('Free Text Customer');
    expect(getMobileInput().value).toBe('123456');
  });
});
