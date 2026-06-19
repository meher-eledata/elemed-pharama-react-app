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
  ReportEmpty,
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
} from '../../redux/slices/reportsApi';
import { useGetSuppliersQuery } from '../../redux/slices/masterApi';
import { useLogDownloadMutation } from '../../redux/slices/activityApi';
import {
  toNum,
  formatCurrency,
  formatNumber,
  formatCount,
  formatReportDate,
  defaultDateRange,
  csvString,
} from '../../utils/reportFormat';

type Tab = 'overview' | 'detailed';

interface ReceiptRow extends SupplierReceiptReportRow {
  _id: number;
  mrpN: number;
  spN: number;
  qtyN: number;
  cgstN: number;
  sgstN: number;
  igstN: number;
  totalTaxN: number;
  discountN: number;
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
      spN: toNum(r.sp),
      qtyN: toNum(r.received_qty),
      cgstN: toNum(r.cgst),
      sgstN: toNum(r.sgst),
      igstN: toNum(r.igst),
      totalTaxN: toNum(r.total_tax),
      discountN: toNum(r.discount),
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

  const columns: TableColumn<ReceiptRow>[] = [
    { key: 'receipt_id', header: L.TABLE.RECEIPT_NUMBER, sortable: true, render: (r) => <CellText>{r.receipt_id}</CellText> },
    { key: 'receipt_date', header: L.TABLE.RECEIPT_DATE, sortable: true, render: (r) => <CellText>{formatReportDate(r.receipt_date)}</CellText> },
    { key: 'invoice_number', header: L.TABLE.INVOICE_NUMBER, sortable: true, render: (r) => <CellText>{r.invoice_number || '-'}</CellText> },
    { key: 'supplier_name', header: L.TABLE.SUPPLIER, sortable: true, render: (r) => <CellText>{r.supplier_name}</CellText> },
    { key: 'supplier_gst', header: L.TABLE.GSTIN, sortable: true, render: (r) => <CellText>{r.supplier_gst || '-'}</CellText> },
    { key: 'product_name', header: L.TABLE.PRODUCT, sortable: true, render: (r) => <CellText>{r.product_name}</CellText> },
    { key: 'product_code', header: L.TABLE.PRODUCT_CODE, sortable: true, render: (r) => <CellText>{r.product_code || '-'}</CellText> },
    { key: 'hsn_code', header: L.TABLE.HSN, sortable: true, render: (r) => <CellText>{r.hsn_code || '-'}</CellText> },
    { key: 'mrpN', header: L.TABLE.MRP, sortable: true, render: (r) => <CellText>{formatNumber(r.mrpN)}</CellText> },
    { key: 'spN', header: L.TABLE.SP, sortable: true, render: (r) => <CellText>{formatNumber(r.spN)}</CellText> },
    { key: 'qtyN', header: L.TABLE.RECEIVED_QTY, sortable: true, render: (r) => <CellText>{formatNumber(r.qtyN)}</CellText> },
    { key: 'cgstN', header: L.TABLE.CGST, sortable: true, render: (r) => <CellText>{formatCurrency(r.cgstN)}</CellText> },
    { key: 'sgstN', header: L.TABLE.SGST, sortable: true, render: (r) => <CellText>{formatCurrency(r.sgstN)}</CellText> },
    { key: 'igstN', header: L.TABLE.IGST, sortable: true, render: (r) => <CellText>{formatCurrency(r.igstN)}</CellText> },
    { key: 'totalTaxN', header: L.TABLE.TOTAL_TAX, sortable: true, render: (r) => <CellText weight={600}>{formatCurrency(r.totalTaxN)}</CellText> },
    { key: 'discountN', header: L.TABLE.DISCOUNT, sortable: true, render: (r) => <CellText>{formatNumber(r.discountN)}</CellText> },
    { key: 'totalN', header: L.TABLE.TOTAL_VALUE, sortable: true, render: (r) => <CellText weight={600}>{formatCurrency(r.totalN)}</CellText> },
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
  const topProducts = useMemo(
    () =>
      (data?.charts.top_products_by_value || []).map((p) => ({
        name: p.product_name,
        value: toNum(p.value),
        qty: toNum(p.qty),
      })),
    [data]
  );
  const topProductsMax = useMemo(() => Math.max(...topProducts.map((p) => p.value), 0), [topProducts]);

  // CSV
  const csvData = useMemo(
    () =>
      sortedRows.map((r) => ({
        [L.TABLE.RECEIPT_NUMBER]: csvString(r.receipt_id),
        [L.TABLE.RECEIPT_DATE]: formatReportDate(r.receipt_date),
        [L.TABLE.INVOICE_NUMBER]: csvString(r.invoice_number),
        [L.TABLE.SUPPLIER]: csvString(r.supplier_name),
        [L.TABLE.GSTIN]: csvString(r.supplier_gst),
        [L.TABLE.PRODUCT]: csvString(r.product_name),
        [L.TABLE.PRODUCT_CODE]: csvString(r.product_code),
        [L.TABLE.HSN]: csvString(r.hsn_code),
        [`${L.TABLE.MRP} (₹)`]: r.mrpN.toFixed(2),
        [`${L.TABLE.SP} (₹)`]: r.spN.toFixed(2),
        [L.TABLE.RECEIVED_QTY]: r.qtyN.toFixed(2),
        [L.TABLE.CGST]: r.cgstN.toFixed(2),
        [L.TABLE.SGST]: r.sgstN.toFixed(2),
        [L.TABLE.IGST]: r.igstN.toFixed(2),
        [L.TABLE.TOTAL_TAX]: r.totalTaxN.toFixed(2),
        [`${L.TABLE.DISCOUNT} (₹)`]: r.discountN.toFixed(2),
        [`${L.TABLE.TOTAL_VALUE} (₹)`]: r.totalN.toFixed(2),
      })),
    [sortedRows]
  );
  const csvFilename = `${L.PAGE.CSV_FILENAME_PREFIX}_${start ? start.format('YYYY-MM-DD') : ''}_${
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
            <Grid item xs={12} sm={6} md={2.4}>
              <MetricCard title={L.KPIS.TOTAL_SPEND} value={formatCurrency(toNum(summary?.total_spend))} />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <MetricCard title={L.KPIS.TOTAL_QTY} value={formatNumber(toNum(summary?.total_qty_received))} />
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
              />
            </Grid>
          </Grid>

          <SectionTitle>{L.SECTIONS.TOP_PRODUCTS}</SectionTitle>
          {topProducts.length ? (
            <Box
              sx={{
                p: 2.5,
                borderRadius: C.CARD.BORDER_RADIUS,
                border: C.CARD.BORDER,
                backgroundColor: C.COLORS.WHITE,
                boxShadow: C.CARD.BOX_SHADOW,
              }}
            >
              {topProducts.map((p, i) => (
                <Box key={i} sx={{ mb: i === topProducts.length - 1 ? 0 : 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <CellText weight={500}>{p.name}</CellText>
                    <CellText weight={600}>{formatCurrency(p.value)}</CellText>
                  </Box>
                  <Box sx={{ height: 8, borderRadius: 4, backgroundColor: '#EEF2F7', overflow: 'hidden' }}>
                    <Box
                      sx={{
                        height: '100%',
                        width: `${topProductsMax > 0 ? (p.value / topProductsMax) * 100 : 0}%`,
                        backgroundColor: C.CHART_PALETTE[i % C.CHART_PALETTE.length],
                        borderRadius: 4,
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <ReportEmpty message={L.EMPTY_CHART} />
          )}
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

export default SupplierReceiptReport;
