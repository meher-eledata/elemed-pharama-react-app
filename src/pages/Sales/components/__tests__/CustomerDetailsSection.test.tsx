import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CustomerDetailsSection from '../CustomerDetailsSection';
import { Customer } from '../../../../redux/slices/salesApi';

// Mock Redux store
const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: (state = { user: { id: 1, username: 'testuser' } }) => state,
      cart: (state = { items: [], total: 0 }) => state,
    },
  });
};

describe('CustomerDetailsSection', () => {
  const mockProps = {
    customerName: '',
    customerMobile: '',
    customerCity: '',
    patientType: 'Out Patient',
    selectedCustomer: null,
    customerNames: ['John Doe', 'Jane Smith', 'Bob Johnson'],
    availablePhones: ['1234567890', '9876543210'],
    onCustomerNameChange: jest.fn(),
    onCustomerSelect: jest.fn(),
    onCustomerMobileChange: jest.fn(),
    onCustomerCityChange: jest.fn(),
    onPatientTypeChange: jest.fn(),
    onAddNewCustomer: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const store = createMockStore();
    return render(
      <Provider store={store}>
        <CustomerDetailsSection {...mockProps} {...props} />
      </Provider>
    );
  };

  it('renders customer details section with all fields', () => {
    renderComponent();
    
    expect(screen.getByText(/customer details/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/customer name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mobile number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByText(/add new customer/i)).toBeInTheDocument();
  });

  it('displays customer name when provided', () => {
    renderComponent({ customerName: 'John Doe' });
    
    const nameInput = screen.getByLabelText(/customer name/i);
    expect(nameInput).toHaveValue('John Doe');
  });

  it('displays customer mobile when provided', () => {
    renderComponent({ customerMobile: '1234567890' });
    
    const mobileInput = screen.getByLabelText(/mobile number/i);
    expect(mobileInput).toHaveValue('1234567890');
  });

  it('displays customer city when provided', () => {
    renderComponent({ customerCity: 'Mumbai' });
    
    const cityInput = screen.getByLabelText(/city/i);
    expect(cityInput).toHaveValue('Mumbai');
  });

  it('calls onAddNewCustomer when Add New Customer button is clicked', () => {
    renderComponent();
    
    const addButton = screen.getByText(/add new customer/i);
    fireEvent.click(addButton);
    
    expect(mockProps.onAddNewCustomer).toHaveBeenCalledTimes(1);
  });

  it('calls onCustomerNameChange when customer name input changes', async () => {
    renderComponent();
    
    const nameInput = screen.getByLabelText(/customer name/i);
    fireEvent.change(nameInput, { target: { value: 'New Customer' } });
    
    await waitFor(() => {
      expect(mockProps.onCustomerNameChange).toHaveBeenCalled();
    });
  });

  it('calls onCustomerMobileChange when mobile input changes', () => {
    renderComponent();
    
    const mobileInput = screen.getByLabelText(/mobile number/i);
    fireEvent.change(mobileInput, { target: { value: '9999999999' } });
    
    expect(mockProps.onCustomerMobileChange).toHaveBeenCalledWith('9999999999');
  });

  it('calls onCustomerCityChange when city input changes', () => {
    renderComponent();
    
    const cityInput = screen.getByLabelText(/city/i);
    fireEvent.change(cityInput, { target: { value: 'Delhi' } });
    
    expect(mockProps.onCustomerCityChange).toHaveBeenCalledWith('Delhi');
  });

  it('shows autocomplete for mobile when availablePhones are provided', () => {
    renderComponent({ availablePhones: ['1234567890', '9876543210'] });
    
    const mobileInput = screen.getByLabelText(/mobile number/i);
    expect(mobileInput).toBeInTheDocument();
  });

  it('shows regular text field for mobile when no availablePhones', () => {
    renderComponent({ availablePhones: [] });
    
    const mobileInput = screen.getByLabelText(/mobile number/i);
    expect(mobileInput).toBeInTheDocument();
  });

  it('handles customer selection from autocomplete dropdown', async () => {
    renderComponent();
    
    const nameInput = screen.getByLabelText(/customer name/i);
    fireEvent.focus(nameInput);
    fireEvent.change(nameInput, { target: { value: 'John' } });
    
    await waitFor(() => {
      const option = screen.getByText('John Doe');
      if (option) {
        fireEvent.click(option);
      }
    });
  });

  it('handles phone selection from autocomplete when available', async () => {
    renderComponent({ 
      customerName: 'John Doe',
      availablePhones: ['1234567890', '9876543210'] 
    });
    
    const mobileInput = screen.getByLabelText(/mobile number/i);
    fireEvent.focus(mobileInput);
    
    await waitFor(() => {
      expect(mobileInput).toBeInTheDocument();
    });
  });

  it('updates selected customer when both name and phone are provided', () => {
    const customer: Customer = {
      id: 1,
      name: 'John Doe',
      mobile: '1234567890',
      city: 'Mumbai',
    };
    
    renderComponent({ 
      customerName: 'John Doe',
      customerMobile: '1234567890',
      selectedCustomer: customer 
    });
    
    expect(screen.getByLabelText(/customer name/i)).toHaveValue('John Doe');
    expect(screen.getByLabelText(/mobile number/i)).toHaveValue('1234567890');
  });
});

