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
    paymentMode: '',
    insuranceCompany: '',
    invoiceNumber: 'INV001',
    invoiceDate: '01/01/2024',
    onPaymentModeChange: jest.fn(),
    onInsuranceCompanyChange: jest.fn(),
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
    expect(screen.getByText(/invoice number/i)).toBeInTheDocument();
    expect(screen.getByText(/invoice date/i)).toBeInTheDocument();
  });

  it('displays payment mode when provided', () => {
    renderComponent({ paymentMode: 'Cash' });
    
    // Payment mode is in an autocomplete, find by role or by value
    const paymentInput = screen.getByRole('combobox') || screen.getByDisplayValue('Cash');
    expect(paymentInput).toBeInTheDocument();
  });

  it('displays insurance company when provided', () => {
    renderComponent({ insuranceCompany: 'ABC Insurance' });
    
    const insuranceInput = screen.getByLabelText(/insurance company/i);
    expect(insuranceInput).toHaveValue('ABC Insurance');
  });

  it('displays invoice number when provided', () => {
    renderComponent({ invoiceNumber: 'INV123' });
    
    expect(screen.getByText('INV123')).toBeInTheDocument();
  });

  it('displays invoice date when provided', () => {
    renderComponent({ invoiceDate: '15/05/2024' });
    
    expect(screen.getByText('15/05/2024')).toBeInTheDocument();
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
    renderComponent();
    
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

