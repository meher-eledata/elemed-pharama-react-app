import React, { useState, useMemo, useRef, Suspense, lazy } from 'react';
import { Box, Grid, Card, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { CSVLink } from 'react-csv';
import { Dayjs } from 'dayjs';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import {
  ReportHeader,
  MetricCard,
  SectionTitle,
  ReportSwitcher,
  ReportLoading,
  ReportError,
  ReportEmpty,
  FilterSelect,
  FilterSelectOption,
  CellText,
  TableShell,
  BackLink,
} from '../../components/AdminReports/ReportShared';
import ReportBarChart from '../../components/AdminReports/ReportBarChart';
import { ADMIN_REPORTS_CONSTANTS as C } from '../../config/constants/AdminReports.constants';
import { SUPPLIER_PAYMENT_REPORT_LABELS as L } from '../../config/label/SupplierPaymentReport.labels';
import {
  useGetSupplierPaymentReportQuery,
  SupplierPaymentReportRow,
} from '../../redux/slices/reportsApi';
import { useGetSuppliersQuery } from '../../redux/slices/masterApi';
import {
  toNum,
  formatCurrency,
  formatNumber,
  formatCount,
  formatReportDate,
  defaultDateRange,
  csvString,
} from '../../utils/reportFormat';

const PaymentTypePieChart = lazy(() => import('../../components/Charts/PaymentTypePieChart'));

type Tab = 'overview' | 'detailed';

interface PaymentRow extends SupplierPaymentReportRow {
  _id: number;
  billN: number;
  cgstN: number;
  sgstN: number;
  igstN: number;
  totalTaxN: number;
  discountN: number;
  paidN: number;
  pendingN: number;
}

const SupplierPaymentReport: React.FC = () => {
  const navigate = useNavigate();
  const csvLinkRef = useRef<any>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>(defaultDateRange());
  const [supplierId, setSupplierId] = useState<string>('');

  const [start, end] = dateRange;
  const { data: suppliers } = useGetSuppliersQuery();

  const { data, isLoading, isError, refetch } = useGetSupplierPaymentReportQuery(
    {
      start_date: start ? start.format('YYYY-MM-DD') : '',
      end_date: end ? end.format('YYYY-MM-DD') : '',
      ...(supplierId ? { supplier_id: Number(supplierId) } : {}),
    },
    { skip: !start || !end, refetchOnMountOrArgChange: true }
  );

  const supplierOptions: FilterSelectOption[] = useMemo(
    () => [
      { value: '', label: L.FILTER.SUPPLIER_ALL },
      ...(suppliers || []).map((s) => ({ value: String(s.id), label: s.supplier_name })),
    ],
    [suppliers]
  );

  const rows: PaymentRow[] = useMemo(() => {
    if (!data?.rows) return [];
    return data.rows.map((r, i) => ({
      ...r,
      _id: i,
      billN: toNum(r.total_bill_amount),
      cgstN: toNum(r.cgst),
      sgstN: toNum(r.sgst),
      igstN: toNum(r.igst),
      totalTaxN: toNum(r.total_tax),
      discountN: toNum(r.discount),
      paidN: toNum(r.payment_done),
      pendingN: toNum(r.pending_due_supplier),
    }));
  }, [data]);

  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'transaction_date',
    direction: C.TABLE.DEFAULT_SORT_DIRECTION,
  });

  const sortedRows = useMemo(() => {
    const { key, direction } = sortConfig;
    return [...rows].sort((a, b) => {
      const av = (a as any)[key];
      const bv = (b as any)[key];
      if (typeof av === 'number' && typeof bv === 'number') {
        return direction === 'asc' ? av - bv : bv - av;
      }
      const cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      return direction === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortConfig]);

  const handleSortRequest = (key: string) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));

  const columns: TableColumn<PaymentRow>[] = [
    { key: 'receipt_id', header: L.TABLE.RECEIPT_NUMBER, sortable: true, render: (r) => <CellText>{r.receipt_id ?? '-'}</CellText> },
    { key: 'invoice_date', header: L.TABLE.INVOICE_DATE, sortable: true, render: (r) => <CellText>{formatReportDate(r.invoice_date)}</CellText> },
    { key: 'supplier_name', header: L.TABLE.SUPPLIER, sortable: true, render: (r) => <CellText>{r.supplier_name || '-'}</CellText> },
    { key: 'billN', header: L.TABLE.TOTAL_BILL, sortable: true, render: (r) => <CellText>{formatNumber(r.billN)}</CellText> },
    { key: 'cgstN', header: L.TABLE.CGST, sortable: true, render: (r) => <CellText>{formatCurrency(r.cgstN)}</CellText> },
    { key: 'sgstN', header: L.TABLE.SGST, sortable: true, render: (r) => <CellText>{formatCurrency(r.sgstN)}</CellText> },
    { key: 'igstN', header: L.TABLE.IGST, sortable: true, render: (r) => <CellText>{formatCurrency(r.igstN)}</CellText> },
    { key: 'totalTaxN', header: L.TABLE.TOTAL_TAX, sortable: true, render: (r) => <CellText weight={600}>{formatCurrency(r.totalTaxN)}</CellText> },
    { key: 'discountN', header: L.TABLE.DISCOUNT, sortable: true, render: (r) => <CellText>{formatNumber(r.discountN)}</CellText> },
    { key: 'paidN', header: L.TABLE.PAYMENT_DONE, sortable: true, render: (r) => <CellText weight={600} color={C.COLORS.POSITIVE}>{formatCurrency(r.paidN)}</CellText> },
    { key: 'transaction_date', header: L.TABLE.TRANSACTION_DATE, sortable: true, render: (r) => <CellText>{formatReportDate(r.transaction_date)}</CellText> },
    { key: 'payment_method', header: L.TABLE.PAYMENT_METHOD, sortable: true, render: (r) => <CellText>{r.payment_method || '-'}</CellText> },
    { key: 'pendingN', header: L.TABLE.PENDING_DUE, sortable: true, render: (r) => <CellText color={r.pendingN > 0 ? C.COLORS.NEGATIVE : C.COLORS.TEXT_PRIMARY}>{formatCurrency(r.pendingN)}</CellText> },
  ];

  // Charts
  const paidByDate = useMemo(() => {
    const c = data?.charts.paid_by_date || [];
    return { categories: c.map((d) => formatReportDate(d.date)), values: c.map((d) => toNum(d.paid)) };
  }, [data]);

  const paidByMethod = useMemo(
    () =>
      (data?.charts.paid_by_method || []).map((m, i) => ({
        id: i,
        value: toNum(m.paid),
        label: m.method || 'Unknown',
        color: C.CHART_PALETTE[i % C.CHART_PALETTE.length],
      })),
    [data]
  );
  const paidByMethodTotal = useMemo(
    () => paidByMethod.reduce((s, m) => s + m.value, 0),
    [paidByMethod]
  );

  // CSV
  const csvData = useMemo(
    () =>
      sortedRows.map((r) => ({
        [L.TABLE.RECEIPT_NUMBER]: csvString(r.receipt_id),
        [L.TABLE.INVOICE_DATE]: formatReportDate(r.invoice_date),
        [L.TABLE.SUPPLIER]: csvString(r.supplier_name),
        [`${L.TABLE.TOTAL_BILL} (₹)`]: r.billN.toFixed(2),
        [L.TABLE.CGST]: r.cgstN.toFixed(2),
        [L.TABLE.SGST]: r.sgstN.toFixed(2),
        [L.TABLE.IGST]: r.igstN.toFixed(2),
        [L.TABLE.TOTAL_TAX]: r.totalTaxN.toFixed(2),
        [`${L.TABLE.DISCOUNT} (₹)`]: r.discountN.toFixed(2),
        [`${L.TABLE.PAYMENT_DONE} (₹)`]: r.paidN.toFixed(2),
        [L.TABLE.TRANSACTION_DATE]: formatReportDate(r.transaction_date),
        [L.TABLE.PAYMENT_METHOD]: csvString(r.payment_method),
        [`${L.TABLE.PENDING_DUE} (₹)`]: r.pendingN.toFixed(2),
      })),
    [sortedRows]
  );
  const csvFilename = `${L.PAGE.CSV_FILENAME_PREFIX}_${start ? start.format('YYYY-MM-DD') : ''}_${
    end ? end.format('YYYY-MM-DD') : ''
  }.csv`;
  const handleDownloadCsv = () => csvLinkRef.current?.link?.click();

  const summary = data?.summary;

  return (
    <Box sx={{ padding: C.PAGE.PADDING, pb: C.PAGE.PADDING_BOTTOM }}>
      <BackLink onClick={() => navigate(C.ROUTES.REPORTS, { state: { activeTab: 'detailed' } })} />

      <ReportHeader
        title={L.PAGE.TITLE}
        subtitle={L.PAGE.SUBTITLE}
        downloadLabel={L.PAGE.DOWNLOAD_CSV}
        onDownloadCsv={handleDownloadCsv}
        downloadDisabled={!rows.length}
        dateRange={dateRange}
        onDateRangeChange={(r) => {
          setDateRange(r);
          setCurrentPage(1);
        }}
      >
        <FilterSelect
          label={L.FILTER.SUPPLIER_LABEL}
          value={supplierId}
          options={supplierOptions}
          onChange={(v) => {
            setSupplierId(v);
            setCurrentPage(1);
          }}
          width={220}
        />
      </ReportHeader>

      <ReportSwitcher
        active={tab}
        onChange={setTab}
        options={[
          { value: 'overview', label: L.TABS.OVERVIEW },
          { value: 'detailed', label: L.TABS.DETAILED },
        ]}
      />

      {isLoading ? (
        <ReportLoading />
      ) : isError ? (
        <ReportError message={C.STATES.ERROR} retryLabel={C.STATES.RETRY} onRetry={refetch} />
      ) : tab === 'overview' ? (
        <Box>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard title={L.KPIS.TOTAL_PAID} value={formatCurrency(toNum(summary?.total_paid))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title={L.KPIS.TOTAL_PENDING}
                value={formatCurrency(toNum(summary?.total_pending_due))}
                accentColor={toNum(summary?.total_pending_due) > 0 ? C.COLORS.NEGATIVE : undefined}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard title={L.KPIS.PAYMENTS} value={formatCount(summary?.payment_count ?? 0)} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard title={L.KPIS.SUPPLIERS} value={formatCount(summary?.supplier_count ?? 0)} />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={7}>
              <SectionTitle>{L.SECTIONS.PAID_BY_DATE}</SectionTitle>
              <ReportBarChart
                categories={paidByDate.categories}
                values={paidByDate.values}
                seriesLabel={L.CHART_SERIES.PAID}
                emptyMessage={L.EMPTY_CHART}
                currency
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <SectionTitle>{L.SECTIONS.PAID_BY_METHOD}</SectionTitle>
              {paidByMethodTotal > 0 ? (
                <Card
                  sx={{
                    p: 3,
                    borderRadius: C.CARD.BORDER_RADIUS,
                    boxShadow: C.CARD.BOX_SHADOW,
                    border: C.CARD.BORDER,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Suspense fallback={<CircularProgress size={40} />}>
                    <PaymentTypePieChart data={paidByMethod} />
                  </Suspense>
                  <Box sx={{ width: '100%' }}>
                    {paidByMethod.map((m) => (
                      <Box key={m.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 12, height: 12, borderRadius: '2px', backgroundColor: m.color }} />
                          <Typography sx={{ fontFamily: C.FONT_FAMILY, fontSize: '14px', color: C.COLORS.TEXT_SECONDARY, fontWeight: 500 }}>
                            {m.label}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontFamily: C.FONT_FAMILY, fontSize: '14px', color: C.COLORS.TEXT_PRIMARY, fontWeight: 600 }}>
                          {formatCurrency(m.value)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Card>
              ) : (
                <ReportEmpty message={L.EMPTY_CHART} />
              )}
            </Grid>
          </Grid>
        </Box>
      ) : (
        <TableShell>
          <ReusableTable
            columns={columns}
            data={sortedRows}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
            emptyMessage={L.EMPTY_TABLE}
            searchAndFilterConfig={{ filterOptions: [] }}
            currentSearchTerm=""
            onSearchChange={() => {}}
            showFilters={false}
            onShowFiltersToggle={() => {}}
            currentFilterKey=""
            onFilterSelect={() => {}}
            totalRows={sortedRows.length}
            rowsPerPage={C.DEFAULTS.ROWS_PER_PAGE}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onSortRequest={handleSortRequest}
            sortConfig={sortConfig}
          />
        </TableShell>
      )}

      <CSVLink data={csvData} filename={csvFilename} ref={csvLinkRef} style={{ display: 'none' }} />
    </Box>
  );
};

export default SupplierPaymentReport;
