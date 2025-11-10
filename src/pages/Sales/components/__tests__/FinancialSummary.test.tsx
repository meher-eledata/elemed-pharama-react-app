import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import FinancialSummary from '../FinancialSummary';

const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: (state = { user: { id: 1, username: 'testuser' } }) => state,
      cart: (state = { items: [], total: 0 }) => state,
    },
  });
};

describe('FinancialSummary', () => {
  const mockProps = {
    totalValue: '1000',
    totalDiscount: '100',
    taxAmount: '180',
    totalPayableAmount: '1080',
    onTotalValueChange: jest.fn(),
    onTotalDiscountChange: jest.fn(),
    onTaxAmountChange: jest.fn(),
    onTotalPayableAmountChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const store = createMockStore();
    return render(
      <Provider store={store}>
        <FinancialSummary {...mockProps} {...props} />
      </Provider>
    );
  };

  it('renders financial summary with all fields', () => {
    renderComponent();
    
    expect(screen.getByText(/total value/i)).toBeInTheDocument();
    expect(screen.getByText(/total discount/i)).toBeInTheDocument();
    expect(screen.getByText(/tax amount/i)).toBeInTheDocument();
    expect(screen.getByText(/total payable/i)).toBeInTheDocument();
  });

  it('displays total value when provided', () => {
    renderComponent({ totalValue: '5000' });
    
    const totalValueInput = screen.getByDisplayValue('5000');
    expect(totalValueInput).toBeInTheDocument();
  });

  it('displays total discount when provided', () => {
    renderComponent({ totalDiscount: '500' });
    
    const discountInput = screen.getByDisplayValue('500');
    expect(discountInput).toBeInTheDocument();
  });

  it('displays tax amount when provided', () => {
    renderComponent({ taxAmount: '900' });
    
    const taxInput = screen.getByDisplayValue('900');
    expect(taxInput).toBeInTheDocument();
  });

  it('displays total payable amount when provided', () => {
    renderComponent({ totalPayableAmount: '5400' });
    
    const payableInput = screen.getByDisplayValue('5400');
    expect(payableInput).toBeInTheDocument();
  });

  it('calls onTotalValueChange when total value input changes', () => {
    renderComponent();
    
    const totalValueInput = screen.getByDisplayValue('1000');
    fireEvent.change(totalValueInput, { target: { value: '2000' } });
    
    expect(mockProps.onTotalValueChange).toHaveBeenCalledWith('2000');
  });

  it('calls onTotalDiscountChange when discount input changes', () => {
    renderComponent();
    
    const discountInput = screen.getByDisplayValue('100');
    fireEvent.change(discountInput, { target: { value: '200' } });
    
    expect(mockProps.onTotalDiscountChange).toHaveBeenCalledWith('200');
  });

  it('calls onTaxAmountChange when tax amount input changes', () => {
    renderComponent();
    
    const taxInput = screen.getByDisplayValue('180');
    fireEvent.change(taxInput, { target: { value: '360' } });
    
    expect(mockProps.onTaxAmountChange).toHaveBeenCalledWith('360');
  });

  it('calls onTotalPayableAmountChange when payable amount input changes', () => {
    renderComponent();
    
    const payableInput = screen.getByDisplayValue('1080');
    fireEvent.change(payableInput, { target: { value: '2160' } });
    
    expect(mockProps.onTotalPayableAmountChange).toHaveBeenCalledWith('2160');
  });

  it('renders empty values when not provided', () => {
    renderComponent({
      totalValue: '',
      totalDiscount: '',
      taxAmount: '',
      totalPayableAmount: '',
    });
    
    expect(screen.getByText(/total value/i)).toBeInTheDocument();
    expect(screen.getByText(/total discount/i)).toBeInTheDocument();
    expect(screen.getByText(/tax amount/i)).toBeInTheDocument();
    expect(screen.getByText(/total payable/i)).toBeInTheDocument();
  });

  it('handles numeric input correctly', () => {
    renderComponent();
    
    const totalValueInput = screen.getByDisplayValue('1000');
    fireEvent.change(totalValueInput, { target: { value: '1234.56' } });
    
    expect(mockProps.onTotalValueChange).toHaveBeenCalledWith('1234.56');
  });
});

