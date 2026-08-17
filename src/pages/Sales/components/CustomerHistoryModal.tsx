import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
} from '@mui/material';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../redux/store';
import elemedLogo from '../../../assets/ElemedLogo.svg';
import CommonModal from '../../../components/CommonModal/CommonModal';
import PrintPreviewModal from '../../../components/Modal/PrintPreview/PrintPreviewModal';
import { StandardButton } from '../../../components/Common';
import {
  Invoice,
  useGetCustomerInvoicesQuery,
  useGetInvoiceDetailsMutation,
} from '../../../redux/slices/salesApi';
import { useLogDownloadMutation } from '../../../redux/slices/activityApi';
import { decorateInvoiceNumber } from '../../../utils/invoiceNumberPreview';
import { generatePrintHTML } from '../SalesReceipt.utils';
import { SALES_RECEIPT_LABELS } from '../../../config/label/SalesReceipt.labels';
import { CUSTOMER_HISTORY_LABELS } from '../../../config/label/CustomerHistory.labels';
import { CUSTOMER_HISTORY_CONSTANTS } from '../../../config/constants/CustomerHistory.constants';

interface CustomerHistoryModalProps {
  open: boolean;
  onClose: () => void;
  // Positive integer id of a real (non walk-in) customer; null/<=0 renders empty.
  customerId: number | null;
  customerName?: string;
}

interface HistoryRow {
  id: number; // database invoice id used for the detail drill-down
  invoiceNumber: string;
  invoiceDate: string;
  netAmount: number;
  returnLabel: string;
  hasReturn: boolean;
}

// Compact payment-mode derivation for the single-invoice preview (multi-payment
// breakdown is carried separately by splitPayments).
const derivePaymentMode = (paymentsArr: any[], fallback?: string): string => {
  const arr = Array.isArray(paymentsArr) ? paymentsArr : [];
  if (arr.length >= 2) return 'Multiple';
  if (arr.length === 1) {
    const raw = String(arr[0]?.payment_method || '').trim();
    return raw || fallback || 'Cash';
  }
  return fallback || 'Cash';
};

// Build the customer-scoped invoice-list rows. Rows arrive newest-first from the API.
const buildRows = (data: Invoice[] | undefined, schemeEnabled: boolean): HistoryRow[] => {
  if (!Array.isArray(data)) return [];
  return data.map((inv: any, index: number) => {
    const databaseId = Number(inv.invoice_id || inv.id || 0);
    const dateSource = inv.invoice_date || inv.created_at;
    const invoiceDate = dateSource
      ? dayjs(dateSource).format(CUSTOMER_HISTORY_CONSTANTS.DATE_FORMAT)
      : '';
    const invoiceNumber = decorateInvoiceNumber(
      inv.invoice_number ?? inv.invoice_id ?? inv.id ?? index,
      schemeEnabled,
    );
    const rawReturnStatus = String(inv.return_status || 'No Return');
    const statusLower = rawReturnStatus.toLowerCase();
    const hasReturn = statusLower !== 'no return' && statusLower !== 'none';
    const rawNet = (parseFloat(inv.total_amount) || 0) - (parseFloat(inv.total_returned_amount) || 0);
    return {
      id: databaseId,
      invoiceNumber,
      invoiceDate,
      netAmount: Math.max(0, Math.round(rawNet)),
      returnLabel: hasReturn ? rawReturnStatus : CUSTOMER_HISTORY_LABELS.NO_RETURN,
      hasReturn,
    };
  });
};

