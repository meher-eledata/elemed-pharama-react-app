import React, { useMemo, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Stack,
  CircularProgress,
} from '@mui/material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { CSVLink } from 'react-csv';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import html2pdf from 'html2pdf.js';
import DateRangeFilter from '../../components/mainDashboard/DateRangeFilter/DateRangeFilter';
import { StandardButton } from '../../components/Common';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import {
  useGetSupplierDetailQuery,
  toNum,
  SupplierProductSourcingRow,
  SupplierPoHistoryRow,
} from '../../redux/slices/supplierReportsApi';
import { SUPPLIER_REPORTS_LABELS } from '../../config/label/SupplierReports.labels';
import { SUPPLIER_REPORTS_CONSTANTS as C } from '../../config/constants/SupplierReports.constants';

const L = SUPPLIER_REPORTS_LABELS.DETAIL;
const NA = L.NOT_AVAILABLE;

const formatCurrency = (amount: number): string =>
  `${C.CURRENCY.SYMBOL}${amount.toLocaleString(C.CURRENCY.LOCALE, {
    minimumFractionDigits: C.CURRENCY.FRACTION_DIGITS,
    maximumFractionDigits: C.CURRENCY.FRACTION_DIGITS,
  })}`;

const formatNumber = (amount: number): string =>
  amount.toLocaleString(C.CURRENCY.LOCALE, {
    minimumFractionDigits: C.CURRENCY.FRACTION_DIGITS,
    maximumFractionDigits: C.CURRENCY.FRACTION_DIGITS,
  });

const formatDays = (value: number | null): string =>
  value === null ? NA : `${value} ${L.DELIVERY.DAYS_SUFFIX}`;

const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  const parsed = dayjs(dateString);
  return parsed.isValid() ? parsed.format('DD/MM/YYYY') : dateString;
};

interface MetricCardProps {
  title: string;
  value: string;
  accentColor?: string;
}
const MetricCard: React.FC<MetricCardProps> = ({ title, value, accentColor }) => (
  <Card
    sx={{
      p: C.CARD.PADDING,
      borderRadius: C.CARD.BORDER_RADIUS,
      boxShadow: C.CARD.BOX_SHADOW,
      border: C.CARD.BORDER,
      backgroundColor: C.CARD.BACKGROUND,
      height: '100%',
    }}
  >
    <Typography
      sx={{
        fontSize: C.CARD.TITLE.FONT_SIZE,
        fontWeight: C.CARD.TITLE.FONT_WEIGHT,
        color: C.CARD.TITLE.COLOR,
        mb: 1,
        fontFamily: C.PAGE.FONT_FAMILY,
      }}
    >
      {title}
    </Typography>
    <Typography
      sx={{
        fontSize: C.CARD.VALUE.FONT_SIZE,
        fontWeight: C.CARD.VALUE.FONT_WEIGHT,
        color: accentColor || C.CARD.VALUE.COLOR,
        fontFamily: C.PAGE.FONT_FAMILY,
      }}
    >
      {value}
    </Typography>
  </Card>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography
    sx={{
      fontSize: C.SECTION_TITLE.FONT_SIZE,
      fontWeight: C.SECTION_TITLE.FONT_WEIGHT,
      color: C.SECTION_TITLE.COLOR,
      mb: 2,
      fontFamily: C.PAGE.FONT_FAMILY,
    }}
  >
    {children}
  </Typography>
);

const MetaItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box>
    <Typography
      sx={{
        fontFamily: C.PAGE.FONT_FAMILY,
        fontSize: '12px',
        color: C.SUPPLIER_HEADER.META_LABEL_COLOR,
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        fontFamily: C.PAGE.FONT_FAMILY,
        fontSize: C.SUPPLIER_HEADER.META_FONT_SIZE,
        color: C.SUPPLIER_HEADER.META_VALUE_COLOR,
        fontWeight: 500,
      }}
    >
      {value || NA}
    </Typography>
  </Box>
);

const TaxRow: React.FC<{ label: string; value: string; emphasize?: boolean; light?: boolean }> = ({
  label,
  value,
  emphasize,
  light,
}) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      pt: emphasize ? 0 : 0.75,
      pb: emphasize ? 1 : 0,
      borderBottom: emphasize
        ? C.TAX_SUMMARY.BORDER_BOTTOM
        : light
        ? C.TAX_SUMMARY.BORDER_BOTTOM_LIGHT
        : 'none',
    }}
  >
    <Typography
      sx={{
        fontSize: C.TAX_SUMMARY.LABEL_FONT_SIZE,
        color: C.TAX_SUMMARY.LABEL_COLOR,
        fontFamily: C.PAGE.FONT_FAMILY,
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        fontSize: C.TAX_SUMMARY.VALUE_FONT_SIZE,
        fontWeight: emphasize ? 700 : C.TAX_SUMMARY.VALUE_FONT_WEIGHT,
        color: C.TAX_SUMMARY.VALUE_COLOR,
        fontFamily: C.PAGE.FONT_FAMILY,
      }}
    >
      {value}
    </Typography>
  </Box>
);

