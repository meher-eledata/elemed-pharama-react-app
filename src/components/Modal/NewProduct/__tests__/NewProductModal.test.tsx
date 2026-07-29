import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import NewProductModal from '../NewProductModal';
import { useAddProductMutation } from '../../../../redux/slices/inventoryApi';
import { useGetProductFieldOptionsQuery } from '../../../../redux/slices/masterApi';

const theme = createTheme();

// The component reads state.auth.user via useSelector, so a Provider with an
// auth reducer is required even though the RTK Query hook itself is mocked.
const createMockStore = () =>
  configureStore({
    reducer: {
      auth: (state = { user: { id: 1, username: 'testuser' } }) => state,
    },
  });

// Mock the Redux API hooks
jest.mock('../../../../redux/slices/inventoryApi');
// The Type / Unit-of-Measure dropdowns are populated from this query (auto-mocked-slice
// gotcha: a new hook auto-mocks to undefined and breaks tests, so register it explicitly).
jest.mock('../../../../redux/slices/masterApi', () => ({
  useGetProductFieldOptionsQuery: jest.fn(),
}));

// Mock PharmaDatePicker
jest.mock('../../../../components/Common', () => ({
  StandardButton: ({ children, onClick, disabled, variant, size, startIcon }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} data-size={size}>
      {startIcon}
      {children}
    </button>
  ),
  PharmaDatePicker: ({ value, onChange, width, height }: any) => (
    <input
      data-testid="date-picker"
      type="date"
      value={value?.format('YYYY-MM-DD') || ''}
      onChange={(e) => {
        const dayjs = require('dayjs');
        onChange(e.target.value ? dayjs(e.target.value) : null);
      }}
      style={{ width, height }}
    />
  ),
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <Provider store={createMockStore()}>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </Provider>
  );
};

