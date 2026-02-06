import { SalesReceiptItem } from './SalesReceipt.types';
import { SALES_RECEIPT_CONSTANTS } from '../../config/constants/SalesReceipt.constants';

/**
 * Transform cart items from Sales Page to SalesReceiptItem format
 */
export const transformCartItems = (cartItems: any[]): SalesReceiptItem[] => {
  return cartItems.map((item: any) => {
    // Use totalPrice if available (already includes discount), otherwise calculate with discount
    let amount: string;
    if (item.amount) {
      amount = item.amount;
    } else if (item.totalPrice !== undefined) {
      amount = item.totalPrice.toFixed(2);
    } else {
      // Calculate amount with discount
      const discountMultiplier = 1 - ((item.discount || 0) / 100);
      amount = (item.sp * item.quantity * discountMultiplier).toFixed(2);
    }

    return {
      id: item.id,
      productName: item.name,
      product_id: item.product_id, // Preserve product_id from cart item (important for batch validation)
      manufacturer: 'N/A',
      batch: item.batch,
      expiryDate: item.expiry,
      quantity: item.quantity.toString(),
      type: item.type || 'N/A',
      unitPrice: item.sp.toString(),
      mrp: item.mrp.toString(),
      discount: (item.sp * item.discount / 100 * item.quantity).toFixed(2),
      discountPercent: item.discount.toString(),
      discountAuthorizedBy: item.discountAuthorizedBy, // Preserve doctor name
      discountAuthorizedById: item.discountAuthorizedById, // Preserve doctor ID (important for API)
      cgst: item.cgst || '0',
      cgstPercent: item.cgstPercent || '2.5',
      sgst: item.sgst || '0',
      sgstPercent: item.sgstPercent || '2.5',
      igst: item.igst || '0',
      igstPercent: item.igstPercent || '0',
      amount: amount,
    };
  });
};

export const calculateFinancialSummary = (salesItems: SalesReceiptItem[]) => {
  // Total value is the sum of (unitPrice * quantity) for all items - before discount
  const totalValue = salesItems.reduce((sum, item) => {
    const unitPrice = parseFloat(item.unitPrice || '0');
    const quantity = parseFloat(item.quantity || '0');
    return sum + (unitPrice * quantity);
  }, 0);
  const totalDiscount = salesItems.reduce((sum, item) => sum + parseFloat(item.discount || '0'), 0);
  // Calculate total tax amount from CGST, SGST, and IGST
  const taxAmount = salesItems.reduce((sum, item) =>
    sum + parseFloat(item.cgst || '0') + parseFloat(item.sgst || '0') + parseFloat(item.igst || '0'), 0
  );
  // Total payable amount is the sum of all item amounts (which already includes discount and taxes)
  const totalPayableAmount = salesItems.reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0);

  return {
    totalValue: totalValue.toFixed(2),
    totalDiscount: totalDiscount.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    totalPayableAmount: totalPayableAmount.toFixed(2),
  };
};

export const getTodayDate = (): string => {
  const today = new Date();
  return today.toLocaleDateString(
    SALES_RECEIPT_CONSTANTS.DATE_LOCALE,
    SALES_RECEIPT_CONSTANTS.DATE_FORMAT_OPTIONS
  );
};

