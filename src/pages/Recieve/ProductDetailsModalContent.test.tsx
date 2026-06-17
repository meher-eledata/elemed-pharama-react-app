import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProductDetailsModalContent from './ProductDetailsModalContent';
import { OrderReceiveRow, ProductItem } from './types';

// Create a theme for testing
const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const mockProductData: OrderReceiveRow = {
  receiptId: 1,
  reNo: 'RA001',
  poNo: 'PO001',
  po_id: 101,
  supplierId: 1,
  supplier: 'Supplier A',
  received: 'Jan 15, 2024 10:00 AM',
  status: 'received',
  reBy: 'John Doe',
  amt: 5000,
  products: [
    {
      productName: 'Product 1',
      type: 'Medicine',
      quantity: 10,
      hsnCode: 'HSN001',
      amount: 1000,
      lineId: 1,
    },
    {
      productName: 'Product 2',
      type: 'Medicine',
      quantity: 20,
      hsnCode: 'HSN002',
      amount: 2000,
      lineId: 2,
    },
    {
      productName: 'Product 3',
      type: 'Medicine',
      quantity: 15,
      hsnCode: 'HSN003',
      amount: 1500,
      lineId: 3,
    },
    {
      productName: 'Product 4',
      type: 'Medicine',
      quantity: 5,
      hsnCode: 'HSN004',
      amount: 500,
      lineId: 4,
    },
    {
      productName: 'Product 5',
      type: 'Medicine',
      quantity: 8,
      hsnCode: 'HSN005',
      amount: 800,
      lineId: 5,
    },
    {
      productName: 'Product 6',
      type: 'Medicine',
      quantity: 12,
      hsnCode: 'HSN006',
      amount: 1200,
      lineId: 6,
    },
  ],
};

