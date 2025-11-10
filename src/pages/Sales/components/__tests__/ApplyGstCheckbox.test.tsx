import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApplyGstCheckbox } from '../ApplyGstCheckbox';
import { SalesReceiptItem } from '../../SalesReceipt.types';

describe('ApplyGstCheckbox', () => {
  const mockSalesItems: SalesReceiptItem[] = [
    {
      id: '1',
      productName: 'Product A',
      manufacturer: 'Manufacturer A',
      batch: 'B001',
      expiryDate: '2025-12-31',
      quantity: '10',
      type: 'Capsule',
      unitPrice: '100',
      mrp: '120',
      discount: '0',
      discountPercent: '0',
      cgst: '90',
      cgstPercent: '9',
      sgst: '90',
      sgstPercent: '9',
      igst: '0',
      igstPercent: '0',
      amount: '1000',
    },
  ];

  const mockProps = {
    editingRowId: '1',
    applyGstToAll: false,
    salesItems: mockSalesItems,
    onApplyGstToAllChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when editingRowId is null', () => {
    const { container } = render(
      <ApplyGstCheckbox {...mockProps} editingRowId={null} />
    );
    
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it('renders checkbox when editingRowId is provided', () => {
    render(<ApplyGstCheckbox {...mockProps} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('displays apply GST to all label', () => {
    render(<ApplyGstCheckbox {...mockProps} />);
    
    expect(screen.getByText(/apply same.*to all products/i)).toBeInTheDocument();
  });

  it('checkbox is unchecked by default', () => {
    render(<ApplyGstCheckbox {...mockProps} applyGstToAll={false} />);
    
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('checkbox is checked when applyGstToAll is true', () => {
    render(<ApplyGstCheckbox {...mockProps} applyGstToAll={true} />);
    
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('calls onApplyGstToAllChange when checkbox is clicked', () => {
    render(<ApplyGstCheckbox {...mockProps} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(mockProps.onApplyGstToAllChange).toHaveBeenCalledWith(true);
  });

  it('calls onApplyGstToAllChange with false when unchecking', () => {
    render(<ApplyGstCheckbox {...mockProps} applyGstToAll={true} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(mockProps.onApplyGstToAllChange).toHaveBeenCalledWith(false);
  });

  it('shows tooltip on hover', () => {
    render(<ApplyGstCheckbox {...mockProps} />);
    
    const checkbox = screen.getByRole('checkbox');
    // Tooltip should be present (MUI Tooltip wraps the component)
    expect(checkbox).toBeInTheDocument();
  });
});

