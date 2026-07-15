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
      // The SP is now the total selling price for that item's quantity inclusive of discount
      amount = item.sp.toFixed(2);
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
      unitPrice: item.unit_selling_price ? item.unit_selling_price.toFixed(8) : (item.sp / item.quantity).toFixed(8), // Unit price is the base selling price with high precision
      mrp: Number(parseFloat(item.mrp.toString())).toFixed(2).replace(/\.00$/, ''),
      // Calculate original total without discount for receipt display
      discount: (item.mrp - item.sp).toFixed(2),
      discountPercent: item.discount.toString(),
      discountAuthorizedBy: item.discountAuthorizedBy, // Preserve doctor name
      discountAuthorizedById: item.discountAuthorizedById, // Preserve doctor ID (important for API)
      cgst: item.cgst || '0',
      cgstPercent: item.cgstPercent || '9',
      sgst: item.sgst || '0',
      sgstPercent: item.sgstPercent || '9',
      igst: item.igst || '0',
      igstPercent: item.igstPercent || '0',
      pack_qty: item.pack_qty,
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
  const exactTotalPayableAmount = salesItems.reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0);
  // Apply standard rounding (e.g. 456.50 -> 457)
  const totalPayableAmount = Math.round(exactTotalPayableAmount);

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
  patientType?: string;
  pageSize?: 'A4' | 'A5';
  orientation?: 'landscape' | 'portrait';
  brandIcon?: string;
  splitPayments?: any[];
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
    patientType,
    pageSize = 'A4',
    orientation = 'landscape',
    brandIcon,
    splitPayments,
  } = data;

  const isA5 = pageSize === 'A5';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${labels.CUSTOMER_RECEIPT_TITLE}</title>
        <style>
          @media print {
            /* Zero page margins suppress the browser's header/footer band
               (title, URL, date); the visual margin comes from body padding. */
            @page {
              margin: 0;
              size: ${pageSize} ${orientation};
            }
            html, body {
              margin: 0;
              width: 100%;
              overflow: visible;
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
            margin: 0;
            padding: ${isA5 ? '5mm' : '15mm'};
            background-color: #FFFFFF;
            color: #1A212B;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            font-size: ${isA5 ? '10px' : '13px'};
          }
          .receipt-header {
            text-align: left;
            margin-bottom: ${isA5 ? '6px' : '12px'};
          }
          .doc-title {
            text-align: center;
            font-size: ${isA5 ? '11px' : '15px'};
            font-weight: 700;
            letter-spacing: 0.5px;
            margin: 0 0 ${isA5 ? '6px' : '10px'};
            color: #1A212B;
          }
          .receipt-details {
            display: flex;
            flex-direction: row;
            gap: 0px;
            margin-bottom: ${isA5 ? '6px' : '15px'};
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            overflow: hidden;
            page-break-inside: avoid;
          }
          .detail-section {
            flex: 1;
            background-color: #F9FAFB !important;
            padding: ${isA5 ? '4px 6px' : '10px'};
            border-right: 2px solid #9CA3AF; 
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .detail-section:last-child {
            border-right: none;
          }
          .detail-title {
            font-weight: bold;
            margin-bottom: ${isA5 ? '3px' : '12px'};
            font-size: ${isA5 ? '10px' : '16px'};
            color: #1A212B;
          }
          .detail-item {
            font-size: ${isA5 ? '9px' : '13px'};
            margin-bottom: ${isA5 ? '2px' : '6px'};
            color: #374151;
            line-height: ${isA5 ? '1.3' : '1.4'};
          }
          .detail-item.email-item {
            font-size: ${isA5 ? '8px' : '11px'};
          }
          .items-section { 
            margin-bottom: 0px;
          }
          .items-title {
            font-weight: bold;
            margin-bottom: ${isA5 ? '3px' : '8px'};
            font-size: ${isA5 ? '10px' : '14px'};
            color: #1A212B;
          }
          .items-table { 
            width: 100%; 
            border-collapse: separate;
            border-spacing: 0;
            border: 2px solid #A5B4FC !important; 
            border-radius: 8px; 
            overflow: hidden;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .items-table th {
            background-color: #C7D2FE !important;
            padding: ${isA5 ? '3px 4px' : '10px 8px'};
            font-weight: bold; 
            font-size: ${isA5 ? '9px' : '13px'}; 
            text-align: left;
            color: #1A212B !important;
            border-bottom: 2px solid #A5B4FC !important;
            white-space: nowrap;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .items-table thead {
            display: table-header-group;
          }
          .items-table tr {
            page-break-inside: avoid;
          }
          @media print {
            .items-table th {
              background-color: #C7D2FE !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
          .items-table td {
            padding: ${isA5 ? '2px 4px' : '10px 8px'};
            font-size: ${isA5 ? '9px' : '13px'};
            background-color: #FFFFFF !important;
            color: #374151 !important;
            border-top: 1px solid #E5E7EB;
            line-height: ${isA5 ? '1.3' : '1.4'};
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .summary-td {
            padding: 0 !important;
            border: none !important;
            background-color: transparent !important;
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
            padding: ${isA5 ? '5px 10px' : '12px 20px'};
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            margin-top: 0px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          @media print {
            .summary {
              background-color: #C7D2FE !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .detail-section {
              background-color: #F9FAFB !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .items-table {
              border: 2px solid #A5B4FC !important;
            }
          }
          .summary-left {
            display: flex;
            gap: ${isA5 ? '24px' : '60px'};
            font-size: ${isA5 ? '9px' : '14px'};
            color: #1A212B;
          }
          .summary-item {
            display: flex;
            flex-direction: column;
            gap: ${isA5 ? '2px' : '6px'};
          }
          .summary-label {
            font-weight: 500;
            color: #1A212B;
          }
          .summary-value {
            font-weight: 700;
            font-size: ${isA5 ? '11px' : '14px'};
            color: #1A212B;
          }
          .summary-right {
            display: flex;
            flex-direction: column;
            gap: ${isA5 ? '2px' : '6px'};
            align-items: flex-end;
            text-align: right;
          }
          .summary-right-label {
            font-size: ${isA5 ? '10px' : '16px'};
            font-weight: 500;
            color: #1A212B;
          }
          .summary-right-value {
            font-size: ${isA5 ? '14px' : '22px'};
            font-weight: 700;
            color: #1A212B;
          }
        </style>
      </head>
      <body>
        <div class="receipt-header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1A212B; padding-bottom: ${isA5 ? '4px' : '6px'}; gap: 0;">
          <div style="flex: 1; display: flex; justify-content: flex-start;">
            ${brandIcon ? `<img src="${brandIcon.startsWith('http') || brandIcon.startsWith('data:') ? brandIcon : window.location.origin + brandIcon}" alt="Logo" style="width: ${isA5 ? '55px' : '90px'}; height: auto;" />` : ''}
          </div>
          <div style="flex: 3; text-align: center;">
            <div style="font-size: ${isA5 ? '14px' : '20px'}; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; line-height: 1.1; color: #000;">ELITE PHARMACY</div>
            <div style="font-size: ${isA5 ? '8px' : '9px'}; font-weight: 500; margin: 2px 0; color: #374151;">(SKE SUSRUTA INSTITUTE OF MEDICAL SCIENCES PVT LTD)</div>
            <div style="font-size: ${isA5 ? '7px' : '8px'}; margin: ${isA5 ? '2px 0' : '4px 0'}; line-height: 1.2; color: #4B5563;">
              PLOT NO:14A, HEALTH CITY, CHINAGADHILI, 530040<br />
              DL No: FORM 20:AP/03/01/2015-124907, FORM 21:AP/03/01/2015-124908<br />
              GSTIN No: 37AAQCS3213C2ZH<br />
              (M): 0891-2554040, 8096655050
            </div>
          </div>
          <div style="flex: 1;"></div>
        </div>
        <div class="doc-title">${labels.CUSTOMER_RECEIPT_TITLE}</div>

        <div class="receipt-details">
          <!-- 1 Row Layout -->
          <div class="detail-section">
            <div class="detail-title">${labels.CUSTOMER_DETAILS_TITLE}</div>
            <div class="detail-item">${labels.CUSTOMER_NAME_PRINT.replace('{name}', (customerName || '').trim())}</div>
            <div class="detail-item">${labels.MOBILE_NUMBER_PRINT.replace('{mobile}', (customerMobile || '').trim())}</div>
          </div>
          <div class="detail-section">
            <div class="detail-title">${labels.DOCTOR_DETAILS_TITLE}</div>
            <div class="detail-item">${labels.DOCTOR_NAME_PRINT.replace('{name}', (doctorName || '').trim())}</div>
            <div class="detail-item">${labels.MOBILE_NUMBER_PRINT.replace('{mobile}', (doctorMobile || '').trim())}</div>
          </div>
          <div class="detail-section">
            <div class="detail-title">${labels.PAYMENT_DETAILS_TITLE}</div>
            ${splitPayments && splitPayments.length > 0
      ? splitPayments.map((p: any) => {
        const method = p.payment_method || p.paymentMethod || p.mode || p.payment_type || 'Payment';
        const amount = p.payment_amount || p.amount || '0';
        const details = p.details || p.notes || '';
        return `<div class="detail-item">${method.toUpperCase()}: ${amount} ${details ? `(Details: ${details})` : ''}</div>`;
      }).join('')
      : `<div class="detail-item">${labels.PAYMENT_MODE_PRINT.replace('{mode}', paymentMode && paymentMode.trim() ? paymentMode.trim() : 'Not specified')}</div>`
    }
            ${paymentMode === 'Insurance' && insuranceCompany && insuranceCompany.trim()
      ? `<div class="detail-item">${labels.INSURANCE_PRINT.replace('{company}', insuranceCompany.trim())}</div>`
      : paymentMode !== 'Insurance' && insuranceCompany && insuranceCompany.trim()
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
        
        <div class="items-section">
          <div class="items-title">${labels.ITEMS_SECTION_TITLE}</div>
          <table class="items-table">
            <thead>
              <tr>
                <th style="width:30px">S.No</th>
                <th>Product Name</th>
                <th>MFG</th>
                <th>HSN</th>
                <th>Batch</th>
                <th>Pack</th>
                <th>Exp</th>
                <th>Qty</th>
                <th>MRP</th>
                <th>GST</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${salesItems.length > 1 ? salesItems.slice(0, -1).map((item, index) => {
                const mfg = item.manufacturer ? item.manufacturer.substring(0, 3).toUpperCase() : 'N/A';
                const hsn = (item as any).hsn || '';
                const pack = (item as any).pack || 'N/A';
                const gstTotal = (parseFloat(item.cgstPercent || '0') + parseFloat(item.sgstPercent || '0') + parseFloat(item.igstPercent || '0')).toFixed(0) + '%';
                let formattedExp = 'N/A';
                if (item.expiryDate) {
                  const dateParts = item.expiryDate.split('-');
                  if (dateParts.length >= 2) {
                    formattedExp = `${dateParts[1]}/${dateParts[0]}`;
                  } else {
                    formattedExp = item.expiryDate;
                  }
                }
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.productName}</td>
                    <td>${mfg}</td>
                    <td>${hsn}</td>
                    <td>${item.batch}</td>
                    <td>${pack}</td>
                    <td>${formattedExp}</td>
                    <td>${item.quantity}</td>
                    <td>${item.mrp || 'N/A'}</td>
                    <td>${gstTotal}</td>
                    <td><strong>${item.amount}</strong></td>
                  </tr>
                `;
              }).join('') : ''}
            </tbody>
            <tbody style="page-break-inside: avoid;">
              ${salesItems.length > 0 ? (() => {
                const item = salesItems[salesItems.length - 1];
                const index = salesItems.length - 1;
                const mfg = item.manufacturer ? item.manufacturer.substring(0, 3).toUpperCase() : 'N/A';
                const hsn = (item as any).hsn || '';
                const pack = (item as any).pack || 'N/A';
                const gstTotal = (parseFloat(item.cgstPercent || '0') + parseFloat(item.sgstPercent || '0') + parseFloat(item.igstPercent || '0')).toFixed(0) + '%';
                let formattedExp = 'N/A';
                if (item.expiryDate) {
                  const dateParts = item.expiryDate.split('-');
                  if (dateParts.length >= 2) {
                    formattedExp = `${dateParts[1]}/${dateParts[0]}`;
                  } else {
                    formattedExp = item.expiryDate;
                  }
                }
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.productName}</td>
                    <td>${mfg}</td>
                    <td>${hsn}</td>
                    <td>${item.batch}</td>
                    <td>${pack}</td>
                    <td>${formattedExp}</td>
                    <td>${item.quantity}</td>
                    <td>${item.mrp || 'N/A'}</td>
                    <td>${gstTotal}</td>
                    <td><strong>${item.amount}</strong></td>
                  </tr>
                `;
              })() : ''}
              <tr>
                <td colspan="11" class="summary-td">
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
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  `;
};

