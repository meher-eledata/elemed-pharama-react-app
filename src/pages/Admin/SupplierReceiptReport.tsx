import React, { useState, useMemo, useRef } from 'react';
import { Box, Grid } from '@mui/material';
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
  FilterSelect,
  FilterSelectOption,
  CellText,
  TableShell,
  BackLink,
} from '../../components/AdminReports/ReportShared';
import ReportBarChart from '../../components/AdminReports/ReportBarChart';
import { ADMIN_REPORTS_CONSTANTS as C } from '../../config/constants/AdminReports.constants';
import { SUPPLIER_RECEIPT_REPORT_LABELS as L } from '../../config/label/SupplierReceiptReport.labels';
import {
  useGetSupplierReceiptReportQuery,
  SupplierReceiptReportRow,
  SupplierReceiptReportByReceiptRow,
} from '../../redux/slices/reportsApi';
import { useGetSuppliersQuery } from '../../redux/slices/masterApi';
import { useLogDownloadMutation } from '../../redux/slices/activityApi';
import {
  toNum,
  formatCurrency,
  formatNumber,
  formatQty,
  formatCount,
  formatReportDate,
  defaultDateRange,
  csvString,
} from '../../utils/reportFormat';

type Tab = 'overview' | 'byReceipt' | 'detailed';

interface ReceiptRow extends SupplierReceiptReportRow {
  _id: number;
  mrpN: number;
  purchasePriceN: number;
  qtyN: number;
  cgstN: number;
  sgstN: number;
  igstN: number;
  totalTaxN: number;
  discountN: number;
  totalN: number;
}

interface ByReceiptRow extends SupplierReceiptReportByReceiptRow {
  _id: number;
  lineCountN: number;
  productCountN: number;
  qtyN: number;
  cgstN: number;
  sgstN: number;
  igstN: number;
  totalTaxN: number;
  discountAmountN: number;
  totalN: number;
}