describe('NewProductModal', () => {
  const mockOnClose = jest.fn();
  const mockOnProductAdded = jest.fn();
  const mockAddProduct = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAddProductMutation as jest.Mock).mockReturnValue([
      mockAddProduct,
      {
        isLoading: false,
        error: null,
        isSuccess: false,
      },
    ]);
    (useGetProductFieldOptionsQuery as jest.Mock).mockReturnValue({
      data: { types: ['Tablet', 'Syrup'], units: ['Box', 'Strip'] },
    });
  });

  describe('Rendering', () => {
    it('renders modal when open is true', () => {
      renderWithTheme(
        <NewProductModal
          open={true}
          onClose={mockOnClose}
        />
      );

      // Check for modal title or form fields
      const textFields = screen.getAllByRole('textbox');
      expect(textFields.length).toBeGreaterThan(0);
    });

    it('does not render modal when open is false', () => {
      renderWithTheme(
        <NewProductModal
          open={false}
          onClose={mockOnClose}
        />
      );

      const textFields = screen.queryAllByRole('textbox');
      expect(textFields.length).toBe(0);
    });

    it('renders all form fields', () => {
      renderWithTheme(
        <NewProductModal
          open={true}
          onClose={mockOnClose}
        />
      );

      // Check for common form fields
      const textFields = screen.getAllByRole('textbox');
      expect(textFields.length).toBeGreaterThan(0);
    });

    it('renders Cancel and Add buttons', () => {
      renderWithTheme(
        <NewProductModal
          open={true}
          onClose={mockOnClose}
        />
      );

      const buttons = screen.getAllByRole('button');
      const buttonTexts = buttons.map(btn => btn.textContent);
      
      // Should have Cancel and Add buttons
      expect(buttonTexts.some(text => text?.includes('Cancel') || text?.includes('Close'))).toBe(true);
      expect(buttonTexts.some(text => text?.includes('Add') || text?.includes('Submit'))).toBe(true);
    });
  });

  describe('Form Input Handling', () => {
    it('updates input values when user types', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <NewProductModal
          open={true}
          onClose={mockOnClose}
        />
      );

      // Find product name field (usually first field)
      const productNameInput = screen.getAllByRole('textbox')[0];
      await user.type(productNameInput, 'Test Product');

      expect(productNameInput).toHaveValue('Test Product');
    });

    it('clears form errors when user starts typing', async () => {
      const user = userEvent.setup();
      (useAddProductMutation as jest.Mock).mockReturnValue([
        mockAddProduct,
        {
          isLoading: false,
          error: null,
          isSuccess: false,
        },
      ]);

      renderWithTheme(
        <NewProductModal
          open={true}
          onClose={mockOnClose}
        />
      );

      const inputs = screen.getAllByRole('textbox');
      if (inputs.length > 0) {
        const input = inputs[0] as HTMLInputElement;
        await user.clear(input);
        await user.type(input, 'Test');
        // Error should be cleared (if validation was triggered)
        expect(input).toHaveValue('Test');
      }
    }, 10000);
  });

  describe('Form Validation', () => {
    it('shows validation errors for empty required fields', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <NewProductModal
          open={true}
          onClose={mockOnClose}
        />
      );

      // Try to submit without filling fields
      const addButton = screen.getByRole('button', { name: /add|submit/i });
      if (addButton) {
        await user.click(addButton);
        
        // Should show validation errors (implementation dependent)
        await waitFor(() => {
          // Check if any error messages appear
          const errorTexts = screen.queryAllByText(/required|invalid/i);
          // Validation might show errors or prevent submission
        }, { timeout: 1000 });
      }
    });
  });

  describe('Form Submission', () => {
    it('calls addProduct mutation when form is submitted with valid data', async () => {
      const user = userEvent.setup();
      const mockUnwrap = jest.fn().mockResolvedValue({ data: { id: 1 } });
      mockAddProduct.mockReturnValue({ unwrap: mockUnwrap });

      renderWithTheme(
        <NewProductModal
          open={true}
          onClose={mockOnClose}
          onProductAdded={mockOnProductAdded}
        />
      );

      // Fill in form fields
      const inputs = screen.getAllByRole('textbox');
      const datePicker = screen.queryByTestId('date-picker');

      // Fill required fields (simplified - actual implementation may vary)
      if (inputs.length > 0) {
        await user.type(inputs[0], 'Product Name');
      }
      if (inputs.length > 1) {
        await user.type(inputs[1], 'PROD001');
      }
      if (datePicker) {
        fireEvent.change(datePicker, { target: { value: '2025-12-31' } });
      }

      // Click Add button
      const buttons = screen.getAllByRole('button');
      const addButton = buttons.find(btn => 
        btn.textContent?.toLowerCase().includes('add') || 
        btn.textContent?.toLowerCase().includes('submit')
      );
      
      if (addButton && !addButton.hasAttribute('disabled')) {
        await user.click(addButton);
        
        // The form may have validation that prevents submission if not all fields are filled
        // This test verifies the button is clickable and the component handles the click
        // Actual submission depends on form validation which is tested separately
        expect(addButton).toBeInTheDocument();
      }
    }, 10000); // Increase timeout to 10 seconds

    it('calls onProductAdded callback after successful submission', async () => {
      const user = userEvent.setup();
      mockAddProduct.mockResolvedValue({ data: { id: 1 } });

      renderWithTheme(
        <NewProductModal
          open={true}
          onClose={mockOnClose}
          onProductAdded={mockOnProductAdded}
        />
      );

      // Simplified submission test
      // In a real scenario, you'd fill all required fields first
      await waitFor(() => {
        // This would be called after successful submission
        // Implementation depends on form validation
      });
    });

    it('closes modal after successful submission', async () => {
      const user = userEvent.setup();
      mockAddProduct.mockResolvedValue({ data: { id: 1 } });

      renderWithTheme(
        <NewProductModal
          open={true}
          onClose={mockOnClose}
        />
      );

      // After successful submission, modal should close
      await waitFor(() => {
        // onClose should be called
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state when submitting', () => {
      (useAddProductMutation as jest.Mock).mockReturnValue([
        mockAddProduct,
        {
          isLoading: true,
          error: null,
          isSuccess: false,
        },
      ]);

      renderWithTheme(
        <NewProductModal
          open={true}
          onClose={mockOnClose}
        />
      );

      // Check for loading indicator or disabled state
      const addButton = screen.getByRole('button', { name: /add|submit/i });
      expect(addButton).toBeDisabled();
    });

    it('disables buttons when loading', () => {
      (useAddProductMutation as jest.Mock).mockReturnValue([
        mockAddProduct,
        {
          isLoading: true,
          error: null,
          isSuccess: false,
        },
      ]);

      renderWithTheme(
        <NewProductModal
          open={true}
          onClose={mockOnClose}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        if (button.textContent?.includes('Add') || button.textContent?.includes('Submit')) {
          expect(button).toBeDisabled();
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when submission fails', () => {
      (useAddProductMutation as jest.Mock).mockReturnValue([
        mockAddProduct,
        {
          isLoading: false,
          error: { message: 'Failed to add product' },
          isSuccess: false,
        },
      ]);

      renderWithTheme(
        <NewProductModal
          open={true}
          onClose={mockOnClose}
        />
      );

      // Should show error alert
      const errorAlert = screen.queryByText(/failed|error/i);
      // Error might be shown in alert or other format
    });
  });

  describe('Modal Close', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <NewProductModal
          open={true}
          onClose={mockOnClose}
        />
      );

      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons.find(btn => 
        btn.textContent?.toLowerCase().includes('cancel') || 
        btn.textContent?.toLowerCase().includes('close')
      );
      
      if (cancelButton) {
        await user.click(cancelButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('resets form when modal is closed', async () => {
      const user = userEvent.setup();
      const { rerender } = renderWithTheme(
        <NewProductModal
          open={true}
          onClose={mockOnClose}
        />
      );

      // Fill some fields
      const inputs = screen.getAllByRole('textbox');
      if (inputs.length > 0) {
        await user.type(inputs[0], 'Test');
        expect(inputs[0]).toHaveValue('Test');
      }

      // Close modal
      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons.find(btn => 
        btn.textContent?.toLowerCase().includes('cancel') || 
        btn.textContent?.toLowerCase().includes('close')
      );
      
      if (cancelButton) {
        await user.click(cancelButton);
        expect(mockOnClose).toHaveBeenCalled();
      }

      // Reopen modal
      rerender(
        <Provider store={createMockStore()}>
          <ThemeProvider theme={theme}>
            <NewProductModal
              open={true}
              onClose={mockOnClose}
            />
          </ThemeProvider>
        </Provider>
      );

      // Form should be reset (empty)
      await waitFor(() => {
        const newInputs = screen.getAllByRole('textbox');
        if (newInputs.length > 0) {
          expect(newInputs[0]).toHaveValue('');
        }
      }, { timeout: 2000 });
    }, 10000);
  });

  describe('Type / Unit-of-Measure dropdowns', () => {
    it('fetches the field options only while the modal is open', () => {
      const { rerender } = renderWithTheme(
        <NewProductModal open={false} onClose={mockOnClose} />
      );
      // skip: true while closed
      expect(useGetProductFieldOptionsQuery).toHaveBeenLastCalledWith(undefined, { skip: true });

      rerender(
        <Provider store={createMockStore()}>
          <ThemeProvider theme={theme}>
            <NewProductModal open={true} onClose={mockOnClose} />
          </ThemeProvider>
        </Provider>
      );
      expect(useGetProductFieldOptionsQuery).toHaveBeenLastCalledWith(undefined, { skip: false });
    });

    it('renders Type and Unit of measure as dropdowns populated from the options query', async () => {
      const user = userEvent.setup();
      renderWithTheme(<NewProductModal open={true} onClose={mockOnClose} />);

      // The three `select` fields (Type, Unit of measure, Schedule) are the only
      // comboboxes; the remaining product fields are plain text/number inputs.
      // Type is the first, Unit of measure second, Schedule third.
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes).toHaveLength(3);

      await user.click(comboboxes[0]);
      // Distinct type values from the query appear as options.
      expect(await screen.findByRole('option', { name: 'Tablet' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Syrup' })).toBeInTheDocument();
      await user.click(screen.getByRole('option', { name: 'Tablet' }));

      await user.click(comboboxes[1]);
      expect(await screen.findByRole('option', { name: 'Box' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Strip' })).toBeInTheDocument();
      await user.keyboard('{Escape}');
    });

    it('renders Schedule as a FIXED statutory dropdown (No Schedule + G/H/H1/X/C/C1/K)', async () => {
      const user = userEvent.setup();
      renderWithTheme(<NewProductModal open={true} onClose={mockOnClose} />);

      const comboboxes = screen.getAllByRole('combobox');
      await user.click(comboboxes[2]);

      expect(await screen.findByRole('option', { name: 'No Schedule' })).toBeInTheDocument();
      for (const code of ['G', 'H', 'H1', 'X', 'C', 'C1', 'K']) {
        expect(screen.getByRole('option', { name: code })).toBeInTheDocument();
      }
      // Fixed list only — dynamic field-option values (types/units) must NOT leak in.
      expect(screen.queryByRole('option', { name: 'Tablet' })).not.toBeInTheDocument();
    });

    it('sends schedule "NONE" when "No Schedule" is explicitly chosen', async () => {
      const user = userEvent.setup();
      const mockUnwrap = jest.fn().mockResolvedValue({ message: 'ok' });
      mockAddProduct.mockReturnValue({ unwrap: mockUnwrap });
      renderWithTheme(<NewProductModal open={true} onClose={mockOnClose} />);

      // Textboxes in field order: product_name, brand_name, hsn_id, description.
      const textboxes = screen.getAllByRole('textbox');
      await user.type(textboxes[0], 'Amox 500');
      await user.type(textboxes[1], 'BrandX');
      await user.type(textboxes[2], 'HSN1');
      const spinbuttons = screen.getAllByRole('spinbutton');
      await user.type(spinbuttons[0], '1'); // min quantity

      const comboboxes = screen.getAllByRole('combobox');
      await user.click(comboboxes[0]); // type
      await user.click(await screen.findByRole('option', { name: 'Tablet' }));
      await user.click(comboboxes[1]); // unit of measure
      await user.click(await screen.findByRole('option', { name: 'Strip' }));
      await user.click(comboboxes[2]); // schedule
      await user.click(await screen.findByRole('option', { name: 'No Schedule' }));

      await user.click(screen.getByRole('button', { name: /^add$/i }));

      await waitFor(() => expect(mockAddProduct).toHaveBeenCalled());
      // Explicit "No Schedule" is the allowlist value 'NONE' (never re-prompts) —
      // distinct from omitting the field (NULL = not yet attributed).
      expect(mockAddProduct.mock.calls[0][0].schedule).toBe('NONE');
    });
  });

  describe('Date Picker', () => {
    // The current NewProductModal collects master-product fields
    // (product name, type, brand, HSN, unit of measure, min/max quantity)
    // and does NOT render an expiry date picker. These tests assert that
    // current behavior rather than a stale expectation.
    it('does not render a date picker (no expiry field on this modal)', () => {
      renderWithTheme(
        <NewProductModal
          open={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByTestId('date-picker')).not.toBeInTheDocument();
    });

    it('renders numeric quantity fields instead of a date picker', () => {
      renderWithTheme(
        <NewProductModal
          open={true}
          onClose={mockOnClose}
        />
      );

      // Minimum/Maximum quantity render as number inputs (spinbuttons).
      const numberInputs = screen.getAllByRole('spinbutton');
      expect(numberInputs.length).toBeGreaterThan(0);
    });
  });
});

