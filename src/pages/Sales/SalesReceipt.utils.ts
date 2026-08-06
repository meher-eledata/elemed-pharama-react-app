import dayjs from 'dayjs';
import { SalesReceiptItem } from './SalesReceipt.types';
import { formatSchedule } from '../../config/constants/product.constants';

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
      schedule: item.schedule ?? null,
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
    // Whole-rupee grand total (matches the backend's rounded invoice total) — no ".00" tail.
    totalPayableAmount: String(totalPayableAmount),
  };
};

// Canonical internal format for the invoiceDate STATE is ISO `YYYY-MM-DD`.
// Human-readable formatting ("DD MMM YYYY") happens only at display edges.
export const getTodayDate = (): string => {
  return dayjs().format('YYYY-MM-DD');
};

// Display-edge formatter: turn the ISO invoiceDate state into the app's
// human-readable "DD MMM YYYY" convention. Tolerant of any dayjs-parseable
// legacy value so stale strings never render as raw ISO.
export const formatInvoiceDateForDisplay = (isoDate: string): string => {
  const raw = (isoDate || '').trim();
  if (!raw) return '';
  const d = dayjs(raw);
  return d.isValid() ? d.format('DD MMM YYYY') : raw;
};

// Org branding printed in the receipt letterhead. Null/absent fields are
// omitted entirely (no empty lines/artifacts).
export interface OrgPrintHeader {
  name: string;
  legal_name: string | null;
  address: string | null;
  dl_numbers: string | null;
  gstin: string | null;
  phone: string | null;
}

