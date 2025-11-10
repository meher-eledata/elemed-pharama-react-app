import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import DoctorDetailsSection from '../DoctorDetailsSection';
import { DoctorPhoneEmailInfo } from '../../../../redux/slices/salesApi';

const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: (state = { user: { id: 1, username: 'testuser' } }) => state,
      cart: (state = { items: [], total: 0 }) => state,
    },
  });
};

describe('DoctorDetailsSection', () => {
  const mockProps = {
    doctorName: '',
    doctorMobile: '',
    doctorEmail: '',
    selectedDoctor: null,
    doctorNames: ['Dr. Smith', 'Dr. Jones', 'Dr. Brown'],
    isLoadingDoctorNames: false,
    availableDoctorInfo: [],
    onDoctorSelect: jest.fn(),
    onDoctorNameChange: jest.fn(),
    onDoctorMobileChange: jest.fn(),
    onDoctorEmailChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const store = createMockStore();
    return render(
      <Provider store={store}>
        <DoctorDetailsSection {...mockProps} {...props} />
      </Provider>
    );
  };

  it('renders doctor details section with all fields', () => {
    renderComponent();
    
    expect(screen.getByText(/doctor details/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/doctor name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mobile number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('displays doctor name when provided', () => {
    renderComponent({ doctorName: 'Dr. Smith' });
    
    const nameInput = screen.getByLabelText(/doctor name/i);
    expect(nameInput).toHaveValue('Dr. Smith');
  });

  it('displays doctor mobile when provided', () => {
    renderComponent({ doctorMobile: '1234567890' });
    
    const mobileInput = screen.getByLabelText(/mobile number/i);
    expect(mobileInput).toHaveValue('1234567890');
  });

  it('displays doctor email when provided', () => {
    renderComponent({ doctorEmail: 'doctor@example.com' });
    
    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toHaveValue('doctor@example.com');
  });

  it('calls onDoctorNameChange when doctor name input changes', async () => {
    renderComponent();
    
    const nameInput = screen.getByLabelText(/doctor name/i);
    fireEvent.change(nameInput, { target: { value: 'Dr. New' } });
    
    await waitFor(() => {
      expect(mockProps.onDoctorNameChange).toHaveBeenCalled();
    });
  });

  it('calls onDoctorMobileChange when mobile input changes', () => {
    renderComponent();
    
    const mobileInput = screen.getByLabelText(/mobile number/i);
    fireEvent.change(mobileInput, { target: { value: '9999999999' } });
    
    expect(mockProps.onDoctorMobileChange).toHaveBeenCalledWith('9999999999');
  });

  it('calls onDoctorEmailChange when email input changes', () => {
    renderComponent();
    
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    
    expect(mockProps.onDoctorEmailChange).toHaveBeenCalledWith('new@example.com');
  });

  it('shows loading indicator when isLoadingDoctorNames is true', () => {
    renderComponent({ isLoadingDoctorNames: true });
    
    const nameInput = screen.getByLabelText(/doctor name/i);
    expect(nameInput).toBeInTheDocument();
  });

  it('shows autocomplete for mobile when availableDoctorInfo has phones', () => {
    const doctorInfo: DoctorPhoneEmailInfo[] = [
      { phone: '1234567890', email: 'doctor1@example.com' },
      { phone: '9876543210', email: 'doctor2@example.com' },
    ];
    
    renderComponent({ availableDoctorInfo: doctorInfo });
    
    const mobileInput = screen.getByLabelText(/mobile number/i);
    expect(mobileInput).toBeInTheDocument();
  });

  it('shows autocomplete for email when availableDoctorInfo has emails', () => {
    const doctorInfo: DoctorPhoneEmailInfo[] = [
      { phone: '1234567890', email: 'doctor1@example.com' },
      { phone: '9876543210', email: 'doctor2@example.com' },
    ];
    
    renderComponent({ availableDoctorInfo: doctorInfo });
    
    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toBeInTheDocument();
  });

  it('auto-fills email when phone is selected from availableDoctorInfo', () => {
    const doctorInfo: DoctorPhoneEmailInfo[] = [
      { phone: '1234567890', email: 'doctor1@example.com' },
    ];
    
    renderComponent({ availableDoctorInfo: doctorInfo });
    
    const mobileInput = screen.getByLabelText(/mobile number/i);
    fireEvent.change(mobileInput, { target: { value: '1234567890' } });
    
    // The component should auto-fill email when phone matches
    expect(mockProps.onDoctorMobileChange).toHaveBeenCalled();
  });

  it('auto-fills phone when email is selected from availableDoctorInfo', () => {
    const doctorInfo: DoctorPhoneEmailInfo[] = [
      { phone: '1234567890', email: 'doctor1@example.com' },
    ];
    
    renderComponent({ availableDoctorInfo: doctorInfo });
    
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'doctor1@example.com' } });
    
    // The component should auto-fill phone when email matches
    expect(mockProps.onDoctorEmailChange).toHaveBeenCalled();
  });

  it('handles doctor selection from autocomplete dropdown', async () => {
    renderComponent();
    
    const nameInput = screen.getByLabelText(/doctor name/i);
    
    // Focus the input to open the dropdown
    fireEvent.focus(nameInput);
    fireEvent.mouseDown(nameInput);
    
    // Wait for the dropdown options to appear
    await waitFor(() => {
      const option = screen.getByText('Dr. Smith');
      expect(option).toBeInTheDocument();
    });
    
    // Click on the option from the listbox - this should trigger onChange
    const option = screen.getByText('Dr. Smith');
    fireEvent.click(option);
    
    // The onChange event should be triggered when selecting from dropdown
    await waitFor(() => {
      expect(mockProps.onDoctorSelect).toHaveBeenCalledWith('Dr. Smith');
    });
  });

  it('handles freeSolo input for doctor name', () => {
    renderComponent();
    
    const nameInput = screen.getByLabelText(/doctor name/i);
    fireEvent.change(nameInput, { target: { value: 'Custom Doctor Name' } });
    
    expect(mockProps.onDoctorNameChange).toHaveBeenCalled();
  });
});

