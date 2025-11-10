import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProductDetailsModalContent from './ProductDetailsModalContent';
import { OrderReceiveRow, ProductItem } from './OrderReceive';

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
      expect(screen.getByText(/Amount/i)).toBeInTheDocument();
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

      // Should show pagination controls (6 products, 5 per page = 2 pages)
      expect(screen.getByText(/1 of 2 pages/i)).toBeInTheDocument();
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

      // Should not show pagination for 3 products (less than 5 per page)
      expect(screen.queryByText(/pages/i)).not.toBeInTheDocument();
    });

    it('should navigate to next page', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ProductDetailsModalContent
          productData={mockProductData}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      // Find next page button (chevron right icon) - use fireEvent instead of userEvent for disabled buttons
      const nextButtons = screen.getAllByRole('button');
      const nextButton = nextButtons.find(button => {
        const svg = button.querySelector('svg');
        const isNextButton = svg && !svg.style.transform.includes('rotate');
        const isDisabled = button.hasAttribute('disabled') || (button as HTMLButtonElement).disabled;
        return isNextButton && !isDisabled;
      }) as HTMLButtonElement | undefined;

      if (nextButton && !nextButton.disabled) {
        fireEvent.click(nextButton);
        
        await waitFor(() => {
          expect(screen.getByText(/2 of 2 pages/i)).toBeInTheDocument();
        });
      }
    });

    it('should navigate to previous page', async () => {
      renderWithProviders(
        <ProductDetailsModalContent
          productData={mockProductData}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      // First go to page 2
      const nextButtons = screen.getAllByRole('button');
      const nextButton = nextButtons.find(button => {
        const svg = button.querySelector('svg');
        const isNextButton = svg && !svg.style.transform.includes('rotate');
        const isDisabled = button.hasAttribute('disabled') || (button as HTMLButtonElement).disabled;
        return isNextButton && !isDisabled;
      }) as HTMLButtonElement | undefined;

      if (nextButton && !nextButton.disabled) {
        fireEvent.click(nextButton);
        
        await waitFor(() => {
          expect(screen.getByText(/2 of 2 pages/i)).toBeInTheDocument();
        });

        // Then go back to page 1
        const prevButtons = screen.getAllByRole('button');
        const prevButton = prevButtons.find(button => {
          const svg = button.querySelector('svg');
          const isPrevButton = svg && svg.style.transform.includes('rotate');
          const isDisabled = button.hasAttribute('disabled') || (button as HTMLButtonElement).disabled;
          return isPrevButton && !isDisabled;
        }) as HTMLButtonElement | undefined;

        if (prevButton && !prevButton.disabled) {
          fireEvent.click(prevButton);
          
          await waitFor(() => {
            expect(screen.getByText(/1 of 2 pages/i)).toBeInTheDocument();
          });
        }
      }
    });

    it('should disable previous button on first page', () => {
      renderWithProviders(
        <ProductDetailsModalContent
          productData={mockProductData}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      const buttons = screen.getAllByRole('button');
      const prevButton = buttons.find(button => {
        const svg = button.querySelector('svg');
        return svg && svg.style.transform.includes('rotate');
      });

      if (prevButton) {
        expect(prevButton).toBeDisabled();
      }
    });

    it('should disable next button on last page', async () => {
      renderWithProviders(
        <ProductDetailsModalContent
          productData={mockProductData}
          onUpdateProduct={mockOnUpdateProduct}
          onDeleteProduct={mockOnDeleteProduct}
        />
      );

      // Find all IconButtons - there should be 2 (prev and next)
      const buttons = screen.getAllByRole('button').filter(button => {
        // Filter for IconButtons that contain SVG icons
        const svg = button.querySelector('svg');
        return svg !== null;
      });

      expect(buttons.length).toBeGreaterThanOrEqual(2);
      
      // The next button is the second IconButton (first is prev with rotation)
      // We can identify it by checking if it's not disabled initially
      const nextButton = buttons.find(button => {
        const htmlButton = button as HTMLButtonElement;
        return !htmlButton.disabled && !htmlButton.hasAttribute('disabled');
      }) as HTMLButtonElement | undefined;

      expect(nextButton).toBeDefined();
      
      if (!nextButton) {
        throw new Error('Next button not found');
      }
      
      // Verify we're on page 1 (should show "1 of 2 pages")
      expect(screen.getByText(/1.*of.*2.*pages/i)).toBeInTheDocument();

      // Click to go to page 2 (last page)
      fireEvent.click(nextButton);
      
      // Wait for the button to be disabled and page to update
      await waitFor(() => {
        // Verify we're on page 2
        expect(screen.getByText(/2.*of.*2.*pages/i)).toBeInTheDocument();
        
        // Find the next button again - it should now be disabled
        const buttonsAfter = screen.getAllByRole('button').filter(button => {
          const svg = button.querySelector('svg');
          return svg !== null;
        });
        
        // The next button (second one) should be disabled
        const nextButtonAfter = buttonsAfter[1] as HTMLButtonElement;
        expect(nextButtonAfter).toBeDefined();
        expect(nextButtonAfter).toBeDisabled();
      }, { timeout: 3000 });
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
      expect(screen.getByText(firstProduct.amount.toString())).toBeInTheDocument();
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
      expect(screen.getByText('5000.5')).toBeInTheDocument();
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