// Map a get-invoice-details response to the shape PrintPreviewModal / generatePrintHTML
// need. Mirrors SaleHistory's detail mapping (tax-inclusive SP, net-of-return qty).
const mapInvoiceDetail = (result: any, schemeEnabled: boolean) => {
  const inv = result.invoice || result.data?.invoice || {};
  const cust = result.customer || result.data?.customer;
  const doc = result.doctor || result.data?.doctor;
  const lines = result.lines || result.data?.lines || [];
  const isDeletedInvoice =
    String(inv?.record_status || '').toUpperCase() === 'DELETED' || !!inv?.deleted_at;
  const rawPayments = result.payments || result.data?.payments || [];
  const payments = isDeletedInvoice
    ? rawPayments
    : rawPayments.filter((p: any) => {
        const status = String(p?.status || '').toUpperCase();
        const paymentStatus = String(p?.payment_status || '').toUpperCase();
        return status !== 'VOID' && paymentStatus !== 'VOIDED';
      });

  let calculatedTotalValue = 0;
  let calculatedTotalTax = 0;
  let calculatedTotalDiscount = 0;

  const mappedItems = lines.map((line: any) => {
    const originalQty = Number(line.quantity) || 0;
    const returnedQty = Number(line.returned_quantity) || 0;
    const netQty = Math.max(0, originalQty - returnedQty);
    const sp = Number(line.selling_price ?? line.rate) || 0;
    const disc = Number(line.discount) || 0;
    const cgst = Number(line.cgst) || 0;
    const sgst = Number(line.sgst) || 0;
    const igst = Number(line.igst) || 0;

    calculatedTotalValue += netQty * sp;

    const gross = netQty * sp;
    const discountAmt = gross * (disc / 100);
    const finalAmount = gross - discountAmt;

    calculatedTotalDiscount += discountAmt;

    const taxPct = (cgst + sgst + igst) / 100;
    const effectiveTaxableDenominator = 1 + taxPct;
    const taxableAmt =
      effectiveTaxableDenominator > 0 ? finalAmount / effectiveTaxableDenominator : finalAmount;
    calculatedTotalTax += taxableAmt * taxPct;

    return {
      id: line.invoice_line_id,
      productName: line.name || '',
      quantity: netQty.toString(),
      unitPrice: sp.toString(),
      mrp: line.mrp?.toString() || '0',
      amount: finalAmount.toFixed(2),
      batch: line.batch_number || '',
      type: line.product_type || 'N/A',
      manufacturer: line.brand_name || 'N/A',
      cgstPercent: cgst.toString(),
      sgstPercent: sgst.toString(),
      igstPercent: igst.toString(),
      discountPercent: disc.toString(),
      hsn: line.hsn_code || (line.hsn_id ? line.hsn_id.toString() : '') || '',
      schedule: line.schedule ?? null,
      pack: line.pack_qty?.toString() || 'N/A',
      expiryDate: line.expiry_date || '',
    };
  });

  const totalReturned = parseFloat(inv.total_returned_amount || result.total_refunded || 0);
  const finalPayable = Math.max(0, (parseFloat(inv.total_amount) || 0) - totalReturned);

  const splitPayments = Array.from(
    new Map(
      payments.map((p: any) => [
        `${p.payment_method}_${p.payment_amount}_${p.transaction_number || ''}`,
        p,
      ]),
    ).values(),
  ).map((p: any) => {
    const isRefund =
      p.direction === 'OUT' ||
      (p.payment_type && p.payment_type.toUpperCase().includes('RETURN'));
    return {
      ...p,
      payment_amount: isRefund ? -Math.abs(p.payment_amount) : p.payment_amount,
      is_refund: isRefund,
    };
  });

  return {
    customerName: cust?.name || '',
    customerMobile: cust?.customer_phone || cust?.phone || cust?.mobile_number || '',
    customerCity: cust?.city || '',
    doctorName: doc?.name || '',
    doctorMobile: doc?.mobile_number || '',
    doctorEmail: doc?.email_id || '',
    paymentMode: derivePaymentMode(payments, inv.payment_mode),
    insuranceCompany: inv.insurance_company || '',
    invoiceNumber: decorateInvoiceNumber(inv.invoice_number, schemeEnabled) || '',
    invoiceDate:
      inv.invoice_date || inv.created_at
        ? dayjs(inv.invoice_date || inv.created_at).format('YYYY-MM-DD')
        : '',
    totalValue: calculatedTotalValue.toFixed(2),
    totalDiscount: (calculatedTotalDiscount + Number(inv.discount || 0)).toFixed(2),
    taxAmount: calculatedTotalTax.toFixed(2),
    totalPayableAmount: String(Math.round(finalPayable)),
    splitPayments,
    items: mappedItems,
  };
};

