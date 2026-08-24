import React, { useState, useMemo, useRef, Suspense, lazy } from 'react';
import { Box, Grid, Card, CircularProgress, TableRow, TableCell } from '@mui/material';
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
  PieLegend,
  FilterSelect,
  FilterSelectOption,
  CellText,
  TableShell,
  SectionTitle,
  MetricCardGrid,
  BackLink,
} from '../../components/AdminReports/ReportShared';
import ReportBarChart from '../../components/AdminReports/ReportBarChart';
import { ADMIN_REPORTS_CONSTANTS as C } from '../../config/constants/AdminReports.constants';
import { SALES_TAX_REPORT_LABELS as L } from '../../config/label/SalesTaxReport.labels';
import {
  useGetSalesTaxReportQuery,
  SalesTaxLevel,
  SalesTaxReportRow,
  SalesTaxHsnRow,
  SalesTaxInvoiceRow,
} from '../../redux/slices/reportsApi';
import { useGetProductsQuery } from '../../redux/slices/masterApi';
import { useLogDownloadMutation } from '../../redux/slices/activityApi';
import {
  toNum,
  formatCurrency,
  formatWholeCurrency,
  formatSignedCurrency,
  formatNumber,
  formatCount,
  formatPercent,
  formatReportDate,
  defaultDateRange,
  csvString,
  seriesByDate,
  topNSeries,
} from '../../utils/reportFormat';

const PaymentTypePieChart = lazy(() => import('../../components/Charts/PaymentTypePieChart'));

interface TaxRow extends SalesTaxReportRow {
  _id: number;
  qtyN: number;
  mrpN: number;
  spN: number;
  taxableN: number;
  discountN: number;
  cgstRateN: number;
  sgstRateN: number;
  igstRateN: number;
  cgstN: number;
  sgstN: number;
  igstN: number;
  totalTaxN: number;
  lineTotalN: number;
}

interface HsnRow extends SalesTaxHsnRow {
  _id: number;
  quantityN: number;
  taxableN: number;
  discountN: number;
  cgstRateN: number;
  sgstRateN: number;
  igstRateN: number;
  cgstN: number;
  sgstN: number;
  igstN: number;
  totalTaxN: number;
  lineTotalN: number;
}

interface InvoiceRow extends SalesTaxInvoiceRow {
  _id: number;
  quantityN: number;
  taxableN: number;
  discountN: number;
  cgstN: number;
  sgstN: number;
  igstN: number;
  totalTaxN: number;
  lineTotalN: number;
  invoiceTotalN: number;
  roundOffN: number;
}