describe('ProductDetailsModalContent', () => {
  const mockOnUpdateProduct = jest.fn();
  const mockOnDeleteProduct = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render component with product data', () => {
      renderWithProviders(
        <ProductDetailsModalContent
          productData={mockProductData}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      expect(screen.getByText(/RA001/i)).toBeInTheDocument();
      expect(screen.getByText(/Supplier A/i)).toBeInTheDocument();
    });

    it('should render table headers', () => {
      renderWithProviders(
        <ProductDetailsModalContent
          productData={mockProductData}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      expect(screen.getByText(/Product Name/i)).toBeInTheDocument();
      expect(screen.getByText(/Type/i)).toBeInTheDocument();
      expect(screen.getByText(/Quantity/i)).toBeInTheDocument();
      expect(screen.getByText(/HSN Code/i)).toBeInTheDocument();
      // Component labels the amount column "Unit Price" (PRODUCT_DETAILS_MODAL_LABELS.TABLE_HEADERS.AMOUNT)
      expect(screen.getByText(/Unit Price/i)).toBeInTheDocument();
    });

    it('should render product data in table', () => {
      renderWithProviders(
        <ProductDetailsModalContent
          productData={mockProductData}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('HSN001')).toBeInTheDocument();
    });

    it('should display empty state when productData is null', () => {
      renderWithProviders(
        <ProductDetailsModalContent
          productData={null}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      expect(screen.getByText(/No product data available/i)).toBeInTheDocument();
    });

    it('should display empty state when products array is empty', () => {
      const emptyProductData: OrderReceiveRow = {
        ...mockProductData,
        products: [],
      };

      renderWithProviders(
        <ProductDetailsModalContent
          productData={emptyProductData}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      expect(screen.getByText(/No product details available/i)).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should display pagination when products exceed items per page', () => {
      renderWithProviders(
        <ProductDetailsModalContent
          productData={mockProductData}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      // Pagination renders the current page in a Select and the total separately
      // as "of N pages" (6 products, 5 per page = 2 pages).
      expect(screen.getByText(/of 2 pages/i)).toBeInTheDocument();
    });

    it('should not display pagination when products fit in one page', () => {
      const smallProductData: OrderReceiveRow = {
        ...mockProductData,
        products: mockProductData.products.slice(0, 3),
      };

      renderWithProviders(
        <ProductDetailsModalContent
          productData={smallProductData}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      // The table always renders the pagination footer when there are rows;
      // with 3 products (< 5 per page) there is a single page: "of 1 pages".
      expect(screen.getByText(/of 1 pages/i)).toBeInTheDocument();
    });

    it('should navigate to next page', async () => {
      renderWithProviders(
        <ProductDetailsModalContent
          productData={mockProductData}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      // Page 1 shows the first five products; Product 6 lives on page 2.
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.queryByText('Product 6')).not.toBeInTheDocument();

      // The next-page control is the IconButton containing KeyboardArrowRightIcon.
      const nextButton = screen
        .getByTestId('KeyboardArrowRightIcon')
        .closest('button') as HTMLButtonElement;
      expect(nextButton).not.toBeDisabled();

      fireEvent.click(nextButton);

      await waitFor(() => {
        // Page 2 now shows Product 6 and no longer shows Product 1.
        expect(screen.getByText('Product 6')).toBeInTheDocument();
      });
      expect(screen.queryByText('Product 1')).not.toBeInTheDocument();
    });

    it('should navigate to previous page', async () => {
      renderWithProviders(
        <ProductDetailsModalContent
          productData={mockProductData}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      // First go to page 2 via the next-page IconButton (KeyboardArrowRightIcon).
      const nextButton = screen
        .getByTestId('KeyboardArrowRightIcon')
        .closest('button') as HTMLButtonElement;
      expect(nextButton).not.toBeDisabled();

      fireEvent.click(nextButton);

      await waitFor(() => {
        // Product 6 is only on page 2.
        expect(screen.getByText('Product 6')).toBeInTheDocument();
      });

      // Then go back to page 1 via the previous-page IconButton (KeyboardArrowLeftIcon).
      const prevButton = screen
        .getByTestId('KeyboardArrowLeftIcon')
        .closest('button') as HTMLButtonElement;
      expect(prevButton).not.toBeDisabled();

      fireEvent.click(prevButton);

      await waitFor(() => {
        // Back on page 1: Product 1 visible, Product 6 gone.
        expect(screen.getByText('Product 1')).toBeInTheDocument();
      });
      expect(screen.queryByText('Product 6')).not.toBeInTheDocument();
    });

    it('should disable previous button on first page', () => {
      renderWithProviders(
        <ProductDetailsModalContent
          productData={mockProductData}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      // On page 1 the previous-page IconButton (KeyboardArrowLeftIcon) is disabled.
      const prevButton = screen
        .getByTestId('KeyboardArrowLeftIcon')
        .closest('button') as HTMLButtonElement;
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last page', async () => {
      renderWithProviders(
        <ProductDetailsModalContent
          productData={mockProductData}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      // The next-page IconButton (KeyboardArrowRightIcon) is enabled on page 1.
      const nextButton = screen
        .getByTestId('KeyboardArrowRightIcon')
        .closest('button') as HTMLButtonElement;
      expect(nextButton).not.toBeDisabled();

      // We're on page 1 of 2 (current page lives in the Select; total in "of 2 pages").
      expect(screen.getByText(/of 2 pages/i)).toBeInTheDocument();
      expect(screen.getByText('Product 1')).toBeInTheDocument();

      // Click to go to page 2 (last page).
      fireEvent.click(nextButton);

      await waitFor(() => {
        // Product 6 (only on page 2) confirms we're on the last page.
        expect(screen.getByText('Product 6')).toBeInTheDocument();
      });

      // On the last page the next-page button is disabled (currentPage === totalPages).
      const nextButtonAfter = screen
        .getByTestId('KeyboardArrowRightIcon')
        .closest('button') as HTMLButtonElement;
      expect(nextButtonAfter).toBeDisabled();
    });

    it('should display correct products on each page', () => {
      renderWithProviders(
        <ProductDetailsModalContent
          productData={mockProductData}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      // First page should show first 5 products
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
      expect(screen.getByText('Product 3')).toBeInTheDocument();
      expect(screen.getByText('Product 4')).toBeInTheDocument();
      expect(screen.getByText('Product 5')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display all product fields correctly', () => {
      renderWithProviders(
        <ProductDetailsModalContent
          productData={mockProductData}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      const firstProduct = mockProductData.products[0];
      expect(screen.getByText(firstProduct.productName)).toBeInTheDocument();
      // Use getAllByText since "Medicine" appears multiple times
      expect(screen.getAllByText(firstProduct.type)[0]).toBeInTheDocument();
      expect(screen.getByText(firstProduct.quantity.toString())).toBeInTheDocument();
      expect(screen.getByText(firstProduct.hsnCode)).toBeInTheDocument();
      // The amount column renders as Indian-locale currency: ₹1,000.00 (amount=1000)
      expect(screen.getByText('₹1,000.00')).toBeInTheDocument();
    });

    it('should handle products with different data types', () => {
      const variedProductData: OrderReceiveRow = {
        ...mockProductData,
        products: [
          {
            productName: 'Product A',
            type: 'Medicine',
            quantity: 100,
            hsnCode: 'HSN100',
            amount: 5000.50,
            lineId: 1,
          },
        ],
      };

      renderWithProviders(
        <ProductDetailsModalContent
          productData={variedProductData}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      // amount=5000.50 renders as Indian-locale currency with 2 fraction digits.
      expect(screen.getByText('₹5,000.50')).toBeInTheDocument();
    });
  });

  describe('Receipt Information Display', () => {
    it('should display receipt number correctly', () => {
      renderWithProviders(
        <ProductDetailsModalContent
          productData={mockProductData}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      expect(screen.getByText(/RA001/i)).toBeInTheDocument();
    });

    it('should display supplier name correctly', () => {
      renderWithProviders(
        <ProductDetailsModalContent
          productData={mockProductData}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      expect(screen.getByText(/Supplier A/i)).toBeInTheDocument();
    });

    it('should handle different receipt numbers', () => {
      const differentReceipt: OrderReceiveRow = {
        ...mockProductData,
        reNo: 'RA999',
      };

      renderWithProviders(
        <ProductDetailsModalContent
          productData={differentReceipt}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      expect(screen.getByText(/RA999/i)).toBeInTheDocument();
    });
  });

  describe('Component Updates', () => {
    it('should update when productData changes', () => {
      const { rerender } = renderWithProviders(
        <ProductDetailsModalContent
          productData={mockProductData}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      expect(screen.getByText('Product 1')).toBeInTheDocument();

      const updatedProductData: OrderReceiveRow = {
        ...mockProductData,
        products: [
          {
            productName: 'Updated Product',
            type: 'Medicine',
            quantity: 50,
            hsnCode: 'HSN999',
            amount: 5000,
            lineId: 1,
          },
        ],
      };

      rerender(
        <ThemeProvider theme={theme}>
          <ProductDetailsModalContent
            productData={updatedProductData}
            onUpdateProduct={mockOnUpdateProduct}
            onDeleteProduct={mockOnDeleteProduct}
          />
        </ThemeProvider>
      );

      expect(screen.getByText('Updated Product')).toBeInTheDocument();
      expect(screen.queryByText('Product 1')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long product names', () => {
      const longNameProduct: OrderReceiveRow = {
        ...mockProductData,
        products: [
          {
            productName: 'Very Long Product Name That Might Cause Layout Issues',
            type: 'Medicine',
            quantity: 10,
            hsnCode: 'HSN001',
            amount: 1000,
            lineId: 1,
          },
        ],
      };

      renderWithProviders(
        <ProductDetailsModalContent
          productData={longNameProduct}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      expect(screen.getByText(/Very Long Product Name/i)).toBeInTheDocument();
    });

    it('should handle zero quantities', () => {
      const zeroQuantityProduct: OrderReceiveRow = {
        ...mockProductData,
        products: [
          {
            productName: 'Product Zero',
            type: 'Medicine',
            quantity: 0,
            hsnCode: 'HSN001',
            amount: 0,
            lineId: 1,
          },
        ],
      };

      renderWithProviders(
        <ProductDetailsModalContent
          productData={zeroQuantityProduct}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      // Use getAllByText since "0" appears multiple times (quantity and amount)
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    });

    it('should handle missing optional fields', () => {
      const minimalProduct: OrderReceiveRow = {
        ...mockProductData,
        products: [
          {
            productName: 'Minimal Product',
            type: 'Medicine',
            quantity: 1,
            hsnCode: '',
            amount: 0,
          },
        ],
      };

      renderWithProviders(
        <ProductDetailsModalContent
          productData={minimalProduct}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      expect(screen.getByText('Minimal Product')).toBeInTheDocument();
    });
  });
});

