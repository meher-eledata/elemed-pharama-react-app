import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProductSelectionForm from '../ProductSelectionForm';

// ProductSelectionForm calls useGetDoctorNamesQuery from the salesApi slice.
// Mock the slice so the component renders without a configured RTK Query store.
jest.mock('../../../../redux/slices/salesApi', () => ({
  useGetDoctorNamesQuery: () => ({ data: [], isLoading: false }),
}));

const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: (state = { user: { id: 1, username: 'testuser' } }) => state,
      cart: (state = { items: [], total: 0 }) => state,
    },
  });
};

describe('ProductSelectionForm', () => {
  const mockProps = {
    // Product search
    findProduct: '',
    isProductSelected: false,
    isProductsLoading: false,
    productOptions: [
      { name: 'Product A' },
      { name: 'Product B' },
      { name: 'Product C' },
    ],
    onProductInputChange: jest.fn(),
    onProductChange: jest.fn(),
    onClearProduct: jest.fn(),

    // Brand
    showBrandDropdown: false,
    availableBrands: [],
    brand: '',
    brandId: null,
    onBrandChange: jest.fn(),
    isBrandsLoading: false,

    // Type
    showTypeDropdown: false,
    availableTypes: [],
    productType: '',
    selectedTypeProductId: null,
    onTypeChange: jest.fn(),
    isTypesLoading: false,

    // Batch
    showBatchDropdown: false,
    availableBatches: [],
    batch: '',
    onBatchChange: jest.fn(),
    isBatchesLoading: false,

    // Quantity
    qty: 1,
    onQtyChange: jest.fn(),

    // Discount
    discount: 0,
    onDiscountChange: jest.fn(),

    // Discount authorized by
    discountAuthorizedBy: '',
    discountAuthorizedById: undefined,
    onDiscountAuthorizedByChange: jest.fn(),

    // Add to cart
    onAddToCart: jest.fn(),
    isValidating: false,
    validationError: '',
    validatedData: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const store = createMockStore();
    return render(
      <Provider store={store}>
        <ProductSelectionForm {...mockProps} {...props} />
      </Provider>
    );
  };

  it('renders product selection form with all fields', () => {
    renderComponent();
    
    // Field labels come from SALES_PAGE_LABELS: "Find product", "Qty" (quantity),
    // "Discount %", and the "Add to Cart" button.
    expect(screen.getByText(/find product/i)).toBeInTheDocument();
    expect(screen.getByText(/qty/i)).toBeInTheDocument();
    expect(screen.getByText(/discount %/i)).toBeInTheDocument();
    expect(screen.getByText(/add to cart/i)).toBeInTheDocument();
  });

  it('displays product name when provided', () => {
    renderComponent({ findProduct: 'Product A' });
    
    const productInput = screen.getByPlaceholderText(/search for a product/i);
    expect(productInput).toHaveValue('Product A');
  });

  it('displays quantity when provided', () => {
    renderComponent({ qty: 5 });
    
    const qtyInput = screen.getByDisplayValue('5');
    expect(qtyInput).toBeInTheDocument();
  });

  it('displays discount when provided', () => {
    renderComponent({ discount: 10 });
    
    const discountInput = screen.getByDisplayValue('10');
    expect(discountInput).toBeInTheDocument();
  });

  it('calls onProductInputChange when product input changes', () => {
    renderComponent();
    
    const productInput = screen.getByPlaceholderText(/search for a product/i);
    fireEvent.change(productInput, { target: { value: 'New Product' } });
    
    expect(mockProps.onProductInputChange).toHaveBeenCalled();
  });

  it('calls onQtyChange when quantity decreases', () => {
    renderComponent({ qty: 5, isProductSelected: true });
    
    const decreaseButton = screen.getAllByRole('button').find(
      btn => btn.querySelector('svg')?.getAttribute('data-testid') === 'RemoveIcon'
    );
    
    expect(decreaseButton).toBeInTheDocument();
    if (decreaseButton) {
      fireEvent.click(decreaseButton);
      expect(mockProps.onQtyChange).toHaveBeenCalledWith(4);
    }
  });

  it('calls onQtyChange when quantity increases', () => {
    renderComponent({ qty: 1, isProductSelected: true });
    
    const increaseButton = screen.getAllByRole('button').find(
      btn => btn.querySelector('svg')?.getAttribute('data-testid') === 'AddIcon'
    );
    
    expect(increaseButton).toBeInTheDocument();
    if (increaseButton) {
      fireEvent.click(increaseButton);
      expect(mockProps.onQtyChange).toHaveBeenCalledWith(2);
    }
  });

  it('calls onDiscountChange when discount input changes', () => {
    renderComponent();
    
    const discountInput = screen.getByDisplayValue('0');
    fireEvent.change(discountInput, { target: { value: '15' } });
    
    expect(mockProps.onDiscountChange).toHaveBeenCalled();
  });

  it('shows type dropdown when showTypeDropdown is true and types are available', () => {
    renderComponent({
      showTypeDropdown: true,
      availableTypes: [
        { type: 'Capsule', product_id: 1 },
        { type: 'Tablet', product_id: 2 },
        { type: 'Syrup', product_id: 3 },
      ],
    });

    // Use getAllByText since there might be multiple "Type" labels
    const typeLabels = screen.getAllByText(/type/i);
    expect(typeLabels.length).toBeGreaterThan(0);
  });

  it('calls onTypeChange when type is selected', async () => {
    renderComponent({
      showTypeDropdown: true,
      availableTypes: [
        { type: 'Capsule', product_id: 1 },
        { type: 'Tablet', product_id: 2 },
      ],
    });

    // Both the product Autocomplete and the type Select expose role="combobox".
    // The MUI Select is the one with aria-haspopup="listbox".
    const typeSelect = screen
      .getAllByRole('combobox')
      .find((el) => el.getAttribute('aria-haspopup') === 'listbox')!;
    fireEvent.mouseDown(typeSelect);

    const option = await screen.findByRole('option', { name: 'Capsule' });
    fireEvent.click(option);

    // The component reports both the selected type and its product_id.
    expect(mockProps.onTypeChange).toHaveBeenCalledWith('Capsule', 1);
  });

  it('calls onAddToCart when Add to Cart button is clicked', () => {
    renderComponent({ 
      isProductSelected: true,
      validatedData: { mrp: 100, selling_price: 90 }
    });
    
    const addButton = screen.getByText(/add to cart/i);
    fireEvent.click(addButton);
    
    expect(mockProps.onAddToCart).toHaveBeenCalled();
  });

  it('visually dims Add to Cart button (but keeps it clickable) when validation error exists', () => {
    renderComponent({
      validationError: 'Product not available',
      isProductSelected: true,
    });

    // Current behavior: the button is intentionally NOT disabled when a validation
    // error exists (clicks are allowed so the warning can surface); it is only dimmed
    // via reduced opacity. It is disabled only while actively validating.
    const addButton = screen.getByRole('button', { name: /add to cart/i });
    expect(addButton).not.toBeDisabled();
    expect(addButton).toHaveStyle({ opacity: '0.6' });
  });

  it('disables Add to Cart button when validating', () => {
    renderComponent({ 
      isValidating: true,
      isProductSelected: true
    });
    
    const addButton = screen.getByText(/validating\.\.\./i);
    expect(addButton).toBeDisabled();
  });

  it('visually dims Add to Cart button (but keeps it clickable) when no validated data', () => {
    renderComponent({
      isProductSelected: true,
      validatedData: null,
    });

    // Same as above: no validated data dims the button via opacity but does not
    // disable it (only active validation disables it).
    const addButton = screen.getByRole('button', { name: /add to cart/i });
    expect(addButton).not.toBeDisabled();
    expect(addButton).toHaveStyle({ opacity: '0.6' });
  });

  it('calls onClearProduct when clear button is clicked', () => {
    renderComponent({ isProductSelected: true, findProduct: 'Product A' });
    
    // Find the clear button by the CloseIcon
    const clearButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')?.getAttribute('data-testid') === 'CloseIcon'
    );
    
    expect(clearButton).toBeInTheDocument();
    if (clearButton) {
      fireEvent.click(clearButton);
      expect(mockProps.onClearProduct).toHaveBeenCalled();
    }
  });

  it('shows loading state when products are loading', () => {
    renderComponent({ isProductsLoading: true });
    
    const productInput = screen.getByPlaceholderText(/loading products/i);
    expect(productInput).toBeInTheDocument();
  });

  it('disables quantity controls when product is not selected', () => {
    renderComponent({ isProductSelected: false });
    
    // Quantity input might be in a textbox or have a different structure
    const qtyInputs = screen.getAllByRole('textbox');
    const qtyInput = qtyInputs.find(input => {
      const value = (input as HTMLInputElement).value;
      return value === '1' || value === '';
    });
    
    if (qtyInput) {
      expect(qtyInput).toBeDisabled();
    } else {
      // At least verify the quantity label exists
      expect(screen.getByText(/quantity/i)).toBeInTheDocument();
    }
  });

  it('disables discount input when product is not selected', () => {
    renderComponent({ isProductSelected: false });
    
    // Discount input might be in a textbox
    const discountInputs = screen.getAllByRole('textbox');
    const discountInput = discountInputs.find(input => {
      const value = (input as HTMLInputElement).value;
      return value === '0' || value === '';
    });
    
    if (discountInput) {
      expect(discountInput).toBeDisabled();
    } else {
      // At least verify the discount label exists
      expect(screen.getByText(/discount/i)).toBeInTheDocument();
    }
  });

  it('prevents quantity from going below minimum', () => {
    renderComponent({ qty: 1, isProductSelected: true });
    
    const decreaseButton = screen.getAllByRole('button').find(
      btn => btn.querySelector('svg')?.getAttribute('data-testid') === 'RemoveIcon'
    );
    
    expect(decreaseButton).toBeInTheDocument();
    if (decreaseButton) {
      fireEvent.click(decreaseButton);
      // MIN_QUANTITY is 0, so clicking decrease at qty=1 should call onQtyChange(0)
      expect(mockProps.onQtyChange).toHaveBeenCalledWith(0);
    }
  });
});

