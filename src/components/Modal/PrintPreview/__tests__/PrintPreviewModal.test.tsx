import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PrintPreviewModal from '../PrintPreviewModal';

// Mock html2pdf
jest.mock('html2pdf.js', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    set: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    save: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('PrintPreviewModal', () => {
  const mockSalesItems = [
    {
      id: '1',
      productName: 'Product A',
      batch: 'B001',
      quantity: '10',
      type: 'Capsule',
      unitPrice: '100',
      discountPercent: '5',
      cgstPercent: '9',
      sgstPercent: '9',
      igstPercent: '0',
      amount: '950',
    },
  ];

  const mockProps = {
    salesItems: mockSalesItems,
    customerName: 'John Doe',
    customerMobile: '1234567890',
    customerCity: 'Mumbai',
    doctorName: 'Dr. Smith',
    doctorMobile: '9876543210',
    doctorEmail: 'doctor@example.com',
    paymentMode: 'Cash',
    insuranceCompany: 'ABC Insurance',
    invoiceNumber: 'INV001',
    invoiceDate: '01/01/2024',
    totalValue: '1000',
    totalDiscount: '50',
    taxAmount: '180',
    totalPayableAmount: '1130',
    onCancel: jest.fn(),
    onPrint: jest.fn(),
    onSaveClick: jest.fn(),
    hideActionButtons: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders print preview with all details', () => {
    render(<PrintPreviewModal {...mockProps} />);
    
    expect(screen.getByText(/customer receipt/i)).toBeInTheDocument();
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    expect(screen.getByText(/1234567890/i)).toBeInTheDocument();
    expect(screen.getByText(/mumbai/i)).toBeInTheDocument();
  });

  it('displays customer details section', () => {
    render(<PrintPreviewModal {...mockProps} />);
    
    expect(screen.getByText(/customer details/i)).toBeInTheDocument();
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
  });

  it('displays doctor details section', () => {
    render(<PrintPreviewModal {...mockProps} />);
    
    expect(screen.getByText(/doctor details/i)).toBeInTheDocument();
    expect(screen.getByText(/dr\. smith/i)).toBeInTheDocument();
  });

  it('displays payment details section', () => {
    render(<PrintPreviewModal {...mockProps} />);
    
    expect(screen.getByText(/payment details/i)).toBeInTheDocument();
    expect(screen.getByText(/cash/i)).toBeInTheDocument();
  });

  it('displays invoice details section', () => {
    render(<PrintPreviewModal {...mockProps} />);
    
    expect(screen.getByText(/invoice details/i)).toBeInTheDocument();
    expect(screen.getByText(/inv001/i)).toBeInTheDocument();
  });

  it('displays sales items in table', () => {
    render(<PrintPreviewModal {...mockProps} />);
    
    expect(screen.getByText(/product a/i)).toBeInTheDocument();
    // Quantity "10" appears in multiple places, use getAllByText and find the one in the table row
    const quantityElements = screen.getAllByText(/^10$/);
    expect(quantityElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/capsule/i)).toBeInTheDocument();
  });

  it('displays financial summary', () => {
    render(<PrintPreviewModal {...mockProps} />);
    
    expect(screen.getByText(/total value/i)).toBeInTheDocument();
    // "1000" appears in multiple places, use getAllByText and verify at least one exists
    const totalValueElements = screen.getAllByText(/1000/);
    expect(totalValueElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/total discount/i)).toBeInTheDocument();
    // "50" appears in multiple places (discount percentage, phone numbers), use getAllByText
    const discountElements = screen.getAllByText(/^50$/);
    expect(discountElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/tax amount/i)).toBeInTheDocument();
    expect(screen.getByText(/180/i)).toBeInTheDocument();
    expect(screen.getByText(/total payable/i)).toBeInTheDocument();
    expect(screen.getByText(/1130/i)).toBeInTheDocument();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    render(<PrintPreviewModal {...mockProps} />);
    
    const cancelButton = screen.getByText(/cancel/i);
    fireEvent.click(cancelButton);
    
    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onPrint when Print button is clicked', () => {
    render(<PrintPreviewModal {...mockProps} />);
    
    const printButton = screen.getByText(/print/i);
    fireEvent.click(printButton);
    
    expect(mockProps.onPrint).toHaveBeenCalledTimes(1);
  });

  it('calls onSaveClick when Save button is clicked', () => {
    render(<PrintPreviewModal {...mockProps} />);
    
    const saveButton = screen.getByText(/save/i);
    fireEvent.click(saveButton);
    
    expect(mockProps.onSaveClick).toHaveBeenCalledTimes(1);
  });

  it('hides action buttons when hideActionButtons is true', () => {
    render(<PrintPreviewModal {...mockProps} hideActionButtons={true} />);
    
    expect(screen.queryByText(/cancel/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/save/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/print/i)).not.toBeInTheDocument();
  });

  it('handles empty sales items', () => {
    render(<PrintPreviewModal {...mockProps} salesItems={[]} />);
    
    expect(screen.getByText(/customer receipt/i)).toBeInTheDocument();
  });

  it('handles missing optional fields', () => {
    render(
      <PrintPreviewModal
        {...mockProps}
        customerCity=""
        doctorEmail=""
        insuranceCompany=""
      />
    );
    
    expect(screen.getByText(/customer receipt/i)).toBeInTheDocument();
  });

  it('displays all table columns for items', () => {
    render(<PrintPreviewModal {...mockProps} />);
    
    // "Product" appears as both header and product name, use getAllByText
    const productElements = screen.getAllByText(/product/i);
    expect(productElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/qty/i)).toBeInTheDocument();
    expect(screen.getByText(/type/i)).toBeInTheDocument();
    expect(screen.getByText(/batch/i)).toBeInTheDocument();
    expect(screen.getByText(/price/i)).toBeInTheDocument();
    // "Disc" appears in both table header and "Total Discount", use getAllByText
    const discElements = screen.getAllByText(/disc/i);
    expect(discElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/cgst/i)).toBeInTheDocument();
    expect(screen.getByText(/sgst/i)).toBeInTheDocument();
    expect(screen.getByText(/igst/i)).toBeInTheDocument();
    expect(screen.getByText(/amt/i)).toBeInTheDocument();
  });
});

