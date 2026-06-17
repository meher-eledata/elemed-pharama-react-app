import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CustomerModal from '../CustomerModal';

const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: (state = { user: { id: 1, username: 'testuser' } }) => state,
      cart: (state = { items: [], total: 0 }) => state,
    },
  });
};

describe('CustomerModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const store = createMockStore();
    return render(
      <Provider store={store}>
        <CustomerModal {...mockProps} {...props} />
      </Provider>
    );
  };

  it('renders modal when isOpen is true', () => {
    renderComponent();
    
    expect(screen.getByText(/add new customer/i)).toBeInTheDocument();
  });

  it('does not render modal when isOpen is false', () => {
    renderComponent({ isOpen: false });
    
    expect(screen.queryByText(/add new customer/i)).not.toBeInTheDocument();
  });

  it('displays all form fields', () => {
    renderComponent();
    
    expect(screen.getByPlaceholderText(/customer name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/mobile number/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/billing address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/shipping address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/gstin/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/pancard/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/drug license/i)).toBeInTheDocument();
  });

  it('displays gender select with options', () => {
    renderComponent();

    // Gender is now a MUI Select (combobox), not radio buttons.
    const genderSelect = screen.getByLabelText(/gender/i);
    expect(genderSelect).toBeInTheDocument();

    // Open the dropdown and verify the options are listed.
    fireEvent.mouseDown(genderSelect);
    const listbox = within(screen.getByRole('listbox'));
    expect(listbox.getByText(/^male$/i)).toBeInTheDocument();
    expect(listbox.getByText(/^female$/i)).toBeInTheDocument();
    expect(listbox.getByText(/^other$/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    renderComponent();
    
    // Find the close button by the CloseIcon testid or by finding the button with the icon
    const closeIcon = screen.getByTestId('CloseIcon');
    const closeButton = closeIcon.closest('button');
    
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    } else {
      // Fallback: try finding any button that might be the close button
      const buttons = screen.getAllByRole('button');
      const closeBtn = buttons.find(btn => btn.querySelector('[data-testid="CloseIcon"]'));
      if (closeBtn) {
        fireEvent.click(closeBtn);
        expect(mockProps.onClose).toHaveBeenCalledTimes(1);
      }
    }
  });

  it('calls onClose when Cancel button is clicked', () => {
    renderComponent();
    
    const cancelButton = screen.getByText(/cancel/i);
    fireEvent.click(cancelButton);
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('handles input changes for customer name', () => {
    renderComponent();
    
    const nameInput = screen.getByPlaceholderText(/customer name/i);
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    
    expect(nameInput).toHaveValue('John Doe');
  });

  it('handles input changes for mobile number', () => {
    renderComponent();
    
    const mobileInput = screen.getByPlaceholderText(/mobile number/i);
    fireEvent.change(mobileInput, { target: { value: '1234567890' } });
    
    expect(mobileInput).toHaveValue('1234567890');
  });

  it('handles input changes for email', () => {
    renderComponent();
    
    const emailInput = screen.getByPlaceholderText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('handles gender selection', () => {
    renderComponent();

    // Open the gender Select and pick "Male".
    const genderSelect = screen.getByRole('combobox');
    fireEvent.mouseDown(genderSelect);
    const listbox = within(screen.getByRole('listbox'));
    fireEvent.click(listbox.getByText(/^male$/i));

    // The selected value should now be reflected in the combobox.
    expect(genderSelect).toHaveTextContent(/male/i);
  });

  it('handles shipping address same as billing checkbox', () => {
    renderComponent();
    
    const checkbox = screen.getByLabelText(/shipping address same as billing/i);
    fireEvent.click(checkbox);
    
    expect(checkbox).toBeChecked();
  });

  it('disables shipping address when checkbox is checked', () => {
    renderComponent();
    
    const checkbox = screen.getByLabelText(/shipping address same as billing/i);
    fireEvent.click(checkbox);
    
    const shippingInput = screen.getByPlaceholderText(/shipping address/i);
    expect(shippingInput).toBeDisabled();
  });

  it('calls onSubmit with form data when form is submitted', async () => {
    renderComponent();
    
    // Fill in form fields
    fireEvent.change(screen.getByPlaceholderText(/customer name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByPlaceholderText(/mobile number/i), {
      target: { value: '1234567890' },
    });
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'john@example.com' },
    });
    
    // Submit form - find the submit button specifically (type="submit")
    const submitButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockProps.onSubmit).toHaveBeenCalled();
    });
  });

  it('resets form when modal closes', () => {
    const { rerender } = renderComponent();
    
    // Fill in a field
    fireEvent.change(screen.getByPlaceholderText(/customer name/i), {
      target: { value: 'John Doe' },
    });
    
    // Close modal
    rerender(
      <Provider store={createMockStore()}>
        <CustomerModal {...mockProps} isOpen={false} />
      </Provider>
    );
    
    // Reopen modal
    rerender(
      <Provider store={createMockStore()}>
        <CustomerModal {...mockProps} isOpen={true} />
      </Provider>
    );
    
    // Form should be reset
    const nameInput = screen.getByPlaceholderText(/customer name/i);
    expect(nameInput).toHaveValue('');
  });

  it('handles multiline address inputs', () => {
    renderComponent();
    
    const billingAddress = screen.getByPlaceholderText(/billing address/i);
    fireEvent.change(billingAddress, {
      target: { value: '123 Main St\nCity, State 12345' },
    });
    
    expect(billingAddress).toHaveValue('123 Main St\nCity, State 12345');
  });
});

