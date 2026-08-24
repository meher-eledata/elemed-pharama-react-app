import React, { useState, useMemo, useRef } from 'react';
import { Box, Grid, TableCell, TableRow } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { CSVLink } from 'react-csv';
import { Dayjs } from 'dayjs';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import {
  ReportHeader,
  ReportLoading,
  ReportError,
  ReportEmpty,
  ReportSwitcher,
  SectionTitle,
  FilterSelect,
  FilterSelectOption,
  CellText,
  TableShell,
  MetricCardGrid,
  BackLink,
} from '../../components/AdminReports/ReportShared';
import ReportBarChart from '../../components/AdminReports/ReportBarChart';
import { ADMIN_REPORTS_CONSTANTS as C } from '../../config/constants/AdminReports.constants';
import { PRODUCT_SALES_REPORT_LABELS as L } from '../../config/label/ProductSalesReport.labels';
import {
  useGetProductSalesReportQuery,
  ProductSalesReportRow,
} from '../../redux/slices/reportsApi';
import { useGetProductsQuery } from '../../redux/slices/masterApi';
import { useLogDownloadMutation } from '../../redux/slices/activityApi';
import {
  toNum,
  formatCurrency,
  formatNumber,
  formatCount,
  formatPercent,
  formatReportDate,
  defaultDateRange,
  csvString,
  seriesByDate,
  topNSeries,
} from '../../utils/reportFormat';

const PATIENT_TYPE_DISPLAY: Record<string, string> = {
  INPATIENT: 'In Patient',
  OUTPATIENT: 'Out Patient',
  UNKNOWN: 'Unknown',
};

interface SalesRow extends ProductSalesReportRow {
  _id: number;
  qtyN: number;
  unitMrpN: number;
  spAfterDiscN: number;
  discPctN: number;
  discAmtN: number;
  cgstN: number;
  sgstN: number;
  igstN: number;
  totalTaxN: number;
  lineTotalN: number;
  patientDisplay: string;
}