// Org fields are DB-sourced free text injected into raw print HTML — escape them.
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

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
  orgHeader?: OrgPrintHeader;
  splitPayments?: any[];
}): string => {
  const {
    customerName,
    customerMobile,
    customerCity,
    doctorName,
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
    orgHeader,
    splitPayments,
  } = data;

  const isA5 = pageSize === 'A5';
  // True sheet dimensions in mm (portrait base, swapped for landscape).
  const [baseWmm, baseHmm] = isA5 ? [148, 210] : [210, 297];
  const pageWmm = orientation === 'landscape' ? baseHmm : baseWmm;
  const pageHmm = orientation === 'landscape' ? baseWmm : baseHmm;

  // Typography tiers keyed on the printable width:
  //   wide   = 297mm (A4 landscape) — roomy, but tight row padding so ~9 items + summary fit one page
  //   medium = 210mm (A4 portrait / A5 landscape)
  //   narrow = 148mm (A5 portrait) — 12 columns must fit, so smallest sizes
  const sz = pageWmm >= 297 ? {
    body: '13px', headerMb: '12px', headerPb: '6px', logoW: '90px',
    pharmacyName: '20px', pharmacySub: '9px', pharmacyAddr: '8px', addrMargin: '4px 0',
    docTitle: '15px', docTitleMb: '10px', detailsMb: '15px', sectionPad: '10px',
    detailTitle: '16px', detailTitleMb: '12px', detailItem: '13px', detailItemMb: '6px',
    lineHeight: '1.4', emailItem: '11px', itemsTitle: '14px', itemsTitleMb: '8px',
    thPad: '6px 8px', tdPad: '6px 8px', cell: '13px',
    summaryPad: '12px 20px', summaryGap: '60px', summaryItemGap: '6px', summaryFont: '14px',
    summaryValue: '14px', summaryRightLabel: '16px', summaryRightValue: '22px', footerFont: '9px',
  } : pageWmm >= 210 ? {
    body: '11px', headerMb: '8px', headerPb: '5px', logoW: '70px',
    pharmacyName: '16px', pharmacySub: '8px', pharmacyAddr: '7.5px', addrMargin: '3px 0',
    docTitle: '12px', docTitleMb: '8px', detailsMb: '10px', sectionPad: '6px 8px',
    detailTitle: '11px', detailTitleMb: '5px', detailItem: '10px', detailItemMb: '3px',
    lineHeight: '1.35', emailItem: '9px', itemsTitle: '11px', itemsTitleMb: '5px',
    thPad: '5px 6px', tdPad: '4px 6px', cell: '10px',
    summaryPad: '8px 14px', summaryGap: '36px', summaryItemGap: '3px', summaryFont: '11px',
    summaryValue: '12px', summaryRightLabel: '12px', summaryRightValue: '17px', footerFont: '8px',
  } : {
    body: '10px', headerMb: '6px', headerPb: '4px', logoW: '55px',
    pharmacyName: '14px', pharmacySub: '8px', pharmacyAddr: '7px', addrMargin: '2px 0',
    docTitle: '11px', docTitleMb: '6px', detailsMb: '6px', sectionPad: '4px 6px',
    detailTitle: '10px', detailTitleMb: '3px', detailItem: '9px', detailItemMb: '2px',
    lineHeight: '1.3', emailItem: '8px', itemsTitle: '10px', itemsTitleMb: '3px',
    thPad: '3px 4px', tdPad: '2px 4px', cell: '9px',
    summaryPad: '5px 10px', summaryGap: '24px', summaryItemGap: '2px', summaryFont: '9px',
    summaryValue: '11px', summaryRightLabel: '10px', summaryRightValue: '14px', footerFont: '7px',
  };
  const bodyPad = isA5 ? '6mm' : '10mm';

  // The print document paginates ITSELF at print time (see the inline <script> below).
  // Chrome does NOT reliably repeat a tall <thead> or a position:fixed footer on pages 2+,
  // so instead we lay out fixed-size ".sheet" divs — each carrying the full header, its own
  // items table (column headers repeat per sheet), and an in-flow footer — and measure real
  // layout to slice rows across pages. Totals/summary land only on the last sheet.
  // These build-time fragments are serialized into the script and re-assembled per sheet.
  const headerHTML = `
    <div class="sheet-header">
      <div class="receipt-header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1A212B; padding-bottom: ${sz.headerPb}; gap: 0;">
        <div style="flex: 1; display: flex; justify-content: flex-start;">
          ${brandIcon ? `<img src="${brandIcon.startsWith('http') || brandIcon.startsWith('data:') ? brandIcon : window.location.origin + brandIcon}" alt="Logo" style="width: ${sz.logoW}; height: auto;" />` : ''}
        </div>
        <div style="flex: 3; text-align: center;">
          ${orgHeader?.name ? `<div style="font-size: ${sz.pharmacyName}; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; line-height: 1.1; color: #000;">${escapeHtml(orgHeader.name)}</div>` : ''}
          ${orgHeader?.legal_name ? `<div style="font-size: ${sz.pharmacySub}; font-weight: 500; margin: 2px 0; color: #374151;">(${escapeHtml(orgHeader.legal_name)})</div>` : ''}
          ${(() => {
            const addrLines = [
              orgHeader?.address ? escapeHtml(orgHeader.address) : '',
              orgHeader?.dl_numbers ? `${labels.ORG_DL_PREFIX}${escapeHtml(orgHeader.dl_numbers)}` : '',
              orgHeader?.gstin ? `${labels.ORG_GSTIN_PREFIX}${escapeHtml(orgHeader.gstin)}` : '',
              orgHeader?.phone ? `${labels.ORG_PHONE_PREFIX}${escapeHtml(orgHeader.phone)}` : '',
            ].filter(Boolean);
            return addrLines.length
              ? `<div style="font-size: ${sz.pharmacyAddr}; margin: ${sz.addrMargin}; line-height: 1.2; color: #4B5563;">${addrLines.join('<br />')}</div>`
              : '';
          })()}
        </div>
        <div style="flex: 1;"></div>
      </div>
      <div class="doc-title">${labels.CUSTOMER_RECEIPT_TITLE}</div>
      <div class="receipt-details">
        <div class="detail-section">
          <div class="detail-title">${labels.CUSTOMER_DETAILS_TITLE}</div>
          <div class="detail-item">${labels.CUSTOMER_NAME_PRINT.replace('{name}', (customerName || '').trim())}</div>
          <div class="detail-item">${labels.MOBILE_NUMBER_PRINT.replace('{mobile}', (customerMobile || '').trim())}</div>
        </div>
        <div class="detail-section">
          <div class="detail-title">${labels.DOCTOR_DETAILS_TITLE}</div>
          <div class="detail-item">${labels.DOCTOR_NAME_PRINT.replace('{name}', (doctorName || '').trim())}</div>
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
          <div class="detail-item">${labels.INVOICE_DATE_PRINT.replace('{date}', formatInvoiceDateForDisplay(invoiceDate))}</div>
        </div>
      </div>
      <div class="items-title">${labels.ITEMS_SECTION_TITLE}</div>
    </div>`;

  // A fresh table (with its own repeating <thead>) is emitted per sheet; the paginator fills <tbody>.
  const tableOpenHTML = `
    <table class="items-table">
      <thead>
        <tr>
          <th style="width:30px">S.No</th>
          <th>Product Name</th>
          <th>Type</th>
          <th>MFG</th>
          <th>HSN</th>
          <th>Sch</th>
          <th>Batch</th>
          <th>Pack</th>
          <th>Exp</th>
          <th>Qty</th>
          <th>MRP</th>
          <th>GST</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>`;

  // In-flow footer at the bottom of every sheet (NOT position:fixed — that is unreliable in Chrome print).
  const footerHTML = `
    <div class="page-footer">
      <span class="footer-left">Signature of Pharmacist</span>
      <span class="footer-right">Powered by Elemed</span>
    </div>`;

  // Totals block — appended only to the final sheet by the paginator.
  const summaryHTML = `
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
    </div>`;

  // Pre-derive every per-row display value here (reuses the exact original logic) so the
  // browser-side paginator only concatenates strings — formatSchedule et al. are not shipped to the tab.
  const projectedItems = salesItems.map((item, index) => {
    const mfg = item.manufacturer ? item.manufacturer.substring(0, 3).toUpperCase() : 'N/A';
    const hsn = (item as any).hsn || '';
    const schedule = formatSchedule(item.schedule);
    const pack = (item as any).pack || 'N/A';
    const gst = (parseFloat(item.cgstPercent || '0') + parseFloat(item.sgstPercent || '0') + parseFloat(item.igstPercent || '0')).toFixed(0) + '%';
    let exp = 'N/A';
    if (item.expiryDate) {
      const dateParts = item.expiryDate.split('-');
      exp = dateParts.length >= 2 ? `${dateParts[1]}/${dateParts[0]}` : item.expiryDate;
    }
    return {
      sno: index + 1,
      productName: item.productName,
      type: item.type || '',
      mfg,
      hsn,
      schedule,
      batch: item.batch,
      pack,
      exp,
      qty: item.quantity,
      mrp: item.mrp || 'N/A',
      gst,
      amount: item.amount,
    };
  });

  // Serialize for safe inlining inside <script>: escaping "<" prevents a stray "</script>"
  // in any data field from prematurely closing the tag. < decodes back to "<" at runtime.
  const serialize = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${labels.CUSTOMER_RECEIPT_TITLE}</title>
        <style>
          @page {
            /* Zero page margins suppress the browser's header/footer band (title, URL, date). */
            margin: 0;
            size: ${pageWmm}mm ${pageHmm}mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            margin: 0;
            padding: 0;
            background-color: #FFFFFF;
            color: #1A212B;
            font-family: 'Lexend', sans-serif;
            font-size: ${sz.body};
          }
          /* Each .sheet is exactly one physical page; manual pagination slices rows into them. */
          .sheet {
            width: ${pageWmm}mm;
            height: ${pageHmm}mm;
            padding: ${bodyPad};
            page-break-after: always;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background-color: #FFFFFF;
          }
          .sheet:last-child {
            page-break-after: auto;
          }
          .sheet-header {
            flex: 0 0 auto;
          }
          .items {
            flex: 1 1 auto;
            overflow: hidden;
          }
          .receipt-header {
            text-align: left;
            margin-bottom: ${sz.headerMb};
          }
          .doc-title {
            text-align: center;
            font-size: ${sz.docTitle};
            font-weight: 700;
            letter-spacing: 0.5px;
            margin: 0 0 ${sz.docTitleMb};
            color: #1A212B;
          }
          .receipt-details {
            display: flex;
            flex-direction: row;
            gap: 0px;
            margin-bottom: ${sz.detailsMb};
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            overflow: hidden;
          }
          .detail-section {
            flex: 1;
            background-color: #F9FAFB !important;
            padding: ${sz.sectionPad};
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
            margin-bottom: ${sz.detailTitleMb};
            font-size: ${sz.detailTitle};
            color: #1A212B;
          }
          .detail-item {
            font-size: ${sz.detailItem};
            margin-bottom: ${sz.detailItemMb};
            color: #374151;
            line-height: ${sz.lineHeight};
          }
          .detail-item.email-item {
            font-size: ${sz.emailItem};
          }
          .items-title {
            font-weight: bold;
            margin-bottom: ${sz.itemsTitleMb};
            font-size: ${sz.itemsTitle};
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
            padding: ${sz.thPad};
            font-weight: bold;
            font-size: ${sz.cell};
            text-align: left;
            color: #1A212B !important;
            border-bottom: 2px solid #A5B4FC !important;
            white-space: nowrap;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .items-table td {
            padding: ${sz.tdPad};
            font-size: ${sz.cell};
            background-color: #FFFFFF !important;
            color: #374151 !important;
            border-top: 1px solid #E5E7EB;
            line-height: ${sz.lineHeight};
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
            padding: ${sz.summaryPad};
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-top: 8px;
            border-radius: 8px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .summary-left {
            display: flex;
            gap: ${sz.summaryGap};
            font-size: ${sz.summaryFont};
            color: #1A212B;
          }
          .summary-item {
            display: flex;
            flex-direction: column;
            gap: ${sz.summaryItemGap};
          }
          .summary-label {
            font-weight: 500;
            color: #1A212B;
          }
          .summary-value {
            font-weight: 700;
            font-size: ${sz.summaryValue};
            color: #1A212B;
          }
          .summary-right {
            display: flex;
            flex-direction: column;
            gap: ${sz.summaryItemGap};
            align-items: flex-end;
            text-align: right;
          }
          .summary-right-label {
            font-size: ${sz.summaryRightLabel};
            font-weight: 500;
            color: #1A212B;
          }
          .summary-right-value {
            font-size: ${sz.summaryRightValue};
            font-weight: 700;
            color: #1A212B;
          }
          .page-footer {
            flex: 0 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: ${sz.footerFont};
            color: #9CA3AF;
            padding-top: 6px;
            margin-top: 6px;
            border-top: 1px solid #E5E7EB;
          }
          @media print {
            html, body { overflow: visible; }
            .items-table th { background-color: #C7D2FE !important; }
            .summary { background-color: #C7D2FE !important; }
            .detail-section { background-color: #F9FAFB !important; }
            .items-table { border: 2px solid #A5B4FC !important; }
          }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script>
          (function () {
            var ITEMS = ${serialize(projectedItems)};
            var HEADER = ${serialize(headerHTML)};
            var TABLE_OPEN = ${serialize(tableOpenHTML)};
            var FOOTER = ${serialize(footerHTML)};
            var SUMMARY = ${serialize(summaryHTML)};
            var root = document.getElementById('root');

            function buildRow(it) {
              return '<tr>'
                + '<td>' + it.sno + '</td>'
                + '<td>' + it.productName + '</td>'
                + '<td>' + (it.type || '') + '</td>'
                + '<td>' + it.mfg + '</td>'
                + '<td>' + it.hsn + '</td>'
                + '<td>' + it.schedule + '</td>'
                + '<td>' + it.batch + '</td>'
                + '<td>' + it.pack + '</td>'
                + '<td>' + it.exp + '</td>'
                + '<td>' + it.qty + '</td>'
                + '<td>' + it.mrp + '</td>'
                + '<td>' + it.gst + '</td>'
                + '<td><strong>' + it.amount + '</strong></td>'
                + '</tr>';
            }

            function newItemsSheet() {
              var s = document.createElement('div');
              s.className = 'sheet';
              s.innerHTML = HEADER + '<div class="items">' + TABLE_OPEN + '</div>' + FOOTER;
              root.appendChild(s);
              return s;
            }

            function paginate() {
              var i = 0, guard = 0;
              var sheet = newItemsSheet();
              var itemsBox = sheet.querySelector('.items');
              var tbody = sheet.querySelector('tbody');

              while (i < ITEMS.length && guard < 200) {
                guard++;
                tbody.insertAdjacentHTML('beforeend', buildRow(ITEMS[i]));
                if (itemsBox.scrollHeight > itemsBox.clientHeight) {
                  if (tbody.children.length === 1) {
                    // A single row taller than a full page: keep it so we always make progress.
                    i++;
                  } else {
                    // Overflowed this sheet — drop the last row and retry it on a fresh sheet.
                    tbody.removeChild(tbody.lastElementChild);
                    sheet = newItemsSheet();
                    itemsBox = sheet.querySelector('.items');
                    tbody = sheet.querySelector('tbody');
                  }
                } else {
                  i++;
                }
              }

              // Summary goes on the last items sheet if it fits, otherwise on a fresh final sheet.
              itemsBox.insertAdjacentHTML('beforeend', SUMMARY);
              if (itemsBox.scrollHeight > itemsBox.clientHeight) {
                itemsBox.removeChild(itemsBox.lastElementChild);
                var fs = document.createElement('div');
                fs.className = 'sheet';
                fs.innerHTML = HEADER + '<div class="items">' + SUMMARY + '</div>' + FOOTER;
                root.appendChild(fs);
              }
            }

            function runPaginateThenPrint() {
              paginate();
              window.print();
            }

            window.onafterprint = function () { window.close(); };
            // Measurement needs the real font metrics, so paginate only after fonts settle.
            if (document.fonts && document.fonts.ready) {
              document.fonts.ready.then(runPaginateThenPrint);
            } else {
              runPaginateThenPrint();
            }
          })();
        </script>
      </body>
    </html>
  `;
};
