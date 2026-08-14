import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PrintPreviewModal from '../PrintPreviewModal';

// Mock html2pdf (browser-only, errors in jsdom). It is only invoked on a
// save action, but the import is mocked defensively.
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
      manufacturer: 'Acme Labs',
      batch: 'B001',
      quantity: '10',
      type: 'Capsule',
      unitPrice: '100',
      mrp: '120',
      hsn: '3004',
      schedule: 'H1',
      pack: '10x10',
      expiryDate: '2026-12',
      discountPercent: '5',
      cgstPercent: '9',
      sgstPercent: '9',
      igstPercent: '0',
      amount: '950',
    },
  ];

  const mockOrgHeader = {
    name: 'Test Pharmacy',
    legal_name: 'Testco Pvt Ltd',
    address: '1 Test Street, Testville',
    dl_numbers: 'DL-1, DL-2',
    gstin: 'GSTIN123',
    phone: '000-111',
  };

  const mockProps = {
    salesItems: mockSalesItems,
    orgHeader: mockOrgHeader,
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders print preview with branded header, receipt title and customer details', () => {
    render(<PrintPreviewModal {...mockProps} />);

    // The letterhead comes from the orgHeader prop, not a hardcoded brand.
    expect(screen.getByText('Test Pharmacy')).toBeInTheDocument();
    expect(screen.getByText('(Testco Pvt Ltd)')).toBeInTheDocument();
    expect(screen.getByText(/GSTIN No: GSTIN123/)).toBeInTheDocument();
    // Centered in-document receipt title (matches the printed output).
    expect(screen.getByText(/customer receipt/i)).toBeInTheDocument();
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    expect(screen.getByText(/1234567890/i)).toBeInTheDocument();
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
    // Quantity "10" is rendered in its own cell.
    const quantityElements = screen.getAllByText(/^10$/);
    expect(quantityElements.length).toBeGreaterThan(0);
    // Amount for the row.
    expect(screen.getByText(/^950$/)).toBeInTheDocument();
  });

  it('displays financial summary', () => {
    render(<PrintPreviewModal {...mockProps} />);

    expect(screen.getByText(/total value/i)).toBeInTheDocument();
    const totalValueElements = screen.getAllByText(/1000/);
    expect(totalValueElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/total discount/i)).toBeInTheDocument();
    const discountElements = screen.getAllByText(/^50$/);
    expect(discountElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/tax amount/i)).toBeInTheDocument();
    expect(screen.getByText(/180/i)).toBeInTheDocument();
    expect(screen.getByText(/total payable/i)).toBeInTheDocument();
    expect(screen.getByText(/1130/i)).toBeInTheDocument();
  });

  it('renders a page size selector with A4 and A5 options', () => {
    render(<PrintPreviewModal {...mockProps} />);

    expect(screen.getByText(/page size/i)).toBeInTheDocument();
    expect(screen.getByText(/^A4$/)).toBeInTheDocument();
    expect(screen.getByText(/^A5$/)).toBeInTheDocument();
  });

  it('calls onPageSizeChange when a page size option is clicked', () => {
    const onPageSizeChange = jest.fn();
    render(<PrintPreviewModal {...mockProps} onPageSizeChange={onPageSizeChange} />);

    fireEvent.click(screen.getByText(/^A5$/));
    expect(onPageSizeChange).toHaveBeenCalledWith('A5');
  });

  it('renders an orientation selector with Landscape and Portrait options', () => {
    render(<PrintPreviewModal {...mockProps} />);

    expect(screen.getByText('Orientation:')).toBeInTheDocument();
    expect(screen.getByText(/^Landscape$/)).toBeInTheDocument();
    expect(screen.getByText(/^Portrait$/)).toBeInTheDocument();
  });

  it('shows a hint that the browser print dialog paper size must match the selected size', () => {
    render(<PrintPreviewModal {...mockProps} pageSize="A5" />);

    expect(
      screen.getByText(/set Paper size to A5\. Orientation is applied automatically/i)
    ).toBeInTheDocument();
  });

  it('calls onOrientationChange when an orientation option is clicked', () => {
    const onOrientationChange = jest.fn();
    render(<PrintPreviewModal {...mockProps} onOrientationChange={onOrientationChange} />);

    fireEvent.click(screen.getByText(/^Portrait$/));
    expect(onOrientationChange).toHaveBeenCalledWith('portrait');
  });

  it('does not render action buttons (this is a view-only preview body)', () => {
    // PrintPreviewModal renders only the receipt body and a page-size
    // selector; Cancel/Print/Save controls live in the parent dialog, so
    // none of those buttons appear here.
    render(<PrintPreviewModal {...mockProps} />);

    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /print/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
  });

  it('handles empty sales items', () => {
    render(<PrintPreviewModal {...mockProps} salesItems={[]} />);

    expect(screen.getByText(/no items added/i)).toBeInTheDocument();
    expect(screen.getByText('Test Pharmacy')).toBeInTheDocument();
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

    expect(screen.getByText('Test Pharmacy')).toBeInTheDocument();
  });

  it('omits null org header fields instead of rendering empty lines', () => {
    render(
      <PrintPreviewModal
        {...mockProps}
        orgHeader={{
          name: 'Test Pharmacy',
          legal_name: null,
          address: null,
          dl_numbers: null,
          gstin: 'GSTIN123',
          phone: null,
        }}
      />
    );

    expect(screen.getByText('Test Pharmacy')).toBeInTheDocument();
    expect(screen.getByText(/GSTIN No: GSTIN123/)).toBeInTheDocument();
    expect(screen.queryByText(/Testco Pvt Ltd/)).not.toBeInTheDocument();
    expect(screen.queryByText(/DL No:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\(M\):/)).not.toBeInTheDocument();
  });

  it('renders no letterhead lines when orgHeader is absent', () => {
    render(<PrintPreviewModal {...mockProps} orgHeader={undefined} />);

    expect(screen.queryByText('Test Pharmacy')).not.toBeInTheDocument();
    expect(screen.queryByText(/GSTIN No:/)).not.toBeInTheDocument();
    // The rest of the receipt still renders.
    expect(screen.getByText(/customer receipt/i)).toBeInTheDocument();
  });

  it('displays the table column headers for items', () => {
    render(<PrintPreviewModal {...mockProps} />);

    // "Product Name" appears as both header and the product name cell.
    const productElements = screen.getAllByText(/product name/i);
    expect(productElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/^S\.No$/)).toBeInTheDocument();
    expect(screen.getByText(/^MFG$/)).toBeInTheDocument();
    expect(screen.getByText(/^HSN$/)).toBeInTheDocument();
    expect(screen.getByText(/^Sch$/)).toBeInTheDocument();
    expect(screen.getByText(/^Batch$/)).toBeInTheDocument();
    expect(screen.getByText(/^Pack$/)).toBeInTheDocument();
    expect(screen.getByText(/^Exp$/)).toBeInTheDocument();
    expect(screen.getByText(/^Qty$/)).toBeInTheDocument();
    expect(screen.getByText(/^MRP$/)).toBeInTheDocument();
    expect(screen.getByText(/^GST$/)).toBeInTheDocument();
    expect(screen.getByText(/^Amount$/)).toBeInTheDocument();
  });

  it('renders the schedule cell; null and "NONE" render blank (formatSchedule)', () => {
    render(<PrintPreviewModal {...mockProps} />);
    // Item carries schedule 'H1' — shown as-is.
    expect(screen.getByText('H1')).toBeInTheDocument();

    // 'NONE' (explicitly none) must NOT print the literal string.
    render(
      <PrintPreviewModal
        {...mockProps}
        salesItems={[{ ...mockSalesItems[0], id: '2', schedule: 'NONE' }]}
      />
    );
    expect(screen.queryByText('NONE')).not.toBeInTheDocument();
  });
});