const CustomerHistoryModal: React.FC<CustomerHistoryModalProps> = ({
  open,
  onClose,
  customerId,
  customerName,
}) => {
  // Read defensively: the org slice is always present in the app store, but some
  // unit-test stores omit it — falling back to undefined keeps this modal renderable.
  const organization = useSelector((state: RootState) => state.org?.organization);
  const schemeEnabled = !!organization?.invoice_number_enabled;
  const orgHeader = organization
    ? {
        name: organization.name,
        legal_name: organization.legal_name,
        address: organization.address,
        dl_numbers: organization.dl_numbers,
        gstin: organization.gstin,
        phone: organization.phone,
      }
    : undefined;
  const receiptBrandIcon = organization?.logo_url || elemedLogo;

  const validId = typeof customerId === 'number' && customerId > 0;

  const { data, isLoading, isFetching, isError, refetch } = useGetCustomerInvoicesQuery(
    { customer_id: customerId as number },
    { skip: !open || !validId },
  );
  const [getInvoiceDetails] = useGetInvoiceDetailsMutation();
  const [logDownload] = useLogDownloadMutation();

  const [detail, setDetail] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pageSize, setPageSize] = useState<'A4' | 'A5'>('A4');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');

  const rows = useMemo(() => buildRows(data, schemeEnabled), [data, schemeEnabled]);

  // "Last purchase" is derived from the newest row — the list is invoice_date DESC.
  const lastPurchase = useMemo(() => {
    const first = Array.isArray(data) && data.length > 0 ? (data[0] as any) : null;
    const src = first?.invoice_date || first?.created_at;
    return src ? dayjs(src).format(CUSTOMER_HISTORY_CONSTANTS.DATE_FORMAT) : '';
  }, [data]);

  const handleRowClick = async (invoiceId: number) => {
    if (!invoiceId) return;
    try {
      const result = await getInvoiceDetails({ invoice_id: invoiceId }).unwrap();
      setDetail(mapInvoiceDetail(result, schemeEnabled));
      setDetailOpen(true);
    } catch {
      // Detail fetch failed — leave the list open; nothing to show.
    }
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setDetail(null);
  };

  const handlePrint = () => {
    if (!detail) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const html = generatePrintHTML({
      customerName: detail.customerName || customerName || '',
      customerMobile: detail.customerMobile || '',
      customerCity: detail.customerCity || '',
      doctorName: detail.doctorName || '',
      doctorMobile: detail.doctorMobile || '',
      doctorEmail: detail.doctorEmail || '',
      paymentMode: detail.paymentMode || '',
      insuranceCompany: detail.insuranceCompany || '',
      invoiceNumber: detail.invoiceNumber || '',
      invoiceDate: detail.invoiceDate || '',
      salesItems: detail.items || [],
      totalValue: detail.totalValue || '0',
      totalDiscount: detail.totalDiscount || '0',
      taxAmount: detail.taxAmount || '0',
      totalPayableAmount: detail.totalPayableAmount || '0',
      splitPayments: detail.splitPayments || [],
      labels: SALES_RECEIPT_LABELS,
      brandIcon: receiptBrandIcon,
      orgHeader,
      pageSize,
      orientation,
    });
    printWindow.document.write(html);
    printWindow.document.close();
    logDownload({
      category: 'sales',
      name: detail.invoiceNumber ? `Invoice ${detail.invoiceNumber}` : 'Customer History Invoice',
      format: 'pdf',
    }).catch(() => {});
  };

  const loading = isLoading || isFetching;

  const listContent = (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 1,
          mb: 2,
          p: '10px 14px',
          bgcolor: '#F6F8FB',
          border: '1px solid #E6ECF5',
          borderRadius: '12px',
        }}
      >
        <Typography sx={{ fontWeight: 700, color: '#1A212B', fontSize: '14px' }}>
          {CUSTOMER_HISTORY_LABELS.LAST_PURCHASE}:
        </Typography>
        <Typography sx={{ color: lastPurchase ? '#1A212B' : '#728197', fontSize: '14px' }}>
          {loading
            ? '—'
            : lastPurchase || CUSTOMER_HISTORY_LABELS.NO_LAST_PURCHASE}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Box
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 5 }}
        >
          <Typography sx={{ color: '#EF4444', fontSize: '14px' }}>
            {CUSTOMER_HISTORY_LABELS.LOAD_ERROR}
          </Typography>
          <StandardButton variant="secondary" size="medium" onClick={() => refetch()}>
            {CUSTOMER_HISTORY_LABELS.RETRY}
          </StandardButton>
        </Box>
      ) : rows.length === 0 ? (
        <Typography sx={{ textAlign: 'center', py: 6, color: '#6B7280' }}>
          {CUSTOMER_HISTORY_LABELS.EMPTY}
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ border: '1px solid #E5E7EB', boxShadow: 'none' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#F9FAFB', whiteSpace: 'nowrap' }}>
                  {CUSTOMER_HISTORY_LABELS.TABLE.INVOICE}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#F9FAFB', whiteSpace: 'nowrap' }}>
                  {CUSTOMER_HISTORY_LABELS.TABLE.INVOICE_DATE}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, bgcolor: '#F9FAFB', whiteSpace: 'nowrap' }}
                >
                  {CUSTOMER_HISTORY_LABELS.TABLE.TOTAL_AMOUNT}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#F9FAFB', whiteSpace: 'nowrap' }}>
                  {CUSTOMER_HISTORY_LABELS.TABLE.RETURN_STATUS}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow
                  key={row.id || idx}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(row.id)}
                >
                  <TableCell sx={{ fontWeight: 500, color: '#5C17E5' }}>
                    {row.invoiceNumber}
                  </TableCell>
                  <TableCell>{row.invoiceDate}</TableCell>
                  <TableCell align="right">{row.netAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    {row.hasReturn ? (
                      <Chip
                        label={row.returnLabel}
                        size="small"
                        sx={{
                          backgroundColor: '#FEF3C7',
                          color: '#D97706',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: '1.5rem',
                        }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                        {row.returnLabel}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );

  return (
    <>
      <CommonModal
        open={open}
        title={
          customerName
            ? `${CUSTOMER_HISTORY_LABELS.TITLE} — ${customerName}`
            : CUSTOMER_HISTORY_LABELS.TITLE
        }
        maxWidth={CUSTOMER_HISTORY_CONSTANTS.MODAL_MAX_WIDTH}
        content={listContent}
        onClose={onClose}
      />

      {detailOpen && detail && (
        <CommonModal
          open={detailOpen}
          title={CUSTOMER_HISTORY_LABELS.DETAIL_TITLE}
          maxWidth={CUSTOMER_HISTORY_CONSTANTS.DETAIL_MODAL_MAX_WIDTH}
          content={
            <PrintPreviewModal
              salesItems={detail.items || []}
              customerName={detail.customerName || customerName || ''}
              customerMobile={detail.customerMobile || ''}
              customerCity={detail.customerCity || ''}
              doctorName={detail.doctorName || ''}
              doctorMobile={detail.doctorMobile || ''}
              doctorEmail={detail.doctorEmail || ''}
              paymentMode={detail.paymentMode || ''}
              insuranceCompany={detail.insuranceCompany || ''}
              invoiceNumber={detail.invoiceNumber || ''}
              invoiceDate={detail.invoiceDate || ''}
              totalValue={detail.totalValue || '0'}
              totalDiscount={detail.totalDiscount || '0'}
              taxAmount={detail.taxAmount || '0'}
              totalPayableAmount={detail.totalPayableAmount || '0'}
              brandIcon={receiptBrandIcon}
              orgHeader={orgHeader}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              orientation={orientation}
              onOrientationChange={setOrientation}
              splitPayments={detail.splitPayments || []}
            />
          }
          onClose={handleCloseDetail}
          actionButtons={
            <StandardButton onClick={handlePrint} variant="primary" size="medium">
              {CUSTOMER_HISTORY_LABELS.PRINT_BUTTON}
            </StandardButton>
          }
        />
      )}
    </>
  );
};

export default CustomerHistoryModal;