const SupplierReportDetail: React.FC = () => {
  const navigate = useNavigate();
  const { supplierId } = useParams<{ supplierId: string }>();
  const numericSupplierId = Number(supplierId);

  const pdfContentRef = useRef<HTMLDivElement>(null);
  const productCsvRef = useRef<any>(null);
  const poCsvRef = useRef<any>(null);

  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().subtract(C.DEFAULTS.RANGE_DAYS - 1, 'day'),
    dayjs(),
  ]);
  const [startDate, endDate] = dateRange;
  const hasRange = Boolean(startDate && endDate);
  const validId = Number.isInteger(numericSupplierId) && numericSupplierId > 0;

  const { data, isLoading, isError } = useGetSupplierDetailQuery(
    {
      supplier_id: numericSupplierId,
      start_date: startDate ? startDate.format('YYYY-MM-DD') : '',
      end_date: endDate ? endDate.format('YYYY-MM-DD') : '',
      overdue_days: C.DEFAULTS.OVERDUE_DAYS,
      limit: C.DEFAULTS.PRODUCT_LIMIT,
    },
    { skip: !hasRange || !validId, refetchOnMountOrArgChange: true }
  );

  // Parse numeric-string fields up front (see toNum / api-contract caveat).
  const spend = useMemo(() => {
    if (!data) return null;
    const sp = data.spend_payments;
    return {
      totalSpend: toNum(sp.total_spend),
      paid: toNum(sp.total_paid),
      outstanding: toNum(sp.total_outstanding),
      overdue: toNum(sp.overdue_amount),
      creditBalance: toNum(sp.credit_balance),
    };
  }, [data]);

  const delivery = useMemo(() => {
    if (!data) return null;
    const d = data.delivery;
    return {
      avgLeadTime: d.avg_lead_time_days === null ? null : toNum(d.avg_lead_time_days),
      minLeadTime: d.min_lead_time_days,
      maxLeadTime: d.max_lead_time_days,
      pendingPos: d.pending_po_count,
      overduePos: d.overdue_po_count,
    };
  }, [data]);

  const tax = useMemo(() => {
    if (!data) return null;
    return {
      cgst: toNum(data.tax.cgst),
      sgst: toNum(data.tax.sgst),
      igst: toNum(data.tax.igst),
      totalTax: toNum(data.tax.total_tax),
    };
  }, [data]);

  const products = useMemo<SupplierProductSourcingRow[]>(() => data?.product_sourcing ?? [], [data]);
  const poHistory = useMemo<SupplierPoHistoryRow[]>(() => data?.po_history ?? [], [data]);

  // ------- Product table state -------
  const [productSelected, setProductSelected] = useState<number[]>([]);
  const [productPage, setProductPage] = useState(1);
  const [productSort, setProductSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'total_value',
    direction: C.TABLE.DEFAULT_SORT_DIRECTION,
  });

  const sortedProducts = useMemo(() => {
    const numericKeys = new Set(['total_qty', 'total_value']);
    const dir = productSort.direction === 'asc' ? 1 : -1;
    return [...products].sort((a, b) => {
      const key = productSort.key as keyof SupplierProductSourcingRow;
      if (numericKeys.has(productSort.key)) {
        return (toNum(a[key] as any) - toNum(b[key] as any)) * dir;
      }
      return String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * dir;
    });
  }, [products, productSort]);

  // ------- PO table state -------
  const [poSelected, setPoSelected] = useState<number[]>([]);
  const [poPage, setPoPage] = useState(1);
  const [poSort, setPoSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'ordered_date',
    direction: C.TABLE.DEFAULT_SORT_DIRECTION,
  });

  const sortedPoHistory = useMemo(() => {
    const numericKeys = new Set(['total_amount', 'amount_paid', 'amount_due', 'lead_time_days']);
    const dir = poSort.direction === 'asc' ? 1 : -1;
    return [...poHistory].sort((a, b) => {
      const key = poSort.key as keyof SupplierPoHistoryRow;
      if (poSort.key === 'ordered_date') {
        return (dayjs(a.ordered_date).valueOf() - dayjs(b.ordered_date).valueOf()) * dir;
      }
      if (numericKeys.has(poSort.key)) {
        return (toNum(a[key] as any) - toNum(b[key] as any)) * dir;
      }
      return String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * dir;
    });
  }, [poHistory, poSort]);

  const cellSx = {
    fontFamily: C.TABLE.HEADER_FONT_FAMILY,
    fontSize: C.TABLE.CELL_FONT_SIZE,
    color: C.TABLE.CELL_COLOR,
  };

  const productColumns: TableColumn<SupplierProductSourcingRow>[] = [
    {
      key: 'product_name',
      header: L.PRODUCT_TABLE.PRODUCT_NAME,
      sortable: true,
      render: (row) => <Typography sx={cellSx}>{row.product_name}</Typography>,
    },
    {
      key: 'total_qty',
      header: L.PRODUCT_TABLE.TOTAL_QTY,
      sortable: true,
      render: (row) => <Typography sx={cellSx}>{formatNumber(toNum(row.total_qty))}</Typography>,
    },
    {
      key: 'total_value',
      header: L.PRODUCT_TABLE.TOTAL_VALUE,
      sortable: true,
      render: (row) => <Typography sx={cellSx}>{formatCurrency(toNum(row.total_value))}</Typography>,
    },
  ];

  const poColumns: TableColumn<SupplierPoHistoryRow>[] = [
    {
      key: 'po_number',
      header: L.PO_TABLE.PO_NUMBER,
      sortable: true,
      render: (row) => (
        <Typography sx={{ ...cellSx, fontWeight: 600 }}>{row.po_number}</Typography>
      ),
    },
    {
      key: 'ordered_date',
      header: L.PO_TABLE.ORDERED_DATE,
      sortable: true,
      render: (row) => <Typography sx={cellSx}>{formatDate(row.ordered_date)}</Typography>,
    },
    {
      key: 'status',
      header: L.PO_TABLE.STATUS,
      sortable: true,
      render: (row) => <Typography sx={cellSx}>{row.status}</Typography>,
    },
    {
      key: 'total_amount',
      header: L.PO_TABLE.TOTAL_AMOUNT,
      sortable: true,
      render: (row) => <Typography sx={cellSx}>{formatCurrency(toNum(row.total_amount))}</Typography>,
    },
    {
      key: 'amount_paid',
      header: L.PO_TABLE.AMOUNT_PAID,
      sortable: true,
      render: (row) => (
        <Typography sx={{ ...cellSx, color: C.COLORS.POSITIVE }}>
          {formatCurrency(toNum(row.amount_paid))}
        </Typography>
      ),
    },
    {
      key: 'amount_due',
      header: L.PO_TABLE.AMOUNT_DUE,
      sortable: true,
      render: (row) => (
        <Typography sx={{ ...cellSx, color: toNum(row.amount_due) > 0 ? C.COLORS.NEGATIVE : C.TABLE.CELL_COLOR }}>
          {formatCurrency(toNum(row.amount_due))}
        </Typography>
      ),
    },
    {
      key: 'payment_status',
      header: L.PO_TABLE.PAYMENT_STATUS,
      sortable: true,
      render: (row) => <Typography sx={cellSx}>{row.payment_status}</Typography>,
    },
    {
      key: 'lead_time_days',
      header: L.PO_TABLE.LEAD_TIME_DAYS,
      sortable: true,
      render: (row) => (
        <Typography sx={cellSx}>{row.lead_time_days === null ? NA : row.lead_time_days}</Typography>
      ),
    },
  ];

  // ------- CSV -------
  const productCsv = useMemo(
    () =>
      sortedProducts.map((row) => ({
        Product: row.product_name,
        'Total Qty': toNum(row.total_qty).toFixed(2),
        'Total Value (₹)': toNum(row.total_value).toFixed(2),
      })),
    [sortedProducts]
  );

  const poCsv = useMemo(
    () =>
      sortedPoHistory.map((row) => ({
        'PO Number': row.po_number,
        'Ordered Date': formatDate(row.ordered_date),
        Status: row.status,
        'Total (₹)': toNum(row.total_amount).toFixed(2),
        'Paid (₹)': toNum(row.amount_paid).toFixed(2),
        'Due (₹)': toNum(row.amount_due).toFixed(2),
        Payment: row.payment_status,
        'Lead Time (days)': row.lead_time_days === null ? NA : row.lead_time_days,
      })),
    [sortedPoHistory]
  );

  const fileBase = useMemo(() => {
    const code = data?.supplier?.supplier_code || data?.supplier?.supplier_id || supplierId;
    return `supplier_${code}`;
  }, [data, supplierId]);

  const handleDownloadPDF = async () => {
    if (!pdfContentRef.current) return;
    try {
      await html2pdf()
        .set({
          margin: C.PDF.MARGIN,
          filename: `${fileBase}_report.pdf`,
          image: C.PDF.IMAGE,
          html2canvas: C.PDF.HTML2CANVAS,
          jsPDF: C.PDF.JSPDF,
        })
        .from(pdfContentRef.current)
        .save();
    } catch {
      /* swallow — browser-only operation */
    }
  };

  const handleBack = () => navigate(C.ROUTES.OVERVIEW);

  if (!validId) {
    return (
      <Box sx={{ p: C.PAGE.PADDING, textAlign: 'center', mt: 4 }}>
        <Typography color="error" sx={{ fontFamily: C.PAGE.FONT_FAMILY }}>
          {SUPPLIER_REPORTS_LABELS.STATES.ERROR}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <StandardButton variant="primary" onClick={handleBack}>
            {L.BACK}
          </StandardButton>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: C.PAGE.PADDING, paddingBottom: C.PAGE.PADDING_BOTTOM }}>
      {/* Top bar: back + actions */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            onClick={handleBack}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: C.COLORS.PURPLE }}
          >
            <KeyboardArrowLeftIcon sx={{ fontSize: 24 }} />
            <Typography sx={{ fontFamily: C.PAGE.FONT_FAMILY, fontWeight: 500, color: C.COLORS.PURPLE }}>
              {L.BACK}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
          <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
          <StandardButton
            variant="outline"
            size="medium"
            startIcon={<DownloadIcon />}
            onClick={() => poCsvRef.current?.link?.click()}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {L.DOWNLOAD_CSV}
          </StandardButton>
          <StandardButton
            variant="primary"
            size="medium"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleDownloadPDF}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {L.DOWNLOAD_PDF}
          </StandardButton>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <CircularProgress size={40} />
        </Box>
      ) : isError || !data || !spend || !delivery || !tax ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography color="error" sx={{ fontFamily: C.PAGE.FONT_FAMILY }}>
            {SUPPLIER_REPORTS_LABELS.STATES.ERROR}
          </Typography>
        </Box>
      ) : (
        <Box ref={pdfContentRef}>
          {/* Supplier header card */}
          <Card
            sx={{
              p: 3,
              mb: 4,
              borderRadius: C.CARD.BORDER_RADIUS,
              boxShadow: C.CARD.BOX_SHADOW,
              border: C.CARD.BORDER,
            }}
          >
            <Typography
              sx={{
                fontFamily: C.PAGE.FONT_FAMILY,
                fontSize: C.SUPPLIER_HEADER.NAME_FONT_SIZE,
                fontWeight: C.SUPPLIER_HEADER.NAME_FONT_WEIGHT,
                color: C.SUPPLIER_HEADER.NAME_COLOR,
                mb: 2,
              }}
            >
              {data.supplier.supplier_name}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4} md={2}>
                <MetaItem label={L.SUPPLIER_CODE} value={data.supplier.supplier_code} />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <MetaItem label={L.CONTACT} value={data.supplier.contact_name} />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <MetaItem label="Phone" value={data.supplier.phone_number} />
              </Grid>
              <Grid item xs={6} sm={4} md={3}>
                <MetaItem label="Email" value={data.supplier.email_id} />
              </Grid>
              <Grid item xs={6} sm={4} md={3}>
                <MetaItem label={L.GST} value={data.supplier.gst_number} />
              </Grid>
            </Grid>
          </Card>

          {/* Spend & Payments */}
          <Box sx={{ mb: 4 }}>
            <SectionTitle>{L.SECTIONS.SPEND_PAYMENTS}</SectionTitle>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2.4}>
                <MetricCard title={L.SPEND_PAYMENTS.TOTAL_SPEND} value={formatCurrency(spend.totalSpend)} />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <MetricCard
                  title={L.SPEND_PAYMENTS.PAID}
                  value={formatCurrency(spend.paid)}
                  accentColor={C.COLORS.POSITIVE}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <MetricCard
                  title={L.SPEND_PAYMENTS.OUTSTANDING}
                  value={formatCurrency(spend.outstanding)}
                  accentColor={spend.outstanding > 0 ? C.COLORS.NEGATIVE : undefined}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <MetricCard
                  title={L.SPEND_PAYMENTS.OVERDUE}
                  value={formatCurrency(spend.overdue)}
                  accentColor={spend.overdue > 0 ? C.COLORS.NEGATIVE : undefined}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <MetricCard title={L.SPEND_PAYMENTS.CREDIT_BALANCE} value={formatCurrency(spend.creditBalance)} />
              </Grid>
            </Grid>
          </Box>

          {/* Delivery */}
          <Box sx={{ mb: 4 }}>
            <SectionTitle>{L.SECTIONS.DELIVERY}</SectionTitle>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2.4}>
                <MetricCard
                  title={L.DELIVERY.AVG_LEAD_TIME}
                  value={delivery.avgLeadTime === null ? NA : `${delivery.avgLeadTime.toFixed(1)} ${L.DELIVERY.DAYS_SUFFIX}`}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <MetricCard title={L.DELIVERY.MIN_LEAD_TIME} value={formatDays(delivery.minLeadTime)} />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <MetricCard title={L.DELIVERY.MAX_LEAD_TIME} value={formatDays(delivery.maxLeadTime)} />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <MetricCard
                  title={L.DELIVERY.PENDING_POS}
                  value={String(delivery.pendingPos)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <MetricCard
                  title={L.DELIVERY.OVERDUE_POS}
                  value={String(delivery.overduePos)}
                  accentColor={delivery.overduePos > 0 ? C.COLORS.NEGATIVE : undefined}
                />
              </Grid>
            </Grid>
          </Box>

          {/* GST / Tax summary */}
          <Box sx={{ mb: 4 }}>
            <SectionTitle>{L.SECTIONS.TAX_SUMMARY}</SectionTitle>
            <Card
              sx={{
                p: 2,
                width: '100%',
                maxWidth: C.TAX_SUMMARY.MAX_WIDTH,
                minHeight: C.TAX_SUMMARY.MIN_HEIGHT,
                borderRadius: C.CARD.BORDER_RADIUS,
                boxShadow: C.CARD.BOX_SHADOW,
                border: C.CARD.BORDER,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Stack spacing={0.75}>
                <TaxRow label={L.TAX.TOTAL_TAX} value={formatCurrency(tax.totalTax)} emphasize />
                <TaxRow label={L.TAX.CGST} value={formatCurrency(tax.cgst)} light />
                <TaxRow label={L.TAX.SGST} value={formatCurrency(tax.sgst)} light />
                <TaxRow label={L.TAX.IGST} value={formatCurrency(tax.igst)} />
              </Stack>
            </Card>
          </Box>

          {/* Product sourcing table */}
          <Box sx={{ mb: 4 }}>
            <SectionTitle>{L.SECTIONS.PRODUCT_SOURCING}</SectionTitle>
            <ReusableTable
              columns={productColumns}
              data={sortedProducts}
              selectedRows={productSelected}
              setSelectedRows={setProductSelected}
              emptyMessage={L.EMPTY_PRODUCTS}
              searchAndFilterConfig={{ filterOptions: [] }}
              currentSearchTerm=""
              onSearchChange={() => {}}
              showFilters={false}
              onShowFiltersToggle={() => {}}
              currentFilterKey=""
              onFilterSelect={() => {}}
              totalRows={sortedProducts.length}
              rowsPerPage={C.DEFAULTS.ROWS_PER_PAGE}
              currentPage={productPage}
              onPageChange={setProductPage}
              onSortRequest={(key) =>
                setProductSort((prev) => ({
                  key,
                  direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
                }))
              }
              sortConfig={productSort}
            />
          </Box>

          {/* PO history table */}
          <Box>
            <SectionTitle>{L.SECTIONS.PO_HISTORY}</SectionTitle>
            <ReusableTable
              columns={poColumns}
              data={sortedPoHistory}
              selectedRows={poSelected}
              setSelectedRows={setPoSelected}
              emptyMessage={L.EMPTY_PO_HISTORY}
              searchAndFilterConfig={{ filterOptions: [] }}
              currentSearchTerm=""
              onSearchChange={() => {}}
              showFilters={false}
              onShowFiltersToggle={() => {}}
              currentFilterKey=""
              onFilterSelect={() => {}}
              totalRows={sortedPoHistory.length}
              rowsPerPage={C.DEFAULTS.ROWS_PER_PAGE}
              currentPage={poPage}
              onPageChange={setPoPage}
              onSortRequest={(key) =>
                setPoSort((prev) => ({
                  key,
                  direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
                }))
              }
              sortConfig={poSort}
            />
          </Box>
        </Box>
      )}

      {/* Hidden CSV links */}
      <CSVLink data={productCsv} filename={`${fileBase}_products.csv`} ref={productCsvRef} style={{ display: 'none' }} />
      <CSVLink data={poCsv} filename={`${fileBase}_purchase_orders.csv`} ref={poCsvRef} style={{ display: 'none' }} />
    </Box>
  );
};

export default SupplierReportDetail;
