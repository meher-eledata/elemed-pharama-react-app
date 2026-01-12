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
      cgstPercent: item.cgstPercent || '9',
      sgst: item.sgst || '0',
      sgstPercent: item.sgstPercent || '9',
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
  labels: any;
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
    labels,
  } = data;

  return `
    <html>
      <head>
        <title>${labels.CUSTOMER_RECEIPT_TITLE}</title>
        <style>
          @media print {
            @page { 
              margin: 0.5in;
              size: A4;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body { 
            font-family: 'Lexend', sans-serif; 
            margin: 20px;
            padding: 20px;
            color: #1A212B;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .receipt-header { 
            text-align: left; 
            margin-bottom: 30px; 
          }
          .receipt-title { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 20px; 
            color: #1A212B;
          }
          .receipt-details { 
            display: flex; 
            flex-direction: column;
            gap: 0px; 
            margin-bottom: 40px; 
            border: 1px solid #E5E7EB; 
            border-radius: 8px; 
            overflow: hidden;
            page-break-inside: avoid;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .receipt-details-row {
            display: flex;
            flex-direction: row;
            gap: 0px;
            width: 100%;
          }
          .detail-section { 
            flex: 1; 
            min-width: 180px;
            background-color: #F9FAFB !important; 
            padding: 12px 8px; 
            border-right: 2px solid #9CA3AF; 
            border-bottom: 2px solid #9CA3AF;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .receipt-details-row:first-child .detail-section:last-child {
            border-bottom: 2px solid #9CA3AF;
            border-right: none;
          }
          .receipt-details-row:last-child .detail-section:last-child {
            border-bottom: none;
            border-right: none;
          }
          .receipt-details-row:last-child .detail-section:first-child {
            border-bottom: none;
          }
          .detail-title { 
            font-weight: bold; 
            margin-bottom: 12px; 
            font-size: 14px;
            color: #1A212B;
          }
          .detail-item { 
            font-size: 11px; 
            margin-bottom: 6px;
            color: #374151;
            line-height: 1.4;
          }
          .detail-item.email-item {
            font-size: 10px;
          }
          .items-section { 
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          .items-title { 
            font-weight: bold; 
            margin-bottom: 16px; 
            font-size: 14px;
            color: #1A212B;
          }
          .items-table { 
            width: 100%; 
            border-collapse: separate;
            border-spacing: 0;
            border: 2px solid #A5B4FC; 
            border-radius: 8px; 
            overflow: hidden;
          }
          .items-table th { 
            background-color: #C7D2FE !important; 
            padding: 18px 12px; 
            font-weight: bold; 
            font-size: 11px; 
            text-align: left;
            color: #1A212B !important;
            border-bottom: 2px solid #A5B4FC;
            white-space: nowrap;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .items-table td { 
            padding: 18px 12px; 
            font-size: 11px; 
            background-color: #FFFFFF !important; 
            color: #374151 !important;
            border-top: 1px solid #E5E7EB;
            line-height: 1.6;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .items-table tbody tr:first-child td {
            border-top: none;
          }
          .items-table th:not(:last-child),
          .items-table td:not(:last-child) {
            border-right: 1px solid #E5E7EB;
          }
          .summary { 
            background-color: #C7D2FE !important; 
            padding: 20px 24px; 
            border-radius: 8px; 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            page-break-inside: avoid;
            margin-top: 30px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .summary-left { 
            display: flex; 
            gap: 60px; 
            font-size: 12px;
            color: #1A212B;
          }
          .summary-item {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .summary-label {
            font-weight: 500;
            color: #1A212B;
          }
          .summary-value {
            font-weight: 700;
            font-size: 14px;
            color: #1A212B;
          }
          .summary-right { 
            display: flex;
            flex-direction: column;
            gap: 6px;
            align-items: flex-end;
            text-align: right;
          }
          .summary-right-label {
            font-size: 14px;
            font-weight: 500;
            color: #1A212B;
          }
          .summary-right-value {
            font-size: 20px;
            font-weight: 700;
            color: #1A212B;
          }
        </style>
      </head>
      <body>
        <div class="receipt-header">
          <div class="receipt-title">${labels.CUSTOMER_RECEIPT_TITLE}</div>
        </div>
        
        <div class="receipt-details">
          <!-- First Row: Customer Details and Doctor Details -->
          <div class="receipt-details-row">
            <div class="detail-section">
              <div class="detail-title">${labels.CUSTOMER_DETAILS_TITLE}</div>
              <div class="detail-item">${labels.CUSTOMER_NAME_PRINT.replace('{name}', (customerName || '').trim())}</div>
              <div class="detail-item">${labels.MOBILE_NUMBER_PRINT.replace('{mobile}', (customerMobile || '').trim())}</div>
              <div class="detail-item">${labels.CITY_PRINT.replace('{city}', (customerCity || '').trim())}</div>
            </div>
            <div class="detail-section">
              <div class="detail-title">${labels.DOCTOR_DETAILS_TITLE}</div>
              <div class="detail-item">${labels.DOCTOR_NAME_PRINT.replace('{name}', (doctorName || '').trim())}</div>
              <div class="detail-item">${labels.MOBILE_NUMBER_PRINT.replace('{mobile}', (doctorMobile || '').trim())}</div>
              <div class="detail-item email-item">${labels.EMAIL_PRINT.replace('{email}', (doctorEmail || '').trim())}</div>
            </div>
          </div>
          <!-- Second Row: Payment Details and Invoice Details -->
          <div class="receipt-details-row">
            <div class="detail-section">
              <div class="detail-title">${labels.PAYMENT_DETAILS_TITLE}</div>
              <div class="detail-item">${labels.PAYMENT_MODE_PRINT.replace('{mode}', (paymentMode || '').trim())}</div>
              ${paymentMode === 'Insurance' 
                ? `<div class="detail-item">${labels.INSURANCE_PRINT.replace('{company}', (insuranceCompany || '').trim())}</div>`
                : insuranceCompany && insuranceCompany.trim() 
                  ? `<div class="detail-item">${labels.DETAILS_PRINT.replace('{details}', insuranceCompany.trim())}</div>`
                  : ''
              }
            </div>
            <div class="detail-section">
              <div class="detail-title">${labels.INVOICE_DETAILS_TITLE}</div>
              <div class="detail-item">${labels.INVOICE_NUMBER_PRINT.replace('{number}', (invoiceNumber || '').trim())}</div>
              <div class="detail-item">${labels.INVOICE_DATE_PRINT.replace('{date}', (invoiceDate || '').trim())}</div>
            </div>
          </div>
        </div>
        
        <div class="items-section">
          <div class="items-title">${labels.ITEMS_SECTION_TITLE}</div>
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
              ${salesItems.map(item => `
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
                  <td>${item.amount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="summary">
          <div class="summary-left">
            <div class="summary-item">
              <div class="summary-label">${labels.TOTAL_VALUE_LABEL}</div>
              <div class="summary-value">${totalValue}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">${labels.TOTAL_DISCOUNT_LABEL}</div>
              <div class="summary-value">${totalDiscount}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">${labels.TAX_AMOUNT_LABEL}</div>
              <div class="summary-value">${taxAmount}</div>
            </div>
          </div>
          <div class="summary-right">
            <div class="summary-right-label">${labels.TOTAL_PAYABLE_LABEL}</div>
            <div class="summary-right-value">${totalPayableAmount}</div>
          </div>
        </div>
      </body>
    </html>
  `;
};