const SalesTaxReport: React.FC = () => {
  const navigate = useNavigate();
  const csvLinkRef = useRef<any>(null);
  const [logDownload] = useLogDownloadMutation();
  const [tab, setTab] = useState<'overview' | SalesTaxLevel>('overview');
  // Overview shows the range aggregates only; its summary comes from a product-level fetch.
  const level: SalesTaxLevel = tab === 'overview' ? 'product' : tab;
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>(defaultDateRange());
  const [productId, setProductId] = useState<string>('');
  const [patientType, setPatientType] = useState<string>('');
  const [hsnCode, setHsnCode] = useState<string>('');

  const [start, end] = dateRange;
  const { data: products } = useGetProductsQuery();

  // Shared filters (date / product / patient) applied to both the main table and
  // the HSN-options lookup. `hsn_code` is added only to the main query.
  const sharedFilters = useMemo(
    () => ({
      start_date: start ? start.format('YYYY-MM-DD') : '',
      end_date: end ? end.format('YYYY-MM-DD') : '',
      ...(productId ? { product_id: Number(productId) } : {}),
      ...(patientType !== '' ? { patient_type: Number(patientType) as 0 | 1 } : {}),
    }),
    [start, end, productId, patientType]
  );

  const { data, isLoading, isError, refetch } = useGetSalesTaxReportQuery(
    {
      ...sharedFilters,
      level,
      ...(hsnCode ? { hsn_code: hsnCode } : {}),
    },
    { skip: !start || !end, refetchOnMountOrArgChange: true }
  );

  // Dedicated `level:"hsn"` fetch (no hsn_code) enumerates every HSN in range to
  // populate the HSN dropdown, independent of the current hsn_code selection.
  const { data: hsnListData } = useGetSalesTaxReportQuery(
    { ...sharedFilters, level: 'hsn' },
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
    { value: '1', label: L.FILTER.PATIENT_TYPE_INPATIENT },
    { value: '0', label: L.FILTER.PATIENT_TYPE_OUTPATIENT },
  ];
  const hsnOptions: FilterSelectOption[] = useMemo(() => {
    const codes =
      hsnListData && hsnListData.level === 'hsn'
        ? hsnListData.rows
            .map((r) => r.hsn_code)
            .filter((c): c is string => !!c && c.trim() !== '')
        : [];
    // Rows are grouped by (hsn_code, rates), so a code can repeat — dedupe for the dropdown.
    return [
      { value: '', label: L.FILTER.HSN_ALL },
      ...Array.from(new Set(codes)).map((c) => ({ value: c, label: c })),
    ];
  }, [hsnListData]);

  const rows: TaxRow[] = useMemo(() => {
    if (!data || data.level !== 'product') return [];
    return data.rows.map((r, i) => ({
      ...r,
      _id: i,
      qtyN: toNum(r.quantity),
      mrpN: toNum(r.mrp),
      spN: toNum(r.selling_price),
      taxableN: toNum(r.taxable_value),
      discountN: toNum(r.discount_amount),
      cgstRateN: toNum(r.cgst_rate),
      sgstRateN: toNum(r.sgst_rate),
      igstRateN: toNum(r.igst_rate),
      cgstN: toNum(r.cgst_amount),
      sgstN: toNum(r.sgst_amount),
      igstN: toNum(r.igst_amount),
      totalTaxN: toNum(r.total_tax),
      lineTotalN: toNum(r.line_total),
    }));
  }, [data]);

  const hsnRows: HsnRow[] = useMemo(() => {
    if (!data || data.level !== 'hsn') return [];
    return data.rows.map((r, i) => ({
      ...r,
      _id: i,
      quantityN: toNum(r.quantity),
      taxableN: toNum(r.taxable_value),
      discountN: toNum(r.discount_amount),
      cgstRateN: toNum(r.cgst_rate),
      sgstRateN: toNum(r.sgst_rate),
      igstRateN: toNum(r.igst_rate),
      cgstN: toNum(r.cgst_amount),
      sgstN: toNum(r.sgst_amount),
      igstN: toNum(r.igst_amount),
      totalTaxN: toNum(r.total_tax),
      lineTotalN: toNum(r.line_total),
    }));
  }, [data]);

  const invoiceRows: InvoiceRow[] = useMemo(() => {
    if (!data || data.level !== 'invoice') return [];
    return data.rows.map((r, i) => ({
      ...r,
      _id: i,
      quantityN: toNum(r.quantity),
      taxableN: toNum(r.taxable_value),
      discountN: toNum(r.discount_amount),
      cgstN: toNum(r.cgst_amount),
      sgstN: toNum(r.sgst_amount),
      igstN: toNum(r.igst_amount),
      totalTaxN: toNum(r.total_tax),
      lineTotalN: toNum(r.line_total),
      invoiceTotalN: toNum(r.invoice_total),
      roundOffN: toNum(r.round_off),
    }));
  }, [data]);

  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'sale_date',
    direction: C.TABLE.DEFAULT_SORT_DIRECTION,
  });

  const sortRows = <T,>(arr: T[]) => {
    const { key, direction } = sortConfig;
    return [...arr].sort((a, b) => {
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
  };

  const sortedRows = useMemo(() => sortRows(rows), [rows, sortConfig]);
  const sortedHsnRows = useMemo(() => sortRows(hsnRows), [hsnRows, sortConfig]);
  const sortedInvoiceRows = useMemo(() => sortRows(invoiceRows), [invoiceRows, sortConfig]);

  const handleSortRequest = (key: string) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));

  const columns: TableColumn<TaxRow>[] = [
    { key: 'invoice_number', header: L.TABLE.INVOICE_NUMBER, sortable: true, render: (r) => <CellText>{r.invoice_number || '-'}</CellText> },
    { key: 'sale_date', header: L.TABLE.SALE_DATE, sortable: true, render: (r) => <CellText>{formatReportDate(r.sale_date)}</CellText> },
    { key: 'product_name', header: L.TABLE.PRODUCT, sortable: true, render: (r) => <CellText>{r.product_name || '-'}</CellText> },
    { key: 'product_code', header: L.TABLE.CODE, sortable: true, render: (r) => <CellText>{r.product_code || '-'}</CellText> },
    { key: 'hsn_code', header: L.TABLE.HSN, sortable: true, render: (r) => <CellText>{r.hsn_code || '-'}</CellText> },
    { key: 'batch_number', header: L.TABLE.BATCH_NUMBER, sortable: true, render: (r) => <CellText>{r.batch_number || '-'}</CellText> },
    { key: 'customer_details', header: L.TABLE.CUSTOMER_DETAILS, sortable: true, render: (r) => <CellText>{r.customer_details || '-'}</CellText> },
    { key: 'qtyN', header: L.TABLE.QTY, sortable: true, render: (r) => <CellText>{formatNumber(r.qtyN)}</CellText> },
    { key: 'mrpN', header: L.TABLE.MRP, sortable: true, render: (r) => <CellText>{formatNumber(r.mrpN)}</CellText> },
    { key: 'spN', header: L.TABLE.SP, sortable: true, render: (r) => <CellText>{formatNumber(r.spN)}</CellText> },
    { key: 'taxableN', header: L.TABLE.TAXABLE_VALUE, sortable: true, render: (r) => <CellText>{formatNumber(r.taxableN)}</CellText> },
    { key: 'discountN', header: L.TABLE.DISCOUNT, sortable: true, render: (r) => <CellText>{formatNumber(r.discountN)}</CellText> },
    { key: 'cgstRateN', header: L.TABLE.CGST_RATE, sortable: true, render: (r) => <CellText>{formatPercent(r.cgstRateN)}</CellText> },
    { key: 'sgstRateN', header: L.TABLE.SGST_RATE, sortable: true, render: (r) => <CellText>{formatPercent(r.sgstRateN)}</CellText> },
    { key: 'igstRateN', header: L.TABLE.IGST_RATE, sortable: true, render: (r) => <CellText>{formatPercent(r.igstRateN)}</CellText> },
    { key: 'cgstN', header: L.TABLE.CGST_AMT, sortable: true, render: (r) => <CellText>{formatNumber(r.cgstN)}</CellText> },
    { key: 'sgstN', header: L.TABLE.SGST_AMT, sortable: true, render: (r) => <CellText>{formatNumber(r.sgstN)}</CellText> },
    { key: 'igstN', header: L.TABLE.IGST_AMT, sortable: true, render: (r) => <CellText>{formatNumber(r.igstN)}</CellText> },
    { key: 'totalTaxN', header: L.TABLE.TOTAL_TAX, sortable: true, render: (r) => <CellText weight={600}>{formatNumber(r.totalTaxN)}</CellText> },
    { key: 'lineTotalN', header: L.TABLE.LINE_TOTAL, sortable: true, render: (r) => <CellText weight={600}>{formatCurrency(r.lineTotalN)}</CellText> },
  ];

  const hsnColumns: TableColumn<HsnRow>[] = [
    { key: 'hsn_code', header: L.TABLE_HSN.HSN, sortable: true, render: (r) => <CellText>{r.hsn_code || '-'}</CellText> },
    { key: 'line_count', header: L.TABLE_HSN.LINES, sortable: true, render: (r) => <CellText>{formatCount(r.line_count)}</CellText> },
    { key: 'product_count', header: L.TABLE_HSN.PRODUCTS, sortable: true, render: (r) => <CellText>{formatCount(r.product_count)}</CellText> },
    { key: 'quantityN', header: L.TABLE_HSN.QTY, sortable: true, render: (r) => <CellText>{formatNumber(r.quantityN)}</CellText> },
    { key: 'taxableN', header: L.TABLE_HSN.TAXABLE_VALUE, sortable: true, render: (r) => <CellText>{formatNumber(r.taxableN)}</CellText> },
    { key: 'discountN', header: L.TABLE_HSN.DISCOUNT, sortable: true, render: (r) => <CellText>{formatNumber(r.discountN)}</CellText> },
    { key: 'cgstRateN', header: L.TABLE_HSN.CGST_RATE, sortable: true, render: (r) => <CellText>{formatPercent(r.cgstRateN)}</CellText> },
    { key: 'sgstRateN', header: L.TABLE_HSN.SGST_RATE, sortable: true, render: (r) => <CellText>{formatPercent(r.sgstRateN)}</CellText> },
    { key: 'igstRateN', header: L.TABLE_HSN.IGST_RATE, sortable: true, render: (r) => <CellText>{formatPercent(r.igstRateN)}</CellText> },
    { key: 'cgstN', header: L.TABLE_HSN.CGST_AMT, sortable: true, render: (r) => <CellText>{formatNumber(r.cgstN)}</CellText> },
    { key: 'sgstN', header: L.TABLE_HSN.SGST_AMT, sortable: true, render: (r) => <CellText>{formatNumber(r.sgstN)}</CellText> },
    { key: 'igstN', header: L.TABLE_HSN.IGST_AMT, sortable: true, render: (r) => <CellText>{formatNumber(r.igstN)}</CellText> },
    { key: 'totalTaxN', header: L.TABLE_HSN.TOTAL_TAX, sortable: true, render: (r) => <CellText weight={600}>{formatNumber(r.totalTaxN)}</CellText> },
    { key: 'lineTotalN', header: L.TABLE_HSN.TOTAL, sortable: true, render: (r) => <CellText weight={600}>{formatCurrency(r.lineTotalN)}</CellText> },
  ];

  const invoiceColumns: TableColumn<InvoiceRow>[] = [
    { key: 'invoice_number', header: L.TABLE_INVOICE.INVOICE_NUMBER, sortable: true, render: (r) => <CellText>{r.invoice_number || '-'}</CellText> },
    { key: 'sale_date', header: L.TABLE_INVOICE.SALE_DATE, sortable: true, render: (r) => <CellText>{formatReportDate(r.sale_date)}</CellText> },
    { key: 'customer_details', header: L.TABLE_INVOICE.CUSTOMER, sortable: true, render: (r) => <CellText>{r.customer_details || '-'}</CellText> },
    { key: 'line_count', header: L.TABLE_INVOICE.LINES, sortable: true, render: (r) => <CellText>{formatCount(r.line_count)}</CellText> },
    { key: 'quantityN', header: L.TABLE_INVOICE.QTY, sortable: true, render: (r) => <CellText>{formatNumber(r.quantityN)}</CellText> },
    { key: 'taxableN', header: L.TABLE_INVOICE.TAXABLE_VALUE, sortable: true, render: (r) => <CellText>{formatNumber(r.taxableN)}</CellText> },
    { key: 'discountN', header: L.TABLE_INVOICE.DISCOUNT, sortable: true, render: (r) => <CellText>{formatNumber(r.discountN)}</CellText> },
    { key: 'cgstN', header: L.TABLE_INVOICE.CGST_AMT, sortable: true, render: (r) => <CellText>{formatNumber(r.cgstN)}</CellText> },
    { key: 'sgstN', header: L.TABLE_INVOICE.SGST_AMT, sortable: true, render: (r) => <CellText>{formatNumber(r.sgstN)}</CellText> },
    { key: 'igstN', header: L.TABLE_INVOICE.IGST_AMT, sortable: true, render: (r) => <CellText>{formatNumber(r.igstN)}</CellText> },
    { key: 'totalTaxN', header: L.TABLE_INVOICE.TOTAL_TAX, sortable: true, render: (r) => <CellText weight={600}>{formatNumber(r.totalTaxN)}</CellText> },
    // Signed 2dp — paise matter for the round-off adjustment.
    { key: 'roundOffN', header: L.TABLE_INVOICE.ROUND_OFF, sortable: true, render: (r) => <CellText>{formatSignedCurrency(r.roundOffN)}</CellText> },
    { key: 'invoiceTotalN', header: L.TABLE_INVOICE.INVOICE_TOTAL, sortable: true, render: (r) => <CellText weight={600}>{formatWholeCurrency(r.invoiceTotalN)}</CellText> },
  ];

  const summary = data?.summary;
  const summaryCards = useMemo(
    () => [
      { title: L.SUMMARY.TOTAL_TAXABLE, value: formatCurrency(toNum(summary?.total_taxable)) },
      { title: L.SUMMARY.TOTAL_CGST, value: formatCurrency(toNum(summary?.total_cgst)) },
      { title: L.SUMMARY.TOTAL_SGST, value: formatCurrency(toNum(summary?.total_sgst)) },
      { title: L.SUMMARY.TOTAL_IGST, value: formatCurrency(toNum(summary?.total_igst)) },
      { title: L.SUMMARY.TOTAL_TAX, value: formatCurrency(toNum(summary?.total_tax)), accentColor: C.COLORS.PURPLE },
      // total_sales is WHOLE-RUPEE (ROUND-then-SUM over invoices) — no 2dp tail.
      { title: L.SUMMARY.TOTAL_SALES, value: formatWholeCurrency(toNum(summary?.total_sales)) },
      // Signed 2dp round-off: exact invoice value sum + round_off = total_sales.
      { title: L.SUMMARY.ROUND_OFF, value: formatSignedCurrency(toNum(summary?.round_off)) },
      { title: L.SUMMARY.TOTAL_MRP_VALUE, value: formatCurrency(toNum(summary?.total_mrp_value)) },
      { title: L.SUMMARY.LINES, value: formatCount(summary?.line_count ?? 0) },
      { title: L.SUMMARY.PRODUCTS, value: formatCount(summary?.product_count ?? 0) },
      { title: L.SUMMARY.INVOICES, value: formatCount(summary?.invoice_count ?? 0) },
      { title: L.SUMMARY.UNIQUE_HSN, value: formatCount(summary?.hsn_count ?? 0) },
    ],
    [summary]
  );

  // Overview charts — derived from the product-level rows (each line carries
  // sale_date / product_name), so no extra fetch is needed.
  const taxByDate = useMemo(
    () => seriesByDate(rows, (r) => r.sale_date, (r) => r.totalTaxN),
    [rows]
  );
  const topProductsByTaxable = useMemo(
    () => topNSeries(rows, (r) => r.product_name || '', (r) => r.taxableN),
    [rows]
  );
  const taxComposition = useMemo(
    () =>
      // Palette index is fixed PER TAX TYPE (pre-filter), so e.g. SGST keeps its
      // color even when a zero CGST slice is filtered out.
      [
        { id: 0, label: L.TAX_TYPES.CGST, value: toNum(summary?.total_cgst), color: C.CHART_PALETTE[0] },
        { id: 1, label: L.TAX_TYPES.SGST, value: toNum(summary?.total_sgst), color: C.CHART_PALETTE[1] },
        { id: 2, label: L.TAX_TYPES.IGST, value: toNum(summary?.total_igst), color: C.CHART_PALETTE[2] },
      ].filter((p) => p.value > 0),
    [summary]
  );
  const taxCompositionTotal = useMemo(
    () => taxComposition.reduce((s, p) => s + p.value, 0),
    [taxComposition]
  );

  // Totals footer values keyed by column key; driven by backend summary (not the
  // visible page) so they stay correct under filters and pagination.
  const productTotals: Record<string, string> = {
    qtyN: formatNumber(toNum(summary?.total_quantity)),
    taxableN: formatNumber(toNum(summary?.total_taxable)),
    discountN: formatNumber(toNum(summary?.total_discount)),
    cgstN: formatNumber(toNum(summary?.total_cgst)),
    sgstN: formatNumber(toNum(summary?.total_sgst)),
    igstN: formatNumber(toNum(summary?.total_igst)),
    totalTaxN: formatNumber(toNum(summary?.total_tax)),
    lineTotalN: formatWholeCurrency(toNum(summary?.total_sales)),
  };
  const hsnTotals: Record<string, string> = {
    line_count: formatCount(summary?.line_count ?? 0),
    product_count: formatCount(summary?.product_count ?? 0),
    quantityN: formatNumber(toNum(summary?.total_quantity)),
    taxableN: formatNumber(toNum(summary?.total_taxable)),
    discountN: formatNumber(toNum(summary?.total_discount)),
    cgstN: formatNumber(toNum(summary?.total_cgst)),
    sgstN: formatNumber(toNum(summary?.total_sgst)),
    igstN: formatNumber(toNum(summary?.total_igst)),
    totalTaxN: formatNumber(toNum(summary?.total_tax)),
    lineTotalN: formatWholeCurrency(toNum(summary?.total_sales)),
  };
  const invoiceTotals: Record<string, string> = {
    line_count: formatCount(summary?.line_count ?? 0),
    quantityN: formatNumber(toNum(summary?.total_quantity)),
    taxableN: formatNumber(toNum(summary?.total_taxable)),
    discountN: formatNumber(toNum(summary?.total_discount)),
    cgstN: formatNumber(toNum(summary?.total_cgst)),
    sgstN: formatNumber(toNum(summary?.total_sgst)),
    igstN: formatNumber(toNum(summary?.total_igst)),
    totalTaxN: formatNumber(toNum(summary?.total_tax)),
    roundOffN: formatSignedCurrency(toNum(summary?.round_off)),
    invoiceTotalN: formatWholeCurrency(toNum(summary?.total_sales)),
  };

  const renderTotalsRow = (cols: TableColumn<any>[], totals: Record<string, string>) => (
    <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
      {cols.map((c, i) => (
        <TableCell key={String(c.key)} sx={{ padding: '12px 16px' }}>
          {i === 0 ? (
            <CellText weight={700}>{L.TOTALS_ROW_LABEL}</CellText>
          ) : totals[String(c.key)] !== undefined ? (
            <CellText weight={600}>{totals[String(c.key)]}</CellText>
          ) : null}
        </TableCell>
      ))}
    </TableRow>
  );

  const csvData = useMemo(() => {
    if (level === 'invoice') {
      return sortedInvoiceRows.map((r) => ({
        [L.TABLE_INVOICE.INVOICE_NUMBER]: csvString(r.invoice_number),
        [L.TABLE_INVOICE.SALE_DATE]: formatReportDate(r.sale_date),
        [L.TABLE_INVOICE.CUSTOMER]: csvString(r.customer_details),
        [L.TABLE_INVOICE.LINES]: csvString(r.line_count),
        [L.TABLE_INVOICE.QTY]: r.quantityN.toFixed(2),
        [`${L.TABLE_INVOICE.TAXABLE_VALUE} (₹)`]: r.taxableN.toFixed(2),
        [`${L.TABLE_INVOICE.DISCOUNT} (₹)`]: r.discountN.toFixed(2),
        [`${L.TABLE_INVOICE.CGST_AMT} (₹)`]: r.cgstN.toFixed(2),
        [`${L.TABLE_INVOICE.SGST_AMT} (₹)`]: r.sgstN.toFixed(2),
        [`${L.TABLE_INVOICE.IGST_AMT} (₹)`]: r.igstN.toFixed(2),
        [`${L.TABLE_INVOICE.TOTAL_TAX} (₹)`]: r.totalTaxN.toFixed(2),
        // Signed 2dp (toFixed keeps the '-' for negatives; paise matter here).
        [`${L.TABLE_INVOICE.ROUND_OFF} (₹)`]: r.roundOffN.toFixed(2),
        // Whole-rupee stored invoice grand total — export without a fake 2dp tail.
        [`${L.TABLE_INVOICE.INVOICE_TOTAL} (₹)`]: r.invoiceTotalN.toFixed(0),
      }));
    }
    if (level === 'hsn') {
      return sortedHsnRows.map((r) => ({
        [L.TABLE_HSN.HSN]: csvString(r.hsn_code),
        [L.TABLE_HSN.LINES]: csvString(r.line_count),
        [L.TABLE_HSN.PRODUCTS]: csvString(r.product_count),
        [L.TABLE_HSN.QTY]: r.quantityN.toFixed(2),
        [`${L.TABLE_HSN.TAXABLE_VALUE} (₹)`]: r.taxableN.toFixed(2),
        [`${L.TABLE_HSN.DISCOUNT} (₹)`]: r.discountN.toFixed(2),
        [L.TABLE_HSN.CGST_RATE]: r.cgstRateN.toFixed(2),
        [L.TABLE_HSN.SGST_RATE]: r.sgstRateN.toFixed(2),
        [L.TABLE_HSN.IGST_RATE]: r.igstRateN.toFixed(2),
        ['CGST (₹)']: r.cgstN.toFixed(2),
        ['SGST (₹)']: r.sgstN.toFixed(2),
        ['IGST (₹)']: r.igstN.toFixed(2),
        [`${L.TABLE_HSN.TOTAL_TAX} (₹)`]: r.totalTaxN.toFixed(2),
        [`${L.TABLE_HSN.TOTAL} (₹)`]: r.lineTotalN.toFixed(2),
      }));
    }
    return sortedRows.map((r) => ({
      [L.TABLE.INVOICE_NUMBER]: csvString(r.invoice_number),
      [L.TABLE.SALE_DATE]: formatReportDate(r.sale_date),
      [L.TABLE.PRODUCT]: csvString(r.product_name),
      [L.TABLE.CODE]: csvString(r.product_code),
      [L.TABLE.HSN]: csvString(r.hsn_code),
      [L.TABLE.BATCH_NUMBER]: csvString(r.batch_number),
      [L.TABLE.CUSTOMER_DETAILS]: csvString(r.customer_details),
      [L.TABLE.QTY]: r.qtyN.toFixed(2),
      [`${L.TABLE.MRP} (₹)`]: r.mrpN.toFixed(2),
      [`${L.TABLE.SP} (₹)`]: r.spN.toFixed(2),
      [`${L.TABLE.TAXABLE_VALUE} (₹)`]: r.taxableN.toFixed(2),
      [`${L.TABLE.DISCOUNT} (₹)`]: r.discountN.toFixed(2),
      [L.TABLE.CGST_RATE]: r.cgstRateN.toFixed(2),
      [L.TABLE.SGST_RATE]: r.sgstRateN.toFixed(2),
      [L.TABLE.IGST_RATE]: r.igstRateN.toFixed(2),
      ['CGST (₹)']: r.cgstN.toFixed(2),
      ['SGST (₹)']: r.sgstN.toFixed(2),
      ['IGST (₹)']: r.igstN.toFixed(2),
      [`${L.TABLE.TOTAL_TAX} (₹)`]: r.totalTaxN.toFixed(2),
      [`${L.TABLE.LINE_TOTAL} (₹)`]: r.lineTotalN.toFixed(2),
    }));
  }, [level, sortedRows, sortedHsnRows, sortedInvoiceRows]);

  const csvFilename = `${L.PAGE.CSV_FILENAME_PREFIX}_${level}_${start ? start.format('YYYY-MM-DD') : ''}_${
    end ? end.format('YYYY-MM-DD') : ''
  }.csv`;
  const handleDownloadCsv = () => {
    csvLinkRef.current?.link?.click();
    logDownload({ category: 'report', name: 'Sales Tax Report', format: 'csv', count: csvData.length }).catch(() => {});
  };

  const handleTabChange = (newTab: 'overview' | SalesTaxLevel) => {
    setTab(newTab);
    setCurrentPage(1);
    setSortConfig({
      key: newTab === 'hsn' ? 'lineTotalN' : 'sale_date',
      direction: C.TABLE.DEFAULT_SORT_DIRECTION,
    });
  };

  const hasRows =
    level === 'product' ? rows.length > 0 : level === 'hsn' ? hsnRows.length > 0 : invoiceRows.length > 0;
  const totalRows =
    level === 'product' ? sortedRows.length : level === 'hsn' ? sortedHsnRows.length : sortedInvoiceRows.length;

  return (
    <Box sx={{ padding: C.PAGE.PADDING, pb: C.PAGE.PADDING_BOTTOM }}>
      <BackLink onClick={() => navigate(C.ROUTES.REPORTS, { state: { activeTab: 'detailed' } })} />

      <ReportHeader
        title={L.PAGE.TITLE}
        subtitle={L.PAGE.SUBTITLE}
        downloadLabel={L.PAGE.DOWNLOAD_CSV}
        onDownloadCsv={tab !== 'overview' ? handleDownloadCsv : undefined}
        downloadDisabled={!hasRows}
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
        <FilterSelect
          label={L.FILTER.HSN_LABEL}
          value={hsnCode}
          options={hsnOptions}
          onChange={(v) => {
            setHsnCode(v);
            setCurrentPage(1);
          }}
          width={180}
        />
      </ReportHeader>

      <ReportSwitcher
        active={tab}
        onChange={handleTabChange}
        options={[
          { value: 'overview', label: L.TABS.OVERVIEW },
          { value: 'product', label: L.TABS.PRODUCT },
          { value: 'hsn', label: L.TABS.HSN },
          { value: 'invoice', label: L.TABS.INVOICE },
        ]}
      />

      {isLoading ? (
        <ReportLoading />
      ) : isError ? (
        <ReportError message={C.STATES.ERROR} retryLabel={C.STATES.RETRY} onRetry={refetch} />
      ) : tab === 'overview' ? (
        hasRows ? (
          <Box>
            <MetricCardGrid cards={summaryCards} />

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={7}>
                <SectionTitle>{L.SECTIONS.TAX_BY_DATE}</SectionTitle>
                <ReportBarChart
                  categories={taxByDate.categories}
                  values={taxByDate.values}
                  seriesLabel={L.CHART_SERIES.TAX}
                  emptyMessage={L.EMPTY_CHART}
                  xAxisLabel={L.AXIS.DATE}
                  yAxisLabel={L.AXIS.TAX}
                  currency
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <SectionTitle>{L.SECTIONS.TAX_COMPOSITION}</SectionTitle>
                {taxCompositionTotal > 0 ? (
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
                      <PaymentTypePieChart data={taxComposition} />
                    </Suspense>
                    <PieLegend
                      items={taxComposition.map((m) => ({ ...m, value: formatCurrency(m.value) }))}
                    />
                  </Card>
                ) : (
                  <ReportEmpty message={L.EMPTY_CHART} />
                )}
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SectionTitle>{L.SECTIONS.TOP_PRODUCTS_BY_TAXABLE}</SectionTitle>
                <ReportBarChart
                  categories={topProductsByTaxable.categories}
                  values={topProductsByTaxable.values}
                  seriesLabel={L.CHART_SERIES.TAXABLE}
                  color={C.COLORS.BLUE}
                  emptyMessage={L.EMPTY_CHART}
                  xAxisLabel={L.AXIS.PRODUCT}
                  yAxisLabel={L.AXIS.TAXABLE}
                  currency
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
            {level === 'product' ? (
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
                totalRows={totalRows}
                rowsPerPage={C.DEFAULTS.ROWS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onSortRequest={handleSortRequest}
                sortConfig={sortConfig}
                disableFooterWrapper
                footerContent={hasRows ? renderTotalsRow(columns, productTotals) : undefined}
              />
            ) : level === 'hsn' ? (
              <ReusableTable
                columns={hsnColumns}
                data={sortedHsnRows}
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
                totalRows={totalRows}
                rowsPerPage={C.DEFAULTS.ROWS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onSortRequest={handleSortRequest}
                sortConfig={sortConfig}
                disableFooterWrapper
                footerContent={hasRows ? renderTotalsRow(hsnColumns, hsnTotals) : undefined}
              />
            ) : (
              <ReusableTable
                columns={invoiceColumns}
                data={sortedInvoiceRows}
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
                totalRows={totalRows}
                rowsPerPage={C.DEFAULTS.ROWS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onSortRequest={handleSortRequest}
                sortConfig={sortConfig}
                disableFooterWrapper
                footerContent={hasRows ? renderTotalsRow(invoiceColumns, invoiceTotals) : undefined}
              />
            )}
          </TableShell>
        </>
      )}

      <CSVLink data={csvData} filename={csvFilename} ref={csvLinkRef} style={{ display: 'none' }} />
    </Box>
  );
};

export default SalesTaxReport;
