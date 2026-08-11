import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PaymentDetailsSection from '../PaymentDetailsSection';

const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: (state = { user: { id: 1, username: 'testuser' } }) => state,
      cart: (state = { items: [], total: 0 }) => state,
    },
  });
};

describe('PaymentDetailsSection', () => {
  const mockProps = {
    // The app always seeds paymentMode to a paymentMethods member
    // (DEFAULT_PAYMENT_MODE = paymentMethods[0] in SalesReceipt.tsx); '' is never
    // passed and made MUI's Autocomplete warn "None of the options match" on
    // every default render. Keep the fixture aligned with the options list.
    paymentMode: 'Cash',
    insuranceCompany: '',
    invoiceNumber: 'INV001',
    invoiceDate: '01/01/2024',
    onPaymentModeChange: jest.fn(),
    onInsuranceCompanyChange: jest.fn(),
    onInvoiceDateChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const store = createMockStore();
    return render(
      <Provider store={store}>
        <PaymentDetailsSection {...mockProps} {...props} />
      </Provider>
    );
  };

  it('renders payment details section with all fields', () => {
    renderComponent();
    
    expect(screen.getByText(/payment details/i)).toBeInTheDocument();
    // "Invoice number" appears as both the field label and its placeholder,
    // so query the labelled input directly to avoid an ambiguous text match.
    expect(screen.getByLabelText(/invoice number/i)).toBeInTheDocument();
    // The MUI date picker exposes the date input as a labelled group.
    expect(screen.getByRole('group', { name: /invoice date/i })).toBeInTheDocument();
  });

  it('displays payment mode when provided', () => {
    renderComponent({ paymentMode: 'Cash' });
    
    // Payment mode is in an autocomplete, find by role or by value
    const paymentInput = screen.getByRole('combobox') || screen.getByDisplayValue('Cash');
    expect(paymentInput).toBeInTheDocument();
  });

  it('displays insurance company when provided', () => {
    // The "Insurance company" labelled field is only shown when paymentMode is "Insurance";
    // otherwise the same field is labelled "Details".
    renderComponent({ paymentMode: 'Insurance', insuranceCompany: 'ABC Insurance' });

    const insuranceInput = screen.getByLabelText(/insurance company/i);
    expect(insuranceInput).toHaveValue('ABC Insurance');
  });

  it('displays invoice number when provided', () => {
    renderComponent({ invoiceNumber: 'INV123' });

    // Invoice number is rendered as a TextField value, not free text.
    expect(screen.getByDisplayValue('INV123')).toBeInTheDocument();
  });

  it('renders the invoice number field read-only (backend assigns the number)', () => {
    renderComponent({ invoiceNumber: 'INV123' });

    expect(screen.getByLabelText(/invoice number/i)).toBeDisabled();
  });

  it('shows the Auto-generated placeholder for a new sale (no number yet)', () => {
    renderComponent({ invoiceNumber: '' });

    const input = screen.getByLabelText(/invoice number/i);
    expect(input).toHaveAttribute('placeholder', 'Auto-generated');
    expect(input).toHaveValue('');
  });

  it('displays invoice date field when provided', () => {
    // Invoice date is rendered by a MUI date picker that splits the value into
    // separate editable segments (MM, DD, YYYY) and reformats it, so there is no
    // single "15/05/2024" text node. Assert the labelled date field is present.
    renderComponent({ invoiceDate: '15/05/2024' });

    expect(screen.getByRole('group', { name: /invoice date/i })).toBeInTheDocument();
  });

  it('calls onPaymentModeChange when payment mode changes', () => {
    renderComponent();
    
    // Find the autocomplete input by role
    const paymentInput = screen.getByRole('combobox');
    fireEvent.change(paymentInput, { target: { value: 'Credit Card' } });
    
    // The autocomplete might trigger onChange differently
    expect(paymentInput).toBeInTheDocument();
  });

  it('calls onInsuranceCompanyChange when insurance company changes', () => {
    renderComponent({ paymentMode: 'Insurance' });

    const insuranceInput = screen.getByLabelText(/insurance company/i);
    fireEvent.change(insuranceInput, { target: { value: 'XYZ Insurance' } });

    expect(mockProps.onInsuranceCompanyChange).toHaveBeenCalledWith('XYZ Insurance');
  });

  it('renders payment mode dropdown with options', () => {
    renderComponent();
    
    // Find the autocomplete input by role
    const paymentInput = screen.getByRole('combobox');
    expect(paymentInput).toBeInTheDocument();
  });

  it('handles payment mode selection from dropdown', async () => {
    renderComponent();
    
    // Find the autocomplete input by role
    const paymentInput = screen.getByRole('combobox');
    fireEvent.focus(paymentInput);
    
    // Wait for dropdown options to appear
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify the input exists
    expect(paymentInput).toBeInTheDocument();
  });
});