export const generatePrintHTML = (data: {
  customerName: string;
  customerMobile: string;
  customerCity: string;
  doctorName: string;
  doctorMobile: string;
  doctorEmail: string;
  paymentMode: string;
  insuranceCompany: string;
  invoiceNumber: string;
  invoiceDate: string;
  salesItems: SalesReceiptItem[];
  totalValue: string;
  totalDiscount: string;
  taxAmount: string;
  totalPayableAmount: string;
  patientType: string;
  labels: any;
  brandIcon?: string;
  pageSize?: 'A4' | 'A5';
}): string => {
  const {
    customerName,
    customerMobile,
    customerCity,
    doctorName,
    doctorMobile,
    doctorEmail,
    paymentMode,
    insuranceCompany,
    invoiceNumber,
    invoiceDate,
    salesItems,
    totalValue,
    totalDiscount,
    taxAmount,
    totalPayableAmount,
    patientType,
    labels,
    brandIcon,
    pageSize = 'A4',
  } = data;

  return `
    <html>
      <head>
        <title>${labels.CUSTOMER_RECEIPT_TITLE}</title>
        <style>
          @media print {
            @page { 
              margin: 0.3in;
              size: ${pageSize} ${pageSize === 'A4' ? 'landscape' : 'portrait'};
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
          * {
            box-sizing: border-box;
          }
          body { 
            font-family: 'Lexend', sans-serif; 
            margin: 0;
            padding: 10px;
            color: #1A212B;
          }
          .receipt-header { 
            display: flex;
            justify-content: ${pageSize === 'A4' ? 'space-between' : 'center'};
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #1A212B;
            gap: ${pageSize === 'A4' ? '0' : '20px'};
          }
          .header-left {
            flex: ${pageSize === 'A4' ? '1' : 'none'};
            display: flex;
            align-items: flex-start;
            justify-content: flex-start;
          }
          .header-logo {
            width: ${pageSize === 'A4' ? '110px' : '80px'};
            height: auto;
            margin-top: ${pageSize === 'A4' ? '-15px' : '0'};
            margin-left: ${pageSize === 'A4' ? '-10px' : '0'};
          }
          .header-center {
            flex: ${pageSize === 'A4' ? '3' : 'none'};
            text-align: ${pageSize === 'A4' ? 'center' : 'left'};
          }
          .hospital-name {
            font-size: ${pageSize === 'A4' ? '24px' : '18px'};
            font-weight: 800;
            margin: 0;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .hospital-subtext {
            font-size: ${pageSize === 'A4' ? '12px' : '10px'};
            font-weight: 500;
            margin: 2px 0;
          }
          .hospital-details {
            font-size: ${pageSize === 'A4' ? '10px' : '8px'};
            margin: 4px 0;
            line-height: 1.2;
          }
          .header-right {
            flex: 1;
            text-align: right;
          }
          .tax-invoice-label {
            display: none;
          }
          
          .receipt-details { 
            display: flex; 
            flex-direction: column;
            gap: 12px;
            margin-bottom: 24px; 
          }
          .receipt-details-row {
            display: flex;
            gap: 12px;
            width: 100%;
          }  
          .detail-section { 
            flex: 1; 
            min-width: 180px;
            background-color: #F9FAFB !important; 
            padding: 12px 8px; 
            border: 1px solid #E5E7EB; 
            border-radius: 8px; 
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .detail-title { 
            font-size: ${pageSize === 'A4' ? '14px' : '12px'};
            font-weight: 600; 
            color: #1A212B;
            margin-bottom: ${pageSize === 'A4' ? '12px' : '8px'}; 
          }
          .detail-item { 
            font-size: ${pageSize === 'A4' ? '11px' : '9px'}; 
            color: #374151;
            margin-bottom: 4px;
            line-height: 1.4;
          }

          .items-section { 
            margin-bottom: 24px;
          }
          .items-table { 
            width: 100%; 
            border-collapse: collapse;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            overflow: hidden;
          }
          .items-table th { 
            background-color: #F9FAFB !important; 
            padding: ${pageSize === 'A4' ? '12px 16px' : '8px 6px'}; 
            font-weight: 600; 
            font-size: ${pageSize === 'A4' ? '12px' : '10px'}; 
            text-align: left;
            color: #1A212B;
            border-bottom: 2px solid #E5E7EB;
          }
          .items-table td { 
            padding: ${pageSize === 'A4' ? '12px 16px' : '8px 6px'}; 
            font-size: ${pageSize === 'A4' ? '12px' : '10px'}; 
            color: #374151;
            border-top: 1px solid #E5E7EB;
          }

          .summary { 
            background-color: #F9FAFB !important;
            padding: 20px 24px;
            border-radius: 8px;
            display: flex; 
            justify-content: space-between;
            align-items: center;
            border: 1px solid #E5E7EB;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .summary-left {
            display: flex;
            gap: 60px;
          }
          .summary-item {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .summary-label {
            font-size: 12px;
            color: #6B7280;
            font-weight: 500;
          }
          .summary-value {
            font-size: 14px;
            font-weight: 700;
            color: #1A212B;
          }
          .summary-right {
            display: flex;
            flex-direction: column;
            gap: 6px;
            align-items: flex-end;
          }
          .payable-label {
            font-size: 14px;
            font-weight: 500;
            color: #6B7280;
          }
          .payable-value {
            font-size: 20px;
            font-weight: 700;
            color: #1A212B;
          }
        </style>
      </head>
      <body>
        <div class="receipt-header">
          <div class="header-left">
            ${brandIcon ? `<img src="${brandIcon}" class="header-logo" alt="Logo" />` : ''}
          </div>
          <div class="header-center">
            <h1 class="hospital-name">ELITE PHARMACY</h1>
            <div class="hospital-subtext">(SKE SUSRUTA INSTITUTE OF MEDICAL SCIENCES PVT LTD)</div>
            <div class="hospital-details">
              PLOT NO:14A, HEALTH CITY, CHINAGADHILI, 530040<br/>
              DL No: FORM 20:AP/03/01/2015-124907, FORM 21:AP/03/01/2015-124908<br/>
              GSTIN No: 37AAQCS3213C2ZH<br/>
              (M): 0891-2554040, 8096655050
            </div>
          </div>
          <div class="header-right">
          </div>
        </div>
        
        <div class="receipt-details">
          <div class="receipt-details-row">
            <div class="detail-section">
              <div class="detail-title">Customer Details</div>
              <div class="detail-item"><strong>Name:</strong> ${customerName || ''}</div>
              <div class="detail-item"><strong>Mobile:</strong> ${customerMobile || ''}</div>
              <div class="detail-item"><strong>City:</strong> ${customerCity || ''}</div>
            </div>
            <div class="detail-section">
              <div class="detail-title">Doctor Details</div>
              <div class="detail-item"><strong>Name:</strong> ${doctorName || ''}</div>
              <div class="detail-item"><strong>Mobile:</strong> ${doctorMobile || ''}</div>
              <div class="detail-item"><strong>Email:</strong> ${doctorEmail || ''}</div>
            </div>
          </div>
          <div class="receipt-details-row">
            <div class="detail-section">
              <div class="detail-title">Payment Details</div>
              <div class="detail-item"><strong>Mode:</strong> ${paymentMode || 'Cash'}</div>
              ${paymentMode === 'Insurance' ? `<div class="detail-item"><strong>Company:</strong> ${insuranceCompany || ''}</div>` : ''}
            </div>
            <div class="detail-section">
              <div class="detail-title">Invoice Details</div>
              <div class="detail-item"><strong>Invoice No:</strong> ${invoiceNumber || ''}</div>
              <div class="detail-item"><strong>Date:</strong> ${invoiceDate || ''}</div>
              <div class="detail-item"><strong>Patient Type:</strong> ${patientType || ''}</div>
            </div>
          </div>
        </div>
        
        <div class="items-section">
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Type</th>
                <th>Batch</th>
                <th>Price</th>
                <th>Disc</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>IGST</th>
                <th>Amt</th>
              </tr>
            </thead>
            <tbody>
              ${salesItems.map((item, index) => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>${item.type}</td>
                  <td>${item.batch}</td>
                  <td>${item.unitPrice}</td>
                  <td>${item.discountPercent}%</td>
                  <td>${item.cgstPercent}%</td>
                  <td>${item.sgstPercent}%</td>
                  <td>${item.igstPercent}%</td>
                  <td style="font-weight: 600">${parseFloat(item.amount || '0').toFixed(1)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="summary">
          <div class="summary-left">
            <div class="summary-item">
              <div class="summary-label">Total Value</div>
              <div class="summary-value">${parseFloat(totalValue || '0').toFixed(1)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Discount</div>
              <div class="summary-value">${parseFloat(totalDiscount || '0').toFixed(1)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Tax Amount</div>
              <div class="summary-value">${parseFloat(taxAmount || '0').toFixed(1)}</div>
            </div>
          </div>
          <div class="summary-right">
            <div class="payable-label">NET PAYABLE</div>
            <div class="payable-value">${parseFloat(totalPayableAmount || '0').toFixed(1)}</div>
          </div>
        </div>
        
        <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #6B7280;">
          This is a computer generated invoice.
        </div>
        <div style="margin-top: 10px; text-align: center; font-size: 12px; font-weight: 600; color: #1A212B;">
          Powered by Elemed
        </div>
      </body>
    </html>
  `;
};