const SupplierReceiptReport: React.FC = () => {
  const navigate = useNavigate();
  const csvLinkRef = useRef<any>(null);
  const [logDownload] = useLogDownloadMutation();
  const [tab, setTab] = useState<Tab>('overview');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>(defaultDateRange());
  const [supplierId, setSupplierId] = useState<string>('');

  const [start, end] = dateRange;
  const { data: suppliers } = useGetSuppliersQuery();

  const { data, isLoading, isError, refetch } = useGetSupplierReceiptReportQuery(
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

  const rows: ReceiptRow[] = useMemo(() => {
    if (!data?.rows) return [];
    return data.rows.map((r, i) => ({
      ...r,
      _id: i,
      mrpN: toNum(r.mrp),
      purchasePriceN: toNum(r.purchase_price),
      qtyN: toNum(r.received_qty),
      cgstN: toNum(r.cgst),
      sgstN: toNum(r.sgst),
      igstN: toNum(r.igst),
      totalTaxN: toNum(r.total_tax),
      discountN: toNum(r.discount),
      totalN: toNum(r.total_value),
    }));
  }, [data]);

  const byReceiptRows: ByReceiptRow[] = useMemo(() => {
    if (!data?.rows_by_receipt) return [];
    return data.rows_by_receipt.map((r, i) => ({
      ...r,
      _id: i,
      lineCountN: toNum(r.line_count),
      productCountN: toNum(r.product_count),
      qtyN: toNum(r.total_qty),
      cgstN: toNum(r.cgst),
      sgstN: toNum(r.sgst),
      igstN: toNum(r.igst),
      totalTaxN: toNum(r.total_tax),
      discountAmountN: toNum(r.discount_amount),
      totalN: toNum(r.total_value),
    }));
  }, [data]);

  // Sorting / pagination
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'receipt_date',
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
  const sortedByReceiptRows = useMemo(() => sortRows(byReceiptRows), [byReceiptRows, sortConfig]);

  const handleSortRequest = (key: string) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    setCurrentPage(1);
    setSelectedRows([]);
    setSortConfig({ key: 'receipt_date', direction: C.TABLE.DEFAULT_SORT_DIRECTION });
  };

  const columns: TableColumn<ReceiptRow>[] = [
    { key: 'receipt_number', header: L.TABLE.RECEIPT_NUMBER, sortable: true, nowrap: true, render: (r) => <CellText>{r.receipt_number}</CellText> },
    { key: 'receipt_date', header: L.TABLE.RECEIPT_DATE, sortable: true, nowrap: true, render: (r) => <CellText>{formatReportDate(r.receipt_date)}</CellText> },
    { key: 'invoice_number', header: L.TABLE.INVOICE_NUMBER, sortable: true, nowrap: true, render: (r) => <CellText>{r.invoice_number || '-'}</CellText> },
    { key: 'po_number', header: L.TABLE.PO_NUMBER, sortable: true, nowrap: true, render: (r) => <CellText>{r.po_number || '-'}</CellText> },
    { key: 'supplier_name', header: L.TABLE.SUPPLIER, sortable: true, render: (r) => <CellText>{r.supplier_name}</CellText> },
    { key: 'supplier_gst', header: L.TABLE.GSTIN, sortable: true, nowrap: true, render: (r) => <CellText>{r.supplier_gst || '-'}</CellText> },
    { key: 'product_name', header: L.TABLE.PRODUCT, sortable: true, render: (r) => <CellText>{r.product_name}</CellText> },
    { key: 'product_code', header: L.TABLE.PRODUCT_CODE, sortable: true, nowrap: true, render: (r) => <CellText>{r.product_code || '-'}</CellText> },
    { key: 'hsn_code', header: L.TABLE.HSN, sortable: true, nowrap: true, render: (r) => <CellText>{r.hsn_code || '-'}</CellText> },
    // On-screen MRP is currency like Purchase Price; the CSV export stays numeric ("MRP (₹)").
    { key: 'mrpN', header: L.TABLE.MRP, sortable: true, nowrap: true, render: (r) => <CellText>{formatCurrency(r.mrpN)}</CellText> },
    { key: 'purchasePriceN', header: L.TABLE.PURCHASE_PRICE, sortable: true, nowrap: true, render: (r) => <CellText>{formatCurrency(r.purchasePriceN)}</CellText> },
    { key: 'qtyN', header: L.TABLE.RECEIVED_QTY, sortable: true, nowrap: true, render: (r) => <CellText>{formatNumber(r.qtyN)}</CellText> },
    { key: 'cgstN', header: L.TABLE.CGST, sortable: true, nowrap: true, render: (r) => <CellText>{formatCurrency(r.cgstN)}</CellText> },
    { key: 'sgstN', header: L.TABLE.SGST, sortable: true, nowrap: true, render: (r) => <CellText>{formatCurrency(r.sgstN)}</CellText> },
    { key: 'igstN', header: L.TABLE.IGST, sortable: true, nowrap: true, render: (r) => <CellText>{formatCurrency(r.igstN)}</CellText> },
    { key: 'totalTaxN', header: L.TABLE.TOTAL_TAX, sortable: true, nowrap: true, render: (r) => <CellText weight={600}>{formatCurrency(r.totalTaxN)}</CellText> },
    { key: 'discountN', header: L.TABLE.DISCOUNT, sortable: true, nowrap: true, render: (r) => <CellText>{formatNumber(r.discountN)}</CellText> },
    { key: 'totalN', header: L.TABLE.TOTAL_VALUE, sortable: true, nowrap: true, render: (r) => <CellText weight={600}>{formatCurrency(r.totalN)}</CellText> },
  ];

  const byReceiptColumns: TableColumn<ByReceiptRow>[] = [
    { key: 'receipt_number', header: L.TABLE_BY_RECEIPT.RECEIPT_NUMBER, sortable: true, nowrap: true, render: (r) => <CellText>{r.receipt_number}</CellText> },
    { key: 'receipt_date', header: L.TABLE_BY_RECEIPT.RECEIPT_DATE, sortable: true, nowrap: true, render: (r) => <CellText>{formatReportDate(r.receipt_date)}</CellText> },
    { key: 'invoice_number', header: L.TABLE_BY_RECEIPT.INVOICE_NUMBER, sortable: true, nowrap: true, render: (r) => <CellText>{r.invoice_number || '-'}</CellText> },
    { key: 'po_number', header: L.TABLE_BY_RECEIPT.PO_NUMBER, sortable: true, nowrap: true, render: (r) => <CellText>{r.po_number || '-'}</CellText> },
    { key: 'supplier_name', header: L.TABLE_BY_RECEIPT.SUPPLIER, sortable: true, render: (r) => <CellText>{r.supplier_name || '-'}</CellText> },
    { key: 'supplier_gst', header: L.TABLE_BY_RECEIPT.GSTIN, sortable: true, nowrap: true, render: (r) => <CellText>{r.supplier_gst || '-'}</CellText> },
    { key: 'lineCountN', header: L.TABLE_BY_RECEIPT.LINES, sortable: true, nowrap: true, render: (r) => <CellText>{formatCount(r.lineCountN)}</CellText> },
    { key: 'productCountN', header: L.TABLE_BY_RECEIPT.PRODUCTS, sortable: true, nowrap: true, render: (r) => <CellText>{formatCount(r.productCountN)}</CellText> },
    { key: 'qtyN', header: L.TABLE_BY_RECEIPT.QTY, sortable: true, nowrap: true, render: (r) => <CellText>{formatNumber(r.qtyN)}</CellText> },
    { key: 'cgstN', header: L.TABLE_BY_RECEIPT.CGST, sortable: true, nowrap: true, render: (r) => <CellText>{formatCurrency(r.cgstN)}</CellText> },
    { key: 'sgstN', header: L.TABLE_BY_RECEIPT.SGST, sortable: true, nowrap: true, render: (r) => <CellText>{formatCurrency(r.sgstN)}</CellText> },
    { key: 'igstN', header: L.TABLE_BY_RECEIPT.IGST, sortable: true, nowrap: true, render: (r) => <CellText>{formatCurrency(r.igstN)}</CellText> },
    { key: 'totalTaxN', header: L.TABLE_BY_RECEIPT.TOTAL_TAX, sortable: true, nowrap: true, render: (r) => <CellText weight={600}>{formatCurrency(r.totalTaxN)}</CellText> },
    { key: 'discountAmountN', header: L.TABLE_BY_RECEIPT.DISCOUNT_AMOUNT, sortable: true, nowrap: true, render: (r) => <CellText>{formatCurrency(r.discountAmountN)}</CellText> },
    { key: 'totalN', header: L.TABLE_BY_RECEIPT.TOTAL_VALUE, sortable: true, nowrap: true, render: (r) => <CellText weight={600}>{formatCurrency(r.totalN)}</CellText> },
  ];

  // Charts
  const spendByDate = useMemo(() => {
    const c = data?.charts.spend_by_date || [];
    return { categories: c.map((d) => formatReportDate(d.date)), values: c.map((d) => toNum(d.spend)) };
  }, [data]);
  const qtyByDate = useMemo(() => {
    const c = data?.charts.qty_by_date || [];
    return { categories: c.map((d) => formatReportDate(d.date)), values: c.map((d) => toNum(d.qty)) };
  }, [data]);
  const topSuppliers = useMemo(() => {
    const c = data?.charts.top_suppliers_by_value || [];
    return { categories: c.map((s) => s.supplier_name), values: c.map((s) => toNum(s.value)) };
  }, [data]);
  const topProducts = useMemo(() => {
    const c = data?.charts.top_products_by_value || [];
    return { categories: c.map((p) => p.product_name), values: c.map((p) => toNum(p.value)) };
  }, [data]);

  // CSV — per-tab rows (byReceipt vs detailed)
  const csvData = useMemo(() => {
    if (tab === 'byReceipt') {
      return sortedByReceiptRows.map((r) => ({
        [L.TABLE_BY_RECEIPT.RECEIPT_NUMBER]: csvString(r.receipt_number),
        [L.TABLE_BY_RECEIPT.RECEIPT_DATE]: formatReportDate(r.receipt_date),
        [L.TABLE_BY_RECEIPT.INVOICE_NUMBER]: csvString(r.invoice_number),
        [L.TABLE_BY_RECEIPT.PO_NUMBER]: csvString(r.po_number),
        [L.TABLE_BY_RECEIPT.SUPPLIER]: csvString(r.supplier_name),
        [L.TABLE_BY_RECEIPT.GSTIN]: csvString(r.supplier_gst),
        [L.TABLE_BY_RECEIPT.LINES]: String(r.lineCountN),
        [L.TABLE_BY_RECEIPT.PRODUCTS]: String(r.productCountN),
        [L.TABLE_BY_RECEIPT.QTY]: r.qtyN.toFixed(2),
        [L.TABLE_BY_RECEIPT.CGST]: r.cgstN.toFixed(2),
        [L.TABLE_BY_RECEIPT.SGST]: r.sgstN.toFixed(2),
        [L.TABLE_BY_RECEIPT.IGST]: r.igstN.toFixed(2),
        [L.TABLE_BY_RECEIPT.TOTAL_TAX]: r.totalTaxN.toFixed(2),
        [L.TABLE_BY_RECEIPT.DISCOUNT_AMOUNT]: r.discountAmountN.toFixed(2),
        [`${L.TABLE_BY_RECEIPT.TOTAL_VALUE} (₹)`]: r.totalN.toFixed(2),
      }));
    }
    return sortedRows.map((r) => ({
      [L.TABLE.RECEIPT_NUMBER]: csvString(r.receipt_number),
      [L.TABLE.RECEIPT_DATE]: formatReportDate(r.receipt_date),
      [L.TABLE.INVOICE_NUMBER]: csvString(r.invoice_number),
      [L.TABLE.PO_NUMBER]: csvString(r.po_number),
      [L.TABLE.SUPPLIER]: csvString(r.supplier_name),
      [L.TABLE.GSTIN]: csvString(r.supplier_gst),
      [L.TABLE.PRODUCT]: csvString(r.product_name),
      [L.TABLE.PRODUCT_CODE]: csvString(r.product_code),
      [L.TABLE.HSN]: csvString(r.hsn_code),
      [`${L.TABLE.MRP} (₹)`]: r.mrpN.toFixed(2),
      [`${L.TABLE.PURCHASE_PRICE} (₹)`]: r.purchasePriceN.toFixed(2),
      [L.TABLE.RECEIVED_QTY]: r.qtyN.toFixed(2),
      [L.TABLE.CGST]: r.cgstN.toFixed(2),
      [L.TABLE.SGST]: r.sgstN.toFixed(2),
      [L.TABLE.IGST]: r.igstN.toFixed(2),
      [L.TABLE.TOTAL_TAX]: r.totalTaxN.toFixed(2),
      // PERCENT (pol.discount) — not rupees; the byReceipt tab carries the rupee amount.
      [L.TABLE.DISCOUNT]: r.discountN.toFixed(2),
      [`${L.TABLE.TOTAL_VALUE} (₹)`]: r.totalN.toFixed(2),
    }));
  }, [tab, sortedRows, sortedByReceiptRows]);
  const csvLevel = tab === 'byReceipt' ? 'by_receipt' : 'detailed';
  const csvFilename = `${L.PAGE.CSV_FILENAME_PREFIX}_${csvLevel}_${start ? start.format('YYYY-MM-DD') : ''}_${
    end ? end.format('YYYY-MM-DD') : ''
  }.csv`;
  const handleDownloadCsv = () => {
    csvLinkRef.current?.link?.click();
    logDownload({ category: 'report', name: 'Supplier Receipt Report', format: 'csv', count: csvData.length }).catch(() => {});
  };

  const summary = data?.summary;

  return (
    <Box sx={{ padding: C.PAGE.PADDING, pb: C.PAGE.PADDING_BOTTOM }}>
      <BackLink onClick={() => navigate(C.ROUTES.REPORTS, { state: { activeTab: 'detailed' } })} />

      <ReportHeader
        title={L.PAGE.TITLE}
        subtitle={L.PAGE.SUBTITLE}
        downloadLabel={L.PAGE.DOWNLOAD_CSV}
        onDownloadCsv={tab !== 'overview' ? handleDownloadCsv : undefined}
        downloadDisabled={!csvData.length}
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
        onChange={handleTabChange}
        options={[
          { value: 'overview', label: L.TABS.OVERVIEW },
          { value: 'byReceipt', label: L.TABS.RECEIPT },
          { value: 'detailed', label: L.TABS.ITEM },
        ]}
      />

      {isLoading ? (
        <ReportLoading />
      ) : isError ? (
        <ReportError message={C.STATES.ERROR} retryLabel={C.STATES.RETRY} onRetry={refetch} />
      ) : tab === 'overview' ? (
        <Box>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <MetricCard title={L.KPIS.TOTAL_SPEND} value={formatCurrency(toNum(summary?.total_spend))} />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <MetricCard title={L.KPIS.TOTAL_QTY} value={formatQty(toNum(summary?.total_qty_received))} />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <MetricCard title={L.KPIS.RECEIPTS} value={formatCount(summary?.receipt_count ?? 0)} />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <MetricCard title={L.KPIS.PRODUCTS} value={formatCount(summary?.product_count ?? 0)} />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <MetricCard title={L.KPIS.SUPPLIERS} value={formatCount(summary?.supplier_count ?? 0)} />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <SectionTitle>{L.SECTIONS.SPEND_BY_DATE}</SectionTitle>
              <ReportBarChart
                categories={spendByDate.categories}
                values={spendByDate.values}
                seriesLabel={L.CHART_SERIES.SPEND}
                emptyMessage={L.EMPTY_CHART}
                xAxisLabel={L.AXIS.DATE}
                yAxisLabel={L.AXIS.SPEND}
                currency
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionTitle>{L.SECTIONS.QTY_BY_DATE}</SectionTitle>
              <ReportBarChart
                categories={qtyByDate.categories}
                values={qtyByDate.values}
                seriesLabel={L.CHART_SERIES.QTY}
                color={C.COLORS.BLUE}
                emptyMessage={L.EMPTY_CHART}
                xAxisLabel={L.AXIS.DATE}
                yAxisLabel={L.AXIS.QTY}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <SectionTitle>{L.SECTIONS.TOP_SUPPLIERS}</SectionTitle>
              <ReportBarChart
                categories={topSuppliers.categories}
                values={topSuppliers.values}
                seriesLabel={L.CHART_SERIES.VALUE}
                emptyMessage={L.EMPTY_CHART}
                xAxisLabel={L.AXIS.SUPPLIER}
                yAxisLabel={L.AXIS.VALUE}
                currency
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionTitle>{L.SECTIONS.TOP_PRODUCTS}</SectionTitle>
              <ReportBarChart
                categories={topProducts.categories}
                values={topProducts.values}
                seriesLabel={L.CHART_SERIES.VALUE}
                color={C.COLORS.BLUE}
                emptyMessage={L.EMPTY_CHART}
                xAxisLabel={L.AXIS.PRODUCT}
                yAxisLabel={L.AXIS.VALUE}
                currency
              />
            </Grid>
          </Grid>
        </Box>
      ) : tab === 'byReceipt' ? (
        <TableShell>
          {/* key={tab}: remount on tab switch so the scroll container's
              horizontal offset resets (matches the page/sort/selection resets). */}
          <ReusableTable
            key={tab}
            columns={byReceiptColumns}
            data={sortedByReceiptRows}
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
            totalRows={sortedByReceiptRows.length}
            rowsPerPage={C.DEFAULTS.ROWS_PER_PAGE}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onSortRequest={handleSortRequest}
            sortConfig={sortConfig}
          />
        </TableShell>
      ) : (
        <TableShell>
          <ReusableTable
            key={tab}
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

export default SupplierReceiptReport;