const ProductSalesReport: React.FC = () => {
  const navigate = useNavigate();
  const csvLinkRef = useRef<any>(null);
  const [logDownload] = useLogDownloadMutation();
  const [tab, setTab] = useState<'overview' | 'product'>('overview');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>(defaultDateRange());
  const [productId, setProductId] = useState<string>('');
  const [patientType, setPatientType] = useState<string>(''); // '', '0', '1'

  const [start, end] = dateRange;
  const { data: products } = useGetProductsQuery();

  const { data, isLoading, isError, refetch } = useGetProductSalesReportQuery(
    {
      start_date: start ? start.format('YYYY-MM-DD') : '',
      end_date: end ? end.format('YYYY-MM-DD') : '',
      ...(productId ? { product_id: Number(productId) } : {}),
      ...(patientType !== '' ? { patient_type: Number(patientType) as 0 | 1 } : {}),
    },
    { skip: !start || !end, refetchOnMountOrArgChange: true }
  );

  const productOptions: FilterSelectOption[] = useMemo(
    () => [
      { value: '', label: L.FILTER.PRODUCT_ALL },
      ...(products || []).map((p) => ({ value: String(p.product_id), label: p.name })),
    ],
    [products]
  );
  const patientOptions: FilterSelectOption[] = [
    { value: '', label: L.FILTER.PATIENT_TYPE_ALL },
    // Backend/DB uses 0 = inpatient, 1 = outpatient.
    { value: '0', label: L.FILTER.PATIENT_TYPE_INPATIENT },
    { value: '1', label: L.FILTER.PATIENT_TYPE_OUTPATIENT },
  ];

  const rows: SalesRow[] = useMemo(() => {
    if (!data?.rows) return [];
    return data.rows.map((r, i) => ({
      ...r,
      _id: i,
      qtyN: toNum(r.quantity),
      unitMrpN: toNum(r.unit_mrp),
      // SP column shows per-unit price AFTER discount (discount_pct is 0..100).
      spAfterDiscN: toNum(r.selling_price) * (1 - toNum(r.discount_pct) / 100),
      discPctN: toNum(r.discount_pct),
      discAmtN: toNum(r.discount_amount),
      cgstN: toNum(r.cgst_amount),
      sgstN: toNum(r.sgst_amount),
      igstN: toNum(r.igst_amount),
      totalTaxN: toNum(r.total_tax),
      lineTotalN: toNum(r.line_total),
      patientDisplay: PATIENT_TYPE_DISPLAY[r.patient_type] || r.patient_type,
    }));
  }, [data]);

  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'sale_date',
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

  const columns: TableColumn<SalesRow>[] = [
    { key: 'invoice_number', header: L.TABLE.INVOICE_NUMBER, sortable: true, render: (r) => <CellText>{r.invoice_number || '-'}</CellText> },
    { key: 'sale_date', header: L.TABLE.SALE_DATE, sortable: true, render: (r) => <CellText>{formatReportDate(r.sale_date)}</CellText> },
    { key: 'product_name', header: L.TABLE.PRODUCT, sortable: true, render: (r) => <CellText>{r.product_name || '-'}</CellText> },
    { key: 'product_code', header: L.TABLE.PRODUCT_CODE, sortable: true, render: (r) => <CellText>{r.product_code || '-'}</CellText> },
    { key: 'hsn_code', header: L.TABLE.HSN, sortable: true, render: (r) => <CellText>{r.hsn_code || '-'}</CellText> },
    { key: 'batch_number', header: L.TABLE.BATCH_NUMBER, sortable: true, render: (r) => <CellText>{r.batch_number || '-'}</CellText> },
    { key: 'patientDisplay', header: L.TABLE.PATIENT_TYPE, sortable: true, render: (r) => <CellText>{r.patientDisplay}</CellText> },
    { key: 'customer_name', header: L.TABLE.CUSTOMER, sortable: true, render: (r) => <CellText>{r.customer_name || '-'}</CellText> },
    { key: 'customer_details', header: L.TABLE.CUSTOMER_DETAILS, sortable: true, render: (r) => <CellText>{r.customer_details || '-'}</CellText> },
    { key: 'qtyN', header: L.TABLE.QTY, sortable: true, render: (r) => <CellText>{formatNumber(r.qtyN)}</CellText> },
    { key: 'unitMrpN', header: L.TABLE.MRP, sortable: true, render: (r) => <CellText>{formatNumber(r.unitMrpN)}</CellText> },
    { key: 'spAfterDiscN', header: L.TABLE.SP, sortable: true, render: (r) => <CellText>{formatNumber(r.spAfterDiscN)}</CellText> },
    { key: 'discPctN', header: L.TABLE.DISCOUNT_PCT, sortable: true, render: (r) => <CellText>{formatPercent(r.discPctN)}</CellText> },
    { key: 'discAmtN', header: L.TABLE.DISCOUNT_AMT, sortable: true, render: (r) => <CellText>{formatNumber(r.discAmtN)}</CellText> },
    { key: 'cgstN', header: L.TABLE.CGST_AMT, sortable: true, render: (r) => <CellText>{formatCurrency(r.cgstN)}</CellText> },
    { key: 'sgstN', header: L.TABLE.SGST_AMT, sortable: true, render: (r) => <CellText>{formatCurrency(r.sgstN)}</CellText> },
    { key: 'igstN', header: L.TABLE.IGST_AMT, sortable: true, render: (r) => <CellText>{formatCurrency(r.igstN)}</CellText> },
    { key: 'totalTaxN', header: L.TABLE.TOTAL_TAX, sortable: true, render: (r) => <CellText weight={600}>{formatCurrency(r.totalTaxN)}</CellText> },
    { key: 'lineTotalN', header: L.TABLE.LINE_TOTAL, sortable: true, render: (r) => <CellText weight={600}>{formatCurrency(r.lineTotalN)}</CellText> },
  ];

  // Totals summed from the full filtered, in-memory row set that backs both the
  // table (ReusableTable paginates client-side) and the CSV — keeps totals
  // filter-correct and guarantees the CSV totals match the UI table exactly.
  const totals = useMemo(
    () =>
      sortedRows.reduce(
        (acc, r) => {
          acc.qtyN += r.qtyN;
          acc.unitMrpN += r.unitMrpN;
          acc.spAfterDiscN += r.spAfterDiscN;
          acc.discAmtN += r.discAmtN;
          acc.cgstN += r.cgstN;
          acc.sgstN += r.sgstN;
          acc.igstN += r.igstN;
          acc.totalTaxN += r.totalTaxN;
          acc.lineTotalN += r.lineTotalN;
          return acc;
        },
        { qtyN: 0, unitMrpN: 0, spAfterDiscN: 0, discAmtN: 0, cgstN: 0, sgstN: 0, igstN: 0, totalTaxN: 0, lineTotalN: 0 }
      ),
    [sortedRows]
  );

  const totalsCellByKey: Record<string, React.ReactNode> = {
    invoice_number: <CellText weight={700}>{L.TABLE.TOTAL}</CellText>,
    qtyN: <CellText weight={700}>{formatNumber(totals.qtyN)}</CellText>,
    unitMrpN: <CellText weight={700}>{formatNumber(totals.unitMrpN)}</CellText>,
    spAfterDiscN: <CellText weight={700}>{formatNumber(totals.spAfterDiscN)}</CellText>,
    discAmtN: <CellText weight={700}>{formatNumber(totals.discAmtN)}</CellText>,
    cgstN: <CellText weight={700}>{formatCurrency(totals.cgstN)}</CellText>,
    sgstN: <CellText weight={700}>{formatCurrency(totals.sgstN)}</CellText>,
    igstN: <CellText weight={700}>{formatCurrency(totals.igstN)}</CellText>,
    totalTaxN: <CellText weight={700}>{formatCurrency(totals.totalTaxN)}</CellText>,
    lineTotalN: <CellText weight={700}>{formatCurrency(totals.lineTotalN)}</CellText>,
  };

  const totalsFooter = (
    <TableRow sx={{ bgcolor: '#F9FAFB' }}>
      {columns
        .filter((c) => !c.hide)
        .map((c, i) => (
          <TableCell
            key={i}
            sx={{ padding: '12px 16px', whiteSpace: 'nowrap', borderTop: '2px solid #E5E7EB' }}
          >
            {totalsCellByKey[c.key as string] ?? null}
          </TableCell>
        ))}
    </TableRow>
  );

  const summary = data?.summary;
  const summaryCards = useMemo(
    () => [
      { title: L.SUMMARY.LINES, value: formatCount(summary?.line_count ?? 0) },
      { title: L.SUMMARY.TOTAL_QTY, value: formatNumber(toNum(summary?.total_quantity)) },
      { title: L.SUMMARY.PRODUCTS, value: formatCount(summary?.product_count ?? 0) },
      { title: L.SUMMARY.INVOICES, value: formatCount(summary?.invoice_count ?? 0) },
      { title: L.SUMMARY.TOTAL_CGST, value: formatCurrency(toNum(summary?.total_cgst)) },
      { title: L.SUMMARY.TOTAL_SGST, value: formatCurrency(toNum(summary?.total_sgst)) },
      { title: L.SUMMARY.TOTAL_IGST, value: formatCurrency(toNum(summary?.total_igst)) },
      { title: L.SUMMARY.TOTAL_TAX, value: formatCurrency(toNum(summary?.total_tax)) },
      { title: L.SUMMARY.TOTAL_SALES, value: formatCurrency(toNum(summary?.total_sales)), accentColor: C.COLORS.PURPLE },
    ],
    [summary]
  );

  // Overview charts — derived from the line-level rows (each carries
  // sale_date / product_name), so no extra fetch is needed.
  const salesByDate = useMemo(
    () => seriesByDate(rows, (r) => r.sale_date, (r) => r.lineTotalN),
    [rows]
  );
  const topProductsByValue = useMemo(
    () => topNSeries(rows, (r) => r.product_name || '', (r) => r.lineTotalN),
    [rows]
  );
  const topProductsByQty = useMemo(
    () => topNSeries(rows, (r) => r.product_name || '', (r) => r.qtyN),
    [rows]
  );

  const csvData = useMemo(() => {
    const dataRows = sortedRows.map((r) => ({
      [L.TABLE.INVOICE_NUMBER]: csvString(r.invoice_number),
      [L.TABLE.SALE_DATE]: formatReportDate(r.sale_date),
      [L.TABLE.PRODUCT]: csvString(r.product_name),
      [L.TABLE.PRODUCT_CODE]: csvString(r.product_code),
      [L.TABLE.HSN]: csvString(r.hsn_code),
      [L.TABLE.BATCH_NUMBER]: csvString(r.batch_number),
      [L.TABLE.PATIENT_TYPE]: r.patientDisplay,
      [L.TABLE.CUSTOMER]: csvString(r.customer_name),
      [L.TABLE.CUSTOMER_DETAILS]: csvString(r.customer_details),
      [L.TABLE.QTY]: r.qtyN.toFixed(2),
      [`${L.TABLE.MRP} (₹)`]: r.unitMrpN.toFixed(2),
      [`${L.TABLE.SP} (₹)`]: r.spAfterDiscN.toFixed(2),
      [L.TABLE.DISCOUNT_PCT]: r.discPctN.toFixed(2),
      [L.TABLE.DISCOUNT_AMT]: r.discAmtN.toFixed(2),
      [L.TABLE.CGST_AMT]: r.cgstN.toFixed(2),
      [L.TABLE.SGST_AMT]: r.sgstN.toFixed(2),
      [L.TABLE.IGST_AMT]: r.igstN.toFixed(2),
      [L.TABLE.TOTAL_TAX]: r.totalTaxN.toFixed(2),
      [`${L.TABLE.LINE_TOTAL} (₹)`]: r.lineTotalN.toFixed(2),
    }));
    if (dataRows.length > 0) {
      // Totals row mirrors the in-table totals footer (percentage column left blank).
      dataRows.push({
        [L.TABLE.INVOICE_NUMBER]: L.TABLE.TOTAL,
        [L.TABLE.SALE_DATE]: '',
        [L.TABLE.PRODUCT]: '',
        [L.TABLE.PRODUCT_CODE]: '',
        [L.TABLE.HSN]: '',
        [L.TABLE.BATCH_NUMBER]: '',
        [L.TABLE.PATIENT_TYPE]: '',
        [L.TABLE.CUSTOMER]: '',
        [L.TABLE.CUSTOMER_DETAILS]: '',
        [L.TABLE.QTY]: totals.qtyN.toFixed(2),
        [`${L.TABLE.MRP} (₹)`]: totals.unitMrpN.toFixed(2),
        [`${L.TABLE.SP} (₹)`]: totals.spAfterDiscN.toFixed(2),
        [L.TABLE.DISCOUNT_PCT]: '',
        [L.TABLE.DISCOUNT_AMT]: totals.discAmtN.toFixed(2),
        [L.TABLE.CGST_AMT]: totals.cgstN.toFixed(2),
        [L.TABLE.SGST_AMT]: totals.sgstN.toFixed(2),
        [L.TABLE.IGST_AMT]: totals.igstN.toFixed(2),
        [L.TABLE.TOTAL_TAX]: totals.totalTaxN.toFixed(2),
        [`${L.TABLE.LINE_TOTAL} (₹)`]: totals.lineTotalN.toFixed(2),
      });
    }
    return dataRows;
  }, [sortedRows, totals]);
  const csvFilename = `${L.PAGE.CSV_FILENAME_PREFIX}_${start ? start.format('YYYY-MM-DD') : ''}_${
    end ? end.format('YYYY-MM-DD') : ''
  }.csv`;
  const handleDownloadCsv = () => {
    csvLinkRef.current?.link?.click();
    logDownload({ category: 'report', name: 'Product Sales Report', format: 'csv', count: sortedRows.length }).catch(() => {});
  };

  return (
    <Box sx={{ padding: C.PAGE.PADDING, pb: C.PAGE.PADDING_BOTTOM }}>
      <BackLink onClick={() => navigate(C.ROUTES.REPORTS, { state: { activeTab: 'detailed' } })} />

      <ReportHeader
        title={L.PAGE.TITLE}
        subtitle={L.PAGE.SUBTITLE}
        downloadLabel={L.PAGE.DOWNLOAD_CSV}
        onDownloadCsv={tab !== 'overview' ? handleDownloadCsv : undefined}
        downloadDisabled={!rows.length}
        dateRange={dateRange}
        onDateRangeChange={(r) => {
          setDateRange(r);
          setCurrentPage(1);
        }}
      >
        <FilterSelect
          label={L.FILTER.PRODUCT_LABEL}
          value={productId}
          options={productOptions}
          onChange={(v) => {
            setProductId(v);
            setCurrentPage(1);
          }}
          width={220}
        />
        <FilterSelect
          label={L.FILTER.PATIENT_TYPE_LABEL}
          value={patientType}
          options={patientOptions}
          onChange={(v) => {
            setPatientType(v);
            setCurrentPage(1);
          }}
          width={180}
        />
      </ReportHeader>

      <ReportSwitcher
        active={tab}
        onChange={(newTab) => {
          setTab(newTab);
          setCurrentPage(1);
        }}
        options={[
          { value: 'overview', label: L.TABS.OVERVIEW },
          { value: 'product', label: L.TABS.PRODUCT },
        ]}
      />

      {isLoading ? (
        <ReportLoading />
      ) : isError ? (
        <ReportError message={C.STATES.ERROR} retryLabel={C.STATES.RETRY} onRetry={refetch} />
      ) : tab === 'overview' ? (
        rows.length > 0 ? (
          <Box>
            <MetricCardGrid cards={summaryCards} />

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <SectionTitle>{L.SECTIONS.SALES_BY_DATE}</SectionTitle>
                <ReportBarChart
                  categories={salesByDate.categories}
                  values={salesByDate.values}
                  seriesLabel={L.CHART_SERIES.SALES}
                  emptyMessage={L.EMPTY_CHART}
                  xAxisLabel={L.AXIS.DATE}
                  yAxisLabel={L.AXIS.SALES}
                  currency
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <SectionTitle>{L.SECTIONS.TOP_PRODUCTS_BY_VALUE}</SectionTitle>
                <ReportBarChart
                  categories={topProductsByValue.categories}
                  values={topProductsByValue.values}
                  seriesLabel={L.CHART_SERIES.VALUE}
                  color={C.COLORS.BLUE}
                  emptyMessage={L.EMPTY_CHART}
                  xAxisLabel={L.AXIS.PRODUCT}
                  yAxisLabel={L.AXIS.VALUE}
                  currency
                />
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SectionTitle>{L.SECTIONS.TOP_PRODUCTS_BY_QTY}</SectionTitle>
                <ReportBarChart
                  categories={topProductsByQty.categories}
                  values={topProductsByQty.values}
                  seriesLabel={L.CHART_SERIES.QTY}
                  color={C.COLORS.BLUE}
                  emptyMessage={L.EMPTY_CHART}
                  xAxisLabel={L.AXIS.PRODUCT}
                  yAxisLabel={L.AXIS.QTY}
                />
              </Grid>
            </Grid>
          </Box>
        ) : (
          <ReportEmpty message={L.EMPTY_TABLE} />
        )
      ) : (
        <>
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
              footerContent={sortedRows.length > 0 ? totalsFooter : undefined}
              disableFooterWrapper
            />
          </TableShell>
        </>
      )}

      <CSVLink data={csvData} filename={csvFilename} ref={csvLinkRef} style={{ display: 'none' }} />
    </Box>
  );
};

export default ProductSalesReport;
